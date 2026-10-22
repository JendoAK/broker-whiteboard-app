"use strict";

function isMarketEvent(visit) {
  return visit.type === "testkitchen" || visit.type === "foodshow";
}

function normalizeEventAttendee(person) {
  return { id: person.id || crypto.randomUUID(), name: String(person.name || ""),
    organization: String(person.organization || ""), role: String(person.role || ""),
    contact: String(person.contact || ""), category: String(person.category || "Other") };
}

function normalizeEventProduct(product) {
  return { ...normalizeStockProduct(product), linkedStockId: String(product.linkedStockId || ""),
    notes: String(product.notes || "") };
}

function loadEventProducts() {
  try {
    const value = JSON.parse(localStorage.getItem(eventProductStorageKey) || "[]");
    return Array.isArray(value) ? value.map(normalizeEventProduct) : [];
  } catch { return []; }
}

function persistEventProducts() {
  try {
    localStorage.setItem(eventProductStorageKey, JSON.stringify(eventProducts));
    scheduleCloudSave(eventProductStorageKey);
  } catch (error) {
    window.foodBrokerSaveStatus?.recordError(error, { operation: "Save new event product", section: eventProductStorageKey, localFailure: true });
    throw error;
  }
}

function resolveEventProduct(id) {
  const product = eventProducts.find((item) => item.id === id);
  if (!product) return null;
  const stocked = stockProducts.find((item) => item.id === product.linkedStockId);
  return { ...product, ...(stocked || {}), id: product.id, linkedStockId: stocked?.id || "",
    isNewEventProduct: !stocked, notes: product.notes };
}

function renderEventAttendees(visit) {
  return `<p class="market-section-help">Add visiting distributors and operators, including restaurants and larger organizations. List each attending person and their company.</p>
    <form class="event-entry-grid" data-event-attendee-form>
      <label>Name<input name="name" required placeholder="Attendee name" /></label>
      <label>Company / organization<input name="organization" required placeholder="US Foods, Sysco, restaurant, Holland America…" /></label>
      <label>Attendee type<select name="category"><option>Distributor</option><option>Operator / Restaurant</option><option>Our team</option><option>Vendor</option><option>Other</option></select></label>
      <label>Role<input name="role" placeholder="Sales rep, chef, buyer, manager…" /></label>
      <label>Email / phone<input name="contact" placeholder="Contact details" /></label>
      <button class="small-action" type="submit">Add attendee</button>
    </form>
    <div class="event-table-scroll"><table class="quick-table"><thead><tr><th>Name</th><th>Organization</th><th>Type / role</th><th>Contact</th><th></th></tr></thead><tbody>
      ${visit.attendees.map((person) => `<tr><td>${escapeHtml(person.name)}</td><td>${escapeHtml(person.organization)}</td><td>${escapeHtml([person.category, person.role].filter(Boolean).join(" · "))}</td><td>${escapeHtml(person.contact)}</td><td><button class="edit-card" type="button" data-edit-event-attendee="${escapeAttribute(person.id)}">Edit</button> <button class="remove-product" type="button" data-remove-event-attendee="${escapeAttribute(person.id)}">Remove</button></td></tr>`).join("") || '<tr><td colspan="5">No attendees yet.</td></tr>'}
    </tbody></table></div>`;
}

function renderEventProductFields(product = {}) {
  updateStockVendorSuggestions();
  return `<label>Product description<input name="description" required value="${escapeAttribute(product.description || "")}" /></label>
    <label>Vendor / manufacturer<input name="vendor" data-event-vendor list="stockVendorSuggestions" autocomplete="off" required value="${escapeAttribute(product.vendor || "")}" /></label>
    <label>Manufacturer product number (MF#)<input name="manufacturerNumber" value="${escapeAttribute(product.manufacturerNumber || "")}" placeholder="Optional" /></label>
    <label>Packaging<input name="packaging" value="${escapeAttribute(product.packaging || "")}" placeholder="Case / pack size" /></label>
    <label>Storage<input name="storage" value="${escapeAttribute(product.storage || "")}" placeholder="Frozen, refrigerated, dry…" /></label>
    <label>Product notes<textarea name="notes">${escapeHtml(product.notes || "")}</textarea></label>`;
}

