import { escapeHtml } from '../../core/html.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function findByCellLink(list, cellLink) {
  return list.find((item) => item.CellLink === cellLink);
}

function bindField(container, selector, setter, refreshSaveButton) {
  container.querySelectorAll(selector).forEach((element) => {
    const attribute = element.getAttributeNames().find((name) => name.startsWith('data-'));
    const cellLink = element.getAttribute(attribute);
    element.addEventListener('input', (event) => {
      setter(cellLink, event.target.value);
      refreshSaveButton();
    });
  });
}

function initDateEdit(value) {
  const [month, year] = (!value || typeof value === 'object' ? 'Jan 1990' : value).split(' ');
  return { month, year };
}

function updateDate(value, month, year) {
  const current = initDateEdit(value);
  return `${month || current.month} ${year || current.year}`;
}

function dateEditorHtml(input, cellLink) {
  const parsed = initDateEdit(input.Val);
  return `<div>Month</div>
    <select class="form-control" style="width: 80px;" data-date-month="${escapeHtml(cellLink)}">
      ${MONTHS.map((month) => `<option value="${month}" ${parsed.month === month ? 'selected' : ''}>${month}</option>`).join('')}
    </select>
    <div>Year</div>
    <input type="text" class="form-control" style="width: 80px;" data-date-year="${escapeHtml(cellLink)}" value="${escapeHtml(parsed.year)}">`;
}

function inputValueHtml(input, cellLink, editing) {
  if (!editing) {
    if (input.Type === 'DISTRIBUTION') return `<p>${escapeHtml(input.Val?.[0])}<br/>${escapeHtml(input.Val?.[1])}<br/>${escapeHtml(input.Val?.[2])}</p>`;
    if (['SCALAR', 'DATE'].includes(input.Type)) return `<p>${escapeHtml(input.Val)}</p>`;
    return input.Type === 'TABLE' ? `<p>${escapeHtml(input.Key)}</p>` : '';
  }
  if (input.Type === 'SCALAR') return `<input type="text" class="form form-control" style="width:100%;" data-input-val="${escapeHtml(cellLink)}" value="${escapeHtml(input.Val)}">`;
  if (input.Type === 'DISTRIBUTION') {
    return [0, 1, 2].map((index) => `<input type="text" class="form form-control" style="width:100%;" data-input-val${index}="${escapeHtml(cellLink)}" value="${escapeHtml(input.Val?.[index])}"><br/>`).join('');
  }
  if (input.Type === 'DATE') return `<div>${dateEditorHtml(input, cellLink)}</div>`;
  return input.Type === 'TABLE' ? `<div>${escapeHtml(input.Key)}</div>` : '';
}

