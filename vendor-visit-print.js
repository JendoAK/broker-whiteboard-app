"use strict";

function renderVendorVisitCalendarPrint(visit, sections) {
  const title = getMarketVisitDisplayName(visit);
  const header = `<header><img src="${escapeAttribute(getPrintAssetUrl(printBrandLogos.pierceCartwright))}" alt="Pierce Cartwright" /><div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(formatDateRange(visit.startDate, visit.endDate))}</p></div></header>`;
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
