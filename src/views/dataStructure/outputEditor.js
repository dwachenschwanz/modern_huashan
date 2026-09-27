import { escapeHtml } from '../../core/html.js';
import { searchFieldHtml } from '../../components/searchField.js';

const OUTPUT_COLUMN_WIDTHS = ['4%', '35%', '25%', '13%', '13%', '10%'];
const outputColgroupHtml = () => `<colgroup>${OUTPUT_COLUMN_WIDTHS.map((w) => `<col style="width:${w};">`).join('')}</colgroup>`;

function findByCellLink(list, cellLink) {
  return list.find((item) => item.CellLink === cellLink);
}

function outputRowHtml(output, isRowShown) {
  const cellLink = output.CellLink;
  const readOnly = isRowShown(cellLink);
  return `<tr class="${readOnly ? '' : 'ds-row-editing'}">
    <td style="border:none;background-color:white;"><a href="" class="text-danger" data-exclude-output="${escapeHtml(cellLink)}"><i class="fa fa-minus-square"></i></a></td>
    <td><div class="no-wrap" title="${escapeHtml(cellLink)}" data-toggle="tooltip">${escapeHtml(cellLink)}</div>${readOnly ? '' : `<label class="ds-key-label" for="ds-output-key-${escapeHtml(cellLink)}">Key</label><input id="ds-output-key-${escapeHtml(cellLink)}" type="text" style="width:100%;" class="form form-control" data-output-key="${escapeHtml(cellLink)}" value="${escapeHtml(output.Key)}">`}</td>
    <td>${readOnly ? `<p>${escapeHtml(output.Display)}</p>` : `<input type="text" style="width:100%;" class="form form-control" data-output-display="${escapeHtml(cellLink)}" value="${escapeHtml(output.Display)}">`}</td>
    <td>${readOnly ? `<p>${escapeHtml(output.Units)}</p>` : `<input type="text" style="width:100%;" class="form form-control" data-output-units="${escapeHtml(cellLink)}" value="${escapeHtml(output.Units)}">`}</td>
    <td align="center"><input type="checkbox" data-output-postprocessing="${escapeHtml(cellLink)}" ${output.UsePostProcessingOutputs ? 'checked' : ''} ${readOnly ? 'disabled' : ''}></td>
    <td>${readOnly ? `<button type="button" class="btn btn-edit btn-sm" data-row-edit="${escapeHtml(cellLink)}"><i class="fa fa-pencil" aria-hidden="true"></i></button>` : `<button type="button" class="btn btn-primary btn-sm" data-row-done="${escapeHtml(cellLink)}"><i class="fa fa-check" aria-hidden="true"></i></button>`}</td>
  </tr>`;
}

export function outputEditorHtml(state, isRowShown) {
  const needle = state.searchOutput.toLowerCase();
  const excluded = state.excludedComponents.Outputs.filter((output) => {
    if (!needle) return true;
    try {
      return JSON.stringify(output).toLowerCase().includes(needle);
    } catch {
      return true;
    }
  });
  return `<div class="select-input">
    <div class="choose-from">
      <div class="select-template-title"><h4>Choose From</h4></div>
      ${searchFieldHtml({ id: 'ds-search-output', value: state.searchOutput })}
      <div class="panel panel-primary"><div class="list-of-templates"><ul class="list-group">
        ${excluded.map((output) => `<li class="list-group-item" title="${escapeHtml(output.CellLink)}" data-toggle="tooltip"><div class="no-wrap"><a href="" class="text-success" data-include-output="${escapeHtml(output.CellLink)}"><i class="fa fa-plus-square"></i></a> ${escapeHtml(output.CellLink)}</div></li>`).join('')}
      </ul></div></div>
    </div>
    <div class="selected">
      <div class="select-template-title"><h4>Outputs</h4></div>
      <div class="selected-inputs" id="included-outputs"><table id="outputTable" class="ds-table" style="min-width:900px;">
        ${outputColgroupHtml()}
        <thead><tr><th style="border:none;"></th><th>Excel Range Name</th><th>Display</th><th>Units</th><th>Postprocessing</th><th>Edit</th></tr></thead>
        <tbody>${state.includedComponents.Outputs.map((output) => outputRowHtml(output, isRowShown)).join('')}</tbody>
      </table></div>
    </div>
  </div>`;
}

function bindField(container, selector, setter, refreshSaveButton) {
  container.querySelectorAll(selector).forEach((element) => element.addEventListener('input', (event) => {
    setter(element.getAttribute(selector.slice(1, -1)), event.target.value);
    refreshSaveButton();
  }));
}

export function wireOutputEditor({ container, state, includeOutput, excludeOutput, setRowShown, render, refreshSaveButton }) {
  container.querySelector('#ds-search-output')?.addEventListener('input', (event) => { state.searchOutput = event.target.value; render(); });
  container.querySelectorAll('[data-include-output]').forEach((element) => element.addEventListener('click', (event) => { event.preventDefault(); includeOutput(findByCellLink(state.excludedComponents.Outputs, element.dataset.includeOutput)); }));
  container.querySelectorAll('[data-exclude-output]').forEach((element) => element.addEventListener('click', (event) => { event.preventDefault(); excludeOutput(findByCellLink(state.includedComponents.Outputs, element.dataset.excludeOutput)); }));
  container.querySelectorAll('[data-row-edit]').forEach((element) => element.addEventListener('click', () => { setRowShown(element.dataset.rowEdit, false); render(); }));
  container.querySelectorAll('[data-row-done]').forEach((element) => element.addEventListener('click', () => { setRowShown(element.dataset.rowDone, true); render(); }));
  bindField(container, '[data-output-key]', (cellLink, value) => { findByCellLink(state.includedComponents.Outputs, cellLink).Key = value; }, refreshSaveButton);
  bindField(container, '[data-output-display]', (cellLink, value) => { findByCellLink(state.includedComponents.Outputs, cellLink).Display = value; }, refreshSaveButton);
  bindField(container, '[data-output-units]', (cellLink, value) => { findByCellLink(state.includedComponents.Outputs, cellLink).Units = value; }, refreshSaveButton);
  container.querySelectorAll('[data-output-postprocessing]').forEach((element) => element.addEventListener('change', (event) => { findByCellLink(state.includedComponents.Outputs, element.dataset.outputPostprocessing).UsePostProcessingOutputs = event.target.checked; refreshSaveButton(); }));
}
