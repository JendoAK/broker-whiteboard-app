const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const sync = require('../cloud-work-sync.js');
const clone = value => JSON.parse(JSON.stringify(value));
const task = (id, extra = {}) => ({id, title: id, completed: false, ...extra});
const visit = calls => [{id: 'visit', name: 'Market visit', calls, operatorLinks: []}];
const call = (id, extra = {}) => ({id, operatorName: id, date: '2026-11-10', startTime: '9:00 AM', endTime: '10:00 AM', ...extra});

function database(value, hook) {
  let sequence = 1, attempts = 0;
  let row = value === null ? null : {record_key: 'work', data: {value: clone(value)}, updated_at: 'v1'};
  class Query {
    constructor() { this.operation = 'read'; this.filters = []; }
    select() { return this; }
    limit() { return this; }
    eq(key, value) { this.filters.push([key, value]); return this; }
    update(payload) { this.operation = 'update'; this.payload = payload; return this; }
    insert(payload) { this.operation = 'insert'; this.payload = payload; return this; }
    async execute() {
      if (this.operation === 'read') return {data: row ? [clone(row)] : [], error: null};
      attempts++;
      const response = hook?.({query: this, attempts, row: clone(row), set: value => {row = value;}});
      if (response) return response;
      if (this.operation === 'insert' && row) return {error: {code: '23505', message: 'Already exists'}};
      const expected = this.filters.find(([key]) => key === 'updated_at')?.[1];
      if (this.operation === 'update' && (!row || row.updated_at !== expected)) return {data: [], error: null};
      row = {...row, ...clone(this.payload), record_key: 'work', updated_at: 'v' + (++sequence)};
      return {data: [clone(row)], error: null};
    }
    then(resolve, reject) { return this.execute().then(resolve, reject); }
  }
  return {client: {from: () => new Query()}, current: () => clone(row), attempts: () => attempts};
}
function options(local, base) {
  return {table: 'team_app_records', userId: 'test-user', payload: {record_type: 'team_section', record_key: 'work', data: {value: local}},
    local, base, normalize: value => value || [], isCurrent: () => true};
}

test('simultaneous additions to the same visit retain both calendar calls', () => {
  const base = visit([call('existing')]);
  const merged = sync.merge(base, visit([...base[0].calls, call('Three Bears')]), visit([...base[0].calls, call('Another call')]));
  assert.deepEqual(new Set(merged[0].calls.map(item => item.id)), new Set(['existing', 'Three Bears', 'Another call']));
  assert.equal(base[0].calls.length, 1);
});

test('a changed appointment time is retained along with a remote call addition', () => {
  const base = visit([call('existing')]);
  const local = visit([call('existing', {startTime: '11:00 AM', endTime: '12:00 PM'})]);
  const remote = visit([...base[0].calls, call('new')]);
  const merged = sync.merge(base, local, remote);
  assert.equal(merged[0].calls.find(item => item.id === 'existing').startTime, '11:00 AM');
  assert.equal(merged[0].calls.some(item => item.id === 'new'), true);
});

test('adding a task does not overwrite another device completing an existing task', () => {
  const base = [task('existing')];
  const result = sync.merge(base, [...base, task('new')], [task('existing', {completed: true})]);
  assert.equal(result.find(item => item.id === 'existing').completed, true);
  assert.equal(result.some(item => item.id === 'new'), true);
});

test('intentional task and calendar deletions are not resurrected by a refresh', () => {
  assert.deepEqual(sync.merge([task('delete'), task('keep')], [task('keep')], [task('delete'), task('keep'), task('remote')]), [task('keep'), task('remote')]);
  const base = visit([call('delete'), call('keep')]);
  const result = sync.merge(base, visit([call('keep')]), visit([...base[0].calls, call('remote')]));
  assert.deepEqual(result[0].calls.map(item => item.id), ['keep', 'remote']);
});

test('a browser without a known base conservatively retains remote calls', () => {
  const result = sync.merge(undefined, visit([call('local')]), visit([call('remote')]));
  assert.deepEqual(new Set(result[0].calls.map(item => item.id)), new Set(['local', 'remote']));
});

test('audit stamps stay together while activity from both devices is retained', () => {
  const base = [{id: 'item', _audit: {name: 'A', initials: 'AA'}, _activity: [{id: 'old', at: '1'}]}];
  const local = [{id: 'item', _audit: {name: 'B', initials: 'BB'}, _activity: [...base[0]._activity, {id: 'local', at: '2'}]}];
  const remote = [{id: 'item', _audit: {name: 'C', initials: 'CC'}, _activity: [...base[0]._activity, {id: 'remote', at: '3'}]}];
  const merged = sync.merge(base, local, remote)[0];
  assert.deepEqual(merged._audit, local[0]._audit);
  assert.equal(merged._activity.length, 3);
});

