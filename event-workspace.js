/* Date-grouped event cards; existing forms, calendars and versioned saves remain the writers. */
(() => {
  'use strict';
  const dialog = elements.marketVisitsDialog, content = elements.marketContent, model = window.foodBrokerEventLayout;
  if (!dialog || !content || !model) return;
  const oldRender = renderMarketVisits, oldDateMatches = agendaDateMatches;
  const controls = dialog.querySelector('.market-controls'), actionRow = dialog.querySelector('.market-action-row');
  const typeSelect = document.getElementById('marketAgendaType'), rangeSelect = document.getElementById('marketAgendaRange'), groupSelect = document.getElementById('marketAgendaGroup');
  let noticeTimer;
  const icon = name => `<img class="event-icon" src="task-icons/${name}.svg" width="18" height="18" alt="">`;
  const views = [['all', 'All events', 'calendar-event'], ['upcoming', 'Upcoming', 'calendar-week'], ['completed', 'Completed', 'check-circle'],
    ['visits', 'Market visits', 'shop'], ['foodshow', 'Foodshows', 'people'], ['testkitchen', 'Testkitchens', 'fork-knife']];
  const types = {manufacturer: 'Vendor visit', personal: 'Personal visit', foodshow: 'Foodshow', testkitchen: 'Testkitchen'};
  const workspace = document.createElement('section'); workspace.className = 'event-workspace'; workspace.setAttribute('aria-label', 'Events and visits workspace');
  workspace.innerHTML = `<aside class="event-sidebar" aria-label="Event views"><h2>Event views</h2><nav class="event-views" aria-label="Event lists"></nav>
    <div class="event-archive-slot"><button type="button" data-event-view="archive" aria-label="Archive">${icon('archive')}<span>Archive</span><small></small></button></div></aside>
    <section class="event-main"><header class="event-heading"><div><h1>Events &amp; Visits</h1><p class="event-view-subtitle"></p></div><div class="event-heading-actions"></div></header>
    <div class="event-search-toolbar"><div class="event-search-slot"></div><button class="event-filter-toggle" type="button" aria-expanded="false" aria-controls="eventAdvancedFilters">Filters</button></div>
    <section id="eventAdvancedFilters" class="event-advanced-filters" hidden></section><p class="event-workspace-status" role="status"></p><div class="event-content-slot"></div></section>`;
  actionRow.before(workspace); workspace.querySelector('.event-content-slot').append(content);
  dialog.classList.add('events-enabled'); actionRow.hidden = true;
  const actions = workspace.querySelector('.event-heading-actions'), add = document.getElementById('addMarketVisit'), toggle = dialog.querySelector('.market-view-toggle');
  add.textContent = '+ Add event'; actions.append(add, toggle);
  toggle.querySelector('[data-market-view="list"]').innerHTML = icon('list-task') + '<span>Cards</span>';
  toggle.querySelector('[data-market-view="calendar"]').innerHTML = icon('calendar-week') + '<span>Calendar</span>';
  const searchLabel = elements.marketSearch.closest('label'); workspace.querySelector('.event-search-slot').append(searchLabel);
  elements.marketSearch.placeholder = 'Search event, vendor, operator, notes…'; elements.marketSearch.setAttribute('aria-label', 'Search events and visits');
  const advanced = workspace.querySelector('.event-advanced-filters');
  advanced.append(controls.querySelector('.agenda-advanced-grid'));
  advanced.append(document.getElementById('clearMarketFilters'));
  controls.hidden = true;
  const schedule = new Option('Date groups', 'schedule'); groupSelect.prepend(schedule); groupSelect.value = 'schedule';
  const dateLabel = document.createElement('label'); dateLabel.innerHTML = '<span>Date range</span>';
  rangeSelect.hidden = false; dateLabel.append(rangeSelect); advanced.firstElementChild.append(dateLabel);
  const filterToggle = workspace.querySelector('.event-filter-toggle');
  filterToggle.onclick = () => {advanced.hidden = !advanced.hidden; filterToggle.setAttribute('aria-expanded', String(!advanced.hidden));};
  const nav = workspace.querySelector('.event-views');
  views.forEach(([key, label, name], index) => {
    if (index === 3) {const heading = document.createElement('h2'); heading.textContent = 'By type'; nav.append(heading);}
    const button = document.createElement('button'); button.type = 'button'; button.dataset.eventView = key;
    button.innerHTML = `${icon(name)}<span>${label}</span><small></small>`; nav.append(button);
  });
  workspace.querySelectorAll('[data-event-view]').forEach(button => button.onclick = () => selectView(button.dataset.eventView));
  const sundayStart = () => getCurrentCalendarPreferences().some(item => item.weekStart === 'sunday');
  function currentView() {
    if (elements.marketArchiveFilter.value === 'archived') return 'archive';
    if (elements.marketStatusFilter.value === 'Completed') return 'completed';
    if (['visits', 'foodshow', 'testkitchen'].includes(typeSelect.value)) return typeSelect.value;
    return rangeSelect.value === 'all' ? 'all' : 'upcoming';
  }
  function selectView(key) {
    activeMarketDetailId = ''; elements.marketSearch.value = ''; elements.marketManufacturerFilter.value = '';
    elements.marketRepFilter.value = ''; elements.marketStatusFilter.value = key === 'completed' ? 'Completed' : '';
    elements.marketArchiveFilter.value = key === 'archive' ? 'archived' : 'active'; agendaArchiveFilterIsExplicit = true;
    typeSelect.value = ['visits', 'foodshow', 'testkitchen'].includes(key) ? key : '';
    rangeSelect.value = ['all', 'completed', 'archive'].includes(key) ? 'all' : 'upcoming'; renderMarketVisits();
  }
  function viewCount(key) {
    const today = TaskDates.today();
    return marketVisits.filter(visit => {
      if (key === 'archive') return !!visit.archivedAt;
      if (visit.archivedAt) return false;
      if (key === 'completed') return visit.status === 'Completed';
      if (key === 'all') return true;
      if (visit.startDate && (visit.endDate || visit.startDate) < today) return false;
      return key === 'upcoming' || (key === 'visits' ? ['personal', 'manufacturer'].includes(visit.type) : visit.type === key);
    }).length;
  }
  function refreshControls() {
    const selected = currentView();
    workspace.querySelectorAll('[data-event-view]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.eventView === selected)); button.querySelector('small').textContent = viewCount(button.dataset.eventView);
    });
    workspace.querySelectorAll('[data-market-view]').forEach(button => {button.setAttribute('aria-pressed', String(button.dataset.marketView === activeMarketView)); button.classList.toggle('active-market-view', button.dataset.marketView === activeMarketView);});
    workspace.classList.toggle('event-detail-open', !!activeMarketDetailId); workspace.classList.toggle('event-calendar-open', activeMarketView === 'calendar');
    const label = selected === 'archive' ? 'Archived events and visits' : selected === 'completed' ? 'Completed events and visits' : 'Your upcoming plans, in date order';
    workspace.querySelector('.event-view-subtitle').textContent = label;
  }
  function notify(message, error = false) {
    const status = workspace.querySelector('.event-workspace-status'); clearTimeout(noticeTimer);
    status.textContent = message; status.classList.toggle('is-error', error); status.setAttribute('role', error ? 'alert' : 'status');
    if (!error) noticeTimer = setTimeout(() => {status.textContent = '';}, 3500);
  }
  function change(id, patch) {
    if (!marketVisits.some(visit => visit.id === id)) return false;
    try {updateMarketVisit(id, patch); return true;}
    catch (error) {renderMarketVisits(); notify('Could not save this change. Your previous event is kept. Please retry.', true); return false;}
  }
  function save(id) {
    if (!marketVisits.some(visit => visit.id === id)) return false;
    try {persistMarketVisits(); notify('Saved on this device.'); if (typeof pushPendingCloudSections === 'function') void pushPendingCloudSections(); return true;}
    catch (error) {notify('Could not save. Keep this window open and retry.', true); return false;}
  }
  const metrics = visit => {
    const products = getMarketVisitProducts(visit), calls = getMarketVisitCalendarCalls(visit), operators = getMarketVisitOperators(visit);
    if (isMarketEvent(visit)) {
      const vendors = new Set(products.map(product => product.vendor).filter(Boolean));
      return `${vendors.size} vendors · ${products.length} products${visit.attendees?.length ? ' · ' + visit.attendees.length + ' attendees' : ''}`;
    }
    return `${calls.length} appointments · ${operators.length} operators · ${products.length} products`;
  };
  function preview(visit) {
    if (visit.notes?.trim()) return visit.notes.trim();
    const clock = new Intl.DateTimeFormat('en-US', {timeZone: 'America/Anchorage', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).formatToParts(new Date());
    const now = Number(clock.find(part => part.type === 'hour').value) * 60 + Number(clock.find(part => part.type === 'minute').value);
    const call = model.nextCall(getMarketVisitCalendarCalls(visit), TaskDates.today(), now);
    if (!call) return '';
    return 'Next: ' + [getMarketCallTitle(call), formatDate(call.date), [call.startTime, call.endTime].filter(Boolean).join('–')].filter(Boolean).join(' · ');
  }
  function card(visit) {
    const title = getMarketVisitDisplayName(visit), id = escapeAttribute(visit.id), dates = model.tile(visit, TaskDates.today()), note = preview(visit);
    return `<article class="event-card" data-event-card="${id}" aria-labelledby="event-title-${id}">
      <header class="event-card-heading"><h3><button type="button" id="event-title-${id}" data-event-open="${id}">${escapeHtml(title)}</button></h3><div class="event-card-actions">
      <button type="button" class="event-icon-action" data-event-save="${id}" aria-label="Save event: ${escapeAttribute(title)}" title="Save event">${icon('floppy')}</button>
      <button type="button" class="event-icon-action" data-event-archive="${id}" aria-label="${visit.archivedAt ? 'Restore' : 'Archive'} event: ${escapeAttribute(title)}" title="${visit.archivedAt ? 'Restore event' : 'Archive event'}">${icon(visit.archivedAt ? 'arrow-repeat' : 'archive')}</button>
      <details class="event-card-menu"><summary class="event-icon-action" aria-label="More actions for ${escapeAttribute(title)}" title="More actions">${icon('three-dots')}</summary><div role="group" aria-label="Actions for ${escapeAttribute(title)}">
      <button type="button" data-event-edit="${id}">${icon('pencil-square')} Edit event</button>${renderPersonalVisitCalendarButton(visit)}<button type="button" data-event-print="${id}">${icon('printer')} Print ${isMarketEvent(visit) ? 'event' : 'schedule'}</button><button type="button" data-event-download="${id}">${icon('calendar-event')} Download calendar</button></div></details></div></header>
      <div class="event-card-body"><div class="event-date-tile" aria-label="${escapeAttribute(visit.startDate ? formatDateRange(visit.startDate, visit.endDate) : 'Date to be confirmed')}"><span class="event-tile-weekday">${escapeHtml(dates.weekday)}</span><span class="event-tile-month">${escapeHtml(dates.month)}</span><strong>${escapeHtml(dates.days)}</strong>${dates.year ? `<span class="event-tile-year">${escapeHtml(dates.year)}</span>` : ''}</div>
      <div class="event-card-info"><div class="event-card-type-status"><span class="event-type-chip" data-event-type="${escapeAttribute(visit.type)}">${icon(visit.type === 'personal' ? 'people' : visit.type === 'manufacturer' ? 'shop' : visit.type === 'foodshow' ? 'people' : 'fork-knife')}${types[visit.type] || 'Event'}</span>
      <select data-event-status="${id}" aria-label="Status for ${escapeAttribute(title)}">${marketStatuses.map(status => `<option${visit.status === status ? ' selected' : ''}>${escapeHtml(status)}</option>`).join('')}</select></div>
      ${visit.location ? `<p class="event-meta">${icon('geo-alt')}<span>${escapeHtml(visit.location)}</span></p>` : ''}<p class="event-meta">${icon('people')}<span>${metrics(visit)}</span></p>
      ${note ? `<p class="event-card-note">${icon('chat')}<span>${escapeHtml(note)}</span></p>` : ''}</div></div></article>`;
  }
  function bindCards() {
    content.querySelectorAll('[data-event-open]').forEach(button => button.onclick = () => openMarketVisitDetail(button.dataset.eventOpen));
    content.querySelectorAll('[data-event-card]').forEach(article => article.onclick = event => {if (!event.target.closest('button,select,a,input,summary,details')) openMarketVisitDetail(article.dataset.eventCard);});
    content.querySelectorAll('[data-event-save]').forEach(button => button.onclick = () => save(button.dataset.eventSave));
    content.querySelectorAll('[data-event-archive]').forEach(button => button.onclick = () => {
      const visit = marketVisits.find(item => item.id === button.dataset.eventArchive);
      if (visit && change(visit.id, {archivedAt: visit.archivedAt ? '' : new Date().toISOString()})) {renderCalendar(); notify(visit.archivedAt ? 'Event restored.' : 'Event archived. Open Archive to restore it.');}
    });
    content.querySelectorAll('[data-event-status]').forEach(select => select.onchange = () => {
      const id = select.dataset.eventStatus, visit = marketVisits.find(item => item.id === id);
      if (!visit || visit.status === select.value) return;
      if (change(id, {status: select.value})) notify('Status saved on this device.');
      (content.querySelector(`[data-event-status="${CSS.escape(id)}"]`) || nav.querySelector('[aria-pressed=true]'))?.focus();
    });
    content.querySelectorAll('[data-event-edit]').forEach(button => button.onclick = () => openMarketVisitForm(marketVisits.find(item => item.id === button.dataset.eventEdit)));
    content.querySelectorAll('[data-event-print]').forEach(button => button.onclick = () => openMarketPrintOptions(button.dataset.eventPrint));
    content.querySelectorAll('[data-event-download]').forEach(button => button.onclick = () => exportMarketVisitIcs(button.dataset.eventDownload));
    bindPersonalVisitCalendarButtons(content);
  }
  workspace.addEventListener('click', event => {workspace.querySelectorAll('.event-card-menu[open]').forEach(menu => {if (!menu.contains(event.target)) menu.open = false;});});
  workspace.addEventListener('keydown', event => {if (event.key === 'Escape') workspace.querySelectorAll('.event-card-menu[open]').forEach(menu => {menu.open = false; menu.querySelector('summary').focus();});});
  agendaDateMatches = function(visit) {
    if (['upcoming', 'past', 'all'].includes(rangeSelect.value)) {
      if (rangeSelect.value === 'all') return true;
      if (!visit.startDate) return rangeSelect.value === 'upcoming';
      return rangeSelect.value === 'past' ? (visit.endDate || visit.startDate) < TaskDates.today() : (visit.endDate || visit.startDate) >= TaskDates.today();
    }
    return oldDateMatches(visit);
  };
  clearMarketFilters = function() {
    agendaArchiveFilterIsExplicit = false; activeMarketDetailId = '';
    elements.marketArchiveFilter.value = 'auto'; elements.marketSearch.value = ''; elements.marketManufacturerFilter.value = '';
    elements.marketRepFilter.value = ''; elements.marketStatusFilter.value = ''; elements.marketDateFilter.value = '';
    typeSelect.value = ''; rangeSelect.value = 'upcoming'; groupSelect.value = 'schedule'; renderMarketVisits();
  };
  renderMarketVisits = function() {
    if (isFoodshowFieldEditing()) return;
    refreshControls();
    if (activeMarketView === 'calendar' || activeMarketDetailId) {
      oldRender();
      const panel = content.querySelector('#marketDetailPanel'), back = panel?.querySelector('[data-detail-close]');
      if (activeMarketDetailId && back) {
        back.innerHTML = icon('arrow-left') + '<span>Back to Events &amp; Visits</span>';
        back.classList.add('event-back-button');
        panel.prepend(back);
      }
      return;
    }
    const scroll = captureFoodshowScroll(); updateMarketVisitControls(); updateAgendaFilterButtons();
    const visits = getVisibleMarketVisits(), groups = model.groups(visits, TaskDates.today(), groupSelect.value, marketVisitTypes, sundayStart());
    content.innerHTML = visits.length ? groups.map(group => `<section class="event-date-group"><h2>${escapeHtml(group.title)}</h2><div class="event-cards">${group.items.map(card).join('')}</div></section>`).join('')
      : '<div class="event-empty"><h2>No events match this view</h2><p>Choose another date or clear your filters.</p><button type="button" data-event-clear>Clear filters</button></div>';
    content.querySelector('[data-event-clear]')?.addEventListener('click', clearMarketFilters);
    bindCards(); restoreFoodshowScroll(scroll);
  };
  window.foodBrokerEventWorkspace = {save, change};
  renderMarketVisits();
})();
