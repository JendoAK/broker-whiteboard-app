"use strict";
let agendaArchiveFilterIsExplicit = false;
function renderMarketVisits() {
  if (isFoodshowFieldEditing()) return;
  const foodshowScroll = captureFoodshowScroll();
  updateMarketVisitControls();
  updateAgendaFilterButtons();
  document.querySelectorAll("[data-market-type]").forEach((button) => button.classList.toggle("active-market-subtab", button.dataset.marketType === activeMarketType));
  document.querySelectorAll("[data-market-view]").forEach((button) => button.classList.toggle("active-market-view", button.dataset.marketView === activeMarketView));
  const visits = getVisibleMarketVisits();

  if (activeMarketView === "calendar") {
    renderMarketCalendar(visits);
    elements.marketContent.querySelectorAll(".quick-list-header .eyebrow").forEach(el=>el.textContent="Events & Visits");
    return;
  }

  const title = elements.marketArchiveFilter.value === 'archived' ? 'Archived events & visits' : 'Your agenda';
  elements.marketContent.innerHTML = `
    <section class="quick-list-panel market-list-panel">
      <div class="quick-list-header market-list-header-compact">
        <div><p class="eyebrow">Events &amp; Visits</p><h2>${escapeHtml(title)}</h2><p class="agenda-help">All your events and visits in one place.</p></div>
        <span class="count-pill">${visits.length}</span>
      </div>
      ${visits.length ? `<div class="market-card-grid">${renderAgendaGroups(visits)}</div>` : `<div class="empty-state">${elements.marketArchiveFilter.value === "archived" ? "No archived events or visits" : "No events match these filters. Try All dates or clear the filters."}</div>`}
    </section>
    <section class="market-detail-panel" id="marketDetailPanel"></section>
  `;
  elements.marketContent.querySelectorAll("[data-market-edit]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openMarketVisitForm(marketVisits.find((visit) => visit.id === button.dataset.marketEdit));
    });
  });
  elements.marketContent.querySelectorAll("[data-market-view-detail]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openMarketVisitDetail(button.dataset.marketViewDetail);
    });
  });
  elements.marketContent.querySelectorAll("[data-market-card]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("button, a, input, select, textarea, summary")) return;
      openMarketVisitDetail(card.dataset.marketCard);
    });
    card.addEventListener("keydown", (event) => {
      if (event.target !== card) return;
      if (!["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      openMarketVisitDetail(card.dataset.marketCard);
    });
  });
  elements.marketContent.querySelectorAll("[data-market-print]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openMarketPrintOptions(button.dataset.marketPrint);
    });
  });
  elements.marketContent.querySelectorAll("[data-market-ics]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      exportMarketVisitIcs(button.dataset.marketIcs);
    });
  });
  elements.marketContent.querySelectorAll("[data-market-status-card]").forEach((select) => {
    select.addEventListener("click", (event) => event.stopPropagation());
    select.addEventListener("change", (event) => {
      event.stopPropagation();
      updateMarketVisit(select.dataset.marketStatusCard, { status: select.value });
    });
  });
  bindMarketArchiveActions(elements.marketContent);
  if (activeMarketDetailId) {
    const visit = marketVisits.find((item) => item.id === activeMarketDetailId);
    if (visit) { activeMarketType = visit.type; renderMarketVisitDetail(visit); }
  }
  bindPersonalVisitCalendarButtons(elements.marketContent);
  restoreFoodshowScroll(foodshowScroll);
}

function getVisibleMarketVisits() {
  const query = elements.marketSearch.value.trim().toLowerCase();
  const type = document.getElementById("marketAgendaType").value;
  const range = document.getElementById("marketAgendaRange").value;
  const archive = elements.marketArchiveFilter.value;
  const manufacturer = elements.marketManufacturerFilter.value;
  const rep = elements.marketRepFilter.value.trim().toLowerCase();
  const status = elements.marketStatusFilter.value;
  return marketVisits
    .filter((visit) => {
      if (type === "visits" ? !["personal", "manufacturer"].includes(visit.type) : type && visit.type !== type) return false;
      if (!agendaDateMatches(visit)) return false;
      if (archive === "active" && visit.archivedAt) return false;
      if (archive === "archived" && !visit.archivedAt) return false;
      if (archive === "auto" && range === "upcoming" && visit.archivedAt) return false;
      const products = manufacturer || query ? getMarketVisitProducts(visit) : [];
      if (manufacturer && visit.vendor !== manufacturer && !products.some((product) => product.vendor === manufacturer)) return false;
      if (rep && !(visit.salesReps || []).some((name) => String(name).toLowerCase().includes(rep))) return false;
      if (status && visit.status !== status) return false;
      if (!query) return true;
      const productSearch = products.map((product) => [product.description, product.vendor, product.brandName, product.manufacturerNumber, product.apn, product.supc].join(" ")).join(" ");
      const operators = getMarketVisitOperators(visit).map((operator) => operator.operatorName || getOperatorName(operator.operatorId)).join(" ");
      return [visit.name, visit.vendor, visit.visitorName, visit.location, (visit.salesReps || []).join(" "), visit.notes, productSearch, operators, ...(visit.attendees || []).map((person) => [person.name, person.organization, person.role, person.contact].join(" "))].some((value) => String(value || "").toLowerCase().includes(query));
    })
    .sort((a, b) => {
      const order = (a.startDate || "9999-12-31").localeCompare(b.startDate || "9999-12-31");
      return ["past", "lastmonth"].includes(range) ? -order : order;
    });
}


