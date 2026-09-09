"use strict";

function normalizePeopleContact(person) {
  person = { ...person, name: typeof person.name === 'string' && person.name !== '[object Object]' ? person.name : '' };
  return { ...normalizeEventAttendee(person), name: correctPeteName(person.name || ''),
    previousNames: Array.isArray(person.previousNames) ? person.previousNames : [],
    updatedAt: person.updatedAt || '', archivedAt: person.archivedAt || '' };
}
function correctPeteName(value) { return String(value).replace(/\bPete\s+McCeneny\b/gi, 'Pete McEnaney'); }
function loadPeopleContacts() {
  try { return JSON.parse(localStorage.getItem('broker-whiteboard-people-contacts') || '[]').map(normalizePeopleContact); } catch { return []; }
}
function rememberPeopleContact(person) {
  const existing = peopleContacts.find(item => kitchenPersonKey(item) === kitchenPersonKey(person));
  const next = normalizePeopleContact({ ...existing, ...person, id: existing?.id || crypto.randomUUID(), updatedAt: new Date().toISOString() });
  peopleContacts = existing ? peopleContacts.map(item => item.id === existing.id ? next : item) : [...peopleContacts,next];
  persistPeopleContacts();
}
function persistPeopleContacts() {
  localStorage.setItem(peopleContactsStorageKey, JSON.stringify(peopleContacts));
  scheduleCloudSave(peopleContactsStorageKey);
  updateSalesRepSuggestions(); renderPeopleContacts();
}
function getPeopleDirectory() {
  const result = new Map();
  const deleted = peopleContacts.filter(person => person.archivedAt);
  const add = value => {
    if (!value) return;
    const person = normalizePeopleContact(value);
    if (!person.name.trim() || person.archivedAt) return;
    const key = kitchenPersonKey(person);
    if (deleted.some(item => kitchenPersonKey(item) === key || (!person.organization && normalizeOperatorKey(item.name) === normalizeOperatorKey(person.name)))) return;
    if (!result.has(key)) result.set(key, person);
  };
  peopleContacts.forEach(add);
  add({ name: 'Pete McEnaney', organization: 'Sysco', category: 'Distributor', role: 'Sales rep' });
  addressBook.filter(entry => !entry.archivedAt).forEach(entry => {
    normalizeStringList(entry.usfSalesRep).forEach(name => add({ name, organization: 'US Foods', role: 'Sales rep', category: 'Distributor' }));
    normalizeStringList(entry.syscoSalesRep).forEach(name => add({ name, organization: 'Sysco', role: 'Sales rep', category: 'Distributor' }));
    [entry.primaryContact, entry.secondaryContact, ...(entry.contacts || [])].filter(Boolean).forEach(contact => add({ ...contact, organization: entry.operation, contact: [contact.email, contact.phone].filter(Boolean).join(' · '), category: 'Operator / Restaurant' }));
  });
  marketVisits.forEach(visit => {
    visit.attendees.forEach(add);
    visit.calls.filter(call => call.manufacturerContact).forEach(call => add({name:call.manufacturerContact,organization:visit.vendor,category:'Vendor',role:'Vendor contact'}));
    if (visit.visitorName) add({ name: visit.visitorName, organization: visit.vendor, role: 'Regional manager', category: 'Vendor' });
    [...visit.salesReps, ...visit.calls.flatMap(call => call.salesReps)].forEach(name => add({ name, role: 'Sales rep', category: 'Distributor' }));
  });
  cards.forEach(card => {
    normalizeStringList(card.salesRep).forEach(name => add({ name, organization: 'US Foods', role: 'Sales rep', category: 'Distributor' }));
    normalizeStringList(card.syscoSalesRep).forEach(name => add({ name, organization: 'Sysco', role: 'Sales rep', category: 'Distributor' }));
  });
  const known = new Set([...result.values()].filter(p => p.organization).map(p => p.name.toLowerCase()));
  return [...result.values()].filter(p => p.organization || !known.has(p.name.toLowerCase())).sort((a,b) => a.name.localeCompare(b.name));
}

