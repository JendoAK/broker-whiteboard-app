"use strict";

function printMarketOperatorProducts(visitId, operatorId, panel) {
  const selection = readMarketOperatorConversion(visitId, operatorId, panel);
  if (!selection || selection.visit.type !== "manufacturer") return;
  if (!selection.products.length) {
    alert("Check at least one product for this operator before printing.");
    return;
  }
  const dialog = createVisitDialog("Print product list");
  const body = dialog.querySelector("[data-visit-entry-body]");
  body.innerHTML = `<form data-operator-print-options>
    <p>${escapeHtml(getMarketOperatorDisplayName(selection.operator))} · ${selection.products.length} ${selection.products.length === 1 ? "product" : "products"} selected</p>
    <fieldset><legend>Logos</legend>
      <label><input type="checkbox" name="companyLogo" checked> Include Pierce Cartwright logo</label>
      <label>Distributor logo<select name="logo"><option value="none">No distributor logo</option><option value="usFoods">US Foods</option><option value="sysco">Sysco</option><option value="linford">Linford</option></select></label>
    </fieldset>
    <fieldset><legend>Item numbers to print</legend>
      <label><input type="checkbox" name="codes" value="manufacturerNumber" checked> MF number</label>
      <label><input type="checkbox" name="codes" value="supc" checked> Sysco SUPC</label>
      <label><input type="checkbox" name="codes" value="apn" checked> US Foods APN</label>
    </fieldset>
    <div class="form-actions"><button class="ghost-action" type="button" data-cancel-print>Cancel</button><button class="primary-action" type="submit">Print Product List</button></div>
  </form>`;
  body.querySelector("[data-cancel-print]").onclick = () => dialog.close();
  body.querySelector("form").onsubmit = event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    openPrintWindow(renderOperatorProductPrint(selection, { companyLogo: data.has("companyLogo"), logo: data.get("logo"), codes: data.getAll("codes") }));
    dialog.close();
  };
  dialog.showModal();
}

