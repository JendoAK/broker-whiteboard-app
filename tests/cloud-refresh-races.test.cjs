const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const sync = require('../cloud-work-sync.js');

const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const saveSource = source.slice(source.indexOf('function scheduleCloudSave('), source.indexOf('async function fetchCloudRowSummary('));
const loadSource = source.slice(source.indexOf('async function loadCloudSections('), source.indexOf('function handleCloudAuthChange('));
const refreshSource = source.slice(source.indexOf('async function refreshCloudSectionsIfChanged('), source.indexOf('function startCloudAutoRefresh('));
function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}
function setup() {
  const download = deferred(), write = deferred();
  const key = 'tasks';
  const oldItems = [{id: 'existing', title: 'Existing task'}];
  let items = [...oldItems, {id: 'new', title: 'Keep this task'}];
  let writes = 0, downloads = 0;
  const section = {key, label: 'Tasks', scope: 'personal', get: () => items, set: value => { items = value; }};
  const rows = [{scope: 'personal', record_key: key, updated_at: 'old', data: {value: oldItems}}];
  const context = {
    console: {warn() {}}, user: {id: 'test-user'},
    cloudSectionConfigs: [section], cloudSectionRevisions: new Map([[key, 1]]),
    cloudSaveChain: Promise.resolve(), cloudWriteEpoch: 0, failedLocalSections: new Set(),
    pendingCloudSections: new Set([key]), cloudSaveRequests: 0,
    cloudSaveConfirmed: false, cloudSaveTimer: null,
    cloudSyncReady: true, cloudSyncLoading: false, cloudSyncUserId: 'test-user', cloudRefreshChecking: false,
    cloudRowCache: new Map(), cloudLastRowFingerprint: 'old', lastCloudError: '',
    cloudRecordType: 'app_section', teamCloudRecordType: 'team_section', backupVersion: 1,
    directoryCloudSectionKeys: new Set(), sampleCloudSectionKeys: new Set(),
    workCloudSectionKeys: new Set(), sharedTrackerKeys: new Set(), trackerMigrationOwners: new Map(),
    correctContactNames: value => value, updateRecordedInitials: value => value,
    expandCloudSectionKeys: keys => keys || [key], getCloudConfig: () => section,
    getDirectoryCloudWriteBases: () => new Map(),
    getCloudUser: () => context.user,
    getCloudClient: () => ({from: () => ({upsert: async () => {writes++; return await write.promise;}})}),
    isAppEditing: () => false, sampleSyncUserValid: () => true,
    updateSaveStatus() {}, storePendingCloudSections() {},
    syncSavedTeamInitials: async () => {}, correctPeteTeamRecords: async () => {},
    fetchCloudRowSummary: async () => rows,
    downloadChangedCloudRows: async () => {downloads++; return await download.promise;},
    getCloudSectionValue: () => ({found: true, value: oldItems}),
    writeCloudSectionsToLocalStorage() {}, renderAfterCloudSync() {}, hasLocalAppData: () => true,
    cloudRowCacheKey: row => row.record_key, getCloudRowFingerprint: () => 'old',
    mergeCloudSectionValues: (local, remote) => [...new Map([...remote, ...local].map(item => [item.id, item])).values()],
    todoStorageKey: key, normalizeTodo: value => value,
    storageKey: 'leads', stockStorageKey: 'stock', manualVendorStorageKey: 'reports', eventProductStorageKey: 'products', nestleMachineStorageKey: 'machines',
    workCloudBases: sync.createBases({getItem: () => null, setItem() {}}),
    taskOutbox: {list: () => [], keep() {}, acknowledge() {}}, recoverPendingTaskEdits() {},
    window: {foodBrokerWorkSync: sync, foodBrokerSaveStatus: {localSaved() {}, recordError() {}}, clearTimeout() {}, setTimeout() {return 1;}}
  };
  vm.createContext(context);
  vm.runInContext(saveSource + '\n' + loadSource + '\n' + refreshSource, context);
  return {context, rows, download, write, items: () => items, downloads: () => downloads, writes: () => writes};
}

test('a refresh cannot replace a task whose save was already in flight', async () => {
  const s = setup();
  const saving = s.context.performCloudSaveSections(['tasks'], {});
  const refreshing = s.context.loadCloudSections();
  await new Promise(setImmediate);
  s.write.resolve({error: null, status: 200});
  assert.equal(await saving, true);
  s.download.resolve(s.rows);
  await refreshing;
  assert.equal(s.items().some(item => item.id === 'new'), true);
  assert.equal(s.context.cloudSyncReady, true);
});

