import { escapeHtml, extractTablePreviewHtml } from '../../core/html.js';
import { scrollElementIntoView } from '../../components/scrollTo.js';

function escapeAttr(value) {
  return escapeHtml(value);
}

function numOrEmpty(value) {
  return value === null || value === undefined ? '' : value;
}

export function renderCompareValueEditor({ menu, commandHeaderHtml, outputOptionsHtml }) {
  const keys = menu.Parameters.Keys || [];
  return `
    ${commandHeaderHtml(menu)}
    <div class="row table-padding">
      <div class="col-sm-2"><b>Total</b></div>
      <div class="col-sm-3"><input type="checkbox" id="ps-cv-total" ${menu.Parameters.Total ? 'checked' : ''}></div>
    </div>
    <div class="row table-padding">
      <div class="col-sm-2"><b>Min</b></div>
      <div class="col-sm-3"><input type="number" class="form form-control" id="ps-cv-min" value="${numOrEmpty(menu.Parameters.Min)}"></div>
      <div class="col-sm-2"><b>Max</b></div>
      <div class="col-sm-3"><input type="number" class="form form-control" id="ps-cv-max" value="${numOrEmpty(menu.Parameters.Max)}"></div>
    </div>
    <div class="row table-padding">
      <div class="col-sm-3"><b>Key</b></div>
      <div class="col-sm-3"><b>Unit</b></div>
      <div class="col-sm-3"><b>Title</b></div>
    </div>
    ${keys.map((key, index) => `
    <div class="row table-padding">
      <div class="col-sm-3"><select class="form form-control" data-cv-key-index="${index}">${outputOptionsHtml(key)}</select></div>
      <div class="col-sm-3"><input type="text" class="form form-control" data-cv-unit-index="${index}" value="${escapeAttr(menu.Parameters.Units[index])}"></div>
      <div class="col-sm-3"><input type="text" class="form form-control" data-cv-title-index="${index}" value="${escapeAttr(menu.Parameters.Titles[index])}"></div>
      <div class="col-sm-1"><button class="btn btn-danger" data-cv-delete-index="${index}"><span class="glyphicon glyphicon-trash"></span></button></div>
    </div>`).join('')}
    <div class="row table-padding">
      <div class="col-sm-1"><button class="btn btn-success" id="ps-cv-add"><span class="glyphicon glyphicon-plus"></span></button></div>
    </div>`;
}

export function renderCompareUncertaintyEditor(menu) {
  return `
    <div class="col-sm-6">
      <h4>${escapeHtml(menu.Command)}</h4>
      <div><h4>There's nothing to customize in this menu item</h4></div>
    </div>
    <div class="col-sm-6"><h4><input type="checkbox" id="ps-visible-toggle" ${menu.Visible ? 'checked' : ''}> Visible</h4></div>`;
}

export function renderInnovationScreenEditor({ menu, commandHeaderHtml, outputOptionsHtml, getKeyFrom }) {
  return `
    ${commandHeaderHtml(menu)}
    ${menu.Parameters.Sets.map((set, index) => `
    <div>
      <div class="row table-padding">
        <div class="col-sm-2"><b>X Axis</b></div>
        <div class="col-sm-3"><select class="form form-control" data-is-xkey-index="${index}">${outputOptionsHtml(getKeyFrom(set.x))}</select></div>
        <div class="col-sm-2"><b>X Title</b></div>
        <div class="col-sm-3"><input type="text" class="form form-control" data-is-xtitle-index="${index}" value="${escapeAttr(set.xTitle)}"></div>
      </div>
      <div class="row table-padding">
        <div class="col-sm-2"><b>Y Axis</b></div>
        <div class="col-sm-3"><select class="form form-control" data-is-ykey-index="${index}">${outputOptionsHtml(getKeyFrom(set.y))}</select></div>
        <div class="col-sm-2"><b>Y Title</b></div>
        <div class="col-sm-3"><input type="text" class="form form-control" data-is-ytitle-index="${index}" value="${escapeAttr(set.yTitle)}"></div>
      </div>
      <div class="row table-padding">
        <div class="col-sm-2"><b>Vertical Cut-off</b></div>
        <div class="col-sm-3"><input type="number" class="form form-control" data-is-vcutoff-index="${index}" value="${numOrEmpty(set.VerticalCutoff)}"></div>
        <div class="col-sm-2"><b>Name</b></div>
        <div class="col-sm-3"><input type="text" class="form form-control" data-is-name-index="${index}" value="${escapeAttr(set.name)}"></div>
        <div class="col-sm-1"><button class="btn btn-danger" data-is-delete-index="${index}"><span class="glyphicon glyphicon-trash"></span></button></div>
      </div>
    </div>`).join('')}
    <div class="row table-padding">
      <div class="col-sm-1"><button class="btn btn-success" id="ps-is-add"><span class="glyphicon glyphicon-plus"></span></button></div>
    </div>`;
}

