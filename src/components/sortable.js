/*
 * Vanilla drag-reorder helper, replacing angular-ui-sortable (`ui-sortable`)
 * which wrapped jQuery UI's sortable widget. Uses native HTML5 drag & drop.
 *
 * `container`: element whose direct children (matching `itemSelector`) become
 * draggable. While dragging, this helper reorders the DOM nodes live (like
 * jQuery UI sortable did) so the UI stays in sync during the drag. On drop,
 * `onReorder(orderedElements)` is called with the item elements in their new
 * DOM order; read whatever data attribute (e.g. `dataset.id`) you put on each
 * item to rebuild your backing array in the new order.
 */
export function makeSortable(container, { itemSelector = ':scope > *', onReorder } = {}) {
  let dragEl = null;

  function items() {
    return Array.from(container.querySelectorAll(itemSelector));
  }

  function handleDragStart(evt) {
    const item = evt.target.closest(itemSelector);
    if (!item || item.parentElement !== container) return;
    dragEl = item;
    evt.dataTransfer.effectAllowed = 'move';
    try {
      evt.dataTransfer.setData('text/plain', '');
    } catch (e) {
      // some browsers require data to be set; ignore failures
    }
    item.classList.add('dragging');
  }

  function handleDragOver(evt) {
    if (!dragEl) return;
    const target = evt.target.closest(itemSelector);
    if (!target || target === dragEl || target.parentElement !== container) return;
    evt.preventDefault();
    const rect = target.getBoundingClientRect();
    const before = evt.clientY - rect.top < rect.height / 2;
    container.insertBefore(dragEl, before ? target : target.nextSibling);
  }

  function handleDragEnd() {
    if (!dragEl) return;
    dragEl.classList.remove('dragging');
    dragEl = null;
  }

  function handleDrop(evt) {
    evt.preventDefault();
  }

  container.querySelectorAll(itemSelector).forEach((el) => {
    el.setAttribute('draggable', 'true');
  });
  container.addEventListener('dragstart', handleDragStart);
  container.addEventListener('dragover', handleDragOver);
  container.addEventListener('drop', handleDrop);
  container.addEventListener('dragend', () => {
    const finalOrder = items();
    handleDragEnd();
    if (onReorder) onReorder(finalOrder);
  });

  return {
    refresh() {
      container.querySelectorAll(itemSelector).forEach((el) => {
        el.setAttribute('draggable', 'true');
      });
    },
    destroy() {
      container.removeEventListener('dragstart', handleDragStart);
      container.removeEventListener('dragover', handleDragOver);
      container.removeEventListener('drop', handleDrop);
    },
  };
}
