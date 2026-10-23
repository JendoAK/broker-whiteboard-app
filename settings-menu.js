(function () {
  "use strict";
  const layouts = new WeakMap();
  let scheduled = false;
  const observer = new MutationObserver(schedule);

  function kind(button) {
    if (button.matches('[data-open-workspace]')) return 'workspace';
    if (button.matches('[data-my-initials]')) return 'initials';
    if (button.matches('.manager-overview-action')) return 'overview';
    if (button.matches('.manage-team-action')) return 'team';
    if (/^openArchive/.test(button.id)) return 'archive';
    if (/^openTrash/.test(button.id)) return 'trash';
    if (/^exportBackup/.test(button.id)) return 'export';
    if (/^importBackup/.test(button.id)) return 'import';
    if (button.matches('.cloud-download-action')) return 'download';
    if (button.matches('[data-cloud-sync-action]')) return 'merge';
    return 'other';
  }
  const order = ['workspace','initials','overview','team','archive','trash','export','import','merge','download','other'];
  const groups = {workspace:'personal',initials:'personal',overview:'team',team:'team',archive:'records',trash:'records',export:'tools',import:'tools',merge:'tools',download:'tools',other:'other'};

  function group(panel, label, name) {
    const section = document.createElement('section');
    section.className = 'settings-group settings-group-' + name;
    const heading = document.createElement('h3'); heading.textContent = label;
    const body = document.createElement('div'); body.className = 'settings-group-items';
    section.append(heading,body); panel.append(section);
    return {section,body};
  }
  function setTools(layout, open) {
    layout.toggle.setAttribute('aria-expanded',String(open));
    layout.tools.body.hidden = !open;
  }
  function mount(panel, index) {
    const title = document.createElement('h2'); title.className = 'settings-panel-title'; title.textContent = 'Settings'; panel.prepend(title);
    const personal = group(panel,'My settings','personal');
    const team = group(panel,'Team management','team');
    const records = group(panel,'Archive & trash','records');
    const other = group(panel,'More options','other');
    const tools = group(panel,'','tools'); tools.section.querySelector('h3').remove();
    const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'settings-tools-toggle'; toggle.dataset.settingsToggle = '';
    toggle.innerHTML = '<span>Data tools<small>Backups and cloud sync</small></span><span class="settings-tools-chevron" aria-hidden="true"></span>';
    tools.body.id = 'settings-data-tools-' + index;
    toggle.setAttribute('aria-controls',tools.body.id); tools.section.prepend(toggle);
    const layout = {personal,team,records,other,tools,toggle};
    setTools(layout,false); toggle.addEventListener('click',()=>setTools(layout,toggle.getAttribute('aria-expanded') !== 'true'));
    panel.classList.add('settings-organized');
    const menu = panel.closest('details.settings-menu');
    menu?.addEventListener('toggle',()=>{
      if (!menu.open) { setTools(layout,false); return; }
      document.querySelectorAll('details.settings-menu[open]').forEach(otherMenu=>{if(otherMenu!==menu)otherMenu.open=false;});
      panel.style.maxHeight = Math.max(120,window.innerHeight-panel.getBoundingClientRect().top-12) + 'px';
    });
    layouts.set(panel,layout); return layout;
  }
  function organize(panel,index) {
    const layout = layouts.get(panel) || mount(panel,index);
    const buttons = [...panel.querySelectorAll('button:not([data-settings-toggle])')];
    buttons.sort((a,b)=>order.indexOf(kind(a))-order.indexOf(kind(b)));
    for (const button of buttons) {
      const type = kind(button);
      if (button.dataset.settingsKind !== type) button.dataset.settingsKind = type;
    }
    for (const name of ['personal','team','records','other','tools']) {
      const section = layout[name];
      buttons.filter(button=>groups[kind(button)]===name).forEach((button,index)=>{
        const current = section.body.children[index];
        if (current !== button) section.body.insertBefore(button,current || null);
      });
      const visible = [...section.body.querySelectorAll('button')].some(button=>!button.hidden);
      section.section.hidden = !visible;
      if (name === 'tools' && !visible) setTools(layout,false);
    }
  }
  function refresh() {
    scheduled = false; observer.disconnect();
    // Existing authorization owns visibility, including controls inserted late.
    window.foodBrokerBaseAuth?.syncSettingsAccess?.();
    const panels = [...document.querySelectorAll('.settings-panel')];
    panels.forEach(organize);
    panels.forEach(panel=>observer.observe(panel,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']}));
  }
  function schedule() { if (!scheduled) {scheduled=true;requestAnimationFrame(refresh);} }
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    document.querySelectorAll('details.settings-menu[open]').forEach(menu=>{menu.open=false;menu.querySelector('summary')?.focus();});
  });
  document.addEventListener('pointerdown',event=>{
    document.querySelectorAll('details.settings-menu[open]').forEach(menu=>{if(!menu.contains(event.target))menu.open=false;});
  });
  window.addEventListener('foodbrokerbase:auth',schedule);
  window.addEventListener('foodbrokerbase:workspace-ready',schedule);
  refresh();
})();