export function renderCfoChartEditor({ menu, commandHeaderHtml, outputOptionsHtml, getKeyFrom }) {
  return `
    ${commandHeaderHtml(menu)}
    ${menu.Parameters.Sets.map((set, index) => `
    <div>
      <div class="col-sm-12">
        <div class="row table-padding">
          <div class="col-sm-3"><b>X Axis</b></div>
          <div class="col-sm-3"><b>X Title</b></div>
          <div class="col-sm-3"><b>Name</b></div>
        </div>
      </div>
      <div class="row table-padding">
        <div class="col-sm-3"><select class="form form-control" data-cfo-xkey-index="${index}">${outputOptionsHtml(getKeyFrom(set.AverageCost))}</select></div>
        <div class="col-sm-3"><input type="text" class="form form-control" data-cfo-xtitle-index="${index}" value="${escapeAttr(set.xTitle)}"></div>
        <div class="col-sm-3"><input type="text" class="form form-control" data-cfo-name-index="${index}" value="${escapeAttr(set.name)}"></div>
      </div>
      <div class="col-sm-12">
        <div class="row table-padding">
          <div class="col-sm-3"><b>Y Axis</b></div>
          <div class="col-sm-3"><b>Y Title</b></div>
        </div>
      </div>
      <div class="row table-padding">
        <div class="col-sm-3"><select class="form form-control" data-cfo-ykey-index="${index}">${outputOptionsHtml(getKeyFrom(set.AverageValueMinusCost))}</select></div>
        <div class="col-sm-3"><input type="text" class="form form-control" data-cfo-ytitle-index="${index}" value="${escapeAttr(set.yTitle)}"></div>
        <div class="col-sm-1"><button class="btn btn-danger" data-cfo-delete-index="${index}"><span class="glyphicon glyphicon-trash"></span></button></div>
      </div>
    </div>`).join('')}
    <div class="row table-padding">
      <div class="col-sm-1"><button class="btn btn-success" id="ps-cfo-add"><span class="glyphicon glyphicon-plus"></span></button></div>
    </div>`;
}

export function renderScatterPlotEditor({ menu, commandHeaderHtml, outputOptionsHtml, getKeyFrom }) {
  return `
    ${commandHeaderHtml(menu)}
    <div class="row table-padding">
      <div class="col-sm-2"><b>Use Same Scale</b></div>
      <div class="col-sm-3"><input type="checkbox" id="ps-sp-samescale" ${menu.Parameters.SameScale ? 'checked' : ''}></div>
    </div>
    <div class="row table-padding">
      <div class="col-sm-2"><b>Min</b></div>
      <div class="col-sm-3"><input type="number" class="form form-control" id="ps-sp-min" value="${numOrEmpty(menu.Parameters.Min)}"></div>
      <div class="col-sm-2"><b>Max</b></div>
      <div class="col-sm-3"><input type="number" class="form form-control" id="ps-sp-max" value="${numOrEmpty(menu.Parameters.Max)}"></div>
    </div>
    ${menu.Parameters.Sets.map((set, index) => {
      const hasError = (set.name === undefined || set.name === '') && menu.Parameters.Sets.length > 1;
      return `
    <div>
      <div class="row table-padding"><div class="col-sm-2"><h3>Series ${index + 1}</h3></div></div>
      <div class="row table-padding">
        <div class="col-sm-2"><b>Name</b></div>
        <div class="col-sm-3 ${hasError ? 'has-error' : ''}" data-sp-name-wrapper="${index}">
          <input type="text" class="form form-control" data-sp-name-index="${index}" value="${escapeAttr(set.name)}">
        </div>
      </div>
      <div class="row table-padding">
        <div class="col-sm-2"><b>X Axis</b></div>
        <div class="col-sm-3"><select class="form form-control" data-sp-xkey-index="${index}">${outputOptionsHtml(getKeyFrom(set.x))}</select></div>
        <div class="col-sm-2"><b>X Title</b></div>
        <div class="col-sm-3"><input type="text" class="form form-control" data-sp-xtitle-index="${index}" value="${escapeAttr(set.xTitle)}"></div>
      </div>
      <div class="row table-padding">
        <div class="col-sm-2"><b>Y Axis</b></div>
        <div class="col-sm-3"><select class="form form-control" data-sp-ykey-index="${index}">${outputOptionsHtml(getKeyFrom(set.y))}</select></div>
        <div class="col-sm-2"><b>Y Title</b></div>
        <div class="col-sm-3"><input type="text" class="form form-control" data-sp-ytitle-index="${index}" value="${escapeAttr(set.yTitle)}"></div>
        <div class="col-sm-2"><button class="btn btn-danger" data-sp-delete-index="${index}"><span class="glyphicon glyphicon-trash"></span></button></div>
      </div>
    </div>`;
    }).join('')}
    <div class="col-sm-2"><button class="btn btn-success" id="ps-sp-add"><span class="glyphicon glyphicon-plus"></span></button></div>`;
}

