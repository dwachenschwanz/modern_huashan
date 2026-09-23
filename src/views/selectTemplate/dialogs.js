import { escapeHtml } from '../../core/html.js';
import { renderAlerts, wireAlertClose } from '../../components/alerts.js';
import { initTooltips } from '../../components/uiInteractions.js';

function updateListHtml(state) {
  if (state.loadingPortfolioNames) return '<div class="loader-small" aria-label="Loading associated portfolios"></div>';
  if (state.portfolioNameLoadError) {
    return `<div class="alert alert-danger" role="alert">${escapeHtml(state.portfolioNameLoadError)}</div><button type="button" class="btn btn-default" id="st-uds-retry">Retry</button>`;
  }
  if (state.portfolioNameList.length === 0) return '<p class="text-muted">No associated portfolios found.</p>';
  return state.portfolioNameList.map((name, index) => `<a href="" class="list-group-item ${state.selectedPortfolioName === name ? 'active' : ''}" data-portfolio-index="${index}" data-toggle="tooltip" title="${escapeHtml(name)}">${escapeHtml(name)}</a>`).join('');
}

function updateFooterHtml(state) {
  return `${state.selectedPortfolioName ? '<button class="btn btn-primary" id="st-uds-run">Run</button>' : ''}<button class="btn btn-default" id="st-uds-close">Close</button>`;
}

function dialogById(container, id) {
  return container.querySelector(`#${id}`) || document.getElementById(id);
}

export function updateDataStructureDialogHtml(state) {
  return `<div class="modal fade" id="updateDataStructureModal" role="dialog" aria-labelledby="updateDataStructureModalLabel" aria-hidden="true">
    <div class="modal-dialog"><div class="modal-content">
      <div class="modal-header"><h4 class="modal-title" id="updateDataStructureModalLabel">Update Data Structure</h4></div>
      <div class="modal-body">
        <h4>Select a Portfolio</h4><div class="list-of-portfolios"><div class="list-group" id="st-uds-list">${updateListHtml(state)}</div></div>
        <h4>Select Leaf / Platform</h4>
        <label><input type="checkbox" id="st-uds-leaf" ${state.updateDataStructure.Leaf ? 'checked' : ''}> Leaf</label><br />
        <label><input type="checkbox" id="st-uds-platform" ${state.updateDataStructure.Platform ? 'checked' : ''}> Platform</label><br />
      </div>
      <div class="modal-footer" id="st-uds-footer">${updateFooterHtml(state)}</div>
    </div></div>
  </div>`;
}

function wireUpdateList(scope, state, onSelect, onRetry) {
  scope?.querySelectorAll('[data-portfolio-index]').forEach((element) => {
    element.addEventListener('click', (event) => {
      event.preventDefault();
      onSelect(state.portfolioNameList[Number(element.dataset.portfolioIndex)]);
    });
  });
  scope?.querySelector('#st-uds-retry')?.addEventListener('click', onRetry);
  if (scope) initTooltips(scope);
}

function wireUpdateFooter(scope, { onRun, onClose }) {
  scope?.querySelector('#st-uds-run')?.addEventListener('click', onRun);
  scope?.querySelector('#st-uds-close')?.addEventListener('click', onClose);
}

export function refreshUpdateDataStructureDialog({ container, state, onSelect, onRetry, onRun, onClose }) {
  const modal = dialogById(container, 'updateDataStructureModal');
  if (!modal) return;
  const list = modal.querySelector('#st-uds-list');
  const footer = modal.querySelector('#st-uds-footer');
  const leaf = modal.querySelector('#st-uds-leaf');
  const platform = modal.querySelector('#st-uds-platform');
  if (list) list.innerHTML = updateListHtml(state);
  if (footer) footer.innerHTML = updateFooterHtml(state);
  if (leaf) leaf.checked = state.updateDataStructure.Leaf;
  if (platform) platform.checked = state.updateDataStructure.Platform;
  wireUpdateList(list, state, onSelect, onRetry);
  wireUpdateFooter(footer, { onRun, onClose });
}