function renderEventProducts(visit) {
  const selected = getMarketVisitProducts(visit);
  const stocked = selected.filter((product) => !product.isNewEventProduct);
  const upcoming = selected.filter((product) => product.isNewEventProduct);
  const available = eventProducts.filter((product) => !(visit.newProductIds || []).includes(product.id) && !visit.productIds.includes(product.linkedStockId));
  return `<div class="quick-list-header"><p class="market-section-help">Select stocked items or add new products without product codes. The new-product library is shared and reusable across events.</p><button class="edit-card market-section-action" data-market-print-products type="button">Print product list</button></div>
    <h4>Stocked products</h4>
    <div class="market-product-add-row"><input data-add-product-search list="marketProductSuggestions" aria-label="Search stocked products" placeholder="Search description, vendor, APN or Sysco code…" /><button class="small-action" data-add-market-product type="button">Add stocked product</button></div>
    <datalist id="marketProductSuggestions">${getMarketProductCandidates(visit).map((product) => `<option value="${escapeAttribute(formatMarketProductOption(product))}"></option>`).join("")}</datalist>
    <div class="market-product-list">${stocked.map((product) => renderEventSelectedProduct(product)).join("") || '<p class="empty-state">No stocked products selected.</p>'}</div>
    <h4>New products — not yet stocked</h4>
    <form class="event-library-picker" data-event-library-form><label>Shared new-product library<select name="productId" required><option value="">Choose a product</option>${available.map((product) => `<option value="${escapeAttribute(product.id)}">${escapeHtml(formatMarketProductOption(product))}${product.linkedStockId ? ' · Linked to stock' : ''}</option>`).join("")}</select></label><button class="small-action" type="submit">Add to event</button></form>
    <div class="market-product-list">${upcoming.map((product) => renderEventSelectedProduct(product)).join("") || '<p class="empty-state">No new products selected.</p>'}</div>
    <details class="market-nested-card"><summary>Create a new product</summary><form class="event-entry-grid" data-event-new-product-form>${renderEventProductFields()}<button class="small-action" type="submit">Save product & add to event</button></form></details>
    ${(visit.newProductIds || []).map((id) => renderEventProductEditor(id)).join("")}`;
}

function renderEventSelectedProduct(product) {
  const eventProduct = eventProducts.some((item) => item.id === product.id);
  return `<div class="market-product-chip"><div><strong>${escapeHtml(product.description)}</strong><span>${escapeHtml([product.vendor, product.packaging, product.storage, product.apn && `APN: ${product.apn}`, product.supc && `Sysco: ${product.supc}`].filter(Boolean).join(" | "))}</span>${product.notes ? `<p>${escapeHtml(product.notes)}</p>` : ""}</div><button class="remove-product" type="button" ${eventProduct ? 'data-remove-event-product' : 'data-remove-market-product'}="${escapeAttribute(product.id)}">Remove from event</button></div>`;
}

