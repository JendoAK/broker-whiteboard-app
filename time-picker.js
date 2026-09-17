"use strict";
function parsePickerTime(value) {
  const match = String(value || '').trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return '';
  let hour = Number(match[1]); const minute = Number(match[2] || 0);
  if (minute > 59 || hour > (match[3] ? 12 : 23) || (match[3] && hour < 1)) return '';
  if (match[3]) hour = hour % 12 + (match[3].toLowerCase() === 'pm' ? 12 : 0);
  return String(hour).padStart(2,'0') + ':' + String(minute).padStart(2,'0');
}
function pickerTimeLabel(value) {
  const time = parsePickerTime(value); if (!time) return value || '';
  const [h,m] = time.split(':').map(Number);
  return (h % 12 || 12) + ':' + String(m).padStart(2,'0') + (h >= 12 ? ' PM' : ' AM');
}
function setupFriendlyTimePickers(root = document) {
  root.querySelectorAll('input[type="time"], #marketStartTime, #marketEndTime, select[data-call-start], select[data-call-end], select[data-appointment-start], select[data-appointment-end]').forEach(source => {
    if (source.dataset.friendlyTime) return;
    source.dataset.friendlyTime = 'true';
    const native = source.type === 'time'; const required = source.required;
    const wrapper = document.createElement('span'); wrapper.className = 'friendly-time';
    source.after(wrapper); source.hidden = true; source.required = false;
    const input = document.createElement('input'); input.type = 'text'; input.autocomplete = 'off'; input.placeholder = '10:00 AM'; input.required = required;
    input.setAttribute('aria-label', source.closest('label')?.querySelector('span')?.textContent || source.getAttribute('aria-label') || 'Time');
    const button = document.createElement('button'); button.type = 'button'; button.className = 'time-toggle'; button.textContent = '▾'; button.setAttribute('aria-label','Choose time'); button.setAttribute('aria-expanded','false');
    const list = document.createElement('span'); list.className = 'time-choices'; list.hidden = true; list.id = 'time-options-' + crypto.randomUUID(); button.setAttribute('aria-controls',list.id);
    wrapper.append(input,button,list);
    const refresh = () => { input.value = pickerTimeLabel(source.value); input.disabled = source.disabled; button.disabled = source.disabled; input.setCustomValidity(''); };
    const save = () => {
      const value = parsePickerTime(input.value);
      input.setCustomValidity(input.value.trim() && !value ? 'Enter a time such as 10:15 AM or 14:30.' : '');
      const result = value ? (native ? value : pickerTimeLabel(value)) : '';
      if (source.tagName === 'SELECT' && result && ![...source.options].some(o=>o.value===result)) source.add(new Option(result,result));
      source.value = result;
      source.dispatchEvent(new Event('input',{bubbles:true})); source.dispatchEvent(new Event('change',{bubbles:true}));
    };
    const close = () => {list.hidden=true;button.setAttribute('aria-expanded','false');};
    for(let minutes=0;minutes<1440;minutes+=30){
      const value=String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0');
      const option=document.createElement('button');option.type='button';option.textContent=pickerTimeLabel(value);option.dataset.time=value;
      option.onclick=()=>{input.value=option.textContent;save();close();input.focus();};list.append(option);
    }
    button.onclick=()=>{const opening=list.hidden;close();if(opening){list.hidden=false;button.setAttribute('aria-expanded','true');const selected=parsePickerTime(input.value)||'08:00';const option=[...list.children].find(o=>o.dataset.time>=selected)||list.lastElementChild;list.scrollTop=option.offsetTop-list.offsetTop;option.focus();}};
    input.addEventListener('input',save);input.addEventListener('blur',()=>{save();if(parsePickerTime(input.value))input.value=pickerTimeLabel(input.value);});
    wrapper.addEventListener('keydown',event=>{if(event.key==='Escape'&&!list.hidden){event.preventDefault();event.stopPropagation();close();input.focus();}if(event.target.parentElement===list&&['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();const items=[...list.children];let i=items.indexOf(event.target);i=event.key==='Home'?0:event.key==='End'?items.length-1:Math.max(0,Math.min(items.length-1,i+(event.key==='ArrowDown'?1:-1)));items[i].focus();}});
    wrapper.addEventListener('focusout',()=>setTimeout(()=>{if(!wrapper.contains(document.activeElement))close();},0));
    source.form?.addEventListener('reset',()=>setTimeout(refresh,0));
    const dialog=source.closest('dialog');if(dialog)new MutationObserver(()=>{if(dialog.open)refresh();else close();}).observe(dialog,{attributes:true,attributeFilter:['open']});
    refresh();
  });
}
window.addEventListener('DOMContentLoaded',()=>{setupFriendlyTimePickers();new MutationObserver(()=>setupFriendlyTimePickers()).observe(document.body,{childList:true,subtree:true});});
