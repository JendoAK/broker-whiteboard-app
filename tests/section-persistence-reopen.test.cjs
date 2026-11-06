const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const sync = require('../cloud-work-sync.js');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
const cut = (start, end) => app.slice(app.indexOf(start), app.indexOf(end, app.indexOf(start)));
function storage() {
  const data = new Map();
  return {get length() {return data.size;}, key: index => [...data.keys()][index],
    getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key)};
}
function database() {
  const rows = new Map(); let offline = false, serial = 0, conflict;
  const read = () => {if (offline) throw Error('Offline'); return clone([...rows.values()]);};
  class Query {
    constructor(table) {this.table = table; this.filters = []; this.op = 'read';}
    select() {return this;} limit() {return this;} eq(key, value) {this.filters.push([key, value]); return this;}
    update(payload) {this.op = 'update'; this.payload = payload; return this;}
    insert(payload) {this.op = 'insert'; this.payload = payload; return this;}
    maybeSingle() {this.single = true; return this;}
    async execute() {
      const matches = read().filter(row => row.table === this.table && this.filters.every(([key, value]) => row[key] === value));
      if (this.op === 'read') return {data: this.single ? matches[0] || null : matches, error: null};
      if (this.payload.data.syncProtocol !== 3) return {error: {code: 'PT426'}};
      if (this.op === 'update' && !matches.length) return {data: [], error: null};
      const existing = this.op === 'update' ? matches[0] : rows.get(this.payload.record_key);
      if (this.op === 'insert' && existing) return {error: {code: '23505'}};
      const row = {...existing, ...clone(this.payload), table: this.table, updated_at: 'v' + ++serial};
      rows.set(row.record_key, row); return {data: [clone(row)], error: null};
    }
    then(resolve, reject) {return this.execute().then(resolve, reject);}
  }
  const client = {from: table => new Query(table), rpc: async (name, args) => {
    read();
    assert.equal(name, 'save_team_directory_section');
    if (conflict) {const hook = conflict; conflict = null; hook(rows.get(args.section_key));}
    const row = rows.get(args.section_key);
    if (args.expected_updated_at !== (row.data.directoryRevision || row.updated_at)) return {error: {code: 'PT409'}, status: 409};
    assert.equal(args.section_value.syncProtocol, 3);
    row.data = {...clone(args.section_value), directoryRevision: 'r' + ++serial}; row.updated_at = 'v' + serial;
    return {data: {updatedAt: row.data.directoryRevision}, error: null};
  }};
  return {client, read, rows, offline: value => {offline = value;}, conflict: hook => {conflict = hook;}, seed(section, value) {
    rows.set(section.key, {record_key: section.key, record_type: section.scope === 'team' ? 'team_section' : 'app_section',
      table: section.scope === 'team' ? 'team_app_records' : 'app_records', scope: section.scope, owner_id: 'owner',
      updated_at: 'v' + ++serial, data: {value: clone(value)}});
  }};
}
function open(localStorage, db) {
  const context = {localStorage, console: {warn() {}, error() {}}, user: {id: 'owner'},
    marketVisitTypes: {testkitchen: 'Test Kitchen', foodshow: 'Food Show'}, workCloudSectionKeys: new Set(),
    getCloudUser: () => context.user, getCloudClient: () => db.client,
    failedLocalSections: new Set(), cloudPendingStorageKey: 'pending', pendingCloudSections: new Set(JSON.parse(localStorage.getItem('pending') || '[]')),
    cloudSectionRevisions: new Map(), cloudSaveChain: Promise.resolve(), cloudSaveRequests: 0, cloudWriteEpoch: 0,
    cloudSaveConfirmed: false, cloudSaveTimer: null, cloudSyncReady: true, cloudSyncLoading: false, cloudSyncUserId: 'owner',
    cloudRowCache: new Map(), cloudLastRowFingerprint: '', lastCloudError: '', backupVersion: 1,
    cloudRecordType: 'app_section', teamCloudRecordType: 'team_section', sharedTrackerKeys: new Set(), trackerMigrationOwners: new Map(),
    workCloudBases: sync.createBases(localStorage), taskOutbox: sync.createOutbox(localStorage), legacyRecoveryCopies: new Map(), sampleCloudSnapshots: new Map(),
    correctContactNames: value => value, updateRecordedInitials: value => value, recordWorkUpdateTimes() {}, updateSaveStatus() {}, renderAfterCloudSync() {},
    isAppEditing: () => false, alert() {}, syncSavedTeamInitials: async () => {}, correctPeteTeamRecords: async () => {},
    getDirectoryCloudWriteBases: () => new Map(), rememberDirectoryCloudWriteBase() {},
    fetchCloudRowSummary: async () => db.read(), downloadChangedCloudRows: async () => db.read(),
    getCloudSectionValue: (section, personal, team) => {const row = (section.scope === 'team' ? team : personal).get(section.key); return {found: !!row, value: row?.data.value};},
    hasLocalAppData: () => true, cloudRowCacheKey: row => row.record_key, getCloudRowFingerprint: rows => rows.map(row => row.updated_at).join(','),
    window: {foodBrokerWorkSync: sync, foodBrokerBaseAuth: {getCurrentProfile: () => ({role: 'member'})},
      foodBrokerSaveStatus: {localSaved() {}, recordError() {}, recoverSections() {}}, clearTimeout() {}, setTimeout() {return 1;}}
  };
  for (const name of ['peopleContactsStorageKey','calendarPreferencesKey','personalVisitCalendarKey','marketVisitStorageKey','eventProductStorageKey','storageKey','todoStorageKey','manualVendorStorageKey','addressBookStorageKey','stockStorageKey','sampleStorageKey','dotOrderStorageKey','nestleMachineStorageKey','personalMarketVisitCloudKey','legacyPcMarketVisitCloudKey','pcMarketVisitCloudKey','vendorMarketVisitCloudKey']) context[name] = name;
  for (const [name, key] of Object.entries({peopleContacts: 'peopleContactsStorageKey', calendarPreferences: 'calendarPreferencesKey', personalVisitCalendar: 'personalVisitCalendarKey', marketVisits: 'marketVisitStorageKey', eventProducts: 'eventProductStorageKey', cards: 'storageKey', todos: 'todoStorageKey', manualVendorReports: 'manualVendorStorageKey', addressBook: 'addressBookStorageKey', stockProducts: 'stockStorageKey', samples: 'sampleStorageKey', dotOrders: 'dotOrderStorageKey', nestleMachines: 'nestleMachineStorageKey'})) context[name] = JSON.parse(localStorage.getItem(key) || '[]');
  context.todoSavedSnapshot = clone(context.todos);
  for (const name of ['normalizePeopleContact','normalizeAddressBookEntry','normalizeTodo','normalizeCard','normalizeStockProduct','normalizeManualVendorReport','normalizeEventProduct','normalizeNestleMachine','normalizeMarketVisit','normalizeSample','normalizeDotOrder','normalizeCalendarPreferences','normalizePersonalVisitCalendar']) context[name] = clone;
  context.getCurrentCalendarPreferences = () => context.calendarPreferences;
  context.setCurrentCalendarPreferences = value => {context.calendarPreferences = value;};
  context.getCurrentPersonalVisitCalendar = () => context.personalVisitCalendar;
  context.setCurrentPersonalVisitCalendar = value => {context.personalVisitCalendar = value;};
  context.getMarketVisitsByCloudType = type => context.marketVisits.filter(visit => visit.type === type);
  context.replaceMarketVisitsByCloudType = (type, value) => {context.marketVisits = [...context.marketVisits.filter(visit => visit.type !== type), ...value];};
  context.directoryCloudSectionKeys = new Set(['peopleContactsStorageKey','addressBookStorageKey','sampleStorageKey','dotOrderStorageKey']);
  context.sampleCloudSectionKeys = new Set(['sampleStorageKey','dotOrderStorageKey']);
  vm.createContext(context);
  vm.runInContext(cut('const cloudSectionConfigs = [', 'if (!localStorage.getItem(resetFlagKey))') + '\nglobalThis.sections = cloudSectionConfigs; globalThis.caches = localCloudCacheConfigs;', context);
  context.getCloudConfig = key => context.sections.find(section => section.key === key);
  context.getLocalCloudCacheConfig = key => context.caches.find(section => section.key === key);
  context.getCloudConfigsForKey = key => context.sections.filter(section => section.key === key || section.localKey === key);
  context.expandCloudSectionKeys = keys => [...new Set((keys || context.sections.map(section => section.key)).flatMap(key => context.getCloudConfigsForKey(key).map(section => section.key)))];
  context.sectionJournal = sync.createJournal(context.taskOutbox, context.sections.filter(section => !context.sampleCloudSectionKeys.has(section.key)));
  vm.runInContext([
    cut('function writeLocalSection(', 'function persist()'), cut('function persistTodos(', 'function getCloudClient('),
    cut('function readPendingCloudSections(', 'function extractCloudValue('),
    cut('function sampleSyncUserValid(', 'function mergeCloudSectionValues('),
    cut('async function writeCloudSectionsToLocalStorage(', 'function renderAfterCloudSync('),
    cut('function scheduleCloudSave(', 'async function fetchCloudRowSummary('),
    cut('async function loadCloudSections(', 'function handleCloudAuthChange('),
    cut('async function mergeCloudDataIntoThisBrowser(', 'async function syncLocalDataToCloud(')
  ].join('\n'), context);
  return {context, sections: context.sections, reopen: () => open(localStorage, db), edit(key, fn) {
    const section = context.getCloudConfig(key); section.set(fn(clone(section.get())));
    if (section.localKey === 'marketVisitStorageKey') context.persistMarketVisits();
    else if (key === 'todoStorageKey') assert.equal(context.persistTodos(), true);
    else {context.writeLocalSection(key, section.get()); context.scheduleCloudSave(key);}
  }};
}
const kinds = ['peopleContactsStorageKey','addressBookStorageKey','todoStorageKey','storageKey','manualVendorStorageKey','stockStorageKey','eventProductStorageKey','nestleMachineStorageKey','calendarPreferencesKey','personalVisitCalendarKey','personalMarketVisitCloudKey','vendorMarketVisitCloudKey','marketVisitStorageKey-testkitchen','marketVisitStorageKey-foodshow'];
async function fixture() {
  const local = storage(), db = database(), app = open(local, db);
  for (const section of app.sections) {
    const type = section.key === 'personalMarketVisitCloudKey' ? 'personal' : section.key === 'vendorMarketVisitCloudKey' ? 'manufacturer' : section.key.endsWith('-testkitchen') ? 'testkitchen' : 'foodshow';
    db.seed(section, [{id: section.key + '-record', ownerId: 'owner', type, notes: 'Original', calls: [], status: 'New', attachments: []}]);
  }
  assert.equal(await app.context.loadCloudSections(), true, app.context.lastCloudError); return {app, local, db};
}

