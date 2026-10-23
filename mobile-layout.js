/* Additive presentation: existing controls and record handlers stay in place. */
(() => {
  'use strict';
  const phone = matchMedia('(max-width: 720px)');
  const makeButton = (label, className) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'mobile-only ' + className;
    button.textContent = label; button.setAttribute('aria-expanded', 'false');
    return button;
  };
  const toggle = (button, target, label) => {
    const expanded = target.classList.toggle('mobile-expanded');
    button.setAttribute('aria-expanded', String(expanded));
    button.textContent = (expanded ? 'Hide ' : 'Show ') + label;
  };
  function enhance() {
    if (!phone.matches) {
      document.querySelectorAll('table.mobile-record-table').forEach(table => {
        table.classList.remove('mobile-record-table');
        table.querySelectorAll('tr[data-mobile-ready]').forEach(row => {
          row.querySelector(':scope > td.mobile-only')?.remove();
          delete row.dataset.mobileReady; row.classList.remove('mobile-expanded');
        });
      });
      return;
    }
    document.querySelectorAll('.main-nav').forEach((nav, index) => {
      let button = nav.previousElementSibling;
      if (!button?.classList.contains('mobile-nav-toggle')) {
        button = makeButton('Sections', 'mobile-nav-toggle');
        nav.id ||= 'mobile-sections-' + index;
        button.setAttribute('aria-controls', nav.id); nav.before(button);
        button.addEventListener('click', () => {
          const open = nav.classList.toggle('mobile-nav-open');
          button.setAttribute('aria-expanded', String(open));
        });
        nav.addEventListener('click', event => {
          if (event.target.closest('button')) {
            nav.classList.remove('mobile-nav-open'); button.setAttribute('aria-expanded', 'false');
          }
        });
      }
      const active = nav.querySelector('[aria-current="page"], .active-view');
      const label = 'Sections · ' + (active?.textContent.trim() || 'Choose section');
      if (button.textContent !== label) button.textContent = label;
    });
    document.querySelectorAll('.controls:not(.mobile-filters)').forEach(panel => {
      panel.classList.add('mobile-filters');
      const search = panel.querySelector('input[type="search"],input[id*="Search"],input[id="searchInput"]');
      if (search) {
        const child = [...panel.children].find(node => node.contains(search));
        child?.classList.add('mobile-search');
      }
      const button = makeButton('Show filters', 'mobile-filter-toggle');
      button.addEventListener('click', () => toggle(button, panel, 'filters'));
      panel.prepend(button);
      const update = () => {
        const count = [...panel.querySelectorAll('select,input:not([type="search"]):not([type="hidden"])')].filter(input => input !== search && !/sort/i.test(input.id) && (input.type === 'checkbox' ? input.checked : input.value !== input.defaultValue && input.value !== '')).length;
        button.textContent = (panel.classList.contains('mobile-expanded') ? 'Hide' : 'Show') + ' filters' + (count ? ' (' + count + ' active)' : '');
      };
      panel.addEventListener('change', update); panel.addEventListener('input', update); update();
    });
    document.querySelectorAll('.summary-grid:not(.mobile-summary),.todo-summary-grid:not(.mobile-summary),.sample-summary-grid:not(.mobile-summary)').forEach(panel => {
      if (panel.children.length <= 2) return;
      panel.classList.add('mobile-summary');
      const button = makeButton('Show more summaries', 'mobile-summary-toggle');
      button.addEventListener('click', () => toggle(button, panel, 'more summaries'));
      panel.append(button);
    });
    document.querySelectorAll('.column:not([data-mobile-column])').forEach(column => {
      column.dataset.mobileColumn = 'true';
      const header = column.querySelector('.column-header');
      const empty = !column.querySelector('.note-card,.todo-card');
      const folded = empty || column.dataset.status === 'Done';
      if (folded) column.classList.add('mobile-folded');
      const button = makeButton(folded ? 'Show' : 'Hide', 'mobile-column-toggle');
      button.setAttribute('aria-label', (folded ? 'Show ' : 'Hide ') + (column.dataset.status || 'column') + ' items');
      button.setAttribute('aria-expanded', String(!folded));
      button.addEventListener('click', () => {
        const hidden = column.classList.toggle('mobile-folded');
        button.textContent = hidden ? 'Show' : 'Hide';
        button.setAttribute('aria-expanded', String(!hidden));
        button.setAttribute('aria-label', (hidden ? 'Show ' : 'Hide ') + (column.dataset.status || 'column') + ' items');
      });
      header?.append(button);
    });
    document.querySelectorAll('[data-calendar-day]').forEach(day => {
      const date = day.querySelector('.calendar-date');
      if (date && !date.dataset.mobileDate) date.dataset.mobileDate = new Date(day.dataset.calendarDay + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    });
    document.querySelectorAll('table.quick-table').forEach(table => {
      if (!table.tHead || !table.tBodies.length) return;
      const headers = [...table.tHead.rows[table.tHead.rows.length - 1].cells].map(cell => cell.textContent.trim());
      if (!table.classList.contains('mobile-record-table')) table.classList.add('mobile-record-table');
      [...table.tBodies].forEach(body => [...body.rows].forEach(row => {
        if (row.dataset.mobileReady || [...row.cells].some(cell => cell.colSpan > 1)) return;
        row.dataset.mobileReady = 'true';
        [...row.cells].forEach((cell, index) => {
          if (headers[index]) cell.dataset.mobileLabel = headers[index];
          // Keep identifying fields and due/status information visible; expand everything else.
          if (index > 1 && !/^(due|status|date|priority)$/i.test(headers[index])) cell.classList.add('mobile-secondary');
        });
        if (row.querySelector('.mobile-secondary')) {
          const cell = row.insertCell(); cell.className = 'mobile-only';
          const button = makeButton('Show details & actions', 'mobile-row-toggle');
          button.addEventListener('click', event => { event.stopPropagation(); toggle(button, row, 'details & actions'); });
          cell.append(button);
        }
      }));
    });
  }
  let queued = false;
  const observer = new MutationObserver(() => {
    if (!phone.matches || queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; enhance(); });
  });
  observer.observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ['aria-current','class']});
  phone.addEventListener('change', enhance);
  enhance();
})();


