"use strict";

function normalizeFoodshowConversation(value) {
  const item = value || {};
  return { contactId: String(item.contactId || ''), contactOperatorId: String(item.contactOperatorId || ''), contactSlot: String(item.contactSlot || ''), operatorId: String(item.operatorId || ''), category: String(item.category || 'Other'), id: String(item.id || crypto.randomUUID()), name: String(item.name || ''), organization: String(item.organization || ''), role: String(item.role || ''), contact: String(item.contact || ''), notes: String(item.notes || ''), followUp: String(item.followUp || ''), interests: Array.isArray(item.interests) ? item.interests.map(product => ({ id: String(product.id || ''), description: String(product.description || ''), vendor: String(product.vendor || ''), apn: String(product.apn || ''), supc: String(product.supc || ''), manufacturerNumber: String(product.manufacturerNumber || '') })) : [] };
}
function foodshowPrepText(visit, product) {
  const prep = visit.productNotes?.[product.id] || {};
  return [prep.preparation, prep.recipe && `Recipe: ${prep.recipe}`, prep.equipment && `Equipment: ${prep.equipment}`, prep.note, prep.onHand && "On hand", prep.ordered && "Ordered"].filter(Boolean).join('\n');
}
function renderFoodshow(panel, visit) {
  const products = getMarketVisitProducts(visit);
  const groups = groupVisitProducts(products);
  panel.innerHTML = `<div class="foodshow-workspace" data-foodshow-visit="${escapeAttribute(visit.id)}">
    <header class="foodshow-hero market-detail-header"><div><h2>${escapeHtml(visit.name)}</h2><p>${escapeHtml([formatDateRange(visit.startDate, visit.endDate), [visit.startTime, visit.endTime].filter(Boolean).join(" – "), visit.location].filter(Boolean).join(' · '))}</p>${visit.foodshowAudience ? `<p>${escapeHtml(visit.foodshowAudience)}</p>` : ''}</div><div class="market-section-actions">${renderPersonalVisitCalendarButton(visit)}<button class="edit-card" data-event-edit type="button">Edit event</button><button class="edit-card" type="button" data-foodshow-details>Edit audience</button><button class="edit-card" data-detail-print type="button">Print event</button><button class="edit-card" data-detail-close type="button">Back to events</button></div></header>
    <section class="foodshow-products"><div class="foodshow-section-heading"><div><h3>Products</h3></div><div class="market-section-actions"><button class="primary-action" type="button" data-foodshow-products>+ Add products</button><button class="edit-card" type="button" data-market-print-products>Print product list</button></div></div>
    <p class="foodshow-save-status" role="status" data-foodshow-save-status></p>
    <div class="foodshow-table-scroll" tabindex="0" role="region" aria-label="Products and presentation plans"><table class="foodshow-table"><colgroup><col class="show-col-product"/><col class="show-col-prep"/><col class="show-col-recipe"/><col class="show-col-equipment"/><col class="show-col-notes"/><col class="show-col-status"/><col class="show-col-remove"/></colgroup><thead><tr><th scope="col">Product</th><th scope="col">Preparation</th><th scope="col">Recipe link / name</th><th scope="col">Equipment needed</th><th scope="col">Notes</th><th scope="col">Status</th><th scope="col"><span class="foodshow-sr-only">Remove</span></th></tr></thead>
    ${groups.map(group => `<tbody class="foodshow-vendor"><tr class="foodshow-vendor-row"><th colspan="7" scope="rowgroup">${escapeHtml(group.vendor)} <span>${group.products.length} product${group.products.length === 1 ? '' : 's'}</span></th></tr>${group.products.map(product => renderFoodshowProductRow(visit, product)).join('')}</tbody>`).join('') || '<tbody><tr><td colspan="7" class="foodshow-empty">Add products to start your vendor lineup.</td></tr></tbody>'}</table></div></section>
    <section class="foodshow-conversations"><div class="foodshow-section-heading"><div><h3>Conversations &amp; product interests</h3></div><button class="primary-action" type="button" data-foodshow-new-conversation>+ Add conversation</button></div><div class="foodshow-conversation-grid">${visit.conversations.map(resolveFoodshowPerson).map(item => `<article class="foodshow-conversation"><h4>${escapeHtml(item.name)}</h4><p>${escapeHtml([item.organization, item.role, item.contact].filter(Boolean).join(' · '))}</p>${item.operatorId ? `<p><strong>Operator:</strong> ${escapeHtml(addressBook.find(entry => entry.id === item.operatorId)?.operation || "Unavailable operator")}</p>` : ""}<p class="foodshow-prose">${escapeHtml(item.notes)}</p><div class="foodshow-interests">${item.interests.map(product => `<span>${escapeHtml(product.vendor)} · ${escapeHtml(product.description)}</span>`).join('') || '<small>No products of interest selected yet.</small>'}</div>${item.followUp ? `<p class="foodshow-prose"><strong>Follow-up:</strong> ${escapeHtml(item.followUp)}</p>` : ''}<div class="market-section-actions"><button class="primary-action" type="button" data-foodshow-lead="${escapeAttribute(item.id)}">${cards.some(card => !card.deletedAt && card.sourceFoodshowConversationId === item.id && card.sourceMarketVisitId === visit.id) ? "Open lead" : "Create lead"}</button><button class="edit-card" type="button" data-foodshow-conversation="${escapeAttribute(item.id)}">Edit conversation</button><button class="edit-card" type="button" data-foodshow-delete="${escapeAttribute(item.id)}">Delete</button></div></article>`).join('') || '<div class="foodshow-empty">No conversations yet.</div>'}</div></section>
    <details class="compact-visit-extra"><summary>General event notes${visit.notes ? ' · Notes added' : ''}</summary>${renderMarketNotesSection(visit)}</details>
    <details class="compact-visit-extra"><summary>Organizations &amp; leads (${visit.operatorLinks.length})</summary><form class="event-library-picker" data-event-organization-form><label>Organization<input name="organization" required /></label><button class="small-action" type="submit">Add organization / lead</button></form>${getMarketVisitOperators(visit).map(operator => renderMarketOperator(visit, operator)).join('')}</details>
    ${visit.newProductIds.length ? `<details class="compact-visit-extra"><summary>Manage shared new products &amp; stock links</summary>${visit.newProductIds.map(renderEventProductEditor).join('')}</details>` : ''}</div>`;
  bindMarketDetailActions(panel, visit);
  bindMarketEventActions(panel, visit);
  panel.querySelector('[data-foodshow-products]').onclick = () => openVisitProductsDialog(visit.id);
  panel.querySelector('[data-foodshow-details]').onclick = () => openFoodshowDetails(visit.id);
  panel.querySelector('[data-foodshow-new-conversation]').onclick = () => openFoodshowConversation(visit.id);
  panel.querySelectorAll('[data-foodshow-field]').forEach(input => {
    let timer;
    const save = () => {
      clearTimeout(timer);
      const current = marketVisits.find(item => item.id === visit.id);
      if (!current) return;
      const productId = input.closest('[data-foodshow-product]').dataset.foodshowProduct;
      const field = input.dataset.foodshowField;
      const value = input.type === 'checkbox' ? input.checked : input.value;
      const previous = current.productNotes?.[productId]?.[field] ?? (input.type === 'checkbox' ? false : '');
      if (previous === value) return;
      current.productNotes = {...current.productNotes, [productId]: {...current.productNotes?.[productId], [field]: value}};
      current.updatedAt = new Date().toISOString();
      stampSharedRecord(current, 'Updated');
      persistMarketVisits();
      panel.querySelector('[data-foodshow-save-status]').textContent = 'Saved';
      if (field === 'recipe') updateFoodshowRecipeLink(input);
    };
    input.addEventListener('input', () => {
      panel.querySelector('[data-foodshow-save-status]').textContent = 'Saving…';
      clearTimeout(timer); timer = setTimeout(save, 400);
    });
    input.addEventListener('change', save);
    input.addEventListener('blur', () => {
      save();
      setTimeout(() => { if (!isFoodshowFieldEditing()) refreshCloudSectionsIfChanged(); }, 1000);
    });
  });
  panel.querySelectorAll('[data-foodshow-lead]').forEach(button => button.onclick = () => openFoodshowLead(visit.id, button.dataset.foodshowLead));
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
  const item = resolveFoodshowPerson(visit.conversations.find(entry => entry.id === conversationId) || normalizeFoodshowConversation({}));
  const directory = foodshowContactChoices();
  let selectedContact = directory.find(choice => (item.contactId && choice.contactId === item.contactId) || (item.contactOperatorId && choice.contactOperatorId === item.contactOperatorId && choice.contactSlot === item.contactSlot));
  const products = getMarketVisitProducts(visit);
  const choices = [...products, ...item.interests.filter(product => !products.some(current => current.id === product.id))];
  const dialog = foodshowForm(conversationId ? 'Edit conversation' : 'New conversation', `<label><span>Existing contact / sales rep</span><input type="search" data-foodshow-contact-search placeholder="Search name, company, or role" /></label><label><span>Contact</span><select data-foodshow-contact-picker><option value="">New / unlinked contact</option>${directory.map((choice,index) => `<option value="${index}" ${choice === selectedContact ? 'selected' : ''}>${escapeHtml([choice.person.name, choice.person.organization, choice.person.role].filter(Boolean).join(' · '))}</option>`).join('')}</select></label><label><span>Operator / account</span><select name="operatorId"><option value="">No operator selected</option>${getMarketOperatorOptions().map(entry => `<option value="${escapeAttribute(entry.id)}" ${entry.id === item.operatorId ? 'selected' : ''}>${escapeHtml(entry.operation)}</option>`).join('')}</select></label><p>Contact details save to the shared directory. Conversation notes stay with this event.</p><div class="field-grid">${foodshowInput('name', 'Person’s name', item.name, false, true)}${foodshowInput('organization', 'Company / organization', item.organization)}${foodshowInput('role', 'Role (sales rep, chef, customer…)', item.role)}${foodshowInput('contact', 'Email / phone', item.contact)}</div>${foodshowInput('notes', 'Conversation notes', item.notes, true)}<fieldset class="foodshow-interest-picker"><legend>Products they’re interested in</legend>${groupVisitProducts(choices).map(group => `<h4>${escapeHtml(group.vendor)}</h4>${group.products.map(product => `<label><input type="checkbox" name="interest" value="${escapeAttribute(product.id)}" ${item.interests.some(selected => selected.id === product.id) ? 'checked' : ''} /><span>${escapeHtml(product.description)}${products.some(current => current.id === product.id) ? '' : ' (removed from lineup)'}</span></label>`).join('')}`).join('') || '<p>Add products to the show to select interests. You can save this conversation now.</p>'}</fieldset>${foodshowInput('followUp', 'Follow-up / next steps', item.followUp, true)}`, data => {
    if (!data.get('name').trim()) return false;
    const selected = new Set(data.getAll('interest'));
    const contactLink = saveFoodshowContact(selectedContact, Object.fromEntries(data));
    const next = normalizeFoodshowConversation({ ...item, ...Object.fromEntries(data), ...contactLink, name: data.get('name').trim(), interests: choices.filter(product => selected.has(product.id)) });
    const current = marketVisits.find(entry => entry.id === visitId);
    updateMarketVisit(visitId, { conversations: conversationId ? current.conversations.map(entry => entry.id === conversationId ? next : entry) : [...current.conversations, next] });
  });
  const picker = dialog.querySelector('[data-foodshow-contact-picker]');
  dialog.querySelector('[data-foodshow-contact-search]').oninput = event => {
    const query = event.target.value.toLowerCase();
    [...picker.options].forEach(option => { option.hidden = option.value !== '' && !option.textContent.toLowerCase().includes(query); });
  };
  picker.onchange = () => {
    selectedContact = picker.value === '' ? null : directory[Number(picker.value)];
    if (!selectedContact) return;
    for (const key of ['name','organization','role','contact']) dialog.querySelector('[name="'+key+'"]').value = selectedContact.person[key] || '';
    if (selectedContact.contactOperatorId) dialog.querySelector('[name=operatorId]').value = selectedContact.contactOperatorId;
  };
  dialog.querySelector('[name=operatorId]').onchange = event => {
    const operator = addressBook.find(entry => entry.id === event.target.value);
    if (operator && !dialog.querySelector('[name=organization]').value) dialog.querySelector('[name=organization]').value = operator.operation;
  };
}
function renderFoodshowConversationPrint(visit) {
  return `<h2>Conversations &amp; product interests</h2>${visit.conversations.map(resolveFoodshowPerson).map(item => `<h3>${escapeHtml(item.name)}</h3><p>${escapeHtml([item.organization, item.role, item.contact].filter(Boolean).join(' · '))}</p><p>${escapeHtml(item.notes)}</p><ul>${item.interests.map(product => `<li>${escapeHtml(product.vendor)} · ${escapeHtml(product.description)}</li>`).join('')}</ul>${item.followUp ? `<p>Follow-up: ${escapeHtml(item.followUp)}</p>` : ''}`).join('') || '<p>No conversations recorded.</p>'}`;
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
  const choices = ['', 'Heat & serve', 'Thaw & serve', 'Fry', 'Bake', 'Stove top', 'Grill', 'Steam', 'Microwave', 'Air fry', 'Recipe / prepared dish', 'Ready to sample', 'Display only', 'Other'];
  if (prep.preparation && !choices.includes(prep.preparation)) choices.push(prep.preparation);
  const url = foodshowRecipeUrl(prep.recipe);
  return `<tr data-foodshow-product="${escapeAttribute(product.id)}"><th scope="row"><strong>${escapeHtml(product.description)}</strong>${product.isNewEventProduct ? '<small class="foodshow-new">New product</small>' : ''}<small>${escapeHtml([product.packaging, product.storage, formatVisitProductCodes(product)].filter(Boolean).join(' · '))}</small></th><td><select data-foodshow-field="preparation" aria-label="${label('Preparation')}">${choices.map(value => `<option value="${escapeAttribute(value)}" ${value === (prep.preparation || '') ? 'selected' : ''}>${escapeHtml(value || 'Choose…')}</option>`).join('')}</select></td><td><input data-foodshow-field="recipe" aria-label="${label('Recipe link or name')}" value="${escapeAttribute(prep.recipe || '')}" placeholder="Paste link or recipe name" /><a data-foodshow-recipe-link ${url ? `href="${escapeAttribute(url)}"` : 'hidden'} target="_blank" rel="noopener noreferrer">Open recipe ↗</a></td><td>${text('equipment', 'Equipment needed', 'Heat lamp, tongs…')}</td><td>${text('note', 'Notes', 'Serving / presentation notes…')}</td><td class="foodshow-status-cell">${[['onHand','On hand'],['ordered','Ordered']].map(([key,title]) => `<label><input type="checkbox" data-foodshow-field="${key}" aria-label="${label(title)}" ${prep[key] === true ? 'checked' : ''} /><span>${title}</span></label>`).join('')}</td><td><button class="remove-product" type="button" ${eventProducts.some(item => item.id === product.id) ? 'data-remove-event-product' : 'data-remove-market-product'}="${escapeAttribute(product.id)}" aria-label="Remove ${escapeAttribute(product.description)}">Remove</button></td></tr>`;
}