test('two versioned saves from the same starting copy retain both new calls after reload', async () => {
  const base = visit([call('existing')]), db = database(base);
  const snapshot = {version: 'v1', value: clone(base)};
  await Promise.all([
    sync.save(db.client, options(visit([...base[0].calls, call('Three Bears')]), snapshot)),
    sync.save(db.client, options(visit([...base[0].calls, call('Another call')]), snapshot))
  ]);
  const reloaded = clone(db.current().data.value);
  assert.deepEqual(new Set(reloaded[0].calls.map(item => item.id)), new Set(['existing', 'Three Bears', 'Another call']));
  assert.equal(db.attempts(), 3);
});

test('a simultaneous first insert is merged instead of replacing the other browser task', async () => {
  const db = database(null), base = {version: null, value: []};
  await Promise.all([sync.save(db.client, options([task('one')], base)), sync.save(db.client, options([task('two')], base))]);
  assert.deepEqual(new Set(db.current().data.value.map(item => item.id)), new Set(['one', 'two']));
});

test('a successful HTTP response with zero affected rows never confirms the save', async () => {
  const base = [task('old')], db = database(base, () => ({data: [], error: null, status: 200}));
  await assert.rejects(sync.save(db.client, options([...base, task('new')], {version: 'v1', value: base})), /kept in this browser/);
  assert.equal(db.attempts(), 3);
  assert.deepEqual(db.current().data.value, base);
});

test('permission and network errors preserve the original cloud copy', async () => {
  for (const code of ['42501', 'NETWORK']) {
    const base = [task('old')], db = database(base, () => ({error: {code, message: 'Cannot save'}}));
    await assert.rejects(sync.save(db.client, options([...base, task('new')], {version: 'v1', value: base})), error => error.code === code);
    assert.deepEqual(db.current().data.value, base);
    assert.equal(db.attempts(), 1);
  }
});

test('a response missing part of the submitted data is not acknowledged', async () => {
  const db = database([], () => ({data: [{updated_at: 'v2', data: {value: []}}], error: null}));
  await assert.rejects(sync.save(db.client, options([task('new')], {version: 'v1', value: []})), /complete save/);
});

test('an account change stops the write', async () => {
  const db = database([]), config = options([task('new')]);
  config.isCurrent = () => false;
  await assert.rejects(sync.save(db.client, config), /account changed/);
  assert.equal(db.attempts(), 0);
});

test('every save declares its supported format and the exact cloud version it replaces', async () => {
  const base = [task('existing')], seen = [];
  const db = database(base, ({query, row}) => {
    seen.push(query.payload.data);
    if (query.payload.data.syncProtocol !== 2) return {error: {code: 'PT426', message: 'Update FoodBrokerBase'}};
    assert.equal(query.payload.data.syncWriteBase, row.updated_at);
  });
  const focused = [{...base[0], myDay: '2026-11-05'}];
  const saved = await sync.save(db.client, options(focused, {version: 'v1', value: base}));
  assert.equal(saved.value[0].myDay, '2026-11-05');
  assert.equal(seen.length, 1);
});

test('an outdated-format rejection keeps the confirmed tasks intact', async () => {
  const focused = [{...task('existing'), myDay: '2026-11-05'}];
  const db = database(focused, () => ({error: {code: 'PT426', message: 'Update FoodBrokerBase to finish syncing'}}));
  await assert.rejects(sync.save(db.client, options([task('existing')], {version: 'v1', value: focused})), error => error.code === 'PT426');
  assert.deepEqual(db.current().data.value, focused);
});

test('known bases survive a restart and keep deletions distinct from new remote tasks', () => {
  const data = new Map(), storage = {getItem: key => data.get(key), setItem: (key, value) => data.set(key, value)};
  const base = {version: 'v1', value: [task('delete'), task('keep')]};
  sync.createBases(storage).remember('user', 'tasks', base);
  base.value[0].title = 'Mutated after save';
  const restored = sync.createBases(storage).get('user', 'tasks');
  assert.equal(restored.value[0].title, 'delete');
  assert.deepEqual(sync.merge(restored.value, [task('keep')], [...restored.value, task('remote')]), [task('keep'), task('remote')]);
});

