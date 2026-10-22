(function () {
  "use strict";

  const MAX_ERRORS = 20;
  const DB_NAME = "food-broker-save-diagnostics";
  const STORE_NAME = "save-errors";
  const HISTORY_KEY = "recent";
  const state = { pending: 0, syncing: 0, confirmed: false, hasUser: false, ready: false, localFailure: false, touched: false };
  let errors = [];
  let database = null;
  let persistence = Promise.resolve();
  let ui = null;
  let sequence = 0;
  let historyRevision = 0;
  let historyDurable = false;
  const recordedErrors = new WeakSet();
  const failedSections = new Set();

  // Only these small diagnostic fields are retained. Product records and error
  // objects never enter the history, and the history is never sent to a server.
  function cleanText(value, limit) {
    if (typeof value !== "string" && typeof value !== "number") return "";
    return String(value)
      .replace(/https?:\/\/[^\s<>"']+/gi, function (url) {
        try {
          const parsed = new URL(url);
          return parsed.origin + parsed.pathname + (parsed.search || parsed.hash ? "?[redacted]" : "");
        } catch (_) { return "[URL redacted]"; }
      })
      .replace(/\bBearer\s+[^\s,;"']+/gi, "Bearer [redacted]")
      .replace(/\b(?:eyJ[A-Za-z0-9_-]*\.)[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)?\b/g, "[token redacted]")
      .replace(/\b(?:sb_(?:secret|publishable)_[A-Za-z0-9_-]+|(?:sk|pk)_(?:live|test)_[A-Za-z0-9_-]+)\b/g, "[key redacted]")
      .replace(/\b(access[_ -]?token|refresh[_ -]?token|api[_ -]?key|authorization|password|secret)\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^\s,;}]+)/gi, "$1=[redacted]")
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email redacted]")
      .replace(/\bKey\s*\([^)]*\)\s*=\s*\([^)]*\)/gi, "Key [values redacted]")
      .replace(/\b(?:Failing row contains|row contains)\s*\([^)]*\)/gi, "Row [values redacted]")
      .replace(/\{[^{}]*\}/g, "[object details omitted]")
      .replace(/[\u0000-\u001f\u007f]/g, " ")
      .slice(0, limit);
  }

  function diagnostic(error, options) {
    const source = error && (typeof error === "object" || typeof error === "function") ? error : {};
    const field = function (key) { try { return source[key]; } catch (_) { return ""; } };
    const code = cleanText(field("code") || "", 60);
    const message = /^(22|23)\w{3}$/.test(code)
      ? "The database rejected a value or relationship in this save."
      : field("message") || (typeof error === "string" ? error : "The save did not finish.");
    return {
      id: Date.now().toString(36) + "-" + (++sequence).toString(36) + "-" + Math.random().toString(36).slice(2, 9),
      timestamp: new Date().toISOString(),
      operation: cleanText(options.operation || "Save", 100),
      name: cleanText(field("name") || "Error", 60),
      code: code,
      status: cleanText(field("status") || field("statusCode") || "", 30),
      message: cleanText(message, 400)
    };
  }

  function restoredDiagnostic(entry) {
    if (!entry || typeof entry !== "object" || !/^\d{4}-\d{2}-\d{2}T/.test(entry.timestamp || "")) return null;
    return {
      id: cleanText(entry.id, 100),
      timestamp: cleanText(entry.timestamp, 35),
      operation: cleanText(entry.operation, 100),
      name: cleanText(entry.name, 60),
      code: cleanText(entry.code, 60),
      status: cleanText(entry.status, 30),
      message: cleanText(entry.message, 400)
    };
  }

  function openDatabase() {
    return new Promise(function (resolve) {
      let settled = false;
      const finish = function (result) {
        if (settled) { if (result) result.close(); return; }
        settled = true;
        window.clearTimeout(timer);
        resolve(result);
      };
      const timer = window.setTimeout(function () { finish(null); }, 1500);
      try {
        if (!window.indexedDB) { finish(null); return; }
        const request = window.indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = function () {
          if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
        };
        request.onsuccess = function () {
          request.result.onversionchange = function () { request.result.close(); database = null; };
          finish(request.result);
        };
        request.onerror = request.onblocked = function () { finish(null); };
      } catch (_) { finish(null); }
    });
  }

  function readHistory(db) {
    return new Promise(function (resolve) {
      try {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const request = transaction.objectStore(STORE_NAME).get(HISTORY_KEY);
        request.onsuccess = function () { resolve({ entries: Array.isArray(request.result) ? request.result : [], success: true }); };
        request.onerror = transaction.onabort = function () { resolve({ entries: [], success: false }); };
      } catch (_) { resolve({ entries: [], success: false }); }
    });
  }

  const initialized = openDatabase().then(async function (db) {
    database = db;
    if (db) {
      const restored = await readHistory(db);
      const saved = restored.entries.map(restoredDiagnostic).filter(Boolean);
      const ids = new Set(errors.map(function (entry) { return entry.id; }));
      errors = saved.filter(function (entry) { return !ids.has(entry.id); }).concat(errors)
        .sort(function (a, b) { return a.timestamp.localeCompare(b.timestamp); }).slice(-MAX_ERRORS);
      historyDurable = restored.success && historyRevision === 0;
    }
    render();
  }).catch(function () { database = null; });

  function storeHistory() {
    persistence = persistence.then(function () { return initialized; }).then(function () {
      if (!database) return;
      return new Promise(function (resolve) {
        const revision = historyRevision;
        try {
          const transaction = database.transaction(STORE_NAME, "readwrite");
          transaction.objectStore(STORE_NAME).put(errors.slice(-MAX_ERRORS), HISTORY_KEY);
          transaction.oncomplete = function () { historyDurable = revision === historyRevision; render(); resolve(); };
          transaction.onerror = transaction.onabort = function () { historyDurable = false; render(); resolve(); };
        } catch (_) { historyDurable = false; render(); resolve(); }
      });
    }).catch(function () {});
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function createUi() {
    if (ui || !document.body) return;
    const bar = element("section", "save-status-bar");
    bar.id = "foodBrokerSaveStatus";
    bar.setAttribute("aria-label", "Save status");
    bar.hidden = true;
    const message = element("p", "save-status-message");
    message.setAttribute("role", "status");
    message.setAttribute("aria-live", "polite");
    const details = element("button", "save-status-details", "Save error details");
    details.type = "button";
    details.hidden = true;
    details.addEventListener("click", function () {
      renderErrors();
      if (typeof ui.dialog.showModal === "function") ui.dialog.showModal();
      else ui.dialog.setAttribute("open", "");
      ui.heading.focus({ preventScroll: true });
      ui.dialog.scrollTop = 0;
    });
    bar.append(message, details);

    const dialog = element("dialog", "save-errors-dialog");
    dialog.setAttribute("aria-labelledby", "saveErrorsTitle");
    const heading = element("h2", "", "Recent save errors");
    heading.id = "saveErrorsTitle";
    heading.tabIndex = -1;
    const introduction = element("p", "save-errors-intro");
    const list = element("ol", "save-errors-list");
    const close = element("button", "save-errors-close", "Close");
    close.type = "button";
    close.addEventListener("click", function () {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    });
    const header = element("div", "save-errors-heading");
    header.append(heading, close);
    dialog.append(header, introduction, list);
    document.body.append(bar, dialog);
    ui = { bar: bar, message: message, details: details, dialog: dialog, list: list, introduction: introduction, heading: heading };
    render();
  }

  function renderErrors() {
    if (!ui) return;
    ui.list.replaceChildren();
    errors.slice().reverse().forEach(function (entry) {
      const item = element("li", "save-error-entry");
      const time = element("time", "save-error-time");
      time.dateTime = entry.timestamp;
      const date = new Date(entry.timestamp);
      time.textContent = Number.isNaN(date.getTime()) ? entry.timestamp : date.toLocaleString();
      item.append(time, element("strong", "save-error-operation", entry.operation || "Save"));
      const fields = [entry.name, entry.code && "Code: " + entry.code, entry.status && "Status: " + entry.status].filter(Boolean);
      if (fields.length) item.append(element("p", "save-error-codes", fields.join(" · ")));
      item.append(element("p", "save-error-message", entry.message || "The save did not finish."));
      ui.list.append(item);
    });
  }

  function render() {
    if (!ui) return;
    ui.introduction.textContent = historyDurable
      ? "These details are saved on this device. The most recent 20 errors are kept, even after a later save succeeds."
      : "These details stay on this device. Error history is currently available only until this page closes because browser storage is unavailable or has not finished saving it.";
    ui.bar.hidden = !(state.touched || state.pending || state.syncing || errors.length);
    ui.details.hidden = errors.length === 0;
    let label;
    let visualState;
    if (!state.touched && !state.pending && !state.syncing && errors.length) {
      label = "Previous save errors are available.";
      visualState = "waiting";
    } else if (state.localFailure) {
      label = "Could not save. Your changes are still open.";
      visualState = "error";
    } else if (state.syncing) {
      label = "Saving to cloud…";
      visualState = "waiting";
    } else if (state.pending) {
      label = "Saved on this device · Waiting for cloud sync";
      visualState = "waiting";
    } else if (state.confirmed) {
      label = "Saved to cloud";
      visualState = "saved";
    } else {
      label = state.hasUser ? "Saved on this device · Waiting for cloud sync" : "Saved on this device · Sign in to sync";
      visualState = "waiting";
    }
    if (ui.message.textContent !== label) ui.message.textContent = label;
    ui.bar.dataset.state = visualState;
    if (ui.dialog.open) renderErrors();
  }

  window.foodBrokerSaveStatus = {
    update: function (next) {
      next = next || {};
      ["pending", "syncing"].forEach(function (key) {
        if (typeof next[key] === "number" && Number.isFinite(next[key])) state[key] = Math.max(0, next[key]);
      });
      ["hasUser", "ready"].forEach(function (key) { if (typeof next[key] === "boolean") state[key] = next[key]; });
      if (typeof next.confirmed === "boolean") state.confirmed = next.confirmed;
      if (state.pending || state.syncing) state.confirmed = false;
      if (state.pending || state.syncing || next.confirmed) state.touched = true;
      render();
    },
    localSaved: function (section) {
      failedSections.delete(typeof section === "string" && section ? section : "save");
      state.localFailure = failedSections.size > 0;
      state.confirmed = false;
      state.touched = true;
      render();
    },
    recoverSections: function (sections) {
      if (Array.isArray(sections)) sections.forEach(function (section) { failedSections.delete(section); });
      state.localFailure = failedSections.size > 0;
      render();
    },
    recordError: function (error, options) {
      options = options || {};
      const isObject = error && (typeof error === "object" || typeof error === "function");
      if (!isObject || !recordedErrors.has(error)) {
        errors.push(diagnostic(error, options));
        errors = errors.slice(-MAX_ERRORS);
        historyRevision += 1;
        historyDurable = false;
        if (isObject) recordedErrors.add(error);
        storeHistory();
      }
      if (options.localFailure) {
        failedSections.add(typeof options.section === "string" && options.section ? options.section : "save");
        state.touched = true;
        state.localFailure = true;
        state.confirmed = false;
      }
      render();
    },
    getErrors: async function () {
      await initialized;
      await persistence;
      return errors.slice().reverse().map(function (entry) { return Object.assign({}, entry); });
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", createUi, { once: true });
  else createUi();
})();
