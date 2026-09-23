import { escapeHtml } from '../core/html.js';

export function loadingOverlayHtml(text = 'Loading') {
  return `
    <div class="loading-overlay-host" role="status" aria-live="polite" aria-busy="true">
      <div class="loading-overlay">
        <span class="loading-overlay__spinner" aria-hidden="true"></span>
        <span class="loading-overlay__label">${escapeHtml(text)}</span>
      </div>
    </div>`;
}
