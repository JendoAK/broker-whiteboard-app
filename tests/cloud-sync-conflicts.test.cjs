const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const sync = require('../cloud-work-sync.js');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const saveSource = source.slice(source.indexOf('function sampleSyncUserValid('), source.indexOf('function mergeCloudSectionValues('));
const batchSource = source.slice(source.indexOf('async function performCloudSaveSections('), source.indexOf('async function fetchCloudRowSummary('));

function setup(key = 'contacts', response = {error: {code: 'PT409', message: 'Stale version'}, status: 409}) {
  let items = [{id: 'local-entry', product: 'Unsynced browser edit', note: 'Keep this'}];
  const values = new Map(), storage = {get length() {return values.size;}, key: index => [...values.keys()][index],
    getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key)};
  const outbox = sync.createOutbox(storage);
  if (key !== 'samples') outbox.keep('test-user', key, [], items);
  const bases = new Map([[key, 'revision-a']]);
  let calls = 0;
  const section = {key, scope: 'team', label: key, get: () => items, set: value => {items = value;}};
  const context = {
    user: {id: 'test-user'},
    console: {warn() {}},
    sampleCloudSectionKeys: new Set(['samples']),
    directoryCloudSectionKeys: new Set(['contacts', 'samples']),
    sampleCloudSnapshots: new Map([['samples', {data: {value: structuredClone(items)}, version: 'revision-a'}]]),
    cloudSectionRevisions: new Map([[key, 0]]),
    pendingCloudSections: new Set([key]),
    cloudSectionConfigs: [section],
    sharedTrackerKeys: new Set(),
    trackerMigrationOwners: new Map(),
    cloudSaveRequests: 0,
    cloudWriteEpoch: 0,
    workCloudSectionKeys: new Set(),
    todoStorageKey: 'tasks', taskOutbox: outbox, workCloudBases: sync.createBases(storage),
    peopleContactsStorageKey: 'people', addressBookStorageKey: 'contacts',
    normalizePeopleContact: value => value, normalizeAddressBookEntry: value => value,
    writeLocalSection() {}, async writeCachedLocalSection() {}, renderAfterCloudSync() {},
    failedLocalSections: new Set(),
    cloudSaveTimer: null,
    cloudSaveConfirmed: false,
    cloudSyncReady: true,
    lastCloudError: '',
    cloudRecordType: 'app_section',
    teamCloudRecordType: 'team_section',
    backupVersion: 1,
    dotOrderStorageKey: 'dot',
    normalizeSample: value => value,
    normalizeDotOrder: value => value,
    correctContactNames: value => value,
    updateRecordedInitials: value => value,
    updateSaveStatus() {},
    storePendingCloudSections() {},
    getDirectoryCloudWriteBases: () => bases,
    rememberDirectoryCloudWriteBase: (key, version) => {bases.set(key, version); return true;},
    getCloudConfig: () => section,
    window: {
      foodBrokerWorkSync: sync,
      foodBrokerBaseAuth: {getCurrentProfile: () => ({role: 'member'}), isPasswordRecovery: () => false},
      foodBrokerSampleSyncRecovery: {mergeKnown: item => item, clearSection() {}},
      foodBrokerSaveStatus: {recordError() {}},
      clearTimeout() {},
      setTimeout() {return 1;}
    }
  };
  const client = {
    from: () => {const query = {select: () => query, eq: () => query,
      maybeSingle: async () => ({data: {data: {value: [], directoryRevision: 'revision-a'}}, error: null})}; return query;},
    rpc: async (...args) => {calls++; return typeof response === 'function' ? response(context, ...args) : response;}
  };
  context.getCloudUser = () => context.user;
  context.getCloudClient = () => client;
  context.expandCloudSectionKeys = keys => keys;
  vm.createContext(context);
  vm.runInContext(saveSource + '\n' + batchSource, context);
  const payload = {record_key: key, data: {value: items}};
  return {context, client, bases, get items() {return items;}, payload, calls: () => calls};
}