for (const key of ['storageKey','todoStorageKey']) test(`${key}: immediate offline reopen recovers a save before background compression finishes`,async()=>{
 const {app,local,db}=await fixture(),c=app.context;
 app.edit(key,rows=>rows.map(row=>({...row,notes:'Large existing note '.repeat(15000)})));await c.pushPendingCloudSections();
 const old=local.getItem(key),jobs=new Map();
 c.window.foodBrokerCompactStorage={defer(name,text){jobs.set(name,text);return true;}};
 db.offline(true);app.edit(key,rows=>rows.map(row=>({...row,status:'In Progress',myDay:'2026-11-06'})));
 assert.ok(jobs.has(key));assert.equal(local.getItem(key),old);assert.ok(c.taskOutbox.list('owner',key).length);
 const reopened=app.reopen();await reopened.context.loadCloudSections();
 const saved=reopened.context.getCloudConfig(key).get()[0];assert.equal(saved.status,'In Progress');assert.equal(saved.myDay,'2026-11-06');assert.ok(saved.notes.startsWith('Large existing note'));
 db.offline(false);await reopened.context.loadCloudSections();assert.equal(db.rows.get(key).data.value[0].status,'In Progress');
});

for (const key of ['storageKey','todoStorageKey']) test(`${key}: cloud acknowledgements wait for the latest cache and preserve edits made during compression`,async()=>{
 const {app,local,db}=await fixture(),c=app.context;
 app.edit(key,rows=>rows.map(row=>({...row,notes:'Large existing note '.repeat(15000)})));await c.pushPendingCloudSections();
 const jobs=new Map();let release,entered;const gate=new Promise(done=>{release=done;}),started=new Promise(done=>{entered=done;});
 c.window.foodBrokerCompactStorage={defer(name,text){jobs.set(name,text);return true;},async writeAsync(name,text){if(!jobs.has(name))jobs.set(name,text);entered();await gate;local.setItem(name,jobs.get(name));}};
 app.edit(key,rows=>rows.map(row=>({...row,status:'In Progress'})));const uploading=c.pushPendingCloudSections();await started;
 assert.ok(c.taskOutbox.list('owner',key).length);assert.equal(c.cloudSaveConfirmed,false);
 app.edit(key,rows=>rows.map(row=>({...row,myDay:'2026-11-06'})));release();assert.equal(await uploading,true);
 const latest=JSON.parse(local.getItem(key))[0];assert.equal(latest.status,'In Progress');assert.equal(latest.myDay,'2026-11-06');
 assert.ok(c.taskOutbox.list('owner',key).length);assert.equal(c.cloudSaveConfirmed,false);
 if(key==='todoStorageKey')assert.equal(c.todoSavedSnapshot[0].myDay,'2026-11-06');
 const reopened=app.reopen();db.offline(true);await reopened.context.loadCloudSections();assert.equal(reopened.context.getCloudConfig(key).get()[0].myDay,'2026-11-06');
});