export function wireUpdateDataStructureDialog(args) {
  const modal = dialogById(args.container, 'updateDataStructureModal');
  if (!modal) return;
  modal.querySelector('#st-uds-leaf')?.addEventListener('change', (event) => { args.state.updateDataStructure.Leaf = event.target.checked; });
  modal.querySelector('#st-uds-platform')?.addEventListener('change', (event) => { args.state.updateDataStructure.Platform = event.target.checked; });
  wireUpdateList(modal.querySelector('#st-uds-list'), args.state, args.onSelect, args.onRetry);
  wireUpdateFooter(modal.querySelector('#st-uds-footer'), args);
}

export function renameDialogHtml(state) {
  return `<div class="modal fade" id="renameModal" tabindex="-1" role="dialog" aria-labelledby="renameModalLabel" aria-hidden="true">
    <div class="modal-dialog"><div class="modal-content">
      <div class="modal-header"><button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button><h4 class="modal-title" id="renameModalLabel"><span id="st-rename-title">Rename ${escapeHtml(state.selectedTemplate)}</span></h4></div>
      <div class="modal-body"><h4>New Name:</h4><input type="text" id="st-rename-input" class="form form-control" value="${escapeHtml(state.newTemplateName)}"><div class="col-sm-12 save-alert text-center" id="st-rename-alerts">${renderAlerts(state.renameAlerts)}</div></div>
      <div class="modal-footer"><button class="btn btn-primary" id="st-rename-confirm">Rename</button><button type="button" class="btn btn-default" data-dismiss="modal">Close</button></div>
    </div></div>
  </div>`;
}

export function refreshRenameDialog({ container, state, onAlertClose }) {
  const modal = dialogById(container, 'renameModal');
  const title = modal?.querySelector('#st-rename-title');
  const input = modal?.querySelector('#st-rename-input');
  const alerts = modal?.querySelector('#st-rename-alerts');
  if (title) title.textContent = `Rename ${state.selectedTemplate}`;
  if (input) input.value = state.newTemplateName;
  if (alerts) {
    alerts.innerHTML = renderAlerts(state.renameAlerts);
    wireAlertClose(alerts, state.renameAlerts, onAlertClose);
  }
}

export function deleteDialogHtml(state) {
  return `<div class="modal fade" id="deleteModal" tabindex="-1" role="dialog" aria-labelledby="deleteModalLabel" aria-hidden="true">
    <div class="modal-dialog"><div class="modal-content">
      <div class="modal-header"><button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button><h4 class="modal-title">Delete Template</h4></div>
      <div class="modal-body"><h4 class="modal-title" id="deleteModalLabel">Are you sure to delete <b id="st-delete-name">${escapeHtml(state.selectedTemplate)}</b>?</h4><div class="col-sm-12 save-alert text-center" id="st-delete-alerts">${renderAlerts(state.deleteAlerts)}</div></div>
      <div class="modal-footer"><button class="btn btn-primary" id="st-delete-confirm">Delete</button><button type="button" class="btn btn-default" data-dismiss="modal">Close</button></div>
    </div></div>
  </div>`;
}

export function refreshDeleteDialog({ container, state, onAlertClose }) {
  const modal = dialogById(container, 'deleteModal');
  const name = modal?.querySelector('#st-delete-name');
  const alerts = modal?.querySelector('#st-delete-alerts');
  if (name) name.textContent = state.selectedTemplate;
  if (alerts) {
    alerts.innerHTML = renderAlerts(state.deleteAlerts);
    wireAlertClose(alerts, state.deleteAlerts, onAlertClose);
  }
}

function trashListHtml(state) {
  if (state.loadingDeleteList) return '<div class="loader-small"></div>';
  return `<div class="list-of-templates"><div class="list-group">${state.deletedTemplates.map((name, index) => `<a href="" class="list-group-item ${state.selectedDeletedTemplate === name ? 'active' : ''}" data-deleted-index="${index}" data-toggle="tooltip" title="${escapeHtml(name)}">${escapeHtml(name)}</a>`).join('')}</div></div>`;
}

export function trashDialogHtml(state) {
  return `<div class="modal fade" id="trashModal" tabindex="-1" role="dialog" aria-labelledby="trashModalLabel" aria-hidden="true">
    <div class="modal-dialog"><div class="modal-content">
      <div class="modal-header"><button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button><h4 class="modal-title" id="trashModalLabel">Templates in Archive:</h4></div>
      <div class="modal-body"><div id="st-trash-list">${trashListHtml(state)}</div><div class="col-sm-12 save-alert text-center" id="st-undelete-alerts">${renderAlerts(state.undeleteAlerts)}</div></div>
      <div class="modal-footer"><button class="btn btn-primary" id="st-undelete-confirm" ${state.selectedDeletedTemplate === 'Not Selected' ? 'disabled' : ''}>Unarchive</button><button type="button" class="btn btn-default" data-dismiss="modal">Close</button></div>
    </div></div>
  </div>`;
}

