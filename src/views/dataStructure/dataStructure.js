/* Ported from dataStructureController.ts + views/datastructure.html.
 *
 * Not ported: the `#checkSaveModal` markup in the legacy view ("Do you want
 * to save changes to data structure?" / Save|Discard) has no trigger
 * anywhere in the view or controller (no data-target/data-toggle references
 * it) - it's dead markup, unreachable in the original app too. The live
 * save flow is the bottom "save" button -> commitMessageModal, same as the
 * other structure views.
 */
import { huashan } from '../../api/huashanClient.js';
import { session, restoreSession } from '../../core/session.js';
import { smartorg, SERVER_URL } from '../../core/config.js';
import { setNavigationGuard, clearNavigationGuard } from '../../core/router.js';
import { appNavHtml } from '../../components/appNav.js';
import { renderAlerts, wireAlertClose } from '../../components/alerts.js';
import { commitMessageModalHtml, initCommitMessageModal, closeCommitMessageModal } from '../../components/commitMessageModal.js';
import { applyFixedHeader } from '../../components/fixedHeader.js';
import { initTooltips } from '../../components/bootstrapUI.js';
import { escapeHtml, extractTablePreviewHtml } from '../../core/html.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getIsAdmin() {
  try {
    const infoGot = localStorage.getItem('INFO');
    if (!infoGot) return false;
    return !!JSON.parse(atob(infoGot)).is_admin;
  } catch (e) {
    return false;
  }
}

function initDataEdit(val) {
  if (!val || typeof val === 'object') val = 'Jan 1990';
  const temp = val.split(' ');
  return { month: temp[0], year: temp[1] };
}

function updateFormat(val, month, year) {
  if (!val) val = 'Jan 1990';
  const temp = val.split(' ');
  if (!month) month = temp[0];
  if (!year) year = temp[1];
  return `${month} ${year}`;
}

