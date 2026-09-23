import { escapeHtml } from '../../core/html.js';

function findByCellLink(list, cellLink) {
  return list.find((item) => item.CellLink === cellLink);
}

function outputRowHtml(output, isRowShown) {
  const cellLink = output.CellLink;
  const readOnly = isRowShown(cellLink);
  return `<tr>
    <td style="border:none;background-color:white;min-width:20px;max-width:20px;"><a href="" class="text-danger" data-exclude-output="${escapeHtml(cellLink)}"><i class="fa fa-minus-square"></i></a></td>
    <td style="min-width:400px;max-width:400px;"><div class="no-wrap" title="${escapeHtml(cellLink)}" data-toggle="tooltip">${escapeHtml(cellLink)}</div>${readOnly ? '' : `<input type="text" style="width:100%;" class="form form-control" data-output-key="${escapeHtml(cellLink)}" value="${escapeHtml(output.Key)}">`}</td>
    <td style="min-width:300px;max-width:300px;">${readOnly ? `<p>${escapeHtml(output.Display)}</p>` : `<input type="text" style="width:100%;" class="form form-control" data-output-display="${escapeHtml(cellLink)}" value="${escapeHtml(output.Display)}">`}</td>
    <td style="min-width:150px;max-width:150px;">${readOnly ? `<p>${escapeHtml(output.Units)}</p>` : `<input type="text" style="width:100%;" class="form form-control" data-output-units="${escapeHtml(cellLink)}" value="${escapeHtml(output.Units)}">`}</td>
    <td align="center" style="min-width:150px;max-width:150px;"><input type="checkbox" data-output-postprocessing="${escapeHtml(cellLink)}" ${output.UsePostProcessingOutputs ? 'checked' : ''} ${readOnly ? 'disabled' : ''}></td>
    <td style="min-width:70px;max-width:70px;">${readOnly ? `<button type="button" class="btn btn-success" data-row-edit="${escapeHtml(cellLink)}"><span class="glyphicon glyphicon-pencil"></span></button>` : `<button type="button" class="btn btn-danger" data-row-done="${escapeHtml(cellLink)}"><span class="glyphicon glyphicon-ok"></span></button>`}</td>
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
      <div class="select-template-title"><input type="text" class="form-control" placeholder="Search" id="ds-search-output" value="${escapeHtml(state.searchOutput)}"></div>
      <div class="panel panel-primary"><div class="list-of-templates"><ul class="list-group">
        ${excluded.map((output) => `<li class="list-group-item" title="${escapeHtml(output.CellLink)}" data-toggle="tooltip"><div class="no-wrap"><a href="" class="text-success" data-include-output="${escapeHtml(output.CellLink)}"><i class="fa fa-plus-square"></i></a> ${escapeHtml(output.CellLink)}</div></li>`).join('')}
      </ul></div></div>
    </div>
    <div class="selected">
      <div class="select-template-title"><h4>Outputs</h4></div>
      <div class="selected-inputs" id="included-outputs"><table id="outputTable" class="table table-striped" style="min-width:1100px;max-width:1100px;">
        <thead><tr><th style="border:none;min-width:20px;max-width:20px;"></th><th style="min-width:400px;max-width:400px;">Excel Range Name</th><th style="min-width:300px;max-width:300px;">Display</th><th style="min-width:150px;max-width:150px;">Units</th><th style="min-width:150px;max-width:150px;">Postprocessing</th><th style="min-width:70px;max-width:70px;">Edit</th></tr></thead>
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
