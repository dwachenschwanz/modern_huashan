import { escapeHtml, extractTablePreviewHtml } from '../../core/html.js';

function findByCellLink(list, cellLink) {
  return list.find((item) => item.CellLink === cellLink);
}

function tableRowHtml(table, state, isRowShown) {
  const cellLink = table.CellLink;
  const editing = !isRowShown(cellLink) || !state.show2;
  const readOnly = !editing;
  return `<tr class="${state.selectedCelllink === cellLink ? 'selectPTI' : ''}" data-select-pti="${escapeHtml(cellLink)}">
    <td><a href="" class="text-danger" data-exclude-pti="${escapeHtml(cellLink)}"><i class="fa fa-minus-square"></i></a></td>
    <td><div class="no-wrap" title="${escapeHtml(cellLink)}" data-toggle="tooltip">${escapeHtml(cellLink)}</div>${editing ? `<input type="text" style="width:100%;" class="form form-control" data-pti-key="${escapeHtml(cellLink)}" value="${escapeHtml(table.Key)}">` : ''}</td>
    <td>${readOnly ? `<p>${escapeHtml(table.Display)}</p>` : `<input type="text" style="width:100%;" class="form form-control" data-pti-display="${escapeHtml(cellLink)}" value="${escapeHtml(table.Display)}">`}</td>
    <td align="center"><input type="checkbox" data-pti-inherited="${escapeHtml(cellLink)}" ${table.Inherited ? 'checked' : ''} ${readOnly ? 'disabled' : ''}></td>
    <td>${readOnly ? `<button type="button" class="btn btn-success btn-sm" data-row-edit="${escapeHtml(cellLink)}"><span class="glyphicon glyphicon-pencil"></span></button>` : `<button type="button" class="btn btn-danger" data-row-done="${escapeHtml(cellLink)}"><span class="glyphicon glyphicon-ok"></span></button>`}</td>
  </tr>`;
}

export function tableInputEditorHtml(state, isRowShown) {
  const needle = state.searchInput.toLowerCase();
  const available = state.excludedPotentialTableInputs.filter((table) => !needle || (table.CellLink || '').toLowerCase().includes(needle));
  return `<div class="select-input">
    <div class="choose-from">
      <div class="select-template-title"><h4>Choose From</h4></div>
      <div class="select-template-title"><input type="text" class="form-control" placeholder="Search" id="ds-search-input-table" value="${escapeHtml(state.searchInput)}"></div>
      <div class="panel panel-primary"><div class="list-of-templates" id="potential-tableInput-list">
        ${available.map((table) => `<a href="" class="list-group-item ${state.selectedCelllink === table.CellLink ? 'active' : ''}" data-choose-pti="${escapeHtml(table.CellLink)}" title="${escapeHtml(table.CellLink)}" data-toggle="tooltip"><table><tr><td class="appStructList"><div class="no-wrap"><button type="button" class="table-input-add text-success" data-include-pti="${escapeHtml(table.CellLink)}" aria-label="Add ${escapeHtml(table.CellLink)}"><i class="fa fa-plus-square"></i></button> ${escapeHtml(table.CellLink)}</div></td></tr></table></a>`).join('')}
      </div></div>
    </div>
    <div class="selected">
      <div class="select-template-title"><h4>Table Inputs</h4></div>
      <div class="col-sm-12">
        <div class="col-sm-6"><div style="border:1px;height:400px;overflow-y:scroll;overflow-x:scroll;margin-top:30px;margin-left:10px">${state.htmlPreview ? `<div style="width:100%;height:100%;">${extractTablePreviewHtml(state.htmlPreview)}</div>` : `<img src="${escapeHtml(state.imageURL)}">`}</div></div>
        <div class="col-sm-6"><div class="selected-inputs" id="potential-included-inputs"><div class="table-left"><table id="potentialinputTable" class="table table-striped">
          <thead><tr><th width="5%"></th><th width="35%">Excel Range Name</th><th>Display</th><th>Inherited</th><th>Edit</th></tr></thead>
          <tbody>${state.includedPotentialTableInputs.map((table) => tableRowHtml(findByCellLink(state.includedComponents.Inputs, table.CellLink) || table, state, isRowShown)).join('')}</tbody>
        </table></div></div></div>
      </div>
    </div>
  </div>`;
}

function bindField(container, selector, setter, refreshSaveButton) {
  container.querySelectorAll(selector).forEach((element) => element.addEventListener('input', (event) => {
    setter(element.getAttribute(selector.slice(1, -1)), event.target.value);
    refreshSaveButton();
  }));
}

export function wireTableInputEditor({ container, state, includeTable, excludeTable, chooseTable, selectTable, setRowShown, render, refreshSaveButton }) {
  container.querySelector('#ds-search-input-table')?.addEventListener('input', (event) => { state.searchInput = event.target.value; render(); });
  container.querySelectorAll('[data-include-pti]').forEach((element) => element.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); includeTable(findByCellLink(state.excludedPotentialTableInputs, element.dataset.includePti)); }));
  container.querySelectorAll('[data-exclude-pti]').forEach((element) => element.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); excludeTable(findByCellLink(state.includedPotentialTableInputs, element.dataset.excludePti)); }));
  container.querySelectorAll('[data-choose-pti]').forEach((element) => element.addEventListener('click', (event) => { event.preventDefault(); chooseTable(findByCellLink(state.excludedPotentialTableInputs, element.dataset.choosePti)); }));
  container.querySelectorAll('[data-select-pti]').forEach((element) => element.addEventListener('click', () => { selectTable(findByCellLink(state.includedPotentialTableInputs, element.dataset.selectPti)); render(); }));
  container.querySelectorAll('[data-row-edit]').forEach((element) => element.addEventListener('click', (event) => { event.stopPropagation(); setRowShown(element.dataset.rowEdit, false); render(); }));
  container.querySelectorAll('[data-row-done]').forEach((element) => element.addEventListener('click', (event) => { event.stopPropagation(); setRowShown(element.dataset.rowDone, true); render(); }));

  bindField(container, '[data-pti-key]', (cellLink, value) => { findByCellLink(state.includedComponents.Inputs, cellLink).Key = value; }, refreshSaveButton);
  bindField(container, '[data-pti-display]', (cellLink, value) => { findByCellLink(state.includedComponents.Inputs, cellLink).Display = value; }, refreshSaveButton);
  container.querySelectorAll('[data-pti-inherited]').forEach((element) => element.addEventListener('change', (event) => { findByCellLink(state.includedComponents.Inputs, element.dataset.ptiInherited).Inherited = event.target.checked; refreshSaveButton(); }));
}
