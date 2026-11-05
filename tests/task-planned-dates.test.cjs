const test = require('node:test');
const assert = require('node:assert/strict');
const {range} = require('../task-date-parser');

test('Today and Tomorrow use the Alaska date even after UTC midnight', () => {
  const now = new Date('2026-11-06T03:00:00Z');
  assert.deepEqual(range('today', now), {start:'2026-11-05',end:'2026-11-05'});
  assert.deepEqual(range('tomorrow', now), {start:'2026-11-06',end:'2026-11-06'});
});
test('This week includes today through Sunday, without earlier overdue tasks', () => {
  assert.deepEqual(range('week', new Date('2026-11-05T20:00:00Z')), {start:'2026-11-05',end:'2026-11-08'});
});
test('Next week is the complete following Monday through Sunday', () => {
  assert.deepEqual(range('nextWeek', new Date('2026-11-05T20:00:00Z')), {start:'2026-11-09',end:'2026-11-15'});
});
test('week ranges honor the calendar setting to start on Sunday', () => {
  const now = new Date('2026-11-05T20:00:00Z');
  assert.deepEqual(range('week', now, true), {start:'2026-11-05',end:'2026-11-07'});
  assert.deepEqual(range('nextWeek', now, true), {start:'2026-11-08',end:'2026-11-14'});
});
test('week changes remain correct on Sunday and across Alaska daylight saving time', () => {
  const now = new Date('2026-11-01T10:30:00Z');
  assert.deepEqual(range('week', now), {start:'2026-11-01',end:'2026-11-01'});
  assert.deepEqual(range('nextWeek', now), {start:'2026-11-02',end:'2026-11-08'});
  assert.deepEqual(range('week', now, true), {start:'2026-11-01',end:'2026-11-07'});
});
test('Tomorrow and Next week cross month and year boundaries correctly', () => {
  const now = new Date('2026-12-31T22:00:00Z');
  assert.deepEqual(range('tomorrow', now), {start:'2027-01-01',end:'2027-01-01'});
  assert.deepEqual(range('week', now), {start:'2026-12-31',end:'2027-01-03'});
  assert.deepEqual(range('nextWeek', now), {start:'2027-01-04',end:'2027-01-10'});
  assert.deepEqual(range('nextWeek', new Date('2027-01-31T22:00:00Z')), {start:'2027-02-01',end:'2027-02-07'});
});
test('All planned leaves due dates unrestricted', () => {
  assert.equal(range('all'), null);
});
