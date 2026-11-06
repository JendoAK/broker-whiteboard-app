const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const sync = require('../cloud-work-sync.js');
const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
const key = 'tasks', owner = 'test-owner', queueKey = 'foodBrokerBasePendingCloudSections';
const initial = [{id: 'one', title: 'Persistence fixture', notes: 'Original note', status: 'New', myDay: '', subtasks: []}];
const changed = {notes: 'Keep this note after reopening', status: 'In Progress', myDay: '2026-11-05'};
function storage() {
  const values = new Map();
  return {get length() {return values.size;}, key: index => [...values.keys()][index] || null,
    getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key)};
}
function database() {
  let version = 1, value = clone(initial), offline = false, hook, loseResponse = false;
  const current = () => ({scope: 'personal', record_type: 'app_section', record_key: key,
    owner_id: owner, updated_at: 'v' + version, data: {value: clone(value)}});
  class Query {
    constructor() {this.operation = 'read'; this.filters = [];}
    select() {return this;} limit() {return this;}
    eq(key, value) {this.filters.push([key, value]); return this;}
    update(payload) {this.operation = 'update'; this.payload = payload; return this;}
    insert(payload) {this.operation = 'insert'; this.payload = payload; return this;}
    async execute() {
      if (offline) throw new Error('Offline fixture');
      if (this.operation === 'read') return {data: [current()], error: null};
      if (hook) await hook(this);
      if (this.operation === 'insert') return {error: {code: '23505'}};
      if (this.filters.find(([key]) => key === 'updated_at')?.[1] !== 'v' + version) return {data: [], error: null};
      value = clone(this.payload.data.value); version++;
      if (loseResponse) {loseResponse = false; throw new Error('Save response lost');}
      return {data: [current()], error: null};
    }
    then(resolve, reject) {return this.execute().then(resolve, reject);}
  }
  return {client: {from: () => new Query()}, current, read: async () => {if (offline) throw new Error('Offline fixture'); return [current()];},
    offline: value => {offline = value;}, hook: value => {hook = value;},
    loseResponse: () => {loseResponse = true;},
    remoteEdit: edit => {value = value.map(task => ({...task, ...edit})); version++;}};
}
const slice = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
function open(localStorage, db) {
  const context = {
    console: {warn() {}, error() {}}, localStorage, user: {id: owner},
    todos: JSON.parse(localStorage.getItem(key) || JSON.stringify(initial)),
    todoStorageKey: key, storageKey: 'leads', stockStorageKey: 'stock', manualVendorStorageKey: 'reports',
    eventProductStorageKey: 'products', nestleMachineStorageKey: 'machines', calendarPreferencesKey: 'preferences', personalVisitCalendarKey: 'calendar',
    peopleContactsStorageKey: 'people', addressBookStorageKey: 'contacts', legacyRecoveryCopies: new Map(),
    cloudPendingStorageKey: queueKey, pendingCloudSections: new Set(), cloudSectionRevisions: new Map(),
    cloudSaveChain: Promise.resolve(), cloudWriteEpoch: 0, cloudSaveRequests: 0, cloudSaveConfirmed: false, cloudSaveTimer: null,
    cloudSyncReady: true, cloudSyncLoading: false, cloudSyncUserId: owner, cloudRefreshChecking: false,
    failedLocalSections: new Set(), workCloudSectionKeys: new Set([key]), directoryCloudSectionKeys: new Set(), sampleCloudSectionKeys: new Set(),
    sharedTrackerKeys: new Set(), trackerMigrationOwners: new Map(), cloudRecordType: 'app_section', teamCloudRecordType: 'team_section', backupVersion: 1,
    cloudRowCache: new Map(), cloudLastRowFingerprint: '', lastCloudError: '',
    workCloudBases: sync.createBases(localStorage),
    getCloudUser: () => context.user, getCloudClient: () => db.client,
    isAppEditing: () => false, sampleSyncUserValid: () => true,
    correctContactNames: value => value, updateRecordedInitials: value => value,
    normalizeTodo: value => clone(value), recordWorkUpdateTimes() {}, updateSaveStatus() {}, alert() {},
    syncSavedTeamInitials: async () => {}, correctPeteTeamRecords: async () => {},
    fetchCloudRowSummary: db.read, downloadChangedCloudRows: async () => db.read(),
    getCloudSectionValue: (section, rows) => ({found: rows.has(section.key), value: rows.get(section.key)?.data.value}),
    getDirectoryCloudWriteBases: () => new Map(), renderAfterCloudSync() {}, hasLocalAppData: () => !!context.todos.length,
    cloudRowCacheKey: row => row.record_key, getCloudRowFingerprint: rows => rows.map(row => row.updated_at).join(','),
    expandCloudSectionKeys: keys => keys || [key],
    window: {foodBrokerWorkSync: sync, foodBrokerSaveStatus: {localSaved() {}, recordError() {}, recoverSections() {}, cloudSaved() {}},
      clearTimeout() {}, setTimeout() {return 1;}}
  };
  const section = {key, label: 'Tasks', scope: 'personal', get: () => context.todos, set: value => {context.todos = clone(value);}};
  context.cloudSectionConfigs = [section]; context.localCloudCacheConfigs = [section];
  context.getCloudConfigsForKey = sectionKey => sectionKey === key ? [section] : [];
  context.getCloudConfig = sectionKey => sectionKey === key ? section : null;
  context.getLocalCloudCacheConfig = context.getCloudConfig;
  if (sync.createOutbox) context.taskOutbox = sync.createOutbox(localStorage);
  context.sectionJournal = sync.createJournal(context.taskOutbox, [section]);
  context.todoSavedSnapshot = clone(context.todos);
  vm.createContext(context);
  vm.runInContext([
    slice('function writeLocalSection(', 'function persist()'),
    slice('function persistTodos(', 'function persistManualVendorReports('),
    slice('function readPendingCloudSections(', 'function extractCloudValue('),
    slice('async function writeCloudSectionsToLocalStorage(', 'function renderAfterCloudSync('),
    slice('function scheduleCloudSave(', 'async function fetchCloudRowSummary('),
    slice('async function loadCloudSections(', 'function handleCloudAuthChange(')
  ].join('\n'), context);
  context.pendingCloudSections = context.readPendingCloudSections();
  return {context, value: () => clone(context.todos), edit(fields) {
    context.todos = context.todos.map(task => ({...task, ...fields}));
    assert.equal(context.persistTodos(), true);
  }, reopen: () => open(localStorage, db)};
}
async function fixture() {
  const local = storage(), db = database(), app = open(local, db);
  await app.context.loadCloudSections();
  return {local, db, app};
}
function assertChanged(value) {for (const [key, field] of Object.entries(changed)) assert.equal(value[0][key], field, key);}