function renderOperatorProductPrint({ visit, operator, products }, options = {}) {
  const operatorName = getMarketOperatorDisplayName(operator);
  const logo = getEventPrintLogo(options.logo);
  const logos = `${options.companyLogo !== false ? `<img src="${escapeAttribute(getPrintAssetUrl(printBrandLogos.pierceCartwright))}" alt="Pierce Cartwright">` : ""}${logo ? `<img src="${escapeAttribute(getPrintAssetUrl(logo.src))}" alt="${escapeAttribute(logo.name)}">` : ""}`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(operatorName)} – Product list</title><style>
    @page { size: letter landscape; margin: .4in; }
    * { box-sizing: border-box; }
    body { color: #241e18; font: 12px Arial, sans-serif; margin: 0; }
    header { display: flex; align-items: center; gap: 24px; padding-bottom: 14px; margin-bottom: 18px; border-bottom: 2px solid #bfae99; }
    header img { width: 155px; max-height: 65px; object-fit: contain; }
    h1 { font-size: 24px; margin: 0 0 6px; } p { margin: 5px 0; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { border: 1px solid #cfc1af; padding: 8px; text-align: left; overflow-wrap: anywhere; }
    th { background: #f5e4c7; } th:first-child, td:first-child { width: 34%; }
    thead { display: table-header-group; } tr { break-inside: avoid; }
    @media screen { body { max-width: 1100px; margin: 24px auto; padding: 16px; } }
  </style></head><body><header>${logos}<div><h1>${escapeHtml(operatorName)}</h1><p>Product list · ${products.length} selected</p><p>${escapeHtml(getMarketVisitDisplayName(visit))} · ${escapeHtml(formatDateRange(visit.startDate, visit.endDate))}</p></div></header>${renderVisitProductPrintTable(products, options.codes || 'all')}</body></html>`;
}

function renderVendorVisitCalendarPrint(visit, sections) {
  const title = getMarketVisitDisplayName(visit);
  const logo = getEventPrintLogo(sections.logo);
  const header = `<header><img src="${escapeAttribute(getPrintAssetUrl(printBrandLogos.pierceCartwright))}" alt="Pierce Cartwright" /><div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(formatDateRange(visit.startDate, visit.endDate))}</p></div>${logo ? `<img class="event-distributor-logo" src="${escapeAttribute(getPrintAssetUrl(logo.src))}" alt="${escapeAttribute(logo.name)}" />` : ""}</header>`;
  const weeks = new Map();
  const dates = [...getMarketVisitDateKeys(visit), ...visit.calls.map(call => call.date)].filter(Boolean);
  dates.forEach(key => {
    const date = parseLocalDate(key);
    if (Number.isNaN(date.getTime())) return;
    const monday = new Date(date); monday.setDate(date.getDate() - (date.getDay() + 6) % 7);
    weeks.set(toDateKey(monday), monday);
  });
  if (!weeks.size) { const monday = startOfMarketVisitWorkWeek(visit); weeks.set(toDateKey(monday), monday); }
  const pages = sections.schedule ? [...weeks.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, monday]) => {
    const end = new Date(monday); end.setDate(end.getDate() + 7);
    const hasWeekendCalls = visit.calls.some(call => {
      if (!call.date) return false;
      const date = parseLocalDate(call.date);
      return date >= monday && date < end && [0, 6].includes(date.getDay());
    });
    return `<section class="print-page">${header}${renderPreciseMarketWeek(visit, { weekStart: monday, dayCount: hasWeekendCalls ? 7 : 5, print: true })}</section>`;
  }) : [];
  if (sections.products) pages.push(`<section class="product-page">${header}<h2>Products</h2>${renderVisitProductPrintTable(getMarketVisitProducts(visit), sections.codeMode)}</section>`);
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>
    @page { size: letter landscape; margin: .35in; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #241e18; font: 12px Arial, sans-serif; }
    header { display: flex; align-items: center; gap: 24px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #bfae99; }
    header img { width: 150px; max-height: 54px; object-fit: contain; }
    header .event-distributor-logo { margin-left: auto; width: 100px; max-height: 54px; }
    header h1 { margin: 0 0 5px; font-size: 23px; } header p { margin: 0; font-size: 13px; }
    .print-page, .product-page { break-before: page; } .print-page:first-child, .product-page:first-child { break-before: auto; }
    .print-page { break-inside: avoid; }
    .precise-week-grid { display: grid; grid-template-columns: 52px repeat(var(--day-count), minmax(0, 1fr)); border: 1px solid #bfae99; }
    .precise-time-heading, .precise-day-heading { padding: 8px 6px; min-height: 46px; background: #f5e4c7; border-right: 1px solid #cfc1af; }
    .precise-day-heading span { display: block; font-size: 10px; margin-top: 4px; }
    .precise-time-axis, .precise-day { position: relative; height: var(--week-height); border-right: 1px solid #d8cbbc; background: repeating-linear-gradient(to bottom, #d8cbbc 0px, #d8cbbc 1px, transparent 1px, transparent var(--hour-height)); }
    .precise-time-axis > span { position: absolute; left: 5px; padding-top: 3px; font-size: 11px; font-weight: bold; }
    .precise-day-outside, .week-day-outside { background-color: #efede8; }
    .precise-week-call { position: absolute; display: flex; flex-direction: column; gap: 2px; padding: 3px 5px; min-height: 0; margin: 0; background: #f1dfc8; color: #201b16; border: 1px solid #aa7b42; border-left: 3px solid #9b5e29; border-radius: 4px; text-align: left; overflow: hidden; font-family: Arial, sans-serif; }
    .precise-week-call strong { font-size: 11px; line-height: 12px; } .precise-week-call span { font-size: 10px; line-height: 11px; white-space: nowrap; }
    table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #cfc1af; padding: 7px; text-align: left; } th { background: #f5e4c7; } tr { break-inside: avoid; }
    @media print { * { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
    @media screen { body { max-width: 1100px; margin: 20px auto; padding: 16px; } .print-page, .product-page { margin-bottom: 32px; } }
  </style></head><body>${pages.join('')}</body></html>`;
}
