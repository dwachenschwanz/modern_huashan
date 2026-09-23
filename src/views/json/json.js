/* Ported from jsonController.ts + views/json.html. */
import { huashan } from '../../api/huashanClient.js';
import { session, restoreSession } from '../../core/session.js';
import { navigate, setNavigationGuard, clearNavigationGuard } from '../../core/router.js';
import { appNavHtml } from '../../components/appNav.js';
import { accordionGroupHtml, initAccordions } from '../../components/accordion.js';
import { renderAlerts, wireAlertClose } from '../../components/alerts.js';
import { commitMessageModalHtml, initCommitMessageModal, closeCommitMessageModal } from '../../components/commitMessageModal.js';
import { createJsonEditor } from '../../components/jsonEditor.js';
import { escapeHtml } from '../../core/html.js';

function stringify(jsonObject) {
  return JSON.stringify(jsonObject, undefined, 2);
}

function getIsAdmin() {
  try {
    const infoGot = localStorage.getItem('INFO');
    if (!infoGot) return false;
    const userInfo = JSON.parse(atob(infoGot));
    return !!userInfo.is_admin;
  } catch (e) {
    return false;
  }
}

export function mount(container, params) {
  if (!restoreSession()) return () => {};

  let editors = [];

  const state = {
    selectedTemplate: params.templateID,
    isAdmin: getIsAdmin(),
    saveComplete: true,
    saveErrorMessage: '',
    alerts: [],
    data: null,
    dataCopy: null,
  };

  function isUnchanged() {
    return JSON.stringify(state.data) === JSON.stringify(state.dataCopy);
  }

  function platformExists() {
    return (
      state.data !== null &&
      state.data.platformDataStructure !== undefined &&
      state.data.platformDataStructure.indexOf('Does not exist') === -1
    );
  }

  function render() {
    editors.forEach((editor) => editor.destroy());
    editors = [];
    container.innerHTML = `
${appNavHtml({ active: 'json', isAdmin: state.isAdmin, selectedTemplate: state.selectedTemplate })}
<div class="select-template fadeIn" style="height:650px;background-color: #eee;margin-bottom: 60px;">
  <div class="container-fluid">
    <div class="col-sm-12">
      <h3>${escapeHtml(state.selectedTemplate)}
        <small>JSON</small>
        <small><a target="_blank" class="pull-right" href="http://jsoneditoronline.org/">Open JSON Editor</a></small>
      </h3>
    </div>
    ${state.data ? renderColumns() : '<div class="col-sm-12">Loading&hellip;</div>'}
  </div>
</div>

<div class="col-sm-12 text-center align-to-bottom">
  <button class="btn btn-link pull-left" id="json-close-btn"><span class="glyphicon glyphicon-chevron-left"></span> Back to Select Template</button>
  <button style="width:60px;" class="btn btn-danger pull-right" id="json-save-open-btn" data-toggle="modal" data-target="#commitMessageModal" ${isUnchanged() ? 'disabled' : ''}>
    <i class="fa fa-spinner fa-spin fa-lg" ${state.saveComplete ? 'hidden' : ''}></i><span ${state.saveComplete ? '' : 'hidden'}>save</span>
  </button>
  <div class="col-sm-12 save-alert" id="json-alerts">${renderAlerts(state.alerts, { prefix: 'Saving failed.' })}</div>
</div>

${commitMessageModalHtml()}`;

    if (state.data) {
      initAccordions(container);
      const editorConfigs = [
        ['ds-editor', 'dataStructure', 'Data Structure JSON'],
        ['as-editor', 'appStructure', 'App Structure JSON'],
        ['ps-editor', 'portfolioStructure', 'Portfolio Structure JSON'],
        ['pds-editor', 'platformDataStructure', 'Platform Data Structure JSON'],
        ['pas-editor', 'platformAppStructure', 'Platform App Structure JSON'],
        ['pps-editor', 'platformPortfolioStructure', 'Platform Portfolio Structure JSON'],
      ];
      editorConfigs.forEach(([id, field, label]) => {
        const host = container.querySelector(`#${id}`);
        if (!host) return;
        editors.push(createJsonEditor(host, {
          value: state.data[field],
          label,
          onChange(value) {
            state.data[field] = value;
            refreshSaveButton();
          },
        }));
      });
    }

    container.querySelector('#json-close-btn').addEventListener('click', () => navigate('/selectTemplate'));
    wireAlertClose(container.querySelector('#json-alerts'), state.alerts, render);
    initCommitMessageModal(container, saveWithCommit);
  }

  function refreshSaveButton() {
    const btn = container.querySelector('#json-save-open-btn');
    if (btn) btn.disabled = isUnchanged();
  }

  function renderColumns() {
    return `
    <div id="json">
      <div class="col-sm-4">
        ${accordionGroupHtml({ id: 'ds', heading: 'Data Structure', bodyHtml: '<div id="ds-editor" class="json-editor-host"></div>' })}
        ${platformExists() ? accordionGroupHtml({ id: 'pds', heading: 'Platform Data Structure', bodyHtml: '<div id="pds-editor" class="json-editor-host"></div>' }) : ''}
      </div>
      <div class="col-sm-4">
        ${accordionGroupHtml({ id: 'as', heading: 'App Structure', bodyHtml: '<div id="as-editor" class="json-editor-host"></div>' })}
        ${platformExists() ? accordionGroupHtml({ id: 'pas', heading: 'Platform App Structure', bodyHtml: '<div id="pas-editor" class="json-editor-host"></div>' }) : ''}
      </div>
      <div class="col-sm-4">
        ${accordionGroupHtml({ id: 'ps', heading: 'Portfolio Structure', bodyHtml: '<div id="ps-editor" class="json-editor-host"></div>' })}
        ${platformExists() ? accordionGroupHtml({ id: 'pps', heading: 'Platform Portfolio Structure', bodyHtml: '<div id="pps-editor" class="json-editor-host"></div>' }) : ''}
      </div>
    </div>`;
  }

  function setData(jsonFiles) {
    const data = {
      name: state.selectedTemplate,
      hasPlatform: jsonFiles.appStructure.Platform,
      dataStructure: stringify(jsonFiles.dataStructure),
      appStructure: stringify(jsonFiles.appStructure),
      portfolioStructure: stringify(jsonFiles.portfolioStructure),
      platformDataStructure: stringify(jsonFiles.platformDataStructure),
      platformAppStructure: stringify(jsonFiles.platformAppStructure),
      platformPortfolioStructure: stringify(jsonFiles.platformPortfolioStructure),
    };
    state.data = data;
    state.dataCopy = structuredClone(data);
    render();
  }

  function getTemplateJsonFiles() {
    huashan.getTemplateJsonFiles(session.getCredentials(), params.templateID).then((response) => {
      state.selectedTemplate = params.templateID;
      setData(response.result);
    });
  }

  function addAlert(msg) {
    state.alerts.push({ type: 'danger', msg });
  }

  function isJSON(structureName, jsonStr) {
    try {
      JSON.parse(jsonStr);
    } catch (e) {
      addAlert(`Illegal JSON object in ${structureName}. ${e.message}.`);
      return false;
    }
    return true;
  }

  function validateJSON() {
    for (const structure in state.data) {
      if (structure !== 'name' && structure !== 'hasPlatform' && !isJSON(structure, state.data[structure])) {
        return false;
      }
    }
    return true;
  }

  function createDataToSubmit() {
    return {
      name: state.data.name,
      hasPlatform: state.data.hasPlatform,
      dataStructure: JSON.parse(state.data.dataStructure),
      appStructure: JSON.parse(state.data.appStructure),
      portfolioStructure: JSON.parse(state.data.portfolioStructure),
      platformDataStructure: JSON.parse(state.data.platformDataStructure),
      platformAppStructure: JSON.parse(state.data.platformAppStructure),
      platformPortfolioStructure: JSON.parse(state.data.platformPortfolioStructure),
    };
  }

  function save(message) {
    state.alerts = [];
    if (!validateJSON()) {
      render();
      return;
    }
    state.saveComplete = false;
    state.saveErrorMessage = '';
    render();
    huashan
      .saveTemplateJsonFiles(session.getCredentials(), state.data.name, {
        data: createDataToSubmit(),
        commitMessage: message,
      })
      .then((response) => {
        state.saveComplete = true;
        if (response.status === false) {
          state.saveErrorMessage = response.msg;
          addAlert(state.saveErrorMessage);
        } else {
          state.dataCopy = structuredClone(state.data);
        }
        render();
      });
  }

  function saveWithCommit(commitMessage = 'Save Changes!') {
    save(commitMessage);
    closeCommitMessageModal();
  }

  setNavigationGuard((nextPath) => {
    if (nextPath.indexOf('/json/') !== -1) return true;
    if (isUnchanged()) return true;
    const confirmed = confirm(`You have unsaved changes in json, continue navigating to ${nextPath} ?`);
    if (!confirmed) return false;
    state.data = structuredClone(state.dataCopy);
    return true;
  });

  getTemplateJsonFiles();
  render();

  return () => {
    editors.forEach((editor) => editor.destroy());
    clearNavigationGuard();
  };
}
