"use strict";
// Pause incoming refreshes while an editor owns focus or a dialog has a draft.
const appDraftForms = new Set();
let appRefreshPending = false;
let appRefreshResumeTimer;
function isAppEditing() {
  const active = document.activeElement;
  if (active && !active.disabled && !active.readOnly && (active.isContentEditable || active.matches('textarea,select,input:not([type=button]):not([type=submit]):not([type=reset]):not([type=hidden])'))) return true;
  for (const form of appDraftForms) {
    const dialog = form.closest('dialog');
    if (!form.isConnected || (dialog && !dialog.open)) appDraftForms.delete(form);
    else return true;
  }
  return false;
}
function resumeAppRefresh() {
  clearTimeout(appRefreshResumeTimer);
  appRefreshResumeTimer = setTimeout(() => {
    if (isAppEditing()) return;
    if (appRefreshPending) { appRefreshPending = false; renderAfterCloudSync(); }
    refreshCloudSectionsIfChanged();
  }, 1000);
}
document.addEventListener('input', event => {
  const form = event.target.closest('form');
  if (form?.closest('dialog[open]')) appDraftForms.add(form);
}, true);
document.addEventListener('change', event => {
  const form = event.target.closest('form');
  if (form?.closest('dialog[open]')) appDraftForms.add(form);
}, true);
document.addEventListener('reset', event => { appDraftForms.delete(event.target); resumeAppRefresh(); }, true);
document.addEventListener('focusout', resumeAppRefresh, true);
document.addEventListener('close', resumeAppRefresh, true);
document.addEventListener('submit', () => setTimeout(resumeAppRefresh, 0), true);
function appScrollPath(element) {
  const parts=[];
  while (element && element !== document.documentElement) {
    if (element.id) { parts.unshift('#'+CSS.escape(element.id)); return parts.join(' > '); }
    const parent=element.parentElement;
    if (!parent) return '';
    parts.unshift(element.tagName.toLowerCase()+':nth-child('+([...parent.children].indexOf(element)+1)+')');
    element=parent;
  }
  return 'html > '+parts.join(' > ');
}
function captureAppScroll() {
  return [...document.querySelectorAll('body *'),document.scrollingElement].filter(element=>element && (element.scrollTop || element.scrollLeft)).map(element=>({element,path:appScrollPath(element),top:element.scrollTop,left:element.scrollLeft}));
}
function restoreAppScroll(saved) {
  saved.forEach(item=>{
    const element=item.element.isConnected ? item.element : document.querySelector(item.path);
    if (element) { element.scrollTop=item.top; element.scrollLeft=item.left; }
  });
}
