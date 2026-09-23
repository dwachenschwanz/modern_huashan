import { escapeHtml } from '../../core/html.js';

function makeRule1Options() {
  return [{ Label: '', Value: 'NONE' }, { Label: '>', Value: 'GT' }, { Label: '>=', Value: 'GE' }];
}

function makeRule2Options() {
  return [{ Label: '', Value: 'NONE' }, { Label: '<', Value: 'LT' }, { Label: '<=', Value: 'LE' }];
}

export class BucketManager {
  constructor(buckets) {
    this.rule1Options = makeRule1Options();
    this.rule2Options = makeRule2Options();
    this.editableBuckets = this.editableBucketsFrom(buckets);
    this.editing = false;
  }

  editableBucketsFrom(buckets) {
    return (buckets || []).map((bucket) => {
      const rule1Type = this.rule1From(bucket);
      const rule2Type = this.rule2From(bucket);
      return {
        Name: bucket.Name,
        nameEditable: false,
        rulesEditable: false,
        rule1Type,
        rule1Value: bucket[rule1Type.Value],
        rule2Type,
        rule2Value: bucket[rule2Type.Value],
      };
    });
  }

  rule1From(bucket) {
    return bucket.GT ? this.rule1Options[1] : bucket.GE ? this.rule1Options[2] : this.rule1Options[0];
  }

  rule2From(bucket) {
    return bucket.LT ? this.rule2Options[1] : bucket.LE ? this.rule2Options[2] : this.rule2Options[0];
  }

  buckets() {
    return this.editableBuckets.map((bucket) => {
      const packet = { Name: bucket.Name };
      if (bucket.rule1Type.Value === 'GT') packet.GT = bucket.rule1Value;
      else if (bucket.rule1Type.Value === 'GE') packet.GE = bucket.rule1Value;
      if (bucket.rule2Type.Value === 'LT') packet.LT = bucket.rule2Value;
      else if (bucket.rule2Type.Value === 'LE') packet.LE = bucket.rule2Value;
      return packet;
    });
  }
}

export function renderTornadoEditor({ menu, state, commandHeaderHtml, findKey, optionHtml }) {
  const parameters = menu.Parameters;
  const includedKeys = parameters.ValueMetricKeys || (parameters.ValueMetricKeys = []);
  const excludedOutputs = state.outputs.filter((output) => !includedKeys.includes(output.Key));
  const weights = parameters.Weights || (parameters.Weights = { High: 0.25, Med: 0.5, Low: 0.25 });
  return `${commandHeaderHtml(menu)}
    <ul class="nav nav-tabs"><li class="${state.tornadoTab === 'output' ? 'active' : ''}"><a href="" data-tornado-tab="output">Tornado Output</a></li><li class="${state.tornadoTab === 'settings' ? 'active' : ''}"><a href="" data-tornado-tab="settings">Parameters</a></li><li class="${state.tornadoTab === 'post' ? 'active' : ''}"><a href="" data-tornado-tab="post">Post Processing</a></li></ul>
    ${state.tornadoTab === 'output' ? `<div class="tornado-output-picker">
      <div class="col-sm-6"><h4>Included Outputs</h4></div>
      <div class="col-sm-6"><h4>Excluded Outputs</h4></div>
      <div class="col-sm-6" style="height:420px;overflow:auto">
        <div class="list-of-templates"><ul class="list-group">
          ${includedKeys.map((key) => {
            const output = findKey(state.outputs)(key);
            return `<li class="list-group-item"><div class="no-wrap"><a class="text-danger" href="" data-tornado-key="${escapeHtml(key)}" title="Exclude output"><i class="fa fa-minus-square fa-lg"></i></a> ${escapeHtml(output ? output.Display : key)}</div></li>`;
          }).join('')}
        </ul></div>
      </div>
      <div class="col-sm-6" style="height:420px;overflow:auto">
        <div class="list-of-templates"><ul class="list-group">
          ${excludedOutputs.map((output) => `<li class="list-group-item"><div class="no-wrap"><a class="text-success" href="" data-tornado-key="${escapeHtml(output.Key)}" title="Include output"><i class="fa fa-plus-square fa-lg"></i></a> ${escapeHtml(output.Display)}</div></li>`).join('')}
        </ul></div>
      </div>
    </div>` : ''}
    ${state.tornadoTab === 'settings' ? `<div class="container-fluid"><div class="row table-padding"><div class="col-sm-3 text-right"><b>Chart Title</b></div><div class="col-sm-6"><input class="form-control" data-field="Parameters.ChartTitle" value="${escapeHtml(parameters.ChartTitle || '')}"></div></div><div class="row table-padding"><div class="col-sm-3 text-right"><b>Combined Uncertainty Label</b></div><div class="col-sm-6"><input class="form-control" data-field="Parameters.CombinedUncertaintyLabel" value="${escapeHtml(parameters.CombinedUncertaintyLabel || '')}"></div></div><div class="row table-padding"><div class="col-sm-3 text-right"><b>Depth</b></div><div class="col-sm-3"><input type="number" class="form-control" data-field="Parameters.Depth" value="${parameters.Depth ?? 2}"></div></div>${['High','Med','Low'].map((key) => `<div class="row table-padding"><div class="col-sm-3 text-right"><b>${key === 'Med' ? 'Medium' : key}</b></div><div class="col-sm-3"><input type="number" min="0" max="1" step="0.01" class="form-control" data-field="Parameters.Weights.${key}" value="${weights[key]}"></div></div>`).join('')}</div>` : ''}
    ${state.tornadoTab === 'post' ? `<div class="container-fluid">${state.postProcessing.map((sendback, i) => `<div class="row table-padding"><div class="col-sm-1"><button class="btn btn-danger" data-sendback-delete="${i}"><span class="glyphicon glyphicon-trash"></span></button></div><div class="col-sm-2"><select class="form-control" data-sendback-to="${i}">${state.sendBackElements.map((item) => `<option value="${escapeHtml(item.value)}" ${sendback.Reference && sendback.Reference.slice(22) === item.value ? 'selected' : ''}>${escapeHtml(item.display)}</option>`).join('')}</select></div><div class="col-sm-3"><select class="form-control" data-sendback-tornado="${i}">${includedKeys.map((key, keyIndex) => `<option value="${keyIndex}" ${sendback.Reference && Number(sendback.Reference[19]) === keyIndex ? 'selected' : ''}>${escapeHtml((findKey(state.outputs)(key) || {}).Display || key)}</option>`).join('')}</select></div><div class="col-sm-4"><select class="form-control" data-sendback-field="${i}">${optionHtml(state.allDataStructureComponents, sendback.SendBack, (item) => item.CellLink, (item) => item.Display)}</select></div></div>`).join('')}<button class="btn btn-success" id="as-sendback-add"><span class="glyphicon glyphicon-plus"></span></button></div>` : ''}`;
}