let activeContactFilter = 'all';
function contactMatchesFilter(person, filter = activeContactFilter) {
  const organization = normalizeOperatorKey(person.organization).replace(/[^a-z0-9]/g, '');
  const role = normalizeOperatorKey(person.role);
  if (filter === 'usfoods') return organization.startsWith('usfoods') || organization === 'usf';
  if (filter === 'sysco') return organization.startsWith('sysco');
  if (filter === 'regional') return /regional.*manager/.test(role);
  if (filter === 'pc') return organization === 'pc' || organization.includes('piercecartwright') || person.category === 'Our team';
  return true;
}
function renderPeopleContacts() {
  const panel = document.querySelector('#peopleContactsPanel');
  if (!panel) return;
  const query = normalizeOperatorKey(document.querySelector('#peopleContactSearch')?.value || '');
  const people = getPeopleDirectory().filter(person => person.category !== 'Operator / Restaurant').filter(person => contactMatchesFilter(person)).filter(person => normalizeOperatorKey([person.name, person.organization, person.role, person.contact].join(' ')).includes(query));
  document.querySelectorAll('[data-contact-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.contactFilter === activeContactFilter)));
  const count = document.getElementById('contactMatchCount');
  if (count) count.textContent = people.length + (people.length === 1 ? ' contact' : ' contacts');
  panel.innerHTML = people.map(person => `<div class="person-contact-card"><button class="compact-operator" type="button" data-edit-person-key="${escapeAttribute(kitchenPersonKey(person))}"><strong>${escapeHtml(person.name)}</strong><span>${escapeHtml([person.organization,person.role,person.contact].filter(Boolean).join(' · '))}</span></button><button type="button" class="edit-card contact-delete" data-delete-person-key="${escapeAttribute(kitchenPersonKey(person))}" aria-label="Delete ${escapeAttribute(person.name)}">Delete</button></div>`).join('') || '<p>No matching people. Add a contact to save their details.</p>';
  const deleted = peopleContacts.filter(person => person.archivedAt);
  if (deleted.length) panel.insertAdjacentHTML('beforeend', '<details class="deleted-contacts"><summary>Deleted contacts (' + deleted.length + ')</summary>' + deleted.map(person => `<div><span>${escapeHtml(person.name)} · ${escapeHtml(person.organization)}</span><button type="button" class="edit-card" data-restore-person="${escapeAttribute(person.id)}">Restore</button></div>`).join('') + '</details>');
  panel.querySelectorAll('[data-delete-person-key]').forEach(button => button.onclick = () => deletePeopleContact(button.dataset.deletePersonKey));
  panel.querySelectorAll('[data-restore-person]').forEach(button => button.onclick = () => { peopleContacts = peopleContacts.map(person => person.id === button.dataset.restorePerson ? {...person, archivedAt:'', updatedAt:new Date().toISOString()} : person); persistPeopleContacts(); });
  panel.querySelectorAll('[data-edit-person-key]').forEach(button => button.onclick = () => openPeopleContactForm(getPeopleDirectory().find(person => kitchenPersonKey(person) === button.dataset.editPersonKey)));
}

function deletePeopleContact(key) {
  const person = getPeopleDirectory().find(item => kitchenPersonKey(item) === key);
  if (!person || !confirm('Delete ' + person.name + ' from the shared contact list and name suggestions? Existing leads and event records will keep their details. You can restore this contact under Deleted contacts.')) return;
  const existing = peopleContacts.find(item => kitchenPersonKey(item) === key);
  const deleted = normalizePeopleContact({...person, id:existing?.id || crypto.randomUUID(), archivedAt:new Date().toISOString(), updatedAt:new Date().toISOString()});
  peopleContacts = existing ? peopleContacts.map(item => item.id === existing.id ? deleted : item) : [...peopleContacts,deleted];
  persistPeopleContacts();
}
function openPeopleContactForm(person = {}) {
  const existing = peopleContacts.find(item => kitchenPersonKey(item) === kitchenPersonKey(person));
  const dialog = createVisitDialog(existing ? 'Edit shared contact' : 'Save shared contact');
  const body = dialog.querySelector('[data-visit-entry-body]');
  body.innerHTML = `<p>Shared with your team. Available in name suggestions, attendee lists, leads, and visits.</p><form><div class="field-grid">${['name','organization','role','contact'].map(key => `<label><span>${({name:'Name',organization:'Company / distributor',role:'Role',contact:'Email / phone'})[key]}</span><input name="${key}" value="${escapeAttribute(person[key] || '')}" ${['name','organization'].includes(key) ? 'required' : ''} /></label>`).join('')}<label><span>Contact type</span><select name="category">${['Distributor','Vendor','Our team','Operator / Restaurant','Other'].map(value=>`<option ${value===person.category?'selected':''}>${value}</option>`).join('')}</select></label></div><p role="alert" data-contact-error></p><div class="form-actions"><button class="primary-action" type="submit">Save contact</button></div></form>`;
  body.querySelector('form').onsubmit = event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const next = normalizePeopleContact({ ...existing, ...values, name: values.name.trim(), organization: values.organization.trim(), updatedAt: new Date().toISOString(), previousNames: [...(existing?.previousNames || []), ...(person.name && person.name !== values.name.trim() ? [person.name] : [])] });
    const duplicate = peopleContacts.find(item => item.id !== existing?.id && kitchenPersonKey(item) === kitchenPersonKey(next));
    if (duplicate) { body.querySelector('[data-contact-error]').textContent = 'This person is already saved for that organization.'; return; }
    peopleContacts = existing ? peopleContacts.map(item => item.id === existing.id ? next : item) : [...peopleContacts,next];
    persistPeopleContacts(); applyContactNameCorrections(); renderPeopleContacts(); dialog.close();
  };
  dialog.showModal();
}

