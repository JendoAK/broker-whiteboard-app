"use strict";

function normalizeTablePlanner(value) {
  if (!value || value.version !== 1 || !Array.isArray(value.tables) || !value.tables.length) return null;
  const text = (v, max = 100) => String(v || '').slice(0, max);
  const number = (v, fallback, min, max) => Number.isFinite(Number(v)) ? Math.max(min, Math.min(max, Number(v))) : fallback;
  const tables = value.tables.slice(0, 30).map((t, n) => ({
    id: text(t.id) || `table-${n}`, name: text(t.name) || `Table ${n + 1}`,
    w: number(t.w, 72, 36, 240), h: number(t.h, 30, 24, 96),
    sharing: ['one', 'two', 'three', 'four'].includes(t.sharing) ? t.sharing : 'one',
    vendors: Array.from({ length: 4 }, (_, i) => text(t.vendors?.[i])),
    items: (Array.isArray(t.items) ? t.items : []).slice(0, 200).filter(i => i && typeof i === 'object').map((i, j) => ({
      id: text(i.id) || `piece-${n}-${j}`, type: text(i.type), label: text(i.label), product: text(i.product, 400), productId: text(i.productId),
      owner: number(i.owner, 0, 0, 4), x: number(i.x, 0, 0, 240), y: number(i.y, 0, 0, 96),
      w: number(i.w, 10, 1, 240), h: number(i.h, 10, 1, 96), angle: number(i.angle, 0, 0, 359),
      ...(i.rotationW ? { rotationW: number(i.rotationW, 10, 1, 240), rotationH: number(i.rotationH, 10, 1, 96) } : {})
    }))
  }));
  return { version: 1, active: text(value.active) || tables[0].id, selected: text(value.selected), tables,
    vendorRevision: 1, shortLabelRevision: 1, basketSizeRevision: 1, chaferSizeRevision: 1, griddleSizeRevision: 1, warmerSizeRevision: 1 };
}

(() => {
  const sessions = new Map();
  window.tablePlannerBridge = {
    getContext(token) {
      const session = sessions.get(token);
      if (!session) throw new Error('Open the table planner from an event.');
      const visit = marketVisits.find(v => v.id === session.visitId);
      if (!visit) throw new Error('This event is no longer available.');
      return { name: visit.name, layout: normalizeTablePlanner(visit.tableLayout), vendors: getVendorOptions(), products: getMarketVisitProducts(visit).map(p => ({ id: p.id, vendor: p.vendor || 'No vendor', description: p.description, code: p.supc || p.apn || p.manufacturerNumber || '' })) };
    },
    save(token, value) {
      const session = sessions.get(token), layout = normalizeTablePlanner(value);
      if (!session || !layout) throw new Error('The layout could not be saved.');
      const visit = marketVisits.find(v => v.id === session.visitId);
      if (!visit) throw new Error('This event is no longer available.');
      const content = JSON.stringify(layout);
      if (session.saved === content) return;
      const previous = { ...visit };
      try {
        visit.tableLayout = layout;
        visit.updatedAt = new Date().toISOString();
        stampSharedRecord(visit, 'Updated');
        persistMarketVisits();
        session.saved = content;
        session.status.textContent = 'Saved';
      } catch (error) {
        Object.assign(visit, previous);
        session.status.textContent = 'Unable to save. Keep this window open and retry.';
        throw error;
      }
    }
  };
  window.openEventTablePlanner = function(visitId) {
    const visit = marketVisits.find(v => v.id === visitId);
    if (!visit || !['foodshow', 'testkitchen'].includes(visit.type)) return;
    const dialog = document.createElement('dialog');
    dialog.className = 'event-table-planner-dialog';
    dialog.setAttribute('aria-label', 'Table layouts and packing list');
    dialog.innerHTML = '<header><h2>Table layouts &amp; packing list</h2><span role="status"></span><button type="button">Close</button></header><iframe title="Event table planner"></iframe>';
    const token = crypto.randomUUID(), frame = dialog.querySelector('iframe');
    sessions.set(token, { visitId, status: dialog.querySelector('[role=status]'), saved: JSON.stringify(normalizeTablePlanner(visit.tableLayout)) });
    frame.src = './table-planner.html?v=20260930-planner1#session=' + token;
    const close = () => {
      try { if (frame.contentWindow.flushTablePlanner && !frame.contentWindow.flushTablePlanner()) return; }
      catch (error) { sessions.get(token).status.textContent = 'Unable to save. Please retry before closing.'; return; }
      dialog.close();
    };
    dialog.querySelector('button').onclick = close;
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    dialog.addEventListener('close', () => { sessions.delete(token); dialog.remove(); resumeAppRefresh(); }, { once: true });
    document.body.append(dialog); dialog.showModal();
  };
})();