function agendaDateMatches(visit) {
  const mode = document.getElementById("marketAgendaRange").value;
  const now = startOfToday();
  const today = toDateKey(now);
  const start = visit.startDate;
  const end = visit.endDate || start;
  if (mode === "all") return true;
  if (!start) return mode === "upcoming";
  if (mode === "past") return end < today;
  if (mode === "upcoming") return end >= today;
  if (mode === "week") {
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (now.getDay() + 6) % 7);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
    return start <= toDateKey(sunday) && end >= toDateKey(monday);
  }
  const offset = mode === "lastmonth" ? -1 : mode === "next" ? 1 : 0;
  const first = toDateKey(new Date(now.getFullYear(), now.getMonth() + offset, 1));
  const last = toDateKey(new Date(now.getFullYear(), now.getMonth() + offset + 1, 0));
  return start <= last && end >= first;
}
function renderAgendaGroups(visits){
 const mode=document.getElementById('marketAgendaGroup').value,now=startOfToday(),today=toDateKey(now),month=today.slice(0,7),next=toDateKey(new Date(now.getFullYear(),now.getMonth()+1,1)).slice(0,7);
 const groups=new Map();const monthKeys=['In progress','This month','Next month','Later','Date to be confirmed','Past events'];
 if(mode==='month')monthKeys.forEach(k=>groups.set(k,[]));if(mode==='type')Object.values(marketVisitTypes).forEach(k=>groups.set(k,[]));
 for(const v of visits){let key='By date';if(mode==='type')key=marketVisitTypes[v.type];else if(mode==='month'){const end=v.endDate||v.startDate;key=!v.startDate?'Date to be confirmed':end<today?'Past events':v.startDate<today?'In progress':v.startDate.slice(0,7)===month?'This month':v.startDate.slice(0,7)===next?'Next month':'Later';}if(!groups.has(key))groups.set(key,[]);groups.get(key).push(v);}
 return [...groups].filter(([,items])=>items.length).map(([title,items])=>'<section class="agenda-group"><h3>'+escapeHtml(title)+' <span>'+items.length+'</span></h3><div class="agenda-cards">'+items.map(v=>renderMarketVisitCard(v).replace('<article ', '<article data-agenda-type="'+escapeAttribute(v.type)+'" ').replace('<div class="market-card-main">','<div class="market-card-main"><span class="agenda-type">'+escapeHtml(marketVisitTypes[v.type])+'</span>')).join('')+'</div></section>').join('');
}
function updateAgendaFilterButtons() {
  const range = document.getElementById("marketAgendaRange").value;
  const type = document.getElementById("marketAgendaType").value;
  document.querySelectorAll("[data-agenda-range]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.agendaRange === range));
  });
  document.querySelectorAll("[data-agenda-type-filter]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.agendaTypeFilter === type || button.dataset.agendaTypeFilter === "visits" && ["personal", "manufacturer"].includes(type)));
  });
  const advancedCount = [elements.marketManufacturerFilter.value, elements.marketRepFilter.value.trim(), elements.marketStatusFilter.value, elements.marketArchiveFilter.value !== "auto"].filter(Boolean).length;
  const summary = document.querySelector(".agenda-more-filters > summary");
  if (summary) summary.textContent = advancedCount ? `More filters (${advancedCount} selected)` : "More filters";
}

document.querySelectorAll("[data-agenda-range], [data-agenda-type-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    const id = button.hasAttribute("data-agenda-range") ? "marketAgendaRange" : "marketAgendaType";
    document.getElementById(id).value = button.dataset.agendaRange ?? button.dataset.agendaTypeFilter;
    if (!agendaArchiveFilterIsExplicit) elements.marketArchiveFilter.value = "auto";
    activeMarketView = "list";
    activeMarketDetailId = "";
    renderMarketVisits();
  });
});
['marketAgendaType','marketAgendaRange','marketAgendaGroup'].forEach(id=>document.getElementById(id).addEventListener('change',()=>{activeMarketDetailId='';renderMarketVisits();}));
// Keep the existing clear button listener, while resetting the quick filters too.
function clearMarketFilters() {
  agendaArchiveFilterIsExplicit = false;
  elements.marketArchiveFilter.value = "auto";
  activeMarketDetailId = "";
  elements.marketSearch.value = "";
  elements.marketManufacturerFilter.value = "";
  elements.marketRepFilter.value = "";
  elements.marketStatusFilter.value = "";
  elements.marketDateFilter.value = "";
  document.getElementById("marketAgendaType").value = "";
  document.getElementById("marketAgendaRange").value = "upcoming";
  document.getElementById("marketAgendaGroup").value = "month";
  renderMarketVisits();
}
// The original listener holds the earlier function reference, so capture the click.
document.getElementById("clearMarketFilters").addEventListener("click", (event) => {
  event.stopImmediatePropagation();
  clearMarketFilters();
}, true);
elements.marketArchiveFilter.addEventListener("change", (event) => {
  event.stopImmediatePropagation();
  agendaArchiveFilterIsExplicit = elements.marketArchiveFilter.value !== "auto";
  activeMarketDetailId = "";
  renderMarketVisits();
}, true);
updateAgendaFilterButtons();
if(!elements.marketVisitsDialog.hidden)renderMarketVisits();

// Search used a previously registered renderer; route input through the combined agenda.
[elements.marketSearch, elements.marketManufacturerFilter, elements.marketRepFilter, elements.marketStatusFilter].forEach((control) => {
  ['input','change'].forEach(name=>control.addEventListener(name,event=>{event.stopImmediatePropagation();activeMarketDetailId='';renderMarketVisits();},true));
});
