"use strict";

function renderCompactTestkitchen(panel, visit) {
  const products = getMarketVisitProducts(visit);
  const operators = getMarketVisitOperators(visit);
  panel.innerHTML = `<div class="compact-visit-header market-detail-header"><div><p class="eyebrow">Testkitchen · Shared with team</p><h2>${escapeHtml(visit.name)}</h2><p>${escapeHtml([formatDateRange(visit.startDate, visit.endDate), [visit.startTime, visit.endTime].filter(Boolean).join(' – '), visit.location].filter(Boolean).join(' · '))}</p></div><div class="table-actions">${renderPersonalVisitCalendarButton(visit)}<button class="edit-card" type="button" data-event-edit>Edit event</button><button class="edit-card" type="button" data-detail-print>Print event</button><button class="edit-card" type="button" data-detail-close>Back to events</button></div></div>
    <div class="compact-visit-actions"><button class="primary-action" type="button" data-kitchen-attendees>Add attendees</button><button class="primary-action" type="button" data-kitchen-products>Add products</button><button class="primary-action" type="button" data-kitchen-operator>Add organization</button></div>
    <div class="compact-visit-lists market-detail-tabs kitchen-lists">
      <section><h3>Attendees (${visit.attendees.length})</h3><div class="compact-visit-list">${visit.attendees.map(person => `<div class="kitchen-person"><button class="kitchen-person-name" type="button" data-kitchen-edit-person="${escapeAttribute(person.id)}"><strong>${escapeHtml(person.name)}</strong><span>${escapeHtml([person.organization, person.role || person.category].filter(Boolean).join(' · '))}</span></button><button class="edit-card" type="button" data-remove-event-attendee="${escapeAttribute(person.id)}">Remove</button></div>`).join('') || '<p class="empty-state">Add returning attendees or someone new.</p>'}</div></section>
      <section><h3>Products (${products.length})</h3><div class="section-label-row"><span>Stocked and new products</span><button class="edit-card" type="button" data-market-print-products>Print products</button></div><div class="compact-visit-list">${products.map(renderMarketProductChip).join('') || '<p class="empty-state">Choose products using Add products.</p>'}</div></section>
    </div>
    <div class="market-detail-tabs kitchen-organizations"><section><h3>Organizations &amp; feedback</h3><div class="kitchen-operator-list">${operators.map(operator => `<button class="compact-operator" type="button" data-kitchen-open-operator="${escapeAttribute(operator.id)}"><strong>${escapeHtml(getMarketOperatorDisplayName(operator))}</strong><span>Products, notes, leads &amp; vendor reports</span></button>`).join('') || '<p class="empty-state">Add an organization to record feedback or create a lead or vendor report.</p>'}</div></section></div>
    <details class="compact-visit-extra"><summary>Event notes${visit.notes ? ' · Notes added' : ''}</summary>${renderMarketNotesSection(visit)}</details>
    ${visit.newProductIds.length ? `<details class="compact-visit-extra"><summary>Manage new products &amp; stock links</summary>${visit.newProductIds.map(renderEventProductEditor).join('')}</details>` : ''}`;
  bindMarketDetailActions(panel, visit);
  bindMarketEventActions(panel, visit);
  panel.querySelector('[data-kitchen-attendees]').onclick = () => openKitchenAttendeePicker(visit.id);
  panel.querySelector('[data-kitchen-products]').onclick = () => openVisitProductsDialog(visit.id);
  panel.querySelector('[data-kitchen-operator]').onclick = () => openVisitOperatorDialog(visit.id);
  panel.querySelectorAll('[data-kitchen-edit-person]').forEach(button => button.onclick = () => openKitchenAttendeeForm(visit.id, button.dataset.kitchenEditPerson));
  panel.querySelectorAll('[data-kitchen-open-operator]').forEach(button => button.onclick = () => openVisitOperatorDialog(visit.id, button.dataset.kitchenOpenOperator));
}

function kitchenPersonKey(person) {
  return JSON.stringify([normalizeOperatorKey(person.name), normalizeOperatorKey(person.organization)]);
}

function getKitchenAttendeeDirectory() { return getPeopleDirectory(); }