function fakeIndexedDB() {
  const data = new Map();
  let finish, fail = false;
  const db = {createObjectStore() {}, transaction() {
    const transaction = {objectStore: () => ({
      get(key) {const request = {}; queueMicrotask(() => {request.result = data.get(key); request.onsuccess(); transaction.oncomplete();}); return request;},
      put(value, key) {const request = {}; queueMicrotask(() => {
        request.onsuccess();
        finish = () => {if (fail) {transaction.error = new Error('Disk unavailable'); transaction.onabort();}
          else {data.set(key, clone(value)); transaction.oncomplete();}};
      }); return request;}
    })}; return transaction;
  }};
  return {open() {const request = {}; queueMicrotask(() => {request.result = db; request.onupgradeneeded(); request.onsuccess();}); return request;},
    commit: () => finish(), failNext: () => {fail = true;}};
}

test('sync bases are confirmed only after the browser database transaction completes', async () => {
  const indexedDB = fakeIndexedDB(), storage = {getItem: () => null, setItem() {throw new Error('Large bases must not use localStorage');}};
  const bases = sync.createIndexedBases(indexedDB, storage);
  let complete = false;
  const writing = bases.remember('user', 'stock', {version: 'v1', value: [{id: 'product', description: 'x'.repeat(100000)}]}).then(() => {complete = true;});
  await new Promise(setImmediate);
  assert.equal(complete, false);
  indexedDB.commit(); await writing;
  bases.clear();
  assert.equal((await bases.get('user', 'stock')).value[0].description.length, 100000);
  assert.equal(await bases.get('another-user', 'stock'), undefined);
});

test('an aborted browser database write leaves the last confirmed base intact', async () => {
  const indexedDB = fakeIndexedDB(), storage = {getItem: () => null, setItem() {}};
  const bases = sync.createIndexedBases(indexedDB, storage);
  let writing = bases.remember('user', 'leads', {version: 'v1', value: [task('saved')]});
  await new Promise(setImmediate); indexedDB.commit(); await writing;
  indexedDB.failNext();
  writing = bases.remember('user', 'leads', {version: 'v2', value: [task('unconfirmed')]});
  await new Promise(setImmediate); indexedDB.commit();
  await assert.rejects(writing, /Disk unavailable/);
  assert.equal((await bases.get('user', 'leads')).version, 'v1');
});

function configuredSections() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const start = source.indexOf('const cloudSectionConfigs = [');
  const end = source.indexOf('const localCloudCacheConfigs = [', start);
  const context = {workCloudSectionKeys: new Set(), marketVisitTypes: {testkitchen: 'Testkitchen', foodshow: 'Foodshow'},
    getCurrentCalendarPreferences() {}, setCurrentCalendarPreferences() {}, getCurrentPersonalVisitCalendar() {}, setCurrentPersonalVisitCalendar() {}};
  for (const name of ['peopleContactsStorageKey','calendarPreferencesKey','personalVisitCalendarKey','marketVisitStorageKey','eventProductStorageKey','storageKey','todoStorageKey','manualVendorStorageKey','addressBookStorageKey','stockStorageKey','sampleStorageKey','dotOrderStorageKey','nestleMachineStorageKey','personalMarketVisitCloudKey','legacyPcMarketVisitCloudKey','pcMarketVisitCloudKey','vendorMarketVisitCloudKey']) context[name] = name;
  context.directoryCloudSectionKeys = new Set(['peopleContactsStorageKey','addressBookStorageKey','sampleStorageKey','dotOrderStorageKey']);
  vm.createContext(context);
  vm.runInContext(source.slice(start, end) + '\nglobalThis.sections = cloudSectionConfigs;', context);
  return context;
}

test('every configured data section uses a versioned writer or the existing guarded directory/sample RPC', async () => {
  const context = configuredSections();
  assert.equal(context.sections.length, 16);
  assert.equal(context.workCloudSectionKeys.size, 12);
  for (const section of context.sections) {
    assert.equal(context.workCloudSectionKeys.has(section.key) || context.directoryCloudSectionKeys.has(section.key), true, section.label);
    if (!context.workCloudSectionKeys.has(section.key)) continue;
    const base = [task('existing')], remote = [task('existing', {completed: true}), task('remote')];
    const db = database(remote);
    const result = await sync.save(db.client, {...options([...base, task('new')], {version: 'old-version', value: base}),
      table: section.scope === 'team' ? 'team_app_records' : 'app_records'});
    assert.equal(result.value.some(item => item.id === 'new'), true, section.label);
    assert.equal(result.value.some(item => item.id === 'remote'), true, section.label);
    assert.equal(result.value.find(item => item.id === 'existing').completed, true, section.label);
    assert.deepEqual(db.current().data.value, result.value, section.label);
  }
});