export function bindCompareValueEditor({ formEl, menu, refreshSaveButton, getOutputUnitFromKey, getOutputDisplayFromKey, addItem, deleteItem }) {
  formEl.querySelector('#ps-cv-total')?.addEventListener('change', (event) => { menu.Parameters.Total = event.target.checked; refreshSaveButton(); });
  formEl.querySelector('#ps-cv-min')?.addEventListener('input', (event) => { menu.Parameters.Min = event.target.value === '' ? null : Number(event.target.value); refreshSaveButton(); });
  formEl.querySelector('#ps-cv-max')?.addEventListener('input', (event) => { menu.Parameters.Max = event.target.value === '' ? null : Number(event.target.value); refreshSaveButton(); });
  formEl.querySelectorAll('[data-cv-key-index]').forEach((element) => {
    element.addEventListener('change', (event) => {
      const index = Number(element.dataset.cvKeyIndex);
      menu.Parameters.Keys[index] = event.target.value;
      menu.Parameters.Units[index] = getOutputUnitFromKey(event.target.value);
      menu.Parameters.Titles[index] = getOutputDisplayFromKey(event.target.value);
      formEl.querySelector(`[data-cv-unit-index="${index}"]`).value = menu.Parameters.Units[index];
      formEl.querySelector(`[data-cv-title-index="${index}"]`).value = menu.Parameters.Titles[index];
      refreshSaveButton();
    });
  });
  formEl.querySelectorAll('[data-cv-unit-index]').forEach((element) => element.addEventListener('input', (event) => { menu.Parameters.Units[Number(element.dataset.cvUnitIndex)] = event.target.value; refreshSaveButton(); }));
  formEl.querySelectorAll('[data-cv-title-index]').forEach((element) => element.addEventListener('input', (event) => { menu.Parameters.Titles[Number(element.dataset.cvTitleIndex)] = event.target.value; refreshSaveButton(); }));
  formEl.querySelectorAll('[data-cv-delete-index]').forEach((element) => element.addEventListener('click', () => deleteItem(Number(element.dataset.cvDeleteIndex))));
  formEl.querySelector('#ps-cv-add')?.addEventListener('click', addItem);
}

function bindAxis({ formEl, menu, selector, datasetKey, valueField, titleField, titleAttribute, buildOutputFromKey, getOutputDisplayFromKey, refreshSaveButton }) {
  formEl.querySelectorAll(selector).forEach((element) => {
    element.addEventListener('change', (event) => {
      const index = Number(element.dataset[datasetKey]);
      const set = menu.Parameters.Sets[index];
      set[valueField] = buildOutputFromKey(event.target.value);
      set[titleField] = getOutputDisplayFromKey(event.target.value);
      const titleInput = formEl.querySelector(`[${titleAttribute}="${index}"]`);
      if (titleInput) titleInput.value = set[titleField];
      refreshSaveButton();
    });
  });
}

function bindTextFields(formEl, menu, selector, datasetKey, field, refreshSaveButton) {
  formEl.querySelectorAll(selector).forEach((element) => {
    element.addEventListener('input', (event) => {
      menu.Parameters.Sets[Number(element.dataset[datasetKey])][field] = event.target.value;
      refreshSaveButton();
    });
  });
}

export function bindInnovationScreenEditor(args) {
  const { formEl, menu, refreshSaveButton, buildOutputFromKey, getOutputDisplayFromKey, addItem, deleteItem } = args;
  bindAxis({ formEl, menu, selector: '[data-is-xkey-index]', datasetKey: 'isXkeyIndex', valueField: 'x', titleField: 'xTitle', titleAttribute: 'data-is-xtitle-index', buildOutputFromKey, getOutputDisplayFromKey, refreshSaveButton });
  bindAxis({ formEl, menu, selector: '[data-is-ykey-index]', datasetKey: 'isYkeyIndex', valueField: 'y', titleField: 'yTitle', titleAttribute: 'data-is-ytitle-index', buildOutputFromKey, getOutputDisplayFromKey, refreshSaveButton });
  bindTextFields(formEl, menu, '[data-is-xtitle-index]', 'isXtitleIndex', 'xTitle', refreshSaveButton);
  bindTextFields(formEl, menu, '[data-is-ytitle-index]', 'isYtitleIndex', 'yTitle', refreshSaveButton);
  bindTextFields(formEl, menu, '[data-is-name-index]', 'isNameIndex', 'name', refreshSaveButton);
  formEl.querySelectorAll('[data-is-vcutoff-index]').forEach((element) => element.addEventListener('input', (event) => { menu.Parameters.Sets[Number(element.dataset.isVcutoffIndex)].VerticalCutoff = event.target.value === '' ? null : Number(event.target.value); refreshSaveButton(); }));
  formEl.querySelectorAll('[data-is-delete-index]').forEach((element) => element.addEventListener('click', () => deleteItem(Number(element.dataset.isDeleteIndex))));
  formEl.querySelector('#ps-is-add')?.addEventListener('click', addItem);
}

