import { isRequestAborted } from '../api/huashanClient.js';
import { escapeHtml } from '../core/html.js';

export function loadErrorMessage(error, fallback = 'The requested data could not be loaded.') {
  if (error && typeof error.message === 'string' && error.message.trim()) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  return fallback;
}

export function handleLoadError(error, state, render) {
  if (isRequestAborted(error)) return false;
  console.error(error);
  state.loadError = loadErrorMessage(error);
  render();
  return true;
}

export function requireResponseResult(response, operation) {
  if (!response || response.status !== true) {
    throw new Error((response && response.msg) || `${operation} failed.`);
  }
  if (response.result == null) throw new Error(`${operation} returned no data.`);
  return response.result;
}

export function loadErrorHtml({ title = 'Data could not be loaded.', message, retryId }) {
  return `
    <div class="container-fluid" style="padding-top:15px">
      <div class="alert alert-danger" role="alert">
        <b>${escapeHtml(title)}</b>
        <div>${escapeHtml(message)}</div>
      </div>
      <button type="button" class="btn btn-primary" id="${escapeHtml(retryId)}">Retry</button>
    </div>`;
}
