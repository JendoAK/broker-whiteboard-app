(function () {
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

  const approvedRoles = new Set(["member", "admin"]);
  let currentUser = null;
  let currentProfile = null;

  window.foodBrokerBaseAuth = {
    client,
    getCurrentUser: () => currentUser,
    getCurrentProfile: () => currentProfile,
    getCurrentSession: () => (client ? client.auth.getSession() : Promise.resolve({ data: { session: null } })),
    signOut: () => signOut(),
    openDialog: () => openAuthDialog(),
    openTeamDialog: () => openTeamDialog()
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

  function getDisplayName(user) {
    if (currentProfile?.display_name) return currentProfile.display_name;
    if (!user?.email) return "Logged in";
    return user.email.split("@")[0] || user.email;
  }

  function isApproved() {
    return Boolean(currentUser && approvedRoles.has(currentProfile?.role));
  }

  async function loadCurrentProfile(user = currentUser) {
    currentProfile = null;
    if (!client || !user) return null;

    const { data, error } = await client
      .from("profiles")
      .select("id,email,display_name,role,created_at")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.warn("FoodBrokerBase could not load the signed-in profile.", error);
      return null;
    }

    currentProfile = data || null;
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
    if (currentUser && !isApproved()) label = "Pending";
    if (isApproved()) label = getDisplayName(currentUser);

    document.querySelectorAll(".login-action").forEach((button) => {
      button.textContent = label;
      button.title = currentUser ? `Signed in as ${currentUser.email}` : "Sign in to FoodBrokerBase";
      button.classList.toggle("is-signed-in", isApproved());
      button.classList.toggle("is-pending", Boolean(currentUser && !isApproved()));
    });
    updateAuthGate();
    syncTeamManagementButtons();
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
    gate.querySelector("[data-open-auth-gate]").addEventListener("click", openAuthDialog);
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
      title.textContent = "Waiting for team approval";
      message.textContent =
        "Your account was created, but an administrator must approve it before shared or personal app data can open.";
      button.textContent = "Account";
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
    currentUser = user || null;
    await loadCurrentProfile(currentUser);
    updateLoginButtons();
    notifyAuthChange();
    refreshDialogState();
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
        <p class="auth-help">Sign in to sync this browser with FoodBrokerBase.</p>
        <div class="auth-current-user" id="authCurrentUser"></div>
        <div class="auth-fields">
          <label>
            <span>Email</span>
            <input id="authEmail" type="email" autocomplete="email" placeholder="name@company.com" />
          </label>
          <label>
            <span>Password</span>
            <input id="authPassword" type="password" autocomplete="current-password" />
          </label>
        </div>
        <p class="auth-status" id="authStatus"></p>
        <div class="auth-actions">
          <button class="ghost-action" id="authSignOut" type="button" data-auth-action="signout">Sign Out</button>
          <span></span>
          <button class="ghost-action" id="authSignUp" type="button" data-auth-action="signup">Create Account</button>
          <button class="primary-action" id="authSignIn" type="button" data-auth-action="signin">Sign In</button>
        </div>
      </form>
    `;
    document.body.appendChild(dialog);

    dialog.querySelector("#closeAuthDialog").addEventListener("click", () => dialog.close());
    dialog.querySelector("#authSignIn").addEventListener("click", signIn);
    dialog.querySelector("#authSignUp").addEventListener("click", signUp);
    dialog.querySelector("#authSignOut").addEventListener("click", signOut);
    dialog.querySelector("#authPassword").addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        signIn();
      }
    });

    return dialog;
  }

  function refreshDialogState() {
    const current = document.querySelector("#authCurrentUser");
    const signOutButton = document.querySelector("#authSignOut");
    if (current) {
      if (!currentUser) {
        current.textContent = "Not signed in yet.";
      } else {
        const roleLabel = currentProfile?.role === "admin" ? "Administrator" : currentProfile?.role === "member" ? "Team member" : "Pending approval";
        current.innerHTML = `<strong>Signed in:</strong> ${escapeHtml(currentUser.email)}<br><span>${escapeHtml(roleLabel)}</span>`;
      }
    }
    if (signOutButton) signOutButton.hidden = !currentUser;
  }

  function openAuthDialog() {
    const dialog = ensureDialog();
    refreshDialogState();

    if (!client) {
      setStatus("Supabase did not load. Check your internet connection and refresh the page.", "error");
    } else if (currentUser && !isApproved()) {
      setStatus("This account is waiting for an administrator to approve team access.", "pending");
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
    if (currentProfile?.role !== "admin") return;

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
        <p class="auth-help">Approve new coworkers and choose who can manage team access.</p>
        <p class="team-state" id="teamManagementStatus"></p>
        <div class="team-list" id="teamManagementList"></div>
      </div>
    `;
    document.body.appendChild(dialog);
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
      identity.append(name, email, created);

      const select = document.createElement("select");
      select.className = "team-role-select";
      select.setAttribute("aria-label", `Access role for ${profile.email || "team member"}`);
      [
        ["pending", "Pending"],
        ["member", "Team Member"],
        ["admin", "Administrator"]
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

      row.append(identity, select);
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
    renderTeamProfiles(Array.isArray(data) ? data : []);
    setTeamStatus("");
  }

  function openTeamDialog() {
    if (!client || currentProfile?.role !== "admin") {
      window.alert("Administrator access is required.");
      return;
    }

    const dialog = ensureTeamDialog();
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "open");
    }
    loadTeamProfiles();
  }

  async function signIn() {
    if (!client) {
      setStatus("Supabase did not load. Check your internet connection and refresh the page.", "error");
      return;
    }

    const email = document.querySelector("#authEmail")?.value.trim();
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
  }

  async function signUp() {
    if (!client) {
      setStatus("Supabase did not load. Check your internet connection and refresh the page.", "error");
      return;
    }

    const email = document.querySelector("#authEmail")?.value.trim();
    const password = document.querySelector("#authPassword")?.value;
    if (!email || !password) {
      setStatus("Enter an email and password first.", "error");
      return;
    }

    setBusy(true);
    setStatus("Creating account...");
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) {
      setBusy(false);
      setStatus(error.message, "error");
      return;
    }

    await applyUser(data.user || currentUser);
    setBusy(false);
    setStatus(
      data.session
        ? "Account created. An administrator must approve it before app data opens."
        : "Account created. Check the email inbox to confirm it, then sign in and wait for approval.",
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

    const { data } = await client.auth.getUser();
    await applyUser(data.user || null);

    client.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        applyUser(session?.user || null);
      }, 0);
    });
  }

  ready(init);
})();
