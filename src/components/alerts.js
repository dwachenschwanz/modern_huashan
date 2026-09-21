/*
 * Replaces angular-ui-bootstrap's <alert> directive: a dismissible Bootstrap
 * alert. `alerts` is an array of `{ type, msg }`; `renderAlerts` produces the
 * markup and `wireAlertClose` wires each alert's close (×) button to splice
 * it out of the backing array and re-render via `rerender`.
 */
import { escapeHtml } from '../core/html.js';

export function renderAlerts(alerts, { icon = 'fa fa-exclamation-triangle fa-lg', prefix = '' } = {}) {
  return alerts
    .map(
      (alert, i) => `
      <div class="alert alert-${escapeAttr(alert.type)} animated shake" data-alert-index="${i}">
        <button type="button" class="close" data-alert-close="${i}"><span aria-hidden="true">&times;</span></button>
        <i class="${icon}"></i> ${prefix ? `<b>${prefix}</b> ` : ''}${escapeHtml(alert.msg)}
      </div>`
    )
    .join('');
}

export function wireAlertClose(container, alerts, rerender) {
  container.querySelectorAll('[data-alert-close]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-alert-close'));
      alerts.splice(idx, 1);
      rerender();
    });
  });
}

function escapeAttr(str) {
  return escapeHtml(str);
}