test('a background cache failure retains the lead recovery edit even after the server accepted it',async()=>{
 const {app,local,db}=await fixture(),c=app.context,key='storageKey';
 app.edit(key,rows=>rows.map(row=>({...row,notes:'Large existing note '.repeat(15000)})));await c.pushPendingCloudSections();const original=local.getItem(key);
 c.window.foodBrokerCompactStorage={defer(){return true;},async writeAsync(){throw Error('Cache worker failed');}};
 app.edit(key,rows=>rows.map(row=>({...row,status:'Done'})));assert.equal(await c.pushPendingCloudSections(),false);
 assert.equal(db.rows.get(key).data.value[0].status,'Done');assert.equal(local.getItem(key),original);assert.ok(c.taskOutbox.list('owner',key).length);
 db.offline(true);const reopened=app.reopen();await reopened.context.loadCloudSections();assert.equal(reopened.context.cards[0].status,'Done');
});

test('a cache refresh without a recovery edit stays synchronous',async()=>{
 const {app,local}=await fixture(),c=app.context;let deferred=0;
 c.window.foodBrokerCompactStorage={defer(){deferred++;return true;}};
 const value=c.cards.map(row=>({...row,notes:'Refreshed cached copy'}));c.cards=value;c.writeLocalSection('storageKey',value,{cache:true});
 assert.equal(deferred,0);assert.equal(JSON.parse(local.getItem('storageKey'))[0].notes,'Refreshed cached copy');
});
for (const key of kinds) test(`${key}: offline updates survive a stale cache and erased queue after reopen`, async () => {
  const {app, local, db} = await fixture(), section = app.context.getCloudConfig(key), oldCache = local.getItem(section.localKey || key);
  db.offline(true);
  app.edit(key, values => values.map(record => ({...record, notes: 'Keep this update', calls: [{id: 'three-bears', operatorName: 'Three Bears', date: '2026-11-10', startTime: '9:00 AM', endTime: '10:00 AM'}]})));
  assert.equal(await app.context.pushPendingCloudSections(), false);
  local.setItem(section.localKey || key, oldCache); local.setItem('pending', '[]');
  const reopened = app.reopen(); await reopened.context.loadCloudSections();
  assert.equal(reopened.context.getCloudConfig(key).get()[0].notes, 'Keep this update');
  db.offline(false); await reopened.context.loadCloudSections();
  assert.equal(db.rows.get(key).data.value[0].notes, 'Keep this update');
  assert.equal(db.rows.get(key).data.value[0].calls[0].operatorName, 'Three Bears');
  assert.equal(reopened.context.taskOutbox.list('owner', key).length, 0);
  const fresh = reopened.reopen(); await fresh.context.loadCloudSections();
  assert.equal(fresh.context.getCloudConfig(key).get()[0].notes, 'Keep this update');
});
test('a contacts conflict rebases field edits without erasing a second device phone change or addition', async () => {
  const {app, db} = await fixture(), key = 'peopleContactsStorageKey';
  app.edit(key, values => values.map(record => ({...record, notes: 'Local note'})));
  db.conflict(row => {row.data.directoryRevision = 'other-device'; row.data.value[0].phone = '907-555-0100'; row.data.value.push({id: 'remote-contact', name: 'Other device contact'});});
  assert.equal(await app.context.pushPendingCloudSections(), true);
  const values = db.rows.get(key).data.value;
  assert.equal(values[0].notes, 'Local note'); assert.equal(values[0].phone, '907-555-0100'); assert.equal(values[1].id, 'remote-contact');
  const fresh = app.reopen(); await fresh.context.loadCloudSections();
  assert.deepEqual(clone(fresh.context.getCloudConfig(key).get()), values);
});
test('manual sync uses recorded edits and cannot resurrect an archived record from a stale cache', async () => {
  const {app, local, db} = await fixture(), key = 'todoStorageKey', stale = local.getItem(key);
  app.edit(key, values => values.map(record => ({...record, status: 'Done', archivedAt: '2026-11-05T23:00:00Z', myDay: '2026-11-05'})));
  assert.equal(await app.context.pushPendingCloudSections(), true);
  local.setItem(key, stale); local.setItem('pending', JSON.stringify([key]));
  const reopened = app.reopen(); assert.equal(await reopened.context.mergeCloudDataIntoThisBrowser(), true);
  assert.equal(db.rows.get(key).data.value[0].status, 'Done');
  assert.equal(db.rows.get(key).data.value[0].myDay, '2026-11-05');
  assert.equal(db.rows.get(key).data.value[0].archivedAt, '2026-11-05T23:00:00Z');
});
test('recording a field edit does not copy unchanged attachments into recovery storage or recreate a deleted record', () => {
  const local = storage(), outbox = sync.createOutbox(local), before = [{id: 'one', notes: '', attachments: [{data: 'x'.repeat(1000000)}]}];
  outbox.keep('owner', 'leads', before, [{...before[0], notes: 'New note'}]);
  const edits = outbox.list('owner', 'leads'); assert.ok(edits[0].raw.length < 300);
  assert.equal(sync.applyEdits(before, edits)[0].notes, 'New note');
  assert.deepEqual(sync.applyEdits([], edits), []);
});

