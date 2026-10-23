(function () {
  // Capture recovery intent before createClient consumes the URL credentials.
  const initialRecoveryRequest = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery"
    || new URLSearchParams(window.location.search).get("type") === "recovery";
  const config = window.FOODBROKERBASE_SUPABASE;
  const supabaseGlobal = window.supabase;
  const client =
    config && supabaseGlobal
      ? supabaseGlobal.createClient(config.url, config.publishableKey, {
          auth: {
            autoRefreshToken: true,
            detectSessionInUrl: true,
            persistSession: true
          }
        })
      : null;

  const COMPANY_EMAIL_DOMAIN = "piercecartwright.com";
  const approvedRoles = new Set(["member", "admin", "super_user"]);
  let currentUser = null;
  let currentProfile = null;
  let profileLoadError = false;
  let checkingAccess = false;
  let userVersion = 0;
  const isProductSupportPage = () => document.body?.hasAttribute("data-product-support-page");

  async function refreshAccess() {
    if (!client || checkingAccess) return;
    checkingAccess = true;
    try {
      const { data, error } = await client.auth.getUser();
      if (error) throw error;
      await applyUser(data.user || null);
    } catch (error) {
      profileLoadError = true;
      updateLoginButtons();
    } finally { checkingAccess = false; }
  }

  window.foodBrokerBaseAuth = {
    client,
    getCurrentUser: () => currentUser,
    getCurrentProfile: () => currentProfile,
    hasAccountSettings: true,
    isPasswordRecovery: () => passwordRecoveryActive,
    isAdmin: () => isAdmin(),
    isSuperUser: () => isSuperUser(),
    getCurrentSession: () => (client ? client.auth.getSession() : Promise.resolve({ data: { session: null } })),
    signOut: () => signOut(),
    openDialog: () => openAuthDialog(),
    openTeamDialog: () => openTeamDialog(),
    syncSettingsAccess: () => syncSettingsAccess()
  };

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function isCompanyEmail(email) {
    const normalized = String(email || "").trim().toLowerCase();
    const parts = normalized.split("@");
    return parts.length === 2 && Boolean(parts[0]) && parts[1] === COMPANY_EMAIL_DOMAIN;
  }

  function getDisplayName(user) {
    if (currentProfile?.display_name) return currentProfile.display_name;
    if (!user?.email) return "Logged in";
    return user.email.split("@")[0] || user.email;
  }

  function isApproved() {
    return Boolean(currentUser && (approvedRoles.has(currentProfile?.role) || (currentProfile?.role === "product_support" && isProductSupportPage())));
  }

  function isAdmin() {
    return Boolean(currentUser && ["admin", "super_user"].includes(currentProfile?.role));
  }

  function isSuperUser() { return Boolean(currentUser && currentProfile?.role === "super_user"); }

  function syncSettingsAccess() {
    document.querySelectorAll(".settings-panel").forEach(panel => {
      let button = panel.querySelector("[data-my-initials]");
      if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.className = "ghost-action";
        button.dataset.myInitials = "true";
        button.textContent = "Account settings";
        button.addEventListener("click", openAuthDialog);
        panel.prepend(button);
      }
      button.textContent = "Account settings";
      button.hidden = !currentUser;
    });
    const adminOnlyLabels = new Set([
      "Manage Team",
      "Export Backup",
      "Import Backup",
      "Merge This Browser with Cloud",
      "Download Cloud to This Browser"
    ]);

    document.querySelectorAll(".settings-panel button").forEach((button) => {
      const adminOnly = button.hasAttribute("data-admin-only-setting")
        || adminOnlyLabels.has(button.textContent.trim());
      if (adminOnly) button.hidden = button.textContent.trim() === "Manage Team" ? !isAdmin() : !isSuperUser();
    });
  }

  async function loadCurrentProfile(user = currentUser) {
    const requestVersion = userVersion;
    currentProfile = null;
    profileLoadError = false;
    if (!client || !user) return null;

    const { data, error } = await client
      .from("profiles")
      .select("id,email,display_name,role,created_at")
      .eq("id", user.id)
      .maybeSingle();

    if (currentUser?.id !== user.id || requestVersion !== userVersion) return null;
    if (error) {
      profileLoadError = true;
      console.warn("FoodBrokerBase could not load the signed-in profile.", error);
      return null;
    }

    currentProfile = data || null;
    profileLoadError = !currentProfile;
    return currentProfile;
  }

  function setStatus(message, tone = "") {
    const status = document.querySelector("#authStatus");
    if (!status) return;
    status.textContent = message || "";
    status.dataset.tone = tone;
  }

  function setBusy(isBusy) {
    document.querySelectorAll("[data-auth-action]").forEach((button) => {
      button.disabled = isBusy;
    });
  }

  function updateLoginButtons() {
    let label = "Login";
    if (currentUser && !isApproved()) label = profileLoadError ? "Check access" : "Pending";
    if (isApproved()) label = getDisplayName(currentUser);

    document.querySelectorAll(".login-action").forEach((button) => {
      button.textContent = label;
      button.title = currentUser ? `Signed in as ${currentUser.email}` : "Sign in to FoodBrokerBase";
      button.classList.toggle("is-signed-in", isApproved());
      button.classList.toggle("is-pending", Boolean(currentUser && !isApproved()));
    });
    updateAuthGate();
    syncTeamManagementButtons();
    syncSettingsAccess();
  }

  function ensureAuthGate() {
    let gate = document.querySelector("#authGate");
    if (gate) return gate;

    const shell = document.querySelector(".app-shell");
    const topbar = document.querySelector(".topbar");
    if (!shell || !topbar) return null;

    gate = document.createElement("section");
    gate.id = "authGate";
    gate.className = "auth-gate";
    gate.innerHTML = `
      <div class="auth-gate-card">
        <p class="eyebrow">Team access</p>
        <h1 id="authGateTitle">Sign in to FoodBrokerBase</h1>
        <p id="authGateMessage">Sign in to open your personal work and the shared team sections.</p>
        <button class="primary-action" type="button" data-open-auth-gate>Login</button>
      </div>
    `;
    shell.insertBefore(gate, topbar.nextSibling);
    gate.querySelector("[data-open-auth-gate]").addEventListener("click", () => currentUser ? refreshAccess() : openAuthDialog());
    return gate;
  }

  function updateAuthGate() {
    const needsAuth = Boolean(client);
    const approved = isApproved();
    const pending = Boolean(needsAuth && currentUser && !approved);
    document.body.classList.toggle("auth-required", needsAuth);
    document.body.classList.toggle("auth-signed-in", !needsAuth || approved);
    document.body.classList.toggle("auth-pending", pending);

    const gate = ensureAuthGate();
    if (!gate) return;

    gate.hidden = !needsAuth || approved;
    const title = gate.querySelector("#authGateTitle");
    const message = gate.querySelector("#authGateMessage");
    const button = gate.querySelector("[data-open-auth-gate]");

    if (pending) {
      title.textContent = profileLoadError ? "Could not check your team access" : "Waiting for team approval";
      message.textContent = profileLoadError
        ? "Your account details could not be loaded. Check your connection and refresh access. This does not mean you need approval again."
        : "If your role was just updated, refresh access to check your latest permissions.";
      button.textContent = "Refresh access";
    } else {
      title.textContent = "Sign in to FoodBrokerBase";
      message.textContent = "Sign in to open your personal work and the shared team sections.";
      button.textContent = "Login";
    }
  }

  function notifyAuthChange() {
    window.dispatchEvent(
      new CustomEvent("foodbrokerbase:auth", {
        detail: { user: currentUser, profile: currentProfile }
      })
    );
  }

  async function applyUser(user) {
    const version = ++userVersion;
    const wasSignedIn = Boolean(currentUser);
    const identityChanged = (currentUser?.id || "") !== (user?.id || "");
    currentUser = user || null;
    if (identityChanged) {
      currentProfile = null;
      document.body.classList.remove("auth-signed-in");
      document.body.classList.add("auth-pending");
      document.querySelectorAll("dialog[open]").forEach(dialog => dialog.close());
      window.dispatchEvent(new CustomEvent("foodbrokerbase:auth-checking", { detail: { user: currentUser } }));
    }
    await loadCurrentProfile(currentUser);
    if (version !== userVersion) return;
    if (currentUser && currentProfile?.role === "pending") {
      const { data, error } = await client.rpc("claim_product_support_access");
      if (version !== userVersion) return;
      if (error) console.warn("Could not check preapproved product support access.", error);
      if (data === true) await loadCurrentProfile(currentUser);
      if (version !== userVersion) return;
    }
    if (currentProfile?.role === "product_support" && !isProductSupportPage() && !passwordRecoveryActive) {
      document.body.classList.remove("auth-signed-in");
      document.body.classList.add("auth-pending");
      document.querySelectorAll("dialog[open]").forEach(dialog => dialog.close());
      window.location.replace(new URL("product-support.html", window.location.href).href);
      return;
    }
    if (isProductSupportPage() && approvedRoles.has(currentProfile?.role) && !passwordRecoveryActive) {
      window.location.replace(new URL("index.html", window.location.href).href);
      return;
    }
    updateLoginButtons();
    notifyAuthChange();
    refreshDialogState();
    if (!wasSignedIn && isApproved() && !passwordRecoveryActive) document.querySelector("#supabaseAuthDialog")?.close();
  }

  function closeDialogOnBackdropClick(dialog) {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        dialog.close();
      }
    });
  }

  function closeOpenSettingsMenus() {
    document.querySelectorAll("details.settings-menu[open]").forEach((menu) => {
      menu.removeAttribute("open");
    });
  }

  let passwordRecoveryActive = initialRecoveryRequest;
  let accountSettingsTab = "account";
  let accountDialogVersion = 0;
  let workspaceDraftOwner = "";
  let workspaceDraftDirty = false;

  function authRedirectUrl() {
    const url = new URL(window.location.href);
    url.hash = "";
    url.search = "";
    return url.href;
  }

  function ensureDialog() {
    let dialog = document.querySelector("#supabaseAuthDialog");
    if (dialog) return dialog;

    dialog = document.createElement("dialog");
    dialog.id = "supabaseAuthDialog";
    dialog.className = "auth-dialog";
    dialog.innerHTML = `
      <form method="dialog" class="auth-panel">
        <div class="form-header">
          <div>
            <p class="eyebrow">Team Login</p>
            <h2>FoodBrokerBase Login</h2>
          </div>
          <button class="icon-button" id="closeAuthDialog" type="button" aria-label="Close">&times;</button>
        </div>
        <p class="auth-help">Use your @piercecartwright.com email. New accounts stay pending until an administrator approves them.</p>
        <div class="auth-fields">
          <label>
            <span>Email</span>
            <input id="authEmail" type="email" autocomplete="email" placeholder="name@piercecartwright.com" />
          </label>
          <label>
            <span>Password</span>
            <input id="authPassword" type="password" autocomplete="current-password" />
          </label>
        </div>
        <div class="auth-help-actions" id="authHelpActions">
          <button class="auth-text-action" id="authMagicLink" type="button">Email Magic Link</button>
          <button class="auth-text-action" id="authForgotPassword" type="button">Forgot Password</button>
        </div>
        <div id="authAccountTabs" class="account-settings-tabs" role="tablist" aria-label="Account settings" hidden>
          <button type="button" id="authAccountTab" role="tab" data-account-tab="account" aria-controls="authAccountPanel" aria-selected="true" tabindex="0">Account</button>
          <button type="button" id="authPasswordTab" role="tab" data-account-tab="password" aria-controls="authPasswordPanel" aria-selected="false" tabindex="-1">Password</button>
          <button type="button" id="authWorkspaceTab" role="tab" data-account-tab="workspace" aria-controls="authWorkspacePanel" aria-selected="false" tabindex="-1" hidden>Workspace</button>
        </div>
        <section id="authAccountPanel" class="account-settings-panel" role="tabpanel" aria-labelledby="authAccountTab" tabindex="0" hidden>
          <div class="auth-current-user" id="authCurrentUser"></div>
          <section id="authInitialsSection" hidden>
            <label><span>My initials</span><input id="authInitials" maxlength="4" placeholder="JD" autocomplete="off" /></label>
            <p>Shown on your updates to shared records.</p>
            <button class="primary-action" id="authSaveInitials" type="button">Save initials</button>
          </section>
        </section>
        <section id="authPasswordPanel" class="account-settings-panel" role="tabpanel" aria-labelledby="authPasswordTab" tabindex="0" hidden>
        <section class="auth-security" id="authSecurity" hidden>
          <div>
            <p class="eyebrow">Account Security</p>
            <h3>Change Password</h3>
          </div>
          <div class="auth-fields auth-password-fields">
            <label>
              <span>New Password</span>
              <input id="authNewPassword" type="password" autocomplete="new-password" minlength="8" />
            </label>
            <label>
              <span>Confirm New Password</span>
              <input id="authConfirmPassword" type="password" autocomplete="new-password" minlength="8" />
            </label>
          </div>
          <div class="auth-security-actions">
            <button class="ghost-action" id="authResetEmail" type="button">Email Password Reset</button>
            <button class="primary-action" id="authChangePassword" type="button">Change Password</button>
          </div>
        </section>
        </section>
        <section id="authWorkspacePanel" class="account-settings-panel" role="tabpanel" aria-labelledby="authWorkspaceTab" tabindex="0" hidden>
          <h3>Your starting workspace</h3><p class="account-settings-help">Choose which distributor and product numbers appear first. You can still use every distributor.</p>
          <fieldset id="authWorkspaceChoices" class="account-workspace-options"><legend class="account-settings-sr-only">Preferred workspace</legend>
            <label><input type="radio" name="accountWorkspaceMode" value="usFoods" /><span><strong>US Foods</strong><small>APNs and US Foods stocked items first</small></span></label>
            <label><input type="radio" name="accountWorkspaceMode" value="sysco" /><span><strong>Sysco</strong><small>SUPCs and Sysco stocked items first</small></span></label>
            <label><input type="radio" name="accountWorkspaceMode" value="qualitySales" /><span><strong>Quality Sales</strong><small>Quality Sales stocked items and item numbers first</small></span></label>
            <label><input type="radio" name="accountWorkspaceMode" value="mixed" /><span><strong>Mixed distributors</strong><small>All distributors, including Quality Sales, with all product codes</small></span></label>
          </fieldset><div class="account-workspace-actions"><button type="button" class="primary-action" id="authSaveWorkspace">Save workspace</button></div>
        </section>
        <p class="auth-status" id="authStatus" role="status" aria-live="polite"></p>
        <div class="auth-actions">
          <button class="ghost-action" id="authSignOut" type="button" data-auth-action="signout">Sign Out</button>
          <span></span>
          <button class="ghost-action" id="authSignUp" type="button" data-auth-action="signup">Create Account</button>
          <button class="primary-action" id="authSignIn" type="button" data-auth-action="signin">Sign In</button>
        </div>
      </form>
    `;
    document.body.appendChild(dialog);
    closeDialogOnBackdropClick(dialog);
    dialog.setAttribute("aria-labelledby", "authDialogTitle");
    dialog.querySelector("h2").id = "authDialogTitle";
    dialog.addEventListener("close", () => {
      accountDialogVersion += 1;
      workspaceDraftOwner = "";
      workspaceDraftDirty = false;
      ["authPassword", "authNewPassword", "authConfirmPassword"].forEach(id => { dialog.querySelector("#" + id).value = ""; });
    });
    dialog.querySelectorAll("[data-account-tab]").forEach(tab => tab.addEventListener("click", () => selectAccountTab(tab.dataset.accountTab)));
    dialog.querySelector("#authAccountTabs").addEventListener("keydown", event => {
      const tabs = [...dialog.querySelectorAll("[data-account-tab]")].filter(tab => !tab.hidden);
      const index = tabs.indexOf(document.activeElement);
      if (index < 0 || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      selectAccountTab(tabs[next].dataset.accountTab, true);
    });
    dialog.querySelector("#authSaveWorkspace").addEventListener("click", saveAccountWorkspace);
    dialog.querySelectorAll('[name="accountWorkspaceMode"]').forEach(input => input.addEventListener("change", () => { workspaceDraftDirty = true; }));

    dialog.querySelector("#closeAuthDialog").addEventListener("click", () => dialog.close());
    dialog.querySelector("#authSignIn").addEventListener("click", signIn);
    dialog.querySelector("#authSignUp").addEventListener("click", signUp);
    dialog.querySelector("#authSignOut").addEventListener("click", signOut);
    dialog.querySelector("#authMagicLink").addEventListener("click", sendMagicLink);
    dialog.querySelector("#authForgotPassword").addEventListener("click", sendPasswordReset);
    dialog.querySelector("#authResetEmail").addEventListener("click", sendPasswordReset);
    dialog.querySelector("#authChangePassword").addEventListener("click", changePassword);
    dialog.querySelector("#authSaveInitials").addEventListener("click", async () => {
      const initials = dialog.querySelector("#authInitials").value.trim().toUpperCase();
      if (!/^[A-Z]{1,4}$/.test(initials)) { setStatus("Enter 1–4 letters for your initials.", "error"); return; }
      const button = dialog.querySelector("#authSaveInitials");
      button.disabled = true;
      try {
        const { data, error } = await client.auth.updateUser({ data: { initials } });
        if (error) throw error;
        currentUser = data.user;
        window.dispatchEvent(new Event("foodbrokerbase:initials"));
        dialog.querySelector("#authInitials").value = initials;
        setStatus("Your initials have been saved.", "success");
      } catch (error) { setStatus(error.message || "Could not save initials. Please try again.", "error"); }
      finally { button.disabled = false; }
    });
    dialog.querySelector("#authPassword").addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        signIn();
      }
    });

    return dialog;
  }

  function refreshDialogState() {
    const dialog = document.querySelector("#supabaseAuthDialog");
    if (dialog) {
      dialog.querySelector("h2").textContent = currentUser ? "Account settings" : "FoodBrokerBase Login";
      dialog.querySelector(".form-header .eyebrow").textContent = currentUser ? "Your account" : "Team Login";
      dialog.querySelector(".auth-help").hidden = Boolean(currentUser);
      dialog.querySelector(".auth-fields").hidden = Boolean(currentUser);
      dialog.querySelector("#authSignIn").hidden = Boolean(currentUser);
      dialog.querySelector("#authSignUp").hidden = Boolean(currentUser);
      dialog.querySelector("#authResetEmail").hidden = Boolean(currentUser);
      dialog.querySelector("#authInitialsSection").hidden = !currentUser || passwordRecoveryActive;
      dialog.querySelector("#authInitials").value = currentUser?.user_metadata?.initials || "";
      if (currentUser) dialog.querySelector("#authPassword").value = "";
    }
    const current = document.querySelector("#authCurrentUser");
    const signOutButton = document.querySelector("#authSignOut");
    const security = document.querySelector("#authSecurity");
    const helpActions = document.querySelector("#authHelpActions");
    if (current) {
      if (!currentUser) {
        current.textContent = "Not signed in yet.";
      } else {
        const roleLabel = currentProfile?.role === "super_user" ? "Super User" : currentProfile?.role === "admin" ? "Administrator" : currentProfile?.role === "product_support" ? "Product Support" : currentProfile?.role === "member" ? "Team member" : "Pending approval";
        current.innerHTML = `<strong>Signed in:</strong> ${escapeHtml(currentUser.email)}<br><span>${escapeHtml(roleLabel)}</span>`;
      }
    }
    if (signOutButton) signOutButton.hidden = !currentUser;
    if (security) security.hidden = !currentUser;
    if (helpActions) helpActions.hidden = Boolean(currentUser);
    if (dialog) syncAccountSettings(dialog);
  }

  function workspaceSettingsAvailable() {
    return Boolean(currentUser && !passwordRecoveryActive && approvedRoles.has(currentProfile?.role)
      && typeof window.foodBrokerWorkspace?.getMode === "function" && typeof window.foodBrokerWorkspace?.setMode === "function");
  }

  function selectAccountTab(name, focus = false) {
    const dialog = document.querySelector("#supabaseAuthDialog");
    if (!dialog) return;
    const available = currentUser ? passwordRecoveryActive ? ["password"] : ["account", "password", ...(workspaceSettingsAvailable() ? ["workspace"] : [])] : [];
    accountSettingsTab = passwordRecoveryActive && currentUser ? "password" : available.includes(name) ? name : "account";
    dialog.querySelectorAll("[data-account-tab]").forEach(tab => {
      const selected = tab.dataset.accountTab === accountSettingsTab && available.includes(tab.dataset.accountTab);
      tab.hidden = !available.includes(tab.dataset.accountTab);
      tab.setAttribute("aria-selected", String(selected)); tab.tabIndex = selected ? 0 : -1;
      dialog.querySelector("#" + tab.getAttribute("aria-controls")).hidden = !selected;
    });
    if (focus) dialog.querySelector(`[data-account-tab="${accountSettingsTab}"]`)?.focus();
  }

  function syncAccountSettings(dialog) {
    dialog.classList.toggle("is-account-settings", Boolean(currentUser));
    dialog.querySelector("#authAccountTabs").hidden = !currentUser || passwordRecoveryActive;
    if (workspaceSettingsAvailable() && (workspaceDraftOwner !== currentUser.id || !workspaceDraftDirty)) {
      workspaceDraftOwner = currentUser.id;
      const mode = window.foodBrokerWorkspace.getMode();
      dialog.querySelectorAll('[name="accountWorkspaceMode"]').forEach(input => { input.checked = input.value === mode; });
    }
    selectAccountTab(accountSettingsTab);
  }

  async function saveAccountWorkspace() {
    const dialog = document.querySelector("#supabaseAuthDialog");
    const button = dialog?.querySelector("#authSaveWorkspace");
    if (!dialog?.open || !workspaceSettingsAvailable() || button.disabled) return;
    const mode = dialog.querySelector('[name="accountWorkspaceMode"]:checked')?.value;
    if (!["usFoods", "sysco", "qualitySales", "mixed"].includes(mode)) { setStatus("Choose your preferred workspace.", "error"); return; }
    const uid = currentUser.id, version = accountDialogVersion;
    const stillCurrent = () => dialog.open && accountDialogVersion === version && currentUser?.id === uid && workspaceSettingsAvailable();
    button.disabled = true; dialog.querySelector("#authWorkspaceChoices").disabled = true;
    setStatus("Saving workspace…", "pending");
    try {
      await window.foodBrokerWorkspace.setMode(mode);
      if (stillCurrent()) setStatus("Your workspace has been saved.", "success");
    } catch (error) {
      if (stillCurrent()) setStatus(error.message || "Could not save your workspace. Your choice is still here; please retry.", "error");
    } finally {
      if (stillCurrent()) { button.disabled = false; dialog.querySelector("#authWorkspaceChoices").disabled = false; }
    }
  }

  function openAuthDialog() {
    const dialog = ensureDialog();
    accountDialogVersion += 1;
    workspaceDraftOwner = "";
    workspaceDraftDirty = false;
    accountSettingsTab = passwordRecoveryActive ? "password" : "account";
    dialog.querySelector("#authSaveWorkspace").disabled = false;
    dialog.querySelector("#authWorkspaceChoices").disabled = false;
    closeOpenSettingsMenus();
    refreshDialogState();

    if (!client) {
      setStatus("Supabase did not load. Check your internet connection and refresh the page.", "error");
    } else if (passwordRecoveryActive) {
      setStatus("Choose and confirm a new password.", "pending");
    } else if (currentUser && !isApproved()) {
      setStatus(profileLoadError ? "Could not load your account permissions. Refresh the page to retry." : "This account is waiting for an administrator to approve team access.", "pending");
    } else {
      setStatus(currentUser ? "You are signed in and approved." : "Enter your email and password to sign in.", "");
    }

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "open");
    }
  }

  function syncTeamManagementButtons() {
    document.querySelectorAll(".manage-team-action").forEach((button) => button.remove());
    if (!isAdmin()) return;

    document.querySelectorAll(".settings-panel").forEach((panel) => {
      const button = document.createElement("button");
      button.className = "ghost-action manage-team-action";
      button.type = "button";
      button.textContent = "Manage Team";
      button.addEventListener("click", openTeamDialog);
      panel.prepend(button);
    });
  }

  function ensureTeamDialog() {
    let dialog = document.querySelector("#teamManagementDialog");
    if (dialog) return dialog;

    dialog = document.createElement("dialog");
    dialog.id = "teamManagementDialog";
    dialog.className = "auth-dialog team-dialog";
    dialog.innerHTML = `
      <div class="auth-panel team-panel">
        <div class="form-header">
          <div>
            <p class="eyebrow">Administrator</p>
            <h2>Manage Team</h2>
          </div>
          <button class="icon-button" type="button" data-close-team aria-label="Close">&times;</button>
        </div>
        <p class="auth-help">Approve coworkers, choose who can manage team access, or permanently remove an account.</p>
        <p class="team-state" id="teamManagementStatus"></p>
        <div class="team-list" id="teamManagementList"></div>
      </div>
    `;
    document.body.appendChild(dialog);
    closeDialogOnBackdropClick(dialog);
    dialog.querySelector("[data-close-team]").addEventListener("click", () => dialog.close());
    return dialog;
  }

  function setTeamStatus(message, tone = "") {
    const status = document.querySelector("#teamManagementStatus");
    if (!status) return;
    status.textContent = message || "";
    status.dataset.tone = tone;
  }

  function formatCreatedDate(value) {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
  }

  async function saveTeamDisplayName(profile, input, name, button) {
    const nextName = input.value.trim();
    button.disabled = true;
    button.textContent = "Saving...";

    const { error } = await client.rpc("set_team_user_display_name", {
      target_user: profile.user_id,
      new_display_name: nextName
    });

    if (error) {
      setTeamStatus(error.message, true);
      button.disabled = false;
      button.textContent = "Save Name";
      return;
    }

    profile.display_name = nextName;
    name.textContent = nextName || profile.email?.split("@")[0] || "Unnamed user";

    if (profile.user_id === currentUser?.id) {
      currentProfile = { ...currentProfile, display_name: nextName || null };
      updateLoginButtons();
    }

    setTeamStatus("Display name saved.");
    button.disabled = false;
    button.textContent = "Save Name";
  }

  function renderTeamProfiles(profiles) {
    const list = document.querySelector("#teamManagementList");
    if (!list) return;
    list.innerHTML = "";

    if (!profiles.length) {
      list.innerHTML = '<p class="team-empty">No team accounts found yet.</p>';
      return;
    }

    profiles.forEach((profile) => {
      const row = document.createElement("div");
      row.className = "team-row";

      const identity = document.createElement("div");
      identity.className = "team-identity";
      const name = document.createElement("strong");
      name.textContent = profile.display_name || profile.email || "Unnamed user";
      const email = document.createElement("span");
      email.textContent = profile.email || "";
      const created = document.createElement("small");
      created.textContent = profile.created_at ? `Joined ${formatCreatedDate(profile.created_at)}` : "";
      const nameEditor = document.createElement("div");
      nameEditor.className = "team-name-editor";
      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.value = profile.display_name || "";
      nameInput.placeholder = profile.email?.split("@")[0] || "Display name";
      nameInput.setAttribute("aria-label", `Display name for ${profile.email || "user"}`);
      const saveName = document.createElement("button");
      saveName.type = "button";
      saveName.className = "ghost-action";
      saveName.textContent = "Save Name";
      saveName.addEventListener("click", () => saveTeamDisplayName(profile, nameInput, name, saveName));
      nameEditor.append(nameInput, saveName);
      identity.append(name, email, nameEditor, created);
      if (isSuperUser() && profile.initials !== undefined) {
        const editor = document.createElement("div");
        editor.className = "team-name-editor";
        const input = document.createElement("input");
        input.maxLength = 4;
        input.value = profile.initials;
        input.placeholder = "Initials";
        input.setAttribute("aria-label", `Initials for ${profile.email || "user"}`);
        const save = document.createElement("button");
        save.type = "button";
        save.className = "ghost-action";
        save.textContent = "Save Initials";
        save.addEventListener("click", async () => {
          const initials = input.value.trim().toUpperCase();
          if (!/^[A-Z]{1,4}$/.test(initials)) { setTeamStatus("Enter 1–4 letters for initials.", "error"); return; }
          save.disabled = true;
          try {
            const { error } = await client.rpc("set_team_user_initials", { target_user: profile.user_id, new_initials: initials });
            if (error) throw error;
            profile.initials = initials;
            window.dispatchEvent(new Event("foodbrokerbase:initials"));
            input.value = initials;
            if (profile.user_id === currentUser?.id) currentUser = { ...currentUser, user_metadata: { ...currentUser.user_metadata, initials } };
            setTeamStatus("Initials saved. This member will see them after refreshing the app.", "success");
          } catch (error) { setTeamStatus(error.message || "Could not save initials.", "error"); }
          finally { save.disabled = false; }
        });
        editor.append(input, save);
        identity.append(editor);
      }

      const select = document.createElement("select");
      select.className = "team-role-select";
      select.setAttribute("aria-label", `Access role for ${profile.email || "team member"}`);
      [
        ["pending", "Pending"],
        ["member", "Team Member"],
        ["product_support", "Product Support"],
        ["admin", "Administrator"],
        ["super_user", "Super User"]
      ].forEach(([value, label]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        option.selected = profile.role === value;
        select.appendChild(option);
      });

      select.addEventListener("change", async () => {
        const previousRole = profile.role;
        select.disabled = true;
        setTeamStatus("Saving team access...");
        const { error } = await client.rpc("set_team_user_role", {
          target_user: profile.user_id,
          new_role: select.value
        });
        select.disabled = false;

        if (error) {
          select.value = previousRole;
          setTeamStatus(error.message, "error");
          return;
        }

        profile.role = select.value;
        setTeamStatus(`Saved access for ${profile.email || profile.display_name}.`, "success");
      });

      const actions = document.createElement("div");
      actions.className = "team-actions";
      if (isSuperUser()) actions.appendChild(select);
      else {
        const roleLabel = document.createElement("span");
        roleLabel.textContent = profile.role === "super_user" ? "Super User" : profile.role === "admin" ? "Administrator" : profile.role === "product_support" ? "Product Support" : profile.role === "member" ? "Team Member" : "Pending";
        actions.appendChild(roleLabel);
        if (profile.role === "pending") {
          const approve = document.createElement("button");
          approve.type = "button"; approve.className = "primary-action"; approve.textContent = "Approve member";
          approve.addEventListener("click", async () => {
            approve.disabled = true;
            const { error } = await client.rpc("set_team_user_role", { target_user: profile.user_id, new_role: "member" });
            if (error) { approve.disabled = false; setTeamStatus(error.message, "error"); }
            else await loadTeamProfiles();
          });
          actions.appendChild(approve);
        }
      }
      const view = document.createElement("button");
      view.type = "button"; view.className = "ghost-action"; view.textContent = "View personal work";
      view.addEventListener("click", () => window.openTeamMemberWork(profile));
      actions.appendChild(view);

      if (profile.user_id === currentUser?.id) {
        const currentLabel = document.createElement("span");
        currentLabel.className = "team-current-account";
        currentLabel.textContent = "Your account";
        actions.appendChild(currentLabel);
      } else if (isSuperUser()) {
        const deleteButton = document.createElement("button");
        deleteButton.className = "team-delete-user";
        deleteButton.type = "button";
        deleteButton.textContent = "Delete User";
        deleteButton.addEventListener("click", async () => {
          const label = profile.display_name || profile.email || "this user";
          const confirmed = window.confirm(
            `Permanently delete ${label}?\n\n` +
              "This removes their sign-in and their private leads, to-dos, vendor reports, personal market visits, and calendar data. Shared team records remain.\n\n" +
              "This cannot be undone."
          );
          if (!confirmed) return;

          select.disabled = true;
          deleteButton.disabled = true;
          setTeamStatus(`Deleting ${label}...`);
          const { error } = await client.rpc("delete_team_user", {
            target_user: profile.user_id
          });

          if (error) {
            select.disabled = false;
            deleteButton.disabled = false;
            setTeamStatus(error.message, "error");
            return;
          }

          row.remove();
          setTeamStatus(`Deleted ${label}.`, "success");
          if (!list.querySelector(".team-row")) {
            list.innerHTML = '<p class="team-empty">No team accounts found yet.</p>';
          }
        });
        actions.appendChild(deleteButton);
      }

      row.append(identity, actions);
      list.appendChild(row);
    });
  }

  async function loadTeamProfiles() {
    setTeamStatus("Loading team accounts...");
    const { data, error } = await client.rpc("get_team_profiles");
    if (error) {
      setTeamStatus(error.message, "error");
      renderTeamProfiles([]);
      return;
    }
    const initialsResult = isSuperUser() ? await client.rpc("get_team_initials") : { data: [], error: null };
    const initials = new Map((initialsResult.data || []).map(item => [item.user_id, item.initials]));
    renderTeamProfiles((Array.isArray(data) ? data : []).map(profile => ({ ...profile, initials: initialsResult.error ? undefined : initials.get(profile.user_id) || "" })));
    setTeamStatus(initialsResult.error ? "Team initials editing needs the database update installed." : "", initialsResult.error ? "error" : "");
  }

  function openTeamDialog() {
    if (!client || !isAdmin()) {
      window.alert("Administrator access is required.");
      return;
    }

    const dialog = ensureTeamDialog();
    dialog.querySelector('.auth-help').textContent = isSuperUser()
      ? 'Manage team roles, display names, initials, and accounts.'
      : 'Approve pending members, update display names, and view personal work without editing it.';
    closeOpenSettingsMenus();
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "open");
    }
    loadTeamProfiles();
  }

  function getAuthEmail() {
    return currentUser?.email || document.querySelector("#authEmail")?.value.trim().toLowerCase() || "";
  }

  async function sendMagicLink() {
    if (!client) {
      setStatus("Supabase is not connected.", "error");
      return;
    }

    const email = getAuthEmail();
    if (!email || !isCompanyEmail(email)) {
      setStatus("Enter your @piercecartwright.com email first.", "error");
      return;
    }

    setBusy(true);
    setStatus("Sending a secure sign-in link...", "pending");
    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: authRedirectUrl(),
        shouldCreateUser: false
      }
    });
    setBusy(false);
    if (error) {
      setStatus(error.message, "error");
      return;
    }
    setStatus("Magic link sent. Open the email on this device to sign in.", "success");
  }

  async function sendPasswordReset() {
    if (!client) {
      setStatus("Supabase is not connected.", "error");
      return;
    }

    const email = getAuthEmail();
    if (!email || !isCompanyEmail(email)) {
      setStatus("Enter your @piercecartwright.com email first.", "error");
      return;
    }

    setBusy(true);
    setStatus("Sending password reset email...", "pending");
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: authRedirectUrl()
    });
    setBusy(false);
    if (error) {
      setStatus(error.message, "error");
      return;
    }
    setStatus("Password reset email sent. Open it to choose a new password.", "success");
  }

  async function changePassword() {
    if (!client || !currentUser) {
      setStatus("Sign in before changing your password.", "error");
      return;
    }

    const passwordInput = document.querySelector("#authNewPassword");
    const confirmInput = document.querySelector("#authConfirmPassword");
    const password = passwordInput?.value || "";
    const confirmation = confirmInput?.value || "";
    if (password.length < 8) {
      setStatus("Use at least 8 characters for the new password.", "error");
      return;
    }
    if (password !== confirmation) {
      setStatus("The new passwords do not match.", "error");
      return;
    }

    setBusy(true);
    setStatus("Updating your password...", "pending");
    const { error } = await client.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setStatus(error.message, "error");
      return;
    }

    passwordRecoveryActive = false;
    passwordInput.value = "";
    confirmInput.value = "";
    await applyUser(currentUser);
    refreshDialogState();
    setStatus("Password changed successfully.", "success");
  }

  async function signIn() {
    if (!client) {
      setStatus("Supabase did not load. Check your internet connection and refresh the page.", "error");
      return;
    }

    const email = document.querySelector("#authEmail")?.value.trim().toLowerCase();
    const password = document.querySelector("#authPassword")?.value;
    if (!email || !password) {
      setStatus("Enter an email and password first.", "error");
      return;
    }

    setBusy(true);
    setStatus("Signing in...");
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      setBusy(false);
      setStatus(error.message, "error");
      return;
    }

    await applyUser(data.user || null);
    setBusy(false);
    setStatus(isApproved() ? "Signed in. Cloud sync is ready." : "Signed in. Waiting for administrator approval.", isApproved() ? "success" : "pending");
    if (isApproved() && !passwordRecoveryActive) document.querySelector("#supabaseAuthDialog")?.close();
  }

  async function signUp() {
    if (!client) {
      setStatus("Supabase did not load. Check your internet connection and refresh the page.", "error");
      return;
    }

    const email = document.querySelector("#authEmail")?.value.trim().toLowerCase();
    const password = document.querySelector("#authPassword")?.value;
    if (!email || !password) {
      setStatus("Enter an email and password first.", "error");
      return;
    }

    if (!isCompanyEmail(email)) {
      setStatus("Only @piercecartwright.com email addresses can create an account.", "error");
      return;
    }

    setBusy(true);
    setStatus("Creating account...");
    const { data, error } = await client.auth.signUp({ email, password, options: { emailRedirectTo: authRedirectUrl() } });
    if (error) {
      setBusy(false);
      setStatus(error.message, "error");
      return;
    }

    // An unconfirmed signup returns a user description without a session.
    // It is not a signed-in identity and must not trigger profile/role reads.
    if (data.session?.user) await applyUser(data.session.user);
    setBusy(false);
    setStatus(
      data.session
        ? isApproved() ? "Account created. Your approved workspace is ready." : "Account created. Team approval is required before app data opens."
        : "Account created. Check your email to confirm your address, then sign in. Approved accounts open automatically; other accounts need team approval.",
      "success"
    );
  }

  async function signOut() {
    if (!client) return;
    setBusy(true);
    setStatus("Signing out...");
    const { error } = await client.auth.signOut();
    if (error) {
      setBusy(false);
      setStatus(error.message, "error");
      return;
    }

    await applyUser(null);
    setBusy(false);
    setStatus("Signed out.", "success");
  }

  async function init() {
    document.querySelectorAll(".login-action").forEach((button) => {
      button.addEventListener("click", openAuthDialog);
    });

    if (!client) {
      updateLoginButtons();
      return;
    }

    client.auth.onAuthStateChange((event, session) => {
      // Synchronous flags are safe here; authenticated calls stay outside the
      // SDK's auth lock in the deferred task below.
      if (event === "PASSWORD_RECOVERY") passwordRecoveryActive = true;
      window.setTimeout(async () => {
        await applyUser(session?.user || null);
        if (event === "PASSWORD_RECOVERY") {
          showPasswordRecoveryDialog();
        }
      }, 0);
    });
    const { data } = await client.auth.getUser();
    await applyUser(data.user || null);
    if (passwordRecoveryActive) showPasswordRecoveryDialog();
  }

  function showPasswordRecoveryDialog() {
    const dialog = ensureDialog();
    accountSettingsTab = "password";
    refreshDialogState();
    setStatus("Choose and confirm a new password.", "pending");
    if (!dialog.open && typeof dialog.showModal === "function") dialog.showModal();
    else if (!dialog.open) dialog.setAttribute("open", "open");
    document.querySelector("#authNewPassword")?.focus();
  }

  function syncOpenAccountSettings() {
    const dialog = document.querySelector("#supabaseAuthDialog[open]");
    if (dialog) syncAccountSettings(dialog);
  }
  window.addEventListener("foodbrokerbase:workspace", syncOpenAccountSettings);
  window.addEventListener("foodbrokerbase:workspace-ready", syncOpenAccountSettings);

  ready(init);
  window.addEventListener("online", () => { if (currentUser && !isApproved()) refreshAccess(); });
  window.addEventListener("focus", () => { if (currentUser && !isApproved()) refreshAccess(); });
  window.setInterval(() => { if (currentUser && !isApproved() && !document.hidden) refreshAccess(); }, 15000);
})();
