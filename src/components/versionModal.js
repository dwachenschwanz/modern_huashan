/*
 * Ported from the `huashanVersion` directive + versionModalInstanceCtrl:
 * an "About" link in the nav bar that opens a modal listing the changelog.
 */
import { getVersions } from '../core/versions.js';
import { showModal, hideModal } from './uiInteractions.js';
import { escapeHtml } from '../core/html.js';

export function versionNavItemHtml() {
  return `<li><a href="#" id="huashan-about-link">About</a></li>`;
}

function modalHtml() {
  const versions = getVersions();
  const body = versions
    .map(
      (v) => `
        <div>
          <h3>${v.versionNo}</h3>
          <ul>${v.ChangeLog.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}</ul>
        </div>`
    )
    .join('');

  return `
<div class="modal fade" id="huashanVersionModal" tabindex="-1" role="dialog" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span></button>
        <h3 class="modal-title">About Huashan</h3>
      </div>
      <div class="modal-body">${body}</div>
      <div class="modal-footer">
        <button class="btn btn-primary" data-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
</div>`;
}

/** Mounts the About link's modal (appended to <body>) and wires the click
 * handler on `linkEl`. Returns a cleanup function. */
export function initVersionModal(linkEl) {
  let modalEl = document.getElementById('huashanVersionModal');
  if (!modalEl) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalHtml();
    modalEl = wrapper.firstElementChild;
    document.body.appendChild(modalEl);
  }
  const handler = (evt) => {
    evt.preventDefault();
    showModal(modalEl);
  };
  linkEl.addEventListener('click', handler);
  return () => {
    linkEl.removeEventListener('click', handler);
    hideModal(modalEl);
    modalEl.remove();
  };
}
