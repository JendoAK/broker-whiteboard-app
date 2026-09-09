"use strict";

function normalizePersonalVisitCalendar(value) {
  return Array.isArray(value) ? value.filter((item) => item && typeof item.id === "string").map((item) => ({
    id: item.id, title: String(item.title || "").trim().slice(0, 60), selected: item.selected !== false,
    ownerId: String(item.ownerId || ""), updatedAt: item.updatedAt || ""
  })) : [];
}

function loadPersonalVisitCalendar() {
  try { return normalizePersonalVisitCalendar(JSON.parse(localStorage.getItem(personalVisitCalendarKey) || "[]")); }
  catch { return []; }
}

function persistPersonalVisitCalendar() {
  localStorage.setItem(personalVisitCalendarKey, JSON.stringify(personalVisitCalendar));
  scheduleCloudSave(personalVisitCalendarKey);
}

function getCurrentPersonalVisitCalendar() {
  const ownerId = getCloudUser()?.id || "";
  return personalVisitCalendar.filter((item) => item.ownerId === ownerId);
}

function setCurrentPersonalVisitCalendar(value) {
  const ownerId = getCloudUser()?.id || "";
  personalVisitCalendar = [...personalVisitCalendar.filter((item) => item.ownerId !== ownerId),
    ...normalizePersonalVisitCalendar(value).map((item) => ({ ...item, ownerId }))];
}

function getPersonalVisitCalendarSelection(id) {
  return getCurrentPersonalVisitCalendar().find((item) => item.id === id && item.selected);
}

function getShortVisitCalendarTitle(visit) {
  return (getMarketVisitDisplayName(visit) || marketVisitTypes[visit.type])
    .replace(/US Foods/gi, "USF").trim().slice(0, 60);
}

function savePersonalVisitCalendarSelection(id, title, selected) {
  const ownerId = getCloudUser()?.id || "";
  const item = { id, ownerId, title: title.trim().slice(0, 60), selected, updatedAt: new Date().toISOString() };
  personalVisitCalendar = [...personalVisitCalendar.filter((entry) => entry.id !== id || entry.ownerId !== ownerId), item];
  persistPersonalVisitCalendar();
  renderMarketVisits();
  renderCalendar();
}

function renderPersonalVisitCalendarButton(visit) {
  const selected = Boolean(getPersonalVisitCalendarSelection(visit.id));
  return `<button class="edit-card market-card-action" type="button" data-personal-visit-calendar="${escapeAttribute(visit.id)}" aria-pressed="${selected}">${selected ? "Remove from my calendar" : "+ My calendar"}</button>`;
}

function bindPersonalVisitCalendarButtons(container) {
  container.querySelectorAll("[data-personal-visit-calendar]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    const visit = marketVisits.find((item) => item.id === button.dataset.personalVisitCalendar);
    if (!visit) return;
    const selected = getPersonalVisitCalendarSelection(visit.id);
    if (selected) { savePersonalVisitCalendarSelection(visit.id, selected.title, false); return; }
    if (!visit.startDate) { alert("Add a start date to this event or visit before adding it to your calendar."); return; }
    const dialog = document.querySelector("#personalVisitCalendarDialog");
    document.querySelector("#personalVisitCalendarId").value = visit.id;
    document.querySelector("#personalVisitCalendarTitle").value = getShortVisitCalendarTitle(visit);
    dialog.showModal();
    document.querySelector("#personalVisitCalendarTitle").select();
  }));
}

function getPersonalCalendarVisits(dateKey) {
  return marketVisits.filter((visit) => {
    if (visit.archivedAt || !getPersonalVisitCalendarSelection(visit.id) || !visit.startDate) return false;
    return dateKey >= visit.startDate && dateKey <= (visit.endDate || visit.startDate);
  }).map((visit) => ({ id: visit.id, title: getPersonalVisitCalendarSelection(visit.id).title || getShortVisitCalendarTitle(visit) }));
}

function renderPersonalCalendarVisit(item) {
  return `<button class="calendar-item visit-calendar-item" type="button" data-calendar-visit-id="${escapeAttribute(item.id)}"><strong>${escapeHtml(item.title)}</strong></button>`;
}

function bindPersonalCalendarVisitLinks(container) {
  container.querySelectorAll("[data-calendar-visit-id]").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    const visit = marketVisits.find((item) => item.id === button.dataset.calendarVisitId);
    if (!visit) return;
    closeCalendarDayWindow();
    closeCalendarWindow();
    activeMarketType = visit.type;
    elements.marketSearch.value = "";
    activeMarketView = "list";
    openMarketVisitsWindow();
    openMarketVisitDetail(visit.id);
  }));
}

function setupPersonalVisitCalendarForm() {
  const dialog = document.querySelector("#personalVisitCalendarDialog");
  document.querySelector("#personalVisitCalendarCancel").addEventListener("click", () => dialog.close());
  document.querySelector("#personalVisitCalendarForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const id = document.querySelector("#personalVisitCalendarId").value;
    const input = document.querySelector("#personalVisitCalendarTitle");
    const title = input.value.trim();
    if (!title) { input.focus(); return; }
    if (!marketVisits.some((visit) => visit.id === id && visit.startDate)) { dialog.close(); return; }
    savePersonalVisitCalendarSelection(id, title, true);
    dialog.close();
  });
}
