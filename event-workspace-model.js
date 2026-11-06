/* Calendar-day calculations shared by the event cards and their filters. */
(() => {
  'use strict';
  const valid = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && Number.isFinite(Date.parse(value + 'T12:00:00Z')) && new Date(value + 'T12:00:00Z').toISOString().slice(0, 10) === value;
  const date = value => new Date(value + 'T12:00:00Z');
  const key = value => value.toISOString().slice(0, 10);
  function offset(value, days) {const result = date(value); result.setUTCDate(result.getUTCDate() + days); return key(result);}
  function range(period, today, sundayStart = false) {
    if (period === 'all') return null;
    if (period === 'today') return {start: today, end: today};
    if (period === 'tomorrow') return {start: offset(today, 1), end: offset(today, 1)};
    const start = offset(today, -(date(today).getUTCDay() + (sundayStart ? 0 : 6)) % 7);
    if (period === 'week') return {start, end: offset(start, 6)};
    if (period === 'nextWeek') return {start: offset(start, 7), end: offset(start, 13)};
    return null;
  }
  function matches(visit, period, today, sundayStart = false) {
    const dates = range(period, today, sundayStart);
    if (!dates) return true;
    if (!valid(visit.startDate)) return false;
    return visit.startDate <= dates.end && (valid(visit.endDate) ? visit.endDate : visit.startDate) >= dates.start;
  }
  const format = (value, options) => date(value).toLocaleDateString('en-US', {...options, timeZone: 'UTC'});
  function minutes(value) {
    const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return 0;
    let hour = Number(match[1]);
    if (match[3]) hour = hour % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0);
    return hour * 60 + Number(match[2]);
  }
  function nextCall(calls, today, nowMinutes = 0) {
    return calls.filter(call => valid(call.date) && call.date >= today && !['Canceled', 'Completed'].includes(call.status)
      && (call.date > today || minutes(call.endTime || call.startTime) >= nowMinutes))
      .sort((a, b) => a.date.localeCompare(b.date) || minutes(a.startTime) - minutes(b.startTime))[0];
  }
  function label(start, end) {
    const first = format(start, {month: 'short', day: 'numeric'});
    return first + '–' + (start.slice(0, 7) === end.slice(0, 7) ? Number(end.slice(8)) : format(end, {month: 'short', day: 'numeric'}));
  }
  function tile(visit, today) {
    const start = visit.startDate, end = valid(visit.endDate) && visit.endDate >= start ? visit.endDate : start;
    if (!valid(start)) return {weekday: 'DATE', month: 'TO BE', days: 'Set', year: 'confirmed'};
    const different = start !== end, crossMonth = start.slice(0, 7) !== end.slice(0, 7), crossYear = start.slice(0, 4) !== end.slice(0, 4);
    return {
      weekday: format(start, {weekday: 'short'}) + (different ? '–' + format(end, {weekday: 'short'}) : ''),
      month: format(start, {month: 'short'}) + (crossMonth ? '–' + format(end, {month: 'short'}) : ''),
      days: String(Number(start.slice(8))) + (different ? '–' + Number(end.slice(8)) : ''),
      year: crossYear ? start.slice(0, 4) + '–' + end.slice(2, 4) : start.slice(0, 4) !== today.slice(0, 4) ? start.slice(0, 4) : ''
    };
  }
  function groups(visits, today, mode = 'schedule', types = {}, sundayStart = false) {
    const next = range('nextWeek', today, sundayStart), following = {start: offset(next.start, 7), end: offset(next.end, 7)};
    const labels = ['In progress', 'Today', 'Tomorrow', 'This week', 'Next week · ' + label(next.start, next.end),
      'Following week · ' + label(following.start, following.end), 'Later', 'Date to be confirmed', 'Past events'];
    const output = new Map(mode === 'schedule' ? labels.map(title => [title, []]) : []);
    const month = today.slice(0, 7), nextMonth = offset(today.slice(0, 7) + '-28', 4).slice(0, 7);
    for (const visit of visits) {
      const start = visit.startDate, end = valid(visit.endDate) ? visit.endDate : start;
      let title = 'By date';
      if (mode === 'type') title = types[visit.type] || 'Events & visits';
      else if (mode === 'month') title = !valid(start) ? 'Date to be confirmed' : end < today ? 'Past events' : start < today ? 'In progress'
        : start.slice(0, 7) === month ? 'This month' : start.slice(0, 7) === nextMonth ? 'Next month' : 'Later';
      else if (mode === 'schedule') title = !valid(start) ? labels[7] : end < today ? labels[8] : start < today ? labels[0]
        : start === today ? labels[1] : start === offset(today, 1) ? labels[2] : start < next.start ? labels[3]
          : start <= next.end ? labels[4] : start <= following.end ? labels[5] : labels[6];
      if (!output.has(title)) output.set(title, []);
      output.get(title).push(visit);
    }
    return [...output].filter(([, items]) => items.length).map(([title, items]) => ({title, items}));
  }
  const api = {valid, offset, range, matches, label, tile, groups, minutes, nextCall};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else window.foodBrokerEventLayout = api;
})();
