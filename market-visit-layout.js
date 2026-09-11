"use strict";

function formatVisitProductCodes(product) {
  return [`MF#: ${product.manufacturerNumber || '—'}`, product.apn && `APN: ${product.apn}`, product.supc && `SUPC: ${product.supc}`].filter(Boolean).join(' · ');
}

function renderVisitProductPrintTable(products, mode = 'mf', includeNotes = false) {
  const choices = { mf: ['manufacturerNumber'], apn: ['apn'], supc: ['supc'], 'mf-apn': ['manufacturerNumber', 'apn'], 'mf-supc': ['manufacturerNumber', 'supc'], all: ['manufacturerNumber', 'apn', 'supc'] };
  const keys = choices[mode] || choices.mf;
  const labels = { manufacturerNumber: 'MF#', apn: 'US Foods APN', supc: 'Sysco SUPC' };
  const columns = ['vendor', 'description', ...keys, 'packaging', 'storage', ...(includeNotes ? ['notes'] : [])];
  const headers = ['Vendor', 'Product', ...keys.map(key => labels[key]), 'Packaging', 'Storage', ...(includeNotes ? ['Notes'] : [])];
  return `<table><thead><tr>${headers.map(label => `<th>${escapeHtml(label)}</th>`).join('')}</tr></thead><tbody>${products.map(product => `<tr>${columns.map(key => `<td>${escapeHtml(product[key] || '')}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${columns.length}">No products selected.</td></tr>`}</tbody></table>`;
}

function renderMarketArchiveButton(visit) {
  return `<button class="edit-card market-card-action" type="button" data-market-archive="${escapeAttribute(visit.id)}">${visit.archivedAt ? "Restore" : "Archive"}</button>`;
}

function bindMarketArchiveActions(container) {
  container.querySelectorAll("[data-market-archive]").forEach(button => button.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    const visit = marketVisits.find(item => item.id === button.dataset.marketArchive);
    if (!visit) return;
    activeMarketDetailId = "";
    updateMarketVisit(visit.id, { archivedAt: visit.archivedAt ? "" : new Date().toISOString() });
    renderCalendar();
  }));
}

function renderCompactMarketVisit(panel, visit) {
  if (visit.type === "personal") return renderPersonalMarketVisit(panel, visit);
  const products = getMarketVisitProducts(visit);
  const operators = getMarketVisitOperators(visit).sort((a, b) => getMarketOperatorDisplayName(a).localeCompare(getMarketOperatorDisplayName(b)));
  const calls = getMarketVisitCalendarCalls(visit);
  panel.innerHTML = `
    <div class="market-detail-header compact-visit-header">
      <div><p class="eyebrow">${escapeHtml([visit.vendor, formatDateRange(visit.startDate, visit.endDate)].filter(Boolean).join(" · "))}</p>
        <h2>${escapeHtml(getMarketVisitDisplayName(visit))}</h2>
        ${visit.visitorName ? `<p>Regional manager: ${escapeHtml(visit.visitorName)}</p>` : ""}
      </div>
      <div class="table-actions">${renderMarketArchiveButton(visit)}${renderPersonalVisitCalendarButton(visit)}<button class="edit-card" type="button" data-detail-close>Back to Events &amp; Visits</button></div>
    </div>
    ${visit.archivedAt ? `<p class="market-section-help">Archived visit. Restore it to return it to active visits and selected personal calendars.</p>` : ""}
    <div class="compact-visit-actions" role="group" aria-label="Add to visit">
      <button class="primary-action" type="button" data-visit-add-products>Add products</button>
      <button class="primary-action" type="button" data-visit-add-call>Add call</button>
      <button class="primary-action" type="button" data-visit-add-appointment>Add appointment</button>
      <button class="primary-action" type="button" data-visit-add-operator>Add operator</button>
    </div>
    <section class="manufacturer-week-panel">
      <div class="quick-list-header market-calendar-overview-header"><div><h2 class="visit-weekly-heading">Weekly overview</h2></div>${renderMarketCalendarActions(visit)}</div>
      <div class="visit-calendar-full-width">${renderManufacturerWeekGrid(visit)}</div>
    </section>
    <div class="compact-visit-lists market-detail-tabs">
      <section class="visit-products-panel"><h3>Products</h3><div class="section-label-row"><span>${products.length} selected</span><button class="edit-card" type="button" data-view-visit-products="${escapeAttribute(visit.id)}">View product list</button><button class="edit-card" type="button" data-market-print-products="${escapeAttribute(visit.id)}">Print products</button></div>
        <div class="compact-visit-list">${products.length ? products.map(renderMarketProductChip).join("") : `<div class="empty-state">Use Add products to choose what you’re showing.</div>`}</div>
      </section>
      <section class="visit-operators-panel"><h3>Operators</h3><div class="section-label-row"><span>Click an operator for products &amp; notes</span></div>
        <div class="compact-visit-list">${operators.length ? operators.map(operator => `<button class="compact-operator" type="button" data-open-visit-operator="${escapeAttribute(operator.id)}"><strong>${escapeHtml(getMarketOperatorDisplayName(operator))}</strong><span>${(operator.productIds || []).filter(id => products.some(product => product.id === id)).length} products${operator.notes ? " · Notes added" : ""}</span></button>`).join("") : `<div class="empty-state">Operators appear when you add sales calls. You can also add one directly.</div>`}</div>
      </section>
    </div>
    <details class="compact-visit-extra"><summary>Schedule list (${visit.calls.length})</summary>${visit.calls.length ? `<table class="quick-table market-call-table"><thead><tr><th>Date</th><th>Time</th><th>Operator / Appointment</th><th>Location</th><th>Reps</th><th>Notes</th><th></th></tr></thead><tbody>${visit.calls.map(call => renderMarketCallRow(visit, call)).join("")}</tbody></table>` : `<p>No calls scheduled yet.</p>`}</details>
    <details class="compact-visit-extra"><summary>Visit notes${visit.notes ? " · Notes added" : ""}</summary>${renderMarketNotesSection(visit)}</details>`;
  bindMarketDetailActions(panel, visit);
  panel.querySelector("[data-visit-add-products]").onclick = () => openVisitProductsDialog(visit.id);
  panel.querySelector("[data-visit-add-call]").onclick = () => openMarketCallEditor(visit.id, "", "call");
  panel.querySelector("[data-visit-add-appointment]").onclick = () => openMarketCallEditor(visit.id, "", "appointment");
  panel.querySelector("[data-visit-add-operator]").onclick = () => openVisitOperatorDialog(visit.id);
  panel.querySelectorAll("[data-open-visit-operator]").forEach(button => button.onclick = () => openVisitOperatorDialog(visit.id, button.dataset.openVisitOperator));
}

function renderPersonalMarketVisit(panel, visit) {
  const products = getMarketVisitProducts(visit);
  const operators = getMarketVisitOperators(visit);
  panel.innerHTML = `<div class="market-detail-header compact-visit-header"><div><p class="eyebrow">Personal market visit · ${escapeHtml(formatDateRange(visit.startDate, visit.endDate))}</p><h2>${escapeHtml(getMarketVisitDisplayName(visit))}</h2><p>Prepare your products, visit operators, and capture feedback.</p></div><div class="table-actions">${renderMarketArchiveButton(visit)}<button class="edit-card" type="button" data-detail-close>Back to Events &amp; Visits</button></div></div>
  ${visit.archivedAt ? '<p class="market-section-help">Archived visit. Restore it to return it to active visits.</p>' : ''}
  <div class="compact-visit-actions" role="group" aria-label="Add to visit"><button class="primary-action" type="button" data-visit-add-products>Add products</button><button class="primary-action" type="button" data-visit-add-operator>Add operator</button></div>
  <div class="compact-visit-lists market-detail-tabs"><section class="visit-products-panel"><h3>Products (${products.length})</h3><div class="section-label-row"><span>Your product list for this visit</span><button class="edit-card" type="button" data-view-visit-products="${escapeAttribute(visit.id)}">View product list</button><button class="edit-card" type="button" data-market-print-products="${escapeAttribute(visit.id)}">Print products</button></div><div class="compact-visit-list">${products.map(renderMarketProductChip).join('') || '<p class="empty-state">Add the products you plan to show.</p>'}</div></section>
  <section class="visit-operators-panel"><h3>Operators (${operators.length})</h3><div class="section-label-row"><span>Click an operator to select products, write feedback, or create a lead.</span></div><div class="compact-visit-list">${operators.map(operator => `<button class="compact-operator" type="button" data-open-visit-operator="${escapeAttribute(operator.id)}"><strong>${escapeHtml(getMarketOperatorDisplayName(operator))}</strong><span>${(operator.productIds || []).filter(id=>products.some(product=>product.id===id)).length} products${operator.notes || Object.values(operator.productNotes || {}).some(note=>note.note) ? ' · Notes added' : ''} · Products, notes &amp; lead</span></button>`).join('') || '<p class="empty-state">Add an operator to record the products shown and their feedback.</p>'}</div></section></div>
  <details class="compact-visit-extra"><summary>Visit notes${visit.notes ? ' · Notes added' : ''}</summary>${renderMarketNotesSection(visit)}</details>`;
  bindMarketDetailActions(panel, visit);
  panel.querySelector('[data-visit-add-products]').onclick = () => openVisitProductsDialog(visit.id);
  panel.querySelector('[data-visit-add-operator]').onclick = () => openVisitOperatorDialog(visit.id);
  panel.querySelectorAll('[data-open-visit-operator]').forEach(button => button.onclick = () => openVisitOperatorDialog(visit.id, button.dataset.openVisitOperator));
}

function createVisitDialog(title) {
  const dialog = document.createElement("dialog");
  dialog.className = "note-dialog visit-entry-dialog";
  dialog.innerHTML = `<div class="note-form"><div class="form-header"><h2>${escapeHtml(title)}</h2><button class="icon-button" type="button" data-close-visit-entry aria-label="Close">&times;</button></div><div data-visit-entry-body></div></div>`;
  document.body.appendChild(dialog);
  dialog.querySelector("[data-close-visit-entry]").onclick = () => dialog.close();
  dialog.addEventListener("close", () => dialog.remove());
  return dialog;
}

function openVisitProductsDialog(visitId) {
  if (!marketVisits.some(visit => visit.id === visitId)) return;
  const dialog = createVisitDialog("Add products");
  const body = dialog.querySelector("[data-visit-entry-body]");
  body.innerHTML = `<div class="section-label-row"><p>Choose stocked products or shared new products.</p><button class="primary-action" type="button" data-create-visit-product>+ New product</button></div><label><span>Search products, vendor, brand, storage, MF#, APN or SUPC</span><input type="search" data-visit-product-filter /></label><div class="visit-product-choices"></div><p data-visit-product-message role="status"></p><div class="form-actions"><button class="ghost-action" type="button" data-products-done>Done</button><button class="primary-action" type="button" data-save-visit-products>Add selected products</button></div>`;
  const selected = new Set();
  const renderChoices = () => {
    const visit = marketVisits.find(item => item.id === visitId);
    const query = normalizeProductSearchText(body.querySelector("input").value);
    const candidates = visit ? getVisitProductPickerCandidates(visit).filter(product => !query || normalizeProductSearchText([formatMarketProductOption(product), product.brandName, product.storage].filter(Boolean).join(" ")).includes(query)) : [];
    body.querySelector(".visit-product-choices").innerHTML = candidates.map(product => `<label class="visit-product-choice"><input type="checkbox" value="${escapeAttribute(product.id)}" ${selected.has(product.id) ? "checked" : ""} /><span><strong>${escapeHtml(product.description)}</strong><small>${escapeHtml([product.isNewEventProduct ? "New · Not yet stocked" : "Stocked", formatVisitProductCodes(product), product.vendor, product.brandName && `Brand: ${product.brandName}`, product.storage && `Storage: ${product.storage}`, product.packaging].filter(Boolean).join(" · "))}</small></span></label>`).join("") || `<p>No matching products available to add. Use New product to create one.</p>`;
    body.querySelectorAll("input[type=checkbox]").forEach(input => input.onchange = () => { if (input.checked) selected.add(input.value); else selected.delete(input.value); });
  };
  body.querySelector("[data-visit-product-filter]").oninput = renderChoices;
  body.querySelector("[data-products-done]").onclick = () => dialog.close();
  body.querySelector("[data-create-visit-product]").onclick = () => openNewVisitProductDialog(visitId, product => {
    renderChoices();
    body.querySelector("[data-visit-product-message]").textContent = `${product.description} added to this visit and the shared new-product library.`;
  });
  body.querySelector("[data-save-visit-products]").onclick = () => {
    const visit = marketVisits.find(item => item.id === visitId);
    if (!visit) return;
    const candidates = getVisitProductPickerCandidates(visit);
    const available = new Set(candidates.map(product => product.id));
    const added = [...selected].filter(id => available.has(id));
    if (!added.length) { body.querySelector("[data-visit-product-message]").textContent = "Select at least one product to add."; return; }
    const newIds = new Set(candidates.filter(product => product.isNewEventProduct).map(product => product.id));
    updateMarketVisit(visit.id, { productIds: [...visit.productIds, ...added.filter(id => !newIds.has(id))], newProductIds: [...visit.newProductIds, ...added.filter(id => newIds.has(id))] });
    dialog.close();
  };
  renderChoices();
  dialog.showModal();
  body.querySelector("input").focus();
  return dialog;
}

function getVisitProductPickerCandidates(visit) {
  const upcoming = eventProducts.filter(product => !product.linkedStockId && !visit.newProductIds.includes(product.id)).map(product => resolveEventProduct(product.id)).filter(Boolean);
  return [...getMarketProductCandidates(visit), ...upcoming];
}

function openNewVisitProductDialog(visitId, onSave) {
  const visit = marketVisits.find(item => item.id === visitId);
  if (!visit) return;
  const dialog = createVisitDialog("New product — not yet stocked");
  const body = dialog.querySelector("[data-visit-entry-body]");
  body.innerHTML = `<p>No distributor, APN or Sysco code is needed. This product will be available to the team in the shared new-product library.</p><form class="event-entry-grid visit-new-product-form">${renderEventProductFields({ vendor: visit.vendor })}<div class="form-actions"><button class="ghost-action" type="button" data-cancel-new-product>Cancel</button><button class="primary-action" type="submit">Save &amp; add to visit</button></div></form>`;
  body.querySelector("[data-cancel-new-product]").onclick = () => dialog.close();
  body.querySelector("form").onsubmit = event => {
    event.preventDefault();
    const current = marketVisits.find(item => item.id === visitId);
    if (!current) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (!values.description.trim() || !values.vendor.trim()) return;
    const product = normalizeEventProduct({ ...values, description: values.description.trim(), vendor: values.vendor.trim() });
    stampSharedRecord(product, "Created");
    eventProducts = [...eventProducts, product];
    persistEventProducts();
    updateMarketVisit(visitId, { newProductIds: [...current.newProductIds, product.id] });
    dialog.close();
    onSave?.(product);
  };
  dialog.showModal();
}

function openVisitOperatorDialog(visitId, operatorId = "") {
  const visit = marketVisits.find(item => item.id === visitId);
  if (!visit) return;
  const operator = getMarketVisitOperators(visit).find(item => item.id === operatorId);
  if (operatorId && !operator) return;
  const dialog = createVisitDialog(operator ? getMarketOperatorDisplayName(operator) : "Add operator");
  const body = dialog.querySelector("[data-visit-entry-body]");
  if (operator) {
    body.innerHTML = renderMarketOperator(visit, operator);
    const details = body.querySelector("details");
    details.open = true;
    details.querySelector("summary").addEventListener("click", event => event.preventDefault());
    let saved = false;
    body.querySelector("[data-remove-market-operator]").addEventListener("click", event => {
      if (!confirm("Remove this operator and their scheduled sales calls from this visit?")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      saved = true;
    });
    bindMarketDetailActions(body, visit);
    body.querySelector("[data-save-market-operator]").addEventListener("click", () => { saved = true; dialog.close(); });
    body.querySelector("[data-remove-market-operator]").addEventListener("click", () => dialog.close());
    // Closing also saves selected products, alongside the existing automatic note saves.
    dialog.addEventListener("close", () => { if (!saved) saveMarketOperatorDetails(visitId, operatorId, body); });
  } else {
    body.innerHTML = `<form><label><span>Operator / organization</span><input name="operator" list="visitNewOperatorSuggestions" required minlength="2" autocomplete="off" /></label><datalist id="visitNewOperatorSuggestions">${renderMarketOperatorSuggestionOptions()}</datalist><p role="alert" data-operator-error></p><div class="form-actions"><button class="primary-action" type="submit">Add operator</button></div></form>`;
    body.querySelector("form").onsubmit = event => {
      event.preventDefault();
      const current = marketVisits.find(item => item.id === visitId);
      if (!current) return;
      const match = findOrCreateMarketOperator(body.querySelector("input").value);
      if (!match) { body.querySelector("[data-operator-error]").textContent = "Enter the operator’s name, rather than only a distributor name."; return; }
      if (!isMarketOperatorAlreadyAttached(current, match.operatorId, match.operatorName)) updateMarketVisit(visitId, { operatorLinks: [...current.operatorLinks, normalizeMarketOperatorLink({ operatorId: match.operatorId, operatorName: match.operatorName })] });
      dialog.close();
      if (current.type === "personal") {
        const savedVisit = marketVisits.find(item => item.id === visitId);
        const added = getMarketVisitOperators(savedVisit).find(item => item.operatorId === match.operatorId || normalizeOperatorKey(getMarketOperatorDisplayName(item)) === normalizeOperatorKey(match.operatorName));
        if (added) openVisitOperatorDialog(visitId, added.id);
      }
    };
  }
  dialog.showModal();
}

function openVisitProductOverview(visitId) {
  const dialog = createVisitDialog("View product list");
  dialog.style.width = "min(1100px, 94vw)";
  const body = dialog.querySelector('[data-visit-entry-body]');
  body.innerHTML = '<p>Products selected for this event. Use the trashcan to remove an item from the list.</p><input type="search" aria-label="Search event products" placeholder="Search product, brand, storage or product code" style="width:100%;margin-bottom:12px"><div data-product-overview-list></div>';
  const render = () => {
    const visit = marketVisits.find(item => item.id === visitId);
    const query = body.querySelector('input').value.toLowerCase();
    const products = visit ? getMarketVisitProducts(visit).filter(product => [product.description,product.vendor,product.brandName,product.storage,product.apn,product.supc,product.manufacturerNumber].join(' ').toLowerCase().includes(query)) : [];
    body.querySelector('[data-product-overview-list]').innerHTML = products.map(product => '<div class="market-nested-card" style="display:flex;gap:16px;justify-content:space-between;align-items:center;padding:12px;margin-bottom:8px"><div><strong>' + escapeHtml(product.description) + '</strong><div>' + escapeHtml([product.vendor,product.brandName,product.storage,product.packaging,formatVisitProductCodes(product)].filter(Boolean).join(' · ')) + '</div></div><button class="edit-card" type="button" data-overview-remove="' + escapeAttribute(product.id) + '">Remove</button></div>').join('') || '<p>No matching products.</p>';
    body.querySelectorAll('[data-overview-remove]').forEach(button => button.onclick = () => {
      const product = products.find(item => item.id === button.dataset.overviewRemove);
      const current = marketVisits.find(item => item.id === visitId);
      if (!current || !product) return;
      updateMarketVisit(current.id, {
        productIds: current.productIds.filter(id => id !== product.id),
        newProductIds: current.newProductIds.filter(id => id !== product.id),
        operatorLinks: current.operatorLinks.map(link => ({...link, productIds:link.productIds.filter(id => id !== product.id)})),
        calls: current.calls.map(call => ({...call, productIds:call.productIds.filter(id => id !== product.id)}))
      });
      render();
    });
  };
  body.querySelector('input').addEventListener('input',render);
  render(); dialog.showModal();
}
document.addEventListener('click', event => {
  const button = event.target.closest('[data-view-visit-products]');
  if (button) openVisitProductOverview(button.dataset.viewVisitProducts);
});
