/* Personal presentation defaults. Account access remains enforced by Supabase. */
(function () {
  "use strict";
  const recordType = "workspace-preferences";
  const recordKey = "distributor-workspace";
  const modes = new Set(["usFoods", "sysco", "mixed"]);
  const cache = new Map();
  let activeId = null;
  let current = { mode: "usFoods", configured: false };
  let generation = 0;
  let revision = 0;
  let loadNumber = 0;
  let noticeTimer;
  let noticeSignature = "";
  let saveChain = Promise.resolve();
  const auth = () => window.foodBrokerBaseAuth;
  const user = () => auth()?.getCurrentUser?.();
  const client = () => auth()?.client;
  const approved = () => ["member", "admin", "super_user"].includes(auth()?.getCurrentProfile?.()?.role);
  const cacheKey = id => "foodbroker-workspace:" + id;
  const recordError = (error, operation) => window.foodBrokerSaveStatus?.recordError(error, { operation });

  function readCache(id) {
    if (!id) return { mode: "usFoods", configured: false };
    if (cache.has(id)) return cache.get(id);
    let value = { mode: "usFoods", configured: false };
    try {
      const stored = JSON.parse(localStorage.getItem(cacheKey(id)) || "null");
      if (modes.has(stored?.mode)) value = { mode: stored.mode, configured: true };
    } catch (error) { recordError(error, "Read workspace cache"); }
    cache.set(id, value);
    return value;
  }

  function storeCache(id, value) {
    cache.set(id, value);
    try { localStorage.setItem(cacheKey(id), JSON.stringify({ version: 1, mode: value.mode })); }
    catch (error) { recordError(error, "Cache workspace defaults"); }
  }

  function scheduleNotice() {
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => {
      syncIdentity();
      const signature = [activeId, current.mode, current.configured].join("|");
      if (signature === noticeSignature) return;
      noticeSignature = signature;
      window.dispatchEvent(new CustomEvent("foodbrokerbase:workspace", {
        detail: { userId: activeId || "", mode: current.mode, configured: current.configured }
      }));
    }, 0);
  }

  function syncIdentity() {
    const id = user()?.id || "";
    if (id !== activeId) {
      activeId = id;
      generation += 1;
      revision += 1;
      loadNumber += 1;
      current = readCache(id);
      document.querySelector("#workspacePreferencesDialog[open]")?.close();
      scheduleNotice();
    }
    return id;
  }

  function getMode() { syncIdentity(); return current.mode; }
  function hasPreference() { syncIdentity(); return current.configured; }
  function getDefaultDistributor() { return ({ usFoods: "US Foods", sysco: "Sysco", mixed: "" })[getMode()]; }
  function getStockList() { return ({ usFoods: "usFoods", sysco: "sysco", mixed: "all" })[getMode()]; }
  function getNumberMode() { return ({ usFoods: "apn", sysco: "supc", mixed: "both" })[getMode()]; }

  function rankProduct(product) {
    const mode = getMode();
    const distributor = String(product?.distributor || "");
    const stocked = product?.isNewEventProduct !== true && distributor !== "Not stocked" && Boolean(product?.canonicalStockId || product?.linkedStockId || distributor);
    if (mode === "mixed") return stocked ? 0 : 1;
    const isPreferred = mode === "sysco" ? /^sysco$/i.test(distributor) : /^us\s*foods\b/i.test(distributor);
    const value = String(product?.[mode === "sysco" ? "supc" : "apn"] || "").trim();
    const hasCode = value && !/^(n\/?a|none|unknown|optional|tbd)$/i.test(value);
    return hasCode ? (isPreferred ? 0 : 1) : isPreferred && stocked ? 2 : stocked ? 3 : 4;
  }

  async function refresh() {
    const id = syncIdentity();
    if (!id || !client() || !approved()) return getMode();
    const accountGeneration = generation;
    const requestRevision = revision;
    const requestNumber = ++loadNumber;
    try {
      const { data, error } = await client().from("app_records").select("data")
        .eq("owner_id", id).eq("record_type", recordType).eq("record_key", recordKey).maybeSingle();
      if (error) throw error;
      if (user()?.id !== id || generation !== accountGeneration || revision !== requestRevision || loadNumber !== requestNumber) return getMode();
      if (modes.has(data?.data?.mode)) {
        current = { mode: data.data.mode, configured: true };
        storeCache(id, current);
      }
      scheduleNotice();
    } catch (error) {
      if (user()?.id === id && generation === accountGeneration) recordError(error, "Load workspace defaults");
    }
    return getMode();
  }

  function setMode(mode) {
    if (!modes.has(mode)) return Promise.reject(new Error("Choose US Foods, Sysco, or mixed distributors."));
    const id = syncIdentity();
    if (!id || !client() || !approved()) return Promise.reject(new Error("Sign in to save your workspace."));
    const accountGeneration = generation;
    revision += 1;
    const request = saveChain.catch(() => {}).then(async () => {
      if (user()?.id !== id || generation !== accountGeneration) throw new Error("The signed-in account changed. Open My workspace again.");
      const { error } = await client().from("app_records").upsert({
        owner_id: id, record_type: recordType, record_key: recordKey,
        created_by: id, updated_by: id, data: { version: 1, mode }
      }, { onConflict: "owner_id,record_type,record_key" });
      if (error) throw error;
      storeCache(id, { mode, configured: true });
      if (user()?.id === id && generation === accountGeneration) {
        revision += 1;
        current = { mode, configured: true };
        scheduleNotice();
      }
      return mode;
    }).catch(error => {
      recordError(error, "Save workspace defaults");
      throw error;
    });
    saveChain = request.catch(() => {});
    return request;
  }

  function mountSettingsButton() {
    const visible = Boolean(syncIdentity() && approved());
    document.querySelectorAll(".settings-panel").forEach(panel => {
      let button = panel.querySelector("[data-open-workspace]");
      if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.className = "ghost-action";
        button.dataset.openWorkspace = "";
        button.textContent = "My workspace";
        button.addEventListener("click", openDialog);
        panel.prepend(button);
      }
      button.hidden = !visible;
    });
  }

  function openDialog() {
    if (!syncIdentity() || !approved()) return;
    const existing = document.querySelector("#workspacePreferencesDialog");
    if (existing) { if (!existing.open) existing.showModal(); return existing; }
    const dialog = document.createElement("dialog");
    dialog.id = "workspacePreferencesDialog";
    dialog.className = "note-dialog workspace-preferences-dialog";
    dialog.setAttribute("aria-labelledby", "workspacePreferencesTitle");
    const choices = [
      ["usFoods", "US Foods", "APNs and US Foods stocked items first"],
      ["sysco", "Sysco", "SUPCs and Sysco stocked items first"],
      ["mixed", "Mixed distributors", "US Foods, Sysco, Linford, and other products together"]
    ];
    dialog.innerHTML = `<form class="note-form" data-workspace-form><header class="form-header"><h2 id="workspacePreferencesTitle">My workspace</h2><button type="button" class="icon-button" data-workspace-close aria-label="Close">&times;</button></header><p>Choose your starting view and product code order. You can still use any distributor.</p><fieldset class="workspace-mode-options"><legend>Preferred workspace</legend>${choices.map(([mode, name, description]) => `<label><input type="radio" name="workspaceMode" data-workspace-mode value="${mode}" ${getMode() === mode ? "checked" : ""}><span><strong>${name}</strong><small>${description}</small></span></label>`).join("")}</fieldset><p data-workspace-status role="status"></p><div class="form-actions"><button type="button" class="ghost-action" data-workspace-cancel>Cancel</button><button type="submit" class="primary-action" data-save-workspace>Save workspace</button></div></form>`;
    document.body.append(dialog);
    dialog.querySelector("[data-workspace-close]").onclick = () => dialog.close();
    dialog.querySelector("[data-workspace-cancel]").onclick = () => dialog.close();
    dialog.addEventListener("close", () => dialog.remove());
    dialog.querySelector("form").onsubmit = async event => {
      event.preventDefault();
      const button = dialog.querySelector("[data-save-workspace]");
      if (button.disabled) return;
      const mode = dialog.querySelector("[data-workspace-mode]:checked")?.value;
      const status = dialog.querySelector("[data-workspace-status]");
      button.disabled = true;
      status.textContent = "Saving…";
      try { await setMode(mode); dialog.close(); }
      catch (error) { status.textContent = error.message || "Could not save. Your choice is still here; please try again."; }
      finally { button.disabled = false; }
    };
    dialog.showModal();
    return dialog;
  }

  window.foodBrokerWorkspace = Object.freeze({ getMode, hasPreference, getDefaultDistributor, getStockList, getNumberMode, rankProduct, refresh, setMode, openDialog });
  const initialize = () => { mountSettingsButton(); refresh(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
  window.addEventListener("foodbrokerbase:auth", initialize);
  window.addEventListener("online", () => refresh());
  window.addEventListener("focus", () => refresh());
})();
