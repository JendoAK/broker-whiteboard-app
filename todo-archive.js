"use strict";
function moveTodoToArchive(id) {
  if (!todos.some(todo => todo.id === id && !todo.archivedAt)) return false;
  const previous = todos;
  todos = todos.map(todo => todo.id === id ? {...todo, archivedAt:new Date().toISOString()} : todo);
  if (!persistTodos()) { todos = previous; return false; }
  renderTodoBoard();
  return true;
}
window.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('todoArchiveDrop');
  const dialog = document.getElementById('todoArchiveDialog');
  const list = document.getElementById('todoArchiveItems');
  const search = document.getElementById('todoArchiveSearch');
  button.querySelector('span').innerHTML = icons.archive;
  const render = () => {
    const query = search.value.trim().toLowerCase();
    const items = todos.filter(todo => todo.archivedAt && [todo.title,todo.notes,todo.account,todo.vendor].join(' ').toLowerCase().includes(query)).sort((a,b) => b.archivedAt.localeCompare(a.archivedAt));
    list.innerHTML = items.map(renderArchivedTodo).join('') || '<p class="empty-state">No archived tasks found.</p>';
    list.querySelectorAll('[data-restore-todo-id]').forEach(control => control.addEventListener('click', () => {
      const previous = todos;
      todos = todos.map(todo => todo.id === control.dataset.restoreTodoId ? {...todo, archivedAt:''} : todo);
      if (!persistTodos()) todos = previous;
      renderTodoBoard(); render();
    }));
    list.querySelectorAll('[data-archive-todo-edit]').forEach(control => control.remove());
  };
  button.addEventListener('click', () => { search.value = ''; render(); dialog.showModal(); });
  button.addEventListener('dragover', event => {
    if (!draggedTodoId) return;
    event.preventDefault(); event.dataTransfer.dropEffect = 'move'; button.classList.add('drag-over');
  });
  button.addEventListener('dragleave', () => button.classList.remove('drag-over'));
  document.addEventListener('dragend', () => button.classList.remove('drag-over'));
  button.addEventListener('drop', event => {
    event.preventDefault(); button.classList.remove('drag-over');
    if (moveTodoToArchive(draggedTodoId)) document.getElementById('todoArchiveNotice').textContent = 'Task archived. Click Archive to view or restore it.';
    draggedTodoId = null;
  });
  search.addEventListener('input', render);
  document.getElementById('closeTodoArchive').addEventListener('click', () => dialog.close());
});