function renderEventProductEditor(id) {
  const product = eventProducts.find(item => item.id === id);
  if (!product) return "";
  const linked = stockProducts.find(item => item.id === product.linkedStockId);
  return `<section class="market-nested-card event-product-editor" aria-label="Stock options for ${escapeAttribute(product.description)}">
    <div class="event-stock-heading"><div><strong>${escapeHtml(product.description)}</strong><span>${escapeHtml(product.vendor)}${product.manufacturerNumber ? ' · MF# ' + escapeHtml(product.manufacturerNumber) : ''}</span></div><span class="event-stock-status">${linked ? 'Linked to stock' : 'New · Not yet stocked'}</span></div>
    ${linked ? `<div class="event-stock-connected"><p>Linked to <strong>${escapeHtml(formatMarketProductOption(linked))}</strong>. Stock details now appear in event lists.</p><button class="edit-card" type="button" data-unlink-event-product="${escapeAttribute(id)}">Unlink from stock</button></div>` : `<div class="event-stock-actions">
      <section class="event-stock-option event-stock-add"><h4>Add to stock list</h4><p>Product is now stocked? Choose its distributor and enter the item number.</p><form data-promote-event-product="${escapeAttribute(id)}">
        <label>Distributor<select name="distributor"><option>US Foods Anchorage</option><option>US Foods Southeast</option><option>Sysco</option><option>Linford</option></select></label>
        <div class="event-stock-codes"><label>US Foods APN<input name="apn" placeholder="Optional" /></label><label>Sysco SUPC<input name="supc" placeholder="Optional" /></label></div>
        <button class="event-stock-add-button" type="submit">+ Add to stock list</button></form></section>
      <section class="event-stock-option event-stock-link"><h4>Link an existing item</h4><p>Already on a stock list? Connect it here to avoid a duplicate.</p><form data-link-event-stock="${escapeAttribute(id)}"><label>Matching stocked item<select name="stockId" required><option value="">Choose the matching stock item</option>${stockProducts.map(stock => `<option value="${escapeAttribute(stock.id)}">${escapeHtml(formatMarketProductOption(stock))}</option>`).join('')}</select></label><button class="event-stock-link-button" type="submit">Link existing item</button></form></section>
    </div><details class="event-stock-edit"><summary>Edit product details &amp; notes</summary><form class="event-entry-grid" data-edit-event-product="${escapeAttribute(id)}">${renderEventProductFields(product)}<button class="small-action" type="submit">Save product details</button></form></details>`}
  </section>`;
}

function openEventProductStockOptions(visitId, productId) {
  const visit = marketVisits.find(item => item.id === visitId);
  if (!visit || !eventProducts.some(item => item.id === productId)) return;
  const dialog = createVisitDialog("Product & stock options");
  dialog.classList.add("event-stock-dialog");
  const body = dialog.querySelector("[data-visit-entry-body]");
  const render = () => {
    body.innerHTML = renderEventProductEditor(productId);
    bindMarketEventActions(body, visit);
    body.querySelectorAll("form").forEach(form => {
      let previous;
      form.addEventListener("submit", () => { previous = eventProducts.find(item => item.id === productId); }, true);
      form.addEventListener("submit", () => {
        if (previous !== eventProducts.find(item => item.id === productId)) render();
      });
    });
    body.querySelector("[data-unlink-event-product]")?.addEventListener("click", render);
  };
  render();
  dialog.showModal();
}

document.addEventListener("click", event => {
  const button = event.target.closest("[data-product-stock-options]");
  if (button) openEventProductStockOptions(button.dataset.visitId, button.dataset.productStockOptions);
});

function renderMarketEventDetail(panel, visit) {
  if (visit.type === "foodshow") { renderFoodshow(panel, visit); return; }
  if (visit.type === "testkitchen") { renderCompactTestkitchen(panel, visit); return; }
  const operators = getMarketVisitOperators(visit);
  panel.innerHTML = `<div class="market-detail-header"><div><p class="eyebrow">${escapeHtml(marketVisitTypes[visit.type])} · Shared with team</p><h2>${escapeHtml(visit.name)}</h2><p>${escapeHtml([formatDateRange(visit.startDate, visit.endDate), [visit.startTime, visit.endTime].filter(Boolean).join(" – "), visit.location].filter(Boolean).join(" | "))}</p>${renderAuditStamp(visit)}</div>
    <div class="market-section-actions">${renderPersonalVisitCalendarButton(visit)}<button class="edit-card" data-event-edit type="button">Edit event</button><button class="edit-card" data-detail-print type="button">Print event</button><button class="edit-card" data-detail-close type="button">Back to events</button></div></div>
    <div class="market-detail-tabs event-detail-sections">
      ${visit.type === "testkitchen" ? `<section><h3>Attendees & organizations</h3>${renderEventAttendees(visit)}</section>` : ""}
      <section><h3>Products to show</h3>${renderEventProducts(visit)}</section>
      <section><h3>Notes & leads</h3>${renderMarketNotesSection(visit)}
        <p class="market-section-help">Record each organization's feedback and select products of interest. Notes are shared with the team. Convert to Lead creates a follow-up in your personal Leads section.</p>
        <form class="event-library-picker" data-event-organization-form><label>Distributor / operator / organization<input name="organization" list="eventOrganizationSuggestions" required placeholder="Restaurant, distributor or company name" /></label><button class="small-action" type="submit">Add organization / lead</button></form>
        <datalist id="eventOrganizationSuggestions">${[...new Set(visit.attendees.map((person) => person.organization).filter(Boolean))].map((name) => `<option value="${escapeAttribute(name)}"></option>`).join("")}${renderMarketOperatorSuggestionOptions()}</datalist>
        ${operators.map((operator) => renderMarketOperator(visit, operator)).join("")}
      </section>
    </div>`;
  bindMarketDetailActions(panel, visit);
  bindMarketEventActions(panel, visit);
}

