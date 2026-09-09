"use strict";

let marketCallEditContext = null;

function marketCallTimeInput(value) {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return "";
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (match[3]) hour = hour % 12 + (match[3].toUpperCase() === "PM" ? 12 : 0);
  if (hour > 23 || minute > 59) return "";
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function marketCallTimeLabel(value) {
  if (!value) return "";
  const [hour, minute] = value.split(":").map(Number);
  return formatTimeOption(hour, minute);
}

function getMarketCallEditValues(call) {
  return { title: call.title, operatorName: call.operatorName || getOperatorName(call.operatorId),
    appointmentType: call.appointmentType, date: call.date, startTime: marketCallTimeInput(call.startTime),
    endTime: marketCallTimeInput(call.endTime), location: call.location, salesReps: call.salesReps.join(", "),
    manufacturerContact: call.manufacturerContact, notes: call.notes, status: call.status };
}

function openMarketCallEditor(visitId, callId, newKind = "") {
  const visit = marketVisits.find((item) => item.id === visitId);
  const call = newKind && visit ? normalizeMarketCall({ kind: newKind, date: visit.startDate, startTime: "8:00 AM", endTime: "9:00 AM", location: visit.location, salesReps: visit.salesReps, manufacturerContact: visit.visitorName, status: "Planned" }) : visit?.calls.find((item) => item.id === callId);
  if (!visit) return;
  // Agenda entries for Testkitchen/Foodshow represent the event itself.
  if (!call) { if (isMarketEvent(visit)) openMarketVisitForm(visit); return; }
  let dialog = document.querySelector("#marketCallEditDialog");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "marketCallEditDialog";
    dialog.className = "note-dialog";
    document.body.appendChild(dialog);
  }
  const values = getMarketCallEditValues(call);
  marketCallEditContext = { visitId, callId, values, newKind };
  const input = (name, label, type = "text", required = false) => `<label><span>${label}</span><input name="${name}" type="${type}" value="${escapeAttribute(values[name])}" ${required ? "required" : ""} /></label>`;
  const options = (name, choices) => [...new Set([values[name], ...choices].filter(Boolean))].map((value) => `<option value="${escapeAttribute(value)}" ${value === values[name] ? "selected" : ""}>${escapeHtml(value)}</option>`).join("");
  dialog.innerHTML = `<form class="note-form" id="marketCallEditForm">
    <div class="form-header"><div><p class="eyebrow">${escapeHtml(visit.name)}</p><h2>${newKind ? (newKind === "appointment" ? "Add appointment" : "Add call") : (call.kind === "appointment" ? "Edit appointment" : "Edit sales call")}</h2></div><button class="icon-button" type="button" data-cancel-call-edit aria-label="Close">&times;</button></div>
    <div class="field-grid">
      ${call.kind === "appointment" ? `${input("title", "Appointment title", "text", true)}<label><span>Appointment type</span><select name="appointmentType">${options("appointmentType", ["Airport / Travel", "Training", "Distributor Meeting", "Internal Meeting", "Other"])}</select></label>` : input("operatorName", "Operator / organization", "text", true)}
      ${input("date", "Date", "date", true)}${input("startTime", "Start time", "time", true)}${input("endTime", "End time", "time", true)}
      ${input("location", "Location")}${input("salesReps", "Sales reps / attendees (comma separated)")}${input("manufacturerContact", "Vendor contact")}
      <label><span>Status</span><select name="status">${options("status", ["Planned", "Tentative", "Completed", "Canceled"])}</select></label>
      <label class="wide"><span>Notes</span><textarea name="notes">${escapeHtml(values.notes)}</textarea></label>
    </div>
    <p class="market-section-help">Keep the date within this visit's date range. To move to another week, edit the visit dates first.</p>
    <p data-call-edit-error role="alert" hidden></p>
    <div class="form-actions"><button class="ghost-action" type="button" data-cancel-call-edit>Cancel</button><button class="primary-action" type="submit">${newKind ? "Add to calendar" : "Save changes"}</button></div>
  </form>`;
  const form = dialog.querySelector("form");
  const operatorInput = form.elements.namedItem("operatorName");
  if (operatorInput) {
    operatorInput.setAttribute("list", "marketCallOperatorSuggestions");
    form.insertAdjacentHTML("beforeend", `<datalist id="marketCallOperatorSuggestions">${renderMarketOperatorSuggestionOptions()}</datalist>`);
  }
  // Permit an existing out-of-range date to be corrected without making it invalid merely on open.
  const minDate = [visit.startDate, call.date].filter(Boolean).sort()[0];
  const maxDate = [visit.endDate || visit.startDate, call.date].filter(Boolean).sort().at(-1);
  if (visit.startDate) form.elements.namedItem("date").min = minDate;
  if (visit.endDate || visit.startDate) form.elements.namedItem("date").max = maxDate;
  dialog.querySelectorAll("[data-cancel-call-edit]").forEach((button) => button.addEventListener("click", () => dialog.close()));
  setupDatePicker(form.elements.namedItem("date"));
  form.addEventListener("submit", saveMarketCallEdit);
  dialog.showModal();
}