export function bindCfoChartEditor(args) {
  const { formEl, menu, refreshSaveButton, buildOutputFromKey, getOutputDisplayFromKey, addItem, deleteItem } = args;
  bindAxis({ formEl, menu, selector: '[data-cfo-xkey-index]', datasetKey: 'cfoXkeyIndex', valueField: 'AverageCost', titleField: 'xTitle', titleAttribute: 'data-cfo-xtitle-index', buildOutputFromKey, getOutputDisplayFromKey, refreshSaveButton });
  bindAxis({ formEl, menu, selector: '[data-cfo-ykey-index]', datasetKey: 'cfoYkeyIndex', valueField: 'AverageValueMinusCost', titleField: 'yTitle', titleAttribute: 'data-cfo-ytitle-index', buildOutputFromKey, getOutputDisplayFromKey, refreshSaveButton });
  bindTextFields(formEl, menu, '[data-cfo-xtitle-index]', 'cfoXtitleIndex', 'xTitle', refreshSaveButton);
  bindTextFields(formEl, menu, '[data-cfo-ytitle-index]', 'cfoYtitleIndex', 'yTitle', refreshSaveButton);
  bindTextFields(formEl, menu, '[data-cfo-name-index]', 'cfoNameIndex', 'name', refreshSaveButton);
  formEl.querySelectorAll('[data-cfo-delete-index]').forEach((element) => element.addEventListener('click', () => deleteItem(Number(element.dataset.cfoDeleteIndex))));
  formEl.querySelector('#ps-cfo-add')?.addEventListener('click', addItem);
}

export function bindScatterPlotEditor(args) {
  const { formEl, menu, refreshSaveButton, buildOutputFromKey, getOutputDisplayFromKey, addItem, deleteItem } = args;
  formEl.querySelector('#ps-sp-samescale')?.addEventListener('change', (event) => { menu.Parameters.SameScale = event.target.checked; refreshSaveButton(); });
  formEl.querySelector('#ps-sp-min')?.addEventListener('input', (event) => { menu.Parameters.Min = event.target.value === '' ? null : Number(event.target.value); refreshSaveButton(); });
  formEl.querySelector('#ps-sp-max')?.addEventListener('input', (event) => { menu.Parameters.Max = event.target.value === '' ? null : Number(event.target.value); refreshSaveButton(); });
  bindAxis({ formEl, menu, selector: '[data-sp-xkey-index]', datasetKey: 'spXkeyIndex', valueField: 'x', titleField: 'xTitle', titleAttribute: 'data-sp-xtitle-index', buildOutputFromKey, getOutputDisplayFromKey, refreshSaveButton });
  bindAxis({ formEl, menu, selector: '[data-sp-ykey-index]', datasetKey: 'spYkeyIndex', valueField: 'y', titleField: 'yTitle', titleAttribute: 'data-sp-ytitle-index', buildOutputFromKey, getOutputDisplayFromKey, refreshSaveButton });
  bindTextFields(formEl, menu, '[data-sp-xtitle-index]', 'spXtitleIndex', 'xTitle', refreshSaveButton);
  bindTextFields(formEl, menu, '[data-sp-ytitle-index]', 'spYtitleIndex', 'yTitle', refreshSaveButton);
  formEl.querySelectorAll('[data-sp-name-index]').forEach((element) => {
    element.addEventListener('input', (event) => {
      const index = Number(element.dataset.spNameIndex);
      const set = menu.Parameters.Sets[index];
      set.name = event.target.value;
      formEl.querySelector(`[data-sp-name-wrapper="${index}"]`)?.classList.toggle('has-error', !set.name && menu.Parameters.Sets.length > 1);
      refreshSaveButton();
    });
  });
  formEl.querySelectorAll('[data-sp-delete-index]').forEach((element) => element.addEventListener('click', () => deleteItem(Number(element.dataset.spDeleteIndex))));
  formEl.querySelector('#ps-sp-add')?.addEventListener('click', addItem);
}