export function mount(container, params) {
  if (!restoreSession()) return () => {};

  const state = {
    selectedTemplate: params.templateID,
    isPlatform: !!params.isPlatform,
    isAdmin: getIsAdmin(),
    showLoading: true,
    activeTab: 'input',
    data: null,
    includedComponents: null,
    includedComponentsCopy: null,
    excludedComponents: null,
    potentialTableInputs: [],
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
    if (!state.includedComponents || !state.excludedComponents || !state.potentialTableInputs) return;
    state.potentialTableListsBuilt = true;
    state.includedPotentialTableInputs = [];
    getExcludedPotentialTableInputs(state.potentialTableInputs, state.includedPotentialTableInputs);
    render();
  }

  function getExcludedPotentialTableInputs(pTIs, includedPotentialTableInputs) {
    state.includedComponents.Inputs.forEach((item) => {
      pTIs.forEach((ptItem, index) => {
        if (ptItem.CellLink === item.CellLink) {
          includedPotentialTableInputs.push(ptItem);
          pTIs.splice(index, 1);
        }
      });
    });
    state.excludedComponents.Inputs.forEach((item) => {
      pTIs.forEach((ptItem, index) => {
        if (ptItem.CellLink === item.CellLink) {
          includedPotentialTableInputs.push(ptItem);
          pTIs.splice(index, 1);
        }
      });
    });
    state.excludedPotentialTableInputs = state.potentialTableInputs;
  }

  function getPotentialTableInputs() {
    smartorg.wizard
      .fetchPotentialTableInputs(params.templateID)
      .then((ptInputs) => {
        state.potentialTableInputs = (ptInputs.data && ptInputs.data.PotentialTableInputs) || [];
        buildPotentialTableLists();
      })
      .catch(() => {});
  }

  function getIncludedDataStructureComponents() {
    huashan.getIncludedDataStructureComponents(session.getCredentials(), params.templateID, state.isPlatform).then((data) => {
      state.data = data;
      state.includedComponents = data.result;
      state.includedComponentsCopy = structuredClone(state.includedComponents);
      getPotentialTableInputs();
      render();
    });
  }

  function getExcludedDataStructureComponents() {
    huashan.getExcludedDataStructureComponents(session.getCredentials(), params.templateID, state.isPlatform).then((data) => {
      state.showLoading = false;
      state.excludedComponents = data.result.Excluded;
      buildPotentialTableLists();
      render();
    });
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
    const index = state.potentialTableInputs.indexOf(ptInput);
    state.potentialTableInputs.splice(index, 1);

    if (state.includedPotentialTableInputs.length > 0) {
      const last = state.includedPotentialTableInputs[state.includedPotentialTableInputs.length - 1];
      select(last);
      setPreview(last);
    } else {
      select(state.includedPotentialTableInputs[0]);
      setPreview(state.includedPotentialTableInputs[0]);
    }
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
    state.includedPotentialTableInputs.splice(indexOfIncludedPTI, 1);
    state.excludedPotentialTableInputs.push(ptInput);
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

  function changeType(input) {
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
      });
  }

  function saveWithCommit(commitMessage = 'Save Changes!') {
    save(commitMessage);
    closeCommitMessageModal();
  }

  // ---- rendering ----

  function filterByCellLink(list, text) {
    if (!text) return list;
    const needle = text.toLowerCase();
    return list.filter((item) => (item.CellLink || '').toLowerCase().includes(needle));
  }

  function filterGeneric(list, text) {
    if (!text) return list;
    const needle = text.toLowerCase();
    return list.filter((item) => {
      try {
        return JSON.stringify(item).toLowerCase().includes(needle);
      } catch (e) {
        return true;
      }
    });
  }

  function dateEditorHtml(input, cellLink) {
    const parsed = initDataEdit(input.Val);
    return `
      <div>Month</div>
      <select class="form-control" style="width: 80px;" data-date-month="${escapeHtml(cellLink)}">
        ${MONTHS.map((m) => `<option value="${m}" ${parsed.month === m ? 'selected' : ''}>${m}</option>`).join('')}
      </select>
      <div>Year</div>
      <input type="text" class="form-control" style="width: 80px;" data-date-year="${escapeHtml(cellLink)}" value="${escapeHtml(parsed.year)}">`;
  }

  function inputValueViewHtml(input) {
    switch (input.Type) {
      case 'SCALAR':
        return `<p>${escapeHtml(input.Val)}</p>`;
      case 'DISTRIBUTION':
        return `<p>${escapeHtml(input.Val && input.Val[0])}<br/>${escapeHtml(input.Val && input.Val[1])}<br/>${escapeHtml(input.Val && input.Val[2])}</p>`;
      case 'TABLE':
        return `<p>${escapeHtml(input.Key)}</p>`;
      case 'DATE':
        return `<p>${escapeHtml(input.Val)}</p>`;
      default:
        return '';
    }
  }

  function inputValueEditHtml(input, cellLink) {
    switch (input.Type) {
      case 'SCALAR':
        return `<input type="text" class="form form-control" style="width:100%;" data-input-val="${escapeHtml(cellLink)}" value="${escapeHtml(input.Val)}">`;
      case 'DISTRIBUTION':
        return `
          <input type="text" class="form form-control" style="width:100%;" data-input-val0="${escapeHtml(cellLink)}" value="${escapeHtml(input.Val && input.Val[0])}"><br/>
          <input type="text" class="form form-control" style="width:100%;" data-input-val1="${escapeHtml(cellLink)}" value="${escapeHtml(input.Val && input.Val[1])}"><br/>
          <input type="text" class="form form-control" style="width:100%;" data-input-val2="${escapeHtml(cellLink)}" value="${escapeHtml(input.Val && input.Val[2])}"><br/>`;
      case 'TABLE':
        return `<div>${escapeHtml(input.Key)}</div>`;
      case 'DATE':
        return `<div>${dateEditorHtml(input, cellLink)}</div>`;
      default:
        return '';
    }
  }

  function inputRowHtml(input) {
    if (input.Type === 'TABLE') return '';
    const cellLink = input.CellLink;
    const rowShow = isRowShown(cellLink);
    const editing = !rowShow || !state.show2;
    const readOnly = rowShow && state.show2;
    return `
      <tr>
        <td style="min-width: 20px;max-width: 20px;border:none;background-color: white;">
          <a href="" class="text-danger" data-exclude-input="${escapeHtml(cellLink)}"><i class="fa fa-minus-square"></i></a>
        </td>
        <td style="min-width: 150px;max-width: 150px;">
          <div class="no-wrap" title="${escapeHtml(cellLink)}" data-toggle="tooltip">${escapeHtml(cellLink)}</div>
          ${editing ? `<input type="text" style="width:100%;" class="form form-control" data-input-key="${escapeHtml(cellLink)}" value="${escapeHtml(input.Key)}">` : ''}
        </td>
        <td style="min-width: 100px;max-width: 100px;">
          ${readOnly ? `<p>${escapeHtml(input.Display)}</p>` : `<input type="text" style="width:100%;" class="form form-control" data-input-display="${escapeHtml(cellLink)}" value="${escapeHtml(input.Display)}">`}
        </td>
        <td style="min-width: 70px;max-width: 70px;">
          ${readOnly ? `<p>${escapeHtml(input.Units)}</p>` : `<input type="text" style="width:100%;" class="form form-control" data-input-units="${escapeHtml(cellLink)}" value="${escapeHtml(input.Units)}">`}
        </td>
        <td style="min-width: 260px;max-width: 260px;">
          ${readOnly ? `<p>${escapeHtml(input.Description)}</p>` : `<textarea class="form form-control" style="height:100px;" data-input-description="${escapeHtml(cellLink)}">${escapeHtml(input.Description)}</textarea>`}
        </td>
        <td style="min-width: 100px;max-width: 100px;">
          ${readOnly ? inputValueViewHtml(input) : inputValueEditHtml(input, cellLink)}
        </td>
        <td style="min-width: 150px;max-width: 150px;">
          ${readOnly && input.Table === undefined ? `<p>${escapeHtml(input.Type)}</p>` : ''}
          ${!readOnly && input.Table === undefined ? `
          <select class="btn btn-default form-control" data-input-type="${escapeHtml(cellLink)}">
            ${['DISTRIBUTION', 'SCALAR', 'TABLE', 'DATE'].map((t) => `<option value="${t}" ${input.Type === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>` : ''}
          ${input.Table !== undefined ? `<p>${escapeHtml(input.Type)}</p>` : ''}
        </td>
        <td style="min-width: 100px;max-width: 100px;">
          ${readOnly ? `<p>${escapeHtml(input.Constraint)}</p>` : `
          <select class="btn btn-default form-control" data-input-constraint="${escapeHtml(cellLink)}">
            ${['double', 'string', 'integer', 'date', 'year'].map((c) => `<option value="${c}" ${input.Constraint === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>`}
        </td>
        <td align="center" style="min-width: 70px;max-width: 70px;">
          <input type="checkbox" data-input-inherited="${escapeHtml(cellLink)}" ${input.Inherited ? 'checked' : ''} ${readOnly ? 'disabled' : ''}>
        </td>
        <td style="min-width: 70px;max-width: 70px;">
          ${readOnly ? `<button type="button" class="btn btn-success btn-sm" data-row-edit="${escapeHtml(cellLink)}"><span class="glyphicon glyphicon-pencil"></span></button>` : `<button type="button" class="btn btn-danger" data-row-done="${escapeHtml(cellLink)}"><span class="glyphicon glyphicon-ok"></span></button>`}
        </td>
      </tr>`;
  }

  function potentialInputRowHtml(ptInput) {
    if (ptInput.Type !== 'TABLE') return '';
    const cellLink = ptInput.CellLink;
    const rowShow = isRowShown(cellLink);
    const editing = !rowShow || !state.show2;
    const readOnly = rowShow && state.show2;
    const selectedClass = state.selectedCelllink === cellLink ? 'selectPTI' : '';
    return `
      <tr class="${selectedClass}" data-select-pti="${escapeHtml(cellLink)}">
        <td><a href="" class="text-danger" data-exclude-pti="${escapeHtml(cellLink)}"><i class="fa fa-minus-square"></i></a></td>
        <td>
          <div class="no-wrap" title="${escapeHtml(cellLink)}" data-toggle="tooltip">${escapeHtml(cellLink)}</div>
          ${editing ? `<input type="text" style="width:100%;" class="form form-control" data-pti-key="${escapeHtml(cellLink)}" value="${escapeHtml(ptInput.Key)}">` : ''}
        </td>
        <td>${readOnly ? `<p>${escapeHtml(ptInput.Display)}</p>` : `<input type="text" style="width:100%;" class="form form-control" data-pti-display="${escapeHtml(cellLink)}" value="${escapeHtml(ptInput.Display)}">`}</td>
        <td align="center"><input type="checkbox" data-pti-inherited="${escapeHtml(cellLink)}" ${ptInput.Inherited ? 'checked' : ''} ${readOnly ? 'disabled' : ''}></td>
        <td>
          ${readOnly ? `<button type="button" class="btn btn-success btn-sm" data-row-edit="${escapeHtml(cellLink)}"><span class="glyphicon glyphicon-pencil"></span></button>` : `<button type="button" class="btn btn-danger" data-row-done="${escapeHtml(cellLink)}"><span class="glyphicon glyphicon-ok"></span></button>`}
        </td>
      </tr>`;
  }

  function outputRowHtml(output) {
    const cellLink = output.CellLink;
    const rowShow = isRowShown(cellLink);
    const editing = !rowShow;
    const readOnly = rowShow;
    return `
      <tr>
        <td style="border:none;background-color: white;min-width: 20px;max-width: 20px;">
          <a href="" class="text-danger" data-exclude-output="${escapeHtml(cellLink)}"><i class="fa fa-minus-square"></i></a>
        </td>
        <td style="min-width: 400px;max-width: 400px;">
          <div class="no-wrap" title="${escapeHtml(cellLink)}" data-toggle="tooltip">${escapeHtml(cellLink)}</div>
          ${editing ? `<input type="text" style="width:100%;" class="form form-control" data-output-key="${escapeHtml(cellLink)}" value="${escapeHtml(output.Key)}">` : ''}
        </td>
        <td style="min-width: 300px;max-width: 300px;">
          ${readOnly ? `<p>${escapeHtml(output.Display)}</p>` : `<input type="text" style="width:100%;" class="form form-control" data-output-display="${escapeHtml(cellLink)}" value="${escapeHtml(output.Display)}">`}
        </td>
        <td style="min-width: 150px;max-width: 150px;">
          ${readOnly ? `<p>${escapeHtml(output.Units)}</p>` : `<input type="text" style="width:100%;" class="form form-control" data-output-units="${escapeHtml(cellLink)}" value="${escapeHtml(output.Units)}">`}
        </td>
        <td align="center" style="min-width: 150px;max-width: 150px;">
          <input type="checkbox" data-output-postprocessing="${escapeHtml(cellLink)}" ${output.UsePostProcessingOutputs ? 'checked' : ''} ${readOnly ? 'disabled' : ''}>
        </td>
        <td style="min-width: 70px;max-width: 70px;">
          ${readOnly ? `<button type="button" class="btn btn-success" data-row-edit="${escapeHtml(cellLink)}"><span class="glyphicon glyphicon-pencil"></span></button>` : `<button type="button" class="btn btn-danger" data-row-done="${escapeHtml(cellLink)}"><span class="glyphicon glyphicon-ok"></span></button>`}
        </td>
      </tr>`;
  }

  function inputTabHtml() {
    const excluded = filterByCellLink(state.excludedComponents.Inputs, state.searchInput);
    return `
    <div class="select-input">
      <div class="choose-from">
        <div class="select-template-title"><h4>${state.isPlatform ? 'Platform Data Structure' : 'Data Structure'}</h4></div>
        <div class="select-template-title">
          <input type="text" class="form-control" placeholder="Search" id="ds-search-input" value="${escapeHtml(state.searchInput)}">
        </div>
        <div class="panel panel-primary">
          <div class="list-of-templates" id="input-list">
            <ul class="list-group">
              ${excluded
                .map(
                  (input) => `
              <li class="list-group-item" title="${escapeHtml(input.CellLink)}" data-toggle="tooltip">
                <div class="no-wrap">
                  <a href="" class="text-success" data-include-input="${escapeHtml(input.CellLink)}"><i class="fa fa-plus-square"></i></a>
                  ${escapeHtml(input.CellLink)}
                </div>
              </li>`
                )
                .join('')}
            </ul>
          </div>
        </div>
      </div>
      <div class="selected">
        <div class="select-template-title"><h4>Inputs</h4></div>
        <div class="selected-inputs" id="included-inputs">
          <table id="inputTable" class="table table-striped" style="min-width:1100px; max-width:1100px;">
            <thead>
              <tr>
                <th style="border:none;min-width: 20px;max-width: 20px;"></th>
                <th style="min-width: 150px;max-width: 150px;">Excel Range Name</th>
                <th style="min-width: 100px;max-width: 100px;">Display</th>
                <th style="min-width: 70px;max-width: 70px;">Units</th>
                <th style="min-width: 260px;max-width: 260px;">Description</th>
                <th style="min-width: 100px;max-width: 100px;">Default</th>
                <th style="min-width: 150px;max-width: 150px;">Type</th>
                <th style="min-width: 100px;max-width: 100px;">Kind</th>
                <th style="min-width: 70px;max-width: 70px;">Inherited</th>
                <th style="min-width: 70px;max-width: 70px;">Edit</th>
              </tr>
            </thead>
            <tbody>
              ${state.includedComponents.Inputs.map(inputRowHtml).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  }

  function tableInputsTabHtml() {
    const excludedPTI = filterByCellLink(state.excludedPotentialTableInputs, state.searchInput);
    return `
    <div class="select-input">
      <div class="choose-from">
        <div class="select-template-title"><h4>Choose From</h4></div>
        <div class="select-template-title">
          <input type="text" class="form-control" placeholder="Search" id="ds-search-input-table" value="${escapeHtml(state.searchInput)}">
        </div>
        <div class="panel panel-primary">
          <div class="list-of-templates" id="potential-tableInput-list">
            ${excludedPTI
              .map(
                (ptInputs) => `
            <a href="" class="list-group-item ${state.selectedCelllink === ptInputs.CellLink ? 'active' : ''}" data-choose-pti="${escapeHtml(ptInputs.CellLink)}" title="${escapeHtml(ptInputs.CellLink)}" data-toggle="tooltip">
              <table><tr><td class="appStructList">
                <div class="no-wrap">
                  <a href="" class="text-success" data-include-pti="${escapeHtml(ptInputs.CellLink)}"><i class="fa fa-plus-square"></i></a>
                  ${escapeHtml(ptInputs.CellLink)}
                </div>
              </td></tr></table>
            </a>`
              )
              .join('')}
          </div>
        </div>
      </div>
      <div class="selected">
        <div class="select-template-title"><h4>Table Inputs</h4></div>
        <div class="col-sm-12">
          <div class="col-sm-6">
            <div style="border:1px;height:400px;overflow-y:scroll;overflow-x:scroll;margin-top: 30px;margin-left: 10px">
              ${state.htmlPreview ? `<div style="width:100%; height:100%;">${extractTablePreviewHtml(state.htmlPreview)}</div>` : ''}
              ${!state.htmlPreview ? `<img src="${escapeHtml(state.imageURL)}">` : ''}
            </div>
          </div>
          <div class="col-sm-6">
            <div class="selected-inputs" id="potential-included-inputs">
              <div class="table-left">
                <table id="potentialinputTable" class="table table-striped">
                  <thead>
                    <tr>
                      <th width="5%"></th>
                      <th width="35%">Excel Range Name</th>
                      <th>Display</th>
                      <th>Inherited</th>
                      <th>Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${state.includedComponents.Inputs.map(potentialInputRowHtml).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }

  function outputTabHtml() {
    const excluded = filterGeneric(state.excludedComponents.Outputs, state.searchOutput);
    return `
    <div class="select-input">
      <div class="choose-from">
        <div class="select-template-title"><h4>Choose From</h4></div>
        <div class="select-template-title">
          <input type="text" class="form-control" placeholder="Search" id="ds-search-output" value="${escapeHtml(state.searchOutput)}">
        </div>
        <div class="panel panel-primary">
          <div class="list-of-templates">
            <ul class="list-group">
              ${excluded
                .map(
                  (output) => `
              <li class="list-group-item" title="${escapeHtml(output.CellLink)}" data-toggle="tooltip">
                <div class="no-wrap">
                  <a href="" class="text-success" data-include-output="${escapeHtml(output.CellLink)}"><i class="fa fa-plus-square"></i></a>
                  ${escapeHtml(output.CellLink)}
                </div>
              </li>`
                )
                .join('')}
            </ul>
          </div>
        </div>
      </div>
      <div class="selected">
        <div class="select-template-title"><h4>Outputs</h4></div>
        <div class="selected-inputs" id="included-outputs">
          <table id="outputTable" class="table table-striped" style="min-width:1100px; max-width:1100px;">
            <thead>
              <tr>
                <th style="border:none;min-width: 20px;max-width: 20px;"></th>
                <th style="min-width: 400px;max-width: 400px;">Excel Range Name</th>
                <th style="min-width: 300px;max-width: 300px;">Display</th>
                <th style="min-width: 150px;max-width: 150px;">Units</th>
                <th style="min-width: 150px;max-width: 150px;">Postprocessing</th>
                <th style="min-width: 70px;max-width: 70px;">Edit</th>
              </tr>
            </thead>
            <tbody>
              ${state.includedComponents.Outputs.map(outputRowHtml).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  }

  function render() {
    if (state.showLoading || !state.includedComponents || !state.excludedComponents) {
      container.innerHTML = `
${appNavHtml({ active: 'dataStructure', isAdmin: state.isAdmin, selectedTemplate: state.selectedTemplate })}
<div id="loadingSpinner"></div>`;
      if (state.showLoading) startSpinner(container.querySelector('#loadingSpinner'));
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
      ${state.activeTab === 'input' ? inputTabHtml() : ''}
      ${state.activeTab === 'table' ? tableInputsTabHtml() : ''}
      ${state.activeTab === 'output' ? outputTabHtml() : ''}
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

  function startSpinner(target) {
    if (!target || typeof window.Spinner === 'undefined' || typeof window.iosOverlay === 'undefined') return;
    const opts = {
      lines: 13,
      length: 11,
      width: 5,
      radius: 17,
      corners: 1,
      rotate: 0,
      color: '#FFF',
      speed: 1,
      trail: 60,
      shadow: false,
      hwaccel: false,
      className: 'spinner',
      zIndex: 2e9,
      top: 'auto',
      left: 'auto',
    };
    const spinner = new window.Spinner(opts).spin(target);
    window.iosOverlay({ text: 'Loading', spinner, parentEl: 'loadingSpinner' });
  }

  function wireEvents() {
    container.querySelectorAll('[data-tab]').forEach((el) => {
      el.addEventListener('click', (evt) => {
        evt.preventDefault();
        state.activeTab = el.getAttribute('data-tab');
        render();
      });
    });

    const editToggle = container.querySelector('#ds-edit-toggle');
    if (editToggle) {
      editToggle.addEventListener('click', () => {
        state.show2 = !state.show2;
        render();
      });
    }

    const searchInputEl = container.querySelector('#ds-search-input') || container.querySelector('#ds-search-input-table');
    if (searchInputEl) {
      searchInputEl.addEventListener('input', (e) => {
        state.searchInput = e.target.value;
        render();
      });
    }
    const searchOutputEl = container.querySelector('#ds-search-output');
    if (searchOutputEl) {
      searchOutputEl.addEventListener('input', (e) => {
        state.searchOutput = e.target.value;
        render();
      });
    }

    container.querySelectorAll('[data-include-input]').forEach((el) => {
      el.addEventListener('click', (evt) => {
        evt.preventDefault();
        includeInput(findByCellLink(state.excludedComponents.Inputs, el.getAttribute('data-include-input')));
      });
    });
    container.querySelectorAll('[data-exclude-input]').forEach((el) => {
      el.addEventListener('click', (evt) => {
        evt.preventDefault();
        excludeInput(findByCellLink(state.includedComponents.Inputs, el.getAttribute('data-exclude-input')));
      });
    });
    container.querySelectorAll('[data-include-output]').forEach((el) => {
      el.addEventListener('click', (evt) => {
        evt.preventDefault();
        includeOutput(findByCellLink(state.excludedComponents.Outputs, el.getAttribute('data-include-output')));
      });
    });
    container.querySelectorAll('[data-exclude-output]').forEach((el) => {
      el.addEventListener('click', (evt) => {
        evt.preventDefault();
        excludeOutput(findByCellLink(state.includedComponents.Outputs, el.getAttribute('data-exclude-output')));
      });
    });
    container.querySelectorAll('[data-include-pti]').forEach((el) => {
      el.addEventListener('click', (evt) => {
        evt.preventDefault();
        includePotentialTableInput(findByCellLink(state.excludedPotentialTableInputs, el.getAttribute('data-include-pti')));
      });
    });
    container.querySelectorAll('[data-exclude-pti]').forEach((el) => {
      el.addEventListener('click', (evt) => {
        evt.preventDefault();
        excludePotentialTableInput(findByCellLink(state.includedPotentialTableInputs, el.getAttribute('data-exclude-pti')));
      });
    });
    container.querySelectorAll('[data-choose-pti]').forEach((el) => {
      el.addEventListener('click', (evt) => {
        evt.preventDefault();
        selectedChooseFrom(findByCellLink(state.excludedPotentialTableInputs, el.getAttribute('data-choose-pti')));
      });
    });
    container.querySelectorAll('[data-select-pti]').forEach((el) => {
      el.addEventListener('click', () => {
        select(findByCellLink(state.includedPotentialTableInputs, el.getAttribute('data-select-pti')));
        render();
      });
    });

    container.querySelectorAll('[data-row-edit]').forEach((el) => {
      el.addEventListener('click', () => {
        setRowShown(el.getAttribute('data-row-edit'), false);
        render();
      });
    });
    container.querySelectorAll('[data-row-done]').forEach((el) => {
      el.addEventListener('click', () => {
        setRowShown(el.getAttribute('data-row-done'), true);
        render();
      });
    });

    bindField('[data-input-key]', (cl, val) => findByCellLink(state.includedComponents.Inputs, cl).Key = val);
    bindField('[data-input-display]', (cl, val) => findByCellLink(state.includedComponents.Inputs, cl).Display = val);
    bindField('[data-input-units]', (cl, val) => findByCellLink(state.includedComponents.Inputs, cl).Units = val);
    bindField('[data-input-description]', (cl, val) => findByCellLink(state.includedComponents.Inputs, cl).Description = val, true);
    bindField('[data-input-val]', (cl, val) => findByCellLink(state.includedComponents.Inputs, cl).Val = val);
    bindField('[data-input-val0]', (cl, val) => ensureArr(findByCellLink(state.includedComponents.Inputs, cl))[0] = val);
    bindField('[data-input-val1]', (cl, val) => ensureArr(findByCellLink(state.includedComponents.Inputs, cl))[1] = val);
    bindField('[data-input-val2]', (cl, val) => ensureArr(findByCellLink(state.includedComponents.Inputs, cl))[2] = val);
    bindField('[data-input-constraint]', (cl, val) => findByCellLink(state.includedComponents.Inputs, cl).Constraint = val);
    container.querySelectorAll('[data-input-type]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const input = findByCellLink(state.includedComponents.Inputs, el.getAttribute('data-input-type'));
        input.Type = e.target.value;
        changeType(input);
      });
    });
    container.querySelectorAll('[data-input-inherited]').forEach((el) => {
      el.addEventListener('change', (e) => {
        findByCellLink(state.includedComponents.Inputs, el.getAttribute('data-input-inherited')).Inherited = e.target.checked;
      });
    });
    container.querySelectorAll('[data-date-month]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const input = findByCellLink(state.includedComponents.Inputs, el.getAttribute('data-date-month'));
        input.Val = updateFormat(input.Val, e.target.value, undefined);
        render();
      });
    });
    container.querySelectorAll('[data-date-year]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const input = findByCellLink(state.includedComponents.Inputs, el.getAttribute('data-date-year'));
        input.Val = updateFormat(input.Val, undefined, e.target.value);
        render();
      });
    });

    bindField('[data-pti-key]', (cl, val) => findByCellLink(state.includedComponents.Inputs, cl).Key = val);
    bindField('[data-pti-display]', (cl, val) => findByCellLink(state.includedComponents.Inputs, cl).Display = val);
    container.querySelectorAll('[data-pti-inherited]').forEach((el) => {
      el.addEventListener('change', (e) => {
        findByCellLink(state.includedComponents.Inputs, el.getAttribute('data-pti-inherited')).Inherited = e.target.checked;
      });
    });

    bindField('[data-output-key]', (cl, val) => findByCellLink(state.includedComponents.Outputs, cl).Key = val);
    bindField('[data-output-display]', (cl, val) => findByCellLink(state.includedComponents.Outputs, cl).Display = val);
    bindField('[data-output-units]', (cl, val) => findByCellLink(state.includedComponents.Outputs, cl).Units = val);
    container.querySelectorAll('[data-output-postprocessing]').forEach((el) => {
      el.addEventListener('change', (e) => {
        findByCellLink(state.includedComponents.Outputs, el.getAttribute('data-output-postprocessing')).UsePostProcessingOutputs = e.target.checked;
      });
    });
  }

  function ensureArr(input) {
    if (!Array.isArray(input.Val)) input.Val = [0, 0, 0];
    return input.Val;
  }

  function bindField(selector, setter, isTextarea = false) {
    container.querySelectorAll(selector).forEach((el) => {
      const attr = el.getAttributeNames().find((n) => n.startsWith('data-'));
      const cellLink = el.getAttribute(attr);
      el.addEventListener(isTextarea ? 'input' : 'input', (e) => {
        setter(cellLink, e.target.value);
        refreshSaveButton();
      });
    });
  }

  function refreshSaveButton() {
    const btn = container.querySelector('#ds-save-open-btn');
    if (btn) btn.disabled = isUnchanged();
  }

  function findByCellLink(list, cellLink) {
    return list.find((item) => item.CellLink === cellLink);
  }

  // ---- init ----

  setNavigationGuard((nextPath) => {
    if (isUnchanged()) return true;
    const confirmed = confirm(`You have unsaved changes in data structure, continue navigating to ${nextPath} ?`);
    if (!confirmed) return false;
    state.includedComponents = structuredClone(state.includedComponentsCopy);
    return true;
  });

  getIncludedDataStructureComponents();
  getExcludedDataStructureComponents();
  render();

  return () => {
    clearNavigationGuard();
  };
}