function saveMarketCallEdit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const dialog = form.closest("dialog");
  const error = form.querySelector("[data-call-edit-error]");
  const fail = (message) => { error.textContent = message; error.hidden = false; };
  const context = marketCallEditContext;
  const visit = marketVisits.find((item) => item.id === context?.visitId);
  const call = visit?.calls.find((item) => item.id === context?.callId);
  if (!visit || (!call && !context.newKind)) { fail("This appointment was removed. Close this window and refresh the visit."); return; }
  const values = Object.fromEntries(new FormData(form));
  const dateInput = form.elements.namedItem("date");
  if ((dateInput.min && values.date < dateInput.min) || (dateInput.max && values.date > dateInput.max)) { fail("Choose a date within the visit dates."); return; }
  if (!values.startTime || !values.endTime || values.endTime <= values.startTime) { fail("End time must be after start time."); return; }
  if (!((context.newKind || call.kind) === "appointment" ? values.title : values.operatorName).trim()) { fail("Enter a title or operator name."); return; }
  if (context.newKind) {
    const operator = context.newKind === "call" ? findOrCreateMarketOperator(values.operatorName) : null;
    if (context.newKind === "call" && !operator) { fail("Enter an operator name, rather than only a distributor name."); return; }
    const next = normalizeMarketCall({ ...values, kind: context.newKind,
      startTime: marketCallTimeLabel(values.startTime), endTime: marketCallTimeLabel(values.endTime),
      salesReps: normalizeStringList(values.salesReps), operatorId: operator?.operatorId || "",
      operatorName: operator?.operatorName || "", productIds: context.newKind === "call" ? [...visit.productIds] : [] });
    const operatorLinks = operator && !isMarketOperatorAlreadyAttached(visit, operator.operatorId, operator.operatorName)
      ? [...visit.operatorLinks, normalizeMarketOperatorLink({ ...operator, productIds: [...visit.productIds] })]
      : visit.operatorLinks;
    updateMarketVisit(visit.id, { calls: [...visit.calls, next], operatorLinks });
    dialog.close();
    return;
  }
  const patch = {};
  for (const [key, value] of Object.entries(values)) {
    if (value === context.values[key]) continue;
    patch[key] = ["startTime", "endTime"].includes(key) ? marketCallTimeLabel(value) : key === "salesReps" ? normalizeStringList(value) : value.trim();
  }
  if (Object.hasOwn(patch, "operatorName")) {
    const match = getMarketOperatorOptions().find((item) => normalizeOperatorKey(item.operation) === normalizeOperatorKey(patch.operatorName));
    patch.operatorId = match?.id || "";
  }
  updateMarketVisit(visit.id, { calls: visit.calls.map((item) => item.id === call.id ? { ...item, ...patch } : item) });
  dialog.close();
}

function bindMarketCallListEditing(panel, visit) {
  panel.querySelectorAll("[data-edit-market-call-row]").forEach((row) => {
    row.addEventListener("click", (event) => {
      if (event.target.closest("input, textarea, select, button, a")) return;
      openMarketCallEditor(visit.id, row.dataset.editMarketCallRow);
    });
  });
  panel.querySelectorAll("[data-edit-market-call]").forEach((button) => button.addEventListener("click", () => openMarketCallEditor(visit.id, button.dataset.editMarketCall)));
}