export function renderAddTablesEditor({ menu, state, commandHeaderHtml, outputOptionsHtml }) {
  const preview = state.selectedPotentialTable;
  let previewHtml = '';
  if (preview?.HtmlPreview) {
    previewHtml = `<div style="width:100%; overflow:auto;">${extractTablePreviewHtml(preview.HtmlPreview)}</div>`;
  } else if (preview) {
    previewHtml = `<img src="${escapeAttr(state.server)}${escapeAttr(preview.PreviewURL || '')}" alt="${escapeAttr(preview.CellLink || '')}" width="100%">`;
  }
  return `
    ${commandHeaderHtml(menu)}
    <div class="col-sm-4"><div class="list-group" id="ps-tables-list">
      ${state.tables.map((table, index) => `<a href="" id="table${index}" class="list-group-item ${state.selectedTable === table ? 'active' : ''}" data-table-index="${index}">${escapeHtml(table.Display)}</a>`).join('')}
    </div></div>
    <div class="col-sm-8">${previewHtml}</div>
    <div class="col-sm-12"><div class="row table-padding col-sm-4">
      <div class="col-sm-6 text-right"><b>PNL</b></div>
      <div class="col-sm-6"><input type="checkbox" id="ps-add-tables-pnl" ${menu.Parameters.Pnl ? 'checked' : ''}></div>
    </div></div>
    <div class="col-sm-12"><div class="row table-padding col-sm-4"><div class="col-sm-6 text-right" style="padding-top: 2%"><b>Precision Options</b></div></div></div>
    <div class="col-sm-12">
      <div class="row table-padding col-sm-4"><div class="col-sm-6 text-right" style="padding-top: 2%"><b>Min</b></div><div class="col-sm-6"><input type="number" class="form form-control" id="ps-min-precision" min="0" value="${numOrEmpty(state.minPrecision)}"></div></div>
      <div class="row table-padding col-sm-4"><div class="col-sm-6 text-right" style="padding-top: 2%"><b>Max</b></div><div class="col-sm-6"><input type="number" class="form form-control" id="ps-max-precision" min="0" value="${numOrEmpty(state.maxPrecision)}"></div></div>
      <div class="row table-padding col-sm-4"><div class="col-sm-6 text-right"><b>Default Precision</b></div><div class="col-sm-6">
        <select class="btn btn-default form-control" id="ps-default-precision">${(menu.Parameters.PrecisionOptions || []).map((option) => `<option value="${option}" ${menu.Parameters.DefaultPrecision === option ? 'selected' : ''}>${option}</option>`).join('')}</select>
      </div></div>
    </div>
    ${(menu.Parameters.Keys || []).map((key, index) => `<div class="row table-padding"><div class="col-sm-3"><select class="form form-control" data-special-key-index="${index}">${outputOptionsHtml(key)}</select></div></div>`).join('')}
    <div class="col-sm-12"><div class="row table-padding col-sm-4">
      <div class="col-sm-6 text-right"><b>Special Rules</b></div>
      <div class="col-sm-6"><select class="btn btn-default form-control"><option value="1">None</option><option value="2">Ignore</option><option value="3">IRR</option><option value="4">MVSto Range</option><option value="5">Year</option><option value="6">Tooltip</option></select></div>
    </div></div>`;
}

function ruleOptionsHtml(options, current) {
  const currentValue = current?.Value;
  return options.map((option) => `<option value="${option.Value}" ${option.Value === currentValue ? 'selected' : ''}>${escapeHtml(option.Label)}</option>`).join('');
}

function bucketRowHtml(bucket, bucketIndex, setIndex, rule1Options, rule2Options) {
  return `<tr><td>${bucket.nameEditable === true ? `<div><input class="form-control input-sm" type="text" data-bucket-name-edit="${setIndex}:${bucketIndex}" value="${escapeAttr(bucket.Name)}"><span><button class="btn btn-primary btn-sm" style="margin-top:15px;" data-bucket-name-done="${setIndex}:${bucketIndex}">Done</button></span></div><br/>` : `<span>${escapeHtml(bucket.Name)}<br/><i class="pull-righ glyphicon glyphicon-pencil" data-bucket-name-edit-toggle="${setIndex}:${bucketIndex}"></i></span>`}</td>
    <td>${bucket.rulesEditable === true ? `<div>
      <select class="form-control input-sm" data-bucket-rule1-type="${setIndex}:${bucketIndex}">${ruleOptionsHtml(rule1Options, bucket.rule1Type)}</select>
      ${bucket.rule1Type.Value !== 'NONE' ? `<input type="text" class="form-control input-sm" data-bucket-rule1-value="${setIndex}:${bucketIndex}" value="${escapeAttr(bucket.rule1Value)}"/>` : ''}<br/>
      <select class="form-control input-sm" data-bucket-rule2-type="${setIndex}:${bucketIndex}">${ruleOptionsHtml(rule2Options, bucket.rule2Type)}</select>
      ${bucket.rule2Type.Value !== 'NONE' ? `<input type="text" class="form-control input-sm" data-bucket-rule2-value="${setIndex}:${bucketIndex}" value="${escapeAttr(bucket.rule2Value)}"/>` : ''}<br/>
      <button class="btn btn-primary btn-sm" data-bucket-rules-done="${setIndex}:${bucketIndex}">Done</button></div>` : `<div>${escapeHtml(bucket.rule1Type.Label || '')}&nbsp;${escapeHtml(numOrEmpty(bucket.rule1Value))}<br/>${escapeHtml(bucket.rule2Type.Label || '')}&nbsp;${escapeHtml(numOrEmpty(bucket.rule2Value))}<br/><i class="pull-righ glyphicon glyphicon-pencil" data-bucket-rules-edit-toggle="${setIndex}:${bucketIndex}"></i></div>`}</td></tr>`;
}

