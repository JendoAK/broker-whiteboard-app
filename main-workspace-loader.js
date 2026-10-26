(function () {
  "use strict";

  // Business modules stay inert until the server-checked profile grants full
  // workspace access. Product Support uses its separate, restricted page.
  const fullRoles = new Set(["member", "admin", "super_user"]);
  const originalDocumentAdd = document.addEventListener;
  const originalDocumentRemove = document.removeEventListener;
  const originalWindowAdd = window.addEventListener;
  const originalWindowRemove = window.removeEventListener;
  const pendingReady = [];
  let loadingUser = "";
  let loadedUser = "";
  let generation = 0;
  let started = false;

  function currentUser() {
    const auth = window.foodBrokerBaseAuth;
    return !auth?.isPasswordRecovery?.() && fullRoles.has(auth?.getCurrentProfile?.()?.role) ? auth?.getCurrentUser?.()?.id || "" : "";
  }
  function valid(version, uid) { return generation === version && currentUser() === uid; }
  function leaveWorkspace() {
    window.dispatchEvent(new CustomEvent("foodbrokerbase:workspace-leaving"));
    window.location.reload();
  }
  function showProblem(error) {
    const gate = document.querySelector("#authGate");
    if (!gate) return;
    gate.hidden = false;
    gate.querySelector("#authGateTitle").textContent = "Could not open the workspace";
    gate.querySelector("#authGateMessage").textContent = "A required app file did not load. Refresh the page to retry. " + String(error?.message || "").slice(0, 180);
    const button = gate.querySelector("[data-open-auth-gate]");
    if (button) { button.hidden = false; button.textContent = "Reload app"; button.onclick = () => window.location.reload(); }
    document.body.classList.remove("auth-signed-in"); document.body.classList.add("auth-pending");
  }
  function captureReady(target, nativeAdd, nativeRemove) {
    target.addEventListener = function (type, listener, options) {
      if ((type === "DOMContentLoaded" || type === "load") && listener) {
        const capture = typeof options === "boolean" ? options : Boolean(options?.capture);
        if (!pendingReady.some(entry => entry.target === target && entry.type === type && entry.listener === listener && entry.capture === capture && !entry.removed)) pendingReady.push({target,type,listener,options,capture,removed:false});
        return;
      }
      return nativeAdd.call(this, type, listener, options);
    };
    target.removeEventListener = function (type, listener, options) {
      const capture = typeof options === "boolean" ? options : Boolean(options?.capture);
      pendingReady.forEach(entry => {if(entry.target === target && entry.type === type && entry.listener === listener && entry.capture === capture) entry.removed = true;});
      return nativeRemove.call(this,type,listener,options);
    };
  }
  function executeSource(source, name) {
    const ownReadyState = Object.getOwnPropertyDescriptor(document,"readyState");
    let scriptError = null;
    const onError = event => { scriptError = event.error || new Error(event.message || "App module failed."); };
    originalWindowAdd.call(window,"error",onError);
    captureReady(document,originalDocumentAdd,originalDocumentRemove);
    captureReady(window,originalWindowAdd,originalWindowRemove);
    // Modules use the same deferred-ready path as the original parser-loaded
    // page. Their callbacks run only after every dependency, including app.js.
    Object.defineProperty(document,"readyState",{configurable:true,get:()=>"loading"});
    try {
      const script = document.createElement("script");
      script.dataset.loadedWorkspaceModule = name;
      script.textContent = source + "\n//# sourceURL=" + name.replace(/[\r\n]/g, "");
      document.body.appendChild(script);
      if (scriptError) throw scriptError;
    } finally {
      if (ownReadyState) Object.defineProperty(document,"readyState",ownReadyState); else delete document.readyState;
      document.addEventListener = originalDocumentAdd; document.removeEventListener = originalDocumentRemove;
      window.addEventListener = originalWindowAdd; window.removeEventListener = originalWindowRemove;
      originalWindowRemove.call(window,"error",onError);
    }
  }
  function flushReady() {
    // DOMContentLoaded bubbles from document to window; preserve that ordering
    // without redispatching auth's real, already-completed ready event.
    const phase = entry => entry.type === "load" ? 2 : entry.target === document ? 0 : 1;
    pendingReady.sort((a,b)=>phase(a)-phase(b));
    for (const entry of pendingReady.splice(0)) {
      if (entry.removed || entry.options?.signal?.aborted) continue;
      const event = new Event(entry.type);
      Object.defineProperties(event,{target:{value:entry.type === "load" ? window : document},currentTarget:{value:entry.target}});
      if (typeof entry.listener === "function") entry.listener.call(entry.target,event); else entry.listener.handleEvent(event);
    }
  }
  async function load(uid) {
    started = true; loadingUser = uid;
    const version = ++generation;
    const gate = document.querySelector("#authGate");
    document.body.classList.remove("auth-signed-in"); document.body.classList.add("auth-pending");
    if (gate) {
      gate.hidden = false;
      gate.querySelector("#authGateTitle").textContent = "Opening your workspace…";
      gate.querySelector("#authGateMessage").textContent = "Your access is approved. Loading the app’s tools.";
      const button = gate.querySelector("[data-open-auth-gate]"); if (button) button.hidden = true;
    }
    try {
      const modules = [...document.querySelectorAll("script[data-main-src],script[data-main-inline]")];
      const sources = await Promise.all(modules.map(async node => {
        if (node.hasAttribute("data-main-inline")) return {source:node.textContent,name:"foodbroker-main-inline.js"};
        const url = new URL(node.dataset.mainSrc,window.location.href);
        if (url.origin !== window.location.origin) throw new Error("Unexpected app module origin.");
        const response = await fetch(url.href,{credentials:"same-origin"});
        if (!response.ok) throw new Error(url.pathname.split("/").pop()+" could not be loaded.");
        return {source:await response.text(),name:url.href};
      }));
      if (!valid(version,uid)) {
        // An auth refresh can briefly clear the checked profile while the
        // assets are downloading. The next verified auth event may retry.
        if (generation === version) { started = false; loadingUser = ""; }
        return;
      }
      for (const module of sources) { if(!valid(version,uid)) return; executeSource(module.source,module.name); }
      flushReady();
      loadedUser = uid; loadingUser = "";
      document.body.classList.remove("auth-pending"); document.body.classList.add("auth-signed-in");
      if (gate) { gate.hidden = true; const button = gate.querySelector("[data-open-auth-gate]"); if (button) button.hidden = false; }
      window.dispatchEvent(new CustomEvent("foodbrokerbase:workspace-ready",{detail:{userId:uid}}));
    } catch (error) {
      if (valid(version,uid)) { showProblem(error); console.error("Workspace initialization failed",error); }
    }
  }
  function reconcile() {
    const uid = currentUser();
    if (!uid || (started && uid !== (loadedUser || loadingUser))) {
      if (started) {
        generation++; pendingReady.length = 0;
        document.body.classList.remove("auth-signed-in"); document.body.classList.add("auth-pending");
        leaveWorkspace();
      }
      return;
    }
    if (!started) load(uid);
  }
  originalWindowAdd.call(window,"foodbrokerbase:auth",reconcile);
  originalWindowAdd.call(window,"foodbrokerbase:auth-checking",()=>{
    if (!started) return;
    generation++; pendingReady.length = 0;
    document.body.classList.remove("auth-signed-in"); document.body.classList.add("auth-pending");
    leaveWorkspace();
  });
  if(document.readyState === "loading") originalDocumentAdd.call(document,"DOMContentLoaded",reconcile,{once:true}); else reconcile();
})();
