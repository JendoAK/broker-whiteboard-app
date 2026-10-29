"use strict";

function contactCommunicationFields(person) {
  if (Object.hasOwn(person, 'email') || Object.hasOwn(person, 'phone')) {
    const email = String(person.email || '').trim(), phone = String(person.phone || '').trim();
    return {email, phone, contact:[email,phone].filter(Boolean).join(' · ')};
  }
  const legacy = String(person.contact || '').trim();
  const email = (legacy.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [''])[0];
  const phone = legacy.replace(email, '').replace(/^[\s·|,;]+|[\s·|,;]+$/g, '');
  return {email, phone, contact:legacy};
}
function attachContactValueSuggestions(form) {
  const defaults = {organization:['US Foods','Sysco','Quality Sales','Pierce Cartwright'],role:['Sales rep','Regional Manager','Category Manager','District Manager','Chef','Owner','Buyer']};
  for (const key of ['organization','role']) {
    const input = form.querySelector('[name="' + key + '"]');
    if (!input) continue;
    const values = new Map();
    [...defaults[key], ...getPeopleDirectory().map(person => person[key])].forEach(value => { if (value?.trim()) values.set(value.trim().toLowerCase(),value.trim()); });
    const list = document.createElement('datalist'); list.id = 'contact-options-' + crypto.randomUUID();
    list.innerHTML = [...values.values()].sort((a,b)=>a.localeCompare(b)).map(value => '<option value="' + escapeAttribute(value) + '"></option>').join('');
    input.setAttribute('list',list.id); input.placeholder = 'Choose or type a new ' + (key === 'organization' ? 'company' : 'role'); input.after(list);
  }
}
function peopleContactKey(person) {
  const model=window.foodBrokerContactDirectory;
  return !String(person.name || '').trim() && model.isSchool(person) && model.schoolName(person) ? JSON.stringify(['school-details',normalizeOperatorKey(model.schoolName(person))]) : kitchenPersonKey(person);
}
function peopleContactDisplayName(person) { return person.name || window.foodBrokerContactDirectory.schoolName(person) || 'School details'; }
function normalizePeopleContact(person) {
  person = { ...person, name: typeof person.name === 'string' && person.name !== '[object Object]' ? person.name : '' };
  const base = normalizeEventAttendee(person);
  return { ...base, ...window.foodBrokerContactDirectory.normalizeContact(person), id:base.id, ...contactCommunicationFields(person), name: correctPeteName(person.name || ''),
    previousNames: Array.isArray(person.previousNames) ? person.previousNames : [],
    updatedAt: person.updatedAt || '', archivedAt: person.archivedAt || '' };
}
function correctPeteName(value) { return String(value).replace(/\bPete\s+McCeneny\b/gi, 'Pete McEnaney'); }
function loadPeopleContacts() {
  try { return JSON.parse(localStorage.getItem('broker-whiteboard-people-contacts') || '[]').map(normalizePeopleContact); } catch { return []; }
}
function rememberPeopleContact(person) {
  person = {...person, ...contactCommunicationFields(person)};
  const existing = peopleContacts.find(item => peopleContactKey(item) === peopleContactKey(person));
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
    if ((!person.name.trim() && !(window.foodBrokerContactDirectory.isSchool(person) && window.foodBrokerContactDirectory.schoolName(person))) || person.archivedAt) return;
    const key = peopleContactKey(person);
    if (deleted.some(item => peopleContactKey(item) === key || (!person.organization && person.name.trim() && normalizeOperatorKey(item.name) === normalizeOperatorKey(person.name)))) return;
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
  const known = new Set([...result.values()].filter(p => p.organization && p.name.trim()).map(p => p.name.toLowerCase()));
  return [...result.values()].filter(p => !p.name.trim() && window.foodBrokerContactDirectory.isSchool(p) || p.organization || !known.has(p.name.toLowerCase())).sort((a,b) => a.name.localeCompare(b.name));
}