function inputRowHtml(input, state, isRowShown) {
  if (input.Type === 'TABLE') return '';
  const cellLink = input.CellLink;
  const editing = !isRowShown(cellLink) || !state.show2;
  const readOnly = !editing;
  return `<tr>
    <td style="min-width:20px;max-width:20px;border:none;background-color:white;"><a href="" class="text-danger" data-exclude-input="${escapeHtml(cellLink)}"><i class="fa fa-minus-square"></i></a></td>
    <td style="min-width:150px;max-width:150px;"><div class="no-wrap" title="${escapeHtml(cellLink)}" data-toggle="tooltip">${escapeHtml(cellLink)}</div>${editing ? `<input type="text" style="width:100%;" class="form form-control" data-input-key="${escapeHtml(cellLink)}" value="${escapeHtml(input.Key)}">` : ''}</td>
    <td style="min-width:100px;max-width:100px;">${readOnly ? `<p>${escapeHtml(input.Display)}</p>` : `<input type="text" style="width:100%;" class="form form-control" data-input-display="${escapeHtml(cellLink)}" value="${escapeHtml(input.Display)}">`}</td>
    <td style="min-width:70px;max-width:70px;">${readOnly ? `<p>${escapeHtml(input.Units)}</p>` : `<input type="text" style="width:100%;" class="form form-control" data-input-units="${escapeHtml(cellLink)}" value="${escapeHtml(input.Units)}">`}</td>
    <td style="min-width:260px;max-width:260px;">${readOnly ? `<p>${escapeHtml(input.Description)}</p>` : `<textarea class="form form-control" style="height:100px;" data-input-description="${escapeHtml(cellLink)}">${escapeHtml(input.Description)}</textarea>`}</td>
    <td style="min-width:100px;max-width:100px;">${inputValueHtml(input, cellLink, editing)}</td>
    <td style="min-width:150px;max-width:150px;">
      ${readOnly && input.Table === undefined ? `<p>${escapeHtml(input.Type)}</p>` : ''}
      ${editing && input.Table === undefined ? `<select class="btn btn-default form-control" data-input-type="${escapeHtml(cellLink)}">${['DISTRIBUTION', 'SCALAR', 'TABLE', 'DATE'].map((type) => `<option value="${type}" ${input.Type === type ? 'selected' : ''}>${type}</option>`).join('')}</select>` : ''}
      ${input.Table !== undefined ? `<p>${escapeHtml(input.Type)}</p>` : ''}
    </td>
    <td style="min-width:100px;max-width:100px;">${readOnly ? `<p>${escapeHtml(input.Constraint)}</p>` : `<select class="btn btn-default form-control" data-input-constraint="${escapeHtml(cellLink)}">${['double', 'string', 'integer', 'date', 'year'].map((constraint) => `<option value="${constraint}" ${input.Constraint === constraint ? 'selected' : ''}>${constraint}</option>`).join('')}</select>`}</td>
    <td align="center" style="min-width:70px;max-width:70px;"><input type="checkbox" data-input-inherited="${escapeHtml(cellLink)}" ${input.Inherited ? 'checked' : ''} ${readOnly ? 'disabled' : ''}></td>
    <td style="min-width:70px;max-width:70px;">${readOnly ? `<button type="button" class="btn btn-success btn-sm" data-row-edit="${escapeHtml(cellLink)}"><span class="glyphicon glyphicon-pencil"></span></button>` : `<button type="button" class="btn btn-danger" data-row-done="${escapeHtml(cellLink)}"><span class="glyphicon glyphicon-ok"></span></button>`}</td>
  </tr>`;
}

export function inputEditorHtml(state, isRowShown) {
  const needle = state.searchInput.toLowerCase();
  const excluded = state.excludedComponents.Inputs.filter((input) => input.Type !== 'TABLE' && (!needle || (input.CellLink || '').toLowerCase().includes(needle)));
  return `<div class="select-input">
    <div class="choose-from">
      <div class="select-template-title"><h4>${state.isPlatform ? 'Platform Data Structure' : 'Data Structure'}</h4></div>
      <div class="select-template-title"><input type="text" class="form-control" placeholder="Search" id="ds-search-input" value="${escapeHtml(state.searchInput)}"></div>
      <div class="panel panel-primary"><div class="list-of-templates" id="input-list"><ul class="list-group">
        ${excluded.map((input) => `<li class="list-group-item" title="${escapeHtml(input.CellLink)}" data-toggle="tooltip"><div class="no-wrap"><a href="" class="text-success" data-include-input="${escapeHtml(input.CellLink)}"><i class="fa fa-plus-square"></i></a> ${escapeHtml(input.CellLink)}</div></li>`).join('')}
      </ul></div></div>
    </div>
    <div class="selected">
      <div class="select-template-title"><h4>Inputs</h4></div>
      <div class="selected-inputs" id="included-inputs"><table id="inputTable" class="table table-striped" style="min-width:1100px;max-width:1100px;">
        <thead><tr><th style="border:none;min-width:20px;max-width:20px;"></th><th style="min-width:150px;max-width:150px;">Excel Range Name</th><th style="min-width:100px;max-width:100px;">Display</th><th style="min-width:70px;max-width:70px;">Units</th><th style="min-width:260px;max-width:260px;">Description</th><th style="min-width:100px;max-width:100px;">Default</th><th style="min-width:150px;max-width:150px;">Type</th><th style="min-width:100px;max-width:100px;">Kind</th><th style="min-width:70px;max-width:70px;">Inherited</th><th style="min-width:70px;max-width:70px;">Edit</th></tr></thead>
        <tbody>${state.includedComponents.Inputs.map((input) => inputRowHtml(input, state, isRowShown)).join('')}</tbody>
      </table></div>
    </div>
  </div>`;
}