function bucketSetHtml(set, index, menu, state, outputOptionsHtml, rule1Options, rule2Options) {
  const manager = state.bucketManagers[index];
  const titleError = !set.Title && menu.Parameters.Sets.length > 1;
  return `<div>
    <div class="row table-padding"><div class="col-sm-2 ${titleError ? 'has-error' : ''}" data-bc-title-wrapper="${index}"><b>Title</b></div><div class="col-sm-3"><input type="text" class="form form-control" data-bc-title-index="${index}" value="${escapeAttr(set.Title)}"></div><div class="col-sm-2"><b>Counts</b></div><div class="col-sm-3"><select class="form form-control" data-bc-counts-index="${index}"><option value="false" ${!set.Counts ? 'selected' : ''}>false</option><option value="true" ${set.Counts ? 'selected' : ''}>true</option></select></div></div>
    <div class="row table-padding"><div class="col-sm-2"><b>X Axis</b></div><div class="col-sm-3"><select class="form form-control" data-bc-key-index="${index}">${outputOptionsHtml(set.Key)}</select></div><div class="col-sm-2"><b>X Label</b></div><div class="col-sm-3"><input type="text" class="form form-control" data-bc-xtitle-index="${index}" value="${escapeAttr(set.xTitle)}"></div></div>
    <div class="row table-padding"><div class="col-sm-2"><b>Y Label</b></div><div class="col-sm-3"><input type="text" class="form form-control" data-bc-ytitle-index="${index}" value="${escapeAttr(set.yTitle)}"></div></div><div class="row">&nbsp;</div>
    ${set.xBuckets.length === 0 && !manager ? `<div class="row table-padding well"><div class="col-sm-2">Buckets<br/><input type="number" min="1" class="form form-control" data-bc-numbuckets-index="${index}" value="${numOrEmpty(state.numBuckets)}"></div><div class="col-sm-2">Low<br/><input type="text" class="form-control" data-bc-low-index="${index}" value="${escapeAttr(state.bucketLow)}"></div><div class="col-sm-2">High<br/><input type="text" class="form-control" data-bc-high-index="${index}" value="${escapeAttr(state.bucketHigh)}"></div><div class="col-sm-1"><br/><button class="btn btn-primary" data-bc-generate-index="${index}">Generate Buckets</button></div></div>` : ''}
    ${manager && manager.editing === false ? `<div class="row table-padding"><div class="col-md-9"><b>Buckets: ${manager.editableBuckets.map((bucket, bucketIndex) => `${escapeHtml(bucket.Name)}${bucketIndex < manager.editableBuckets.length - 1 ? ',' : ''}`).join(' ')}<i class="pull-righ glyphicon glyphicon-pencil" data-bc-makeeditable-index="${index}"></i></b></div></div>` : ''}
    ${manager && manager.editing === true ? `<div class="row table-padding"><div class="col-md-3"></div><div class="col-md-6"><table class="table table-bordered table-striped table-condensed"><thead><th>Bucket Label</th><th>Bucket Rule</th></thead><tbody>${manager.editableBuckets.map((bucket, bucketIndex) => bucketRowHtml(bucket, bucketIndex, index, rule1Options, rule2Options)).join('')}</tbody></table><div style="text-align:center"><button class="btn btn-primary" data-bc-addbucket-index="${index}">Add Bucket</button><button class="btn btn-primary" data-bc-deletebucket-index="${index}" ${manager.editableBuckets.length === 0 ? 'disabled' : ''}>Delete Bucket</button><button class="btn btn-primary" data-bc-stopediting-index="${index}">Stop Editing</button></div></div></div>` : ''}
    </div><div class="row table-padding"><div class="col-sm-1"><button class="btn btn-danger" data-bc-deleteset-index="${index}"><span class="glyphicon glyphicon-trash"></span></button></div></div><hr>`;
}

export function renderBucketChartEditor({ menu, state, commandHeaderHtml, outputOptionsHtml, rule1Options, rule2Options }) {
  return `${commandHeaderHtml(menu)}${menu.Parameters.Sets.map((set, index) => bucketSetHtml(set, index, menu, state, outputOptionsHtml, rule1Options, rule2Options)).join('')}<div class="row table-padding"><div class="col-sm-1"><button class="btn btn-success" id="ps-bc-add-set"><span class="glyphicon glyphicon-plus"></span></button></div></div>`;
}