function openKitchenAttendeePicker(visitId) {
  const dialog = createVisitDialog('Add attendees');
  const body = dialog.querySelector('[data-visit-entry-body]');
  body.innerHTML = `<div class="section-label-row"><p>Choose people from your contacts, sales reps, and previous events.</p><button class="primary-action" type="button" data-new-kitchen-person>+ New attendee</button></div><div class="field-grid"><label><span>Search name or organization</span><input type="search" data-kitchen-person-search /></label><label><span>Attendee type</span><select data-kitchen-person-category><option value="">All types</option><option>Distributor</option><option>Operator / Restaurant</option><option>Our team</option><option>Vendor</option><option>Other</option></select></label></div><div class="visit-product-choices" data-kitchen-people></div><p role="status" data-kitchen-people-message></p><div class="form-actions"><button class="ghost-action" type="button" data-kitchen-done>Done</button><button class="primary-action" type="button" data-kitchen-add-selected>Add selected attendees</button></div>`;
  const selected = new Set();
  const render = () => {
    const visit = marketVisits.find(item => item.id === visitId);
    if (!visit) return;
    const query = normalizeOperatorKey(body.querySelector('input').value);
    const category = body.querySelector('select').value;
    const people = getKitchenAttendeeDirectory().filter(person => !visit.attendees.some(item => kitchenPersonKey(item) === kitchenPersonKey(person)) && (!category || person.category === category) && (!query || normalizeOperatorKey([person.name, person.organization, person.role].join(' ')).includes(query)));
    body.querySelector('[data-kitchen-people]').innerHTML = people.map(person => `<label class="visit-product-choice"><input type="checkbox" value="${escapeAttribute(kitchenPersonKey(person))}" ${selected.has(kitchenPersonKey(person)) ? 'checked' : ''} /><span><strong>${escapeHtml(person.name)}</strong><small>${escapeHtml([person.organization, person.role, person.category].filter(Boolean).join(' · '))}</small></span></label>`).join('') || '<p>No returning attendees match. Use New attendee to add someone.</p>';
    body.querySelectorAll('input[type=checkbox]').forEach(input => input.onchange = () => { if (input.checked) selected.add(input.value); else selected.delete(input.value); });
  };
  body.querySelector('[data-kitchen-person-search]').oninput = render;
  body.querySelector('[data-kitchen-person-category]').onchange = render;
  body.querySelector('[data-new-kitchen-person]').onclick = () => openKitchenAttendeeForm(visitId, '', () => { render(); body.querySelector('[data-kitchen-people-message]').textContent = 'New attendee added to this event.'; });
  body.querySelector('[data-kitchen-done]').onclick = () => dialog.close();
  body.querySelector('[data-kitchen-add-selected]').onclick = () => {
    const visit = marketVisits.find(item => item.id === visitId);
    if (!visit) return;
    const added = getKitchenAttendeeDirectory().filter(person => selected.has(kitchenPersonKey(person)) && !visit.attendees.some(item => kitchenPersonKey(item) === kitchenPersonKey(person))).map(person => normalizeEventAttendee({ ...person, id: crypto.randomUUID() }));
    if (!added.length) { body.querySelector('[data-kitchen-people-message]').textContent = 'Select at least one attendee.'; return; }
    updateMarketVisit(visitId, { attendees: [...visit.attendees, ...added] });
    dialog.close();
  };
  render(); dialog.showModal();
}

function openKitchenAttendeeForm(visitId, personId = '', onSave) {
  const visit = marketVisits.find(item => item.id === visitId);
  if (!visit) return;
  const person = visit.attendees.find(item => item.id === personId) || {};
  const dialog = createVisitDialog(personId ? 'Edit attendee' : 'New attendee');
  const body = dialog.querySelector('[data-visit-entry-body]');
  const input = (key, label, required = false) => `<label><span>${label}</span><input name="${key}" value="${escapeAttribute(person[key] || '')}" ${required ? 'required' : ''} /></label>`;
  body.innerHTML = `<form><div class="field-grid">${input('name','Name',true)}${input('organization','Company / organization',true)}<label><span>Attendee type</span><select name="category">${['Distributor','Operator / Restaurant','Our team','Vendor','Other'].map(value => `<option ${value === person.category ? 'selected' : ''}>${value}</option>`).join('')}</select></label>${input('role','Role')}${input('contact','Email / phone')}</div><p role="alert" data-attendee-error></p><div class="form-actions"><button class="ghost-action" type="button" data-attendee-cancel>Cancel</button><button class="primary-action" type="submit">${personId ? 'Save attendee' : 'Add attendee'}</button></div></form>`;
  attachPeopleSuggestions(body.querySelector('[name=name]'), person => { ['organization','role','contact','category'].forEach(key => body.querySelector(`[name=${key}]`).value = person[key] || ''); });
  body.querySelector('[data-attendee-cancel]').onclick = () => dialog.close();
  body.querySelector('form').onsubmit = event => {
    event.preventDefault();
    const current = marketVisits.find(item => item.id === visitId);
    if (!current) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const next = normalizeEventAttendee({ ...values, name: values.name.trim(), organization: values.organization.trim(), id: personId || crypto.randomUUID() });
    if (!next.name || !next.organization) return;
    if (current.attendees.some(item => item.id !== personId && kitchenPersonKey(item) === kitchenPersonKey(next))) { body.querySelector('[data-attendee-error]').textContent = 'This attendee is already on this event.'; return; }
    rememberPeopleContact(next);
    updateMarketVisit(visitId, { attendees: personId ? current.attendees.map(item => item.id === personId ? next : item) : [...current.attendees, next] });
    dialog.close(); onSave?.();
  };
  dialog.showModal();
}