function saveSharedEventProduct(id, patch) {
  const previous = eventProducts;
  eventProducts = eventProducts.map((product) => {
    if (product.id !== id) return product;
    const updated = normalizeEventProduct({ ...product, ...patch, updatedAt: new Date().toISOString() });
    stampSharedRecord(updated, "Updated");
    return updated;
  });
  try { persistEventProducts(); }
  catch (error) { eventProducts = previous; throw error; }
}

function removeEventProduct(visit, id) {
  updateMarketVisit(visit.id, { newProductIds: visit.newProductIds.filter((value) => value !== id),
    operatorLinks: visit.operatorLinks.map((link) => ({ ...link, productIds: link.productIds.filter((value) => value !== id) })) });
}

function bindMarketEventActions(panel, visit) {
  panel.querySelector("[data-event-edit]")?.addEventListener("click", () => openMarketVisitForm(visit));
  const attendeeForm = panel.querySelector("[data-event-attendee-form]");
  attendeeForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(attendeeForm));
    if (!values.name.trim() || !values.organization.trim()) return;
    const attendee = normalizeEventAttendee({ ...values, id: attendeeForm.dataset.editId });
    updateMarketVisit(visit.id, { attendees: attendeeForm.dataset.editId ? visit.attendees.map((person) => person.id === attendee.id ? attendee : person) : [...visit.attendees, attendee] });
  });
  panel.querySelectorAll("[data-edit-event-attendee]").forEach((button) => button.addEventListener("click", () => {
    const attendee = visit.attendees.find((person) => person.id === button.dataset.editEventAttendee);
    if (!attendee || !attendeeForm) return;
    for (const key of ["name", "organization", "category", "role", "contact"]) attendeeForm.elements.namedItem(key).value = attendee[key];
    attendeeForm.dataset.editId = attendee.id;
    attendeeForm.querySelector("button[type=submit]").textContent = "Save attendee";
    attendeeForm.elements.namedItem("name").focus();
  }));
  panel.querySelectorAll("[data-remove-event-attendee]").forEach((button) => button.addEventListener("click", () => updateMarketVisit(visit.id, { attendees: visit.attendees.filter((person) => person.id !== button.dataset.removeEventAttendee) })));
  panel.querySelector("[data-event-organization-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = new FormData(event.currentTarget).get("organization").trim();
    if (!name || isMarketOperatorAlreadyAttached(visit, "", name)) return;
    const address = getMarketOperatorOptions().find((entry) => normalizeOperatorKey(entry.operation) === normalizeOperatorKey(name));
    updateMarketVisit(visit.id, { operatorLinks: [...visit.operatorLinks, normalizeMarketOperatorLink({ operatorId: address?.id || "", operatorName: name, productIds: getMarketVisitProducts(visit).map((product) => product.id) })] });
  });
  panel.querySelector("[data-event-library-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const id = new FormData(event.currentTarget).get("productId");
    if (!eventProducts.some((product) => product.id === id) || visit.newProductIds.includes(id)) return;
    updateMarketVisit(visit.id, { newProductIds: [...visit.newProductIds, id] });
  });
  panel.querySelector("[data-event-new-product-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    productAction(form, async () => {
      const values = Object.fromEntries(new FormData(form));
      if (!values.description.trim() || !values.vendor.trim()) return;
      await saveNewVisitProduct(visit.id, values);
      renderMarketVisits();
    });
  });
  const productAction = async (control, action) => {
    if (control.dataset.savingProduct === 'true') return;
    control.dataset.savingProduct = 'true';
    const submit = control.querySelector('button[type="submit"]');
    if (submit) submit.disabled = true;
    let message = control.querySelector('[data-stock-action-message]');
    if (!message) {
      message = document.createElement('p');
      message.dataset.stockActionMessage = '';
      message.setAttribute('role', 'alert');
      control.append(message);
    }
    message.textContent = '';
    try { await action(); }
    catch (error) {
      if (error.message !== 'duplicate') window.foodBrokerSaveStatus?.recordError(error, { operation: "Save event product changes", section: eventProductStorageKey, localFailure: true });
      message.textContent = error.message === 'duplicate' ? 'This item number is already on a stock list. Use Link existing item instead.' : 'Could not save this change. Your entered details are still here. ' + (error.name === 'QuotaExceededError' ? 'Browser storage is full. Export a backup and remove a large attachment, then try again.' : 'Please try again.');
      console.error('Event product save failed', error);
    } finally {
      delete control.dataset.savingProduct;
      if (submit) submit.disabled = false;
    }
  };
  panel.querySelectorAll("[data-edit-event-product]").forEach(form => form.addEventListener('submit', event => {
    event.preventDefault();
    productAction(form, () => {
      const values = Object.fromEntries(new FormData(form));
      if (!values.description.trim() || !values.vendor.trim()) return;
      values.description = values.description.trim();
      saveSharedEventProduct(form.dataset.editEventProduct, values);
      renderMarketVisits();
    });
  }));
  panel.querySelectorAll("[data-link-event-stock]").forEach(form => form.addEventListener('submit', event => {
    event.preventDefault();
    productAction(form, () => {
      const id = new FormData(form).get('stockId');
      if (!stockProducts.some(product => product.id === id)) return;
      saveSharedEventProduct(form.dataset.linkEventStock, { linkedStockId: id });
      renderMarketVisits();
    });
  }));
  panel.querySelectorAll("[data-promote-event-product]").forEach(form => form.addEventListener('submit', event => {
    event.preventDefault();
    productAction(form, () => {
      const product = eventProducts.find(item => item.id === form.dataset.promoteEventProduct);
      if (!product || product.linkedStockId) return;
      const editor = form.closest('.event-product-editor').querySelector('[data-edit-event-product]');
      if (editor && !editor.reportValidity()) return;
      const details = editor ? Object.fromEntries(new FormData(editor)) : {};
      const values = Object.fromEntries(new FormData(form));
      values.apn = values.apn.trim();
      values.supc = values.supc.trim();
      const duplicate = stockProducts.find(item => (values.apn && item.apn === values.apn) || (values.supc && item.supc === values.supc));
      if (duplicate) throw new Error('duplicate');
      const stocked = normalizeStockProduct({ ...product, ...details, ...values, id: crypto.randomUUID(), linkedStockId: '', createdAt: new Date().toISOString() });
      stampSharedRecord(stocked, 'Created');
      const previous = stockProducts;
      stockProducts = [...stockProducts, stocked];
      if (!persistStockProducts()) { stockProducts = previous; return; }
      try { saveSharedEventProduct(product.id, { ...details, linkedStockId: stocked.id }); }
      catch (error) {
        stockProducts = previous;
        persistStockProducts();
        throw error;
      }
      renderMarketVisits();
    });
  }));
  panel.querySelectorAll("[data-remove-event-product]").forEach(button => button.addEventListener('click', () => removeEventProduct(visit, button.dataset.removeEventProduct)));
  panel.querySelectorAll("[data-unlink-event-product]").forEach(button => button.addEventListener('click', () => {
    productAction(button.closest('.event-product-editor'), () => {
      saveSharedEventProduct(button.dataset.unlinkEventProduct, { linkedStockId: '' });
      renderMarketVisits();
    });
  }));
}