function eventEditors(context, type = 'manufacturer', id = '') {
  let closed = false;
  const message = {hidden: true, textContent: ''};
  const values = {marketVisitId:id, marketVisitType:type, marketVisitName:'Persistence check', marketVisitVendor:'Test vendor',
    marketVisitorName:'Visitor', marketStartDate:'2026-11-09', marketEndDate:'2026-11-12', marketStartTime:'9:00 AM',
    marketEndTime:'10:00 AM', marketLocation:'Anchorage', marketSalesReps:'Test rep', marketStatus:'In Progress', marketNotes:'Keep these notes'};
  context.elements = Object.fromEntries(Object.entries(values).map(([key,value]) => [key,{value}]));
  context.elements.marketArchiveFilter = {value:'active'};
  context.elements.marketVisitForm = {querySelector: () => message};
  Object.assign(context, {crypto:require('node:crypto').webcrypto, activeMarketType:type, activeMarketDetailId:'',
    normalizeStringList:value => String(value || '').split(',').map(item => item.trim()).filter(Boolean),
    stampSharedRecord() {}, renderMarketVisits() {}, closeMarketVisitForm() {closed = true;},
    normalizeMarketCall:value => ({id:require('node:crypto').randomUUID(), ...clone(value)}),
    normalizeMarketOperatorLink:value => ({id:require('node:crypto').randomUUID(), ...clone(value)}),
    formatTimeOption:(hour, minute) => `${hour % 12 || 12}:${String(minute).padStart(2,'0')} ${hour < 12 ? 'AM' : 'PM'}`,
    findOrCreateMarketOperator:name => ({operatorId:'test-operator',operatorName:name}), isMarketOperatorAlreadyAttached:() => false,
    getMarketVisitProducts:() => [], FormData:class {constructor(form) {this.form=form;} [Symbol.iterator]() {return Object.entries(this.form.values)[Symbol.iterator]();}}
  });
  vm.runInContext(cut('function saveMarketVisit(', 'function deleteCurrentMarketVisit(') + '\n' +
    cut('function updateMarketVisit(', 'function saveMarketProductNote(') + '\n' +
    fs.readFileSync(path.join(__dirname,'../market-call-editor.js'),'utf8'),context);
  return {message,closed:() => closed};
}