export function wireInputEditor({ container, state, includeInput, excludeInput, setRowShown, changeType, render, refreshSaveButton }) {
  container.querySelector('#ds-search-input')?.addEventListener('input', (event) => { state.searchInput = event.target.value; render(); });
  container.querySelectorAll('[data-include-input]').forEach((element) => element.addEventListener('click', (event) => { event.preventDefault(); includeInput(findByCellLink(state.excludedComponents.Inputs, element.dataset.includeInput)); }));
  container.querySelectorAll('[data-exclude-input]').forEach((element) => element.addEventListener('click', (event) => { event.preventDefault(); excludeInput(findByCellLink(state.includedComponents.Inputs, element.dataset.excludeInput)); }));
  container.querySelectorAll('[data-row-edit]').forEach((element) => element.addEventListener('click', () => { setRowShown(element.dataset.rowEdit, false); render(); }));
  container.querySelectorAll('[data-row-done]').forEach((element) => element.addEventListener('click', () => { setRowShown(element.dataset.rowDone, true); render(); }));

  bindField(container, '[data-input-key]', (cellLink, value) => { findByCellLink(state.includedComponents.Inputs, cellLink).Key = value; }, refreshSaveButton);
  bindField(container, '[data-input-display]', (cellLink, value) => { findByCellLink(state.includedComponents.Inputs, cellLink).Display = value; }, refreshSaveButton);
  bindField(container, '[data-input-units]', (cellLink, value) => { findByCellLink(state.includedComponents.Inputs, cellLink).Units = value; }, refreshSaveButton);
  bindField(container, '[data-input-description]', (cellLink, value) => { findByCellLink(state.includedComponents.Inputs, cellLink).Description = value; }, refreshSaveButton);
  bindField(container, '[data-input-val]', (cellLink, value) => { findByCellLink(state.includedComponents.Inputs, cellLink).Val = value; }, refreshSaveButton);
  [0, 1, 2].forEach((index) => bindField(container, `[data-input-val${index}]`, (cellLink, value) => {
    const input = findByCellLink(state.includedComponents.Inputs, cellLink);
    if (!Array.isArray(input.Val)) input.Val = [0, 0, 0];
    input.Val[index] = value;
  }, refreshSaveButton));
  bindField(container, '[data-input-constraint]', (cellLink, value) => { findByCellLink(state.includedComponents.Inputs, cellLink).Constraint = value; }, refreshSaveButton);

  container.querySelectorAll('[data-input-type]').forEach((element) => element.addEventListener('change', (event) => changeType(findByCellLink(state.includedComponents.Inputs, element.dataset.inputType), event.target.value)));
  container.querySelectorAll('[data-input-inherited]').forEach((element) => element.addEventListener('change', (event) => { findByCellLink(state.includedComponents.Inputs, element.dataset.inputInherited).Inherited = event.target.checked; refreshSaveButton(); }));
  container.querySelectorAll('[data-date-month]').forEach((element) => element.addEventListener('change', (event) => { const input = findByCellLink(state.includedComponents.Inputs, element.dataset.dateMonth); input.Val = updateDate(input.Val, event.target.value); render(); }));
  container.querySelectorAll('[data-date-year]').forEach((element) => element.addEventListener('change', (event) => { const input = findByCellLink(state.includedComponents.Inputs, element.dataset.dateYear); input.Val = updateDate(input.Val, undefined, event.target.value); render(); }));
}
