"use strict";

function readMarketOperatorConversion(visitId, operatorId, panel) {
  const visit = marketVisits.find(item => item.id === visitId);
  const operator = visit && getMarketVisitOperators(visit).find(item => item.id === operatorId);
  if (!operator) return null;
  const selected = [...panel.querySelectorAll('[data-operator-lead-product]')].filter(input => input.dataset.operatorLeadProduct === operatorId && input.checked).map(input => input.value);
  const notesInput = [...panel.querySelectorAll('[data-market-operator-notes]')].find(input => input.dataset.marketOperatorNotes === operatorId);
  const productNotes = { ...(operator.productNotes || {}) };
  panel.querySelectorAll('[data-market-operator-product-note]').forEach(input => {
    if (input.dataset.marketOperatorProductNote === operatorId) productNotes[input.dataset.productId] = { note: input.value.trim() };
  });
  return { visit, operator: { ...operator, notes: notesInput?.value || '', productNotes },
    products: getMarketVisitProducts(visit).filter(product => selected.includes(product.id)),
    distributor: [...panel.querySelectorAll('[data-event-lead-distributor]')].find(input => input.dataset.eventLeadDistributor === operatorId)?.value || 'US Foods' };
}

function marketConversionSourceMatches(record, visit, operator) {
  return record.sourceMarketVisitId === visit.id && (record.sourceMarketOperatorId === operator.id || (record.sourceMarketOperatorName && record.sourceMarketOperatorName === normalizeOperatorKey(getMarketOperatorDisplayName(operator))));
}

function marketConversionNotes(visit, operator, products) {
  return [`From ${marketVisitTypes[visit.type]}: ${getMarketVisitDisplayName(visit)}`, operator.notes,
    ...products.map(product => operator.productNotes?.[product.id]?.note ? `${product.description}: ${operator.productNotes[product.id].note}` : ''),
    ...(visit.attendees || []).filter(person => normalizeOperatorKey(person.organization) === normalizeOperatorKey(getMarketOperatorDisplayName(operator))).map(person => [person.name, person.role, person.contact].filter(Boolean).join(' | '))].filter(Boolean).join('\n\n');
}

function showMarketConversionDestination(panel, kind, lead) {
  panel.closest('dialog')?.close();
  if (kind === 'lead') { showLeadsWorkflow(); openForm(lead); }
  else { openVendorReportWindow(); clearVendorReportFilters(); }
}

function convertMarketOperatorToVendorReport(visit, operatorId, panel) {
  const snapshot = readMarketOperatorConversion(visit.id, operatorId, panel);
  if (!snapshot) return;
  const { operator, products } = snapshot;
  if (!products.length) { alert('Select the products shown to this operator first.'); return; }
  saveMarketOperatorDetails(visit.id, operatorId, panel);
  const lead = cards.find(card => !card.deletedAt && marketConversionSourceMatches(card, visit, operator));
  const covered = new Set();
  if (lead) {
    // Update the lead-backed report rather than creating a second copy.
    const previousCards = cards;
    const reports = { ...lead.vendorReports };
    products.forEach(product => {
      const match = normalizeProducts(lead).find(item => normalizeOperatorKey(item.vendor) === normalizeOperatorKey(product.vendor || product.brandName || visit.vendor) && item.description === product.description);
      if (!match) return;
      covered.add(product.id);
      reports[match.id] = { ...getVendorReport(lead, match), opportunityNote: marketConversionNotes(visit, operator, [product]) };
    });
    cards = cards.map(card => card.id === lead.id ? { ...card, vendorReports: reports } : card);
    if (!persist()) { cards = previousCards; return; }
  }
  const additions = products.filter(product => !covered.has(product.id)).map(product => {
    const existing = manualVendorReports.find(report => marketConversionSourceMatches(report, visit, operator) && report.sourceMarketProductId === product.id);
    return normalizeManualVendorReport({ ...existing,
    account: getMarketOperatorDisplayName(operator), vendor: product.vendor || product.brandName || visit.vendor,
    productShown: product.description, opportunityNote: marketConversionNotes(visit, operator, [product]),
    sourceMarketVisitId: visit.id, sourceMarketOperatorId: operatorId,
    sourceMarketOperatorName: normalizeOperatorKey(getMarketOperatorDisplayName(operator)), sourceMarketProductId: product.id,
    outcome: existing?.outcome || 'Unsure', submitted: existing?.submitted || false
  }); });
  const previous = manualVendorReports;
  manualVendorReports = [...additions, ...manualVendorReports.filter(report => !additions.some(item => item.id === report.id))];
  try { persistManualVendorReports(); }
  catch (error) { manualVendorReports = previous; alert('The vendor report could not be saved. Please try again.'); return; }
  showMarketConversionDestination(panel, 'vendor');
}
