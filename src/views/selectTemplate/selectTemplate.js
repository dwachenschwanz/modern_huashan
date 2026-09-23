/* Ported from selectTemplateController.ts + views/selectTemplate.html.
 *
 * Dead/unreachable legacy code intentionally NOT ported (see the controller
 * for confirmation - grep for each name):
 *  - editCreator/editDescription/editCreatorLink/editEmail/editVersion and
 *    their toggle-/saveInfo/createDataToSubmit/toggleReleaseVersion methods:
 *    every bit of markup that reads or triggers them is HTML-commented out
 *    in selectTemplate.html.
 *  - syncTemplate()/showMessage(Content): the only button that calls it is
 *    HTML-commented out too, and `syncTemplateResult` (used by a *different*,
 *    live-looking alert block) is never assigned anywhere, so that block can
 *    never show either.
 *  - smartogrify()/templateNameFrom(): the "Smartogrify" button that calls it
 *    is HTML-commented out.
 *  - getGroupsForUser()/filterTemplatesByUserGroups()/saveAstroTemplate():
 *    none of these are referenced anywhere in selectTemplate.html; the
 *    template list is rendered unfiltered. getGroups() itself IS kept below,
 *    since it doubles as the session-expiry check that used to gate loading
 *    the template list.
 *  - addSlides()/slides: the carousel that used them is HTML-commented out.
 *
 * The "Ogre" evaluation-model flow (ogre/ogreStage/generateProductPortfolio/
 * ogreMakeTemplate) IS ported below for fidelity, but note it was *already*
 * unreachable in the legacy app: `this.ogre` is only ever assigned `false` in
 * the whole controller, so the ogre===true modal branches could never render
 * and those click handlers could never fire even in the original app.
 */
import { huashan } from '../../api/huashanClient.js';
import { session, restoreSession } from '../../core/session.js';
import { SERVER_URL, TOKEN_KEY } from '../../core/config.js';
import { navigate } from '../../core/router.js';
import { TheUte } from '../../core/textUtils.js';
import { appNavHtml } from '../../components/appNav.js';
import { showModal, hideModal, flashAlert, initTooltips } from '../../components/uiInteractions.js';
import { renderAlerts, wireAlertClose } from '../../components/alerts.js';
import { escapeHtml } from '../../core/html.js';

function escapeAttr(str) {
  return escapeHtml(str);
}

function getUserInfo() {
  try {
    const infoGot = localStorage.getItem('INFO');
    return infoGot ? JSON.parse(atob(infoGot)) : null;
  } catch (e) {
    return null;
  }
}

/** Mirrors the `saveBolb` IIFE at the top of selectTemplateController.ts: a
 * single reusable <a download> element used to save a fetched Blob to disk. */
const saveBlob = (() => {
  const a = document.createElement('a');
  a.style.cssText = 'display: none !important';
  document.body.appendChild(a);
  return function (blob, fileName) {
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
    // Some browsers do not begin reading the object URL until after click returns.
    window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  };
})();

