import { HuashanApiError, isRequestAborted } from '../api/huashanClient.js';

const BANNER_ID = 'api-error-banner';

function removeBanner() {
  document.getElementById(BANNER_ID)?.remove();
}

function showBanner(message) {
  removeBanner();
  const banner = document.createElement('div');
  banner.id = BANNER_ID;
  banner.className = 'api-error-banner alert alert-danger';
  banner.setAttribute('role', 'alert');

  const text = document.createElement('span');
  text.textContent = message;
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'close';
  close.setAttribute('aria-label', 'Close');
  close.innerHTML = '<span aria-hidden="true">&times;</span>';
  close.addEventListener('click', removeBanner);

  banner.append(close, text);
  document.body.append(banner);
}

export function initApiErrorBoundary() {
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    if (!(error instanceof HuashanApiError)) return;
    event.preventDefault();
    if (isRequestAborted(error)) return;
    console.error(error);
    showBanner(error.message);
  });
}