export function renderBucketChartEditor({ menu, state, commandHeaderHtml, optionHtml, getOutputDisplayFromKey }) {
  const sets = menu.Parameters.Sets || [];
  return `${commandHeaderHtml(menu)}${sets.map((set, setIndex) => {
    const manager = state.bucketManagers[setIndex];
    return `<div class="well"><div class="row table-padding"><div class="col-sm-2"><b>Title</b></div><div class="col-sm-3"><input class="form-control" data-bucket-field="Title:${setIndex}" value="${escapeHtml(set.Title || '')}"></div><div class="col-sm-2"><b>Counts</b></div><div class="col-sm-2"><input type="checkbox" data-bucket-field="Counts:${setIndex}" ${set.Counts ? 'checked' : ''}></div></div><div class="row table-padding"><div class="col-sm-2"><b>X Axis</b></div><div class="col-sm-3"><select class="form-control" data-bucket-field="Key:${setIndex}">${optionHtml(state.allOutputs, set.Key, (item) => item.Key, (item) => getOutputDisplayFromKey(item.Key))}</select></div><div class="col-sm-2"><b>X Label</b></div><div class="col-sm-3"><input class="form-control" data-bucket-field="xTitle:${setIndex}" value="${escapeHtml(set.xTitle || '')}"></div></div><div class="row table-padding"><div class="col-sm-2"><b>Y Label</b></div><div class="col-sm-3"><input class="form-control" data-bucket-field="yTitle:${setIndex}" value="${escapeHtml(set.yTitle || '')}"></div></div>
    ${manager ? `<div class="row table-padding"><div class="col-sm-12"><b>Buckets:</b> ${manager.editableBuckets.map((bucket) => escapeHtml(bucket.Name)).join(', ')} <button class="btn btn-default btn-sm" data-bucket-edit="${setIndex}">Edit</button></div></div>${manager.editing ? `<table class="table table-bordered table-striped"><thead><tr><th>Bucket Label</th><th>Lower Rule</th><th>Lower Value</th><th>Upper Rule</th><th>Upper Value</th></tr></thead><tbody>${manager.editableBuckets.map((bucket, bucketIndex) => `<tr><td><input class="form-control input-sm" data-bucket-name="${setIndex}:${bucketIndex}" value="${escapeHtml(bucket.Name)}"></td><td><select class="form-control input-sm" data-bucket-rule1="${setIndex}:${bucketIndex}">${makeRule1Options().map((option) => `<option value="${option.Value}" ${option.Value === bucket.rule1Type.Value ? 'selected' : ''}>${escapeHtml(option.Label)}</option>`).join('')}</select></td><td><input class="form-control input-sm" data-bucket-rule1-value="${setIndex}:${bucketIndex}" value="${bucket.rule1Value ?? ''}"></td><td><select class="form-control input-sm" data-bucket-rule2="${setIndex}:${bucketIndex}">${makeRule2Options().map((option) => `<option value="${option.Value}" ${option.Value === bucket.rule2Type.Value ? 'selected' : ''}>${escapeHtml(option.Label)}</option>`).join('')}</select></td><td><input class="form-control input-sm" data-bucket-rule2-value="${setIndex}:${bucketIndex}" value="${bucket.rule2Value ?? ''}"></td></tr>`).join('')}</tbody></table><button class="btn btn-primary" data-bucket-add="${setIndex}">Add Bucket</button> <button class="btn btn-primary" data-bucket-remove="${setIndex}">Delete Bucket</button>` : ''}` : `<div class="row table-padding"><div class="col-sm-2">Buckets<input type="number" class="form-control" id="as-bucket-count-${setIndex}"></div><div class="col-sm-2">Low<input class="form-control" id="as-bucket-low-${setIndex}"></div><div class="col-sm-2">High<input class="form-control" id="as-bucket-high-${setIndex}"></div><div class="col-sm-2"><br><button class="btn btn-primary" data-bucket-generate="${setIndex}">Generate Buckets</button></div></div>`}<div class="row table-padding"><button class="btn btn-danger" data-bucket-set-delete="${setIndex}"><span class="glyphicon glyphicon-trash"></span></button></div></div>`;
  }).join('')}<button class="btn btn-success" id="as-bucket-set-add"><span class="glyphicon glyphicon-plus"></span></button>`;
}