export function mount(container) {
  if (!restoreSession()) return () => {};

  const userInfo = getUserInfo();

  const state = {
    selectedTemplate: 'Not Selected',
    templates: [],
    selected: null,
    newTemplateName: '',
    sort: { column: 'name', descending: false },
    searchText: '',
    isAdmin: !!(userInfo && userInfo.is_admin),
    loading: false,
    loadingTable: false,
    loadingDeleteList: false,
    deletedTemplates: [],
    selectedDeletedTemplate: 'Not Selected',
    deleteAlerts: [],
    renameAlerts: [],
    submitAlerts: [],
    undeleteAlerts: [],
    // Defensive initialization (matches the pattern in json.js/revisions.js):
    // getRevisionInfo()'s failure path pushes into this in the legacy
    // controller too, but `saveAlerts` is never initialized there - it's
    // never rendered anywhere either, so this just avoids a crash.
    saveAlerts: [],
    fileToUpload: null,
    portfolioNameList: [],
    selectedPortfolioName: '',
    updateDataStructure: { Leaf: true, Platform: false },
    runningUpdateDataStructure: null, // null | 'Running' | 'Success' | 'Failure'
    responseMsg: '',
    revisionInfo: null,
    showVersionLog: false,
    alertMsg: {},
    // "Ogre" flow - see file header comment. Never becomes true in practice.
    ogre: false,
    ogreStage: '',
    selectedOgreModel: '',
    ogreBuildCompleted: false,
    templateName: '',
  };

  // ---------------------------------------------------------------------
  // helpers
  // ---------------------------------------------------------------------

  function matchesSearch(template, text) {
    if (!text) return true;
    return (template.name || '').toLowerCase().includes(text.toLowerCase());
  }

  function filteredSortedTemplates() {
    const filtered = state.templates.filter((t) => matchesSearch(t, state.searchText));
    const { column, descending } = state.sort;
    return [...filtered].sort((a, b) => {
      const av = a[column];
      const bv = b[column];
      if (av === bv) return 0;
      const cmp = av > bv ? 1 : -1;
      return descending ? -cmp : cmp;
    });
  }

  function addAlert(list, type, msg) {
    list.push({ type, msg });
  }

  function authHeaders(extra = {}) {
    return { Authorization: 'jwttoken ' + (localStorage.getItem(TOKEN_KEY) || ''), ...extra };
  }

  function showFlashAlert(id, delayMs) {
    renderAlertBoxes();
    flashAlert(id, delayMs);
  }

  // ---------------------------------------------------------------------
  // data loading
  // ---------------------------------------------------------------------

  function getGroups() {
    // Mirrors the legacy startup chain (getGroups -> getGroupsForUser ->
    // getTemplates). The group list itself isn't used anywhere in this view
    // (see file header), but this request's error handling - redirect to
    // /login on failure ("session expired") - is real, load-bearing
    // behavior, so it's preserved as the gate before loading templates.
    fetch(`${SERVER_URL}/framework/admin/group/list`, { headers: authHeaders() })
      .then((res) => res.json())
      .then((body) => {
        if (body.token) localStorage.setItem(TOKEN_KEY, body.token);
        getTemplates();
      })
      .catch((err) => {
        console.error(err);
        state.alertMsg.type = 'danger';
        state.alertMsg.msg = '(SESSION EXPIRED) Data retrieval failed due to: ' + (err.data ? err.data.message : err);
        showFlashAlert('errorMsgAlert', 3000);
        navigate('/login');
      });
  }

  function getTemplates() {
    state.templates = [];
    state.loadingTable = true;
    renderList();
    huashan.getAstroTemplates(session.getCredentials()).then((response) => {
      if (response.status) {
        state.templates = response.result;
        const selectedTemplateJSONGot = localStorage.getItem('selectedTemplate');
        if (selectedTemplateJSONGot) {
          const selectedTemplateGot = JSON.parse(selectedTemplateJSONGot);
          state.selectedTemplate = selectedTemplateGot.name;
          const updatedTemplate = response.result.find((r) => r.name === selectedTemplateGot.name);
          if (updatedTemplate) {
            findAssociatedPortfolios();
            getRevisionInfo(selectedTemplateGot.name, updatedTemplate.history);
          } else {
            state.selectedTemplate = 'Not Selected';
            localStorage.removeItem('selectedTemplate');
          }
        } else {
          state.selectedTemplate = 'Not Selected';
        }
        state.loadingTable = false;
        onTemplateChanged();
      } else {
        state.loadingTable = false;
        renderList();
        state.alertMsg.msg = 'Templates not found! ' + response.msg;
        showFlashAlert('infoMsgAlert', 3000);
      }
    });
  }

  function getRevisionInfo(templateID, history) {
    huashan
      .getRevisions(session.getCredentials(), templateID)
      .then((response) => {
        if (!response.status) {
          state.revisionInfo = null;
        }
        if (response.status) {
          const temLog = response.result.split('\n').map((item) => JSON.parse(item));
          let revisionInfoGot = temLog.find((t) => t.commitNum == (history && history.guid));
          if (revisionInfoGot === undefined && temLog.length > 0) revisionInfoGot = temLog[0];
          state.revisionInfo = revisionInfoGot;
        } else {
          addAlert(state.saveAlerts, 'danger', response.msg);
        }
        renderRight();
      })
      .catch((err) => {
        console.error(err);
      });
  }

  function findAssociatedPortfolios() {
    huashan.findAssociatedPortfolios(session.getCredentials(), state.selectedTemplate).then((response) => {
      if (response.status) {
        state.portfolioNameList = response.result;
      } else {
        alert('Some error happened: ' + response.msg);
      }
      renderRight();
    });
  }

  // ---------------------------------------------------------------------
  // template list actions
  // ---------------------------------------------------------------------

  function selectRow(template) {
    state.portfolioNameList = [];
    state.selectedTemplate = template.name;
    localStorage.setItem('selectedTemplate', JSON.stringify(template));
    state.selected = template;
    state.newTemplateName = state.selectedTemplate;
    state.showVersionLog = false;
    onTemplateChanged();
    findAssociatedPortfolios();
    getRevisionInfo(template.name, template.history);
  }

  function listDeletedTemplates() {
    state.loadingDeleteList = true;
    state.deletedTemplates = [];
    renderTrashModal();
    huashan.getArchivedAstroTemplates(session.getCredentials()).then((response) => {
      if (response.status) {
        state.deletedTemplates = (response.result || []).map((l) => l.name);
        state.selectedDeletedTemplate = 'Not Selected';
        state.loadingDeleteList = false;
      } else {
        state.loadingDeleteList = false;
        state.selectedDeletedTemplate = 'Not Selected';
        renderTrashModal();
        state.alertMsg.msg = 'Deleted templates not found! ' + response.msg;
        showFlashAlert('infoMsgAlert', 3000);
        return;
      }
      renderTrashModal();
    });
  }

  function selectDeleted(deleted) {
    state.selectedDeletedTemplate = deleted;
    renderTrashModal();
  }

  function doDelete() {
    state.loading = true;
    state.deleteAlerts = [];
    renderLoading();
    renderDeleteModal();
    huashan.deleteTemplate(session.getCredentials(), state.selectedTemplate).then((response) => {
      if (response.status) {
        hideModal('deleteModal');
        state.selectedTemplate = 'Not Selected';
        localStorage.removeItem('selectedTemplate');
        state.loading = false;
        renderLoading();
        getTemplates();
      } else {
        addAlert(state.deleteAlerts, 'danger', response.msg);
        state.loading = false;
        renderLoading();
        renderDeleteModal();
      }
    });
  }

  function doUndelete() {
    state.loading = true;
    state.undeleteAlerts = [];
    renderLoading();
    renderTrashModal();
    huashan.undeleteTemplate(session.getCredentials(), state.selectedDeletedTemplate).then((response) => {
      if (response.status) {
        state.loading = false;
        state.selectedDeletedTemplate = 'Not Selected';
        renderLoading();
        getTemplates();
        listDeletedTemplates();
      } else {
        state.loading = false;
        state.selectedDeletedTemplate = 'Not Selected';
        addAlert(state.undeleteAlerts, 'danger', response.msg);
        renderLoading();
        renderTrashModal();
      }
    });
  }

  function downloadFileName(response) {
    const disposition = response.headers.get('content-disposition') || '';
    const encodedMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    const plainMatch = disposition.match(/filename="?([^";]+)"?/i);
    let fileName = encodedMatch ? decodeURIComponent(encodedMatch[1]) : plainMatch ? plainMatch[1] : '';
    fileName = fileName.split(/[\\/]/).pop().trim();
    if (!fileName) fileName = replaceSpace(state.selectedTemplate);
    return /\.xls[xm]$/i.test(fileName) ? fileName : `${fileName}.xlsx`;
  }

  async function downloadTemplate() {
    state.loading = true;
    renderLoading();
    const templateName = encodeURIComponent(state.selectedTemplate);
    const url = `${SERVER_URL}/wizard/download/excel/${templateName}`;

    try {
      const response = await fetch(url, {
        headers: authHeaders({
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel',
        }),
      });
      const contentType = (response.headers.get('content-type') || '').toLowerCase();

      if (!response.ok || contentType.includes('application/json') || contentType.includes('text/html')) {
        const responseText = (await response.text()).trim();
        const detail = responseText.length > 300 ? `${responseText.slice(0, 300)}...` : responseText;
        throw new Error(`Download failed (${response.status})${detail ? `: ${detail}` : ''}`);
      }

      const blob = await response.blob();
      if (blob.size === 0) throw new Error('Download failed: the server returned an empty file.');
      saveBlob(blob, downloadFileName(response));
    } catch (err) {
      console.error('Excel download failed:', err);
      state.alertMsg.type = 'danger';
      state.alertMsg.msg = err instanceof Error ? err.message : 'Excel download failed.';
      showFlashAlert('errorMsgAlert', 5000);
    } finally {
      state.loading = false;
      renderLoading();
    }
  }

  function replaceSpace(fileName) {
    return fileName.replace(/\s+/g, '_');
  }

  function rename() {
    state.loading = true;
    state.renameAlerts = [];
    if (state.newTemplateName === '') {
      addAlert(state.renameAlerts, 'danger', 'Template name cannot be blank.');
      // Legacy bug, preserved: `loading` is never reset on this early-return
      // path, so the page-wide spinner overlay stays up until some other
      // action resets it.
      renderLoading();
      renderRenameModal();
      return;
    }
    state.newTemplateName = replaceSpace(state.newTemplateName);
    renderLoading();
    renderRenameModal();
    huashan.renameTemplate(session.getCredentials(), state.selectedTemplate, state.newTemplateName).then((response) => {
      if (response.status) {
        state.loading = false;
        hideModal('renameModal');
        renderLoading();
        getTemplates();
      } else {
        state.loading = false;
        addAlert(state.renameAlerts, 'danger', response.msg);
        renderLoading();
        renderRenameModal();
      }
    });
  }

  // ---------------------------------------------------------------------
  // upload
  // ---------------------------------------------------------------------

  function checkFileExist() {
    if (!state.fileToUpload) {
      addAlert(state.submitAlerts, 'danger', 'Please select a file.');
      return false;
    }
    return true;
  }

  function validateFileName(fileName) {
    if (fileName.slice(fileName.indexOf('.') + 1).indexOf('xls') === -1) {
      addAlert(state.submitAlerts, 'danger', 'Only Excel files are accepted!');
      return false;
    } else if (fileName.indexOf(' ') !== -1) {
      addAlert(state.submitAlerts, 'danger', 'No spaces allowed in file name.');
      return false;
    } else if (fileName.indexOf('_') !== -1) {
      addAlert(state.submitAlerts, 'danger', 'No underscore allowed in file name.');
      return false;
    }
    return true;
  }

  function submit() {
    state.loading = true;
    state.submitAlerts = [];
    renderLoading();
    renderUploadModalAlerts();
    if (!checkFileExist()) {
      state.loading = false;
      renderLoading();
      renderUploadModalAlerts();
      return;
    }
    const fileName = state.fileToUpload.name;
    if (!validateFileName(fileName)) {
      state.loading = false;
      renderLoading();
      renderUploadModalAlerts();
      return;
    }
    // Matches the legacy `submit()`'s request exactly: the raw File is
    // posted as-is (no FormData wrapper, no explicit Content-Type - the
    // browser derives it from the File's own blob type), to
    // /wizard/upload/{fileName}. Note this is a *different* upload path than
    // `huashan.uploadFile()` (which posts multipart to /fileD) - that helper
    // isn't used by this flow, matching the legacy controller.
    const url = `${SERVER_URL}/wizard/upload/${fileName}`;
    fetch(url, { method: 'POST', headers: authHeaders(), body: state.fileToUpload })
      .then(async (res) => {
        let body = null;
        try {
          body = await res.json();
        } catch (e) {
          // non-JSON response
        }
        hideModal('uploadModal');
        state.loading = false;
        state.fileToUpload = null;
        const fileInput = container.querySelector('#FileToUploadID');
        if (fileInput) fileInput.value = '';
        renderLoading();
        getTemplates();
        if (body && body.data && body.data.status == 1) {
          state.alertMsg.type = 'info';
          state.alertMsg.msg = body.data.message;
          showFlashAlert('infoMsgAlert', 3000);
        } else {
          showFlashAlert('uploadSuccessAlert', 2000);
        }
      })
      .catch((err) => {
        state.loading = false;
        addAlert(state.submitAlerts, 'danger', 'Upload failed due to: ' + (err.data ? err.data.message : err));
        renderLoading();
        renderUploadModalAlerts();
      });
  }

  // ---------------------------------------------------------------------
  // update data structure
  // ---------------------------------------------------------------------

  function initializeUpdateDataStructure() {
    state.updateDataStructure = { Leaf: true, Platform: false };
  }

  function selectPortfolioName(name) {
    state.selectedPortfolioName = name;
    refreshUdsInner();
  }

  function resetPortfolioName() {
    state.selectedPortfolioName = '';
    refreshUdsInner();
  }

  function runUpdateDataStructure() {
    state.runningUpdateDataStructure = 'Running';
    renderRight();
    if (state.portfolioNameList.length > 0) {
      huashan
        .updateDataStructure(
          session.getCredentials(),
          TheUte.pack(state.selectedPortfolioName),
          state.updateDataStructure.Leaf,
          state.updateDataStructure.Platform
        )
        .then((response) => {
          if (response.status) {
            state.runningUpdateDataStructure = 'Success';
          } else {
            alert('Some error happened: ' + response.msg);
            state.runningUpdateDataStructure = 'Failure';
            state.responseMsg = response.msg;
          }
          renderRight();
        });
    }
  }

  // ---------------------------------------------------------------------
  // Ogre (see file header - unreachable in the legacy app too)
  // ---------------------------------------------------------------------

  function generateProductPortfolio(model) {
    state.ogreStage = 'GeneratingTemplate';
    state.selectedOgreModel = model;
    ogreMakeTemplate();
  }

  function ogreMakeTemplate() {
    huashan.ogreMakeTemplate(session.getCredentials(), state.templateName, state.selectedOgreModel).then((response) => {
      if (response.status) {
        state.ogreBuildCompleted = true;
      } else {
        alert('Some error happened: ' + response.msg);
      }
    });
  }

  // ---------------------------------------------------------------------
  // rendering: everything below is built once at mount time; subsequent
  // updates go through the targeted render* functions so an open modal (or
  // an in-flight flashAlert on the fixed info/error/success boxes) is never
  // yanked out from under the user by a full container.innerHTML replace.
  // ---------------------------------------------------------------------

  function onTemplateChanged() {
    renderNav();
    renderList();
    renderRight();
    renderBottomNav();
    renderRenameModal();
    renderDeleteModal();
  }

  function templateListHtml() {
    if (state.loadingTable) return `<div class="loader-small"></div>`;
    return filteredSortedTemplates()
      .map(
        (t, i) => `
      <a href="" class="list-group-item ${state.selectedTemplate === t.name ? 'active' : ''}" data-template-index="${i}" data-toggle="tooltip" title="${escapeAttr(t.name)}">
        <table>
          <tr>
            <td class="appStructList">${escapeHtml(t.name)}</td>
            <td class="appStructList" style="width:60px">
              ${
                state.selectedTemplate === t.name && state.isAdmin
                  ? `<span data-toggle="modal" data-target="#deleteModal" class="inline-icon pull-right glyphicon glyphicon-trash" title="Delete"></span>
              <span data-toggle="modal" data-target="#renameModal" class="inline-icon pull-right glyphicon glyphicon-pencil" title="Rename"></span>`
                  : ''
              }
            </td>
          </tr>
        </table>
      </a>`
      )
      .join('');
  }

  function renderList() {
    const listEl = container.querySelector('#st-template-list');
    if (!listEl) return;
    listEl.innerHTML = templateListHtml();
    const rows = filteredSortedTemplates();
    listEl.querySelectorAll('[data-template-index]').forEach((el) => {
      el.addEventListener('click', (evt) => {
        evt.preventDefault();
        selectRow(rows[Number(el.getAttribute('data-template-index'))]);
      });
    });
    initTooltips(listEl);
  }

  function renderNav() {
    const el = container.querySelector('#st-nav');
    if (!el) return;
    el.innerHTML = appNavHtml({
      active: 'selectTemplate',
      isAdmin: state.isAdmin,
      selectedTemplate: state.selectedTemplate,
      showTemplateBadge: false,
    });
  }

  function renderBottomNav() {
    const el = container.querySelector('#st-bottom-nav');
    if (!el) return;
    el.innerHTML = bottomNavHtml();
  }

  function bottomNavHtml() {
    const notSelected = state.selectedTemplate === 'Not Selected';
    return `
    <a href="#/datastructure/${encodeURIComponent(state.selectedTemplate)}" class="btn btn-primary pull-right" role="button" ${notSelected ? 'disabled' : ''}>Next: Data Structure <span class="glyphicon glyphicon-chevron-right"></span></a>`;
  }

  function runningBannerHtml() {
    if (!state.runningUpdateDataStructure) return '';
    const banners = {
      Running: {
        cls: 'alert-info',
        text: `Updating Data Structure for '${escapeHtml(state.selectedPortfolioName)}' portfolio. Will be notified when done.`,
      },
      Success: {
        cls: 'alert-success',
        text: `Data Structure for '${escapeHtml(state.selectedPortfolioName)}' portfolio is updated successfully!`,
      },
      Failure: {
        cls: 'alert-danger',
        text: `Updating Data Structure for '${escapeHtml(state.selectedPortfolioName)}' was not successful. ${escapeHtml(state.responseMsg)}`,
      },
    };
    const entry = banners[state.runningUpdateDataStructure];
    if (!entry) return '';
    return `
    <div class="alert ${entry.cls} alert-dismissible text-center" role="alert">
      <button class="close" id="st-running-banner-close" aria-label="Close"><span aria-hidden="true">&times;</span></button>
      ${entry.text}
    </div>`;
  }

  function versionLogHtml() {
    // Dead in practice: `state.showVersionLog` can never become true (no
    // live UI element calls the legacy `toggleShowVersionLog`), preserved
    // here only for fidelity with the controller/view.
    const info = (state.selected && state.selected.info) || {};
    return `
    <div class="panel panel-default">
      <div class="panel-body st-versionlog">
        ${!info.VersionLog && !info.VersionLogs ? '<span>No VersionLog</span>' : ''}
        <ul>
          ${(info.VersionLogs || [])
            .map(
              (log) => `
          <li>
            <h5>V${escapeHtml(log.Version)} - ${escapeHtml(log.VersionTime)}</h5>
            <span style="white-space: pre;">${escapeHtml(log.VersionLog)}</span>
          </li>`
            )
            .join('')}
        </ul>
      </div>
    </div>`;
  }

  function descriptionHtml() {
    if (state.selectedTemplate === 'Not Selected') return '';
    return `
    <h2>${escapeHtml(state.selectedTemplate)}</h2>
    <h4>${!state.revisionInfo ? '<span>No Version Info</span>&nbsp;' : ''}</h4>
    <div style="display: flex; justify-content: space-between">
      ${state.revisionInfo ? '<h4>Version Info:</h4>' : ''}
    </div>
    ${
      state.revisionInfo
        ? `
    <div class="panel panel-default panel-body">
      <div><b>${escapeHtml(state.revisionInfo.committer)}</b> saved changes <b>${escapeHtml(state.revisionInfo.relativeTime)}</b></div>
      <div>Commit Hash: ${escapeHtml(state.revisionInfo.commitNum)}</div>
      <div>Commit Message: ${escapeHtml(state.revisionInfo.commitMessage)}</div>
    </div>`
        : ''
    }
    ${state.showVersionLog ? versionLogHtml() : ''}
    <br />
    <a href="#/json/${encodeURIComponent(state.selectedTemplate)}" class="btn btn-primary" role="button">View JSON</a>
    <a href="" id="st-download-btn" class="btn btn-primary" role="button">Download Excel model</a>
    ${
      state.portfolioNameList.length > 0
        ? `
    <div>
      <br>
      <a href="" class="btn btn-primary" id="st-update-ds-trigger" data-toggle="modal" data-target="#updateDataStructureModal" role="button">Update Data Structure</a>
      ${udsModalHtml()}
    </div>`
        : ''
    }`;
  }

  function rightPanelHtml() {
    return `
    ${runningBannerHtml()}
    <div class="st-ipointer" id="template-description">
      <div class="col-sm-6" id="description">${descriptionHtml()}</div>
      <div class="col-sm-6 select-template-title"></div>
    </div>`;
  }

  function renderRight() {
    const el = container.querySelector('#selected-template');
    if (!el) return;
    el.innerHTML = rightPanelHtml();
    wireRight();
  }

  function wireRight() {
    const bannerClose = container.querySelector('#st-running-banner-close');
    if (bannerClose) {
      bannerClose.addEventListener('click', () => {
        state.runningUpdateDataStructure = null;
        renderRight();
      });
    }
    const downloadBtn = container.querySelector('#st-download-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', (evt) => {
        evt.preventDefault();
        downloadTemplate();
      });
    }
    const udsTrigger = container.querySelector('#st-update-ds-trigger');
    if (udsTrigger) {
      udsTrigger.addEventListener('click', () => {
        // No preventDefault: this anchor also carries data-toggle="modal",
        // handled by the app-wide delegated listener from uiInteractions.js.
        initializeUpdateDataStructure();
        renderRight();
      });
    }
    wireUdsInner();
  }

  // ---- Update Data Structure modal (nested in the description column) ----

  function udsListHtml() {
    return state.portfolioNameList
      .map(
        (name, i) => `
      <a href="" class="list-group-item ${state.selectedPortfolioName === name ? 'active' : ''}" data-portfolio-index="${i}" data-toggle="tooltip" title="${escapeAttr(name)}">${escapeHtml(name)}</a>`
      )
      .join('');
  }

  function udsFooterHtml() {
    return `
    ${state.selectedPortfolioName !== '' ? `<button class="btn btn-primary" data-dismiss="modal" id="st-uds-run">Run</button>` : ''}
    <button class="btn btn-default" data-dismiss="modal" id="st-uds-close">Close</button>`;
  }

  function udsModalHtml() {
    return `
    <div class="modal fade" id="updateDataStructureModal" role="dialog">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h4 class="modal-title">Update Data Structure</h4>
          </div>
          <div class="modal-body">
            <h4>Select a Portfolio </h4>
            <div class="list-of-portfolios">
              <div class="list-group" id="st-uds-list">${udsListHtml()}</div>
            </div>
            <h4>Select Leaf / Platform </h4>
            <label><input type="checkbox" id="st-uds-leaf" ${state.updateDataStructure.Leaf ? 'checked' : ''}> Leaf</label><br />
            <label><input type="checkbox" id="st-uds-platform" ${state.updateDataStructure.Platform ? 'checked' : ''}> Platform</label><br />
          </div>
          <div class="modal-footer" id="st-uds-footer">${udsFooterHtml()}</div>
        </div>
      </div>
    </div>`;
  }

  function refreshUdsInner() {
    const listEl = container.querySelector('#st-uds-list');
    if (listEl) {
      listEl.innerHTML = udsListHtml();
      wireUdsList(listEl);
      initTooltips(listEl);
    }
    const footerEl = container.querySelector('#st-uds-footer');
    if (footerEl) {
      footerEl.innerHTML = udsFooterHtml();
      wireUdsFooter(footerEl);
    }
  }

  function wireUdsList(scope) {
    const list = state.portfolioNameList;
    (scope || container).querySelectorAll('[data-portfolio-index]').forEach((el) => {
      el.addEventListener('click', (evt) => {
        evt.preventDefault();
        selectPortfolioName(list[Number(el.getAttribute('data-portfolio-index'))]);
      });
    });
  }

  function wireUdsFooter(scope) {
    const runBtn = (scope || container).querySelector('#st-uds-run');
    if (runBtn) runBtn.addEventListener('click', () => runUpdateDataStructure());
    const closeBtn = (scope || container).querySelector('#st-uds-close');
    if (closeBtn) closeBtn.addEventListener('click', () => resetPortfolioName());
  }

  function wireUdsInner() {
    const leafCb = container.querySelector('#st-uds-leaf');
    if (leafCb) leafCb.addEventListener('change', (e) => { state.updateDataStructure.Leaf = e.target.checked; });
    const platformCb = container.querySelector('#st-uds-platform');
    if (platformCb) platformCb.addEventListener('change', (e) => { state.updateDataStructure.Platform = e.target.checked; });
    wireUdsList(container.querySelector('#st-uds-list'));
    wireUdsFooter(container.querySelector('#st-uds-footer'));
    const listEl = container.querySelector('#st-uds-list');
    if (listEl) initTooltips(listEl);
  }

  // ---- Rename modal ----

  function renameModalHtml() {
    return `
    <div class="modal fade" id="renameModal" tabindex="-1" role="dialog" aria-labelledby="renameModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
            <h4 class="modal-title" id="renameModalLabel"><span id="st-rename-title">Rename ${escapeHtml(state.selectedTemplate)}</span></h4>
          </div>
          <div class="modal-body">
            <h4>New Name:</h4>
            <input type="text" id="st-rename-input" class="form form-control" value="${escapeAttr(state.newTemplateName)}" />
            <div class="col-sm-12 save-alert text-center" id="st-rename-alerts">${renderAlerts(state.renameAlerts)}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" id="st-rename-confirm">Rename</button>
            <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>`;
  }

  function renderRenameModal() {
    const titleEl = container.querySelector('#st-rename-title');
    if (titleEl) titleEl.textContent = `Rename ${state.selectedTemplate}`;
    const input = container.querySelector('#st-rename-input');
    if (input) input.value = state.newTemplateName;
    const alertsBox = container.querySelector('#st-rename-alerts');
    if (alertsBox) {
      alertsBox.innerHTML = renderAlerts(state.renameAlerts);
      wireAlertClose(alertsBox, state.renameAlerts, renderRenameModal);
    }
  }

  // ---- Delete modal ----

  function deleteModalHtml() {
    return `
    <div class="modal fade" id="deleteModal" tabindex="-1" role="dialog" aria-labelledby="deleteModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
            <h4 class="modal-title">Delete Template</h4>
          </div>
          <div class="modal-body">
            <h4 class="modal-title" id="deleteModalLabel">Are you sure to delete <b id="st-delete-name">${escapeHtml(state.selectedTemplate)}</b>?</h4>
            <div class="col-sm-12 save-alert text-center" id="st-delete-alerts">${renderAlerts(state.deleteAlerts)}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" id="st-delete-confirm">Delete</button>
            <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>`;
  }

  function renderDeleteModal() {
    const nameEl = container.querySelector('#st-delete-name');
    if (nameEl) nameEl.textContent = state.selectedTemplate;
    const alertsBox = container.querySelector('#st-delete-alerts');
    if (alertsBox) {
      alertsBox.innerHTML = renderAlerts(state.deleteAlerts);
      wireAlertClose(alertsBox, state.deleteAlerts, renderDeleteModal);
    }
  }

  // ---- Trash (archive) modal ----

  function trashListHtml() {
    if (state.loadingDeleteList) return `<div class="loader-small"></div>`;
    return `
    <div class="list-of-templates">
      <div class="list-group">
        ${state.deletedTemplates
          .map(
            (deleted, i) => `
        <a href="" class="list-group-item ${state.selectedDeletedTemplate === deleted ? 'active' : ''}" data-deleted-index="${i}" data-toggle="tooltip" title="${escapeAttr(deleted)}">${escapeHtml(deleted)}</a>`
          )
          .join('')}
      </div>
    </div>`;
  }

  function trashModalHtml() {
    return `
    <div class="modal fade" id="trashModal" tabindex="-1" role="dialog" aria-labelledby="trashModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
            <h4 class="modal-title" id="trashModalLabel">Templates in Archive:</h4>
          </div>
          <div class="modal-body">
            <div id="st-trash-list">${trashListHtml()}</div>
            <div class="col-sm-12 save-alert text-center" id="st-undelete-alerts">${renderAlerts(state.undeleteAlerts)}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" id="st-undelete-confirm" ${state.selectedDeletedTemplate === 'Not Selected' ? 'disabled' : ''}>Unarchive</button>
            <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>`;
  }

  function renderTrashModal() {
    const listWrap = container.querySelector('#st-trash-list');
    if (listWrap) {
      listWrap.innerHTML = trashListHtml();
      listWrap.querySelectorAll('[data-deleted-index]').forEach((el) => {
        el.addEventListener('click', (evt) => {
          evt.preventDefault();
          selectDeleted(state.deletedTemplates[Number(el.getAttribute('data-deleted-index'))]);
        });
      });
      initTooltips(listWrap);
    }
    const alertsBox = container.querySelector('#st-undelete-alerts');
    if (alertsBox) {
      alertsBox.innerHTML = renderAlerts(state.undeleteAlerts);
      wireAlertClose(alertsBox, state.undeleteAlerts, renderTrashModal);
    }
    const confirmBtn = container.querySelector('#st-undelete-confirm');
    if (confirmBtn) confirmBtn.disabled = state.selectedDeletedTemplate === 'Not Selected';
  }

  // ---- Upload modal ----

  function uploadModalHtml() {
    // `state.ogre` never becomes true in this app (see file header), so this
    // header/body pair is effectively static and only ever renders the
    // `ogre===false` branch; it's still switched on `state.ogre`/
    // `state.ogreStage` for fidelity with the legacy view.
    let header;
    let body;
    if (state.ogre === false) {
      header = `<h4 class="modal-title" id="uploadModalLabel">Select a Template to upload</h4>`;
      body = `
      <h4>Please choose an Excel file.</h4>
      <p class="text-danger">No spaces or underscores allowed in file name.</p>
      <input type="file" name="zFileToUpload" id="FileToUploadID" />`;
    } else if (state.ogreStage === 'SelectModel') {
      header = `<h2 class="modal-title" id="uploadModalLabel">Help the Smart Ogre out</h2>`;
      body = `
      <h4>What evaluation model is this?</h4>
      <table class="table">
        <tr>
          <td class="centeredText">
            <img src="images/cube.png" align="middle" id="st-ogre-product" /><br />
            Product Portfolio (R&amp;D)
          </td>
          <td align="center">
            <img src="images/complexCrystal.png" align="middle" id="st-ogre-platform" /><br />
            Platform Product Portfolio (R&amp;D)
          </td>
        </tr>
      </table>`;
    } else {
      header = `<h2 class="modal-title" id="uploadModalLabel">Smart Ogre is doing its thing...</h2>`;
      body = `
      <h4>Building ${escapeHtml(state.templateName)} with a ${escapeHtml(state.selectedOgreModel)} model</h4>
      ${state.ogreBuildCompleted === false ? '<i class="fa fa-circle-o-notch fa-spin"></i>' : '<span>Build completed! Check your template.</span>'}`;
    }
    return `
    <div class="modal fade" id="uploadModal" tabindex="-1" role="dialog" aria-labelledby="uploadModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
            ${header}
          </div>
          <div class="modal-body">${body}</div>
          <div class="col-sm-12 save-alert text-center" id="st-submit-alerts">${renderAlerts(state.submitAlerts)}</div>
          <div class="modal-footer">
            ${
              state.ogre === false
                ? `<button class="btn btn-primary" id="st-upload-confirm">Upload</button>
            <button class="btn btn-default" data-dismiss="modal">Close</button>`
                : ''
            }
          </div>
        </div>
      </div>
    </div>`;
  }

  function renderUploadModalAlerts() {
    const alertsBox = container.querySelector('#st-submit-alerts');
    if (alertsBox) {
      alertsBox.innerHTML = renderAlerts(state.submitAlerts);
      wireAlertClose(alertsBox, state.submitAlerts, renderUploadModalAlerts);
    }
  }

  function wireUploadModal() {
    const fileInput = container.querySelector('#FileToUploadID');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        state.fileToUpload = e.target.files[0] || null;
      });
    }
    const uploadConfirm = container.querySelector('#st-upload-confirm');
    if (uploadConfirm) uploadConfirm.addEventListener('click', () => submit());
    const ogreProduct = container.querySelector('#st-ogre-product');
    if (ogreProduct) ogreProduct.addEventListener('click', () => generateProductPortfolio('Product Portfolio'));
    const ogrePlatform = container.querySelector('#st-ogre-platform');
    if (ogrePlatform) ogrePlatform.addEventListener('click', () => generateProductPortfolio('Platform Portfolio'));
    renderUploadModalAlerts();
  }

  // ---- alert boxes (fixed, flash-in/out) ----

  function renderAlertBoxes() {
    const infoBox = container.querySelector('#infoMsgAlert .alert-body');
    const errorBox = container.querySelector('#errorMsgAlert .alert-body');
    if (infoBox) infoBox.textContent = state.alertMsg.msg || '';
    if (errorBox) errorBox.textContent = state.alertMsg.msg || '';
  }

  // ---------------------------------------------------------------------
  // initial (one-time) full render
  // ---------------------------------------------------------------------

  function render() {
    container.innerHTML = `
<div id="st-nav">${appNavHtml({ active: 'selectTemplate', isAdmin: state.isAdmin, selectedTemplate: state.selectedTemplate, showTemplateBadge: false })}</div>

<div class="select-template animated fadeIn" style="height: 100%">
  <div class="loader-container" id="st-loading" ${state.loading ? '' : 'hidden'}>
    <div class="loader"></div>
  </div>

  <div id="choose-from" style="height: 100%">
    <div class="select-template-title"><h4>Select a Template</h4></div>
    <div class="select-template-title">
      <input type="text" id="st-search" class="form-control" placeholder="Search" value="${escapeAttr(state.searchText)}">
    </div>
    <div class="panel panel-primary" style="height: calc(100% - 260px)">
      <div class="list-of-templates height-for-list" style="height: 100%">
        <div class="list-group" id="st-template-list" style="height: 100%">${templateListHtml()}</div>
      </div>
    </div>
    <div class="">
      ${state.isAdmin ? `<button class="btn btn-primary pull-left" id="st-archive-btn" data-toggle="modal" data-target="#trashModal" title="Open Archive">Archive</button>` : ''}
      <button class="btn btn-success pull-right" id="st-upload-btn" data-toggle="modal" data-target="#uploadModal" title="Upload"><span class="glyphicon glyphicon-open"></span></button>
    </div>
  </div>

  <div id="selected-template">${rightPanelHtml()}</div>
</div>

<div class="col-sm-12 text-center align-to-bottom" id="st-bottom-nav">${bottomNavHtml()}</div>

${renameModalHtml()}
${deleteModalHtml()}
${trashModalHtml()}
${uploadModalHtml()}

<div id="uploadSuccessAlert" class="text-center" style="display:none;position:fixed; top:40%;left:35%;height:100px;width:30%;">
  <div class="alert alert-success"><i class="fa fa-check fa-lg"></i> Successfully Uploaded!</div>
</div>
<div id="infoMsgAlert" class="text-center" style="display:none;position:fixed; top:40%;left:35%;height:100px;width:30%;z-index: 9999;">
  <div class="alert alert-info alert-body"></div>
</div>
<div id="errorMsgAlert" class="text-center" style="display:none;position:fixed; top:40%;left:35%;height:100px;width:30%;">
  <div class="alert alert-danger alert-body"></div>
</div>`;

    const searchInput = container.querySelector('#st-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchText = e.target.value;
        renderList();
      });
    }
    const archiveBtn = container.querySelector('#st-archive-btn');
    if (archiveBtn) archiveBtn.addEventListener('click', () => listDeletedTemplates());

    renderList();
    wireRight();

    const renameConfirm = container.querySelector('#st-rename-confirm');
    if (renameConfirm) renameConfirm.addEventListener('click', () => rename());
    const renameInput = container.querySelector('#st-rename-input');
    if (renameInput) renameInput.addEventListener('input', (e) => { state.newTemplateName = e.target.value; });
    renderRenameModal();

    const deleteConfirm = container.querySelector('#st-delete-confirm');
    if (deleteConfirm) deleteConfirm.addEventListener('click', () => doDelete());
    renderDeleteModal();

    const undeleteConfirm = container.querySelector('#st-undelete-confirm');
    if (undeleteConfirm) undeleteConfirm.addEventListener('click', () => doUndelete());
    renderTrashModal();

    wireUploadModal();

    renderAlertBoxes();
  }

  render();
  getGroups();

  return () => {};
}