test('repeated HTTP 409 conflicts preserve the directory edits and retry against a fresh version', async () => {
  const s = setup();
  const before = JSON.stringify(s.items);
  await assert.rejects(s.context.saveDirectoryCloudPayload(s.client, s.context.user, s.payload, 0), error => {
    assert.match(error.message, /recorded edits are kept/);
    return true;
  });
  assert.equal(JSON.stringify(s.items), before);
  assert.equal(s.bases.get('contacts'), 'revision-a');
  assert.equal(s.calls(), 3);
  assert.equal(s.context.taskOutbox.list('test-user', 'contacts').length, 1);
});

for (const code of ['PT409', '40001']) {
  test(`${code} invalidates a stale sample snapshot without discarding browser edits`, async () => {
    const s = setup('samples', {error: {code, message: 'Stale version'}, status: 409});
    const before = JSON.stringify(s.items);
    await assert.rejects(s.context.saveDirectoryCloudPayload(s.client, s.context.user, s.payload, 0), error => error.name === 'DirectorySyncConflictError');
    assert.equal(s.context.sampleCloudSnapshots.has('samples'), false);
    assert.equal(s.bases.get('samples'), 'revision-a');
    assert.equal(JSON.stringify(s.items), before);
  });
}

test('HTTP status alone identifies a conflict', () => {
  const s = setup();
  assert.equal(s.context.isCloudSyncConflict({code: 'UNKNOWN'}, 409), true);
  assert.equal(s.context.isCloudSyncConflict({code: '42501'}, 403), false);
});

test('permission failures keep the sample snapshot and remain permission failures', async () => {
  const s = setup('samples', {error: {code: '42501', message: 'Access denied'}, status: 403});
  await assert.rejects(s.context.saveDirectoryCloudPayload(s.client, s.context.user, s.payload, 0), error => error.code === '42501' && error.name !== 'DirectorySyncConflictError');
  assert.equal(s.context.sampleCloudSnapshots.has('samples'), true);
});

test('a failed cloud batch retains the durable retry queue and browser entries', async () => {
  const s = setup();
  const before = JSON.stringify(s.items);
  assert.equal(await s.context.performCloudSaveSections(['contacts'], {}), false);
  assert.equal(s.context.pendingCloudSections.has('contacts'), true);
  assert.equal(s.context.cloudSaveConfirmed, false);
  assert.equal(s.context.cloudSaveRequests, 0);
  assert.equal(JSON.stringify(s.items), before);
  assert.equal(s.bases.get('contacts'), 'revision-a');
});

test('a confirmed cloud save records the new revision and clears only saved work', async () => {
  const s = setup('contacts', {data: {updatedAt: 'revision-b'}, error: null, status: 200});
  assert.equal(await s.context.performCloudSaveSections(['contacts'], {}), true);
  assert.equal(s.bases.get('contacts'), 'revision-b');
  assert.equal(s.context.pendingCloudSections.size, 0);
  assert.equal(s.context.cloudSaveConfirmed, true);
});

test('edits made during a successful save remain pending for the next save', async () => {
  const s = setup('contacts', context => {
    context.cloudSectionRevisions.set('contacts', 1);
    return {data: {updatedAt: 'revision-b'}, error: null, status: 200};
  });
  assert.equal(await s.context.performCloudSaveSections(['contacts'], {}), true);
  assert.equal(s.context.pendingCloudSections.has('contacts'), true);
  assert.equal(s.bases.get('contacts'), 'revision-b');
});

test('Product Support recognizes PT409 even without English conflict keywords', () => {
  const source = fs.readFileSync(path.join(root, 'support-samples.js'), 'utf8');
  let shown = '';
  const context = {state: {editing: {}}, text: String, details() {}, status: value => {shown = value;}};
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('  function failure('), source.indexOf('  function applySaved(')), context);
  context.failure({code: 'PT409', message: 'Version A'}, 'psSampleFormStatus');
  assert.match(shown, /sample changed/);
  assert.match(shown, /entries are still here/);
});