function foodshowContactChoices() {
  const choices = [];
  const keys = new Set();
  const add = choice => {
    const key = kitchenPersonKey(choice.person);
    if (!choice.person.name || keys.has(key)) return;
    keys.add(key); choices.push(choice);
  };
  getMarketOperatorOptions().forEach(operator => {
    [['primaryContact',operator.primaryContact],['secondaryContact',operator.secondaryContact],...(operator.contacts || []).map(person => ['contact:'+person.id,person])].forEach(([slot,person]) => {
      if (person?.name) add({contactOperatorId:operator.id,contactSlot:slot,person:{...person,organization:operator.operation,contact:[person.email,person.phone].filter(Boolean).join(' · '),category:'Operator / Restaurant'}});
    });
  });
  peopleContacts.filter(person => !person.archivedAt).forEach(person => add({contactId:person.id,person}));
  getPeopleDirectory().forEach(person => add({person}));
  return choices.sort((a,b)=>a.person.name.localeCompare(b.person.name));
}
function foodshowOperatorContact(operator, slot) {
  if (!operator) return null;
  return ['primaryContact','secondaryContact'].includes(slot) ? operator[slot] : (operator.contacts || []).find(person => 'contact:'+person.id === slot);
}
function resolveFoodshowPerson(item) {
  const operator = addressBook.find(entry => entry.id === item.contactOperatorId && !entry.archivedAt);
  const person = foodshowOperatorContact(operator,item.contactSlot);
  if (person) return {...item,name:person.name,organization:operator.operation,role:person.role,contact:[person.email,person.phone].filter(Boolean).join(' · ')};
  const shared = peopleContacts.find(person => person.id === item.contactId && !person.archivedAt);
  return shared ? {...item,name:shared.name,organization:shared.organization,role:shared.role,contact:shared.contact,category:shared.category} : item;
}
function saveFoodshowContact(choice, values) {
  const person = {name:values.name.trim(),organization:values.organization.trim(),role:values.role.trim(),contact:values.contact.trim(),category:choice?.person.category || 'Other'};
  const communication = contactCommunicationFields(person);
  const operator = addressBook.find(entry => entry.id === choice?.contactOperatorId);
  const target = foodshowOperatorContact(operator,choice?.contactSlot);
  if (target) {
    // Operator names are managed in the operator directory, separately from the person.
    Object.assign(target,{name:person.name,role:person.role,email:communication.email,phone:communication.phone});
    operator.updatedAt = new Date().toISOString(); persistAddressBook();
    return {contactId:'',contactOperatorId:operator.id,contactSlot:choice.contactSlot,category:'Operator / Restaurant',organization:operator.operation};
  }
  const existing = peopleContacts.find(item => item.id === choice?.contactId) || peopleContacts.find(item => !item.archivedAt && kitchenPersonKey(item) === kitchenPersonKey(person));
  const next = normalizePeopleContact({...existing,...person,...communication,id:existing?.id || crypto.randomUUID(),updatedAt:new Date().toISOString()});
  peopleContacts = existing ? peopleContacts.map(item => item.id === existing.id ? next : item) : [...peopleContacts,next];
  persistPeopleContacts();
  return {contactId:next.id,contactOperatorId:'',contactSlot:'',category:next.category};
}
function openFoodshowLead(visitId, conversationId) {
  const visit = marketVisits.find(item => item.id === visitId);
  const item = visit && visit.conversations.find(item => item.id === conversationId);
  if (!item) return;
  const existing = cards.find(card => !card.deletedAt && card.sourceMarketVisitId === visitId && card.sourceFoodshowConversationId === conversationId);
  if (existing) { showLeadsWorkflow(); openForm(existing); return; }
  const person = resolveFoodshowPerson(item);
  const operator = addressBook.find(entry => entry.id === item.operatorId);
  foodshowForm('Create lead', `<label><span>Distributor</span><select name="distributor"><option>US Foods</option><option ${/sysco/i.test(person.organization) ? 'selected' : ''}>Sysco</option><option>Linford</option></select></label>${foodshowInput('account','Operator / account',operator?.operation || person.organization || person.name,false,true)}<p>${item.interests.length} selected products · Conversation notes and follow-up included.</p>`, data => {
    const duplicate = cards.find(card => !card.deletedAt && card.sourceMarketVisitId === visitId && card.sourceFoodshowConversationId === conversationId);
    if (duplicate) { showLeadsWorkflow(); openForm(duplicate); return; }
    const distributor = data.get('distributor');
    const account = data.get('account').trim(); if (!account) return false;
    const currentProducts = getMarketVisitProducts(visit);
    const lead = normalizeCard({id:crypto.randomUUID(),account,accountNumber:operator?.operation === account ? operator.accountNumber : '',syscoAccountNumber:operator?.operation === account ? operator.syscoAccountNumber : '',distributor,
      note:[`From Foodshow: ${visit.name}`,[person.name,person.organization,person.role,person.contact].filter(Boolean).join(' · '),item.notes,item.followUp && `Follow-up: ${item.followUp}`].filter(Boolean).join('\n\n'),
      sourceMarketVisitId:visit.id,sourceFoodshowConversationId:item.id,sourceContactId:item.contactId,sourceOperatorId:item.operatorId,
      priority:'Medium',status:'New Lead',source:'Market Visit',due:'',
      salesRep: distributor !== 'Sysco' && /sales rep/i.test(person.role) ? person.name : operator?.usfSalesRep || '',
      syscoSalesRep: distributor === 'Sysco' && /sales rep/i.test(person.role) ? person.name : operator?.syscoSalesRep || '',
      products:item.interests.map(snapshot => {const product = currentProducts.find(product => product.id === snapshot.id) || snapshot;return {id:crypto.randomUUID(),apn:(distributor === 'Sysco' ? product.supc : product.apn) || product.manufacturerNumber || '',description:product.description,vendor:product.vendor};}),
      attachments:[],vendorReports:{},createdAt:new Date().toISOString(),archivedAt:'',deletedAt:''});
    const previous = cards;cards=[lead,...cards];if(!persist()){cards=previous;return false;}
    showLeadsWorkflow();openForm(lead);
  });
}

