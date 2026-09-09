"use strict";
// Read-only data stays inside the viewer, outside editable state and sync caches.
function teamWorkPeriod(period, now = new Date()) {
  const start = new Date(now.getFullYear(),now.getMonth(),now.getDate());
  start.setDate(start.getDate()-((start.getDay()+6)%7));
  if (period === 'all') return [-Infinity,Infinity];
  if (period === 'lastmonth') return [+new Date(now.getFullYear(),now.getMonth()-1,1),+new Date(now.getFullYear(),now.getMonth(),1)];
  const end = new Date(start); end.setDate(end.getDate()+7);
  if (period === 'lastweek') { end.setTime(+start);start.setDate(start.getDate()-7); }
  return [+start,+end];
}
function teamWorkEvents(item) {
  const events=[];
  const add=(value,label,text='')=>{if(!value)return;const date=new Date(/^\d{4}-\d{2}-\d{2}$/.test(value)?value+'T12:00:00':value);if(Number.isFinite(+date))events.push({at:+date,label,text});};
  add(item.createdAt,'Created');add(item.updatedAt,'Updated');add(item.completedAt,'Completed');add(item.submittedDate,'Report submitted');add(item._audit?.at,item._audit?.action || 'Updated');add(item.deletedAt,'Moved to trash');
  (item.noteHistory || []).forEach(note=>{add(note.createdAt,'Note added',note.text);add(note.updatedAt,'Note updated',note.text);});
  return events.sort((a,b)=>b.at-a.at);
}
function teamWorkSampleMatches(item,profile) {
  const normalize=value=>String(value||'').trim().toLowerCase();
  return (profile.email && normalize(item._audit?.email)===normalize(profile.email)) || [profile.email,profile.display_name].filter(Boolean).some(value=>normalize(item.orderedBy)===normalize(value));
}
function teamWorkNode(tag,text,className) { const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node; }
window.openTeamMemberWork = async function(profile) {
  const auth=window.foodBrokerBaseAuth;if(!auth?.isAdmin())return;
  const viewerUserId=auth.getCurrentUser()?.id;
  let dialog=document.querySelector('#teamWorkDialog');
  if(!dialog){dialog=teamWorkNode('dialog');dialog.id='teamWorkDialog';dialog.className='note-dialog';document.body.append(dialog);dialog.addEventListener('close',()=>dialog.replaceChildren());}
  const requestId=crypto.randomUUID();dialog.dataset.requestId=requestId;dialog.replaceChildren();
  const header=teamWorkNode('div',undefined,'team-activity-header');const heading=teamWorkNode('div');heading.append(teamWorkNode('p','TEAM ACTIVITY','eyebrow'),teamWorkNode('h2',(profile.display_name||profile.email)+' — Work overview'),teamWorkNode('p','Read only · Recent work, notes, and follow-up'));
  const close=teamWorkNode('button','Close','ghost-action');close.type='button';close.onclick=()=>dialog.close();header.append(heading,close);dialog.append(header);
  const content=teamWorkNode('div','Loading activity…');dialog.append(content);dialog.showModal();
  try {
    const results=await Promise.allSettled([
      auth.client.rpc('get_team_member_work',{target_user:profile.user_id}),
      auth.client.from('team_app_records').select('record_key,data').eq('record_type','team_section').in('record_key',['broker-whiteboard-sample-tracker','broker-whiteboard-dot-orders'])
    ]);
    if(dialog.dataset.requestId!==requestId||!dialog.open||auth.getCurrentUser()?.id!==viewerUserId||!auth.isAdmin())return;
    if(results[0].status==='rejected')throw results[0].reason;
    const {data,error}=results[0].value;if(error)throw error;
    const values=new Map((data||[]).map(row=>[row.record_key,row.data?.value??row.data]));
    const definitions=[['leads','Leads','broker-whiteboard-cards'],['todos','To-dos','broker-whiteboard-todos'],['reports','Vendor reports','broker-whiteboard-manual-vendor-reports'],['visits','Personal visits','broker-whiteboard-market-visits-personal']];
    if(!values.has(definitions[3][2]))values.set(definitions[3][2],values.get('broker-whiteboard-market-visits-pc'));
    const records=[];
    definitions.forEach(([kind,label,key])=>(Array.isArray(values.get(key))?values.get(key):[]).forEach(item=>records.push({kind,label,item,events:teamWorkEvents(item)})));
    const sampleResult=results[1].status==='fulfilled'?results[1].value:null;
    if(sampleResult&&!sampleResult.error)(sampleResult.data||[]).forEach(row=>{const items=row.data?.value??row.data;(Array.isArray(items)?items:[]).filter(item=>teamWorkSampleMatches(item,profile)).forEach(item=>records.push({kind:'samples',label:'Samples / orders',item,events:teamWorkEvents(item)}));});
    let period='thisweek',category='all',trash=false;
    content.replaceChildren();
    const controls=teamWorkNode('div',undefined,'team-activity-controls');const periods=teamWorkNode('div',undefined,'team-activity-periods');periods.setAttribute('aria-label','Activity date range');
    const periodButtons=[];
    [['thisweek','This week'],['lastweek','Last week'],['lastmonth','Last month'],['all','All time']].forEach(([key,label])=>{const button=teamWorkNode('button',label);button.type='button';button.onclick=()=>{period=key;render();};periodButtons.push([key,button]);periods.append(button);});
    const search=teamWorkNode('input');search.type='search';search.placeholder='Search accounts, products, notes…';search.setAttribute('aria-label','Search member activity');
    const trashButton=teamWorkNode('button','Trash','team-activity-trash');trashButton.type='button';trashButton.onclick=()=>{trash=!trash;render();};controls.append(periods,search,trashButton);content.append(controls);
    const categories=teamWorkNode('div',undefined,'team-activity-categories');const categoryButtons=[];
    [['all','Recent activity'],...definitions.map(([kind,label])=>[kind,label]),['samples','Samples / orders']].forEach(([key,label])=>{const button=teamWorkNode('button');button.type='button';button.dataset.category=key;button.onclick=()=>{category=key;render();};categoryButtons.push([key,label,button]);categories.append(button);});content.append(categories);
    const context=teamWorkNode('p',undefined,'team-activity-context');context.setAttribute('role','status');const list=teamWorkNode('div',undefined,'team-activity-list');content.append(context,list);
    const info=teamWorkNode('p','Based on recorded creation, update, completion, and note dates. Statuses reflect the current record. Older edits may not have timestamps. Sample orders are included when this member is the recorded orderer or latest editor.','team-activity-footnote');content.append(info);
    if(!sampleResult||sampleResult.error)content.append(teamWorkNode('p','Sample orders could not be loaded. The personal work below is still available.'));
    const render=()=>{
      const [start,end]=teamWorkPeriod(period);const query=search.value.trim().toLowerCase();
      const matched=records.filter(record=>Boolean(record.item.deletedAt)===trash).map(record=>({...record,event:record.events.find(event=>event.at>=start&&event.at<end)})).filter(record=>(period==='all'||record.event)&&JSON.stringify(record.item,(key,value)=>['data','_audit'].includes(key)?undefined:value).toLowerCase().includes(query));
      periodButtons.forEach(([key,button])=>button.setAttribute('aria-pressed',String(period===key)));
      categoryButtons.forEach(([key,label,button])=>{button.textContent=label+' ('+matched.filter(record=>key==='all'||record.kind===key).length+')';button.setAttribute('aria-pressed',String(category===key));});
      trashButton.textContent=trash?'Back to activity':'Trash';trashButton.setAttribute('aria-pressed',String(trash));
      const shown=matched.filter(record=>category==='all'||record.kind===category).sort((a,b)=>(b.event?.at||0)-(a.event?.at||0));
      const range=period==='all'?'All recorded dates':new Date(start).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})+' – '+new Date(end-1).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
      context.textContent=(trash?'Trash · ':'')+range+' · '+shown.length+' matching records · Newest first';list.replaceChildren();
      if(!shown.length)list.append(teamWorkNode('p','No matching activity in this period. Try another date range or All time.','team-activity-empty'));
      shown.forEach(record=>{const {item,event}=record;const details=teamWorkNode('details',undefined,'team-activity-record');details.dataset.category=record.kind;const summary=teamWorkNode('summary');
        const title=item.account||item.name||item.title||item.product||item.productShown||'Record';summary.append(teamWorkNode('span',record.label,'team-activity-kind'),teamWorkNode('strong',title),teamWorkNode('span',[item.status,item.archivedAt?'Archived':''].filter(Boolean).join(' · '),'team-activity-status'),teamWorkNode('span',event?event.label+' · '+new Date(event.at).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'No activity date recorded','team-activity-date'));
        if(event?.text)summary.append(teamWorkNode('span',event.text,'team-activity-note'));
        if(item.due)summary.append(teamWorkNode('span','Follow-up / due: '+item.due,'team-activity-due'));
        details.append(summary,renderTeamWorkValue(item));list.append(details);
      });
    };
    search.addEventListener('input',render);render();
  } catch(error) {if(dialog.open&&dialog.dataset.requestId===requestId)content.textContent='Could not load this member’s work. '+(error.message||'Please try again.');}
};

function renderTeamWorkValue(value) {
  const container=document.createElement('div');
  if (value === null || value === undefined) return container;
  if (typeof value !== 'object') { container.textContent=String(value); return container; }
  if (value.name && typeof value.data === 'string' && value.data.startsWith('data:image/')) {
    const image=document.createElement('img'); image.src=value.data; image.alt=value.name; image.loading='lazy'; image.style.maxWidth='100%'; container.append(image);
  }
  const hidden = new Set(['id','key','recordId','ownerId','data','_audit','productIds','operatorId','callId','leadId']);
  for (const [key,entry] of Object.entries(value)) {
    if (hidden.has(key) || entry === '' || entry == null || (Array.isArray(entry) && !entry.length)) continue;
    const row=document.createElement('div'); row.className='team-work-field';
    const label=document.createElement('strong'); label.textContent=Array.isArray(value) ? `Item ${Number(key)+1}` : key.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/^./,x=>x.toUpperCase());
    row.append(label,renderTeamWorkValue(entry)); container.append(row);
  }
  return container;
}
window.addEventListener('foodbrokerbase:auth', () => { const dialog=document.querySelector('#teamWorkDialog'); if (dialog?.open) dialog.close(); });