const eventKinds = [['manufacturer','vendorMarketVisitCloudKey'],['personal','personalMarketVisitCloudKey'],
  ['foodshow','marketVisitStorageKey-foodshow'],['testkitchen','marketVisitStorageKey-testkitchen']];
for (const [type,key] of eventKinds) test(`${type}: the original event form survives offline close, sync, and a second reopen`,async () => {
  const {app,db} = await fixture(), c=app.context, form=eventEditors(c,type);
  db.offline(true); c.saveMarketVisit();
  assert.equal(form.closed(),true);
  const created=c.getCloudConfig(key).get().find(item => item.name === 'Persistence check');
  assert.ok(created); assert.ok(c.taskOutbox.list('owner',key).length);
  const reopened=app.reopen();
  assert.equal(reopened.context.marketVisits.find(item => item.id === created.id).notes,'Keep these notes');
  assert.equal(await reopened.context.pushPendingCloudSections(),false);
  db.offline(false); assert.equal(await reopened.context.loadCloudSections(),true);
  const fresh=reopened.reopen(); await fresh.context.loadCloudSections();
  const actual=fresh.context.marketVisits.find(item => item.id === created.id);
  for (const field of ['name','notes','status','startDate','endDate','startTime','endTime','location','salesReps']) assert.deepEqual(clone(actual[field]),clone(created[field]),field);
  assert.equal(fresh.context.taskOutbox.list('owner',key).length,0);
});

for (const edit of [false,true]) test(`${edit ? 'editing' : 'creating'} an event: failed browser write keeps the form and retries without duplicates`,async () => {
  const {app,local} = await fixture(), c=app.context, existing=c.getCloudConfig('vendorMarketVisitCloudKey').get()[0];
  const form=eventEditors(c,'manufacturer',edit ? existing.id : ''), before=clone(c.marketVisits), cache=local.getItem('marketVisitStorageKey'), write=local.setItem;
  local.setItem=(key,value) => {if(key === 'marketVisitStorageKey') {const error=Error('Storage full'); error.name='QuotaExceededError'; throw error;} write(key,value);};
  assert.doesNotThrow(() => c.saveMarketVisit());
  assert.equal(form.closed(),false); assert.equal(form.message.hidden,false);
  assert.match(form.message.textContent,/not save/i); assert.equal(c.elements.marketNotes.value,'Keep these notes');
  assert.deepEqual(clone(c.marketVisits),before); assert.equal(local.getItem('marketVisitStorageKey'),cache);
  assert.equal(c.taskOutbox.list('owner','vendorMarketVisitCloudKey').length,0);
  local.setItem=write; assert.equal(c.saveMarketVisit(),true); assert.equal(form.closed(),true);
  assert.equal(c.marketVisits.length,before.length+(edit ? 0 : 1));
  assert.equal(c.marketVisits.filter(item => item.name === 'Persistence check').length,1);
});

test('calls and appointments saved by the actual editor survive offline reopen and a concurrent remote appointment',async () => {
  const {app,db,local} = await fixture(), c=app.context, key='vendorMarketVisitCloudKey', visit=c.getCloudConfig(key).get()[0];
  eventEditors(c); c.updateMarketVisit(visit.id,{startDate:'2026-11-09',endDate:'2026-11-12',operatorLinks:[]});
  await c.pushPendingCloudSections(); const stale=local.getItem('marketVisitStorageKey'); db.offline(true);
  for (const kind of ['call','appointment']) {
    vm.runInContext('marketCallEditContext = '+JSON.stringify({visitId:visit.id,callId:'',newKind:kind,values:{}}),c);
    let closed=false; const message={hidden:true}, form={values:{operatorName:'Test operator',title:'Test appointment',appointmentType:'Other',date:'2026-11-10',startTime:'13:00',endTime:'14:00',salesReps:'Test rep',notes:'Saved calendar notes',status:'Planned'},
      elements:{namedItem:() => ({min:'2026-11-09',max:'2026-11-12'})},querySelector:() => message,closest:() => ({close() {closed=true;}})};
    c.saveMarketCallEdit({currentTarget:form,preventDefault() {}}); assert.equal(closed,true); assert.equal(message.hidden,true);
  }
  const remote=db.rows.get(key); remote.data.value[0].calls.push({id:'remote-appointment',kind:'appointment',title:'Other device appointment'}); remote.updated_at='changed-on-other-device';
  local.setItem('marketVisitStorageKey',stale); local.setItem('pending','[]'); const reopened=app.reopen();
  db.offline(false); await reopened.context.loadCloudSections();
  const fresh=reopened.reopen(); await fresh.context.loadCloudSections();
  const calls=fresh.context.marketVisits.find(item => item.id === visit.id).calls;
  assert.equal(calls.length,3); assert.ok(calls.some(item => item.id === 'remote-appointment'));
  for (const kind of ['call','appointment']) {const item=calls.find(item => item.kind === kind && item.id !== 'remote-appointment');
    assert.equal(item.date,'2026-11-10'); assert.equal(item.startTime,'1:00 PM'); assert.equal(item.endTime,'2:00 PM'); assert.equal(item.notes,'Saved calendar notes');}
});