export function renderPortfolioUncertaintyEditor({ menu, commandHeaderHtml, sourceIds, availableKeys, outputsByKey }) {
  const includedKeys = menu.Parameters.RollupKeys;
  return `${commandHeaderHtml(menu)}
    <div class="row table-padding col-sm-12"><div class="col-sm-2"><b>Type</b></div><div class="col-sm-3"><select class="form form-control" id="ps-pu-mvstype"><option value="" ${!menu.Parameters.MVSType ? 'selected' : ''}>--select type--</option><option value="MVSFromFittedPoints" ${menu.Parameters.MVSType === 'MVSFromFittedPoints' ? 'selected' : ''}>MVSFromFittedPoints</option></select></div></div>
    <div class="row table-padding col-sm-12"><div class="col-sm-2"><b>Source</b></div><div class="col-sm-3"><select class="form form-control" id="ps-pu-source"><option value="" ${!menu.Parameters.Source ? 'selected' : ''}>--select source--</option>${sourceIds.map((source) => `<option value="${escapeAttr(source)}" ${menu.Parameters.Source === source ? 'selected' : ''}>${escapeHtml(source)}</option>`).join('')}</select></div></div>
    <div class="row table-padding col-sm-12"><div class="col-sm-2"><b>Representation</b></div><div class="col-sm-3"><select class="form form-control" id="ps-pu-representation"><option value="" ${!menu.Parameters.Representation ? 'selected' : ''}>--slect representation--</option><option value="Curve" ${menu.Parameters.Representation === 'Curve' ? 'selected' : ''}>Curve</option></select></div></div>
    <div class="row table-padding col-sm-12"><div class="col-sm-2"><b>Explanation</b></div><div class="col-sm-6"><textarea class="form-control" rows="4" id="ps-pu-explanation">${escapeHtml(menu.Parameters.PortfolioUncExplanation)}</textarea></div></div>
    <div class="row table-padding col-sm-12"><div class="col-sm-6"><h4>Included Keys</h4></div><div class="col-sm-6"><h4>Excluded Keys</h4></div>
      <div class="col-sm-6" style="overflow: auto;"><div class="list-of-templates"><ul class="list-group">${includedKeys.map((key) => `<li class="list-group-item"><div class="no-wrap"><a class="text-danger"><i class="fa fa-minus-square fa-lg" data-pu-remove-key="${escapeAttr(key)}"></i></a>${escapeHtml(outputsByKey(key)?.Display)}</div></li>`).join('')}</ul></div></div>
      <div class="col-sm-6" style="overflow: auto;"><div class="list-of-templates"><ul class="list-group">${availableKeys.map((key) => `<li class="list-group-item"><div class="no-wrap"><a href="" class="text-success"><i class="fa fa-plus-square fa-lg" data-pu-add-key="${escapeAttr(key)}"></i></a>${escapeHtml(outputsByKey(key)?.Display)}</div></li>`).join('')}</ul></div></div>
    </div>`;
}

export function bindAddTablesEditor({ formEl, state, selectTable, render, changePrecisionOptions, refreshDefaultPrecisionOptions, refreshSaveButton, getOutputUnitFromKey, getOutputDisplayFromKey }) {
  formEl.querySelectorAll('[data-table-index]').forEach((element) => element.addEventListener('click', (event) => { event.preventDefault(); selectTable(state.tables[Number(element.dataset.tableIndex)]); render(); }));
  formEl.querySelector('#ps-add-tables-pnl')?.addEventListener('change', (event) => { state.selectedMenu.Parameters.Pnl = event.target.checked; refreshSaveButton(); });
  const updatePrecision = (field) => (event) => { state[field] = event.target.value === '' ? null : Number(event.target.value); changePrecisionOptions(); refreshDefaultPrecisionOptions(); refreshSaveButton(); };
  formEl.querySelector('#ps-min-precision')?.addEventListener('input', updatePrecision('minPrecision'));
  formEl.querySelector('#ps-max-precision')?.addEventListener('input', updatePrecision('maxPrecision'));
  formEl.querySelector('#ps-default-precision')?.addEventListener('change', (event) => { state.selectedMenu.Parameters.DefaultPrecision = Number(event.target.value); refreshSaveButton(); });
  formEl.querySelectorAll('[data-special-key-index]').forEach((element) => element.addEventListener('change', (event) => { const index = Number(element.dataset.specialKeyIndex); state.selectedMenu.Parameters.Keys[index] = event.target.value; state.selectedMenu.Parameters.Units[index] = getOutputUnitFromKey(event.target.value); state.selectedMenu.Parameters.Titles[index] = getOutputDisplayFromKey(event.target.value); refreshSaveButton(); }));
  const index = state.tables.indexOf(state.selectedTable);
  if (index !== -1) scrollElementIntoView(formEl.querySelector('#ps-tables-list'), formEl.querySelector(`#table${index}`), 300);
}

function bindIndexed(formEl, selector, eventName, handler) {
  formEl.querySelectorAll(selector).forEach((element) => element.addEventListener(eventName, (event) => handler(element, event)));
}

