const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const workspace=fs.readFileSync(path.join(root,'todo-workspace.js'),'utf8');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
function part(source,name){const start=source.indexOf('function '+name+'('),end=source.indexOf('\n  function ',start+1);return source.slice(start,end<0?undefined:end);}
function appPart(name){const start=app.indexOf('function '+name+'(');return app.slice(start,app.indexOf('\nfunction ',start+1));}
function setup(){
  const draft=new Map(),notes={dataset:{taskId:'task'},textContent:''},feedback={textContent:''},notice={textContent:''};
  let writes=0,flushes=0,failAt=0,durable;
  const context={
    todos:[{id:'task',title:'Task',notes:'Existing note',myDay:'2026-11-05',due:'2026-11-05',dueTime:'10:00',status:'New',priority:'Medium',subtasks:[],createdAt:'2026-11-01T00:00:00Z',archivedAt:''}],
    todoColumns:['New','In Progress','Waiting on Someone','Done'],selectedId:'task',
    noteDrafts:draft,noteTimers:new Map(),noteRecoveryKeys:new Map(),rowNotices:new Map(),
    normalizeActivityHistory:value=>value||[],normalizeVendorName:value=>value||'',
    detail:{querySelector:()=>notes},board:{querySelector:()=>feedback},document:{querySelector:()=>notice},CSS:{escape:value=>value},
    clearTimeout(){},setTimeout(){return 1;},renderTodoBoard(){},updateTimelineSearchSuggestions(){},
    persistTodos(){writes++;if(writes===failAt)return false;durable=JSON.parse(JSON.stringify(context.todos));return true;},
    pushPendingCloudSections:async()=>{flushes++;return true;}
  };
  vm.createContext(context);
  vm.runInContext(appPart('normalizeTodo')+'\n'+appPart('moveTodoToStatus'),context);
  for(const name of ['saveChange','noteMessage','saveNoteDraft','rowMessage','saveTask','changeStatus','archiveTask'])vm.runInContext(part(workspace,name),context);
  const archive=fs.readFileSync(path.join(root,'todo-archive.js'),'utf8');
  vm.runInContext(archive.slice(archive.indexOf('function moveTodoToArchive('),archive.indexOf('window.addEventListener(')),context);
  return {context,draft,notes,feedback,notice,durable:()=>durable,writes:()=>writes,flushes:()=>flushes,failNext:()=>{failAt=writes+1;}};
}

test('saving a note preserves My Day, schedule and the other task fields',()=>{
  const s=setup();s.draft.set('task','New note\nAnother line');
  assert.equal(s.context.saveNoteDraft('task'),true);
  const saved=s.durable()[0];assert.equal(saved.notes,'New note\nAnother line');
  assert.equal(saved.myDay,'2026-11-05');assert.equal(saved.dueTime,'10:00');assert.equal(saved.status,'New');
  assert.equal(s.draft.size,0);assert.equal(s.notes.textContent,'Note saved.');
});

test('a failed note save retains the text for retry and rolls back the task',()=>{
  const s=setup();s.draft.set('task','Do not lose this note');s.failNext();
  assert.equal(s.context.saveNoteDraft('task'),false);
  assert.equal(s.context.todos[0].notes,'Existing note');assert.equal(s.draft.get('task'),'Do not lose this note');
  assert.match(s.notes.textContent,/text is still here/);
  assert.equal(s.context.saveNoteDraft('task'),true);assert.equal(s.durable()[0].notes,'Do not lose this note');
});

test('notes can be cleared intentionally',()=>{
  const s=setup();s.draft.set('task','');assert.equal(s.context.saveNoteDraft('task'),true);
  assert.equal(s.durable()[0].notes,'');assert.equal(s.draft.size,0);
});

test('saving a note keeps unrelated edits made after the note editor opened',()=>{
  const s=setup();s.draft.set('task','Edited note');s.context.todos[0].priority='High';
  assert.equal(s.context.saveNoteDraft('task'),true);assert.equal(s.durable()[0].priority,'High');
});

test('the row Save button commits a pending note and starts the existing cloud retry path',()=>{
  const s=setup();s.draft.set('task','Saved from the row');assert.equal(s.context.saveTask('task'),true);
  assert.equal(s.durable()[0].notes,'Saved from the row');assert.equal(s.flushes(),1);
  assert.equal(s.feedback.textContent,'Saved on this device.');
});

test('the row Save button reports a local failure and does not claim success',()=>{
  const s=setup();s.failNext();assert.equal(s.context.saveTask('task'),false);
  assert.equal(s.flushes(),0);assert.match(s.feedback.textContent,/Could not save/);
});

test('changing status saves a pending note before the task leaves its current list',()=>{
  const s=setup();s.draft.set('task','Before completion');s.context.changeStatus('task','Done');
  assert.equal(s.durable()[0].notes,'Before completion');assert.equal(s.durable()[0].status,'Done');
  assert.equal(s.durable()[0].myDay,'2026-11-05');assert(s.durable()[0].completedAt);
});

test('archiving preserves the note and status for restoring the task later',()=>{
  const s=setup();s.draft.set('task','Keep with the archived task');assert.equal(s.context.archiveTask('task'),true);
  const saved=s.durable()[0];assert.equal(saved.notes,'Keep with the archived task');assert.equal(saved.status,'New');assert(saved.archivedAt);
  assert.match(s.notice.textContent,/restore/);assert.equal(s.context.selectedId,'');
});

test('a failed archive keeps the task visible and selected',()=>{
  const s=setup();s.failNext();assert.equal(s.context.archiveTask('task'),false);
  assert.equal(s.context.todos[0].archivedAt,'');assert.equal(s.context.selectedId,'task');
});
