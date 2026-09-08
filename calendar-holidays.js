"use strict";

function normalizeCalendarPreferences(value) {
  return Array.isArray(value) ? value.filter((item) => item && item.id === "holidays").map((item) => ({
    id: "holidays", ownerId: String(item.ownerId || ""), enabled: item.enabled === true, updatedAt: item.updatedAt || ""
  })) : [];
}

function loadCalendarPreferences() {
  try { return normalizeCalendarPreferences(JSON.parse(localStorage.getItem(calendarPreferencesKey) || "[]")); }
  catch { return []; }
}

function getCurrentCalendarPreferences() {
  return calendarPreferences.filter((item) => item.ownerId === (getCloudUser()?.id || ""));
}

function setCurrentCalendarPreferences(value) {
  const ownerId = getCloudUser()?.id || "";
  calendarPreferences = [...calendarPreferences.filter((item) => item.ownerId !== ownerId),
    ...normalizeCalendarPreferences(value).map((item) => ({ ...item, ownerId }))];
}

function persistCalendarPreferences() {
  localStorage.setItem(calendarPreferencesKey, JSON.stringify(calendarPreferences));
  scheduleCloudSave(calendarPreferencesKey);
}

function showCalendarHolidays() {
  return getCurrentCalendarPreferences().some((item) => item.enabled);
}

function setupCalendarHolidayToggle() {
  document.querySelector("#showCalendarHolidays").addEventListener("change", (event) => {
    setCurrentCalendarPreferences([{ id: "holidays", enabled: event.target.checked, updatedAt: new Date().toISOString() }]);
    persistCalendarPreferences();
    renderCalendar();
  });
}

// Nationwide federal holidays and standard Mon–Fri observed dates:
// https://www.opm.gov/policy-data-oversight/pay-leave/federal-holidays/
// Actual dates remain visible; a separate observed label is added for weekends.
function getUsFederalHolidays(year) {
  const holidays = [];
  const key = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const add = (date, title, fixed = false) => {
    holidays.push({ date: key(date), title });
    if (fixed && [0, 6].includes(date.getDay())) {
      const observed = new Date(date);
      observed.setDate(date.getDate() + (date.getDay() === 6 ? -1 : 1));
      holidays.push({ date: key(observed), title: `${title} (observed)` });
    }
  };
  const nth = (y, month, weekday, n) => new Date(y, month, 1 + (weekday - new Date(y, month, 1).getDay() + 7) % 7 + 7 * (n - 1));
  // Include adjacent years so observed New Year's Day can fall in December.
  for (const y of [year - 1, year, year + 1]) {
    add(new Date(y, 0, 1), "New Year's Day", true);
    if (y >= 1986) add(nth(y, 0, 1, 3), "Martin Luther King Jr. Day");
    add(nth(y, 1, 1, 3), "Washington's Birthday");
    const memorial = new Date(y, 4, 31);
    memorial.setDate(31 - (memorial.getDay() + 6) % 7);
    add(memorial, "Memorial Day");
    if (y >= 2021) add(new Date(y, 5, 19), "Juneteenth", true);
    add(new Date(y, 6, 4), "Independence Day", true);
    add(nth(y, 8, 1, 1), "Labor Day");
    add(nth(y, 9, 1, 2), "Columbus Day");
    add(new Date(y, 10, 11), "Veterans Day", true);
    add(nth(y, 10, 4, 4), "Thanksgiving Day");
    add(new Date(y, 11, 25), "Christmas Day", true);
  }
  return holidays.filter((holiday) => holiday.date.startsWith(`${year}-`)).sort((a, b) => a.date.localeCompare(b.date));
}

const calendarHolidayYearCache = new Map();
function getCalendarHolidays(dateKey) {
  if (!showCalendarHolidays()) return [];
  const year = Number(dateKey.slice(0, 4));
  if (!calendarHolidayYearCache.has(year)) calendarHolidayYearCache.set(year, getUsFederalHolidays(year));
  return calendarHolidayYearCache.get(year).filter((holiday) => holiday.date === dateKey);
}

function renderCalendarHoliday(holiday) {
  return `<div class="calendar-holiday"><strong>${escapeHtml(holiday.title)}</strong></div>`;
}
