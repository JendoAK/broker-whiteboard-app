"use strict";
// Pointer capture avoids the browser's native drag session getting stuck on cards.
window.addEventListener("DOMContentLoaded", () => {
  const board = document.getElementById("todoBoard");
  let gesture = null;
  let suppressClickUntil = 0;
  const targetAt = (x, y) => document.elementFromPoint(x, y)?.closest("[data-todo-status], #todoArchiveDrop");
  const highlight = target => {
    document.querySelectorAll(".todo-column.drag-over, #todoArchiveDrop.drag-over")
      .forEach(node => { if (node !== target) node.classList.remove("drag-over"); });
    target?.classList.add("drag-over");
  };
  const cleanup = () => {
    const old = gesture;
    gesture = null;
    if (!old) return;
    cancelAnimationFrame(old.frame);
    old.ghost?.remove();
    if (board.hasPointerCapture(old.pointerId)) board.releasePointerCapture(old.pointerId);
    if (old.active) suppressClickUntil = performance.now() + 400;
    clearTodoDragState();
  };
  const tick = () => {
    const g = gesture;
    if (!g?.active) return;
    if (!g.card.isConnected || !board.getClientRects().length) { cleanup(); return; }
    // Keep long/wide boards usable while holding the card near an edge.
    const rect = board.getBoundingClientRect();
    const edge = 32;
    const top = Math.max(0, rect.top), bottom = Math.min(innerHeight, rect.bottom);
    const left = Math.max(0, rect.left), right = Math.min(innerWidth, rect.right);
    if (g.x >= left && g.x <= right && g.y >= top && g.y <= bottom) {
      board.scrollBy(g.x < left + edge ? -10 : g.x > right - edge ? 10 : 0,
        g.y < top + edge ? -10 : g.y > bottom - edge ? 10 : 0);
    }
    highlight(targetAt(g.x, g.y));
    g.frame = requestAnimationFrame(tick);
  };
  board.addEventListener("pointerdown", event => {
    if (event.button !== 0 || !event.isPrimary) return;
    const card = event.target.closest(".todo-card[data-todo-id]");
    if (!card || event.target.closest(".card-details, input, select, textarea, a, button:not(.todo-title-button)")) return;
    cleanup();
    gesture = {card, id: card.dataset.todoId, pointerId: event.pointerId,
      startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, active: false};
    // Leave plain clicks alone; capture starts only after crossing the drag threshold.
  });
  document.addEventListener("pointermove", event => {
    const g = gesture;
    if (!g || event.pointerId !== g.pointerId) return;
    if (!event.buttons) { cleanup(); return; }
    g.x = event.clientX; g.y = event.clientY;
    if (!g.active && Math.hypot(g.x - g.startX, g.y - g.startY) < 6) return;
    event.preventDefault();
    if (!g.active) {
      g.active = true;
      board.setPointerCapture(g.pointerId);
      draggedTodoId = g.id;
      document.body.classList.add("todo-drag-active");
      g.card.classList.add("dragging");
      g.ghost = document.createElement("div");
      g.ghost.className = "todo-drag-ghost";
      g.ghost.setAttribute("aria-hidden", "true");
      g.ghost.textContent = g.card.querySelector(".todo-title-button").textContent;
      (board.closest("dialog") || document.body).append(g.ghost);
      g.frame = requestAnimationFrame(tick);
    }
    g.ghost.style.left = (g.x + 12) + "px";
    g.ghost.style.top = (g.y + 12) + "px";
    highlight(targetAt(g.x, g.y));
  }, {passive: false});
  document.addEventListener("pointerup", event => {
    const g = gesture;
    if (!g || event.pointerId !== g.pointerId) return;
    const target = g.active ? targetAt(event.clientX, event.clientY) : null;
    cleanup();
    if (!target) return;
    event.preventDefault();
    if (target.id === "todoArchiveDrop") {
      if (moveTodoToArchive(g.id)) document.getElementById("todoArchiveNotice").textContent = "Task archived. Click Archive to view or restore it.";
    } else moveTodoToStatus(g.id, target.dataset.todoStatus);
  });
  board.addEventListener("click", event => {
    if (event.detail && performance.now() < suppressClickUntil) {
      event.preventDefault(); event.stopImmediatePropagation();
    }
  }, true);
  // Never start a competing native drag, including from selected title text.
  board.addEventListener("dragstart", event => event.preventDefault());
  document.addEventListener("pointercancel", cleanup);
  board.addEventListener("lostpointercapture", () => { if (gesture?.active) cleanup(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape") cleanup(); });
  window.addEventListener("blur", cleanup);
  document.addEventListener("visibilitychange", () => { if (document.hidden) cleanup(); });
});
