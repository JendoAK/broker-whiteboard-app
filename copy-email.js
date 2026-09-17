"use strict";
const emailProductCodeChoices = {apn:'US Foods APNs',supc:'Sysco SUPCs',mf:'Manufacturer numbers (MF#)','mf-apn':'MF# + US Foods APN','mf-supc':'MF# + Sysco SUPC',all:'All codes'};
function buildProductEmail(visit, mode, includeNotes) {
  const products = getMarketVisitProducts(visit).map(product => ({...product,
    manufacturerNumber: product.manufacturerNumber || 'Not assigned', apn: product.apn || 'Not assigned', supc: product.supc || 'Not assigned',
    notes: visit.type === 'testkitchen' ? visit.productNotes?.[product.id]?.note || '' : product.notes || ''}));
  const doc = new DOMParser().parseFromString(renderVisitProductPrintTable(products, mode, includeNotes), 'text/html');
  const table = doc.querySelector('table');
  table.setAttribute('style','border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:14px;color:#222;background:#fff;');
  table.setAttribute('cellspacing','0'); table.setAttribute('cellpadding','8');
  table.querySelectorAll('th,td').forEach(cell => {
    const vendor = cell.parentElement.classList.contains('print-vendor-heading');
    cell.setAttribute('style','border:1px solid #ccc;padding:8px;text-align:left;vertical-align:top;white-space:pre-wrap;' + (vendor ? 'background:#e8d4ae;font-size:16px;font-weight:bold;' : cell.tagName === 'TH' ? 'background:#f4e6dc;font-weight:bold;' : 'background:#fff;font-weight:normal;'));
  });
  const title = getMarketVisitDisplayName(visit);
  const html = '<div style="font-family:Arial,sans-serif;color:#222"><h2 style="font-family:Arial,sans-serif;font-size:20px;margin:0 0 12px">'+escapeHtml(title)+'</h2>'+table.outerHTML+'</div>';
  const text = title + '\n\n' + [...table.rows].map(row => [...row.cells].map(cell => cell.textContent).join('\t')).join('\n');
  return {html,text};
}
function openProductEmailCopy(visitId) {
  const visit = marketVisits.find(item => item.id === visitId); if (!visit) return;
  const dialog = createVisitDialog('Copy product list for email');
  const body = dialog.querySelector('[data-visit-entry-body]');
  let preferences = {};try {preferences=JSON.parse(localStorage.getItem('foodbrokerbase-email-product-options') || '{}');}catch{}
  body.innerHTML = '<div class="field-grid"><label><span>Product codes</span><select data-email-codes>'+Object.entries(emailProductCodeChoices).map(([value,label])=>'<option value="'+value+'">'+label+'</option>').join('')+'</select></label><label style="display:flex;align-items:center;gap:8px"><input type="checkbox" data-email-notes style="width:auto" /><span>Include product notes</span></label></div><p>Copy this editable table, then paste it into your email with Ctrl+V. Missing product codes show “Not assigned”.</p><div data-email-preview style="max-height:340px;overflow:auto;border:1px solid #c5b6a5;padding:10px;background:white;margin:12px 0"></div><p data-email-status role="status"></p><div class="form-actions"><button type="button" class="ghost-action" data-email-close>Close</button><button type="button" class="primary-action" data-email-copy>Copy</button></div>';
  const codes=body.querySelector('[data-email-codes]'),notes=body.querySelector('[data-email-notes]'),preview=body.querySelector('[data-email-preview]'),status=body.querySelector('[data-email-status]'),button=body.querySelector('[data-email-copy]');
  codes.value=Object.hasOwn(emailProductCodeChoices,preferences.mode)?preferences.mode:'apn';notes.checked=preferences.notes!==false;
  const refresh=()=>{preview.innerHTML=buildProductEmail(visit,codes.value,notes.checked).html;status.textContent='';};
  codes.onchange=refresh;notes.onchange=refresh;body.querySelector('[data-email-close]').onclick=()=>dialog.close();
  const selectPreview=()=>{const range=document.createRange();range.selectNodeContents(preview);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);};
  button.onclick=async()=>{
    button.disabled=true;
    const current=marketVisits.find(item=>item.id===visitId);if(!current){status.textContent='This event is no longer available.';button.disabled=false;return;}
    const content=buildProductEmail(current,codes.value,notes.checked);preview.innerHTML=content.html;
    let copied=false;
    try {
      if(navigator.clipboard?.write && window.ClipboardItem){await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([content.html],{type:'text/html'}),'text/plain':new Blob([content.text],{type:'text/plain'})})]);copied=true;}
    }catch{}
    if(!copied){selectPreview();try{copied=document.execCommand('copy');}catch{}}
    if(copied){try{localStorage.setItem('foodbrokerbase-email-product-options',JSON.stringify({mode:codes.value,notes:notes.checked}));}catch{}status.textContent='Copied! Paste into your email with Ctrl+V. Use Keep source formatting if prompted.';}
    else {selectPreview();status.textContent='Automatic copying is unavailable in this browser. The table is selected—press Ctrl+C, then paste into your email.';}
    button.disabled=false;
  };
  refresh();dialog.showModal();
}