function attachPeopleSuggestions(input, onPick) {
  if (!input || input.dataset.peopleBound) return;
  input.dataset.peopleBound = 'true';
  const datalist = document.createElement('datalist'); datalist.id = `people-${crypto.randomUUID()}`;
  input.after(datalist); input.setAttribute('list', datalist.id);
  const refresh = () => {
    const value = input.value.split(',').at(-1).trim().toLowerCase();
    const prefix = input.value.includes(',') ? input.value.slice(0, input.value.lastIndexOf(',') + 1) + ' ' : '';
    const names = new Map();
    getPeopleDirectory().forEach(person => { if (!names.has(person.name) && person.name.toLowerCase().includes(value)) names.set(person.name,person); });
    datalist.innerHTML = [...names.values()].map(person => `<option value="${escapeAttribute(prefix + person.name)}" label="${escapeAttribute([person.organization,person.role].filter(Boolean).join(' · '))}"></option>`).join('');
  };
  input.addEventListener('input',refresh); input.addEventListener('focus',refresh);
  input.addEventListener('change', () => {
    input.value = correctPeteName(input.value);
    const matches = getPeopleDirectory().filter(person => person.name.toLowerCase() === input.value.trim().toLowerCase());
    if (matches.length) onPick?.(matches[0]);
  });
  refresh();
}

function correctContactNames(value, aliases = []) {
  if (typeof value === 'string') {
    if (value.startsWith('data:')) return value;
    let result = correctPeteName(value);
    aliases.forEach(([from,to]) => { if (result === from) result = to; });
    return result;
  }
  if (Array.isArray(value)) return value.map(item => correctContactNames(item,aliases));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key,item]) => [key, key === 'previousNames' ? item : correctContactNames(item,aliases)]));
  return value;
}
function applyContactNameCorrections() {
  const aliases = peopleContacts.flatMap(person => person.previousNames.map(name => [name,person.name]));
  cloudSectionConfigs.filter(section => section.key !== peopleContactsStorageKey).forEach(section => {
    const before = section.get(); const after = correctContactNames(before,aliases);
    if (JSON.stringify(before) === JSON.stringify(after)) return;
    section.set(after); writeCloudSectionsToLocalStorage([section.key]); scheduleCloudSave(section.key);
  });
}

let peteCorrectionUser = '';
async function correctPeteTeamRecords() {
  const user = getCloudUser(); const client = getCloudClient();
  if (!user || !client || !window.foodBrokerBaseAuth?.isSuperUser() || peteCorrectionUser === user.id) return;
  for (const table of ['app_records','team_app_records']) {
    let offset = 0;
    while (true) {
      const {data,error} = await client.from(table).select('id,data,updated_at').eq('record_type',table==='app_records'?cloudRecordType:teamCloudRecordType).order('id').range(offset,offset+99);
      if (error) throw error;
      for (const row of data || []) {
        const corrected = correctContactNames(row.data);
        if (JSON.stringify(corrected) === JSON.stringify(row.data)) continue;
        const saved = await client.from(table).update({data:corrected}).eq('id',row.id).eq('updated_at',row.updated_at).select('id');
        if (saved.error || !saved.data?.length) throw saved.error || new Error('A record changed during name correction; retry on next sync.');
      }
      if ((data || []).length < 100) break;
      offset += 100;
    }
  }
  peteCorrectionUser = user.id;
}

function setContactsView(view) {
  const contacts = view === 'contacts';
  document.getElementById('operatorsView').hidden = contacts;
  document.getElementById('otherContactsView').hidden = !contacts;
  document.getElementById('showOperatorsView').setAttribute('aria-pressed', String(!contacts));
  document.getElementById('showOtherContactsView').setAttribute('aria-pressed', String(contacts));
  if (contacts) renderPeopleContacts();
}
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('showOperatorsView').onclick = () => setContactsView('operators');
  document.getElementById('showOtherContactsView').onclick = () => setContactsView('contacts');
  document.querySelector('#addPeopleContact')?.addEventListener('click',()=>{ setContactsView('contacts'); openPeopleContactForm(); });
  document.querySelectorAll('[data-contact-filter]').forEach(button => button.onclick = () => { activeContactFilter = button.dataset.contactFilter; renderPeopleContacts(); });
  document.querySelector('#peopleContactSearch')?.addEventListener('input',renderPeopleContacts);
  ['salesRepInput','syscoSalesRepInput'].forEach(id=>attachPeopleSuggestions(document.getElementById(id)));
  attachPeopleSuggestions(elements.marketSalesReps);
  attachPeopleSuggestions(elements.marketVisitorName);
  ['addressUsfSalesRep','addressSyscoSalesRep','nestleSalesRep'].forEach(key => attachPeopleSuggestions(elements[key]));
  applyContactNameCorrections(); renderPeopleContacts();
});