export function renderWaterfallEditor({ menu, state, commandHeaderHtml, previewHtml }) {
  const sets = menu.Parameters.Sets || [];
  return `${commandHeaderHtml(menu)}<div class="col-sm-3"><div class="list-group">${state.potentialTables.map((table, index) => `<a href="" class="list-group-item ${table === state.selectedPotentialTable ? 'active' : ''}" data-waterfall-table="${index}">${escapeHtml(table.CellLink)}</a>`).join('')}</div></div><div class="col-sm-9">${previewHtml(state.selectedPotentialTable)}</div><div class="col-sm-12">${sets.map((set, index) => `<div class="well"><div class="row table-padding"><div class="col-sm-2"><b>OutputKey</b></div><div class="col-sm-3"><input class="form-control" data-waterfall-field="OutputKey:${index}" value="${escapeHtml(set.OutputKey || '')}"></div><div class="col-sm-2"><b>Units</b></div><div class="col-sm-3"><input class="form-control" data-waterfall-field="Units:${index}" value="${escapeHtml(set.Units || '')}"></div></div><div class="row table-padding"><div class="col-sm-2"><b>Name</b></div><div class="col-sm-3"><input class="form-control" data-waterfall-field="name:${index}" value="${escapeHtml(set.name || '')}"></div><div class="col-sm-2"><b>Y Title</b></div><div class="col-sm-3"><input class="form-control" data-waterfall-field="yTitle:${index}" value="${escapeHtml(set.yTitle || '')}"></div><div class="col-sm-1"><button class="btn btn-danger" data-waterfall-delete="${index}"><span class="glyphicon glyphicon-trash"></span></button></div></div></div>`).join('')}<button class="btn btn-success" id="as-waterfall-add"><span class="glyphicon glyphicon-plus"></span></button></div>`;
}

function bindAll(root, selector, eventName, handler) {
  root.querySelectorAll(selector).forEach((element) => element.addEventListener(eventName, handler));
}

