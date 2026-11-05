/* FoodBrokerBase task workspace. All writes use the existing save path. */
(() => {
  'use strict';
  let selectedId='', view='all', layout='list', lastDay=TaskDates.today();
  let dateOverride=null, timeOverride=null, parsed=TaskDates.parse('');
  const labels={all:'All tasks',myday:'My Day',today:'Due today',important:'Important',planned:'Planned',done:'Completed',New:'New','In Progress':'In progress','Waiting on Someone':'Waiting on someone'};
  const iconNames={all:'list-task',myday:'sun',today:'calendar-event',important:'star',planned:'calendar-week',done:'check-circle',New:'file-earmark','In Progress':'arrow-repeat','Waiting on Someone':'people'};
  const icon=name=>`<img class="task-icon" src="task-icons/${name}.svg" alt="" width="18" height="18">`;
  const originalRender=renderTodoBoard;
  const panel=document.querySelector('#todoDialog .todo-panel');
  const workspace=document.createElement('div');workspace.className='task-workspace';
  workspace.innerHTML=`<aside class="task-sidebar" aria-label="Task views"><h2>Task views</h2><nav class="task-views" aria-label="Task lists"></nav><details class="task-extra-views"><summary>More task views</summary><div class="task-date-views"></div></details><div class="task-archive-slot"></div></aside><section class="task-center"><header class="task-list-heading"><div><h1 id="taskViewTitle">All tasks</h1><p id="taskViewDescription"></p></div><div class="task-heading-actions"><div class="task-layout-switch" aria-label="Task layout"><button type="button" data-layout="list" aria-pressed="true">List</button><button type="button" data-layout="board" aria-pressed="false">Board</button></div><button type="button" class="task-new">+ Add task</button></div></header><div class="task-search-bar"><div class="task-search-slot"></div><button type="button" class="task-filter-toggle" aria-expanded="false" aria-controls="taskFilterPanel">Filters</button></div><section id="taskFilterPanel" class="task-filters" hidden></section><div class="task-list-slot"></div><form class="task-composer"><label for="taskQuickTitle">Add a task</label><div class="task-entry"><input id="taskQuickTitle" placeholder="Type a task, e.g. Call Brakebush tomorrow at 10am" required maxlength="500" autocomplete="off" aria-describedby="taskEntryHelp"><button type="submit">Add</button></div><div class="task-date-chips" aria-live="polite"></div><div class="task-entry-options"><label><input type="checkbox" id="taskQuickMyDay"> Add to My Day</label><button type="button" class="task-set-schedule" aria-expanded="false">Set date / time</button></div><p id="taskEntryHelp">Press Enter to add. Dates and times are detected as you type.</p><p class="task-save-message" role="status"></p></form></section><aside class="task-detail" aria-label="Task details" hidden></aside>`;
  panel.append(workspace);
  const board=elements.todoBoard, detail=workspace.querySelector('.task-detail'), nav=workspace.querySelector('.task-views');
  workspace.querySelector('.task-list-slot').append(board);
  const controls=panel.querySelector('.todo-controls');
  workspace.querySelector('.task-search-slot').append(elements.todoSearch.closest('label'));
  workspace.querySelector('.task-filters').append(controls);
  workspace.querySelector('.task-date-views').append(panel.querySelector('.todo-summary-grid'));
  workspace.querySelector('.task-archive-slot').append(panel.querySelector('.todo-archive-toolbar'));
  const filterButton=workspace.querySelector('.task-filter-toggle');
  filterButton.onclick=()=>{const filters=workspace.querySelector('.task-filters');filters.hidden=!filters.hidden;filterButton.setAttribute('aria-expanded',String(!filters.hidden));};
  Object.entries(labels).forEach(([key,label],i)=>{
    if(i===6){const h=document.createElement('h2');h.textContent='By status';nav.append(h);}
    const button=document.createElement('button');button.type='button';button.dataset.taskView=key;
    button.innerHTML=`${icon(iconNames[key])}<span>${label}</span><small></small>`;
    button.onclick=()=>{view=key;selectedId='';clearTodoFilters(false);workspace.querySelector('#taskQuickMyDay').checked=key==='myday';renderTodoBoard();};nav.append(button);
  });
  workspace.querySelectorAll('[data-layout]').forEach(button=>button.onclick=()=>{layout=button.dataset.layout;selectedId='';renderTodoBoard();});
  // Existing date-view buttons retain their handlers, with the primary view reset.
  workspace.querySelectorAll('[data-todo-quick]').forEach(button=>button.addEventListener('click',()=>{view='all';renderTodoBoard();}));
  const input=workspace.querySelector('#taskQuickTitle');
  workspace.querySelector('.task-new').onclick=()=>input.focus();
  const chips=workspace.querySelector('.task-date-chips');let showSchedule=false;
  function schedule(){return {date:dateOverride===null?parsed.date:dateOverride,time:timeOverride===null?parsed.time:timeOverride};}
  function renderChips(){
    const values=schedule();chips.innerHTML='';
    ['date','time'].forEach(kind=>{
      if(!values[kind]&&!showSchedule)return;
      const chip=document.createElement('div');chip.className='task-date-chip';
      chip.innerHTML=`<label>${kind==='date'?'Due date':'Time'}<input type="${kind}" data-friendly-time="true" aria-label="Quick task ${kind}" value="${escapeAttribute(values[kind])}"></label><button type="button" aria-label="Remove detected ${kind}">Remove</button>`;
      chip.querySelector('input').onchange=e=>{if(kind==='date')dateOverride=e.target.value;else timeOverride=e.target.value;};
      chip.querySelector('button').onclick=()=>{if(kind==='date')dateOverride='';else timeOverride='';renderChips();input.focus();};chips.append(chip);
    });
  }
  input.oninput=()=>{dateOverride=null;timeOverride=null;parsed=TaskDates.parse(input.value);renderChips();workspace.querySelector('.task-save-message').textContent='';};
  workspace.querySelector('.task-set-schedule').onclick=e=>{showSchedule=!showSchedule;e.currentTarget.setAttribute('aria-expanded',String(showSchedule));renderChips();};
  function saveChange(id,changes){
    const previous=todos;todos=todos.map(t=>t.id===id?normalizeTodo({...t,...changes}):t);
    if(!persistTodos()){todos=previous;renderTodoBoard();return false;}
    updateTimelineSearchSuggestions();renderTodoBoard();return true;
  }
  function myday(task){return task.myDay===TaskDates.today();}
  function matches(task,key){
    if(key==='myday')return myday(task)&&task.status!=='Done';
    if(key==='today')return isTodoDueToday(task)&&task.status!=='Done';
    if(key==='important')return task.priority==='High'&&task.status!=='Done';
    if(key==='planned')return !!task.due&&task.status!=='Done';
    if(key==='done')return task.status==='Done';
    if(todoColumns.includes(key))return task.status===key;
    return true;
  }
  workspace.querySelector('.task-composer').onsubmit=event=>{
    event.preventDefault();const raw=input.value.trim();if(!raw)return;
    parsed=TaskDates.parse(raw);const values=schedule();
    const tokens=parsed.tokens.filter(t=>t.kind==='date'?!!values.date:!!values.time);
    const title=TaskDates.clean(raw,tokens)||raw;
    const task=normalizeTodo({id:crypto.randomUUID(),title,due:values.date,dueTime:values.time,myDay:workspace.querySelector('#taskQuickMyDay').checked?TaskDates.today():'',status:['New','In Progress','Waiting on Someone'].includes(view)?view:'New',priority:view==='important'?'High':'Medium',createdAt:new Date().toISOString(),subtasks:[]});
    const previous=todos;todos=[task,...todos];
    if(!persistTodos()){todos=previous;workspace.querySelector('.task-save-message').textContent='Could not save. Your entry is still here to retry.';return;}
    selectedId=task.id;view=task.myDay?'myday':'all';clearTodoFilters(false);layout='list';input.value='';dateOverride=timeOverride=null;parsed=TaskDates.parse('');showSchedule=false;workspace.querySelector('.task-set-schedule').setAttribute('aria-expanded','false');renderChips();
    updateTimelineSearchSuggestions();renderTodoBoard();workspace.querySelector('.task-save-message').textContent='Task added.';input.focus();
  };
  function showDetail(task){
    detail.hidden=!task;workspace.classList.toggle('has-detail',!!task);if(!task){detail.innerHTML='';return;}
    detail.innerHTML=`<div class="task-detail-top"><span>Task details</span><button type="button" class="task-detail-close">Close</button></div><section class="task-detail-card"><h2>${escapeHtml(task.title)}</h2><button type="button" class="task-myday" aria-pressed="${myday(task)}">${icon('sun')}${myday(task)?'Remove from My Day':'Add to My Day'}</button><p class="task-detail-help">${myday(task)?'In your focus list for today.':'Focus on this task today without changing its due date.'}</p><label class="task-important"><input type="checkbox" ${task.priority==='High'?'checked':''}> Important</label></section><section class="task-detail-card task-detail-fields"><label>Due date<input class="task-due" type="date" value="${escapeAttribute(task.due||'')}"></label><label>Time<input class="task-time" data-friendly-time="true" type="time" value="${escapeAttribute(task.dueTime||'')}"></label><label>Status<select class="task-status">${todoColumns.map(s=>`<option ${s===task.status?'selected':''}>${escapeHtml(s)}</option>`).join('')}</select></label><label>Priority<select class="task-priority">${Object.keys(priorities).map(s=>`<option ${s===task.priority?'selected':''}>${s}</option>`).join('')}</select></label><dl><dt>Assigned by</dt><dd>${escapeHtml(task.assignedBy||'Unassigned')}</dd><dt>Operator</dt><dd>${escapeHtml(task.account||'None')}</dd><dt>Vendor</dt><dd>${escapeHtml(task.vendor||'None')}</dd></dl></section><section class="task-detail-card"><h3>Checklist</h3><div class="task-checklist">${task.subtasks.map((s,i)=>`<label><input type="checkbox" data-step="${i}" ${s.done?'checked':''}><span>${escapeHtml(s.text)}</span></label>`).join('')||'<p class="task-detail-help">No steps yet.</p>'}</div><form class="task-add-step"><input aria-label="Add a step" placeholder="Add a step" required maxlength="500"><button type="submit">Add</button></form><h3>Notes</h3><p class="task-detail-notes">${escapeHtml(task.notes||'No notes yet.')}</p></section><div class="task-detail-actions"><button type="button" data-action="edit">Edit task</button><button type="button" data-action="lead">Turn into Lead</button><button type="button" data-action="archive">Archive task</button></div><small class="task-created">${task.createdAt?'Created '+escapeHtml(formatDateTime(task.createdAt)):''}</small>`;
    detail.querySelector('.task-detail-close').onclick=()=>{selectedId='';renderTodoBoard();board.querySelector(`[data-task-id="${CSS.escape(task.id)}"]`)?.focus();};
    detail.querySelector('.task-myday').onclick=()=>saveChange(task.id,{myDay:myday(task)?'':TaskDates.today()});
    detail.querySelector('.task-important input').onchange=e=>saveChange(task.id,{priority:e.target.checked?'High':'Medium'});
    detail.querySelector('.task-priority').onchange=e=>saveChange(task.id,{priority:e.target.value});
    detail.querySelector('.task-due').onchange=e=>saveChange(task.id,{due:e.target.value});
    detail.querySelector('.task-time').onchange=e=>saveChange(task.id,{dueTime:e.target.value});
    detail.querySelector('.task-status').onchange=e=>moveTodoToStatus(task.id,e.target.value);
    detail.querySelectorAll('[data-step]').forEach(check=>check.onchange=()=>saveChange(task.id,{subtasks:task.subtasks.map((s,i)=>i===Number(check.dataset.step)?{...s,done:check.checked}:s)}));
    detail.querySelector('.task-add-step').onsubmit=e=>{e.preventDefault();const step=e.currentTarget.querySelector('input');if(step.value.trim()&&saveChange(task.id,{subtasks:[...task.subtasks,{id:crypto.randomUUID(),text:step.value.trim(),done:false}]}))detail.querySelector('.task-add-step input')?.focus();};
    detail.querySelector('[data-action="edit"]').onclick=()=>openTodoForm(task);
    detail.querySelector('[data-action="lead"]').onclick=()=>convertTodoToLead(task.id);
    detail.querySelector('[data-action="archive"]').onclick=()=>archiveTodo(task.id);
  }
  renderTodoBoard=function(){
    if(!workspace.isConnected){originalRender();return;}
    // Preserve keyboard position when updating an existing task's controls.
    const focused=workspace.contains(document.activeElement)?document.activeElement:null;
    const focusClass=focused?.closest('.task-detail')?focused.className:'';
    updateTodoSummary();setActiveTodoQuickTile();
    const items=getVisibleTodos().filter(t=>matches(t,view));
    workspace.querySelector('#taskViewTitle').textContent=activeTodoQuickFilter?getTodoQuickFilterLabel(activeTodoQuickFilter):labels[view];
    workspace.querySelector('#taskViewDescription').textContent=`${items.length} ${items.length===1?'task':'tasks'}${view==='myday'?' to focus on today':''}`;
    nav.querySelectorAll('button').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.taskView===view&&!activeTodoQuickFilter));b.querySelector('small').textContent=todos.filter(t=>!t.archivedAt&&matches(t,b.dataset.taskView)).length;});
    workspace.querySelectorAll('[data-layout]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.layout===layout)));
    if(layout==='board'){
      // Render the existing draggable board with the same filtered task set.
      const getOriginal=getVisibleTodos;const quickOriginal=todoQuickListMode;
      try{getVisibleTodos=()=>items;todoQuickListMode=false;originalRender();}finally{getVisibleTodos=getOriginal;todoQuickListMode=quickOriginal;}
      board.classList.add('task-board-layout');showDetail(null);return;
    }
    board.className='todo-board task-list';board.innerHTML='';
    if(!items.length)board.innerHTML='<div class="task-empty"><h2>All clear</h2><p>No tasks match this view. Add a task or adjust your filters.</p></div>';
    items.forEach(task=>{
      const row=document.createElement('article');row.className='task-row';row.classList.toggle('selected',task.id===selectedId);
      const context=[task.vendor,task.account].filter(Boolean).join(' · ')||task.assignedBy&&'By '+task.assignedBy||'No operator or vendor';
      row.innerHTML=`<input class="task-complete" type="checkbox" aria-label="${escapeAttribute((task.status==='Done'?'Reopen ':'Complete ')+task.title)}" ${task.status==='Done'?'checked':''}><button type="button" class="task-open" data-task-id="${escapeAttribute(task.id)}" aria-pressed="${task.id===selectedId}"><span class="task-row-title ${task.status==='Done'?'is-done':''}">${escapeHtml(task.title)}</span><span class="task-row-meta">${escapeHtml(context)}${task.subtasks.length?` · ${task.subtasks.filter(s=>s.done).length}/${task.subtasks.length} steps`:''}</span></button><div class="task-row-schedule ${isTodoOverdue(task)?'task-overdue':''}">${task.due?escapeHtml(formatDate(task.due)):'No due date'}${task.dueTime?`<small>${escapeHtml(task.dueTime)}</small>`:''}</div><span class="task-status-pill">${escapeHtml(task.status)}</span><button type="button" class="task-day-action" aria-pressed="${myday(task)}" aria-label="${escapeAttribute((myday(task)?'Remove from My Day: ':'Add to My Day: ')+task.title)}" title="${myday(task)?'Remove from My Day':'Add to My Day'}">${icon('sun')}<span>${myday(task)?'In My Day':'My Day'}</span></button>`;
      row.querySelector('.task-open').onclick=()=>{selectedId=task.id;renderTodoBoard();detail.querySelector('.task-detail-close').focus();};
      row.querySelector('.task-complete').onchange=e=>moveTodoToStatus(task.id,e.target.checked?'Done':'New');
      row.querySelector('.task-day-action').onclick=()=>saveChange(task.id,{myDay:myday(task)?'':TaskDates.today()});board.append(row);
    });
    showDetail(items.find(t=>t.id===selectedId));
    if(focusClass&&!focused.isConnected){const target=detail.getElementsByClassName(focusClass)[0];target?.focus();}
  };
  // Avoid leaving yesterday's My Day visible across a midnight or sleep boundary.
  function refreshDay(){const day=TaskDates.today();if(day!==lastDay){lastDay=day;renderTodoBoard();}}
  window.addEventListener('focus',refreshDay);document.addEventListener('visibilitychange',refreshDay);setInterval(refreshDay,60000);
  function fitWorkspace(){if(workspace.getClientRects().length)workspace.style.setProperty('--task-height',(window.innerHeight-workspace.getBoundingClientRect().top-18)+'px');}
  new ResizeObserver(fitWorkspace).observe(panel.querySelector('.topbar'));
  window.addEventListener('resize',fitWorkspace);
  new MutationObserver(fitWorkspace).observe(document.querySelector('#todoDialog'),{attributes:true,attributeFilter:['hidden']});
  renderTodoBoard();fitWorkspace();
})();