test('a saved appointment time edit and event archive/status stay saved over a stale-window reopen',async () => {
  const {app,db,local} = await fixture(), c=app.context, key='vendorMarketVisitCloudKey', visit=c.getCloudConfig(key).get()[0];
  eventEditors(c); c.updateMarketVisit(visit.id,{startDate:'2026-11-09',endDate:'2026-11-12',calls:[{id:'appointment',kind:'appointment',date:'2026-11-10',title:'Training',startTime:'9:00 AM',endTime:'10:00 AM',status:'Planned',notes:'Old note'}]});
  await c.pushPendingCloudSections(); const stale=local.getItem('marketVisitStorageKey');
  vm.runInContext('marketCallEditContext = '+JSON.stringify({visitId:visit.id,callId:'appointment',newKind:'',values:{date:'2026-11-10',startTime:'09:00',endTime:'10:00',status:'Planned',notes:'Old note'}}),c);
  let closed=false; const message={hidden:true};
  const form={values:{title:'Training',date:'2026-11-11',startTime:'14:00',endTime:'15:00',status:'Completed',notes:'Updated appointment'},elements:{namedItem:() => ({min:'2026-11-09',max:'2026-11-12'})},querySelector:() => message,closest:() => ({close() {closed=true;}})};
  c.saveMarketCallEdit({currentTarget:form,preventDefault() {}});
  assert.equal(closed,true); assert.equal(message.hidden,true);
  c.updateMarketVisit(visit.id,{status:'Completed',archivedAt:'2026-11-06T19:00:00Z'});
  assert.equal(await c.pushPendingCloudSections(),true);
  local.setItem('marketVisitStorageKey',stale); local.setItem('pending',JSON.stringify([key]));
  const fresh=app.reopen(); assert.equal(await fresh.context.loadCloudSections(),true);
  const actual=fresh.context.marketVisits.find(item => item.id === visit.id);
  assert.equal(actual.status,'Completed'); assert.equal(actual.archivedAt,'2026-11-06T19:00:00Z');
  assert.equal(actual.calls[0].date,'2026-11-11'); assert.equal(actual.calls[0].startTime,'2:00 PM'); assert.equal(actual.calls[0].notes,'Updated appointment'); assert.equal(actual.calls[0].status,'Completed');
});

