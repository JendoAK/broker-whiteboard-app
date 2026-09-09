"use strict";

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
    </div>
    <section class="manufacturer-week-panel">
      <div class="quick-list-header market-calendar-overview-header"><div><p class="eyebrow">Weekly overview</p><h2>Monday to Friday schedule</h2></div>${renderMarketCalendarActions(visit)}</div>
      <div class="manufacturer-calendar-layout">${renderManufacturerWeekGrid(visit, calls[0]?.id || "")}<aside class="market-call-preview" data-market-call-preview>${renderMarketCallPreview(visit, calls[0])}</aside></div>
    </section>
    <div class="compact-visit-lists market-detail-tabs">
      <section><h3>Products</h3><div class="section-label-row"><span>${products.length} selected</span><button class="edit-card" type="button" data-market-print-products="${escapeAttribute(visit.id)}">Print products</button></div>
        <div class="compact-visit-list">${products.length ? products.map(renderMarketProductChip).join("") : `<div class="empty-state">Use Add products to choose what you’re showing.</div>`}</div>
      </section>
      <section><h3>Operators</h3><div class="section-label-row"><span>Click an operator for products &amp; notes</span><button class="edit-card" type="button" data-visit-add-operator>Add operator</button></div>
        <div class="compact-visit-list">${operators.length ? operators.map(operator => `<button class="compact-operator" type="button" data-open-visit-operator="${escapeAttribute(operator.id)}"><strong>${escapeHtml(getMarketOperatorDisplayName(operator))}</strong><span>${(operator.productIds || []).filter(id => products.some(product => product.id === id)).length} products${operator.notes ? " · Notes added" : ""}</span></button>`).join("") : `<div class="empty-state">Operators appear when you add sales calls. You can also add one directly.</div>`}</div>
      </section>
    </div>
    <details class="compact-visit-extra"><summary>Schedule list (${visit.calls.length})</summary>${visit.calls.length ? `<table class="quick-table market-call-table"><thead><tr><th>Date</th><th>Time</th><th>Operator / Appointment</th><th>Location</th><th>Reps</th><th>Notes</th><th></th></tr></thead><tbody>${visit.calls.map(call => renderMarketCallRow(visit, call)).join("")}</tbody></table>` : `<p>No calls scheduled yet.</p>`}</details>
    <details class="compact-visit-extra"><summary>Visit notes${visit.notes ? " · Notes added" : ""}</summary>${renderMarketNotesSection(visit)}<button class="edit-card" type="button" data-detail-followup>Create follow-up</button></details>`;
  bindMarketDetailActions(panel, visit);
  panel.querySelector("[data-visit-add-products]").onclick = () => openVisitProductsDialog(visit.id);
  panel.querySelector("[data-visit-add-call]").onclick = () => openMarketCallEditor(visit.id, "", "call");
  panel.querySelector("[data-visit-add-appointment]").onclick = () => openMarketCallEditor(visit.id, "", "appointment");
  panel.querySelector("[data-visit-add-operator]").onclick = () => openVisitOperatorDialog(visit.id);
  panel.querySelectorAll("[data-open-visit-operator]").forEach(button => button.onclick = () => openVisitOperatorDialog(visit.id, button.dataset.openVisitOperator));
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
  body.innerHTML = `<label><span>Search products, vendor, APN or SUPC</span><input type="search" data-visit-product-filter /></label><div class="visit-product-choices"></div><p data-visit-product-message role="status"></p><div class="form-actions"><button class="primary-action" type="button" data-save-visit-products>Add selected products</button></div>`;
  const selected = new Set();
  const renderChoices = () => {
    const visit = marketVisits.find(item => item.id === visitId);
    const query = normalizeProductSearchText(body.querySelector("input").value);
    const candidates = visit ? getMarketProductCandidates(visit).filter(product => !query || normalizeProductSearchText(formatMarketProductOption(product)).includes(query)) : [];
    body.querySelector(".visit-product-choices").innerHTML = candidates.map(product => `<label class="visit-product-choice"><input type="checkbox" value="${escapeAttribute(product.id)}" ${selected.has(product.id) ? "checked" : ""} /><span><strong>${escapeHtml(product.description)}</strong><small>${escapeHtml([product.apn || product.supc, product.vendor, product.packaging].filter(Boolean).join(" · "))}</small></span></label>`).join("") || `<p>No matching products available to add.</p>`;
    body.querySelectorAll("input[type=checkbox]").forEach(input => input.onchange = () => { if (input.checked) selected.add(input.value); else selected.delete(input.value); });
  };
  body.querySelector("[data-visit-product-filter]").oninput = renderChoices;
  body.querySelector("[data-save-visit-products]").onclick = () => {
    const visit = marketVisits.find(item => item.id === visitId);
    if (!visit) return;
    const available = new Set(getMarketProductCandidates(visit).map(product => product.id));
    const added = [...selected].filter(id => available.has(id));
    if (!added.length) { body.querySelector("[data-visit-product-message]").textContent = "Select at least one product to add."; return; }
    updateMarketVisit(visit.id, { productIds: [...visit.productIds, ...added] });
    dialog.close();
  };
  renderChoices();
  dialog.showModal();
  body.querySelector("input").focus();
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
    };
  }
  dialog.showModal();
}