function renderMarketEventPrintDocument(visit, sections) {
  const products = getMarketVisitProducts(visit);
  const productTable = list => renderVisitProductPrintTable(visit.type === "foodshow" ? list.map(product => ({...product, notes: [product.notes, foodshowPrepText(visit, product)].filter(Boolean).join("\n")})) : visit.type === "testkitchen" ? list.map(product => ({...product, notes: visit.productNotes?.[product.id]?.note || ""})) : list, sections.codeMode, visit.type === "testkitchen" ? Boolean(sections.productNotes) : true);
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(visit.name)} — Product list</title><style>${renderPrintBrandStyles()}@page { size: landscape; margin: .4in; } body { font: 12px Arial,sans-serif; color: #211d18; } table { width: 100%; border-collapse: collapse; margin-bottom: 18px; } th,td { border: 1px solid #ccc; padding: 7px; text-align: left; overflow-wrap: anywhere; } th { background: #f5e3df; } tr { break-inside: avoid; } thead { display: table-header-group; } p,td { white-space: pre-wrap; } h2 { font-size: 17px; }</style></head><body>
    ${renderPrintBrandHeader({ title: visit.name, distributorLogo: sections.logo || "none", lines: [visit.type === "foodshow" ? [visit.foodshowFormat, visit.foodshowAudience].filter(Boolean).join(" · ") : marketVisitTypes[visit.type], formatDateRange(visit.startDate, visit.endDate), [visit.startTime, visit.endTime].filter(Boolean).join(" – "), visit.location].filter(Boolean) })}
    ${sections.products ? `<h2>Products by vendor</h2>${productTable(products)}` : ""}
    ${sections.schedule ? `<h2>Attendees & organizations</h2><table><thead><tr><th>Name</th><th>Organization</th><th>Type / role</th><th>Contact</th></tr></thead><tbody>${visit.attendees.map((person) => `<tr>${[person.name, person.organization, [person.category, person.role].filter(Boolean).join(" · "), person.contact].map((value) => `<td>${escapeHtml(value)}</td>`).join("")}</tr>`).join("") || '<tr><td colspan="4">No attendees listed.</td></tr>'}</tbody></table><h2>Notes & leads</h2><p>${escapeHtml(visit.notes)}</p>${getMarketVisitOperators(visit).map((operator) => `<h3>${escapeHtml(getMarketOperatorDisplayName(operator))}</h3><p>${escapeHtml(operator.notes)}</p>${products.filter((product) => operator.productIds.includes(product.id)).map((product) => `<p>${escapeHtml(product.description)}${operator.productNotes?.[product.id]?.note ? `: ${escapeHtml(operator.productNotes[product.id].note)}` : ""}</p>`).join("")}`).join("")}` : ""}
    ${visit.type === "foodshow" && sections.schedule ? renderFoodshowConversationPrint(visit) : ""}</body></html>`;
}

document.addEventListener('focusin', event => {
  if (event.target.matches('[data-event-vendor]')) updateStockVendorSuggestions();
});

// Correct the vendor on the existing shared soup product requested by Jenny.
function correctThaiCurryVendor() {
  let changed = false;
  eventProducts = eventProducts.map(product => {
    const vendor = String(product.vendor || '').toLowerCase().replace(/[^a-z]/g, '');
    const description = String(product.description || '').toLowerCase();
    if (vendor !== 'campbellsculinaryreserve' || String(product.manufacturerNumber || '').trim() !== '29337' || !description.includes('thai red curry')) return product;
    changed = true;
    const updated = {...product, vendor: "Campbell's Foodservice", updatedAt: new Date().toISOString()};
    stampSharedRecord(updated, 'Updated');
    return updated;
  });
  if (changed) persistEventProducts();
}
window.addEventListener('DOMContentLoaded', correctThaiCurryVendor);
