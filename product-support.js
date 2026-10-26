(function () {
  "use strict";

  // This page intentionally has no main-app modules or browser business cache.
  // Its only business-data entry points are the restricted Product Support RPCs.
  const $ = id => document.getElementById(id);
  const text = value => String(value == null ? "" : value);
  const esc = value => text(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const normal = value => text(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const fields = ["description", "vendor", "distributor", "distributorNumber", "manufacturerNumber", "apn", "supc", "gtin", "packaging", "storage", "brandName", "brandType", "category", "notes"];
  const csvFields = ["id", "description", "vendor", "distributor", "manufacturerNumber", "apn", "supc", "distributorNumber", "gtin", "packaging", "storage", "brandName", "brandType", "category", "so"];
  const typeNames = { personal: "Market visit", vendor: "Vendor visit", foodshow: "Foodshow", testkitchen: "Test kitchen" };
  const logos = { usFoods: ["us-foods-logo.svg", "US Foods"], sysco: ["sysco-logo.png?v=20260917-official1", "Sysco"], linford: ["linford-logo.svg", "Linford"], qualitySales: ["quality-sales-logo.png", "Quality Sales"] };
  const pageSize = 100;
  const state = { userId: "", generation: 0, request: 0, stock: [], new: [], events: [], selected: new Set(), collection: "stock", schoolOnly: false, visibleLimit: pageSize, date: "upcoming", view: "products", editing: null, attachments: [], attachmentsChanged: false, importRows: [], importRunning: false, saving: false, readingFiles: false, frames: new Set(), eventId: "", loaded: false };
  let labelPrint;

  function auth() { return window.foodBrokerBaseAuth; }
  function allowed() { return Boolean(auth()?.getCurrentUser()?.id && auth()?.getCurrentProfile()?.role === "product_support" && !auth()?.isPasswordRecovery?.()); }
  function valid(generation, uid = state.userId) { return allowed() && generation === state.generation && uid === state.userId && uid === auth()?.getCurrentUser()?.id; }
  function status(message, tone = "", target = "psStatus") { $(target).textContent = message; $(target).dataset.tone = tone; }
  function errorDetails(error, target = "psError") {
    const box = $(target);
    box.hidden = !error;
    if (!error) { box.querySelector("pre").textContent = ""; box.open = false; return; }
    // Keep diagnostic fields, never complete RPC responses or submitted records.
    const clean = value => text(value).replace(/Bearer\s+\S+/gi, "Bearer [redacted]").replace(/\beyJ[\w-]+\.[\w-]+(?:\.[\w-]+)?\b/g, "[token redacted]").replace(/\b(?:sb_secret_\S+|sb_publishable_\S+)\b/g, "[key redacted]").replace(/https?:\/\/[^\s]+/gi, "[URL]").replace(/\b(?:Failing row contains|row contains)\s*\([^)]*\)/gi, "Row [values redacted]").replace(/\bKey\s*\([^)]*\)\s*=\s*\([^)]*\)/gi, "Key [values redacted]").replace(/\{[^{}]*\}/g, "[record details redacted]").slice(0, 900);
    box.querySelector("pre").textContent = [new Date().toISOString(), error.code && "Code: " + clean(error.code), "Message: " + clean(error.message || error), error.details && "Details: " + clean(error.details), error.hint && "Hint: " + clean(error.hint)].filter(Boolean).join("\n");
  }
  function collection() { return state[state.collection]; }
  function key(kind, id) { return kind + ":" + id; }
  function productFromKey(value) { const n = value.indexOf(":"); return state[value.slice(0, n)]?.find(p => text(p.id) === value.slice(n + 1)); }
  function productLocked(p) { return Boolean(p.readOnly || p.linkedStockId || p.stockLockedAt || p.canonicalStockId); }
  function family(p) {
    const d = normal(p.distributor);
    if (/^us\s*foods/.test(d)) return "usFoods";
    if (d.includes("sysco")) return "sysco";
    if (d.includes("linford")) return "linford";
    if (/^quality\s*sales$/.test(d)) return "qualitySales";
    return "other";
  }
  function genericItemNumber(p) { return !["usFoods", "sysco"].includes(family(p)) ? p.distributorNumber : ""; }
  function codes(p) { return [["MF#", p.manufacturerNumber], ["APN", p.apn], ["SUPC", p.supc], ["Item", genericItemNumber(p)]].filter(([, v]) => v).map(([label, v]) => label + " " + v).join(" · "); }
  function description(p) { return p.description || "Untitled product"; }
  function metadata(p) { return [p.vendor, p.brandName, p.distributor, codes(p), p.packaging, p.storage].filter(Boolean).join(" · "); }
  function uniqueValues(items, field) { return [...new Set(items.map(p => text(p[field]).trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)); }
  function schoolFamily(p) {
    const vendor = normal(p.vendor), number = normal(p.manufacturerNumber);
    return vendor && number && !["n/a", "na", "none", "tbd", "seasonal only", "not assigned"].includes(number) && !/^[-\u2013\u2014]+$/.test(number) ? JSON.stringify([vendor, number]) : "id:" + text(p.id);
  }
  function syncDistributorButtons() {
    const current = $("psDistributor").value;
    document.querySelectorAll("[data-ps-distributor]").forEach(button => button.setAttribute("aria-pressed", button.dataset.psDistributor === current ? "true" : "false"));
  }
  function updateSelectionActions() {
    const count = state.selected.size;
    $("psSelectionCount").textContent = count + " product" + (count === 1 ? "" : "s") + " selected for printing";
    $("psSelectionActions").hidden = !count;
    $("psPrepareSelection").disabled = !count;
    $("psClearSelection").disabled = !count;
  }
  function showView(view) {
    if (!allowed()) return;
    state.view = view;
    document.querySelectorAll("[data-view]").forEach(b => { if (b.dataset.view === view) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
    ["products", "events", "printing"].forEach(name => { $("ps" + name[0].toUpperCase() + name.slice(1)).hidden = name !== view; });
    if (view === "events") renderEvents();
    if (view === "printing") updatePrintSummary();
  }
  function clearSensitive() {
    state.generation++; state.request++; state.userId = ""; state.stock = []; state.new = []; state.events = []; state.selected.clear(); state.editing = null; state.attachments = []; state.attachmentsChanged = false; state.importRows = []; state.importRunning = false; state.saving = false; state.readingFiles = false; state.loaded = false; state.eventId = ""; state.collection = "stock"; state.schoolOnly = false; state.visibleLimit = pageSize; state.date = "upcoming"; state.view = "products";
    state.frames.forEach(frame => frame.remove()); state.frames.clear();
    labelPrint?.clear();
    document.querySelectorAll("dialog").forEach(d => d.close());
    $("psProductForm").reset(); $("psProductForm").elements.id.value = "";
    ["psProductList", "psEventList", "psEventBody", "psPrintPreview", "psAttachments", "psImportPreview", "psUser", "psCount", "psSelectionCount", "psVendors", "psCategories", "psPrintSummary"].forEach(id => $(id).replaceChildren());
    ["psSearch", "psEventSearch", "psCsvInput", "psFileInput"].forEach(id => { $(id).value = ""; });
    $("psVendor").innerHTML = '<option value="">All vendors</option>'; $("psDistributor").value = ""; $("psEventType").value = "";
    syncDistributorButtons(); updateSelectionActions(); $("psLoadMore").hidden = true;
    $("psPrintSource").innerHTML = '<option value="selected">Selected products</option><option value="shown">Current product search</option>';
    $("psPrintLogo").value = "none"; $("psPrintHeading").value = "Product presentation";
    $("psPrintFormat").value = "list"; $("psPrintCopies").value = "1";
    document.querySelectorAll("[data-collection]").forEach(b => b.setAttribute("aria-pressed", b.dataset.collection === "stock" ? "true" : "false"));
    document.querySelectorAll("[data-date]").forEach(b => b.setAttribute("aria-pressed", b.dataset.date === "upcoming" ? "true" : "false"));
    document.querySelectorAll("[data-view]").forEach(b => { if(b.dataset.view === "products") b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
    $("psProducts").hidden = false; $("psEvents").hidden = true; $("psPrinting").hidden = true;
    $("psProductForm").querySelectorAll("input,select,textarea,button").forEach(control => {control.disabled = false;});
    $("psCsvInput").disabled = false; $("psRunImport").textContent = "Import products";
    ["psStatus", "psProductStatus", "psImportStatus"].forEach(id => status("", "", id)); errorDetails(null); errorDetails(null, "psProductError");
    $("psWorkspace").hidden = true; $("psAccess").hidden = false; $("psRunImport").disabled = true; $("psSaveProduct").disabled = false;
  }
  function applyAuth() {
    const user = auth()?.getCurrentUser();
    if (!allowed()) {
      clearSensitive();
      $("psAccess").querySelector("h2").textContent = user ? "Product Support access required" : "Sign in to Product Support";
      $("psAccess").querySelector("p").textContent = user ? "This account does not have the Product Support role. Use your approved Product Support login." : "Use your approved work account to maintain products and view event preparation.";
      return;
    }
    if (state.userId === user.id && state.loaded) return;
    if (state.userId !== user.id) { clearSensitive(); state.userId = user.id; }
    $("psUser").textContent = auth().getCurrentProfile().display_name || "Product Support";
    $("psAccess").hidden = true; $("psWorkspace").hidden = false;
    loadWorkspace();
  }
  async function loadWorkspace() {
    if (!allowed()) return;
    labelPrint?.invalidate("Refreshing products · Prepare a new preview when loading finishes.");
    const gen = state.generation, uid = state.userId, request = ++state.request;
    status("Loading shared product lists and event schedules…", "waiting"); errorDetails(null);
    $("psRefresh").disabled = true;
    try {
      const { data, error } = await auth().client.rpc("get_product_support_workspace");
      if (!valid(gen, uid) || request !== state.request) return;
      if (error) throw error;
      if (!data || !Array.isArray(data.stockProducts) || !Array.isArray(data.newProducts) || !Array.isArray(data.events)) throw new Error("The workspace response was incomplete. Please refresh and try again.");
      state.stock = data.stockProducts.map(window.foodBrokerVendors.product); state.new = data.newProducts.map(window.foodBrokerVendors.product); state.events = data.events.map(event => ({...event, vendor:window.foodBrokerVendors.canonical(event.vendor), type: event.type === "pc" ? "personal" : event.type === "manufacturer" ? "vendor" : event.type})); state.loaded = true;
      state.selected = new Set([...state.selected].filter(value => productFromKey(value)));
      refreshFilters(); renderProducts(); renderEvents(); refreshPrintSources();
      status("Up to date");
    } catch (error) {
      if (!valid(gen, uid) || request !== state.request) return;
      status("Could not load the latest workspace. Check your connection and refresh.", "error"); errorDetails(error);
    } finally { if (valid(gen, uid) && request === state.request) $("psRefresh").disabled = false; }
  }
  function refreshFilters() {
    const vendor = $("psVendor").value;
    const vendors = window.foodBrokerVendors.options([...state.stock, ...state.new].map(p=>p.vendor));
    $("psVendor").innerHTML = '<option value="">All vendors</option>' + vendors.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
    if (vendors.includes(vendor)) $("psVendor").value = vendor;
    $("psVendors").innerHTML = window.foodBrokerVendors.names().map(v => `<option value="${esc(v)}"></option>`).join("");
    $("psCategories").innerHTML = uniqueValues(state.stock, "category").map(v => `<option value="${esc(v)}"></option>`).join("");
  }
  function shownProducts() {
    const words = normal($("psSearch").value).split(/\s+/).filter(Boolean), vendor = $("psVendor").value, distributor = $("psDistributor").value;
    const schoolFamilies = state.schoolOnly ? new Set(state.stock.filter(p => p.k12).map(schoolFamily)) : null;
    return collection().filter(p => (!schoolFamilies || schoolFamilies.has(schoolFamily(p))) && (!vendor || p.vendor === vendor) && (!distributor || family(p) === distributor) && words.every(word => normal([description(p), metadata(p), p.gtin, p.category].join(" ")).includes(word)))
      .sort((a, b) => text(a.vendor).trim().localeCompare(text(b.vendor).trim(), undefined, {sensitivity:"base",numeric:true}) || description(a).localeCompare(description(b)));
  }
  function renderProducts() {
    const products = shownProducts(), visible = products.slice(0, state.visibleLimit), remaining = products.length - visible.length;
    $("psCount").textContent = remaining ? "Showing " + visible.length + " of " + products.length + " products" : products.length + " product" + (products.length === 1 ? "" : "s");
    $("psSelectVisible").textContent = "Select shown (" + visible.length + ")"; $("psSelectVisible").disabled = !visible.length;
    $("psLoadMore").hidden = !remaining;
    $("psLoadMore").textContent = "Load " + Math.min(pageSize, remaining) + " more · " + remaining + " remaining";
    updateSelectionActions();
    $("psProductList").innerHTML = visible.map(p => {
      const selectedKey = key(state.collection, p.id), locked = state.collection === "new" && productLocked(p);
      return `<article class="ps-product-row"><input type="checkbox" data-select-product="${esc(selectedKey)}" aria-label="Select ${esc(description(p))} for printing" ${state.selected.has(selectedKey) ? "checked" : ""} /><div class="ps-product-info"><div class="ps-product-name"><h3>${esc(description(p))}</h3><button type="button" data-edit-product="${esc(p.id)}" aria-label="${locked ? "View" : "Edit"} ${esc(description(p))}">${locked ? "View" : "Edit"}</button></div><p>${esc(metadata(p))}</p>${locked ? '<span class="ps-lock">Stocked · New-product details locked</span>' : ""}</div></article>`;
    }).join("") || '<p class="ps-empty">No products match. Try a different search or filter.</p>';
    updatePrintSummary();
  }
  function openProduct(id) {
    if (!allowed() || state.saving) return;
    const p = id ? collection().find(p => text(p.id) === text(id)) : null;
    if (id && !p) return;
    state.editing = { collection: state.collection, original: p, generation: state.generation, uid: state.userId };
    state.attachments = (Array.isArray(p?.attachments) ? p.attachments : []).map(a => ({...a}));
    state.attachmentsChanged = false;
    const form = $("psProductForm"); form.reset();
    form.elements.id.value = p?.id || "";
    const locked = state.collection === "new" && p && productLocked(p);
    fields.forEach(field => {
      const control = form.elements[field];
      control.value = p?.[field] || (field === "distributor" ? state.collection === "stock" ? "US Foods Anchorage" : "Not stocked" : "");
      if (field === "distributor" && p?.[field] && !control.value) { control.add(new Option(p[field], p[field])); control.value = p[field]; }
      control.disabled = Boolean(locked);
    });
    $("psProductDialogTitle").textContent = p ? description(p) : state.collection === "stock" ? "Add stocked product" : "Add new product";
    $("psProductHelp").textContent = locked ? "This new product has moved to stock. Its event-library details remain locked. Maintain the stocked item in Stocked products." : state.collection === "stock" ? !p && state.schoolOnly ? "This new stocked product will be included in K-12 school products and shared with the team." : "Changes update this shared stocked product for the team. Existing event selections stay linked." : "Changes update this shared new product wherever it is used. Product notes describe the product, not customer feedback.";
    document.querySelectorAll("[data-stock-field]").forEach(el => { el.hidden = state.collection !== "stock"; });
    document.querySelectorAll("[data-new-field]").forEach(el => { el.hidden = state.collection !== "new"; });
    $("psSaveProduct").hidden = Boolean(locked); $("psSaveProduct").disabled = false;
    $("psFileInput").value = ""; status("", "", "psProductStatus"); errorDetails(null, "psProductError"); renderAttachments();
    $("psProductDialog").showModal(); if (!locked) form.elements.description.focus();
  }
  function renderAttachments() {
    $("psAttachments").innerHTML = state.attachments.map((file, n) => `<div class="ps-attachment"><span>${esc(file.name)} <small>(${Math.ceil((Number(file.size) || 0) / 1024)} KB)</small></span><select data-attachment-category="${n}" aria-label="Category for ${esc(file.name)}">${["Specsheet", "Coupon", "POS", "Other"].map(c => `<option ${file.category === c ? "selected" : ""}>${c}</option>`).join("")}</select><button type="button" data-download-attachment="${n}">Download</button></div>`).join("") || '<p class="ps-hint">No files attached.</p>';
  }
  function safeData(file) {
    const value = text(file.data);
    const match = /^data:([^;,]+);base64,([A-Za-z0-9+/\s]*={0,2})$/.exec(value);
    if (!match || !/^(application\/(pdf|msword|vnd\.ms-(?:excel|powerpoint)|vnd\.openxmlformats-officedocument\.(?:wordprocessingml\.document|spreadsheetml\.sheet|presentationml\.presentation))|image\/(png|jpeg|webp|gif)|text\/(plain|csv))$/i.test(match[1])) return "";
    return value;
  }
  function download(name, content, mime) {
    const blob = content instanceof Blob ? content : new Blob([content], {type: mime || "text/plain"});
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function downloadAttachment(index) {
    if (!allowed()) return;
    const file = state.attachments[index]; if (!file) return;
    const data = safeData(file);
    if (!data) { status(file.storageId ? "This older file was saved only on another device. Upload a copy here to make it available to the team." : "This file is unavailable or its format cannot be downloaded safely.", "error", "psProductStatus"); return; }
    try {
      const raw = atob(data.slice(data.indexOf(",") + 1)), bytes = Uint8Array.from(raw, c => c.charCodeAt(0));
      download(text(file.name).replace(/[\\/]/g, "_"), new Blob([bytes], {type: "application/octet-stream"}));
    } catch (error) { status("The file could not be downloaded.", "error", "psProductStatus"); errorDetails(error, "psProductError"); }
  }
  async function addFiles(files) {
    const editing = state.editing;
    if (!editing || !valid(editing.generation, editing.uid) || state.saving || state.readingFiles) return;
    state.readingFiles = true; $("psSaveProduct").disabled = true; $("psFileInput").disabled = true;
    const allowedTypes = /\.(pdf|png|jpe?g|webp|gif|txt|csv|docx|xlsx|pptx)$/i;
    try {
      for (const file of files) {
        if (!allowedTypes.test(file.name)) throw new Error("Choose a PDF, image, text, CSV or Office document.");
        if (file.size > 4 * 1024 * 1024) throw new Error(file.name + " exceeds the 4 MB file limit.");
        if (state.attachments.length >= 20) throw new Error("A product can have up to 20 documents.");
        const mimeByExtension = {pdf:"application/pdf",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",webp:"image/webp",gif:"image/gif",txt:"text/plain",csv:"text/csv",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation"};
        const mime = mimeByExtension[file.name.split(".").pop().toLowerCase()];
        const rawData = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(text(reader.result)); reader.onerror = () => reject(new Error("Could not read " + file.name)); reader.readAsDataURL(file); });
        const data = rawData.replace(/^data:[^;,]*;base64,/, "data:" + mime + ";base64,");
        if (!valid(editing.generation, editing.uid) || state.editing !== editing) return;
        const attachment = {id: crypto.randomUUID(), name: file.name, type: mime, size: file.size, data, storageId: "", addedAt: new Date().toISOString(), category: "Specsheet"};
        if (!safeData(attachment)) throw new Error("This file format cannot be attached safely.");
        state.attachments.push(attachment); state.attachmentsChanged = true; renderAttachments();
      }
      status("Files are ready. Save product to upload them to the cloud.", "waiting", "psProductStatus");
    } catch (error) { if (valid(editing.generation, editing.uid)) { status(error.message, "error", "psProductStatus"); errorDetails(error, "psProductError"); } }
    finally { if (valid(editing.generation, editing.uid) && state.editing === editing) { state.readingFiles = false; $("psFileInput").value = ""; $("psFileInput").disabled = false; $("psSaveProduct").disabled = false; } }
  }
  function productPatch(form, kind) {
    const product = {};
    fields.forEach(field => { if (field !== "notes" || kind === "new") product[field] = text(form.elements[field].value).trim(); });
    Object.assign(product, window.foodBrokerVendors.product(product));
    if (form.elements.id.value) product.id = form.elements.id.value;
    if (kind === "new") { delete product.distributorNumber; delete product.distributor; }
    if (kind === "stock") { if (!state.editing?.original && state.schoolOnly) product.k12 = true; if (state.attachmentsChanged) product.attachments = state.attachments.map(a => ({...a})); if (family(product) === "usFoods") product.distributorNumber = product.apn; if (family(product) === "sysco") product.distributorNumber = product.supc; }
    return product;
  }
  async function saveProduct(event) {
    event.preventDefault();
    const editing = state.editing;
    if (!editing || state.saving || state.readingFiles || !valid(editing.generation, editing.uid)) return;
    if (editing.collection === "new" && editing.original && !confirm("Do you really want to edit this shared new product? Changes apply everywhere it is used.")) return;
    const form = $("psProductForm"); if (!form.reportValidity()) return;
    const product = productPatch(form, editing.collection);
    state.saving = true; form.setAttribute("aria-busy", "true"); form.querySelectorAll("input,select,textarea,button").forEach(control => {control.disabled = true;});
    status(navigator.onLine ? "Saving to the cloud…" : "Waiting for a connection. Keep this window open and retry when you are online.", "waiting", "psProductStatus"); errorDetails(null, "psProductError");
    try {
      if (!navigator.onLine) throw new Error("You are offline. Your entries remain in this form; they have not been saved to the cloud.");
      const {data, error} = await auth().client.rpc("save_product_support_product", {collection: editing.collection, product, expected_updated_at: text(editing.original?.updatedAt)});
      if (!valid(editing.generation, editing.uid) || state.editing !== editing) return;
      if (error) throw error;
      if (!data?.id) throw new Error("The cloud did not confirm this save. Refresh the workspace before retrying.");
      applySavedProduct(editing.collection, data); $("psProductDialog").close(); state.editing = null;
      status("Saved to the cloud · " + description(data)); errorDetails(null);
    } catch (error) {
      if (!valid(editing.generation, editing.uid) || state.editing !== editing) return;
      const conflict = /conflict|changed|refresh|another/i.test(text(error.message));
      status(conflict ? "This product changed since you opened it. Your entries are still here. Close this window, refresh, and reopen the latest product before saving." : "Product was not saved. Your entries are still here; check your connection and retry.", "error", "psProductStatus"); errorDetails(error, "psProductError");
    } finally {
      if (valid(editing.generation, editing.uid)) { state.saving = false; form.removeAttribute("aria-busy"); form.querySelectorAll("input,select,textarea,button").forEach(control => {control.disabled = false;}); }
    }
  }
  function applySavedProduct(kind, product) {
    product = window.foodBrokerVendors.product(product);
    const index = state[kind].findIndex(p => p.id === product.id);
    if (index < 0) state[kind].push(product); else state[kind][index] = product;
    refreshFilters(); renderProducts(); updatePrintSummary();
  }
  function localDate(value) { const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text(value)); return match ? new Date(+match[1], +match[2] - 1, +match[3], 12) : null; }
  function dateText(value) { const d = localDate(value); return d ? d.toLocaleDateString(undefined, {month:"short", day:"numeric", year:"numeric"}) : text(value); }
  function eventDate(event) { return event.startDate || event.date || ""; }
  function eventDateRange(event) { const start = dateText(eventDate(event)), end = dateText(event.endDate); return start + (end && end !== start ? " – " + end : ""); }
  function eventProducts(event) {
    const stockIds = (Array.isArray(event.productIds) ? event.productIds : []).map(text), newIds = (Array.isArray(event.newProductIds) ? event.newProductIds : []).map(text);
    const products = [...stockIds.map(id => state.stock.find(p => text(p.id) === id) || state.new.find(p => text(p.id) === id)), ...newIds.map(id => state.new.find(p => text(p.id) === id) || state.stock.find(p => text(p.id) === id))].filter(Boolean);
    const canonical = products.map(p => p.linkedStockId ? state.stock.find(s => text(s.id) === text(p.linkedStockId)) || p : p);
    return [...new Map(canonical.map(p => [key(state.stock.includes(p)?"stock":"new",p.id), p])).values()];
  }
  function renderEvents() {
    const now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate()), weekStart = new Date(today);
    weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
    const search = normal($("psEventSearch").value), type = $("psEventType").value;
    const events = state.events.filter(event => {
      if (type && event.type !== type) return false;
      if (search && !normal([event.name, event.vendor, event.location].join(" ")).includes(search)) return false;
      const start = localDate(eventDate(event)), end = localDate(event.endDate || eventDate(event));
      if (!start || !end) return state.date === "all";
      if (state.date === "upcoming") return end >= today;
      if (state.date === "past") return end < today;
      if (state.date === "week") return start < weekEnd && end >= weekStart;
      if (state.date === "month") return start < new Date(today.getFullYear(), today.getMonth() + 1, 1) && end >= new Date(today.getFullYear(), today.getMonth(), 1);
      return true;
    }).sort((a, b) => state.date === "past" ? eventDate(b).localeCompare(eventDate(a)) : eventDate(a).localeCompare(eventDate(b)));
    $("psEventList").innerHTML = events.map(event => `<button type="button" class="ps-event-card" data-event-id="${esc(event.id)}"><span class="eyebrow">${esc(typeNames[event.type] || "Event")}</span><strong>${esc(event.name || "Event")}</strong><span class="ps-event-date">${esc(eventDateRange(event))}</span><span>${esc(event.location || "Location to be confirmed")}</span><span>${eventProducts(event).length} products · View schedule</span></button>`).join("") || '<p class="ps-empty">No events match these filters.</p>';
  }
  function openEvent(id) {
    if (!allowed()) return;
    const event = state.events.find(e => text(e.id) === id); if (!event) return;
    state.eventId = id; const products = eventProducts(event);
    $("psEventDialogTitle").textContent = event.name || "Event";
    const reps = Array.isArray(event.salesReps) ? event.salesReps.join(", ") : event.salesReps;
    const calls = Array.isArray(event.calls) ? event.calls : [];
    $("psEventBody").innerHTML = `<div class="ps-event-detail"><p><strong>${esc(typeNames[event.type] || "Event")}</strong><br>${esc(eventDateRange(event))} ${esc([event.startTime, event.endTime].filter(Boolean).join(" – "))}</p><p>${esc(event.location || "Location to be confirmed")}${reps ? "<br>Team: " + esc(reps) : ""}</p></div>${calls.length ? `<h3>Schedule</h3><ul class="ps-schedule">${calls.slice().sort((a, b) => text(a.date).localeCompare(text(b.date)) || text(a.startTime).localeCompare(text(b.startTime))).map(call => `<li><div>${esc(dateText(call.date))}<small>${esc([call.startTime, call.endTime].filter(Boolean).join(" – "))}</small></div><div><strong>${esc(call.title || call.operatorName || "Appointment")}</strong>${call.location ? "<small>" + esc(call.location) + "</small>" : ""}</div></li>`).join("")}</ul>` : ""}<h3>Product lineup (${products.length})</h3><div class="ps-product-list">${products.map(p => `<article class="ps-product-row"><span aria-hidden="true">•</span><div><h3>${esc(description(p))}</h3><p>${esc(metadata(p))}</p></div></article>`).join("") || '<p class="ps-empty">No products have been added to this event.</p>'}</div>`;
    $("psPrintEvent").disabled = !products.length; $("psEventDialog").showModal();
  }
  function renderPrintSources() {
    if(!allowed())return;
    const current = $("psPrintSource").value;
    $("psPrintSource").innerHTML = '<option value="selected">Selected products</option><option value="shown">Current product search</option>' + window.foodBrokerSupportLabels.printableEvents(state.events).map(e => `<option value="event:${esc(e.id)}">${esc(e.name || "Event")} · ${esc(dateText(eventDate(e) || e.endDate))}</option>`).join("");
    if ([...$("psPrintSource").options].some(o => o.value === current)) $("psPrintSource").value = current;
  }
  function refreshPrintSources() {updatePrintSummary();}
  function printProducts() {
    const source = $("psPrintSource").value;
    if (source === "shown") return shownProducts();
    if (source.startsWith("event:")) { const event = state.events.find(e => text(e.id) === source.slice(6)); return window.foodBrokerSupportLabels.isPrintableEvent(event) ? eventProducts(event) : []; }
    const products = [...state.selected].map(productFromKey).filter(Boolean).map(p => p.linkedStockId ? state.stock.find(s => s.id === p.linkedStockId) || p : p);
    return [...new Map(products.map(p => [key(state.stock.includes(p)?"stock":"new",p.id), p])).values()];
  }
  function renderPrintCount() {const count=labelPrint?.getProducts().length || 0; $("psPrintSummary").textContent=count+" product"+(count===1?"":"s")+" selected to print. "+($("psPrintFormat").value==="labels"?"One label per product is the default. Choose products below; edit individual wording, logos and quantities in Label setup.":"Choose products below and a distributor logo before printing.");}
  function updatePrintSummary() {labelPrint?.sync();renderPrintCount();}
  function asset(value) { return new URL(value, window.location.href).href; }
  function logoMarkup(choice) { return `<div class="ps-preview-logos"><img src="${esc(asset("vendor-logos/pierce-cartwright.png"))}" alt="Pierce Cartwright" />${logos[choice] ? `<img src="${esc(asset(logos[choice][0]))}" alt="${esc(logos[choice][1])}" />` : ""}</div>`; }
  function printMarkup(products, format, logo, heading, copies) {
    const hasGenericItems = products.some(p => genericItemNumber(p));
    if (format === "list") return `<section class="ps-sheet-preview">${logoMarkup(logo)}<h2>${esc(heading)}</h2><p>${products.length} products · ${esc(new Date().toLocaleDateString())}</p><table class="ps-preview-table"><thead><tr><th>Product</th><th>Vendor / brand</th><th>MF#</th><th>APN</th><th>SUPC</th>${hasGenericItems ? "<th>Item #</th>" : ""}<th>Pack / storage</th></tr></thead><tbody>${products.map(p => `<tr><td>${esc(description(p))}</td><td>${esc([p.vendor,p.brandName].filter(Boolean).join(" · "))}</td><td>${esc(p.manufacturerNumber)}</td><td>${esc(p.apn)}</td><td>${esc(p.supc)}</td>${hasGenericItems ? `<td>${esc(genericItemNumber(p))}</td>` : ""}<td>${esc([p.packaging,p.storage].filter(Boolean).join(" · "))}</td></tr>`).join("")}</tbody></table></section>`;
    const labels = products.flatMap(p => Array.from({length: copies}, () => `<article class="ps-preview-label">${logoMarkup(logo)}<div><p>${esc([p.vendor,p.brandName].filter(Boolean).join(" · "))}</p><h3>${esc(description(p))}</h3><p>${esc(codes(p))}</p><p>${esc([p.packaging,p.storage].filter(Boolean).join(" · "))}</p></div></article>`));
    if (format === "cards") return labels.map(label => `<section class="ps-sheet-preview ps-preview-cards">${label}</section>`).join("");
    const pages = []; for (let i = 0; i < labels.length; i += 10) pages.push(`<section class="ps-sheet-preview"><div class="ps-preview-label-grid">${labels.slice(i,i+10).join("")}</div></section>`); return pages.join("");
  }
  function preparePrint() {
    if (!allowed()) return;
    if ($("psPrintFormat").value === "labels") {labelPrint.prepare();return;}
    labelPrint.sync();
    const products = labelPrint.getProducts(), format = $("psPrintFormat").value, logo = $("psPrintLogo").value, heading = $("psPrintHeading").value.trim() || "Product presentation", copies = Math.max(1, Math.min(20, Number($("psPrintCopies").value) || 1));
    if (!products.length) { status("Choose products or an event lineup before printing.", "waiting"); return; }
    if (products.length * (format === "list" ? 1 : copies) > 1000) { status("Choose no more than 1,000 products or labels per print job. Narrow the search or reduce copies.", "error"); return; }
    labelPrint.invalidate();
    const markup = printMarkup(products, format, logo, heading, copies);
    $("psPrintPreview").innerHTML = `<div class="ps-dialog-actions ps-preview-actions"><button type="button" id="psPrintNow" class="primary-action">Print this preview</button></div>${markup}`;
    const revision = labelPrint.getRevision();
    $("psPrintNow").addEventListener("click", () => {if(revision === labelPrint.getRevision())sendToPrinter(markup, format, heading, revision);});
    status("Preview ready · Check the format and logo, then print.");
  }
  function sendToPrinter(markup, format, heading, revision) {
    if (!allowed()) return;
    updatePrintSummary();
    if(revision!==labelPrint.getRevision())return;
    const gen = state.generation, uid = state.userId, frame = document.createElement("iframe");
    frame.title = "Product print preview"; frame.style.cssText = "position:fixed;width:1px;height:1px;left:-10000px;border:0"; state.frames.add(frame);
    const dimensions = format === "labels" ? "@page{size:letter portrait;margin:.5in .15625in}.ps-sheet-preview{break-after:page}.ps-preview-label-grid{display:grid;grid-template-columns:4in 4in;column-gap:.1875in;row-gap:0}.ps-preview-label{width:4in;height:2in;padding:.12in .16in;overflow:hidden;box-sizing:border-box}.ps-preview-label h3{font-size:12pt}.ps-preview-label p{font-size:8pt}" : format === "cards" ? "@page{size:letter portrait;margin:.5in}.ps-sheet-preview{break-after:page}.ps-preview-label{width:6in;height:4in;border:1px dashed #aaa;padding:.25in;margin:auto;overflow:hidden;box-sizing:border-box}.ps-preview-label h3{font-size:23pt}.ps-preview-label p{font-size:12pt}" : "@page{size:letter portrait;margin:.5in}thead{display:table-header-group}tr{break-inside:avoid}";
    frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(heading)}</title><style>body{font-family:Arial,sans-serif;margin:0;color:#203d39}*{box-sizing:border-box}h2{font-size:17pt}h3,p{margin:4px 0}.ps-preview-logos{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.ps-preview-logos img{height:34px;max-width:105px;object-fit:contain}.ps-preview-label{display:flex;flex-direction:column;justify-content:space-between;break-inside:avoid;overflow-wrap:anywhere}.ps-preview-label .ps-preview-logos{margin:0}.ps-preview-label .ps-preview-logos img{height:20px;max-width:80px}.ps-preview-table{border-collapse:collapse;width:100%;font-size:9pt}.ps-preview-table th,.ps-preview-table td{border:1px solid #c5cfc7;padding:6px;text-align:left;overflow-wrap:anywhere}.ps-preview-table th{background:#f6dc83}.ps-sheet-preview:last-child{break-after:auto}${dimensions}</style></head><body>${markup}</body></html>`;
    frame.onload = async () => {
      try {
        await Promise.race([Promise.all([frame.contentDocument.fonts.ready,...[...frame.contentDocument.images].map(image=>image.decode())]),new Promise((_,reject)=>setTimeout(()=>reject(new Error("A print logo did not finish loading. Choose No distributor logo or try again.")),8000))]);
        if (!valid(gen, uid) || revision !== labelPrint.getRevision()) { frame.remove(); state.frames.delete(frame); return; }
        frame.contentWindow.addEventListener("afterprint", () => {frame.remove(); state.frames.delete(frame);}, {once:true});
        frame.contentWindow.focus(); frame.contentWindow.print();
      } catch(error) {frame.remove();state.frames.delete(frame);if(valid(gen,uid) && revision===labelPrint.getRevision()){labelPrint.recordError(error,"PRODUCT_DOCUMENT_PRINT");status(error.message || "Printing could not start. The error details are kept below.","error");}}
    };
    document.body.appendChild(frame);
  }
  function parseCsv(source) {
    const rows = [], row = []; let cell = "", quoted = false;
    for (let i=0; i<source.length; i++) { const c=source[i]; if(c==='"'){if(quoted&&source[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===","&&!quoted){row.push(cell);cell="";}else if((c==="\n"||c==="\r")&&!quoted){if(c==="\r"&&source[i+1]==="\n")i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row.splice(0));else row.length=0;cell="";}else cell+=c; }
    if(quoted)throw new Error("A quoted CSV field is missing its closing quote.");row.push(cell);if(row.some(v=>v.trim()))rows.push(row);
    if(rows.length<2)throw new Error("The CSV needs a header and at least one product row.");
    const aliases={description:"description",productdescription:"description",vendor:"vendor",manufacturer:"vendor",distributor:"distributor",id:"id",apn:"apn",usf:"apn",usfoods:"apn",supc:"supc",sysco:"supc",linfordnumber:"linfordNumber",linforditemnumber:"linfordNumber",linforditem:"linfordNumber",linford:"linfordNumber",qualitysalesnumber:"qualitySalesNumber",qualitysalesitemnumber:"qualitySalesNumber",qualitysalesitem:"qualitySalesNumber",qsnumber:"qualitySalesNumber",distributornumber:"distributorNumber",distributoritemnumber:"distributorNumber",itemnumber:"distributorNumber",item:"distributorNumber",manufacturernumber:"manufacturerNumber",manufacturerproductnumber:"manufacturerNumber",mfr:"manufacturerNumber",mf:"manufacturerNumber",upc:"manufacturerNumber",gtin:"gtin",packaging:"packaging",storage:"storage",brandname:"brandName",brandtype:"brandType",category:"category",specialorder:"so",so:"so"};
    const headers=rows.shift().map(h=>aliases[h.replace(/^\uFEFF/,"").trim().toLowerCase().replace(/[^a-z0-9]/g,"")]||""); if(!["description","vendor"].every(h=>headers.includes(h)))throw new Error("Use the template headers: Description and Vendor are required.");
    if(rows.length>500)throw new Error("Import up to 500 products at a time.");
    return rows.map((values,i)=>{
      const p={};headers.forEach((h,n)=>{if(csvFields.includes(h)||h==="linfordNumber"||h==="qualitySalesNumber")p[h]=text(values[n]).trim();});
      p.distributor=p.distributor||$("psImportDistributor").value;
      if(!p.description||!p.vendor||!p.distributor)throw new Error("Row "+(i+2)+" needs a description, vendor and distributor.");
      const group=family(p);
      const number=group==="linford"?p.linfordNumber:group==="qualitySales"?p.qualitySalesNumber:group==="usFoods"?p.apn:group==="sysco"?p.supc:"";
      if(number)p.distributorNumber=number;
      delete p.linfordNumber;delete p.qualitySalesNumber;
      if(p.so)p.so=/^(yes|y|true|1|so)$/i.test(p.so)?"Yes":"";
      return window.foodBrokerVendors.product(p);
    });
  }
  async function readCsv(file) {
    const gen=state.generation,uid=state.userId;state.importRows=[];$("psRunImport").disabled=true;
    try{if(!file)return;if(file.size>2*1024*1024)throw new Error("Choose a CSV under 2 MB.");const rows=parseCsv(await file.text());if(!valid(gen,uid))return;state.importRows=rows;$("psImportPreview").innerHTML='<div class="ps-import-preview"><table class="ps-preview-table"><thead><tr><th>Action</th><th>Product</th><th>Vendor</th><th>Distributor</th></tr></thead><tbody>'+rows.slice(0,20).map(p=>`<tr><td>${p.id?"Update":"Add"}</td><td>${esc(p.description)}</td><td>${esc(p.vendor)}</td><td>${esc(p.distributor)}</td></tr>`).join("")+'</tbody></table></div>';status(rows.length+" products ready · Preview shows the first 20. No changes have been saved yet.","waiting","psImportStatus");$("psRunImport").disabled=false;}catch(error){if(valid(gen,uid)){status(error.message,"error","psImportStatus");$("psImportPreview").replaceChildren();}}
  }
  async function runImport() {
    if(!allowed()||state.importRunning||!state.importRows.length)return;
    const gen=state.generation,uid=state.userId,rows=state.importRows.map(p=>({...p}));state.importRunning=true;$("psRunImport").disabled=true;$("psCsvInput").disabled=true;
    const failed=[];let saved=0;
    for(let i=0;i<rows.length;i++){
      if(!valid(gen,uid))break;const p=rows[i];status("Saving product "+(i+1)+" of "+rows.length+"…","waiting","psImportStatus");
      try{if(!navigator.onLine)throw new Error("Offline");const existing=p.id?state.stock.find(s=>s.id===p.id):null;if(p.id&&!existing)throw new Error("Product ID is not in the current stock list.");const {data,error}=await auth().client.rpc("save_product_support_product",{collection:"stock",product:p,expected_updated_at:text(existing?.updatedAt)});if(!valid(gen,uid))break;if(error)throw error;if(!data?.id)throw new Error("Save was not confirmed.");applySavedProduct("stock",data);saved++;}catch(error){failed.push({row:i+2,message:text(error.message||error).slice(0,240),product:p});if(!navigator.onLine){rows.slice(i+1).forEach((product,j)=>failed.push({row:i+j+3,message:"Not attempted while offline",product}));break;}}
    }
    if(!valid(gen,uid))return;state.importRows=failed.map(f=>f.product);state.importRunning=false;$("psCsvInput").disabled=false;$("psRunImport").disabled=!failed.length;$("psRunImport").textContent=failed.length?"Retry remaining products":"Import products";status(saved+" saved to the cloud"+(failed.length?" · "+failed.length+" not saved. Only these rows will be retried.":" · Import complete."),failed.length?"error":"","psImportStatus");$("psImportPreview").innerHTML=failed.length?'<ul>'+failed.slice(0,50).map(f=>'<li>CSV row '+f.row+': '+esc(f.message)+'</li>').join("")+'</ul>':'';
  }
  function init() {
    labelPrint = window.foodBrokerSupportLabels.create({allowed,identity:()=>({generation:state.generation,userId:state.userId}),valid:identity=>valid(identity.generation,identity.userId),beforeSync:renderPrintSources,getProducts:printProducts,productKey:p=>key(state.stock.includes(p)?"stock":"new",p.id),itemNumber:genericItemNumber,status,selectionChanged:renderPrintCount,frames:state.frames});
    document.querySelectorAll("[data-view]").forEach(button=>button.addEventListener("click",()=>showView(button.dataset.view)));
    document.querySelectorAll("[data-collection]").forEach(button=>button.addEventListener("click",()=>{state.schoolOnly=button.dataset.collection==="school";state.collection=state.schoolOnly?"stock":button.dataset.collection;state.visibleLimit=pageSize;if(state.schoolOnly){$("psDistributor").value="";syncDistributorButtons();}document.querySelectorAll("[data-collection]").forEach(b=>b.setAttribute("aria-pressed",b===button?"true":"false"));renderProducts();}));
    document.querySelectorAll("[data-ps-distributor]").forEach(button=>button.addEventListener("click",()=>{$("psDistributor").value=button.dataset.psDistributor;state.visibleLimit=pageSize;syncDistributorButtons();renderProducts();}));
    document.querySelectorAll("[data-date]").forEach(button=>button.addEventListener("click",()=>{state.date=button.dataset.date;document.querySelectorAll("[data-date]").forEach(b=>b.setAttribute("aria-pressed",b===button?"true":"false"));renderEvents();}));
    ["psSearch","psVendor","psDistributor"].forEach(id=>$(id).addEventListener(id==="psSearch"?"input":"change",()=>{state.visibleLimit=pageSize;if(id==="psDistributor")syncDistributorButtons();renderProducts();}));
    ["psEventSearch","psEventType"].forEach(id=>$(id).addEventListener(id==="psEventSearch"?"input":"change",renderEvents));
    $("psProductList").addEventListener("click",event=>{const button=event.target.closest("[data-edit-product]");if(button)openProduct(button.dataset.editProduct);});
    $("psProductList").addEventListener("change",event=>{const input=event.target.closest("[data-select-product]");if(!input)return;if(input.checked)state.selected.add(input.dataset.selectProduct);else state.selected.delete(input.dataset.selectProduct);updateSelectionActions();updatePrintSummary();});
    $("psSelectVisible").addEventListener("click",()=>{shownProducts().slice(0,state.visibleLimit).forEach(p=>state.selected.add(key(state.collection,p.id)));renderProducts();});
    $("psClearSelection").addEventListener("click",()=>{state.selected.clear();renderProducts();});
    $("psPrepareSelection").addEventListener("click",()=>{if(!allowed()||!state.selected.size)return;$("psPrintSource").value="selected";showView("printing");});
    $("psLoadMore").addEventListener("click",()=>{state.visibleLimit+=pageSize;renderProducts();});
    $("psAdd").addEventListener("click",()=>openProduct()); $("psProductForm").addEventListener("submit",saveProduct);
    $("psFileInput").addEventListener("change",event=>addFiles([...event.target.files]));
    $("psAttachments").addEventListener("click",event=>{const button=event.target.closest("[data-download-attachment]");if(button)downloadAttachment(Number(button.dataset.downloadAttachment));});
    $("psAttachments").addEventListener("change",event=>{const select=event.target.closest("[data-attachment-category]");if(select&&state.attachments[Number(select.dataset.attachmentCategory)]){state.attachments[Number(select.dataset.attachmentCategory)].category=select.value;state.attachmentsChanged=true;}});
    $("psEventList").addEventListener("click",event=>{const button=event.target.closest("[data-event-id]");if(button)openEvent(button.dataset.eventId);});
    $("psPrintEvent").addEventListener("click",()=>{const event=state.events.find(e=>text(e.id)===state.eventId);if(!event)return;$("psEventDialog").close();if(window.foodBrokerSupportLabels.isPrintableEvent(event))$("psPrintSource").value="event:"+event.id;else{state.selected=new Set(eventProducts(event).map(product=>key(state.stock.includes(product)?"stock":"new",product.id)));updateSelectionActions();$("psPrintSource").value="selected";}$("psPrintHeading").value=event.name||"Product presentation";$("psPrintFormat").value="labels";showView("printing");});
    $("psPreparePrint").addEventListener("click",preparePrint); $("psPrintSource").addEventListener("change",updatePrintSummary);
    $("psPrintSource").addEventListener("focus",updatePrintSummary);
    $("psPrintFormat").addEventListener("change",updatePrintSummary);
    $("psRefresh").addEventListener("click",()=>{if(document.querySelector("dialog[open]")){status("Close the open window before refreshing so your entries stay intact.","waiting");return;}loadWorkspace();});
    $("psSignIn").addEventListener("click",()=>auth()?.openDialog());
    document.querySelectorAll("[data-close-dialog]").forEach(button=>button.addEventListener("click",()=>{const dialog=button.closest("dialog");if((dialog.id==="psProductDialog"&&(state.saving||state.readingFiles))||(dialog.id==="psImportDialog"&&state.importRunning))return;dialog.close();}));
    $("psProductDialog").addEventListener("cancel",event=>{if(state.saving||state.readingFiles)event.preventDefault();}); $("psImportDialog").addEventListener("cancel",event=>{if(state.importRunning)event.preventDefault();});
    $("psImport").addEventListener("click",()=>{if(!allowed())return;$("psImportDialog").showModal();});
    $("psCsvTemplate").addEventListener("click",()=>download("stock-product-template.csv",csvFields.join(",")+"\r\n", "text/csv;charset=utf-8"));
    $("psCsvInput").addEventListener("change",event=>readCsv(event.target.files[0]));$("psRunImport").addEventListener("click",runImport);
    $("psImportDistributor").addEventListener("change",()=>{if(!state.importRunning)readCsv($("psCsvInput").files[0]);});
    window.addEventListener("foodbrokerbase:auth-checking",clearSensitive);
    window.addEventListener("foodbrokerbase:auth",applyAuth);applyAuth();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
