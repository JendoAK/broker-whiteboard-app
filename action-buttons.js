"use strict";
// Apply the action palette to static controls and controls created by dialogs or lists.
function refreshActionButton(button) {
  const label = (button.textContent || button.getAttribute('aria-label') || '').trim().replace(/^[^A-Za-z]+/, '');
  const action = /^(add|print|upload|download|import|export|save|create|convert|share)\b/i.test(label) || /^\s*[+➕]/u.test(button.textContent || '') || /^add[A-Z]/.test(button.id) || [...button.attributes].some(attr => attr.name.startsWith('data-add-'));
  button.classList.toggle('app-highlight-action', action && !button.matches('.nav-button, .danger-action, .remove-product, [role="tab"]'));
}
function styleActionButtons(root) {
  if (root.nodeType === Node.ELEMENT_NODE && root.matches('button')) refreshActionButton(root);
  root.querySelectorAll?.('button').forEach(refreshActionButton);
}
window.addEventListener('DOMContentLoaded', () => {
  styleActionButtons(document);
  new MutationObserver(records => {
    const roots = new Set();
    for (const record of records) {
      const parent = record.target.nodeType === Node.ELEMENT_NODE ? record.target : record.target.parentElement;
      const button = parent?.closest('button');
      if (button) roots.add(button);
      record.addedNodes.forEach(node => { if (node.nodeType === Node.ELEMENT_NODE) roots.add(node); });
    }
    roots.forEach(styleActionButtons);
  }).observe(document.body, {childList: true, subtree: true, characterData: true});
});