const entryKinds=[['lead','storageKey','cards'],['task','todoStorageKey','todos'],['contact','peopleContactsStorageKey','peopleContacts'],['operator','addressBookStorageKey','addressBook']];
function entryEditors(c,kind,id='') {
  let closed=false,submit; const error={hidden:true,textContent:''};
  const values={cardId:id,account:'Persistence QA lead',accountNumber:'123',syscoAccountNumber:'456',leadDistributor:'US Foods',note:'New lead note',priority:'High',due:'2026-11-12',status:'Follow Up',source:'Email',salesRep:'Test rep',syscoSalesRep:'Other rep',
    todoId:id,todoTitle:'Persistence QA task',todoStatus:'In Progress',todoPriority:'High',todoDue:'2026-11-12',todoDueTime:'14:30',todoAssignedBy:'Test rep',todoAccount:'Test operator',todoVendor:'Test vendor',todoNotes:'Saved task notes',
    addressBookId:id,addressOperation:'Persistence QA operator',addressAccountNumber:'123',addressSyscoAccountNumber:'456',addressLocations:'Anchorage',addressWebsite:'https://example.invalid',addressUsfSalesRep:'Test rep',addressSyscoSalesRep:'Other rep',
    addressPrimaryName:'Primary contact',addressPrimaryRole:'Buyer',addressPrimaryEmail:'primary@example.invalid',addressPrimaryPhone:'907-555-0100',addressSecondaryName:'Second contact',addressSecondaryRole:'Chef',addressSecondaryEmail:'second@example.invalid',addressSecondaryPhone:'907-555-0101',addressStreet:'Test address',addressNotes:'Saved operator notes'};
  c.elements=Object.fromEntries(Object.entries(values).map(([key,value])=>[key,{value}]));
  const form={querySelector:()=>error}; c.elements.form=form;c.elements.todoForm=form;c.elements.addressBookForm=form;
  c.elements.archiveDialog={open:false};
  Object.assign(c,{crypto:require('node:crypto').webcrypto,columns:['New Lead','Follow Up','Done'],currentAttachments:[{id:'file',data:'data:test'}],currentLeadNoteHistory:[{id:'old-note',text:'Earlier note',createdAt:'2026-11-01T12:00:00Z'}],
    normalizeMarketDistributor:value=>value,rememberLeadDistributor(){},syncOperatorToAddressBook:value=>({operatorName:value}),normalizeStatus:value=>value,normalizeAttachment:clone,
    getLeadNoteHistoryText:history=>history.map(item=>item.text).join('\n'),normalizeAddressContactExtras:value=>value||{},normalizeStringList:value=>String(value||'').split(','),
    readProducts:()=>[{id:'product',description:'Saved product',apn:'12345'}],readSubtasks:()=>[{id:'step',text:'Saved checklist item',done:false}],getMatchedVendorName:value=>value,
    readAddressDeliveryDays:()=>['Monday','Thursday'],readAddressContacts:()=>[{id:'extra',name:'Additional contact',email:'extra@example.invalid',phone:'907-555-0102',extraFields:[{label:'Territory',value:'North'}]}],
    syncLeadProductsToStock(){},showBoardSaveFailure(){},stampSharedRecord:value=>value,
    closeForm(){closed=true;},closeTodoForm(){closed=true;},closeAddressBookForm(){closed=true;},render(){},renderArchive(){},renderTodoBoard(){},renderAddressBook(){},updateAccountSuggestions(){},updateSalesRepSuggestions(){},updateVendorControls(){},updateTimelineSearchSuggestions(){},
    activeContactFilter:'all',peopleContactKey:person=>person.id||[person.name,person.organization].join('::'),attachContactValueSuggestions(){},renderContactExtraField:()=>'',renderPeopleContacts(){},applyContactNameCorrections(){},escapeAttribute:value=>String(value||''),escapeHtml:value=>String(value||'')});
  c.window.foodBrokerContactDirectory={normalizeContact:person=>({...person,groups:person.groups||[],extraFields:person.extraFields||[]}),isSchool:()=>false,schoolName:person=>person.schoolName||''};
  const contactValues={name:'Persistence QA contact',organization:'Test company',role:'Buyer',email:'person@example.invalid',phone:'907-555-0103',category:'Distributor',groups:'Test group, North',notes:'Saved contact notes',schoolName:'',location:'Anchorage',address:'Test address',website:'https://example.invalid'};
  const contactForm={values:contactValues};
  const body={innerHTML:'',querySelector:selector=>selector==='form'?contactForm:selector==='[data-contact-error]'?error:{addEventListener(){}},querySelectorAll:()=>[{querySelector:selector=>({value:selector==='[data-extra-label]'?'Territory':'North'})}]};
  const dialog={querySelector:()=>body,showModal(){},close(){closed=true;}};
  c.createVisitDialog=()=>dialog;
  c.FormData=class {constructor(form){this.form=form;}[Symbol.iterator](){return Object.entries(this.form.values)[Symbol.iterator]();}};
  const part=(source,name)=>{const start=source.indexOf('function '+name+'('),end=source.indexOf('\nfunction ',start+1);return source.slice(start,end<0?undefined:end);};
  const contacts=fs.readFileSync(path.join(__dirname,'../people-contacts.js'),'utf8');
  for(const name of ['persist','saveCard','buildLeadNoteHistoryForSave','saveTodo','saveAddressBookEntry','archiveAddressBookEntry','restoreAddressBookEntry','restoreCard','restoreTodo']) vm.runInContext(part(app,name),c);
  for(const name of ['contactCommunicationFields','persistPeopleContacts','openPeopleContactForm','deletePeopleContact'])vm.runInContext(part(contacts,name),c);
  // Load shared form/transaction helpers only if the production source defines them.
  for(const [source,names] of [[app,['showEntrySaveError','clearEntrySaveError','commitAddressBook']],[contacts,['commitPeopleContacts','restorePeopleContact']]])
    for(const name of names)if(source.includes('function '+name+'('))vm.runInContext(part(source,name),c);
  if(kind==='contact') {c.openPeopleContactForm(c.peopleContacts.find(item=>item.id===id)||{});submit=()=>contactForm.onsubmit({currentTarget:contactForm,preventDefault(){}});}
  else submit=()=>c[{lead:'saveCard',task:'saveTodo',operator:'saveAddressBookEntry'}[kind]]();
  return {save:submit,error,closed:()=>closed,form,contactValues};
}

for(const [kind,key,collection] of entryKinds)test(`${kind}: the actual entry form retains all saved fields through offline close and two reopenings`,async()=>{
  const {app,db}=await fixture(),c=app.context,form=entryEditors(c,kind);
  db.offline(true);form.save();assert.equal(form.closed(),true);
  const saved=clone(c[collection].find(item=>!item.id.endsWith('-record')));assert.ok(saved);
  assert.ok(c.taskOutbox.list('owner',key).length);const reopened=app.reopen();
  assert.deepEqual(clone(reopened.context.getCloudConfig(key).get().find(item=>item.id===saved.id)),saved);
  assert.equal(await reopened.context.pushPendingCloudSections(),false);
  db.offline(false);db.rows.get(key).data.value.push({id:'other-window',name:'Remote addition'});db.rows.get(key).updated_at='other-window-version';
  await reopened.context.loadCloudSections();const fresh=reopened.reopen();await fresh.context.loadCloudSections();
  assert.deepEqual(clone(fresh.context.getCloudConfig(key).get().find(item=>item.id===saved.id)),saved);
  assert.ok(fresh.context.getCloudConfig(key).get().some(item=>item.id==='other-window'));
  assert.equal(fresh.context.taskOutbox.list('owner',key).length,0);
});