export function bindBucketChartEditor(args) {
  const { formEl, menu, state, render, refreshSaveButton, generateBuckets, makeEditable, addBucket, deleteBucket, stopEditing, deleteBucketSet, addBucketChartSet, toggleNameEdit, toggleRuleEdit, rule1Options, rule2Options } = args;
  bindIndexed(formEl, '[data-bc-title-index]', 'input', (element, event) => { const index = Number(element.dataset.bcTitleIndex); menu.Parameters.Sets[index].Title = event.target.value; formEl.querySelector(`[data-bc-title-wrapper="${index}"]`)?.classList.toggle('has-error', !event.target.value && menu.Parameters.Sets.length > 1); refreshSaveButton(); });
  for (const [selector, datasetKey, field, eventName] of [['[data-bc-counts-index]', 'bcCountsIndex', 'Counts', 'change'], ['[data-bc-key-index]', 'bcKeyIndex', 'Key', 'change'], ['[data-bc-xtitle-index]', 'bcXtitleIndex', 'xTitle', 'input'], ['[data-bc-ytitle-index]', 'bcYtitleIndex', 'yTitle', 'input']]) bindIndexed(formEl, selector, eventName, (element, event) => { menu.Parameters.Sets[Number(element.dataset[datasetKey])][field] = field === 'Counts' ? event.target.value === 'true' : event.target.value; refreshSaveButton(); });
  for (const [selector, field] of [['[data-bc-numbuckets-index]', 'numBuckets'], ['[data-bc-low-index]', 'bucketLow'], ['[data-bc-high-index]', 'bucketHigh']]) bindIndexed(formEl, selector, 'input', (_element, event) => { state[field] = event.target.value; });
  for (const [selector, datasetKey, handler] of [['[data-bc-generate-index]', 'bcGenerateIndex', generateBuckets], ['[data-bc-makeeditable-index]', 'bcMakeeditableIndex', makeEditable], ['[data-bc-addbucket-index]', 'bcAddbucketIndex', addBucket], ['[data-bc-deletebucket-index]', 'bcDeletebucketIndex', deleteBucket], ['[data-bc-stopediting-index]', 'bcStopeditingIndex', stopEditing], ['[data-bc-deleteset-index]', 'bcDeletesetIndex', deleteBucketSet]]) bindIndexed(formEl, selector, 'click', (element) => handler(Number(element.dataset[datasetKey])));
  formEl.querySelector('#ps-bc-add-set')?.addEventListener('click', addBucketChartSet);
  const bucketAt = (value) => { const [setIndex, bucketIndex] = value.split(':').map(Number); return { setIndex, bucketIndex, bucket: state.bucketManagers[setIndex].editableBuckets[bucketIndex] }; };
  for (const [selector, datasetKey, handler] of [['[data-bucket-name-edit-toggle]', 'bucketNameEditToggle', toggleNameEdit], ['[data-bucket-name-done]', 'bucketNameDone', toggleNameEdit], ['[data-bucket-rules-edit-toggle]', 'bucketRulesEditToggle', toggleRuleEdit], ['[data-bucket-rules-done]', 'bucketRulesDone', toggleRuleEdit]]) bindIndexed(formEl, selector, 'click', (element) => { const item = bucketAt(element.dataset[datasetKey]); handler(item.bucket, item.setIndex); });
  bindIndexed(formEl, '[data-bucket-name-edit]', 'input', (element, event) => { bucketAt(element.dataset.bucketNameEdit).bucket.Name = event.target.value; refreshSaveButton(); });
  for (const [selector, datasetKey, field, options] of [['[data-bucket-rule1-type]', 'bucketRule1Type', 'rule1Type', rule1Options], ['[data-bucket-rule2-type]', 'bucketRule2Type', 'rule2Type', rule2Options]]) bindIndexed(formEl, selector, 'change', (element, event) => { bucketAt(element.dataset[datasetKey]).bucket[field] = options.find((option) => option.Value === event.target.value) || ''; render(); });
  for (const [selector, datasetKey, field] of [['[data-bucket-rule1-value]', 'bucketRule1Value', 'rule1Value'], ['[data-bucket-rule2-value]', 'bucketRule2Value', 'rule2Value']]) bindIndexed(formEl, selector, 'input', (element, event) => { bucketAt(element.dataset[datasetKey]).bucket[field] = event.target.value; refreshSaveButton(); });
}

export function bindPortfolioUncertaintyEditor({ formEl, menu, render, refreshSaveButton, addKey, removeKey }) {
  formEl.querySelector('#ps-pu-mvstype')?.addEventListener('change', (event) => { menu.Parameters.MVSType = event.target.value; refreshSaveButton(); });
  formEl.querySelector('#ps-pu-source')?.addEventListener('change', (event) => { menu.Parameters.Source = event.target.value; render(); });
  formEl.querySelector('#ps-pu-representation')?.addEventListener('change', (event) => { menu.Parameters.Representation = event.target.value; refreshSaveButton(); });
  formEl.querySelector('#ps-pu-explanation')?.addEventListener('input', (event) => { menu.Parameters.PortfolioUncExplanation = event.target.value; refreshSaveButton(); });
  bindIndexed(formEl, '[data-pu-remove-key]', 'click', (element) => { removeKey(element.dataset.puRemoveKey); render(); });
  bindIndexed(formEl, '[data-pu-add-key]', 'click', (element, event) => { event.preventDefault(); addKey(element.dataset.puAddKey); render(); });
}
