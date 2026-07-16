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

  let currentUser = null;

  window.foodBrokerBaseAuth = {
    client,
    getCurrentUser: () => currentUser,
    getCurrentSession: () => (client ? client.auth.getSession() : Promise.resolve({ data: { session: null } })),
    signOut: () => (client ? client.auth.signOut() : Promise.resolve())
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
    if (!user?.email) return "Logged in";
    return user.email.split("@")[0] || user.email;
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
    const label = currentUser ? getDisplayName(currentUser) : "Login";
    document.querySelectorAll(".login-action").forEach((button) => {
      button.textContent = label;
      button.title = currentUser ? `Signed in as ${currentUser.email}` : "Sign in to FoodBrokerBase";
      button.classList.toggle("is-signed-in", Boolean(currentUser));
    });
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
        <p class="auth-help">Sign in here first. The next setup step will move shared app data into Supabase.</p>
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
      current.innerHTML = currentUser
        ? `<strong>Signed in:</strong> ${escapeHtml(currentUser.email)}`
        : "Not signed in yet.";
    }
    if (signOutButton) signOutButton.hidden = !currentUser;
  }

  function openAuthDialog() {
    const dialog = ensureDialog();
    refreshDialogState();

    if (!client) {
      setStatus("Supabase did not load. Check your internet connection and refresh the page.", "error");
    } else {
      setStatus(currentUser ? "You are signed in." : "Enter your email and password to sign in.", "");
    }

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "open");
    }
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
    setBusy(false);

    if (error) {
      setStatus(error.message, "error");
      return;
    }

    currentUser = data.user || null;
    updateLoginButtons();
    refreshDialogState();
    setStatus("Signed in. Shared database sync is the next setup step.", "success");
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
    setBusy(false);

    if (error) {
      setStatus(error.message, "error");
      return;
    }

    currentUser = data.user || currentUser;
    updateLoginButtons();
    refreshDialogState();
    setStatus("Account created. If Supabase asks for confirmation, check the email inbox.", "success");
  }

  async function signOut() {
    if (!client) return;
    setBusy(true);
    setStatus("Signing out...");
    const { error } = await client.auth.signOut();
    setBusy(false);

    if (error) {
      setStatus(error.message, "error");
      return;
    }

    currentUser = null;
    updateLoginButtons();
    refreshDialogState();
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
    currentUser = data.user || null;
    updateLoginButtons();

    client.auth.onAuthStateChange((_event, session) => {
      currentUser = session?.user || null;
      updateLoginButtons();
      refreshDialogState();
    });
  }

  ready(init);
})();
