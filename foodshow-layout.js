"use strict";

function normalizeFoodshowConversation(value) {
  const item = value || {};
  return { id: String(item.id || crypto.randomUUID()), name: String(item.name || ''), organization: String(item.organization || ''), role: String(item.role || ''), contact: String(item.contact || ''), notes: String(item.notes || ''), followUp: String(item.followUp || ''), interests: Array.isArray(item.interests) ? item.interests.map(product => ({ id: String(product.id || ''), description: String(product.description || ''), vendor: String(product.vendor || '') })) : [] };
}
function foodshowPrepText(visit, product) {
  const prep = visit.productNotes?.[product.id] || {};
  return [prep.preparation, prep.recipe && `Recipe: ${prep.recipe}`, prep.equipment && `Equipment: ${prep.equipment}`, prep.note].filter(Boolean).join('\n');
}
function renderFoodshow(panel, visit) {
  const products = getMarketVisitProducts(visit);
  const groups = groupVisitProducts(products);
  panel.innerHTML = `<div class="foodshow-workspace">
    <header class="foodshow-hero market-detail-header"><div><h2>${escapeHtml(visit.name)}</h2><p>${escapeHtml([formatDateRange(visit.startDate, visit.endDate), [visit.startTime, visit.endTime].filter(Boolean).join(" – "), visit.location].filter(Boolean).join(' · '))}</p>${visit.foodshowAudience ? `<p>${escapeHtml(visit.foodshowAudience)}</p>` : ''}</div><div class="market-section-actions">${renderPersonalVisitCalendarButton(visit)}<button class="edit-card" data-event-edit type="button">Edit event</button><button class="edit-card" type="button" data-foodshow-details>Edit audience</button><button class="edit-card" data-detail-print type="button">Print event</button><button class="edit-card" data-detail-close type="button">Back to events</button></div></header>
    <section class="foodshow-products"><div class="foodshow-section-heading"><div><h3>Products</h3></div><div class="market-section-actions"><button class="primary-action" type="button" data-foodshow-products>+ Add products</button><button class="edit-card" type="button" data-market-print-products>Print product list</button></div></div>
    <p class="foodshow-save-status" role="status" data-foodshow-save-status></p>
    <div class="foodshow-table-scroll" tabindex="0" role="region" aria-label="Products and presentation plans"><table class="foodshow-table"><colgroup><col class="show-col-product"/><col class="show-col-prep"/><col class="show-col-recipe"/><col class="show-col-equipment"/><col class="show-col-notes"/><col class="show-col-remove"/></colgroup><thead><tr><th scope="col">Product</th><th scope="col">Preparation</th><th scope="col">Recipe link / name</th><th scope="col">Equipment needed</th><th scope="col">Notes</th><th scope="col"><span class="foodshow-sr-only">Remove</span></th></tr></thead>
    ${groups.map(group => `<tbody class="foodshow-vendor"><tr class="foodshow-vendor-row"><th colspan="6" scope="rowgroup">${escapeHtml(group.vendor)} <span>${group.products.length} product${group.products.length === 1 ? '' : 's'}</span></th></tr>${group.products.map(product => renderFoodshowProductRow(visit, product)).join('')}</tbody>`).join('') || '<tbody><tr><td colspan="6" class="foodshow-empty">Add products to start your vendor lineup.</td></tr></tbody>'}</table></div></section>
    <section class="foodshow-conversations"><div class="foodshow-section-heading"><div><h3>Conversations &amp; product interests</h3></div><button class="primary-action" type="button" data-foodshow-new-conversation>+ Add conversation</button></div><div class="foodshow-conversation-grid">${visit.conversations.map(item => `<article class="foodshow-conversation"><h4>${escapeHtml(item.name)}</h4><p>${escapeHtml([item.organization, item.role, item.contact].filter(Boolean).join(' · '))}</p><p class="foodshow-prose">${escapeHtml(item.notes)}</p><div class="foodshow-interests">${item.interests.map(product => `<span>${escapeHtml(product.vendor)} · ${escapeHtml(product.description)}</span>`).join('') || '<small>No products of interest selected yet.</small>'}</div>${item.followUp ? `<p class="foodshow-prose"><strong>Follow-up:</strong> ${escapeHtml(item.followUp)}</p>` : ''}<div class="market-section-actions"><button class="edit-card" type="button" data-foodshow-conversation="${escapeAttribute(item.id)}">Edit conversation</button><button class="edit-card" type="button" data-foodshow-delete="${escapeAttribute(item.id)}">Delete</button></div></article>`).join('') || '<div class="foodshow-empty">No conversations yet.</div>'}</div></section>
    <details class="compact-visit-extra"><summary>General event notes${visit.notes ? ' · Notes added' : ''}</summary>${renderMarketNotesSection(visit)}</details>
    <details class="compact-visit-extra"><summary>Organizations &amp; leads (${visit.operatorLinks.length})</summary><form class="event-library-picker" data-event-organization-form><label>Organization<input name="organization" required /></label><button class="small-action" type="submit">Add organization / lead</button></form>${getMarketVisitOperators(visit).map(operator => renderMarketOperator(visit, operator)).join('')}</details>
    ${visit.newProductIds.length ? `<details class="compact-visit-extra"><summary>Manage shared new products &amp; stock links</summary>${visit.newProductIds.map(renderEventProductEditor).join('')}</details>` : ''}</div>`;
  bindMarketDetailActions(panel, visit);
  bindMarketEventActions(panel, visit);
  panel.querySelector('[data-foodshow-products]').onclick = () => openVisitProductsDialog(visit.id);
  panel.querySelector('[data-foodshow-details]').onclick = () => openFoodshowDetails(visit.id);
  panel.querySelector('[data-foodshow-new-conversation]').onclick = () => openFoodshowConversation(visit.id);
  panel.querySelectorAll('[data-foodshow-field]').forEach(input => {
    input.addEventListener('input', () => { panel.querySelector('[data-foodshow-save-status]').textContent = 'Editing… leave this cell to save.'; });
    input.addEventListener('change', () => {
      const current = marketVisits.find(item => item.id === visit.id);
      if (!current) return;
      const productId = input.closest('[data-foodshow-product]').dataset.foodshowProduct;
      current.productNotes = {...current.productNotes, [productId]: {...current.productNotes?.[productId], [input.dataset.foodshowField]: input.value}};
      current.updatedAt = new Date().toISOString();
      stampSharedRecord(current, 'Updated');
      persistMarketVisits();
      panel.querySelector('[data-foodshow-save-status]').textContent = 'Saved';
      if (input.dataset.foodshowField === 'recipe') updateFoodshowRecipeLink(input);
    });
  });
  panel.querySelectorAll('[data-foodshow-conversation]').forEach(button => button.onclick = () => openFoodshowConversation(visit.id, button.dataset.foodshowConversation));
  panel.querySelectorAll('[data-foodshow-delete]').forEach(button => button.onclick = () => {
    if (!confirm('Delete this conversation and its product interests?')) return;
    const current = marketVisits.find(item => item.id === visit.id);
    updateMarketVisit(visit.id, { conversations: current.conversations.filter(item => item.id !== button.dataset.foodshowDelete) });
  });
}
function foodshowInput(name, label, value = '', textarea = false, required = false) {
  return `<label><span>${label}</span>${textarea ? `<textarea rows="4" name="${name}">${escapeHtml(value)}</textarea>` : `<input name="${name}" value="${escapeAttribute(value)}" ${required ? 'required' : ''} />`}</label>`;
}
function foodshowForm(title, fields, save) {
  const dialog = createVisitDialog(title);
  dialog.querySelector('[data-visit-entry-body]').innerHTML = `<form class="foodshow-form">${fields}<div class="form-actions"><button class="ghost-action" type="button" data-cancel>Cancel</button><button class="primary-action" type="submit">Save</button></div></form>`;
  dialog.querySelector('[data-cancel]').onclick = () => dialog.close();
  dialog.querySelector('form').onsubmit = event => { event.preventDefault(); if (save(new FormData(event.currentTarget)) !== false) dialog.close(); };
  dialog.showModal();
  return dialog;
}
function openFoodshowDetails(visitId) {
  const visit = marketVisits.find(item => item.id === visitId);
  foodshowForm('Format & audience', `<label><span>Event format</span><select name="format">${['Foodshow', 'Vendor showcase', 'Distributor GSM', 'Other'].map(value => `<option ${value === visit.foodshowFormat ? 'selected' : ''}>${value}</option>`).join('')}</select></label>${foodshowInput('audience', 'Who are we showing to?', visit.foodshowAudience)}`, data => updateMarketVisit(visitId, { foodshowFormat: data.get('format'), foodshowAudience: data.get('audience').trim() }));
}
function openFoodshowConversation(visitId, conversationId = '') {
  const visit = marketVisits.find(item => item.id === visitId);
  const item = visit.conversations.find(entry => entry.id === conversationId) || normalizeFoodshowConversation({});
  const products = getMarketVisitProducts(visit);
  const choices = [...products, ...item.interests.filter(product => !products.some(current => current.id === product.id))];
  foodshowForm(conversationId ? 'Edit conversation' : 'New conversation', `<div class="field-grid">${foodshowInput('name', 'Person’s name', item.name, false, true)}${foodshowInput('organization', 'Company / organization', item.organization)}${foodshowInput('role', 'Role (sales rep, chef, customer…)', item.role)}${foodshowInput('contact', 'Email / phone', item.contact)}</div>${foodshowInput('notes', 'Conversation notes', item.notes, true)}<fieldset class="foodshow-interest-picker"><legend>Products they’re interested in</legend>${groupVisitProducts(choices).map(group => `<h4>${escapeHtml(group.vendor)}</h4>${group.products.map(product => `<label><input type="checkbox" name="interest" value="${escapeAttribute(product.id)}" ${item.interests.some(selected => selected.id === product.id) ? 'checked' : ''} /><span>${escapeHtml(product.description)}${products.some(current => current.id === product.id) ? '' : ' (removed from lineup)'}</span></label>`).join('')}`).join('') || '<p>Add products to the show to select interests. You can save this conversation now.</p>'}</fieldset>${foodshowInput('followUp', 'Follow-up / next steps', item.followUp, true)}`, data => {
    if (!data.get('name').trim()) return false;
    const selected = new Set(data.getAll('interest'));
    const next = normalizeFoodshowConversation({ ...item, ...Object.fromEntries(data), name: data.get('name').trim(), interests: choices.filter(product => selected.has(product.id)) });
    const current = marketVisits.find(entry => entry.id === visitId);
    updateMarketVisit(visitId, { conversations: conversationId ? current.conversations.map(entry => entry.id === conversationId ? next : entry) : [...current.conversations, next] });
  });
}
function renderFoodshowConversationPrint(visit) {
  return `<h2>Conversations &amp; product interests</h2>${visit.conversations.map(item => `<h3>${escapeHtml(item.name)}</h3><p>${escapeHtml([item.organization, item.role, item.contact].filter(Boolean).join(' · '))}</p><p>${escapeHtml(item.notes)}</p><ul>${item.interests.map(product => `<li>${escapeHtml(product.vendor)} · ${escapeHtml(product.description)}</li>`).join('')}</ul>${item.followUp ? `<p>Follow-up: ${escapeHtml(item.followUp)}</p>` : ''}`).join('') || '<p>No conversations recorded.</p>'}`;
}

