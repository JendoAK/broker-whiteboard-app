"use strict";

function marketWeekMinutes(value, fallback = 480) {
  const time = marketCallTimeInput(value);
  if (!time) return fallback;
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function positionMarketDayCalls(calls) {
  const positioned = calls.map(call => {
    const start = marketWeekMinutes(call.startTime);
    const end = Math.max(start + 1, marketWeekMinutes(call.endTime, start + 30));
    // Short appointments need a readable hit target, without shifting their start time.
    return { call, start, end, displayEnd: Math.max(end, start + 40) };
  }).sort((a, b) => a.start - b.start || a.end - b.end);
  let group = [], groupEnd = -1, lanes = [];
  const finishGroup = () => group.forEach(item => item.lanes = lanes.length);
  positioned.forEach(item => {
    if (item.start >= groupEnd) { finishGroup(); group = []; lanes = []; groupEnd = -1; }
    let lane = lanes.findIndex(end => end <= item.start);
    if (lane < 0) lane = lanes.length;
    lanes[lane] = item.displayEnd;
    item.lane = lane;
    group.push(item);
    groupEnd = Math.max(groupEnd, item.displayEnd);
  });
  finishGroup();
  return positioned;
}

function renderPreciseMarketWeek(visit, options = {}) {
  const weekStart = options.weekStart || startOfMarketVisitWorkWeek(visit);
  const days = Array.from({ length: options.dayCount || 5 }, (_, index) => {
    const date = new Date(weekStart); date.setDate(weekStart.getDate() + index); return date;
  });
  const dayCalls = days.map(date => positionMarketDayCalls(getMarketVisitCalendarCalls(visit).filter(call => call.date === toDateKey(date))));
  const all = dayCalls.flat();
  const start = Math.floor(Math.min(480, ...all.map(item => item.start)) / 60) * 60;
  const end = Math.min(1440, Math.ceil(Math.max(1080, ...all.map(item => item.displayEnd)) / 60) * 60);
  const pixelsPerMinute = options.print ? Math.min(52 / 60, 480 / (end - start)) : 52 / 60;
  const height = (end - start) * pixelsPerMinute;
  const hours = Array.from({ length: (end - start) / 60 }, (_, index) => start / 60 + index);
  return `<div class="precise-week-scroll"><div class="precise-week-grid" style="--week-height:${height}px;--hour-height:${pixelsPerMinute * 60}px;--day-count:${days.length}">
    <div class="precise-time-heading">Time</div>
    ${days.map((date, index) => `<div class="precise-day-heading ${isDateInMarketVisit(visit, date) ? "" : "week-day-outside"}"><strong>${escapeHtml(date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }))}</strong><span>${dayCalls[index].length} ${dayCalls[index].length === 1 ? "appointment" : "appointments"}</span></div>`).join("")}
    <div class="precise-time-axis">${hours.map(hour => `<span style="top:${(hour * 60 - start) * pixelsPerMinute}px">${formatHourLabel(hour)}</span>`).join("")}</div>
    ${days.map((date, index) => `<div class="precise-day ${isDateInMarketVisit(visit, date) ? "" : "precise-day-outside"}">${dayCalls[index].map(item => {
      const call = item.call;
      // Use the original appointment title, without the repeated visit name.
      const title = getMarketCallTitle(visit.calls.find(item => item.id === call.id) || call);
      const time = [call.startTime, call.endTime].filter(Boolean).join(" – ");
      const details = [title, call.date ? formatDate(call.date) : "", time,
        call.appointmentType, call.status,
        (call.location || visit.location) && `Location: ${call.location || visit.location}`,
        (call.salesReps?.length ? call.salesReps : visit.salesReps).length && `Attendees: ${(call.salesReps?.length ? call.salesReps : visit.salesReps).join(", ")}`,
        (call.manufacturerContact || visit.visitorName) && `Vendor contact: ${call.manufacturerContact || visit.visitorName}`,
        call.notes].filter(Boolean).join("\n");
      const top = (item.start - start) * pixelsPerMinute;
      const blockHeight = Math.min(Math.max(options.print ? Math.min(34, 40 * pixelsPerMinute) : 34, (item.end - item.start) * pixelsPerMinute), height - top);
      return `<button class="precise-week-call" type="button" data-week-call="${escapeAttribute(call.id)}" title="${escapeAttribute(details)}" aria-label="${escapeAttribute(`${details}\nClick to edit`)}" style="top:${top}px;height:${blockHeight}px;left:calc(${item.lane * 100 / item.lanes}% + 3px);width:calc(${100 / item.lanes}% - 6px)"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(time)}</span></button>`;
    }).join("")}</div>`).join("")}
  </div></div>`;
}