function isFoodshowFieldEditing() {
  const field = document.activeElement;
  const workspace = field?.closest?.('[data-foodshow-visit]');
  return Boolean(field?.matches?.('[data-foodshow-field]') && workspace?.dataset.foodshowVisit === activeMarketDetailId && activeMarketType === 'foodshow' && activeMarketView === 'list');
}
function captureFoodshowScroll() {
  const workspace = document.querySelector('[data-foodshow-visit]');
  if (!workspace || workspace.dataset.foodshowVisit !== activeMarketDetailId) return null;
  const table = workspace.querySelector('.foodshow-table-scroll');
  const ancestors = [];
  for (let element = workspace.parentElement; element; element = element.parentElement) {
    if (element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth) ancestors.push({element,top:element.scrollTop,left:element.scrollLeft});
  }
  return {visitId:activeMarketDetailId,top:table.scrollTop,left:table.scrollLeft,ancestors};
}
function restoreFoodshowScroll(saved) {
  const workspace = document.querySelector('[data-foodshow-visit]');
  if (!saved || workspace?.dataset.foodshowVisit !== saved.visitId) return;
  const table = workspace.querySelector('.foodshow-table-scroll');
  table.scrollTop=saved.top; table.scrollLeft=saved.left;
  saved.ancestors.forEach(({element,top,left}) => { if (element.isConnected) { element.scrollTop=top; element.scrollLeft=left; } });
}