test('notes, status and My Day survive a refresh before the cloud debounce fires', async () => {
  const {app, db} = await fixture(); app.edit(changed);
  const refreshed = app.reopen(); assertChanged(refreshed.value());
  await refreshed.context.loadCloudSections(); assertChanged(refreshed.value()); assertChanged(db.current().data.value);
});
test('a confirmed upload survives a completely new session', async () => {
  const {app, db} = await fixture(); app.edit(changed); assert.equal(await app.context.pushPendingCloudSections(), true);
  const reopened = app.reopen(); await reopened.context.loadCloudSections();
  assertChanged(reopened.value()); assertChanged(db.current().data.value);
});
test('offline edits survive close/reopen and synchronize after reconnecting', async () => {
  const {app, db} = await fixture(); db.offline(true); app.edit(changed);
  assert.equal(await app.context.pushPendingCloudSections(), false);
  const reopened = app.reopen(); await reopened.context.loadCloudSections(); assertChanged(reopened.value());
  db.offline(false); await reopened.context.loadCloudSections();
  assertChanged(reopened.value()); assertChanged(db.current().data.value);
});
test('a newer edit survives closing while the previous save is waiting', async () => {
  const {app, db} = await fixture(); let release;
  const gate = new Promise(resolve => {release = resolve;}); db.hook(() => gate);
  app.edit({notes: 'Earlier note'}); const saving = app.context.pushPendingCloudSections();
  await new Promise(setImmediate); app.edit(changed); release(); await saving; db.hook(null);
  const reopened = app.reopen(); await reopened.context.loadCloudSections();
  assertChanged(reopened.value()); assertChanged(db.current().data.value);
});
test('another window replacing the global retry list cannot discard unsynced task fields', async () => {
  const {app, local, db} = await fixture(), olderWindow = app.reopen();
  app.edit(changed);
  olderWindow.context.pendingCloudSections = new Set(['leads']); olderWindow.context.storePendingCloudSections();
  assert.deepEqual(JSON.parse(local.getItem(queueKey)), ['leads']);
  const reopened = app.reopen(); await reopened.context.loadCloudSections();
  assertChanged(reopened.value()); assertChanged(db.current().data.value);
});
test('two windows editing different task fields retain both after both windows close', async () => {
  const {app, db} = await fixture(), second = app.reopen(); await second.context.loadCloudSections();
  app.edit({notes: changed.notes}); second.edit({status: changed.status, myDay: changed.myDay});
  const reopened = app.reopen(); await reopened.context.loadCloudSections();
  assertChanged(reopened.value()); assertChanged(db.current().data.value);
});
test('recovery keeps unrelated cloud changes and intentional clearing of task fields', async () => {
  const {app, db} = await fixture(); app.edit(changed); await app.context.pushPendingCloudSections();
  app.edit({notes: '', myDay: '', status: 'Waiting on Someone'}); db.remoteEdit({title: 'Updated remotely'});
  const reopened = app.reopen(); await reopened.context.loadCloudSections();
  const task = reopened.value()[0];
  assert.equal(task.notes, ''); assert.equal(task.myDay, ''); assert.equal(task.status, 'Waiting on Someone'); assert.equal(task.title, 'Updated remotely');
});
test('the last typed note survives a terminated session before autosave or beforeunload', async () => {
  const {app, db} = await fixture();
  let draft = app.context.retainTaskNoteDraft('one', 'Last keystroke', null);
  draft = app.context.retainTaskNoteDraft('one', 'Last keystroke, including more text', draft);
  assert.equal(app.value()[0].notes, initial[0].notes);
  db.offline(true); const reopened = app.reopen(); await reopened.context.loadCloudSections();
  assert.equal(reopened.value()[0].notes, 'Last keystroke, including more text');
  db.offline(false); await reopened.context.loadCloudSections();
  assert.equal(db.current().data.value[0].notes, 'Last keystroke, including more text');
  assert.equal(reopened.context.taskOutbox.list(owner, key).length, 0);
});
test('a newer note draft cannot be acknowledged by an older in-flight save', async () => {
  const {app, db} = await fixture(); let release;
  const gate = new Promise(resolve => {release = resolve;}); db.hook(() => gate);
  const draft = app.context.retainTaskNoteDraft('one', 'Earlier draft', null);
  const saving = app.context.pushPendingCloudSections(); await new Promise(setImmediate);
  app.context.retainTaskNoteDraft('one', 'Newest draft', draft); release(); await saving; db.hook(null);
  assert.equal(app.context.pendingCloudSections.has(key), true);
  const reopened = app.reopen(); await reopened.context.loadCloudSections();
  assert.equal(reopened.value()[0].notes, 'Newest draft'); assert.equal(db.current().data.value[0].notes, 'Newest draft');
});
test('acknowledged journal entries do not override later changes from another device', async () => {
  const {app, db} = await fixture(); app.edit(changed); await app.context.pushPendingCloudSections();
  assert.equal(app.context.taskOutbox.list(owner, key).length, 0);
  db.remoteEdit({notes: 'Later remote note', status: 'Done', myDay: ''});
  const reopened = app.reopen(); await reopened.context.loadCloudSections();
  assert.equal(reopened.value()[0].notes, 'Later remote note'); assert.equal(reopened.value()[0].status, 'Done'); assert.equal(reopened.value()[0].myDay, '');
});