let activeContactFilter = 'all';
function isSchoolContact(person) {
  return window.foodBrokerContactDirectory.isSchool(person);
}
function contactMatchesFilter(person, filter = activeContactFilter) {
  return window.foodBrokerContactDirectory.matchesGroup(person,filter);
}
function renderContactActions(person) {
  return `<div class="contact-card-actions"><button class="contact-icon-action" type="button" data-edit-person-key="${escapeAttribute(peopleContactKey(person))}" aria-label="Edit ${escapeAttribute(peopleContactDisplayName(person))}" title="Edit contact">${icons.edit}</button><button type="button" class="contact-icon-action contact-delete" data-delete-person-key="${escapeAttribute(peopleContactKey(person))}" aria-label="Delete ${escapeAttribute(peopleContactDisplayName(person))}" title="Delete contact">${icons.trash}</button></div>`;
}
let peopleContactViewDialog = null;
function closePeopleContactView() {
  const dialog = peopleContactViewDialog;
  peopleContactViewDialog = null;
  if (!dialog) return;
  if (dialog.open) dialog.close();
  dialog.replaceChildren();
  dialog.remove();
}
function renderContactViewFields(fields = []) {
  return fields.length ? '<dl class="contact-detail-list">'+fields.map(field=>'<div><dt>'+escapeHtml(field.label)+'</dt><dd>'+escapeHtml(String(field.value))+'</dd></div>').join('')+'</dl>' : '';
}
function renderContactCommunication(person) {
  const values = [['Email',person.email],['Phone',person.phone]];
  return values.filter(([,value])=>value).map(([label,value])=>{
    const email=label==='Email' && /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(value);
    const shown=email?'<a href="mailto:'+escapeAttribute(encodeURIComponent(value))+'">'+escapeHtml(value)+'</a>':escapeHtml(value);
    return '<div><span>'+escapeHtml(label)+'</span><strong>'+shown+'</strong></div>';
  }).join('');
}
function openPeopleContactView(key,school = false) {
  const model=window.foodBrokerContactDirectory,directory=getPeopleDirectory();
  const group=school?model.groupSchools(directory).find(item=>item.key===key):null;
  const person=school?null:directory.find(item=>peopleContactKey(item)===key);
  const people=group?group.contacts:person?[person]:[];
  if (!people.length) return;
  closePeopleContactView();
  const title=group?group.name:peopleContactDisplayName(person),view=model.presentation(people,{title});
  const dialog=createVisitDialog(title);dialog.classList.add('contact-view-dialog');dialog.dataset.peopleContactView='true';peopleContactViewDialog=dialog;
  const body=dialog.querySelector('[data-visit-entry-body]');
  body.innerHTML='<div class="contact-view-intro"><span>'+(school?'School contacts':escapeHtml(person.category && !['Other','Operator / Restaurant'].includes(person.category)?person.category:'Contact'))+'</span>'+(school?'<p>'+people.length+' contact'+(people.length===1?'':'s')+'</p>':'')+'</div>'+'<div class="contact-view-people">'+view.people.map(item=>{
    const p=item.person;
    return '<article class="contact-view-person"><header><div>'+(school?'<h3>'+escapeHtml(peopleContactDisplayName(p))+'</h3>':'')+(p.role?'<p class="contact-view-role">'+escapeHtml(p.role)+'</p>':'')+'</div>'+renderContactActions(p)+'</header><div class="contact-view-communication">'+renderContactCommunication(p)+'</div>'+renderContactViewFields(item.fields)+'</article>';
  }).join('')+'</div>'+(view.fields.length?'<section class="contact-view-common"><h3>'+(school?'School details':'Additional details')+'</h3>'+renderContactViewFields(view.fields)+'</section>':'')+(view.sources.length?'<div class="contact-view-import"><button type="button" class="ghost-action" data-contact-import-toggle aria-expanded="false">Import details</button><div data-contact-import-details hidden>'+renderContactViewFields(view.sources)+'</div></div>':'')+'<div class="contact-view-footer"><button type="button" class="ghost-action" data-contact-view-close>Close</button></div>';
  body.querySelector('[data-contact-view-close]').onclick=closePeopleContactView;
  body.querySelector('[data-contact-import-toggle]')?.addEventListener('click',event=>{
    const open=event.currentTarget.getAttribute('aria-expanded')!=='true';
    event.currentTarget.setAttribute('aria-expanded',String(open));
    body.querySelector('[data-contact-import-details]').hidden=!open;
  });
  body.querySelectorAll('[data-edit-person-key]').forEach(button=>button.onclick=()=>{
    const selected=getPeopleDirectory().find(item=>peopleContactKey(item)===button.dataset.editPersonKey);
    closePeopleContactView();if(selected)openPeopleContactForm(selected);
  });
  body.querySelectorAll('[data-delete-person-key]').forEach(button=>button.onclick=()=>{
    const selected=button.dataset.deletePersonKey;
    deletePeopleContact(selected);
    if(!getPeopleDirectory().some(item=>peopleContactKey(item)===selected))closePeopleContactView();
  });
  dialog.addEventListener('close',()=>{if(peopleContactViewDialog===dialog)peopleContactViewDialog=null;dialog.replaceChildren();dialog.remove();});
  dialog.showModal();
}
window.addEventListener('foodbrokerbase:workspace-leaving',closePeopleContactView,true);
function renderContactGroupButtons(directory) {
  const toolbar=document.querySelector('.contact-filter-buttons');
  if(!toolbar)return;
  toolbar.querySelectorAll('[data-contact-custom]').forEach(button=>button.remove());
  const known=new Set([...toolbar.querySelectorAll('[data-contact-filter]')].map(button=>normalizeOperatorKey(button.textContent)));
  known.add('our team');known.add('distributor');known.add('vendor');known.add('operator / restaurant');known.add('other');
  const groups=new Map();
  directory.forEach(person=>[...(person.groups || []),person.category].filter(Boolean).forEach(group=>{const key=normalizeOperatorKey(group);if(!known.has(key))groups.set(key,group);}));
  [...groups.values()].sort((a,b)=>a.localeCompare(b)).forEach(group=>{const button=document.createElement('button');button.type='button';button.dataset.contactFilter='group:'+group;button.dataset.contactCustom='true';button.textContent=group;button.setAttribute('aria-pressed',String(button.dataset.contactFilter===activeContactFilter));toolbar.append(button);});
}
function renderPeopleContacts() {
  const panel=document.querySelector('#peopleContactsPanel');
  if(!panel)return;
  const query=normalizeOperatorKey(document.querySelector('#peopleContactSearch')?.value || '');
  const directory=getPeopleDirectory(),model=window.foodBrokerContactDirectory;
  renderContactGroupButtons(directory);
  const people=directory.filter(person=>person.category!=='Operator / Restaurant' || activeContactFilter==='school' && isSchoolContact(person)).filter(person=>contactMatchesFilter(person)).filter(person=>normalizeOperatorKey(model.searchText(person)).includes(query));
  document.querySelectorAll('[data-contact-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.contactFilter===activeContactFilter)));
  const schools=model.groupSchools(people.filter(isSchoolContact)),fullSchools=new Map(model.groupSchools(directory).map(school=>[school.key,school])),others=people.filter(person=>!isSchoolContact(person));
  const count=document.getElementById('contactMatchCount');
  if(count)count.textContent=people.length+(people.length===1?' contact':' contacts')+(schools.length?' · '+schools.length+' school'+(schools.length===1?'':'s'):'');
  panel.innerHTML=schools.map(match=>{
    const school=fullSchools.get(match.key) || match,names=school.contacts.map(person=>person.name).filter(Boolean),preview=names.slice(0,2).join(' · ')+(names.length>2?' +'+(names.length-2)+' more':'');
    return '<button class="contact-directory-card contact-school-card" type="button" data-open-school-key="'+escapeAttribute(school.key)+'" aria-haspopup="dialog" aria-label="View contacts for '+escapeAttribute(school.name)+'"><span class="contact-card-kind">School · '+school.contacts.length+' contact'+(school.contacts.length===1?'':'s')+'</span><strong>'+escapeHtml(school.name)+'</strong>'+(preview?'<span class="contact-card-preview">'+escapeHtml(preview)+'</span>':'')+'<span class="contact-card-open" aria-hidden="true">›</span></button>';
  }).join('')+others.map(person=>'<button class="contact-directory-card" type="button" data-open-person-key="'+escapeAttribute(peopleContactKey(person))+'" aria-haspopup="dialog" aria-label="View '+escapeAttribute(peopleContactDisplayName(person))+'"><strong>'+escapeHtml(peopleContactDisplayName(person))+'</strong><span class="contact-card-preview">'+escapeHtml([person.role,normalizeOperatorKey(person.organization)!==normalizeOperatorKey(peopleContactDisplayName(person))?person.organization:''].filter(Boolean).join(' · '))+'</span>'+(person.email || person.phone?'<span class="contact-card-communication">'+escapeHtml(person.email || person.phone)+'</span>':'')+'<span class="contact-card-open" aria-hidden="true">›</span></button>').join('') || '<p>No matching people. Add a contact to save their details.</p>';
  const deleted=peopleContacts.filter(person=>person.archivedAt);
  if(deleted.length)panel.insertAdjacentHTML('beforeend','<details class="deleted-contacts"><summary>Deleted contacts ('+deleted.length+')</summary>'+deleted.map(person=>'<div><span>'+escapeHtml(peopleContactDisplayName(person))+' · '+escapeHtml(person.organization)+'</span><button type="button" class="edit-card" data-restore-person="'+escapeAttribute(person.id)+'">Restore</button></div>').join('')+'</details>');
  panel.querySelectorAll('[data-open-school-key]').forEach(button=>button.onclick=()=>openPeopleContactView(button.dataset.openSchoolKey,true));
  panel.querySelectorAll('[data-open-person-key]').forEach(button=>button.onclick=()=>openPeopleContactView(button.dataset.openPersonKey));
  panel.querySelectorAll('[data-restore-person]').forEach(button=>button.onclick=()=>{peopleContacts=peopleContacts.map(person=>person.id===button.dataset.restorePerson?{...person,archivedAt:'',updatedAt:new Date().toISOString()}:person);persistPeopleContacts();});
}

function deletePeopleContact(key) {
  const person = getPeopleDirectory().find(item => peopleContactKey(item) === key);
  if (!person || !confirm('Delete ' + peopleContactDisplayName(person) + ' from the shared contact list and name suggestions? Existing leads and event records will keep their details. You can restore this contact under Deleted contacts.')) return;
  const existing = peopleContacts.find(item => peopleContactKey(item) === key);
  const deleted = normalizePeopleContact({...person, id:existing?.id || crypto.randomUUID(), archivedAt:new Date().toISOString(), updatedAt:new Date().toISOString()});
  peopleContacts = existing ? peopleContacts.map(item => item.id === existing.id ? deleted : item) : [...peopleContacts,deleted];
  persistPeopleContacts();
}
function renderContactExtraField(field = {}) {
  return `<div class="contact-extra-field"><label><span>Detail name</span><input data-extra-label value="${escapeAttribute(String(field.label || ''))}" maxlength="160" placeholder="Column name" /></label><label><span>Value</span><textarea data-extra-value rows="2" maxlength="10000">${escapeHtml(String(field.value == null ? '' : field.value))}</textarea></label><button type="button" class="contact-icon-action contact-delete" data-remove-extra aria-label="Remove detail" title="Remove detail">${icons.trash}</button></div>`;
}
function openPeopleContactForm(person = {}) {
  const selectedCategory=person.category;
  person = { ...person, ...window.foodBrokerContactDirectory.normalizeContact(person), ...contactCommunicationFields(person) };
  const category = selectedCategory ? person.category : activeContactFilter === 'school' ? 'School' : activeContactFilter === 'admin' ? 'Admin Contact' : 'Distributor';
  const existing = peopleContacts.find(item => peopleContactKey(item) === peopleContactKey(person));
  const dialog = createVisitDialog(existing ? 'Edit shared contact' : 'Save shared contact');
  const body = dialog.querySelector('[data-visit-entry-body]');
  body.innerHTML = `<p>Shared with your team. School contacts appear together under their school name.</p><form><div class="field-grid">${['name','organization','role','email','phone','schoolName','location','address','website'].map(key => `<label><span>${({name:'Name',organization:'Company / organization',role:'Role',email:'Email',phone:'Phone',schoolName:'School name (if applicable)',location:'Location',address:'Address',website:'Website'})[key]}</span><input name="${key}" type="${key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'}" value="${escapeAttribute(person[key] || (key === 'organization' && window.foodBrokerContactDirectory.isSchool(person) ? window.foodBrokerContactDirectory.schoolName(person) : ''))}" ${key === 'organization' || key === 'name' && category !== 'School' && !window.foodBrokerContactDirectory.isSchool(person) ? 'required' : ''} /></label>`).join('')}<label><span>Contact type</span><select name="category">${[...new Set(['Distributor','Vendor','Our team','School','Admin Contact','Operator / Restaurant','Other',category])].map(value=>`<option${value===category?' selected':''}>${escapeHtml(value)}</option>`).join('')}</select></label><label><span>Groups (separate with commas)</span><input name="groups" value="${escapeAttribute((person.groups?.length?person.groups:activeContactFilter.startsWith('group:')?[activeContactFilter.slice(6)]:[]).join(', '))}" placeholder="Admin Contact, School, or a new group" /></label><label><span>Notes</span><textarea name="notes" rows="3" maxlength="10000">${escapeHtml(person.notes || '')}</textarea></label></div><details class="contact-extra-editor"${person.extraFields?.length?' open':''}><summary>Additional details${person.extraFields?.length?' ('+person.extraFields.length+')':''}</summary><p>Keep the original column names and values from your contact list.</p><div data-contact-extra-fields>${(person.extraFields || []).map(renderContactExtraField).join('')}</div><button type="button" data-add-extra class="ghost-action">+ Add detail</button></details><p role="alert" data-contact-error></p><div class="form-actions"><button class="primary-action" type="submit">Save contact</button></div></form>`;
  attachContactValueSuggestions(body.querySelector('form'));
  body.querySelector('[data-add-extra]').onclick=()=>body.querySelector('[data-contact-extra-fields]').insertAdjacentHTML('beforeend',renderContactExtraField());
  body.querySelector('[data-contact-extra-fields]').addEventListener('click',event=>{const button=event.target.closest('[data-remove-extra]');if(button)button.closest('.contact-extra-field').remove();});
  body.querySelector('form').onsubmit = event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const extraFields=[...body.querySelectorAll('.contact-extra-field')].map(row=>({label:row.querySelector('[data-extra-label]').value.trim(),value:row.querySelector('[data-extra-value]').value})).filter(field=>field.label || field.value);
    if(extraFields.some(field=>!field.label)){body.querySelector('[data-contact-error]').textContent='Give each additional detail a name.';return;}
    const next = normalizePeopleContact({ ...person, ...existing, ...values, id:existing?.id || crypto.randomUUID(), groups:values.groups.split(',').map(value=>value.trim()).filter(Boolean), extraFields, name: values.name.trim(), organization: values.organization.trim(), updatedAt: new Date().toISOString(), previousNames: [...(existing?.previousNames || []), ...(person.name && person.name !== values.name.trim() ? [person.name] : [])] });
    if(!next.name.trim() && !(window.foodBrokerContactDirectory.isSchool(next) && window.foodBrokerContactDirectory.schoolName(next))){body.querySelector('[data-contact-error]').textContent='Enter a contact name, or a school name for school details.';return;}
    const duplicate = peopleContacts.find(item => item.id !== existing?.id && peopleContactKey(item) === peopleContactKey(next));
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
    getPeopleDirectory().forEach(person => { if (person.name.trim() && !names.has(person.name) && person.name.toLowerCase().includes(value)) names.set(person.name,person); });
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
      const {data,error} = await client.from(table).select('id,data,updated_at,record_key').eq('record_type',table==='app_records'?cloudRecordType:teamCloudRecordType).order('id').range(offset,offset+99);
      if (error) throw error;
      for (const row of data || []) {
        // Directory corrections use the normal version-checked save path.
        if (table === 'team_app_records' && ['broker-whiteboard-people-contacts','broker-whiteboard-address-book'].includes(row.record_key)) continue;
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
  document.querySelector('.contact-filter-buttons')?.addEventListener('click',event=>{const button=event.target.closest('[data-contact-filter]');if(button){activeContactFilter=button.dataset.contactFilter;renderPeopleContacts();}});
  document.querySelector('#peopleContactSearch')?.addEventListener('input',renderPeopleContacts);
  ['salesRepInput','syscoSalesRepInput'].forEach(id=>attachPeopleSuggestions(document.getElementById(id)));
  attachPeopleSuggestions(elements.marketSalesReps);
  attachPeopleSuggestions(elements.marketVisitorName);
  ['addressUsfSalesRep','addressSyscoSalesRep','nestleSalesRep'].forEach(key => attachPeopleSuggestions(elements[key]));
  applyContactNameCorrections(); renderPeopleContacts();
});
