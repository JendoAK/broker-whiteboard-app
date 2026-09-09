"use strict";
// Personal data stays in this viewer; never put it into the editor or sync cache.
window.openTeamMemberWork = async function (profile) {
  const auth = window.foodBrokerBaseAuth;
  if (!auth?.isAdmin()) return;
  const viewerUserId = auth.getCurrentUser()?.id;
  let dialog = document.querySelector('#teamWorkDialog');
  if (!dialog) {
    dialog = document.createElement('dialog'); dialog.id = 'teamWorkDialog'; dialog.className = 'note-dialog';
    document.body.appendChild(dialog);
    dialog.addEventListener('close', () => dialog.replaceChildren());
  }
  const requestId = crypto.randomUUID(); dialog.dataset.requestId = requestId;
  dialog.replaceChildren();
  const header = document.createElement('div'); header.className = 'form-header';
  const heading = document.createElement('h2'); heading.textContent = `${profile.display_name || profile.email} — Personal work`;
  const close = document.createElement('button'); close.type = 'button'; close.className = 'ghost-action'; close.textContent = 'Close'; close.onclick = () => dialog.close();
  header.append(heading, close); dialog.append(header);
  const notice = document.createElement('p'); notice.textContent = 'Read only · Leads, to-dos, vendor reports, and personal market visits'; dialog.append(notice);
  const search = document.createElement('input'); search.type = 'search'; search.placeholder = 'Search this member’s work'; search.setAttribute('aria-label','Search this member’s work'); dialog.append(search);
  const content = document.createElement('div'); content.textContent = 'Loading…'; dialog.append(content); dialog.showModal();
  try {
    const { data, error } = await auth.client.rpc('get_team_member_work', { target_user: profile.user_id });
    if (dialog.dataset.requestId !== requestId || !dialog.open || auth.getCurrentUser()?.id !== viewerUserId || !auth.isAdmin()) return;
    if (error) throw error;
    const sections = [
      ['Leads','broker-whiteboard-cards'], ['To-Do List','broker-whiteboard-todos'],
      ['Vendor Reports','broker-whiteboard-manual-vendor-reports'], ['Personal Market Visits','broker-whiteboard-market-visits-personal']
    ];
    const values = new Map((data || []).map(row => [row.record_key, row.data?.value ?? row.data]));
    if (!values.has('broker-whiteboard-market-visits-personal')) values.set('broker-whiteboard-market-visits-personal',values.get('broker-whiteboard-market-visits-pc'));
    const render = () => {
      content.replaceChildren();
      for (const [label,key] of sections) {
        const section = document.createElement('section'); const title = document.createElement('h3');
        const items = Array.isArray(values.get(key)) ? values.get(key) : [];
        const filtered = items.filter(item => JSON.stringify(item, (name,value) => name === 'data' ? undefined : value).toLowerCase().includes(search.value.trim().toLowerCase()));
        title.textContent = `${label} (${filtered.length})`; section.append(title);
        if (!filtered.length) { const empty=document.createElement('p'); empty.textContent='No matching records.'; section.append(empty); }
        filtered.forEach(item => {
          const details=document.createElement('details'); const summary=document.createElement('summary');
          summary.textContent = [item.account || item.name || item.title || item.productShown || 'Record', item.status, item.archivedAt && 'Archived', item.deletedAt && 'In trash'].filter(Boolean).join(' · ');
          details.append(summary, renderTeamWorkValue(item)); section.append(details);
        });
        content.append(section);
      }
    };
    search.addEventListener('input',render); render();
  } catch (error) { if (dialog.open && dialog.dataset.requestId === requestId) content.textContent = `Could not load this member’s work. ${error.message || 'Please try again.'}`; }
};

function renderTeamWorkValue(value) {
  const container=document.createElement('div');
  if (value === null || value === undefined) return container;
  if (typeof value !== 'object') { container.textContent=String(value); return container; }
  if (value.name && typeof value.data === 'string' && value.data.startsWith('data:image/')) {
    const image=document.createElement('img'); image.src=value.data; image.alt=value.name; image.loading='lazy'; image.style.maxWidth='100%'; container.append(image);
  }
  const hidden = new Set(['id','key','recordId','ownerId','data','_audit','productIds','operatorId','callId','leadId']);
  for (const [key,entry] of Object.entries(value)) {
    if (hidden.has(key) || entry === '' || entry == null || (Array.isArray(entry) && !entry.length)) continue;
    const row=document.createElement('div'); row.className='team-work-field';
    const label=document.createElement('strong'); label.textContent=Array.isArray(value) ? `Item ${Number(key)+1}` : key.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/^./,x=>x.toUpperCase());
    row.append(label,renderTeamWorkValue(entry)); container.append(row);
  }
  return container;
}
window.addEventListener('foodbrokerbase:auth', () => { const dialog=document.querySelector('#teamWorkDialog'); if (dialog?.open) dialog.close(); });
