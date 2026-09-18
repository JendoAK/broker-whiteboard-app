"use strict";

// Read-only reporting. Team members' private work is loaded exclusively through
// the existing server-authorized admin RPC, never into editable app state.
const ManagerOverview = (() => {
  const node = (tag, text, cls) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (cls) el.className = cls; return el; };
  const norm = value => String(value || '').trim().toLowerCase();
  const array = value => Array.isArray(value) ? value : [];
  const day = value => { if (!value) return NaN; return +new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? value + 'T12:00:00' : value); };
  const dateKey = value => { const d = new Date(value); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const allowed = () => Boolean(window.foodBrokerBaseAuth?.isAdmin());
  let dialog, generation = 0;

  function range(period, from, to, now = new Date()) {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (period === 'all') return [-Infinity, Infinity];
    if (period === 'custom') { const end = new Date(to + 'T00:00:00'); end.setDate(end.getDate()+1); return [+new Date(from + 'T00:00:00'), +end]; }
    if (period === 'month') return [+new Date(now.getFullYear(), now.getMonth(), 1), +new Date(now.getFullYear(), now.getMonth()+1, 1)];
    start.setDate(start.getDate() - (start.getDay()+6)%7);
    if (period === 'lastweek') start.setDate(start.getDate()-7);
    const end = new Date(start); end.setDate(end.getDate()+7); return [+start,+end];
  }

  function recordsFrom(sections, profiles) {
    const records = [];
    const add = (item, kind, owner, parent, products) => {
      if (item.deletedAt) return;
      const vendors = [...new Set([item.vendor, parent?.vendor, ...array(item.products).map(p=>p.vendor), ...array(products).filter(p=>array(item.productIds).includes(p.id)).map(p=>p.vendor)].filter(Boolean))];
      const reps = array(item.salesReps).length ? item.salesReps : array(parent?.salesReps);
      const owners = profiles.filter(p => p.user_id === owner?.user_id || [p.email,p.display_name].some(v=>v && reps.some(rep=>norm(rep)===norm(v))) || [p.email,p.display_name].some(v=>v && norm(item.orderedBy)===norm(v))).map(p=>p.user_id);
      const history = array(item._activity).filter(e=>Number.isFinite(day(e.at)));
      const events = history.map(e=>({at:day(e.at), label:e.action, actor:e.name||e.email||e.initials, email:e.email, fields:array(e.fields)}));
      for (const audit of [item._createdAudit,item._audit]) if (audit?.at && !events.some(e=>e.at===day(audit.at) && e.label===audit.action)) events.push({at:day(audit.at),label:audit.action,actor:audit.name||audit.email||audit.initials,email:audit.email});
      for (const [key,label] of [['createdAt','Created'],['updatedAt','Updated'],['completedAt','Completed'],['submittedDate','Report submitted']]) if (item[key] && !events.some(e=>e.at===day(item[key]) || (e.label===label && (key==='createdAt' || Math.abs(e.at-day(item[key]))<2000)))) events.push({at:day(item[key]),label,actor:'Editor not recorded'});
      for (const note of array(item.noteHistory)) if(note.createdAt) events.push({at:day(note.createdAt),label:'Note added',actor:'Editor not recorded',text:note.text});
      const title = item.account || item.operatorName || item.title || item.name || item.productShown || item.product || kind;
      records.push({item,kind,owner,parent,vendors,owners,reps,title,events:events.filter(e=>Number.isFinite(e.at)),
        date:day(item.date || item.startDate || item.due || item.submittedDate || item.updatedAt || item.createdAt),
        end:day(item.endDate || item.date || item.startDate || item.due || item.submittedDate || item.updatedAt || item.createdAt),
        operator:item.operatorName || item.account || '', completed:['completed','done'].includes(norm(item.status)),
        archived:Boolean(item.archivedAt || parent?.archivedAt), canceled:['canceled','cancelled'].includes(norm(item.status))});
    };
    const products=sections.flatMap(s=>s.key==='broker-whiteboard-stock-lists'||s.key==='broker-whiteboard-market-visits-new-products'?s.items:[]);
    for (const section of sections) {
      const kind = section.key.includes('market-visits') ? 'Visit' : section.key==='broker-whiteboard-cards' ? 'Lead' : section.key.endsWith('todos') ? 'Follow-up' : section.key.includes('vendor-reports') ? 'Vendor report' : section.key.includes('sample-tracker') || section.key.includes('dot-orders') ? 'Sample / order' : '';
      if(!kind || section.key.endsWith('-new-products')) continue;
      for(const item of section.items) { add(item,kind,section.owner,null,products); if(kind==='Visit') for(const call of array(item.calls)) add(call,'Appointment',section.owner,item,products); }
    }
    return records;
  }

  function selectRecords(records, filters, profiles, now = new Date()) {
    const [start,end]=range(filters.period,filters.from,filters.to,now);
    const profile=profiles.find(p=>p.user_id===filters.member);
    const actorMatch=e=>!profile || norm(e.email)===norm(profile.email) || norm(e.actor)===norm(profile.display_name);
    const base=records.filter(r=>(!filters.vendor || r.vendors.some(v=>norm(v)===norm(filters.vendor))) && (!filters.member || (filters.personMode==='editor' ? r.events.some(actorMatch) : r.owners.includes(filters.member))));
    const inDate=r=>r.date<end && (Number.isFinite(r.end)?r.end:r.date)>=start;
    const scoped=base.filter(inDate);
    const today=+new Date(now.getFullYear(),now.getMonth(),now.getDate());
    const metrics={
      upcoming:scoped.filter(r=>r.kind==='Appointment'&&!r.completed&&!r.archived&&!r.canceled&&r.date>=today),
      completed:scoped.filter(r=>r.kind==='Visit'&&r.completed),
      operators:scoped.filter(r=>r.kind==='Appointment'&&r.completed&&r.operator),
      overdue:base.filter(r=>['Follow-up','Lead'].includes(r.kind)&&!r.completed&&!r.archived&&r.item.due&&day(r.item.due)<today&&day(r.item.due)>=start&&day(r.item.due)<end)
    };
    const activity=base.flatMap(r=>r.events.filter(e=>e.at>=start&&e.at<end&&(filters.personMode!=='editor'||actorMatch(e))).map(event=>({record:r,event}))).sort((a,b)=>b.event.at-a.event.at);
    return {records:scoped,activity,metrics,start,end};
  }

  function close() { generation++; if(dialog?.open) dialog.close(); dialog?.replaceChildren(); }
  function syncAccess() {
    document.querySelectorAll('.manager-overview-action').forEach(b=>b.hidden=!allowed());
    if(!allowed()) close();
  }
  function install() {
    document.querySelectorAll('.market-nav-action').forEach(anchor=>{
      if(anchor.parentElement.querySelector('.manager-overview-action')) return;
      const button=node('button','Manager Overview','ghost-action nav-button manager-overview-action');button.type='button';button.hidden=true;button.onclick=open;anchor.after(button);
    });syncAccess();
  }

  async function open() {
    if(!allowed()) return;
    const auth=window.foodBrokerBaseAuth, user=auth.getCurrentUser()?.id, request=++generation;
    if(!dialog) { dialog=node('dialog',undefined,'manager-overview');dialog.id='managerOverview';document.body.append(dialog);dialog.addEventListener('close',()=>{if(!dialog.open){generation++;dialog.replaceChildren();}}); }
    dialog.replaceChildren();
    const header=node('header',undefined,'manager-header'), heading=node('div');heading.append(node('p','TEAM PERFORMANCE','eyebrow'),node('h2','Manager Overview'),node('p','Vendor coverage, upcoming visits, and recorded team activity.'));
    const actions=node('div'), refresh=node('button','Refresh','ghost-action'), exit=node('button','Close','ghost-action');refresh.onclick=open;exit.onclick=close;actions.append(refresh,exit);header.append(heading,actions);dialog.append(header);
    const content=node('div','Loading team records…','manager-content');content.setAttribute('role','status');dialog.append(content);if(!dialog.open) dialog.showModal();
    const valid=()=>request===generation&&dialog.open&&allowed()&&auth.getCurrentUser()?.id===user;
    try {
      // get_team_profiles returns no rows for non-admins. get_team_member_work
      // separately enforces is_admin() on the server for every private read.
      const result=await auth.client.rpc('get_team_profiles');if(result.error) throw result.error;if(!valid()) return;
      const profiles=array(result.data).filter(p=>['member','admin','super_user'].includes(p.role));
      if(!profiles.length) throw Error('No team profiles available. Refresh your account access and try again.');
      const sections=[], warnings=[];
      for(let offset=0;offset<profiles.length;offset+=4) {
        const batch=profiles.slice(offset,offset+4);
        const results=await Promise.allSettled(batch.map(p=>auth.client.rpc('get_team_member_work',{target_user:p.user_id})));
        if(!valid()) return;
        results.forEach((r,index)=>{const owner=batch[index];if(r.status==='rejected'||r.value.error){warnings.push(`Could not load ${owner.display_name||owner.email}’s work.`);return;}
          const rows=array(r.value.data);for(const row of rows){if(row.record_key.endsWith('-pc')&&rows.some(other=>other.record_key.endsWith('-personal')))continue;sections.push({key:row.record_key,items:array(row.data?.value??row.data),owner});}
        });
      }
      const keys=['broker-whiteboard-market-visits-vendor','broker-whiteboard-market-visits-testkitchen','broker-whiteboard-market-visits-foodshow','broker-whiteboard-sample-tracker','broker-whiteboard-dot-orders','broker-whiteboard-stock-lists','broker-whiteboard-market-visits-new-products'];
      const shared=await auth.client.from('team_app_records').select('record_key,data').eq('record_type','team_section').in('record_key',keys);
      if(!valid()) return;if(shared.error)warnings.push('Shared visits, products, and orders could not be loaded.');else for(const row of array(shared.data))sections.push({key:row.record_key,items:array(row.data?.value??row.data)});
      render(content,recordsFrom(sections,profiles),profiles,warnings,valid);
    } catch(error) { if(valid()) content.textContent='Could not load Manager Overview. '+(error.message||'Please try again.'); }
  }

  function render(content,records,profiles,warnings,valid) {
    content.replaceChildren();content.removeAttribute('role');
    if(warnings.length)content.append(node('p','Partial results: '+warnings.join(' '),'manager-warning'));
    const filters={vendor:'',member:'',personMode:'assigned',period:'thisweek',from:'',to:''};let tab='vendor',metric='';
    const controls=node('div',undefined,'manager-filters');
    const select=(label,key,options)=>{const wrapper=node('label',label),input=node('select');input.setAttribute('aria-label',label);options.forEach(([value,text])=>{const option=node('option',text);option.value=value;input.append(option);});input.value=filters[key];input.onchange=()=>{filters[key]=input.value;metric='';draw();};wrapper.append(input);controls.append(wrapper);return input;};
    select('Vendor','vendor',[['','All vendors'],...[...new Set(records.flatMap(r=>r.vendors))].sort().map(v=>[v,v])]);
    select('Team member','member',[['','Whole team'],...profiles.map(p=>[p.user_id,p.display_name||p.email])]);
    select('Match member by','personMode',[['assigned','Assigned rep / record owner'],['editor','Person who made the change']]);
    select('Date range','period',[['thisweek','This week'],['lastweek','Last week'],['month','This month'],['custom','Custom dates'],['all','All time']]);
    const dates=node('div',undefined,'manager-custom-dates');for(const key of ['from','to']){const label=node('label',key==='from'?'From':'Through'),input=node('input');input.type='date';input.setAttribute('aria-label',label.textContent);input.onchange=()=>{filters[key]=input.value;metric='';draw();};label.append(input);dates.append(label);}controls.append(dates);content.append(controls);
    const tiles=node('div',undefined,'manager-metrics'),tabs=node('div',undefined,'manager-tabs');tabs.setAttribute('role','tablist');const tabButtons=[];
    for(const [key,label] of [['vendor','By Vendor'],['activity','Team Activity']]){const button=node('button',label);button.setAttribute('role','tab');button.onclick=()=>{tab=key;metric='';draw();};tabs.append(button);tabButtons.push([key,button]);}
    const status=node('p',undefined,'manager-context'),list=node('div',undefined,'manager-records');list.setAttribute('role','tabpanel');content.append(tiles,tabs,status,list,node('p','Dates filter scheduled work in By Vendor and change dates in Team Activity. Totals use scheduled or due dates. Completed visits and operators require a Completed status. Older records may lack editor names or change history.','manager-footnote'));
    function detail(r) {
      const block=node('details',undefined,'manager-record'),summary=node('summary');summary.append(node('span',r.kind+(Number.isFinite(r.date)?' · '+new Date(r.date).toLocaleDateString():''),'manager-kind'),node('strong',r.title),node('span',[r.item.status||r.item.outcome,r.vendors.join(', ')].filter(Boolean).join(' · ')));block.append(summary);
      const body=node('div',undefined,'manager-record-body');
      for(const [label,value] of [['Assigned to',r.owner?.display_name||r.owner?.email||r.reps.join(', ')||'Not recorded'],['Date',r.item.date||r.item.startDate||r.item.due||r.item.submittedDate],['Location',r.item.location||r.parent?.location],['Products',array(r.item.products).map(p=>p.description||p.product).filter(Boolean).join(', ')||r.item.productShown],['Notes',r.item.notes||r.item.opportunityNote]])if(value)body.append(node('p',`${label}: ${value}`));
      const more=node('details');more.append(node('summary','Full record'),renderTeamWorkValue(r.item));body.append(more);
      if(r.owner){const button=node('button','Open member’s work','ghost-action');button.onclick=()=>{if(!allowed())return;const owner=r.owner;close();window.openTeamMemberWork(owner);};body.append(button);}
      else if(r.kind==='Visit'||r.parent){const button=node('button','Open visit','ghost-action');button.onclick=()=>{if(!allowed())return;const id=r.parent?.id||r.item.id;const visit=marketVisits.find(v=>v.id===id);if(!visit){button.textContent='Refresh the app to load this visit';return;}close();activeMarketType=visit.type;openMarketVisitsWindow();openMarketVisitDetail(id);};body.append(button);}
      block.append(body);return block;
    }
    function draw() {
      if(!valid())return;dates.hidden=filters.period!=='custom';const result=selectRecords(records,filters,profiles);list.replaceChildren();tiles.replaceChildren();tabButtons.forEach(([key,b])=>b.setAttribute('aria-selected',String(key===tab)));
      if(!Number.isFinite(result.start)&&result.start!==-Infinity||!Number.isFinite(result.end)&&result.end!==Infinity||result.start>=result.end){status.textContent='Choose a valid start and end date.';return;}
      for(const [key,label] of [['upcoming','Upcoming appointments'],['completed','Completed visits'],['operators','Operators visited'],['overdue','Overdue follow-ups']]){const matches=result.metrics[key];const count=key==='operators'?new Set(matches.map(r=>norm(r.operator))).size:matches.length;const button=node('button');button.append(node('strong',String(count)),node('span',label));button.setAttribute('aria-pressed',String(metric===key));button.onclick=()=>{metric=metric===key?'':key;draw();};tiles.append(button);}
      if(metric){status.textContent='Showing '+({upcoming:'upcoming appointments',completed:'completed visits',operators:'completed operator appointments',overdue:'overdue follow-ups'})[metric]+' for these filters. Click the total again to return.';result.metrics[metric].forEach(r=>list.append(detail(r)));}
      else if(tab==='activity'){status.textContent=`${result.activity.length} recorded changes · Newest first`;result.activity.slice(0,200).forEach(({record,event})=>{const entry=node('article',undefined,'manager-activity');entry.append(node('p',`${event.actor} · ${event.label} · ${new Date(event.at).toLocaleString()}`));if(event.fields?.length)entry.append(node('p','Changed: '+event.fields.join(', ')));if(event.text)entry.append(node('p',event.text));entry.append(detail(record));list.append(entry);});if(result.activity.length>200)list.append(node('p','Showing the latest 200 changes. Narrow the date range to see earlier activity.'));}
      else{status.textContent=`${result.records.length} records · Scheduled and due dates`;const groups=new Map();for(const r of result.records)for(const vendor of r.vendors.length?r.vendors:['No vendor recorded']){if(filters.vendor&&norm(vendor)!==norm(filters.vendor))continue;if(!groups.has(vendor))groups.set(vendor,[]);groups.get(vendor).push(r);}for(const [vendor,rows] of [...groups].sort(([a],[b])=>a.localeCompare(b))){const section=node('section');section.append(node('h3',`${vendor} · ${rows.length}`));rows.sort((a,b)=>a.date-b.date).forEach(r=>section.append(detail(r)));list.append(section);}}
      if(!list.children.length)list.append(node('p','No matching records. Try another vendor, team member, or date range.','manager-empty'));
    }
    draw();
  }
  window.addEventListener('foodbrokerbase:auth',()=>{close();syncAccess();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  return {open,range,recordsFrom,selectRecords,syncAccess};
})();
window.openManagerOverview = ManagerOverview.open;
