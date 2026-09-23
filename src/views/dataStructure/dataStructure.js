/* Ported from dataStructureController.ts + views/datastructure.html.
 *
 * Not ported: the `#checkSaveModal` markup in the legacy view ("Do you want
 * to save changes to data structure?" / Save|Discard) has no trigger
 * anywhere in the view or controller (no data-target/data-toggle references
 * it) - it's dead markup, unreachable in the original app too. The live
 * save flow is the bottom "save" button -> commitMessageModal, same as the
 * other structure views.
 */
import { huashan, isRequestAborted } from '../../api/huashanClient.js';
import { session, restoreSession } from '../../core/session.js';
import { smartorg, SERVER_URL } from '../../core/config.js';
import { setNavigationGuard, clearNavigationGuard } from '../../core/router.js';
import { appNavHtml } from '../../components/appNav.js';
import { renderAlerts, wireAlertClose } from '../../components/alerts.js';
import { commitMessageModalHtml, initCommitMessageModal, closeCommitMessageModal } from '../../components/commitMessageModal.js';
import { applyFixedHeader } from '../../components/fixedHeader.js';
import { initTooltips } from '../../components/uiInteractions.js';
import { loadingOverlayHtml } from '../../components/loadingOverlay.js';
import { handleLoadError, loadErrorHtml, loadErrorMessage, requireResponseResult } from '../../components/loadError.js';
import { inputEditorHtml, wireInputEditor } from './inputEditor.js';
import { tableInputEditorHtml, wireTableInputEditor } from './tableInputEditor.js';
import { outputEditorHtml, wireOutputEditor } from './outputEditor.js';

function getIsAdmin() {
  try {
    const infoGot = localStorage.getItem('INFO');
    if (!infoGot) return false;
    return !!JSON.parse(atob(infoGot)).is_admin;
  } catch (e) {
    return false;
  }
}

