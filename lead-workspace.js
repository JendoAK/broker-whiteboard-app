/* Yellow lead cards. Keep the existing records, filters, dialogs and cloud writer. */
(() => {
  'use strict';
  const shell=document.querySelector('.app-shell'), board=elements.board;
  if(!shell||!board)return;
  const originalRender=render, originalQuickFilter=applyQuickFilter;
  const notices=new Map();
  let dateRange='all', lastDay=TaskDates.today();
  const dateLabels={all:'All dates',today:'Today',tomorrow:'Tomorrow',week:'This week',nextWeek:'Next week'};
  const views=[['all','All leads','list-task'],['overdue','Overdue','bell'],['important','Important','star'],
    ...columns.map((status,index)=>[status,status,['plus-circle','box-seam','send','chat','arrow-repeat','check-circle'][index]])];
  const icon=name=>`<img class="lead-icon" src="task-icons/${name}.svg" width="18" height="18" alt="">`;
  const workspace=document.createElement('section');workspace.className='lead-workspace';workspace.setAttribute('aria-label','Leads workspace');
  workspace.innerHTML=`<aside class="lead-sidebar" aria-label="Lead views"><h2>Lead views</h2><nav class="lead-views" aria-label="Lead lists"></nav><div class="lead-archive-slot"><button type="button" class="lead-archive-view">${icon('archive')}<span>Archive</span></button></div></aside>
    <section class="lead-main"><header class="lead-list-heading"><div><h1 id="leadViewTitle">All leads</h1><p><span id="leadViewCount"></span><span class="lead-open-help">Click a card to open lead details</span></p></div><div class="lead-heading-actions"></div></header>
    <div class="lead-date-filters" role="group" aria-label="Filter leads by date"></div>
    <div class="lead-search-toolbar"><div class="lead-search-slot"></div><button type="button" class="lead-filter-toggle" aria-expanded="false" aria-controls="leadAdvancedFilters">Filters</button><div class="lead-sort-slot"></div></div>
    <section id="leadAdvancedFilters" class="lead-filters" hidden></section><p class="lead-workspace-status" role="status"></p><div class="lead-cards-slot"></div></section>`;
  shell.insertBefore(workspace,board);
  workspace.querySelector('.lead-cards-slot').append(board);
  shell.classList.add('leads-enabled');
  const summary=shell.querySelector(':scope > .summary-grid');summary?.classList.add('lead-legacy-summary');
  const controls=shell.querySelector(':scope > .controls');
  if(controls){
    workspace.querySelector('.lead-search-slot').append(elements.search.closest('label'));
    workspace.querySelector('.lead-sort-slot').append(elements.sort.closest('label'));
    controls.classList.add('lead-existing-controls');workspace.querySelector('.lead-filters').append(controls);
    elements.search.setAttribute('aria-label','Search leads');
    elements.search.placeholder='Search account, vendor, product, notes…';
  }
  const actions=workspace.querySelector('.lead-heading-actions'), add=document.querySelector('#addNoteTop'), recap=document.querySelector('#printWeeklyRecapTop');
  if(recap){recap.innerHTML=icon('printer');recap.setAttribute('aria-label','Print Weekly Recap');recap.title='Print Weekly Recap';recap.classList.add('lead-icon-action');actions.append(recap);}
  if(add)actions.append(add);
  shell.querySelector(':scope > .topbar .view-actions')?.classList.add('lead-old-actions');
  const nav=workspace.querySelector('.lead-views');
  views.forEach(([key,label,name],index)=>{
    if(index===3){const title=document.createElement('h2');title.textContent='By status';nav.append(title);}
    const button=document.createElement('button');button.type='button';button.dataset.leadView=key;
    button.innerHTML=`${icon(name)}<span>${escapeHtml(label)}</span><small></small>`;
    button.onclick=()=>{
      dateRange='all';clearFilters(false);
      if(key==='overdue')elements.dueFilter.value='overdue';
      else if(key==='important')elements.priorityFilter.value='High';
      else if(columns.includes(key))elements.statusFilter.value=key;
      render();
    };
    nav.append(button);
  });
  workspace.querySelector('.lead-archive-view').onclick=()=>document.querySelector('#openArchive')?.click();
  const dateFilters=workspace.querySelector('.lead-date-filters');
  Object.entries(dateLabels).forEach(([key,label])=>{
    const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.leadDate=key;
    button.onclick=()=>{dateRange=key;elements.dueFilter.value='';activeLeadQuickFilter='';leadQuickListMode=false;render();};dateFilters.append(button);
  });
  const toggle=workspace.querySelector('.lead-filter-toggle'), advanced=workspace.querySelector('.lead-filters');
  toggle.onclick=()=>{advanced.hidden=!advanced.hidden;toggle.setAttribute('aria-expanded',String(!advanced.hidden));};
  // The old controls continue to drive filtering; do not combine conflicting dates.
  elements.dueFilter.addEventListener('input',()=>{dateRange='all';},{capture:true});
  document.querySelector('#clearFilters')?.addEventListener('click',()=>{dateRange='all';},{capture:true});
  applyQuickFilter=function(filter){dateRange='all';return originalQuickFilter(filter);};
  function closeMenus(){
    workspace.querySelectorAll('.lead-card-menu').forEach(menu=>{menu.querySelector('[role=group]').hidden=true;menu.querySelector('.lead-card-more').setAttribute('aria-expanded','false');});
  }
  workspace.addEventListener('click',event=>{if(!event.target.closest('.lead-card-menu'))closeMenus();});
  workspace.addEventListener('keydown',event=>{if(event.key==='Escape'){const open=workspace.querySelector('.lead-card-more[aria-expanded=true]');closeMenus();open?.focus();}});
  function currentView(){
    if(columns.includes(elements.statusFilter.value))return elements.statusFilter.value;
    if(elements.dueFilter.value==='overdue')return 'overdue';
    if(elements.priorityFilter.value==='High')return 'important';
    return 'all';
  }
  function notify(text,error=false){
    const message=workspace.querySelector('.lead-workspace-status');
    message.textContent=text;message.classList.toggle('is-error',error);message.setAttribute('role',error?'alert':'status');
    clearTimeout(message._clearTimer);
    if(!error)message._clearTimer=setTimeout(()=>{message.textContent='';},3500);
  }
  function saveStatus(id,status){
    if(!columns.includes(status))return false;
    const latest=cards.find(card=>card.id===id&&!card.archivedAt&&!card.deletedAt);
    if(!latest)return false;
    if(normalizeStatus(latest.status)===status)return true;
    const previous=cards;cards=cards.map(card=>card.id===id?{...card,status}:card);
    if(!persist()){cards=previous;render();notify('Could not save this status. Please retry.',true);return false;}
    render();notify(`Status saved on this device. ${status}.`);return true;
  }
  function saveLead(id){
    if(!cards.some(card=>card.id===id&&!card.archivedAt&&!card.deletedAt))return false;
    if(!persist()){notify('Could not save this lead. Please retry.',true);return false;}
    const message=board.querySelector(`[data-lead-feedback="${CSS.escape(id)}"]`);
    if(message){message.textContent='Saved on this device.';const token={};notices.set(id,token);setTimeout(()=>{if(notices.get(id)===token){notices.delete(id);const current=board.querySelector(`[data-lead-feedback="${CSS.escape(id)}"]`);if(current)current.textContent='';}},2500);}
    if(typeof pushPendingCloudSections==='function')void pushPendingCloudSections();return true;
  }
  function latestNote(card){
    const history=Array.isArray(card.noteHistory)?card.noteHistory.filter(entry=>String(entry.text||'').trim()):[];
    return history.length?String(history[history.length-1].text).trim():String(card.note||'').trim();
  }
  function dueLabel(card){
    if(!card.due)return 'No date';
    if(card.due===TaskDates.today())return 'Today · '+formatDate(card.due);
    if(card.due===TaskDates.range('tomorrow').start)return 'Tomorrow · '+formatDate(card.due);
    return formatDate(card.due);
  }
  function createLeadCard(card){
    const article=document.createElement('article');article.className='lead-card';article.dataset.leadId=card.id;
    const titleId='lead-title-'+card.id;
    article.setAttribute('aria-labelledby',titleId);
    const products=normalizeProducts(card), vendors=[...new Set(products.map(product=>product.vendor).filter(Boolean))];
    const productText=products.map(product=>[product.description,getLeadItemNumber(product)?getDistributorItemLabel(card.distributor)+': '+getLeadItemNumber(product):''].filter(Boolean).join(' · ')).filter(Boolean).join('; ');
    const note=latestNote(card), status=normalizeStatus(card.status), priority=Object.hasOwn(priorities,card.priority)?card.priority:'Medium';
    article.innerHTML=`<header class="lead-card-header"><h2 id="${escapeAttribute(titleId)}"><button type="button" class="lead-card-open" aria-haspopup="dialog" aria-label="${escapeAttribute('Open lead: '+card.account)}">${escapeHtml(card.account||'Untitled lead')}</button></h2><div class="lead-card-actions"><button type="button" class="lead-save lead-icon-action" aria-label="${escapeAttribute('Save lead: '+card.account)}" title="Save lead">${icon('floppy')}</button><button type="button" class="lead-archive lead-icon-action" aria-label="${escapeAttribute('Archive lead: '+card.account)}" title="Archive lead">${icon('archive')}</button><div class="lead-card-menu"><button type="button" class="lead-card-more lead-icon-action" aria-label="${escapeAttribute('More actions for '+card.account)}" title="More lead actions" aria-expanded="false" aria-controls="${escapeAttribute('lead-actions-'+card.id)}">${icon('three-dots')}</button><div id="${escapeAttribute('lead-actions-'+card.id)}" role="group" aria-label="Lead actions" hidden><button type="button" class="lead-edit">Edit lead</button><button type="button" class="lead-to-report">Turn into Vendor Report</button></div></div></div></header>
      <div class="lead-card-body"><div class="lead-card-flow"><select class="lead-card-status" aria-label="${escapeAttribute('Status for '+card.account)}" title="${escapeAttribute(status)}">${columns.map(value=>`<option value="${escapeAttribute(value)}" ${value===status?'selected':''}>${escapeHtml(value==='Ready to Show / Send Out'?'Ready to Show':value==='Showed / Waiting on Feedback'?'Waiting on Feedback':value)}</option>`).join('')}</select><span class="lead-priority lead-priority-${priority.toLowerCase()}">${icon(priority==='High'?'fire':priority==='Low'?'circle':'circle-fill')}${escapeHtml(priority)}</span></div>
      <dl class="lead-card-facts"><div>${icon('box-seam')}<dt>${products.length>1?'Products':'Product'}</dt><dd>${escapeHtml(productText||'No product added')}</dd></div><div>${icon('building')}<dt>Vendor</dt><dd>${escapeHtml(vendors.join(', ')||'No vendor selected')}</dd></div><div>${icon('truck')}<dt>Distributor</dt><dd>${escapeHtml(card.distributor||'Not selected')}</dd></div>${card.salesRep||card.syscoSalesRep?`<div>${icon('people')}<dt>Rep</dt><dd>${escapeHtml([card.salesRep,card.syscoSalesRep].filter(Boolean).join(' · '))}</dd></div>`:''}</dl>
      <div class="lead-card-note">${icon('chat')}<p>${escapeHtml(note||'No notes yet.')}</p></div></div>
      <footer class="lead-card-footer ${isOverdue(card)?'is-overdue':''}">${icon('calendar-event')}<span><strong>Follow-up:</strong> ${escapeHtml(dueLabel(card))}</span>${card.attachments?.length?`<span class="lead-file-count" title="${escapeAttribute(card.attachments.length+' attachments')}">${icon('paperclip')}${card.attachments.length}</span>`:''}</footer><span class="lead-card-feedback" data-lead-feedback="${escapeAttribute(card.id)}" role="status"></span><img class="lead-paper-fold" src="lead-assets/paper-fold.png" width="28" height="28" alt="" aria-hidden="true">`;
    const open=()=>{closeMenus();const latest=cards.find(item=>item.id===card.id&&!item.deletedAt);if(latest)openAccountWindow(latest,{singleLead:true});};
    article.querySelector('.lead-card-open').onclick=open;
    article.addEventListener('click',event=>{
      if(event.target.closest('button,select,input,a,textarea,.lead-card-menu'))return;
      const selection=window.getSelection?.();if(selection?.toString()&&article.contains(selection.anchorNode))return;
      open();
    });
    article.querySelector('.lead-card-status').onchange=event=>saveStatus(card.id,event.target.value);
    article.querySelector('.lead-save').onclick=()=>saveLead(card.id);
    article.querySelector('.lead-archive').onclick=()=>{if(archiveCard(card.id))notify('Lead archived. Open Archive to restore it.');};
    article.querySelector('.lead-card-more').onclick=event=>{event.stopPropagation();const content=article.querySelector('.lead-card-menu>[role=group]'), wasOpen=!content.hidden;closeMenus();content.hidden=wasOpen;event.currentTarget.setAttribute('aria-expanded',String(!wasOpen));};
    article.querySelector('.lead-edit').onclick=()=>{closeMenus();const latest=cards.find(item=>item.id===card.id);if(latest)openForm(latest);};
    article.querySelector('.lead-to-report').onclick=()=>{closeMenus();turnLeadIntoVendorReport(card.id);};
    return article;
  }
  render=function(){
    if(!workspace.isConnected){originalRender();return;}
    const focused=workspace.contains(document.activeElement)?document.activeElement:null;
    const focusId=focused?.closest('.lead-card')?.dataset.leadId;
    const focusControl=['lead-card-status','lead-save','lead-archive','lead-card-open','lead-card-more'].find(name=>focused?.classList.contains(name));
    const openMenu=board.querySelector('.lead-card-more[aria-expanded=true]')?.closest('.lead-card')?.dataset.leadId;
    const scroll=board.scrollTop;
    clearLeadDragState();updateSummary();updateAccountSuggestions();updateSalesRepSuggestions();updateVendorControls();updateTimelineSearchSuggestions();
    if(elements.vendorReportDialog.open||!elements.vendorReportDialog.hidden)renderVendorReport();
    setActiveLeadQuickTile();
    const view=currentView(), range=TaskDates.range(dateRange,undefined,typeof sundayCalendarStart==='function'&&sundayCalendarStart());
    const active=cards.filter(card=>!card.archivedAt&&!card.deletedAt);
    const visible=getVisibleCards().filter(card=>(view!=='important'||normalizeStatus(card.status)!==closedStatus)&&(!range||card.due>=range.start&&card.due<=range.end&&(elements.statusFilter.value===closedStatus||normalizeStatus(card.status)!==closedStatus)));
    workspace.querySelector('#leadViewTitle').textContent=views.find(item=>item[0]===view)?.[1]||'All leads';
    workspace.querySelector('#leadViewCount').textContent=`${visible.length} ${visible.length===1?'lead':'leads'}${dateRange==='all'?'':' · '+dateLabels[dateRange]}`;
    nav.querySelectorAll('button').forEach(button=>{
      const key=button.dataset.leadView;
      button.setAttribute('aria-pressed',String(key===view));
      button.querySelector('small').textContent=key==='all'?active.length:key==='overdue'?active.filter(isOverdue).length:key==='important'?active.filter(card=>card.priority==='High'&&normalizeStatus(card.status)!==closedStatus).length:active.filter(card=>normalizeStatus(card.status)===key).length;
    });
    dateFilters.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.leadDate===dateRange)));
    board.className='board lead-card-grid';board.innerHTML='';
    if(visible.length)visible.forEach(card=>board.append(createLeadCard(card)));
    else board.innerHTML='<div class="lead-empty"><h2>No leads match this view</h2><p>Choose another view or clear your filters.</p><button type="button" class="lead-empty-clear">Clear filters</button></div>';
    board.querySelector('.lead-empty-clear')?.addEventListener('click',()=>{dateRange='all';clearFilters();});
    board.scrollTop=scroll;
    if(openMenu){const button=board.querySelector(`.lead-card[data-lead-id="${CSS.escape(openMenu)}"] .lead-card-more`);if(button){button.setAttribute('aria-expanded','true');button.parentElement.querySelector('[role=group]').hidden=false;}}
    if(focusId&&focusControl&&!focused.isConnected){
      const target=board.querySelector(`.lead-card[data-lead-id="${CSS.escape(focusId)}"] .${focusControl}`);
      (target||nav.querySelector('[aria-pressed=true]'))?.focus({preventScroll:true});
    }
  };
  function refreshDay(){const day=TaskDates.today();if(day!==lastDay){lastDay=day;render();}}
  window.addEventListener('focus',refreshDay);document.addEventListener('visibilitychange',refreshDay);setInterval(refreshDay,60000);
  function fitWorkspace(){
    if(!workspace.getClientRects().length)return;
    const rect=workspace.getBoundingClientRect(), scale=rect.width/workspace.offsetWidth||1;
    workspace.style.setProperty('--lead-height',((window.innerHeight-rect.top-18)/scale)+'px');
  }
  const header=shell.querySelector(':scope > .topbar');if(header)new ResizeObserver(fitWorkspace).observe(header);
  window.addEventListener('resize',fitWorkspace);window.addEventListener('foodbrokerbase:workspace-ready',fitWorkspace);
  render();fitWorkspace();
})();
