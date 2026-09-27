/* A search input with a clear button.
 *
 * Clearing dispatches a synthetic `input` event, so each view's existing
 * `input` listener updates its own state and re-renders without needing to
 * know this control exists. The click handler is delegated from the document
 * for the same reason: several views replace their whole container on every
 * keystroke, so a listener bound to the button itself would not survive. */
import { escapeAttr } from '../core/html.js';

export function searchFieldHtml({ id, value = '', placeholder = 'Search' }) {
  return `<div class="search-field">
      <input type="text" class="form-control" id="${escapeAttr(id)}" placeholder="${escapeAttr(placeholder)}" value="${escapeAttr(value)}">
      ${searchClearButtonHtml(id)}
    </div>`;
}

export function searchClearButtonHtml(id) {
  return `<button type="button" class="search-field-clear" data-clears="${escapeAttr(id)}" tabindex="-1" aria-label="Clear search"><i class="fa fa-times-circle" aria-hidden="true"></i></button>`;
}

export function initSearchFieldClears(root = document) {
  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-clears]');
    if (!button) return;
    event.preventDefault();
    const id = button.getAttribute('data-clears');
    const input = document.querySelector(`[id="${id}"]`);
    if (!input || !input.value) return;
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    // The view may have re-rendered in response and replaced the input.
    document.querySelector(`[id="${id}"]`)?.focus();
  });
}