export function mount(container, params) {
  if (!restoreSession()) return () => {};
  let disposed = false;

  const state = {
    selectedTemplate: params.templateID,
    isPlatform: !!params.isPlatform,
    isAdmin: getIsAdmin(),
    showLoading: true,
    loadError: '',
    activeTab: 'input',
    data: null,
    includedComponents: null,
    includedComponentsCopy: null,
    excludedComponents: null,
    potentialTableInputs: [],
    potentialTableInputsLoaded: false,
    includedPotentialTableInputs: [],
    excludedPotentialTableInputs: [],
    potentialTableListsBuilt: false,
    htmlPreview: null,
    imageURL: '',
    selectedCelllink: 'Not Selected',
    selected: null,
    saveComplete: true,
    saveErrorMessage: '',
    alerts: [],
    searchInput: '',
    searchOutput: '',
    show2: true, // global "Edit"/"Done" toggle at the bottom of the page
    rowShow: new Map(), // per-row edit-pencil toggle, keyed by CellLink
  };

  function isRowShown(cellLink) {
    return state.rowShow.has(cellLink) ? state.rowShow.get(cellLink) : true;
  }
  function setRowShown(cellLink, val) {
    state.rowShow.set(cellLink, val);
  }

  function isUnchanged() {
    return JSON.stringify(state.includedComponents) === JSON.stringify(state.includedComponentsCopy);
  }

  function verifyKey(element) {
    if (element.Key === undefined) {
      element.Key = element.CellLink.substring(element.CellLink.indexOf('!') + 1);
    }
  }

  function setPreview(ptInput) {
    if (ptInput && ptInput.HtmlPreview) {
      state.htmlPreview = ptInput.HtmlPreview;
      state.imageURL = '';
    } else if (ptInput && ptInput.PreviewURL) {
      state.imageURL = SERVER_URL + ptInput.PreviewURL;
      state.htmlPreview = null;
    } else {
      state.imageURL = '';
      state.htmlPreview = null;
    }
  }

  // ---- data loading ----

  function buildPotentialTableLists() {
    if (state.potentialTableListsBuilt) return;
    if (!state.includedComponents || !state.excludedComponents || !state.potentialTableInputsLoaded) return;
    state.potentialTableListsBuilt = true;
    const potentialByCellLink = new Map(state.potentialTableInputs.map((table) => [table.CellLink, table]));
    const includedTables = state.includedComponents.Inputs.filter((input) => input.Type === 'TABLE');
    const includedCellLinks = new Set(includedTables.map((input) => input.CellLink));
    state.includedPotentialTableInputs = includedTables.map((input) => ({
      ...input,
      ...(potentialByCellLink.get(input.CellLink) || {}),
      CellLink: input.CellLink,
    }));
    state.excludedPotentialTableInputs = state.potentialTableInputs.filter((table) => !includedCellLinks.has(table.CellLink));
    render();
  }

  function getPotentialTableInputs() {
    return smartorg.wizard
      .fetchPotentialTableInputs(params.templateID)
      .then((ptInputs) => {
        state.potentialTableInputs = (ptInputs.data && ptInputs.data.PotentialTableInputs) || [];
        state.potentialTableInputsLoaded = true;
        buildPotentialTableLists();
      })
      .catch(handleInitialLoadError);
  }

  function getIncludedDataStructureComponents() {
    return huashan.getIncludedDataStructureComponents(session.getCredentials(), params.templateID, state.isPlatform).then((data) => {
      requireResponseResult(data, 'Loading the data structure');
      state.data = data;
      state.includedComponents = data.result;
      state.includedComponentsCopy = structuredClone(state.includedComponents);
      getPotentialTableInputs();
      render();
    }).catch(handleInitialLoadError);
  }

  function getExcludedDataStructureComponents() {
    return huashan.getExcludedDataStructureComponents(session.getCredentials(), params.templateID, state.isPlatform).then((data) => {
      requireResponseResult(data, 'Loading excluded data structure components');
      if (!data.result.Excluded) throw new Error('Excluded data structure components were missing from the response.');
      state.showLoading = false;
      state.excludedComponents = data.result.Excluded;
      buildPotentialTableLists();
      render();
    }).catch(handleInitialLoadError);
  }

  function handleInitialLoadError(error) {
    if (disposed) return;
    state.showLoading = false;
    handleLoadError(error, state, render);
  }

  function loadDataStructure() {
    state.loadError = '';
    state.showLoading = true;
    state.data = null;
    state.includedComponents = null;
    state.includedComponentsCopy = null;
    state.excludedComponents = null;
    state.potentialTableInputs = [];
    state.potentialTableInputsLoaded = false;
    state.includedPotentialTableInputs = [];
    state.excludedPotentialTableInputs = [];
    state.potentialTableListsBuilt = false;
    render();
    getIncludedDataStructureComponents();
    getExcludedDataStructureComponents();
  }

  // ---- actions ----

  function includePotentialTableInput(ptInput) {
    verifyKey(ptInput);
    const standardptInput = {
      Description: '',
      Val: [],
      Constraint: 'double',
      CellLink: ptInput.CellLink,
      Key: ptInput.Key,
      Inherited: false,
      Units: '',
      Type: 'TABLE',
      Display: '',
    };
    state.includedPotentialTableInputs.push(ptInput);
    state.includedComponents.Inputs.push(standardptInput);
    const availableIndex = state.excludedPotentialTableInputs.indexOf(ptInput);
    if (availableIndex > -1) state.excludedPotentialTableInputs.splice(availableIndex, 1);
    const excludedIndex = state.excludedComponents.Inputs.findIndex((input) => input.CellLink === ptInput.CellLink);
    if (excludedIndex > -1) state.excludedComponents.Inputs.splice(excludedIndex, 1);

    const last = state.includedPotentialTableInputs[state.includedPotentialTableInputs.length - 1];
    select(last);
    setPreview(last);
    render();
  }

  function excludePotentialTableInput(ptInput) {
    let index = -1;
    for (let i = 0; i < state.includedComponents.Inputs.length; i++) {
      if (state.includedComponents.Inputs[i].CellLink === ptInput.CellLink) {
        index = i;
        break;
      }
    }
    if (index > -1) state.includedComponents.Inputs.splice(index, 1);

    let indexOfExcluded = -1;
    for (let i = 0; i < state.excludedComponents.Inputs.length; i++) {
      if (state.excludedComponents.Inputs[i].CellLink === ptInput.CellLink) {
        indexOfExcluded = i;
        break;
      }
    }
    if (indexOfExcluded > -1) state.excludedComponents.Inputs.splice(indexOfExcluded, 1);

    const indexOfIncludedPTI = state.includedPotentialTableInputs.indexOf(ptInput);
    if (indexOfIncludedPTI > -1) state.includedPotentialTableInputs.splice(indexOfIncludedPTI, 1);
    if (!state.excludedPotentialTableInputs.includes(ptInput)) state.excludedPotentialTableInputs.push(ptInput);
    if (state.includedPotentialTableInputs.length > 0) {
      const last = state.includedPotentialTableInputs[state.includedPotentialTableInputs.length - 1];
      select(last);
      setPreview(last);
    } else {
      setPreview(null);
    }
    render();
  }

  function select(ptInput) {
    if (!ptInput) return;
    state.selectedCelllink = ptInput.CellLink;
    state.includedPotentialTableInputs.forEach((item) => {
      if (item.CellLink === state.selectedCelllink) {
        state.selected = item;
        setPreview(item);
      }
    });
  }

  function selectedChooseFrom(ptInput) {
    state.selectedCelllink = ptInput.CellLink;
    state.selected = ptInput;
    setPreview(ptInput);
    render();
  }

  function includeInput(input) {
    verifyKey(input);
    state.includedComponents.Inputs.push(input);
    const index = state.excludedComponents.Inputs.indexOf(input);
    state.excludedComponents.Inputs.splice(index, 1);
    render();
  }

  function excludeInput(input) {
    state.excludedComponents.Inputs.push(input);
    const index = state.includedComponents.Inputs.indexOf(input);
    state.includedComponents.Inputs.splice(index, 1);
    render();
  }

  function includeOutput(output) {
    verifyKey(output);
    state.includedComponents.Outputs.push(output);
    const index = state.excludedComponents.Outputs.indexOf(output);
    state.excludedComponents.Outputs.splice(index, 1);
    render();
  }

  function excludeOutput(output) {
    state.excludedComponents.Outputs.push(output);
    const index = state.includedComponents.Outputs.indexOf(output);
    state.includedComponents.Outputs.splice(index, 1);
    render();
  }

  function changeType(input, type) {
    input.Type = type;
    switch (input.Type) {
      case 'TABLE':
        input.Val = '';
        break;
      case 'DISTRIBUTION':
        input.Val = [0, 0, 0];
        break;
      case 'SCALAR':
        input.Val = 0;
        break;
      case 'DATE':
        input.Val = '';
        break;
      default:
        input.Val = 'Invalid Type';
    }
    render();
  }

  function addAlert(msg) {
    state.alerts.push({ type: 'danger', msg });
  }

  function createDataToSubmit() {
    return {
      ID: state.data.result.ID,
      Description: state.data.result.Description,
      ExcelFile: state.data.result.ExcelFile,
      Inputs: state.includedComponents.Inputs,
      Outputs: state.includedComponents.Outputs,
    };
  }

  function save(message) {
    state.saveComplete = false;
    state.alerts = [];
    state.saveErrorMessage = '';
    render();
    huashan
      .saveDataStructure(
        session.getCredentials(),
        params.templateID,
        { data: createDataToSubmit(), commitMessage: message },
        state.isPlatform
      )
      .then((response) => {
        state.saveComplete = true;
        if (response.status === false) {
          state.saveErrorMessage = response.msg;
          addAlert(state.saveErrorMessage);
        } else {
          state.includedComponentsCopy = structuredClone(state.includedComponents);
        }
        render();
      })
      .catch((error) => {
        if (disposed || isRequestAborted(error)) return;
        state.saveComplete = true;
        addAlert(loadErrorMessage(error, 'The data structure could not be saved.'));
        render();
      });
  }

  function saveWithCommit(commitMessage = 'Save Changes!') {
    save(commitMessage);
    closeCommitMessageModal();
  }

  // ---- rendering ----

  function render() {
    if (disposed) return;
    if (state.loadError) {
      container.innerHTML = `
${appNavHtml({ active: 'dataStructure', isAdmin: state.isAdmin, selectedTemplate: state.selectedTemplate })}
${loadErrorHtml({ title: 'Data structure could not be loaded.', message: state.loadError, retryId: 'ds-load-retry' })}`;
      container.querySelector('#ds-load-retry').addEventListener('click', loadDataStructure);
      return;
    }
    if (state.showLoading || !state.includedComponents || !state.excludedComponents) {
      container.innerHTML = `
${appNavHtml({ active: 'dataStructure', isAdmin: state.isAdmin, selectedTemplate: state.selectedTemplate })}
${loadingOverlayHtml()}`;
      return;
    }

    container.innerHTML = `
${appNavHtml({ active: 'dataStructure', isAdmin: state.isAdmin, selectedTemplate: state.selectedTemplate })}

<div class="select-template no-padding">
  <div class="animated fadeIn">
    <ul class="nav nav-tabs">
      <li class="${state.activeTab === 'input' ? 'active' : ''}"><a href="" data-tab="input">Input</a></li>
      <li class="${state.activeTab === 'table' ? 'active' : ''}"><a href="" data-tab="table">Table Inputs</a></li>
      <li class="${state.activeTab === 'output' ? 'active' : ''}"><a href="" data-tab="output">Output</a></li>
    </ul>
    <div class="tab-content">
      ${state.activeTab === 'input' ? inputEditorHtml(state, isRowShown) : ''}
      ${state.activeTab === 'table' ? tableInputEditorHtml(state, isRowShown) : ''}
      ${state.activeTab === 'output' ? outputEditorHtml(state, isRowShown) : ''}
    </div>
  </div>
</div>

<div class="col-sm-12 text-center align-to-bottom">
  <a href="#/selectTemplate" class="btn btn-primary pull-left" role="button"><span class="glyphicon glyphicon-chevron-left"></span> Previous: Select Template</a>
  <a href="#/appstructure/${encodeURIComponent(state.selectedTemplate)}" class="btn btn-primary pull-right" role="button">Next: App Structure <span class="glyphicon glyphicon-chevron-right"></span></a>

  ${state.show2
    ? `<button type="button" class="btn btn-success" id="ds-edit-toggle">Edit</button>`
    : `<button type="button" class="btn btn-danger" id="ds-edit-toggle"><span class="glyphicon glyphicon-ok"></span></button>`}

  <button class="btn btn-danger" style="width:60px;" id="ds-save-open-btn" data-toggle="modal" data-target="#commitMessageModal" ${isUnchanged() ? 'disabled' : ''}>
    <i class="fa fa-spinner fa-spin fa-lg" ${state.saveComplete ? 'hidden' : ''}></i><span ${state.saveComplete ? '' : 'hidden'}>save</span>
  </button>

  <div class="col-sm-12 save-alert" id="ds-alerts">${renderAlerts(state.alerts, { prefix: 'Saving failed.' })}</div>
</div>

${commitMessageModalHtml()}`;

    wireEvents();
    initTooltips(container);
    const inputTable = container.querySelector('#inputTable');
    if (inputTable) applyFixedHeader(inputTable);
    const outputTable = container.querySelector('#outputTable');
    if (outputTable) applyFixedHeader(outputTable);
    initCommitMessageModal(container, saveWithCommit);
    wireAlertClose(container.querySelector('#ds-alerts'), state.alerts, render);
  }

  function wireEvents() {
    container.querySelectorAll('[data-tab]').forEach((element) => {
      element.addEventListener('click', (event) => {
        event.preventDefault();
        state.activeTab = element.dataset.tab;
        render();
      });
    });

    container.querySelector('#ds-edit-toggle')?.addEventListener('click', () => {
      state.show2 = !state.show2;
      render();
    });

    const shared = {
      container,
      state,
      setRowShown,
      render,
      refreshSaveButton,
    };
    if (state.activeTab === 'input') {
      wireInputEditor({
        ...shared,
        includeInput,
        excludeInput,
        changeType,
      });
    } else if (state.activeTab === 'table') {
      wireTableInputEditor({
        ...shared,
        includeTable: includePotentialTableInput,
        excludeTable: excludePotentialTableInput,
        chooseTable: selectedChooseFrom,
        selectTable: select,
      });
    } else {
      wireOutputEditor({
        ...shared,
        includeOutput,
        excludeOutput,
      });
    }
  }
  function refreshSaveButton() {
    const btn = container.querySelector('#ds-save-open-btn');
    if (btn) btn.disabled = isUnchanged();
  }

  // ---- init ----

  setNavigationGuard((nextPath) => {
    if (isUnchanged()) return true;
    const confirmed = confirm(`You have unsaved changes in data structure, continue navigating to ${nextPath} ?`);
    if (!confirmed) return false;
    state.includedComponents = structuredClone(state.includedComponentsCopy);
    return true;
  });

  loadDataStructure();

  return () => {
    disposed = true;
    clearNavigationGuard();
  };
}
