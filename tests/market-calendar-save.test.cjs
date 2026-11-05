const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const sync = require('../cloud-work-sync.js');
const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
function part(name) {
  const start = app.indexOf('function ' + name + '(');
  return app.slice(start, app.indexOf('\nfunction ', start + 1));
}
function setup() {
  const vendorKey = 'visits-vendor', personalKey = 'visits-personal';
  const previous = [{id: 'visit', type: 'manufacturer', name: 'Vendor visit', startDate: '2026-11-09', endDate: '2026-11-12', calls: [], operatorLinks: []}];
  const stored = new Map([['visits', JSON.stringify(previous)]]), queued = [], errors = [];
  let fail = true, closed = false;
  const errorMessage = {hidden: true, textContent: ''};
  const form = {values: {operatorName: 'Three Bears', date: '2026-11-10', startTime: '09:00', endTime: '10:00', salesReps: '', notes: 'Keep these details'},
    elements: {namedItem: () => ({min: '2026-11-09', max: '2026-11-12'})},
    querySelector: () => errorMessage, closest: () => ({close() {closed = true;}})};
  const context = {
    console, marketVisits: JSON.parse(JSON.stringify(previous)), marketVisitStorageKey: 'visits', todoStorageKey: 'tasks', cloudSaveConfirmed: true, failedLocalSections: new Set(),
    vendorMarketVisitCloudKey: vendorKey, personalMarketVisitCloudKey: personalKey,
    normalizeMarketVisit: value => JSON.parse(JSON.stringify(value)), normalizeMarketCall: value => ({id: 'new-call', ...value}),
    normalizeMarketOperatorLink: value => ({id: 'new-link', ...value}), normalizeStringList: value => value ? value.split(',') : [],
    stampSharedRecord: value => {value._audit = {name: 'Test author', action: 'Updated'};},
    formatTimeOption: (hour, minute) => `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`,
    findOrCreateMarketOperator: name => ({operatorId: 'operator', operatorName: name}),
    isMarketOperatorAlreadyAttached: () => false, getMarketVisitProducts: () => [],
    recordWorkUpdateTimes() {}, renderMarketVisits() {},
    localStorage: {getItem: key => stored.get(key) || null, setItem(key, value) {
      if (fail) { const error = new Error('Storage full'); error.name = 'QuotaExceededError'; throw error; }
      stored.set(key, value);
    }},
    getCloudConfigsForKey: () => [
      {key: vendorKey, get: () => context.marketVisits.filter(visit => visit.type === 'manufacturer')},
      {key: personalKey, get: () => context.marketVisits.filter(visit => visit.type === 'personal')}
    ],
    scheduleCloudSave: key => queued.push(key),
    FormData: class {constructor(form) {this.form = form;} [Symbol.iterator]() {return Object.entries(this.form.values)[Symbol.iterator]();}},
    window: {foodBrokerWorkSync: sync, foodBrokerSaveStatus: {recordError: error => {if (!errors.includes(error)) errors.push(error);}}}
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, 'market-call-editor.js'), 'utf8') + '\n' + part('writeLocalSection') + '\n' + part('persistMarketVisits') + '\n' + part('updateMarketVisit'), context);
  vm.runInContext('marketCallEditContext = {visitId: "visit", callId: "", newKind: "call", values: {}};', context);
  return {context, form, stored, queued, errors, message: errorMessage, closed: () => closed, allowWrites: () => {fail = false;}};
}

test('an appointment remains editable when local storage fails, and the calendar is rolled back', () => {
  const s = setup();
  s.context.saveMarketCallEdit({currentTarget: s.form, preventDefault() {}});
  assert.equal(s.closed(), false);
  assert.equal(s.message.hidden, false);
  assert.match(s.message.textContent, /details are still here/);
  assert.equal(s.form.values.operatorName, 'Three Bears');
  assert.equal(s.context.marketVisits[0].calls.length, 0);
  assert.equal(JSON.parse(s.stored.get('visits'))[0].calls.length, 0);
  assert.equal(s.queued.length, 0);
  assert.equal(s.errors.length, 1);
  assert.equal(s.context.cloudSaveConfirmed, false);
  assert.equal(s.context.failedLocalSections.has('visits'), true);
});

test('retrying the unchanged form saves exactly one call and queues only the changed visit section', () => {
  const s = setup();
  const event = {currentTarget: s.form, preventDefault() {}};
  s.context.saveMarketCallEdit(event);
  s.allowWrites();
  s.context.saveMarketCallEdit(event);
  assert.equal(s.closed(), true);
  const calls = JSON.parse(s.stored.get('visits'))[0].calls;
  assert.equal(calls.length, 1);
  assert.equal(calls[0].operatorName, 'Three Bears');
  assert.equal(calls[0].notes, 'Keep these details');
  assert.equal(calls[0].startTime, '9:00 AM');
  assert.deepEqual(s.queued, ['visits-vendor']);
  assert.equal(s.context.failedLocalSections.size, 0);
});

test('an invalid date does not modify or queue the calendar', () => {
  const s = setup();
  s.allowWrites(); s.form.values.date = '2026-11-20';
  s.context.saveMarketCallEdit({currentTarget: s.form, preventDefault() {}});
  assert.equal(s.closed(), false);
  assert.match(s.message.textContent, /within the visit dates/);
  assert.equal(s.context.marketVisits[0].calls.length, 0);
  assert.equal(s.queued.length, 0);
});