export function bindTornadoEditor({ root, state, render, selectTornado, addSendBack, deleteSendBack, selectSendBackTo, selectSendBackTornado }) {
  bindAll(root, '[data-tornado-tab]', 'click', (event) => { event.preventDefault(); state.tornadoTab = event.currentTarget.dataset.tornadoTab; render(); });
  bindAll(root, '[data-tornado-key]', 'click', (event) => { event.preventDefault(); selectTornado(event.currentTarget.dataset.tornadoKey); render(); });
  root.querySelector('#as-sendback-add')?.addEventListener('click', () => { addSendBack(); render(); });
  bindAll(root, '[data-sendback-delete]', 'click', (event) => { deleteSendBack(state.postProcessing[Number(event.currentTarget.dataset.sendbackDelete)]); render(); });
  bindAll(root, '[data-sendback-to]', 'change', (event) => { const index = Number(event.currentTarget.dataset.sendbackTo); selectSendBackTo(state.postProcessing[index], event.currentTarget.value); render(); });
  bindAll(root, '[data-sendback-tornado]', 'change', (event) => { const index = Number(event.currentTarget.dataset.sendbackTornado); selectSendBackTornado(state.postProcessing[index], Number(event.currentTarget.value)); render(); });
  bindAll(root, '[data-sendback-field]', 'change', (event) => { state.postProcessing[Number(event.currentTarget.dataset.sendbackField)].SendBack = event.currentTarget.value; });
}

export function bindBucketChartEditor({ root, menu, state, render, inputValue, generateBuckets, addBucket, deleteBucket, deleteBucketSet, addBucketChartSet, selectMenu }) {
  bindAll(root, '[data-bucket-field]', 'change', (event) => { const [field, index] = event.currentTarget.dataset.bucketField.split(':'); menu.Parameters.Sets[Number(index)][field] = inputValue(event.currentTarget); });
  bindAll(root, '[data-bucket-edit]', 'click', (event) => { const manager = state.bucketManagers[Number(event.currentTarget.dataset.bucketEdit)]; manager.editing = !manager.editing; render(); });
  bindAll(root, '[data-bucket-generate]', 'click', (event) => {
    const index = Number(event.currentTarget.dataset.bucketGenerate);
    state.numBuckets = Number(root.querySelector(`#as-bucket-count-${index}`).value);
    state.bucketLow = root.querySelector(`#as-bucket-low-${index}`).value;
    state.bucketHigh = root.querySelector(`#as-bucket-high-${index}`).value;
    generateBuckets(index);
    state.bucketManagers[index].editing = true;
    render();
  });
  bindAll(root, '[data-bucket-add]', 'click', (event) => { addBucket(Number(event.currentTarget.dataset.bucketAdd)); render(); });
  bindAll(root, '[data-bucket-remove]', 'click', (event) => { deleteBucket(Number(event.currentTarget.dataset.bucketRemove)); render(); });
  bindAll(root, '[data-bucket-set-delete]', 'click', (event) => { deleteBucketSet(Number(event.currentTarget.dataset.bucketSetDelete)); render(); });
  root.querySelector('#as-bucket-set-add')?.addEventListener('click', () => { addBucketChartSet(); selectMenu(menu); render(); });

  const updateBucket = (datasetName, property, options) => bindAll(root, `[data-${datasetName}]`, 'change', (event) => {
    const datasetKey = datasetName.replace(/-([a-z])/g, (_, character) => character.toUpperCase());
    const [setIndex, bucketIndex] = event.currentTarget.dataset[datasetKey].split(':').map(Number);
    const bucket = state.bucketManagers[setIndex].editableBuckets[bucketIndex];
    bucket[property] = options ? options().find((option) => option.Value === event.currentTarget.value) : event.currentTarget.value;
    menu.Parameters.Sets[setIndex].xBuckets = state.bucketManagers[setIndex].buckets();
  });
  updateBucket('bucket-name', 'Name');
  updateBucket('bucket-rule1', 'rule1Type', makeRule1Options);
  updateBucket('bucket-rule1-value', 'rule1Value');
  updateBucket('bucket-rule2', 'rule2Type', makeRule2Options);
  updateBucket('bucket-rule2-value', 'rule2Value');
}

export function bindWaterfallEditor({ root, menu, state, render, insertParamsToWaterfallTables, deleteTableInWaterfall, addNewParamsToWaterfall }) {
  bindAll(root, '[data-waterfall-table]', 'click', (event) => { event.preventDefault(); insertParamsToWaterfallTables(state.potentialTables[Number(event.currentTarget.dataset.waterfallTable)]); render(); });
  bindAll(root, '[data-waterfall-field]', 'input', (event) => { const [field, index] = event.currentTarget.dataset.waterfallField.split(':'); menu.Parameters.Sets[Number(index)][field] = event.currentTarget.value; });
  bindAll(root, '[data-waterfall-delete]', 'click', (event) => { deleteTableInWaterfall(Number(event.currentTarget.dataset.waterfallDelete)); render(); });
  root.querySelector('#as-waterfall-add')?.addEventListener('click', () => { addNewParamsToWaterfall(); render(); });
}
