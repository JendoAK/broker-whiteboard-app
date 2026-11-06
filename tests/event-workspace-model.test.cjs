const test = require('node:test'), assert = require('node:assert/strict');
const model = require('../event-workspace-model.js');
const dates = require('../task-date-parser.js');
const visit = (startDate, endDate = startDate, extra = {}) => ({id: startDate, startDate, endDate, ...extra});
test('This week includes the containing calendar week and Next week is the complete following week', () => {
  assert.deepEqual(model.range('week','2026-11-06'),{start:'2026-11-02',end:'2026-11-08'});
  assert.deepEqual(model.range('nextWeek','2026-11-06'),{start:'2026-11-09',end:'2026-11-15'});
});
test('date chips use the Alaska calendar day across UTC midnight', () => {
  const today = dates.today(new Date('2026-11-07T01:00:00Z'));
  assert.equal(today,'2026-11-06');
  assert.equal(model.matches(visit('2026-11-06'),'today',today),true);
  assert.equal(model.matches(visit('2026-11-07'),'today',today),false);
});
test('multi-day visits overlap date filters even when they started before the selected range', () => {
  assert.equal(model.matches(visit('2026-11-04','2026-11-12'),'nextWeek','2026-11-06'),true);
  assert.equal(model.matches(visit('2026-11-04','2026-11-08'),'nextWeek','2026-11-06'),false);
  assert.equal(model.matches(visit('2026-11-04','2026-11-07'),'tomorrow','2026-11-06'),true);
});
test('a Sunday-start calendar and daylight-saving changes retain the correct full weeks', () => {
  assert.deepEqual(model.range('week','2026-11-01',true),{start:'2026-11-01',end:'2026-11-07'});
  assert.deepEqual(model.range('nextWeek','2026-11-01',true),{start:'2026-11-08',end:'2026-11-14'});
  assert.deepEqual(model.range('nextWeek','2026-11-01'),{start:'2026-11-02',end:'2026-11-08'});
});
test('week filters and headings cross the year without dropping an event', () => {
  assert.deepEqual(model.range('nextWeek','2026-12-27'),{start:'2026-12-28',end:'2027-01-03'});
  const grouped=model.groups([visit('2026-12-30','2027-01-02')],'2026-12-27');
  assert.equal(grouped[0].title,'Next week · Dec 28–Jan 3'); assert.equal(grouped[0].items.length,1);
});
test('date groups retain every event once while separating ongoing, upcoming, undated and past events', () => {
  const values=[visit('2026-11-04','2026-11-07'),visit('2026-11-06'),visit('2026-11-07'),visit('2026-11-08'),visit('2026-11-09'),visit('2026-11-18'),visit('2027-01-28'),visit(''),visit('2026-10-30')];
  const groups=model.groups(values,'2026-11-06');
  assert.deepEqual(groups.map(group=>group.title),['In progress','Today','Tomorrow','This week','Next week · Nov 9–15','Following week · Nov 16–22','Later','Date to be confirmed','Past events']);
  assert.equal(groups.flatMap(group=>group.items).length,values.length); assert.equal(new Set(groups.flatMap(group=>group.items.map(item=>item.id))).size,values.length);
});
test('past and undated dates are handled deliberately instead of being silently hidden', () => {
  assert.equal(model.matches(visit(''),'all','2026-11-06'),true);
  assert.equal(model.matches(visit(''),'today','2026-11-06'),false);
  assert.equal(model.valid('2026-02-31'),false); assert.equal(model.valid('2026-02-28'),true);
});
test('date tiles retain multi-day, cross-month and cross-year information', () => {
  assert.deepEqual(model.tile(visit('2026-11-09','2026-11-12'),'2026-11-06'),{weekday:'Mon–Thu',month:'Nov',days:'9–12',year:''});
  assert.deepEqual(model.tile(visit('2026-12-30','2027-01-02'),'2026-11-06'),{weekday:'Wed–Sat',month:'Dec–Jan',days:'30–2',year:'2026–27'});
  assert.equal(model.tile(visit('2027-01-28'),'2026-11-06').year,'2027');
});
test('the existing month, type and date grouping choices remain available', () => {
  const values=[visit('2026-11-09',undefined,{type:'manufacturer'}),visit('2026-12-09',undefined,{type:'foodshow'})];
  assert.deepEqual(model.groups(values,'2026-11-06','month').map(group=>group.title),['This month','Next month']);
  assert.deepEqual(model.groups(values,'2026-11-06','type',{manufacturer:'Market visit',foodshow:'Foodshow'}).map(group=>group.title),['Market visit','Foodshow']);
  assert.equal(model.groups(values,'2026-11-06','date')[0].items.length,2);
});
test('next appointment sorts AM and PM times numerically and excludes canceled or completed calls', () => {
  const calls=[{id:'afternoon',date:'2026-11-09',startTime:'1:00 PM'},{id:'morning',date:'2026-11-09',startTime:'9:00 AM'},{id:'canceled',date:'2026-11-08',startTime:'8:00 AM',status:'Canceled'}];
  assert.equal(model.nextCall(calls,'2026-11-06').id,'morning');
  assert.equal(model.minutes('12:00 AM'),0); assert.equal(model.minutes('12:00 PM'),720);
});
test('an ongoing appointment remains visible, while finished appointments today are skipped', () => {
  const calls=[{id:'finished',date:'2026-11-06',startTime:'8:00 AM',endTime:'9:00 AM'},{id:'ongoing',date:'2026-11-06',startTime:'9:00 AM',endTime:'11:00 AM'},{id:'tomorrow',date:'2026-11-07',startTime:'8:00 AM'}];
  assert.equal(model.nextCall(calls,'2026-11-06',600).id,'ongoing');
  assert.equal(model.nextCall(calls,'2026-11-06',720).id,'tomorrow');
});