for(const [kind,key,collection] of entryKinds)for(const edit of [false,true])test(`${kind} ${edit?'edit':'create'}: failed browser save keeps the original and retries once`,async()=>{
  const {app,local}=await fixture(),c=app.context,existing=c.getCloudConfig(key).get()[0],form=entryEditors(c,kind,edit?existing.id:'');
  const before=clone(c[collection]),stored=local.getItem(key),write=local.setItem;
  local.setItem=(name,value)=>{if(name===key){const error=Error('Storage full');error.name='QuotaExceededError';throw error;}write(name,value);};
  assert.doesNotThrow(()=>form.save());assert.equal(form.closed(),false);assert.deepEqual(clone(c[collection]),before);
  assert.match(form.error.textContent,/Could not save/);
  assert.equal(local.getItem(key),stored);assert.equal(c.taskOutbox.list('owner',key).length,0);
  local.setItem=write;form.save();assert.equal(form.closed(),true);assert.equal(c[collection].length,before.length+(edit?0:1));
});

test('editing an archived operator retains its archive state and earlier audit details',async()=>{
  const {app}=await fixture(),c=app.context,key='addressBookStorageKey';
  app.edit(key,values=>values.map(item=>({...item,archivedAt:'2026-11-05T12:00:00Z',_activity:[{id:'earlier',at:'2026-11-05T12:00:00Z',action:'Created'}]})));
  const id=c.addressBook[0].id;entryEditors(c,'operator',id).save();
  assert.equal(c.addressBook[0].archivedAt,'2026-11-05T12:00:00Z');assert.equal(c.addressBook[0]._activity[0].id,'earlier');
});

for(const [kind,key,collection] of entryKinds)test(`${kind}: a failed restore keeps the saved archive state`,async()=>{
  const {app,local}=await fixture(),c=app.context;app.edit(key,values=>values.map(item=>({...item,archivedAt:'2026-11-06T19:00:00Z'})));
  const id=c[collection][0].id;entryEditors(c,kind,id);const before=clone(c[collection]),stored=local.getItem(key),write=local.setItem;
  local.setItem=(name,value)=>{if(name===key)throw Error('Storage unavailable');write(name,value);};
  const action={lead:'restoreCard',task:'restoreTodo',contact:'restorePeopleContact',operator:'restoreAddressBookEntry'}[kind];
  assert.doesNotThrow(()=>c[action](id));assert.deepEqual(clone(c[collection]),before);assert.equal(local.getItem(key),stored);
});

for(const [kind,key] of entryKinds)test(`${kind}: confirmed completion/archive survives an older window replacing browser cache`,async()=>{
  const {app,local}=await fixture(),c=app.context,stale=local.getItem(key);
  app.edit(key,values=>values.map(item=>({...item,status:'Done',archivedAt:'2026-11-06T19:00:00Z',myDay:'2026-11-06',notes:'Keep saved notes'})));
  const expected=clone(c.getCloudConfig(key).get());assert.equal(await c.pushPendingCloudSections(),true);
  local.setItem(key,stale);local.setItem('pending',JSON.stringify([key]));const fresh=app.reopen();await fresh.context.loadCloudSections();
  assert.deepEqual(clone(fresh.context.getCloudConfig(key).get()),expected);
});

for(const kind of ['lead','task'])test(`${kind}: a failed linked-operator save retains both collections and the form`,async()=>{
  const {app,local}=await fixture(),c=app.context,form=entryEditors(c,kind),before=clone(c.addressBook),leads=clone(c.cards),tasks=clone(c.todos),write=local.setItem;
  c.getMarketOperatorOptions=()=>c.addressBook;c.shouldSyncOperatorName=()=>true;c.normalizeOperatorKey=value=>String(value||'').toLowerCase();
  c.normalizeAuditRecord=value=>value||null;c.normalizeActivityHistory=value=>value||[];
  vm.runInContext(cut('function normalizeAddressBookEntry(', 'function normalizeStockProduct(')+'\n'+cut('function syncOperatorToAddressBook(', 'function isMarketOperatorAlreadyAttached('),c);
  local.setItem=(name,value)=>{if(name==='addressBookStorageKey')throw Error('Storage unavailable');write(name,value);};
  assert.doesNotThrow(()=>form.save());assert.equal(form.closed(),false);assert.deepEqual(clone(c.addressBook),before);assert.deepEqual(clone(c.cards),leads);assert.deepEqual(clone(c.todos),tasks);assert.match(form.error.textContent,/Could not save/);
});

for(const [kind,key,collection] of entryKinds.filter(([kind])=>['contact','operator'].includes(kind)))test(`${kind}: a failed archive keeps the visible record and can be retried`,async()=>{
  const {app,local}=await fixture(),c=app.context;entryEditors(c,kind);const before=clone(c[collection]),id=before[0].id,write=local.setItem;
  c.confirm=()=>true;c.getPeopleDirectory=()=>c.peopleContacts;c.peopleContactDisplayName=person=>person.name||'Test person';
  local.setItem=(name,value)=>{if(name===key)throw Error('Storage unavailable');write(name,value);};
  const action=kind==='contact'?'deletePeopleContact':'archiveAddressBookEntry';
  assert.doesNotThrow(()=>c[action](id));assert.deepEqual(clone(c[collection]),before);
  local.setItem=write;c[action](id);assert.ok(c[collection][0].archivedAt);assert.ok(c.taskOutbox.list('owner',key).length);
});
