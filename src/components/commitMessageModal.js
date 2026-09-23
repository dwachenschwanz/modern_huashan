/*
 * Ported from the `commitMessageModal` directive shared by appstructure,
 * datastructure, json, and portfolioStructure views. Renders the modal
 * markup (call `commitMessageModalHtml()` once into the view template) and
 * wires the "Ok" button to `onSave(commitMessage)`.
 */
import { hideModal } from './uiInteractions.js';

export function commitMessageModalHtml() {
  return `
<div class="modal fade" id="commitMessageModal" tabindex="-1" role="dialog" aria-labelledby="commit-message-title" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
        <h4 class="modal-title" id="commit-message-title">Change Message</h4>
      </div>
      <div class="modal-body">
        <h4>You will see this message in the revisions page</h4>
        <textarea class="form form-control" id="commit-display"></textarea>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" id="commit-message-ok">Ok</button>
        <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
      </div>
    </div>
  </div>
</div>`;
}

/** Wires the modal's Ok button. Returns a cleanup function. */
export function initCommitMessageModal(root, onSave) {
  const modalEl = root.querySelector('#commitMessageModal');
  const textarea = root.querySelector('#commit-display');
  const okButton = root.querySelector('#commit-message-ok');
  if (!modalEl || !okButton) return () => {};

  const handler = () => {
    const commitMessage = textarea ? textarea.value : '';
    onSave(commitMessage);
  };
  okButton.addEventListener('click', handler);

  return () => okButton.removeEventListener('click', handler);
}

export function closeCommitMessageModal() {
  hideModal('commitMessageModal');
}
