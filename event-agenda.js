"use strict";
function renderMarketVisits() {
  if (isFoodshowFieldEditing()) return;
  const foodshowScroll = captureFoodshowScroll();
  updateMarketVisitControls();
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
  return marketVisits
    .filter((visit) => {
      const type=document.getElementById('marketAgendaType').value;if(type && visit.type!==type)return false;
      if(elements.marketArchiveFilter.value!=='archived' && activeMarketView!=='calendar' && !agendaDateMatches(visit))return false;
      if (Boolean(visit.archivedAt) !== (elements.marketArchiveFilter.value === "archived")) return false;
      if (!query) return true;
      const products = getMarketVisitProducts(visit).map((product) => product.description).join(" ");
      const operators = getMarketVisitOperators(visit).map((operator) => operator.operatorName || getOperatorName(operator.operatorId)).join(" ");
      return [visit.name, visit.vendor, visit.visitorName, visit.location, visit.salesReps.join(" "), visit.notes, products, operators, ...(visit.attendees || []).map((person) => [person.name, person.organization, person.role, person.contact].join(" "))].some((value) => String(value || "").toLowerCase().includes(query));
    })
    .sort((a, b) => (a.startDate || "9999-12-31").localeCompare(b.startDate || "9999-12-31"));
}


function agendaDateMatches(v){
 const mode=document.getElementById('marketAgendaRange').value,today=toDateKey(startOfToday()),start=v.startDate,end=v.endDate||start;
 if(mode==='all')return true;if(!start)return mode==='upcoming';if(mode==='past')return end<today;
 if(mode==='upcoming')return end>=today;
 const now=startOfToday(),offset=mode==='next'?1:0,first=toDateKey(new Date(now.getFullYear(),now.getMonth()+offset,1)),last=toDateKey(new Date(now.getFullYear(),now.getMonth()+offset+1,0));return start<=last&&end>=first;
}
function renderAgendaGroups(visits){
 const mode=document.getElementById('marketAgendaGroup').value,now=startOfToday(),today=toDateKey(now),month=today.slice(0,7),next=toDateKey(new Date(now.getFullYear(),now.getMonth()+1,1)).slice(0,7);
 const groups=new Map();const monthKeys=['In progress','This month','Next month','Later','Date to be confirmed','Past events'];
 if(mode==='month')monthKeys.forEach(k=>groups.set(k,[]));if(mode==='type')Object.values(marketVisitTypes).forEach(k=>groups.set(k,[]));
 for(const v of visits){let key='By date';if(mode==='type')key=marketVisitTypes[v.type];else if(mode==='month'){const end=v.endDate||v.startDate;key=!v.startDate?'Date to be confirmed':end<today?'Past events':v.startDate<today?'In progress':v.startDate.slice(0,7)===month?'This month':v.startDate.slice(0,7)===next?'Next month':'Later';}if(!groups.has(key))groups.set(key,[]);groups.get(key).push(v);}
 return [...groups].filter(([,items])=>items.length).map(([title,items])=>'<section class="agenda-group"><h3>'+escapeHtml(title)+' <span>'+items.length+'</span></h3><div class="agenda-cards">'+items.map(v=>renderMarketVisitCard(v).replace('<article ', '<article data-agenda-type="'+escapeAttribute(v.type)+'" ').replace('<div class="market-card-main">','<div class="market-card-main"><span class="agenda-type">'+escapeHtml(marketVisitTypes[v.type])+'</span>')).join('')+'</div></section>').join('');
}
['marketAgendaType','marketAgendaRange','marketAgendaGroup'].forEach(id=>document.getElementById(id).addEventListener('change',()=>{activeMarketDetailId='';renderMarketVisits();}));
document.getElementById('clearMarketFilters').addEventListener('click',()=>{document.getElementById('marketAgendaType').value='';document.getElementById('marketAgendaRange').value='upcoming';document.getElementById('marketAgendaGroup').value='month';},true);
if(!elements.marketVisitsDialog.hidden)renderMarketVisits();

// Search used a previously registered renderer; route input through the combined agenda.
['input','change'].forEach(name=>elements.marketSearch.addEventListener(name,event=>{event.stopImmediatePropagation();activeMarketDetailId='';renderMarketVisits();},true));