function foodshowRecipeUrl(value) {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}
function updateFoodshowRecipeLink(input) {
  const link = input.parentElement.querySelector('[data-foodshow-recipe-link]');
  const url = foodshowRecipeUrl(input.value);
  link.hidden = !url;
  if (url) link.href = url; else link.removeAttribute('href');
}
function renderFoodshowProductRow(visit, product) {
  const prep = visit.productNotes?.[product.id] || {};
  const label = title => escapeAttribute(title + ' for ' + product.description);
  const text = (key, title, placeholder) => `<textarea rows="2" data-foodshow-field="${key}" aria-label="${label(title)}" placeholder="${placeholder}">${escapeHtml(prep[key] || '')}</textarea>`;
  const choices = ['', 'Heat & serve', 'Recipe / prepared dish', 'Ready to sample', 'Display only', 'Other'];
  if (prep.preparation && !choices.includes(prep.preparation)) choices.push(prep.preparation);
  const url = foodshowRecipeUrl(prep.recipe);
  return `<tr data-foodshow-product="${escapeAttribute(product.id)}"><th scope="row"><strong>${escapeHtml(product.description)}</strong>${product.isNewEventProduct ? '<small class="foodshow-new">New product</small>' : ''}<small>${escapeHtml([product.packaging, product.storage, formatVisitProductCodes(product)].filter(Boolean).join(' · '))}</small></th><td><select data-foodshow-field="preparation" aria-label="${label('Preparation')}">${choices.map(value => `<option value="${escapeAttribute(value)}" ${value === (prep.preparation || '') ? 'selected' : ''}>${escapeHtml(value || 'Choose…')}</option>`).join('')}</select></td><td><input data-foodshow-field="recipe" aria-label="${label('Recipe link or name')}" value="${escapeAttribute(prep.recipe || '')}" placeholder="Paste link or recipe name" /><a data-foodshow-recipe-link ${url ? `href="${escapeAttribute(url)}"` : 'hidden'} target="_blank" rel="noopener noreferrer">Open recipe ↗</a></td><td>${text('equipment', 'Equipment needed', 'Heat lamp, tongs…')}</td><td>${text('note', 'Notes', 'Serving / presentation notes…')}</td><td><button class="remove-product" type="button" ${eventProducts.some(item => item.id === product.id) ? 'data-remove-event-product' : 'data-remove-market-product'}="${escapeAttribute(product.id)}" aria-label="Remove ${escapeAttribute(product.description)}">Remove</button></td></tr>`;
}