test('a stale whole-browser cache cannot undo confirmed My Day, completion or archive after reopen', async () => {
  const {app, local, db} = await fixture();
  app.edit({...changed, status: 'Done', archivedAt: '2026-11-05T22:00:00Z'});
  assert.equal(await app.context.pushPendingCloudSections(), true);
  // An older open app can still replace shared browser storage, even though
  // its obsolete cloud writes are rejected by the server.
  local.setItem(key, JSON.stringify(initial));
  local.setItem(queueKey, JSON.stringify([key]));
  const reopened = app.reopen();
  await reopened.context.loadCloudSections();
  const task = db.current().data.value[0];
  assert.equal(task.myDay, changed.myDay);
  assert.equal(task.status, 'Done');
  assert.equal(task.archivedAt, '2026-11-05T22:00:00Z');
  assert.equal(task.notes, changed.notes);
});

test('a contacts conflict does not requeue an already confirmed task save', async () => {
  const {app, db} = await fixture();
  const context = app.context, originalGet = context.getCloudConfig;
  const contacts = {key: 'contacts', label: 'Contacts', scope: 'team', get: () => [], set() {}};
  context.cloudSectionConfigs.push(contacts);
  context.getCloudConfig = sectionKey => sectionKey === 'contacts' ? contacts : originalGet(sectionKey);
  context.directoryCloudSectionKeys.add('contacts');
  context.pendingCloudSections.add('contacts');
  context.saveDirectoryCloudPayload = async () => {throw {code: 'PT409', status: 409, message: 'Stale directory fixture'};};
  app.edit(changed);
  assert.equal(await context.pushPendingCloudSections(), false);
  assertChanged(db.current().data.value);
  assert.equal(context.taskOutbox.list(owner, key).length, 0);
  assert.equal(context.pendingCloudSections.has(key), false);
  assert.equal(context.pendingCloudSections.has('contacts'), true);
});
test('a lost response after the server accepted a save recovers without losing or duplicating tasks', async () => {
  const {app, db} = await fixture(); app.edit(changed); db.loseResponse();
  assert.equal(await app.context.pushPendingCloudSections(), false);
  assertChanged(db.current().data.value);
  const reopened = app.reopen(); await reopened.context.loadCloudSections();
  assertChanged(reopened.value()); assert.equal(reopened.value().length, 1);
  assert.equal(reopened.context.taskOutbox.list(owner, key).length, 0);
});
test('an aborted local sync-base commit keeps the task edit available for retry', async () => {
  const {app, db} = await fixture(); app.edit(changed);
  app.context.workCloudBases.remember = async () => {throw new Error('Browser transaction aborted');};
  assert.equal(await app.context.pushPendingCloudSections(), false);
  assert.equal(app.context.taskOutbox.list(owner, key).length, 1);
  const reopened = app.reopen(); await reopened.context.loadCloudSections();
  assertChanged(reopened.value()); assertChanged(db.current().data.value);
});
test('recovering a typed note changes only notes when another device changes status', async () => {
  const {app, db} = await fixture();
  const draft = app.context.retainTaskNoteDraft('one', 'New draft', null);
  db.remoteEdit({status: 'In Progress', myDay: '2026-11-05'});
  app.context.retainTaskNoteDraft('one', 'New draft continued', draft);
  const reopened = app.reopen(); await reopened.context.loadCloudSections();
  assert.equal(reopened.value()[0].notes, 'New draft continued'); assert.equal(reopened.value()[0].status, 'In Progress'); assert.equal(reopened.value()[0].myDay, '2026-11-05');
});
test('task recovery records are private to their owner and section', () => {
  const local = storage(), outbox = sync.createOutbox(local);
  outbox.keep(owner, key, initial, [{...initial[0], ...changed}]);
  assert.equal(outbox.list('other-owner', key).length, 0);
  assert.equal(outbox.list(owner, 'other-section').length, 0);
});
test('a journal storage failure does not falsely confirm the task save', async () => {
  const {app, local} = await fixture(); const previous = local.getItem(key), setItem = local.setItem;
  local.setItem = (key, value) => {if (key.startsWith('broker-whiteboard-work-outbox:')) throw new Error('Storage full'); setItem(key, value);};
  app.context.todos = app.context.todos.map(task => ({...task, ...changed}));
  assert.equal(app.context.persistTodos(), false); assert.equal(local.getItem(key), previous);
  assert.equal(app.context.cloudSaveConfirmed, false);
});
test('pending edits from the previous app version survive an edit during the first download', async () => {
  const {app, local, db} = await fixture();
  // The previous release had a browser copy and a retry marker, without an outbox.
  app.context.workCloudBases.remember(owner, key, {version: db.current().updated_at, value: initial});
  local.removeItem(`broker-whiteboard-journal-upgrade-3:${owner}:${key}`);
  local.setItem(key, JSON.stringify([{...initial[0], notes: changed.notes, updatedAt: '2026-11-05T22:00:00Z'}])); local.setItem(queueKey, JSON.stringify([key]));
  const upgraded = app.reopen(); let release;
  upgraded.context.fetchCloudRowSummary = () => new Promise(resolve => {release = () => resolve([db.current()]);});
  const loading = upgraded.context.loadCloudSections(); await new Promise(setImmediate);
  upgraded.edit({status: changed.status, myDay: changed.myDay}); release(); await loading;
  assertChanged(upgraded.value()); assertChanged(db.current().data.value);
});
