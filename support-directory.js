/* Product Support directory. All reads and writes use the restricted directory RPCs. */
(function () {
  "use strict";
  const model = window.foodBrokerContactDirectory;
  const $ = id => document.getElementById(id);
  const text = value => value == null ? "" : ["string","number","boolean"].includes(typeof value) ? String(value) : "";
  const esc = value => text(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const normal = value => text(value).normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  const asList = value => Array.isArray(value) ? value.map(text) : text(value) ? [text(value)] : [];
  const join = value => asList(value).join(", ");
  const split = value => text(value).split(/[,;\n]+/).map(value=>value.trim()).filter(Boolean);
  const contactFields = ["id","name","organization","role","contact","email","phone","category","schoolName","groups","extraFields","location","address","website","notes"];
  const operatorFields = ["id","operation","accountNumber","syscoAccountNumber","locations","address","website","notes","deliveryDays","usfSalesRep","syscoSalesRep"];
  const fixedGroups = [["all","All"],["usfoods","US Foods"],["sysco","Sysco"],["regional","Regional Managers"],["pc","Pierce Cartwright"],["school","School"],["admin","Admin Contact"]];
  const operatorContactSources = new Map();
  const state = {uid:"",generation:0,request:0,view:"",loaded:false,contacts:[],operators:[],contactSearch:"",operatorSearch:"",filter:"all",contactsReadOnly:true,operatorsReadOnly:true,dialog:null,returnFocus:null,saving:false};
  function identity() {
    const auth=window.foodBrokerBaseAuth,user=auth?.getCurrentUser?.(),profile=auth?.getCurrentProfile?.();
    return user?.id && text(profile?.id)===text(user.id) && profile?.role==="product_support" && !auth?.isPasswordRecovery?.() ? text(user.id) : "";
  }
  function allowed() {return Boolean(state.uid && identity()===state.uid);}
  const capture = () => ({uid:state.uid,generation:state.generation});
  const valid = value => allowed() && value.uid===state.uid && value.generation===state.generation;
  function cleanError(error) {
    const clean=value=>text(value).replace(/Bearer\s+\S+/gi,"Bearer [redacted]").replace(/\beyJ[\w-]+\.[\w-]+(?:\.[\w-]+)?\b/g,"[token redacted]").replace(/\b(?:sb_secret_\S+|sb_publishable_\S+)\b/g,"[key redacted]").replace(/https?:\/\/[^\s]+/gi,"[URL]").replace(/\b(?:Failing row contains|row contains)\s*\([^)]*\)/gi,"Row [values redacted]").replace(/\bKey\s*\([^)]*\)\s*=\s*\([^)]*\)/gi,"Key [values redacted]").replace(/\{[^{}]*\}/g,"[record details redacted]").slice(0,1200);
    return [error?.code && "Code: "+clean(error.code),"Message: "+clean(error?.message || error || "The directory could not be loaded.")].filter(Boolean).join("\n");
  }
  function message(error) {
    if(["42883","PGRST202","PGRST203"].includes(text(error?.code)) || /function.*(?:does not exist|schema cache)/i.test(text(error?.message))) return "The restricted directory is not enabled yet. Please try again after the update is enabled.";
    if(["40001","409","P0002"].includes(text(error?.code)) || /changed|conflict|version/i.test(text(error?.message))) return "This record changed while you were editing. Your edits are still here. Reopen the latest record before saving again.";
    return text(error?.message) ? "The request could not be completed. Your edits are kept below; check the error details and try again." : "The request could not be completed. Please refresh and try again.";
  }
  function setStatus(section,messageValue,tone="",error=null) {
    const status=section?.querySelector("[data-dir-status]");if(!status)return;
    status.textContent=messageValue;status.dataset.tone=tone;
    const box=section.querySelector("[data-dir-error]");box.hidden=!error;if(error){box.open=true;box.querySelector("pre").textContent=cleanError(error);}else{box.open=false;box.querySelector("pre").textContent="";}
  }
  function markup(kind) {
    const contacts=kind==="contacts";
    return '<div class="ps-directory"><div class="ps-directory-heading"><div><h2>'+(contacts?'Contacts':'Operators')+'</h2><p>'+(contacts?'Shared team contacts, organized by group and school.':'Shared operator details and their contacts.')+'</p></div><button type="button" class="primary-action" data-dir-add="'+kind+'" hidden>+ Add '+(contacts?'contact':'operator')+'</button></div><div class="ps-directory-toolbar"><label><span class="ps-directory-sr-only">Search '+kind+'</span><input type="search" data-dir-search="'+kind+'" placeholder="'+(contacts?'Find a school, person, group or contact detail…':'Find an operator, contact, account or other detail…')+'" /></label>'+(contacts?'<div class="ps-directory-groups" data-dir-groups role="group" aria-label="Contact groups"></div>':'')+'</div><p data-dir-status class="ps-status" role="status" aria-live="polite"></p><details data-dir-error class="ps-error" hidden><summary>Error details</summary><pre></pre></details><p data-dir-count class="ps-hint" role="status" aria-live="polite"></p><div data-dir-list class="ps-directory-list"></div></div>';
  }
  function ensure(kind) {
    const section=$(kind==="contacts"?"psContacts":"psOperators");if(!section)return null;
    if(!section.querySelector(".ps-directory"))section.innerHTML=markup(kind);
    if(!section.dataset.directoryBound){
      section.dataset.directoryBound="true";
      section.addEventListener("input",event=>{if(!allowed())return;const input=event.target.closest("[data-dir-search]");if(!input)return;if(input.dataset.dirSearch==="contacts"){state.contactSearch=input.value;renderContacts();}else{state.operatorSearch=input.value;renderOperators();}});
      section.addEventListener("click",event=>{
        if(!allowed())return;
        const group=event.target.closest("[data-dir-group]");if(group){state.filter=group.dataset.dirGroup;renderContacts();return;}
        const school=event.target.closest("[data-dir-open-school]");if(school){openSchool(school.dataset.dirOpenSchool,school);return;}
        const person=event.target.closest("[data-dir-open-contact]");if(person){openContact(person.dataset.dirOpenContact,person);return;}
        const operatorCard=event.target.closest("[data-dir-open-operator]");if(operatorCard){openOperator(operatorCard.dataset.dirOpenOperator,operatorCard);return;}
        const add=event.target.closest("[data-dir-add]");if(add){if(add.dataset.dirAdd==="contacts"&&!state.contactsReadOnly)editContact();if(add.dataset.dirAdd==="operators"&&!state.operatorsReadOnly)editOperator();return;}
        const contact=event.target.closest("[data-dir-edit-contact]");if(contact){editDirectoryContact(contact.dataset.dirEditContact);return;}
        const operator=event.target.closest("[data-dir-edit-operator]");if(operator&&!state.operatorsReadOnly){const item=state.operators.find(item=>item.id===operator.dataset.dirEditOperator);if(item)editOperator(item);}
      });
    }
    return section;
  }
  function field(label,value) {return value===undefined || value===null || value==="" ? "" : '<div><dt>'+esc(label)+'</dt><dd>'+esc(Array.isArray(value)?value.map(text).join(", "):value)+'</dd></div>';}
  function detailFields(fields) {return fields.length?'<dl class="ps-directory-details">'+fields.map(item=>field(item.label,item.value)).join("")+'</dl>':"";}
  function editDirectoryContact(key) {
    if(!allowed()||state.saving)return;const operatorId=operatorContactSources.get(key);
    if(operatorId&&!state.operatorsReadOnly){const operator=state.operators.find(item=>item.id===operatorId);if(operator)editOperator(operator);}
    else if(!operatorId&&!state.contactsReadOnly){const person=state.contacts.find(person=>person.id===key);if(person)editContact(person);}
  }
  function contactBody(entry,title,editable=true,single=false) {
    const person=entry.person,derived=operatorContactSources.has(person.id),canEdit=derived?!state.operatorsReadOnly:!state.contactsReadOnly;
    const heading=single&&normal(person.name || person.organization)===normal(title)?"":'<h3>'+esc(person.name || "School details")+'</h3>';
    return '<article class="ps-directory-view-person"><div class="ps-directory-person-heading"><div>'+heading+(person.role?'<p class="ps-directory-person-role">'+esc(person.role)+'</p>':"")+'</div>'+(editable&&canEdit?'<button type="button" class="ps-text" data-dir-edit-contact="'+esc(person.id)+'">'+(derived?'Edit operator contact':'Edit contact')+'</button>':"")+'</div>'+detailFields([{label:"Email",value:person.email},{label:"Phone",value:person.phone}].filter(item=>item.value))+detailFields(entry.fields)+'</article>';
  }
  function dismissDialog(element,restore=true) {
    if(element.open)element.close();element.remove();if(state.dialog!==element)return;state.dialog=null;
    const target=state.returnFocus;if(restore){state.returnFocus=null;restoreDirectoryFocus(target);}
  }
  function restoreDirectoryFocus(target) {
    if(!allowed()||!target)return;let next=target;
    if(!next.isConnected)for(const name of ["data-dir-open-school","data-dir-open-contact","data-dir-open-operator"]){const value=target.getAttribute(name);if(value!==null){next=[...document.querySelectorAll("["+name+"]")].find(node=>node.getAttribute(name)===value);break;}}
    if(next?.isConnected)next.focus({preventScroll:true});
  }
  function openDetail(title,people,trigger,{fields=[],operator=null}={}) {
    if(!allowed()||state.saving)return;if(state.dialog)dismissDialog(state.dialog,false);
    const token=capture(),presentation=model.presentation(people,{title}),element=document.createElement("dialog");
    element.className="ps-directory-dialog ps-directory-detail-dialog";element.dataset.supportDirectoryDialog="details";state.returnFocus=trigger || document.activeElement;
    const comparable=value=>normal(value).replace(/s$/,"");
    const notRepeated=item=>!fields.some(existing=>comparable(existing.label)===comparable(item.label)&&normal(existing.value)===normal(item.value));
    const shared=presentation.fields.filter(notRepeated),shownPeople=presentation.people.map(entry=>({...entry,fields:entry.fields.filter(notRepeated)}));
    const titleId="ps-directory-detail-title";element.setAttribute("aria-labelledby",titleId);
    element.innerHTML='<div class="ps-directory-view-shell"><div class="ps-directory-dialog-heading"><h2 id="'+titleId+'">'+esc(title)+'</h2><button type="button" data-directory-close aria-label="Close">×</button></div><div class="ps-directory-view-content">'+detailFields(fields)+'<div class="ps-directory-view-people">'+shownPeople.map(entry=>contactBody(entry,title,!operator,shownPeople.length===1)).join("")+'</div>'+(shared.length?'<section class="ps-directory-shared-details" aria-label="Shared details"><h3>'+(!operator&&people.every(model.isSchool)?'School details':'Additional details')+'</h3>'+detailFields(shared)+'</section>':"")+(presentation.sources.length?'<div class="ps-directory-import-details"><button type="button" class="ps-text" data-directory-import aria-expanded="false" aria-controls="ps-directory-import-fields">Import details</button><div id="ps-directory-import-fields" data-directory-sources hidden>'+detailFields(presentation.sources)+'</div></div>':"")+'</div><div class="ps-directory-dialog-actions">'+(operator&&!state.operatorsReadOnly?'<button type="button" class="primary-action" data-dir-edit-operator="'+esc(operator.id)+'">Edit operator</button>':"")+'<button type="button" data-directory-close>Close</button></div></div>';
    document.body.appendChild(element);state.dialog=element;
    element.addEventListener("click",event=>{
      if(!valid(token)||state.dialog!==element)return;
      if(event.target.closest("[data-directory-close]")){dismissDialog(element);return;}
      const source=event.target.closest("[data-directory-import]");if(source){const target=element.querySelector("[data-directory-sources]");target.hidden=!target.hidden;source.setAttribute("aria-expanded",String(!target.hidden));return;}
      const contact=event.target.closest("[data-dir-edit-contact]");if(contact){const key=contact.dataset.dirEditContact;dismissDialog(element,false);editDirectoryContact(key);return;}
      const edit=event.target.closest("[data-dir-edit-operator]");if(edit&&!state.operatorsReadOnly){const item=state.operators.find(item=>item.id===edit.dataset.dirEditOperator);if(item){dismissDialog(element,false);editOperator(item);}}
    });
    element.addEventListener("cancel",event=>{event.preventDefault();dismissDialog(element);});element.showModal();element.querySelector("[data-directory-close]").focus({preventScroll:true});
  }
  function openSchool(key,trigger) {const school=model.groupSchools(displayContacts()).find(item=>item.key===key);if(school)openDetail(school.name,school.contacts,trigger);}
  function openContact(id,trigger) {const person=displayContacts().find(item=>item.id===id);if(person)openDetail(person.name || person.organization || "Contact",[person],trigger);}
  function openOperator(id,trigger) {
    const item=state.operators.find(operator=>operator.id===id);if(!item)return;
    const fields=[["US Foods account",item.accountNumber],["Sysco account",item.syscoAccountNumber],["Locations",item.locations],["Address",item.address],["Website",item.website],["Delivery days",join(item.deliveryDays)],["US Foods sales reps",join(item.usfSalesRep)],["Sysco sales reps",join(item.syscoSalesRep)],["Notes",item.notes]].filter(([,value])=>value!=="").map(([label,value])=>({label,value}));
    openDetail(item.operation || "Operator",operatorPeople(item),trigger,{fields,operator:item});
  }
  function preview(values) {return values.filter(Boolean).slice(0,3).join(" · ");}
  function displayContacts() {
    operatorContactSources.clear();
    const actual=state.contacts.filter(person=>!person.archivedAt),result=actual.map(person=>({...person,groups:person.groups.slice(),extraFields:person.extraFields.slice()})),seen=new Map(actual.map((person,index)=>[normal(person.name)+"\n"+normal(model.schoolName(person)),index]));
    state.operators.forEach(operator=>{
      const schoolOperator=model.isSchool({organization:operator.operation}),entries=[["primary",operator.primaryContact],["secondary",operator.secondaryContact],...operator.contacts.map((person,index)=>[person.id || "index-"+index,person])].filter(([,person])=>hasPerson(person));
      if(schoolOperator&&!entries.length)entries.push(["institution",model.normalizeContact({})]);
      entries.forEach(([slot,person])=>{
        if(!schoolOperator&&!model.isSchool(person))return;
        const derived=model.normalizeContact({...person,id:"operator:"+operator.id+":"+slot,schoolName:person.schoolName || operator.operation,organization:person.organization || operator.operation,category:model.isSchool(person)?person.category:"School",location:person.location || operator.locations,address:person.address || operator.address,website:person.website || operator.website,notes:person.notes || operator.notes});
        const contactKey=normal(derived.name)+"\n"+normal(model.schoolName(derived));
        if(seen.has(contactKey)){
          const index=seen.get(contactKey),preferred=result[index],merged={...preferred};
          for(const field of ["organization","role","email","phone","schoolName","location","address","website","notes"])if(!text(merged[field])&&text(derived[field]))merged[field]=derived[field];
          merged.groups=[...preferred.groups,...derived.groups];const known=new Set(preferred.extraFields.map(field=>JSON.stringify([field.label,field.value])));
          merged.extraFields=[...preferred.extraFields,...derived.extraFields.filter(field=>{const pair=JSON.stringify([field.label,field.value]);if(known.has(pair))return false;known.add(pair);return true;})];
          result[index]=model.normalizeContact(merged);return;
        }
        seen.set(contactKey,result.length);result.push(derived);operatorContactSources.set(derived.id,operator.id);
      });
    });
    return result;
  }
  function renderContacts() {
    if(!allowed())return;const section=ensure("contacts");if(!section)return;
    const reserved=new Set([...fixedGroups.map(([,name])=>normal(name)),"our team"]),custom=new Map();
    const directory=displayContacts();directory.forEach(person=>model.groupsFor(person).forEach(name=>{if(!reserved.has(normal(name))&&!custom.has(normal(name)))custom.set(normal(name),name);}));
    const groups=[...fixedGroups,...[...custom.values()].sort((a,b)=>a.localeCompare(b)).map(name=>["group:"+name,name])];
    if(!groups.some(([filter])=>filter===state.filter))state.filter="all";
    section.querySelector("[data-dir-groups]").innerHTML=groups.map(([filter,name])=>'<button type="button" data-dir-group="'+esc(filter)+'" aria-pressed="'+(state.filter===filter)+'">'+esc(name)+'</button>').join("");
    section.querySelector("[data-dir-search]").value=state.contactSearch;
    const query=normal(state.contactSearch),people=directory.filter(person=>model.matchesGroup(person,state.filter)&&(!query||normal(model.searchText(person)).includes(query)));
    const schools=model.groupSchools(people),others=people.filter(person=>!model.isSchool(person));
    section.querySelector("[data-dir-count]").textContent=people.length+" contact"+(people.length===1?"":"s")+(schools.length?" · "+schools.length+" school"+(schools.length===1?"":"s"):"")+(state.loaded&&state.contactsReadOnly?" · View only":"");
    const allSchools=new Map(model.groupSchools(directory).map(school=>[school.key,school]));
    section.querySelector("[data-dir-list]").innerHTML=schools.map(match=>{const school=allSchools.get(match.key)||match;return '<button type="button" class="ps-directory-card ps-directory-school" data-dir-open-school="'+esc(school.key)+'" aria-haspopup="dialog"><span class="ps-directory-card-title">'+esc(school.name)+'</span><span class="ps-directory-card-count">'+school.contacts.length+' contact'+(school.contacts.length===1?'':'s')+'</span><span class="ps-directory-card-preview">'+esc(preview(school.contacts.map(person=>person.name || person.role)))+(school.contacts.length>3?' …':"")+'</span><span class="ps-directory-card-action">View contacts <span aria-hidden="true">›</span></span></button>';}).join("")+others.map(person=>'<button type="button" class="ps-directory-card ps-directory-contact" data-dir-open-contact="'+esc(person.id)+'" aria-haspopup="dialog"><span class="ps-directory-card-title">'+esc(person.name || person.organization || "Contact")+'</span><span class="ps-directory-card-meta">'+esc(preview([person.role,normal(person.organization)===normal(person.name)?"":person.organization]))+'</span><span class="ps-directory-card-preview">'+esc(person.email || person.phone || "")+'</span><span class="ps-directory-card-action">View contact <span aria-hidden="true">›</span></span></button>').join("") || '<p class="ps-empty">'+(state.loaded?'No contacts match these choices.':'Loading the shared contacts…')+'</p>';
    section.querySelector("[data-dir-add]").hidden=!state.loaded||state.contactsReadOnly;
  }
  function safeOperator(value) {
    const result={};for(const name of operatorFields)result[name]=["deliveryDays","usfSalesRep","syscoSalesRep"].includes(name)&&Array.isArray(value?.[name])?value[name].map(text):text(value?.[name]);
    result.deliveryDays=asList(result.deliveryDays);result.primaryContact=model.normalizeContact(value?.primaryContact || {});result.secondaryContact=model.normalizeContact(value?.secondaryContact || {});result.contacts=Array.isArray(value?.contacts)?value.contacts.map(model.normalizeContact):[];result.updatedAt=text(value?.updatedAt);return result;
  }
  function hasPerson(person) {return [person.name,person.organization,person.role,person.contact,person.schoolName,person.location,person.address,person.website,person.notes,...person.groups].some(value=>value!=="")||person.extraFields.length>0;}
  function operatorPeople(item) {return [item.primaryContact,item.secondaryContact,...item.contacts].filter(hasPerson);}
  function operatorSearch(item) {return [...operatorFields.map(name=>join(item[name])),...operatorPeople(item).map(model.searchText)].join("\n");}
  function renderOperators() {
    if(!allowed())return;const section=ensure("operators");if(!section)return;
    section.querySelector("[data-dir-search]").value=state.operatorSearch;const query=normal(state.operatorSearch),items=state.operators.filter(item=>!query||normal(operatorSearch(item)).includes(query));
    section.querySelector("[data-dir-count]").textContent=items.length+" operator"+(items.length===1?"":"s")+(state.loaded&&state.operatorsReadOnly?" · View only":"");
    section.querySelector("[data-dir-list]").innerHTML=items.map(item=>'<button type="button" class="ps-directory-card ps-directory-operator" data-dir-open-operator="'+esc(item.id)+'" aria-haspopup="dialog"><span class="ps-directory-card-title">'+esc(item.operation || "Operator")+'</span><span class="ps-directory-card-count">'+operatorPeople(item).length+' contact'+(operatorPeople(item).length===1?'':'s')+'</span><span class="ps-directory-card-preview">'+esc(preview([item.locations,item.address]))+'</span><span class="ps-directory-card-action">View operator <span aria-hidden="true">›</span></span></button>').join("") || '<p class="ps-empty">'+(state.loaded?'No operators match this search.':'Loading the shared operators…')+'</p>';
    section.querySelector("[data-dir-add]").hidden=!state.loaded||state.operatorsReadOnly;
  }
  function render() {renderContacts();renderOperators();}
  async function load() {
    if(!allowed())return;const token=capture(),request=++state.request;[ensure("contacts"),ensure("operators")].forEach(section=>setStatus(section,"Loading shared contacts and operators…","waiting"));
    try {
      const {data,error}=await window.foodBrokerBaseAuth.client.rpc("get_product_support_directory");if(!valid(token)||request!==state.request)return;if(error)throw error;
      if(!data||!Array.isArray(data.contacts)||!Array.isArray(data.operators))throw new Error("The directory response was incomplete.");
      const contacts=data.contacts.map(model.normalizeContact),operators=data.operators.map(safeOperator);
      state.contacts=contacts;state.operators=operators;state.contactsReadOnly=data.contactsReadOnly!==false;state.operatorsReadOnly=data.operatorsReadOnly!==false;state.loaded=true;render();
      [ensure("contacts"),ensure("operators")].forEach(section=>setStatus(section,"Up to date"));
    }catch(error){if(valid(token)&&request===state.request)[ensure("contacts"),ensure("operators")].forEach(section=>{setStatus(section,message(error),"error",error);if(!state.loaded)section.querySelector("[data-dir-list]").innerHTML='<p class="ps-empty">The directory is unavailable. Please refresh after access is enabled.</p>';});}
  }
  function show(view) {
    if(!["contacts","operators"].includes(view))return;const uid=identity();if(!uid){clear();return;}if(state.uid!==uid){clear();state.uid=uid;}state.view=view;ensure(view);render();if(!state.loaded)load();
  }
  function refresh() {if(allowed()&&(state.loaded||["contacts","operators"].includes(state.view)))return load();}
  function clear() {
    state.generation++;state.request++;state.uid="";state.loaded=false;state.contacts=[];state.operators=[];state.contactSearch="";state.operatorSearch="";state.filter="all";state.view="";state.contactsReadOnly=true;state.operatorsReadOnly=true;state.saving=false;operatorContactSources.clear();
    if(state.dialog){state.dialog.remove();state.dialog=null;}state.returnFocus=null;["psContacts","psOperators"].forEach(id=>$(id)?.replaceChildren());
  }
  function input(name,title,value="",wide=false,type="text") {return '<label'+(wide?' class="ps-directory-wide"':'')+'><span>'+esc(title)+'</span><input name="'+esc(name)+'" type="'+esc(type)+'" value="'+esc(value)+'" /></label>';}
  function area(name,title,value="",rows=2) {return '<label class="ps-directory-wide"><span>'+esc(title)+'</span><textarea name="'+esc(name)+'" rows="'+rows+'">'+esc(value)+'</textarea></label>';}
  function extraRows(fields=[]) {return fields.map(item=>'<div class="ps-directory-extra-row"><input data-extra-label aria-label="Detail label" placeholder="Column / detail name" value="'+esc(item.label)+'" /><textarea data-extra-value rows="1" aria-label="Detail value" placeholder="Value">'+esc(item.value)+'</textarea><button type="button" data-remove-extra class="ps-text" aria-label="Remove this detail">×</button></div>').join("");}
  function extras(fields=[]) {return '<fieldset class="ps-directory-extra-fields"><legend>Additional details</legend><div data-extra-rows>'+extraRows(fields)+'</div><button type="button" data-add-extra class="ps-text">+ Add detail</button></fieldset>';}
  function readExtras(box) {return [...box.querySelectorAll(":scope > [data-extra-rows] > .ps-directory-extra-row")].map(row=>({label:row.querySelector("[data-extra-label]").value,value:row.querySelector("[data-extra-value]").value}));}
  function contactEditor(person,prefix="") {
    return '<div class="ps-directory-fields">'+input(prefix+"name","Name",person.name)+input(prefix+"organization","Organization / distributor",person.organization)+input(prefix+"role","Role",person.role)+input(prefix+"email","Email",person.email,false,"email")+input(prefix+"phone","Phone",person.phone,false,"tel")+input(prefix+"schoolName","School / district",person.schoolName)+input(prefix+"groups","Groups · separate with commas",person.groups.join(", "),true)+input(prefix+"location","Location",person.location)+input(prefix+"website","Website",person.website)+area(prefix+"address","Address",person.address)+area(prefix+"notes","Notes",person.notes)+'</div>'+extras(person.extraFields);
  }
  function readContact(box,prefix="",base={}) {
    const value=name=>box.querySelector('[name="'+prefix+name+'"]').value;
    const source={...base,category:box.querySelector('[name="'+prefix+'category"]')?.value || base.category,name:value("name"),organization:value("organization"),role:value("role"),email:value("email"),phone:value("phone"),schoolName:value("schoolName"),groups:split(value("groups")),location:value("location"),address:value("address"),website:value("website"),notes:value("notes"),extraFields:readExtras(box.querySelector(":scope > .ps-directory-extra-fields"))};
    const normalized=model.normalizeContact(source),result={};for(const key of contactFields)if(key!=="id"||normalized.id)result[key]=normalized[key];return result;
  }
  function dialog(title,kind) {
    if(state.dialog)dismissDialog(state.dialog,false);state.returnFocus=state.returnFocus || document.activeElement;const element=document.createElement("dialog");element.className="ps-directory-dialog";element.dataset.supportDirectoryDialog=kind;
    element.innerHTML='<form><div class="ps-directory-dialog-heading"><h2>'+esc(title)+'</h2><button type="button" data-directory-close aria-label="Close">×</button></div><div data-directory-form-body></div><p data-dir-status class="ps-status" role="status" aria-live="polite"></p><details data-dir-error class="ps-error" hidden><summary>Error details</summary><pre></pre></details><div class="ps-directory-dialog-actions"><button type="button" data-directory-close>Cancel</button><button type="submit" class="primary-action">Save '+kind+'</button></div></form>';
    document.body.appendChild(element);state.dialog=element;
    element.addEventListener("click",event=>{if(event.target.closest("[data-directory-close]")){if(!state.saving)dismissDialog(element);return;}const remove=event.target.closest("[data-remove-extra]");if(remove){remove.closest(".ps-directory-extra-row").remove();return;}const add=event.target.closest("[data-add-extra]");if(add){add.closest(".ps-directory-extra-fields").querySelector("[data-extra-rows]").insertAdjacentHTML("beforeend",extraRows([{label:"",value:""}]));return;}if(event.target.closest("[data-remove-operator-contact]")){event.target.closest(".ps-directory-contact-editor").remove();return;}if(event.target.closest("[data-add-operator-contact]")){element.querySelector("[data-operator-more-contacts]").insertAdjacentHTML("beforeend",nestedEditor(model.normalizeContact({}),"",true));}});
    element.addEventListener("cancel",event=>{event.preventDefault();if(!state.saving)dismissDialog(element);});
    return element;
  }
  function busy(element,value) {state.saving=value;element.querySelectorAll("input,select,textarea,button").forEach(control=>{control.disabled=value;});}
  async function save(element,kind,payload,existing) {
    if(!allowed()||state.dialog!==element||state.saving)return;const token=capture();busy(element,true);setStatus(element,"Saving…","waiting");
    try {
      const args={expected_updated_at:existing?.id?text(existing.updatedAt):null};args[kind]=payload;
      const {data,error}=await window.foodBrokerBaseAuth.client.rpc("save_product_support_"+kind,args);
      if(!valid(token)||state.dialog!==element)return;if(error)throw error;if(!data||typeof data!=="object"||!text(data.id))throw new Error("The save response was incomplete. Refresh the directory to confirm the saved record before trying again.");
      const saved=kind==="contact"?model.normalizeContact(data):safeOperator(data),collection=kind==="contact"?"contacts":"operators";
      state[collection]=state[collection].some(item=>item.id===saved.id)?state[collection].map(item=>item.id===saved.id?saved:item):[...state[collection],saved];
      state.saving=false;dismissDialog(element,false);render();const target=state.returnFocus;state.returnFocus=null;restoreDirectoryFocus(target);setStatus(ensure(kind==="contact"?"contacts":"operators"),"Saved");
    }catch(error){if(valid(token)&&state.dialog===element){busy(element,false);setStatus(element,message(error),"error",error);}}
  }
  function editContact(existing=null) {
    if(!allowed()||state.contactsReadOnly||state.saving)return;const person=model.normalizeContact(existing||{category:state.filter==="school"?"School":state.filter==="admin"?"Admin Contact":"Other"}),element=dialog(existing?"Edit contact":"Add contact","contact"),body=element.querySelector("[data-directory-form-body]");
    const categories=["Distributor","Vendor","Our team","School","Admin Contact","Operator / Restaurant","Other"];if(!categories.includes(person.category))categories.push(person.category);
    body.innerHTML='<label class="ps-directory-contact-type"><span>Contact type</span><select name="category">'+categories.map(category=>'<option'+(category===person.category?' selected':'')+'>'+esc(category)+'</option>').join("")+'</select></label>'+contactEditor(person);
    element.querySelector("form").addEventListener("submit",event=>{event.preventDefault();if(!allowed())return;const payload=readContact(body,"",person);payload.category=body.querySelector('[name="category"]').value;if((!payload.name.trim()&&!model.isSchool(payload))||!model.schoolName(payload)){setStatus(element,"Enter a name and organization, or a school name for school details.","error");return;}save(element,"contact",payload,existing);});element.showModal();
  }
  function nestedEditor(person,labelValue,removable=false) {const categories=["Distributor","Vendor","Our team","School","Admin Contact","Operator / Restaurant","Other"];if(!categories.includes(person.category))categories.push(person.category);return '<fieldset class="ps-directory-contact-editor" data-contact-base="'+esc(JSON.stringify(person))+'"><legend>'+esc(labelValue || "Additional contact")+'</legend>'+(removable?'<button type="button" data-remove-operator-contact class="ps-text">Remove contact</button>':"")+'<label class="ps-directory-contact-type"><span>Contact type</span><select name="category">'+categories.map(category=>'<option'+(category===person.category?' selected':'')+'>'+esc(category)+'</option>').join("")+'</select></label>'+contactEditor(person)+'</fieldset>';}
  function editOperator(existing=null) {
    if(!allowed()||state.operatorsReadOnly||state.saving)return;const item=safeOperator(existing||{}),element=dialog(existing?"Edit operator":"Add operator","operator"),body=element.querySelector("[data-directory-form-body]");
    body.innerHTML='<div class="ps-directory-fields" data-operator-fields>'+input("operation","Operator / company",item.operation,true)+input("accountNumber","US Foods account number",item.accountNumber)+input("syscoAccountNumber","Sysco account number",item.syscoAccountNumber)+input("locations","Locations",item.locations)+input("deliveryDays","Delivery days · separate with commas",item.deliveryDays.join(", "))+input("usfSalesRep","US Foods sales reps",join(item.usfSalesRep))+input("syscoSalesRep","Sysco sales reps",join(item.syscoSalesRep))+input("website","Website",item.website)+area("address","Address",item.address)+area("notes","Operator notes",item.notes)+'</div><div data-operator-primary>'+nestedEditor(item.primaryContact,"Primary contact")+'</div><div data-operator-secondary>'+nestedEditor(item.secondaryContact,"Secondary contact")+'</div><div data-operator-more-contacts>'+item.contacts.map(person=>nestedEditor(person,"Additional contact")).join("")+'</div><button type="button" data-add-operator-contact class="ps-text">+ Add contact</button>';
    element.querySelector("form").addEventListener("submit",event=>{
      event.preventDefault();if(!allowed())return;const core=body.querySelector("[data-operator-fields]"),value=name=>core.querySelector('[name="'+name+'"]')?.value || "",payload={};
      for(const key of operatorFields)if(key!=="id"||item.id)payload[key]=key==="deliveryDays"?split(value(key)):["usfSalesRep","syscoSalesRep"].includes(key)&&Array.isArray(item[key])?split(value(key)):key==="id"?item.id:value(key);
      const read=box=>readContact(box,"",JSON.parse(box.dataset.contactBase));
      payload.primaryContact=read(body.querySelector("[data-operator-primary] > .ps-directory-contact-editor"));payload.secondaryContact=read(body.querySelector("[data-operator-secondary] > .ps-directory-contact-editor"));payload.contacts=[...body.querySelectorAll("[data-operator-more-contacts] > .ps-directory-contact-editor")].map(read);
      if(!payload.operation.trim()){setStatus(element,"Enter the operator or company name.","error");return;}save(element,"operator",payload,existing);
    });element.showModal();
  }
  window.addEventListener("foodbrokerbase:auth-checking",clear,true);
  window.addEventListener("foodbrokerbase:workspace-leaving",clear,true);
  window.addEventListener("foodbrokerbase:auth",()=>{if(!identity()||identity()!==state.uid)clear();},true);
  window.foodBrokerSupportDirectory=Object.freeze({show,clear,refresh});
})();