export function refreshTrashDialog({ container, state, onSelect, onAlertClose }) {
  const modal = dialogById(container, 'trashModal');
  const list = modal?.querySelector('#st-trash-list');
  const alerts = modal?.querySelector('#st-undelete-alerts');
  const confirm = modal?.querySelector('#st-undelete-confirm');
  if (list) {
    list.innerHTML = trashListHtml(state);
    list.querySelectorAll('[data-deleted-index]').forEach((element) => element.addEventListener('click', (event) => { event.preventDefault(); onSelect(state.deletedTemplates[Number(element.dataset.deletedIndex)]); }));
    initTooltips(list);
  }
  if (alerts) {
    alerts.innerHTML = renderAlerts(state.undeleteAlerts);
    wireAlertClose(alerts, state.undeleteAlerts, onAlertClose);
  }
  if (confirm) confirm.disabled = state.selectedDeletedTemplate === 'Not Selected';
}

export function uploadDialogHtml(state) {
  let header;
  let body;
  if (state.ogre === false) {
    header = '<h4 class="modal-title" id="uploadModalLabel">Select a Template to upload</h4>';
    body = '<h4>Please choose an Excel file.</h4><p class="text-danger">No spaces or underscores allowed in file name.</p><input type="file" name="zFileToUpload" id="FileToUploadID">';
  } else if (state.ogreStage === 'SelectModel') {
    header = '<h2 class="modal-title" id="uploadModalLabel">Help the Smart Ogre out</h2>';
    body = '<h4>What evaluation model is this?</h4><table class="table"><tr><td class="centeredText"><img src="images/cube.png" align="middle" id="st-ogre-product"><br>Product Portfolio (R&amp;D)</td><td align="center"><img src="images/complexCrystal.png" align="middle" id="st-ogre-platform"><br>Platform Product Portfolio (R&amp;D)</td></tr></table>';
  } else {
    header = '<h2 class="modal-title" id="uploadModalLabel">Smart Ogre is doing its thing...</h2>';
    body = `<h4>Building ${escapeHtml(state.templateName)} with a ${escapeHtml(state.selectedOgreModel)} model</h4>${state.ogreBuildCompleted ? '<span>Build completed! Check your template.</span>' : '<i class="fa fa-circle-o-notch fa-spin"></i>'}`;
  }
  return `<div class="modal fade" id="uploadModal" tabindex="-1" role="dialog" aria-labelledby="uploadModalLabel" aria-hidden="true"><div class="modal-dialog"><div class="modal-content">
    <div class="modal-header"><button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>${header}</div>
    <div class="modal-body">${body}<div class="save-alert text-center" id="st-submit-alerts">${renderAlerts(state.submitAlerts)}</div></div>
    <div class="modal-footer">${state.ogre === false ? '<button class="btn btn-primary" id="st-upload-confirm">Upload</button><button class="btn btn-default" data-dismiss="modal">Close</button>' : ''}</div>
  </div></div></div>`;
}

export function refreshUploadDialogAlerts({ container, state, onAlertClose }) {
  const alerts = dialogById(container, 'uploadModal')?.querySelector('#st-submit-alerts');
  if (!alerts) return;
  alerts.innerHTML = renderAlerts(state.submitAlerts);
  wireAlertClose(alerts, state.submitAlerts, onAlertClose);
}

export function wireUploadDialog({ container, state, onSubmit, onProduct, onPlatform, onAlertClose }) {
  container.querySelector('#FileToUploadID')?.addEventListener('change', (event) => { state.fileToUpload = event.target.files[0] || null; });
  container.querySelector('#st-upload-confirm')?.addEventListener('click', onSubmit);
  container.querySelector('#st-ogre-product')?.addEventListener('click', onProduct);
  container.querySelector('#st-ogre-platform')?.addEventListener('click', onPlatform);
  refreshUploadDialogAlerts({ container, state, onAlertClose });
}