test('a refresh started earlier is discarded if a forced save finishes during its download', async () => {
  const s = setup();
  const refreshing = s.context.loadCloudSections();
  await new Promise(setImmediate);
  assert.equal(s.downloads(), 1);
  const saving = s.context.performCloudSaveSections(['tasks'], {force: true});
  s.write.resolve({error: null, status: 200});
  assert.equal(await saving, true);
  s.download.resolve(s.rows);
  await refreshing;
  assert.equal(s.items().some(item => item.id === 'new'), true);
  assert.equal(s.context.cloudLastRowFingerprint, 'old');
});

test('edits made while a save is in flight remain queued for another save', async () => {
  const s = setup();
  const saving = s.context.performCloudSaveSections(['tasks'], {});
  s.context.scheduleCloudSave('tasks');
  s.write.resolve({error: null, status: 200});
  assert.equal(await saving, true);
  assert.equal(s.context.pendingCloudSections.has('tasks'), true);
  assert.equal(s.context.cloudSaveConfirmed, false);
});

test('a row summary fetched before a save cannot reuse an obsolete cached collection', async () => {
  const s = setup(), summary = deferred();
  s.context.fetchCloudRowSummary = () => summary.promise;
  const refreshing = s.context.refreshCloudSectionsIfChanged();
  const saving = s.context.performCloudSaveSections(['tasks'], {});
  s.write.resolve({error: null, status: 200});
  await saving;
  summary.resolve(s.rows);
  assert.equal(await refreshing, false);
  assert.equal(s.downloads(), 0);
  assert.equal(s.items().some(item => item.id === 'new'), true);
});

test('a pending task deletion survives a cloud refresh and keeps other devices additions', async () => {
  const s = setup();
  s.context.workCloudSectionKeys.add('tasks');
  s.context.workCloudBases.remember('test-user', 'tasks', {version: 'before', value: [{id: 'deleted'}, {id: 'existing', title: 'Existing task'}]});
  const remote = [{id: 'deleted'}, ...s.rows[0].data.value, {id: 'remote', title: 'Other device'}];
  s.context.getCloudSectionValue = () => ({found: true, value: remote});
  let uploaded;
  s.context.saveWorkCloudPayload = async (client, user, payload) => { uploaded = payload.data.value; };
  const refreshing = s.context.loadCloudSections();
  s.download.resolve(s.rows);
  assert.equal(await refreshing, true);
  assert.equal(uploaded.some(item => item.id === 'deleted'), false);
  assert.equal(uploaded.some(item => item.id === 'remote'), true);
  assert.equal(uploaded.some(item => item.id === 'new'), true);
});

test('a failed upload during refresh keeps the error visible and the retry queue intact', async () => {
  const s = setup();
  s.context.saveCloudSections = async () => {s.context.lastCloudError = 'Network unavailable'; return false;};
  const refreshing = s.context.loadCloudSections();
  s.download.resolve(s.rows);
  await refreshing;
  assert.equal(s.context.lastCloudError, 'Network unavailable');
  assert.equal(s.context.pendingCloudSections.has('tasks'), true);
  assert.equal(s.context.cloudSaveConfirmed, false);
  assert.equal(s.context.cloudSyncReady, true);
});

test('a refresh preserves an in-memory entry whose local write failed', async () => {
  const s = setup();
  s.context.failedLocalSections.add('tasks');
  s.context.pendingCloudSections.clear();
  s.context.cloudSaveConfirmed = false;
  const refreshing = s.context.loadCloudSections();
  s.download.resolve(s.rows);
  await refreshing;
  assert.equal(s.items().some(item => item.id === 'new'), true);
  assert.equal(s.context.cloudSaveConfirmed, false);
});

test('a retry-queue storage failure remains visible instead of being marked saved', () => {
  const s = setup();
  s.context.cloudPendingStorageKey = 'pending';
  s.context.localStorage = {setItem() {throw new Error('Storage full');}};
  const start = source.indexOf('function storePendingCloudSections(');
  vm.runInContext(source.slice(start, source.indexOf('function extractCloudValue(', start)), s.context);
  s.context.scheduleCloudSave('tasks');
  assert.match(s.context.lastCloudError, /retry queue.*Storage full/);
  assert.equal(s.context.pendingCloudSections.has('tasks'), true);
  assert.equal(s.context.cloudSaveConfirmed, false);
});
