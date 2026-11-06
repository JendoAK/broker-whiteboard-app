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
    cut('function writeCloudSectionsToLocalStorage(', 'function renderAfterCloudSync('),
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
