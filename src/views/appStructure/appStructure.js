/* Ported from appStructureController.ts + views/appstructure.html. */
import Highcharts from 'highcharts';
import { huashan } from '../../api/huashanClient.js';
import { session, restoreSession } from '../../core/session.js';
import { SERVER_URL } from '../../core/config.js';
import { navigate, setNavigationGuard, clearNavigationGuard } from '../../core/router.js';
import { appNavHtml } from '../../components/appNav.js';
import { renderAlerts, wireAlertClose } from '../../components/alerts.js';
import { commitMessageModalHtml, initCommitMessageModal, closeCommitMessageModal } from '../../components/commitMessageModal.js';
import { showModal, hideModal, onModalShown, initTooltips } from '../../components/bootstrapUI.js';
import { makeSortable } from '../../components/sortable.js';
import { scrollElementIntoView } from '../../components/scrollTo.js';
import { escapeHtml, extractTablePreviewHtml } from '../../core/html.js';
import { makeActionIDFrom, isActionIDDuplicate } from '../../core/common.js';

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

function escapeAttr(str) {
  return escapeHtml(str);
}

/* ---- BucketManager: ported 1:1 from the TS class at the bottom of
 * appStructureController.ts. Manages the editable "rule1/rule2" view of a
 * BUCKET_CHART set's xBuckets (each bucket is `{GE|GT, LE|LT, Name}`). ---- */

function makeRule1Options() {
  return [{ Label: '', Value: 'NONE' }, { Label: '>', Value: 'GT' }, { Label: '>=', Value: 'GE' }];
}
function makeRule2Options() {
  return [{ Label: '', Value: 'NONE' }, { Label: '<', Value: 'LT' }, { Label: '<=', Value: 'LE' }];
}

class BucketManager {
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

  makeEditable() {
    this.editing = true;
  }

  stopEditing() {
    this.editing = false;
  }
}

export function mount(container, params) {
  if (!restoreSession()) return () => {};

  const state = {
    selectedTemplate: params.templateID,
    isPlatform: !!params.isPlatform,
    isAdmin: getIsAdmin(),
    appStructure: null,
    appStructureCopy: null,
    selectedMenu: null,
    potentialTables: [],
    tables: [],
    charts: [],
    selectedTable: null,
    selectedPotentialTable: null,
    selectedImageTable: null,
    selectedImageChart: null,
    minPrecision: null,
    maxPrecision: null,
    saveAlerts: [],
    saveComplete: true,
    newAppStructureAlerts: [],
    inputs: [],
    outputs: [],
    tornado: null,
    postProcessing: [],
    sendBackElements: [
      { value: 'Mean', display: 'Mean' },
      { value: 'Summary[0]', display: 'Low' },
      { value: 'Summary[1]', display: 'Med' },
      { value: 'Summary[2]', display: 'High' },
    ],
    excludedInputs: [],
    tornadoValueMetricKeys: [],
    tornadoMetaLogKeys: [],
    allDataStructureComponents: [],
    tornadoOutputs: [],
    tableInputs: [],
    allOutputs: [],
    bucketManagers: [],
    numBuckets: '',
    bucketLow: '',
    bucketHigh: '',
    waterfall: null,
    imageChartInstance: null,
    searchText: '',
    tornadoTab: 'output',
    metalogTab: 'metalogKeys',
    metalogHelpIcon: false,
    showFittedPointsHelp: false,
  };

  // ---- small utility helpers (ported 1:1) ----

  function findKey(arr) {
    return function (key) {
      return (arr || []).find((element) => element.Key === key);
    };
  }

  function findCellLink(cellLink) {
    return (state.potentialTables || []).find((table) => table.CellLink === cellLink);
  }

  function addAlert(alerts, type, msg) {
    alerts.push({ type, msg });
  }

  function isUnchanged() {
    return JSON.stringify(state.appStructure) === JSON.stringify(state.appStructureCopy);
  }

  function makeIDfrom(name) {
    let id = name.slice(name.indexOf('!') + 1) + name.slice(0, name.indexOf('!'));
    id = id.replace(/'/g, '');
    if (isActionIDDuplicate(id, state.appStructure.MENU)) {
      const second = new Date().getSeconds();
      return id + second;
    }
    return id;
  }

  function getKeyFrom(axis) {
    if (axis === '' || axis === undefined) return '';
    const startIndex = axis.indexOf("'");
    const result = axis.slice(startIndex + 1);
    const endIndex = result.indexOf("'");
    return result.slice(0, endIndex);
  }

  function buildOutputFromKey(key) {
    return "Outputs['" + key + "']";
  }

  function getOutputDisplayFromKey(key) {
    let output = state.outputs.find((o) => o.Key === key);
    if (output !== undefined) return output.Display;
    output = state.tornadoOutputs.find((o) => o.Key === key);
    return output ? output.Title : undefined;
  }

  // ---- data fetching ----

  function getAppStructure() {
    huashan.getAppStructure(session.getCredentials(), params.templateID, state.isPlatform).then((response) => {
      state.appStructure = response.result;
      state.tornadoValueMetricKeys = gettornadoValueMetricKeys();
      state.tornadoMetaLogKeys = gettornadoMetaLogKeys();
      if (state.appStructure.PostProcessingOutputsForPortfolio === undefined) {
        state.appStructure.PostProcessingOutputsForPortfolio = [];
      }
      state.postProcessing = state.appStructure.PostProcessingOutputsForPortfolio;
      if (state.appStructure.MENU.length > 0) {
        selectMenu(state.appStructure.MENU[0]);
      }
      state.appStructureCopy = structuredClone(state.appStructure);
      getDataStructure();
      render();
    });
    // platform app structure needs information in product app structure
    huashan.getAppStructure(session.getCredentials(), params.templateID, false).then((response) => {
      const regularAppStructure = response.result;
      state.tables = regularAppStructure.MENU.filter((menu) => menu.Command === 'TABLE');
      render();
    });
  }

  function getPotentialTables() {
    huashan.getPotentialTables(session.getCredentials(), params.templateID).then((response) => {
      state.potentialTables = response.result.PotentialTableOutputs;
      render();
    });
  }

  function getCharts() {
    huashan.getCharts(session.getCredentials(), params.templateID).then((response) => {
      state.charts = response.result.Charts;
      render();
    });
  }

  function getDataStructure() {
    huashan.getIncludedDataStructureComponents(session.getCredentials(), params.templateID, state.isPlatform).then((data) => {
      state.inputs = data.result.Inputs;
      getExcludedInputs();
      state.outputs = data.result.Outputs;
      state.allDataStructureComponents = state.inputs.concat(state.outputs);
      state.tableInputs = state.inputs.filter((input) => input.Type === 'TABLE');
      state.tornadoOutputs = state.outputs.filter((output) => output.UsePostProcessingOutputs === true);
      state.allOutputs = state.outputs.concat(state.tornadoOutputs);
      render();
    });
  }

  function getExcludedInputs() {
    const inputScreens = state.appStructure.MENU.filter((menu) => menu.Command === 'INPUT_SCREEN');
    const includedInputKeys = [];
    inputScreens.forEach((inputScreen) => {
      inputScreen.Parameters.InputKeys.forEach((inputKey) => includedInputKeys.push(inputKey));
    });
    state.inputs.forEach((input) => {
      if (includedInputKeys.indexOf(input.Key) === -1) {
        state.excludedInputs.push(findKey(state.inputs)(input.Key));
      }
    });
  }

  function gettornadoValueMetricKeys() {
    let temp = [];
    state.appStructure.MENU.forEach((item) => {
      if (item.Command === 'TORNADODIST') temp = item.Parameters.ValueMetricKeys;
    });
    return temp;
  }

  function gettornadoMetaLogKeys() {
    let temp = [];
    state.appStructure.MENU.forEach((item) => {
      if (item.Command === 'TORNADODIST') temp = item.Parameters.MetaLogKeys;
    });
    return temp;
  }

  // ---- selection ----

  function selectMenu(menu) {
    state.selectedMenu = menu;
    destroyImageChart();
    if (menu.Command === 'TABLE') {
      state.selectedPotentialTable = (state.potentialTables || []).find((table) => table.CellLink === menu.Parameters.CellLink);
    } else if (menu.Command === 'IMAGE' && menu.Parameters.Type === 'RANGE') {
      state.selectedImageTable = (state.potentialTables || []).find((table) => table.CellLink === menu.Parameters.CellLink);
    } else if (menu.Command === 'IMAGE' && menu.Parameters.Type === 'CHART') {
      state.selectedImageChart = (state.charts || []).find((chart) => chart.ChartName === menu.Parameters.CellLink);
    } else if (menu.Command === 'TORNADODIST') {
      state.tornado = menu;
    } else if (menu.Command === 'ADD_TABLES') {
      state.selectedTable = (state.tables || []).find((table) => table.Parameters.OutputKey === menu.Parameters.Key);
      state.selectedPotentialTable = state.selectedTable
        ? (state.potentialTables || []).find((table) => table.CellLink === state.selectedTable.Parameters.CellLink)
        : undefined;
      const opts = menu.Parameters.PrecisionOptions;
      state.minPrecision = !opts || opts.length === 0 ? null : opts[0];
      state.maxPrecision = !opts || opts.length === 0 ? null : opts[opts.length - 1];
    } else if (menu.Command === 'WATERFALL') {
      state.waterfall = menu.Parameters.Sets;
      const index = state.waterfall.length - 1;
      state.selectedPotentialTable = (state.potentialTables || []).find((table) => table.CellLink === state.waterfall[index].CellLink);
    }
    if (menu.Visible === undefined) menu.Visible = true;
    if (menu.Command === 'BUCKET_CHART') {
      state.bucketLow = '';
      state.bucketHigh = '';
      state.numBuckets = '';
      state.bucketManagers = menu.Parameters.Sets.map((s) => new BucketManager(s.xBuckets));
    }
  }

  function selectTable(table) {
    state.selectedTable = table;
    state.selectedMenu.Parameters.Key = table.Parameters.OutputKey;
    state.selectedPotentialTable = (state.potentialTables || []).find((t) => t.CellLink === state.selectedTable.Parameters.CellLink);
  }

  function selectPotentialTable(table) {
    state.selectedPotentialTable = table;
    state.selectedMenu.Parameters.CellLink = table.CellLink;
    state.selectedMenu.Parameters.OutputKey = table.CellLink.slice(table.CellLink.indexOf('!') + 1);
    state.selectedMenu.ID = makeIDfrom(table.CellLink);
  }

  function selectImageTable(table) {
    state.selectedImageTable = table;
    state.selectedMenu.Parameters.CellLink = table.CellLink;
    state.selectedMenu.Parameters.OutputKey = table.CellLink.slice(table.CellLink.indexOf('!') + 1);
    state.selectedMenu.ID = makeIDfrom(table.CellLink);
  }

  function selectImageChart(chart) {
    state.selectedImageChart = chart;
    state.selectedMenu.Parameters.CellLink = chart.ChartName;
    state.selectedMenu.Parameters.OutputKey = chart.ChartName.slice(chart.ChartName.indexOf('!') + 1);
    state.selectedMenu.ID = makeIDfrom(chart.ChartName);
  }

  // ---- Highcharts preview (REST CalcEngine returns chart JSON, no PNG) ----

  function destroyImageChart() {
    if (state.imageChartInstance) {
      state.imageChartInstance.destroy();
      state.imageChartInstance = null;
    }
  }

  function mapHighchartsType(chartType) {
    const t = (chartType || '').toString().toLowerCase();
    if (t.indexOf('bar') !== -1) return 'bar';
    if (t.indexOf('line') !== -1) return 'line';
    if (t.indexOf('area') !== -1) return 'area';
    if (t.indexOf('pie') !== -1 || t.indexOf('doughnut') !== -1) return 'pie';
    if (t.indexOf('scatter') !== -1 || t.indexOf('xy') !== -1) return 'scatter';
    return 'column';
  }

  function renderCalcEngineChart(containerEl, metadata) {
    if (!containerEl || !metadata) return;
    destroyImageChart();
    const baseType = mapHighchartsType(metadata.chartType);
    const seriesList = Array.isArray(metadata.series) ? metadata.series : [];
    const categories =
      seriesList.length && seriesList[0].resolvedData && seriesList[0].resolvedData.xValues ? seriesList[0].resolvedData.xValues : [];

    const axes = Array.isArray(metadata.axes) ? metadata.axes : [];
    let categoryAxis = null;
    let valueAxis = null;
    axes.forEach((a) => {
      const at = ((a && a.axisType) || '').toString().toLowerCase();
      if (at === 'category' && !categoryAxis) categoryAxis = a;
      if (at === 'value' && !valueAxis) valueAxis = a;
    });

    const highchartsSeries = seriesList.map((s) => {
      s = s || {};
      const data = s.resolvedData && s.resolvedData.values ? s.resolvedData.values : [];
      const seriesObj = { name: s.name || '', type: mapHighchartsType(s.chartType || metadata.chartType), data };
      const hex = s.markerForegroundColor && s.markerForegroundColor.hex;
      if (hex) seriesObj.color = hex;
      return seriesObj;
    });

    const legendPosition = ((metadata.legend && metadata.legend.position) || 'bottom').toString().toLowerCase();

    // Excel encodes "auto" scale as 0/0 - leave those undefined so Highcharts auto-ranges.
    const scaleIsAuto = valueAxis && valueAxis.minimumScale === 0 && valueAxis.maximumScale === 0;
    const yMin = valueAxis && !scaleIsAuto ? valueAxis.minimumScale : undefined;
    const yMax = valueAxis && !scaleIsAuto ? valueAxis.maximumScale : undefined;

    const chartOptions = {
      chart: { type: baseType, backgroundColor: 'transparent', reflow: true },
      title: { text: metadata.hasTitle ? metadata.title || '' : '' },
      credits: { enabled: false },
      legend: {
        enabled: metadata.hasLegend !== false && highchartsSeries.length > 0,
        verticalAlign: legendPosition === 'top' ? 'top' : 'bottom',
      },
      xAxis: { categories, title: { text: (categoryAxis && categoryAxis.title) || '' } },
      yAxis: { title: { text: (valueAxis && valueAxis.title) || '' }, min: yMin, max: yMax },
      series: highchartsSeries,
      // Exporting module isn't bundled in the CMS - keep the preview lightweight.
      exporting: { enabled: false },
    };

    state.imageChartInstance = Highcharts.chart(containerEl, chartOptions);
  }

  function renderSelectedImageChart() {
    const el = container.querySelector('#appstructure-image-chart');
    if (!el) return;
    if (state.selectedImageChart && state.selectedImageChart.Chart) {
      renderCalcEngineChart(el, state.selectedImageChart.Chart);
    } else {
      destroyImageChart();
    }
  }

  // ---- save flow ----

  function checkTornadoWeights() {
    const tornados = state.appStructure.MENU.filter((menu) => menu.Command === 'TORNADODIST');
    let result = true;
    tornados.forEach((tornado) => {
      const weights = tornado.Parameters.Weights;
      if (weights.High + weights.Med + weights.Low !== 1) result = false;
    });
    if (!result) addAlert(state.saveAlerts, 'danger', 'Weights in tornado do not add up to 1.');
    return result;
  }

  function ensureTornadoDepthIsNumeric() {
    if (state.tornado) state.tornado.Parameters.Depth = parseInt(state.tornado.Parameters.Depth, 10);
  }

  function save(message) {
    state.saveAlerts = [];
    if (!checkTornadoWeights()) {
      render();
      return;
    }
    ensureTornadoDepthIsNumeric();
    state.saveComplete = false;
    render();
    huashan
      .saveAppStructure(session.getCredentials(), params.templateID, { data: state.appStructure, commitMessage: message }, state.isPlatform)
      .then((response) => {
        state.saveComplete = true;
        if (response.status) {
          state.appStructureCopy = structuredClone(state.appStructure);
        } else {
          addAlert(state.saveAlerts, 'danger', response.msg);
        }
        render();
      });
  }

  function getIndexOfAllBlank(postprocessing) {
    const allSendBack = postprocessing.map((item) => item.SendBack);
    const indexes = [];
    for (let i = 0; i < allSendBack.length; i++) {
      if (allSendBack[i] === '') indexes.push(i);
    }
    return indexes;
  }

  // save and remove SendBack if there is blank in BackTo
  function saveWithoutBlank(message) {
    const indexes = getIndexOfAllBlank(state.postProcessing);
    state.postProcessing.splice(indexes[0], state.postProcessing.length - indexes[0]);
    save(message);
  }

  function saveWithCommit(commitMessage = 'Save Changes!') {
    saveWithoutBlank(commitMessage);
    closeCommitMessageModal();
  }

  function rename() {
    save(undefined);
    hideModal('editAppStructureModal');
  }

  // ---- post-processing (tornado send-back) ----

  function selectSendBackTornado(sendback, index) {
    const key = state.tornado.Parameters.ValueMetricKeys[index];
    const outputCellLink = findKey(state.outputs)(key).CellLink;
    sendback.Reference = sendback.Reference.substr(0, 19) + index + sendback.Reference.substr(20);
    const sendTo = state.sendBackElements.find((ele) => ele.value === sendback.Reference.substr(22));
    if (sendTo !== undefined) {
      sendback.Key = sendTo.display + '_' + outputCellLink.replace('!', '_');
    } else {
      sendback.Key = 'Mean_' + outputCellLink.replace('!', '_');
    }
    sendback.Title = sendback.Title.slice(0, sendback.Title.indexOf('of') + 3) + outputCellLink.replace('!', '_');
  }

  function selectSendBackTo(sendback, sendTo) {
    sendback.Reference = sendback.Reference.substr(0, 22) + sendTo;
    const sendToDisplay = state.sendBackElements.find((ele) => ele.value === sendTo).display;
    sendback.Key = sendToDisplay + sendback.Key.slice(sendback.Key.indexOf('_'));
    sendback.Title = sendToDisplay + sendback.Title.slice(sendback.Title.indexOf(' '));
  }

  function addSendBack() {
    const sendBack = { SendBack: '', Reference: 'TornadoDistOutputs[0].mean', Key: 'mean_xxxx', Title: 'mean of xxxx' };
    state.postProcessing.push(sendBack);
  }

  function deleteSendBack(sendback) {
    state.postProcessing.splice(state.postProcessing.indexOf(sendback), 1);
  }

  function selectTornado(key) {
    const vmk = state.tornado.Parameters.ValueMetricKeys;
    if (vmk.indexOf(key) > -1) {
      vmk.splice(vmk.indexOf(key), 1);
      const mlk = state.tornado.Parameters.MetaLogKeys;
      if (mlk && mlk.indexOf(key) > -1) mlk.splice(mlk.indexOf(key), 1);
    } else {
      vmk.push(key);
    }
  }

  function selectWithinMetalog(key) {
    const keys = state.selectedMenu.Parameters.MetaLogKeys;
    if (keys.indexOf(key) > -1) {
      keys.splice(keys.indexOf(key), 1);
      // delete key from MetaLogKeys in tornado, need to go through all commands in
      // appStructure.MENU, count the times the key is used; if the count is 0, delete
      // it, because the key has been deleted from every METALOG_DISPLAY.
      let count = 0;
      for (let i = 0; i < state.appStructure.MENU.length; i++) {
        if (
          state.appStructure.MENU[i].Command === 'METALOG_DISPLAY' &&
          state.appStructure.MENU[i].Parameters.MetaLogKeys.indexOf(key) > -1
        ) {
          count++;
        }
      }
      if (count === 0) {
        state.appStructure.MENU.forEach((arrayItem) => {
          if (arrayItem.Command === 'TORNADODIST') {
            if (arrayItem.Parameters.MetaLogKeys.indexOf(key) > -1) {
              arrayItem.Parameters.MetaLogKeys.splice(arrayItem.Parameters.MetaLogKeys.indexOf(key), 1);
            }
          }
        });
      }
    } else {
      keys.push(key);
      state.appStructure.MENU.forEach((arrayItem) => {
        if (arrayItem.Command === 'TORNADODIST') {
          if (arrayItem.Parameters.MetaLogKeys.indexOf(key) === -1) {
            arrayItem.Parameters.MetaLogKeys.push(key);
          }
        }
      });
    }
  }

  // ---- INPUT_SCREEN include/exclude ----

  function excludeInput(key) {
    const keys = state.selectedMenu.Parameters.InputKeys;
    keys.splice(keys.indexOf(key), 1);
    if (state.excludedInputs.indexOf(findKey(state.inputs)(key)) === -1) {
      state.excludedInputs.push(findKey(state.inputs)(key));
    }
  }

  function includeInput(input) {
    state.excludedInputs.splice(state.excludedInputs.indexOf(input), 1);
    state.selectedMenu.Parameters.InputKeys.push(input.Key);
  }

  function selectTableInput(key) {
    state.selectedMenu.Parameters.InputKey = key;
  }

  // ---- delete / add menu items ----

  function deleteAppStructure() {
    state.appStructure.MENU.splice(state.appStructure.MENU.indexOf(state.selectedMenu), 1);
    if (
      state.selectedMenu.Command === 'TORNADODIST' &&
      state.appStructure.MENU.find((menu) => menu.Command === 'TORNADODIST') === undefined
    ) {
      state.appStructure.PostProcessingOutputsForPortfolio = [];
      state.postProcessing = state.appStructure.PostProcessingOutputsForPortfolio;
      state.tornado = {};
    }
    // remove MetaLogKeys when we delete a Metalog in AppStructure
    if (state.selectedMenu.Command === 'METALOG_DISPLAY') {
      const toRemove = new Set(state.selectedMenu.Parameters.MetaLogKeys);
      for (const item of state.appStructure.MENU) {
        if (item.Command === 'METALOG_DISPLAY') {
          for (const key of item.Parameters.MetaLogKeys) toRemove.delete(key);
          if (toRemove.size === 0) break;
        }
      }
      if (toRemove.size > 0) {
        state.appStructure.MENU.forEach((arrayItem) => {
          if (arrayItem.Command === 'TORNADODIST') {
            arrayItem.Parameters.MetaLogKeys = arrayItem.Parameters.MetaLogKeys.filter((k) => !toRemove.has(k));
          }
        });
      }
    }
    if (!isUnchanged()) {
      save('Delete ' + state.selectedMenu.Display);
    }
    state.selectedMenu = state.appStructure.MENU[0];
    hideModal('deleteAppStructureModal');
    render();
  }

  function checkDisplay(display) {
    if (display === undefined || display === '') {
      addAlert(state.newAppStructureAlerts, 'danger', 'please type in the name of the new app structure!');
      return false;
    }
    return true;
  }

  function checkCommand(command) {
    if (command === undefined || command === '') {
      addAlert(state.newAppStructureAlerts, 'danger', 'please choose a command of the new app structure!');
      return false;
    }
    return true;
  }

  function checkUniqueTornado() {
    const tornado = state.appStructure.MENU.find((menu) => menu.Command === 'TORNADODIST');
    if (tornado !== undefined) {
      addAlert(state.newAppStructureAlerts, 'danger', 'You already have a tornado in app structure.');
      return false;
    }
    return true;
  }

  function addMetalogkeystoTornado() {
    state.appStructure.MENU.forEach((arrayItem) => {
      if (arrayItem.Command === 'TORNADODIST' && !arrayItem.Parameters.MetaLogKeys) {
        arrayItem.Parameters.MetaLogKeys = [];
      }
    });
  }

  function buildParams(command) {
    switch (command) {
      case 'INPUT_SCREEN':
        return { InputKeys: [] };
      case 'IMAGE':
        return { CellLink: '', OutputKey: '', Type: 'RANGE', FitToScreen: true };
      case 'TABLE':
        return { CellLink: '', OutputKey: '', Pnl: true };
      case 'TABLE_INPUT':
        return { InputKey: '' };
      case 'TORNADODIST':
        return {
          ChartTitle: '',
          CombinedUncertaintyLabel: '',
          Depth: 2,
          ValueMetricKeys: [],
          Weights: { High: 0.25, Med: 0.5, Low: 0.25 },
        };
      case 'ADD_TABLES':
        return {
          Key: state.tables[0].Parameters.OutputKey,
          NodeLookup: 'Outputs',
          PnL: false,
          PrecisionOptions: [0, 1, 2],
          DefaultPrecision: 2,
        };
      case 'COMPARE_VALUE':
        return { Keys: [], Units: [], Titles: [], NodeLookup: 'Outputs', min: 0, max: 0, Total: false };
      case 'METALOG_DISPLAY': {
        const param = { MetaLogKeys: [] };
        addMetalogkeystoTornado();
        return param;
      }
      case 'COMPARE_UNCERTAINTY':
        return { Keys: ['Key', 'Summary', 'Mean', 'Display', 'Units'], NodeLookup: 'TornadoDistOutputs' };
      case 'CFO_CHART':
        return { Sets: [{ AverageCost: '', xTitle: '', AverageValueMinusCost: '', yTitle: '', name: 'CFOChart1' }] };
      case 'INNOVATION_SCREEN':
        return { Sets: [{ x: '', xTitle: '', y: '', yTitle: '', VerticalCutoff: null, name: 'Innovation Screen1' }] };
      case 'SCATTER_PLOT':
        return { Sets: [{ x: '', y: '', xTitle: '', yTitle: '' }], SameScale: false, Min: null, Max: null };
      case 'BUCKET_CHART':
        return { Sets: [] };
      case 'WATERFALL':
        return { Sets: [{ CellLink: '', Units: '', OutputKey: '', name: '', yTitle: '' }] };
      default:
        return {};
    }
  }

  function makeNewAppStructureAndAddIt(display, command) {
    state.newAppStructureAlerts = [];
    if (!checkDisplay(display)) return;
    if (!checkCommand(command)) return;
    if (command === 'TORNADODIST' && !checkUniqueTornado()) return;
    const newAppStructure = {
      Command: command,
      Display: display,
      ID: makeActionIDFrom(display, state.appStructure.MENU),
      UsePostProcessingOutputs: false,
      Visible: true,
      Parameters: buildParams(command),
    };
    state.appStructure.MENU.push(newAppStructure);
    selectMenu(newAppStructure);
  }

  function addNewAppStructure(display, command) {
    makeNewAppStructureAndAddIt(display, command);
    hideModal('newAppStructureModal');
    render();
  }

  function openNew() {
    state.newAppStructureAlerts = [];
    const displayInput = container.querySelector('#new-display');
    const projectSelect = container.querySelector('#new-command-project');
    const platformSelect = container.querySelector('#new-command-platform');
    if (displayInput) displayInput.value = '';
    if (projectSelect) projectSelect.value = '';
    if (platformSelect) platformSelect.value = '';
  }

  // ---- COMPARE_VALUE ----

  function addCompareValueItem() {
    const p = state.selectedMenu.Parameters;
    const length = p.Keys.length;
    p.Keys[length] = '';
    p.Units[length] = '';
    p.Titles[length] = '';
  }

  function deleteCompareValueItem(index) {
    const p = state.selectedMenu.Parameters;
    p.Keys.splice(index, 1);
    p.Units.splice(index, 1);
    p.Titles.splice(index, 1);
  }

  // ---- METALOG_DISPLAY / FailureBranch ----

  function addFailurebranch() {
    const p = state.selectedMenu.Parameters;
    if (!p.FailureBranch) {
      p.FailureBranch = {
        Stages: [{ NodeLookup: 'Outputs', ProbabilityKey: '', SubtractionValueKey: '' }],
        SubtractCostGivenSuccess: true,
      };
    } else {
      p.FailureBranch.Stages.push({ NodeLookup: 'Outputs', ProbabilityKey: '', SubtractionValueKey: '' });
    }
  }

  function deleteFailurebranchStage(index) {
    const stages = state.selectedMenu.Parameters.FailureBranch.Stages;
    stages.splice(index, 1);
    if (stages.length === 0) {
      delete state.selectedMenu.Parameters.FailureBranch;
    }
  }

  // ---- CFO_CHART / INNOVATION_SCREEN / SCATTER_PLOT ----

  function addCFOChartItem() {
    const sets = state.selectedMenu.Parameters.Sets;
    sets.push({ AverageCost: '', xTitle: '', AverageValueMinusCost: '', yTitle: '', name: 'CFOChart' + (sets.length + 1).toString() });
  }
  function deleteCFOChartItem(index) {
    state.selectedMenu.Parameters.Sets.splice(index, 1);
  }

  function addInnovationScreenItem() {
    const sets = state.selectedMenu.Parameters.Sets;
    sets.push({ x: '', xTitle: '', y: '', yTitle: '', VerticalCutoff: null, name: 'Innovation Screen' + (sets.length + 1).toString() });
  }
  function deleteInnovationScreenItem(index) {
    state.selectedMenu.Parameters.Sets.splice(index, 1);
  }

  function addScatterPlotItem() {
    state.selectedMenu.Parameters.Sets.push({ x: '', y: '', xTitle: '', yTitle: '', name: '' });
  }
  function deleteScatterPlotItem(index) {
    state.selectedMenu.Parameters.Sets.splice(index, 1);
  }

  // ---- BUCKET_CHART ----

  function emptyBucketSet() {
    return {
      Title: '',
      xTitle: '',
      NodeLookup: 'Outputs',
      xBuckets: [],
      Addable: 'false',
      Key: '',
      bucketChartType: 'percentage',
      Counts: false,
      yTitle: 'Percentage',
      numOfBucket: null,
    };
  }

  function addBucketChartSet() {
    state.selectedMenu.Parameters.Sets.push(emptyBucketSet());
  }

  function generateBuckets(setIndex) {
    const delta = (parseInt(state.bucketHigh, 10) - parseInt(state.bucketLow, 10)) / state.numBuckets;
    for (let i = 0; i < state.numBuckets; i++) {
      const lower = (parseInt(state.bucketLow, 10) + i * delta).toFixed(2);
      const upper = (parseInt(state.bucketLow, 10) + (i + 1) * delta).toFixed(2);
      state.selectedMenu.Parameters.Sets[setIndex].xBuckets.push({ GE: lower, LT: upper, Name: lower + '-' + upper });
    }
    state.bucketManagers[setIndex] = new BucketManager(state.selectedMenu.Parameters.Sets[setIndex].xBuckets);
    state.bucketLow = '';
    state.bucketHigh = '';
    state.numBuckets = null;
  }

  function toggleNameEdit(bucket, setIndex) {
    if (bucket.nameEditable === true) {
      state.selectedMenu.Parameters.Sets[setIndex].xBuckets = state.bucketManagers[setIndex].buckets();
    }
    bucket.nameEditable = !bucket.nameEditable;
  }

  function toggleRuleEdit(bucket, setIndex) {
    if (bucket.rulesEditable === true) {
      state.selectedMenu.Parameters.Sets[setIndex].xBuckets = state.bucketManagers[setIndex].buckets();
    }
    bucket.rulesEditable = !bucket.rulesEditable;
  }

  function addBucket(setIndex) {
    state.bucketManagers[setIndex].editableBuckets.push({
      nameEditable: false,
      rulesEditable: false,
      rule1Type: makeRule1Options()[0],
      rule2Type: makeRule2Options()[0],
      rule1Value: null,
      rule2Value: null,
      Name: '',
    });
    state.selectedMenu.Parameters.Sets[setIndex].xBuckets = state.bucketManagers[setIndex].buckets();
  }

  function deleteBucket(setIndex) {
    const editable = state.bucketManagers[setIndex].editableBuckets;
    if (editable.length > 0) editable.splice(editable.length - 1, 1);
    state.selectedMenu.Parameters.Sets[setIndex].xBuckets = state.bucketManagers[setIndex].buckets();
  }

  function deleteBucketSet(setIndex) {
    state.selectedMenu.Parameters.Sets.splice(setIndex, 1);
    state.bucketManagers.splice(setIndex, 1);
  }

  // ---- WATERFALL ----

  function insertParamsToWaterfallTables(table) {
    const index = state.waterfall.length - 1;
    state.waterfall[index].CellLink = table.CellLink;
    state.waterfall[index].OutputKey = table.CellLink.slice(table.CellLink.indexOf('!') + 1);
    state.selectedPotentialTable = table;
    state.selectedMenu.Parameters.CellLink = state.waterfall[0].CellLink;
    state.selectedMenu.Parameters.OutputKey = state.waterfall[0].OutputKey;
  }

  function addNewParamsToWaterfall() {
    state.selectedPotentialTable = undefined;
    state.waterfall.push({ CellLink: '', Units: '', OutputKey: '', name: '', yTitle: '' });
  }

  function deleteTableInWaterfall(index) {
    if (state.waterfall.length === 1) {
      state.selectedPotentialTable = undefined;
    } else if (state.waterfall.length === index + 1) {
      const cellLink = state.waterfall[index - 1].CellLink;
      state.selectedPotentialTable = (state.potentialTables || []).find((table) => table.CellLink === cellLink);
    }
    state.waterfall.splice(index, 1);
  }

  function changePrecisionOptions() {
    state.selectedMenu.Parameters.PrecisionOptions = [];
    for (let i = state.minPrecision; i <= state.maxPrecision; i++) {
      state.selectedMenu.Parameters.PrecisionOptions.push(i);
    }
    if (state.selectedMenu.Parameters.PrecisionOptions.indexOf(state.selectedMenu.Parameters.DefaultPrecision) === -1) {
      state.selectedMenu.Parameters.DefaultPrecision = state.selectedMenu.Parameters.PrecisionOptions[0];
    }
  }

  // continued in part 2 below (rendering)
  Object.assign(mount, {});

  return mountPart2({
    container,
    params,
    state,
    findKey,
    findCellLink,
    addAlert,
    isUnchanged,
    getKeyFrom,
    buildOutputFromKey,
    getOutputDisplayFromKey,
    getAppStructure,
    getPotentialTables,
    getCharts,
    selectMenu,
    selectTable,
    selectPotentialTable,
    selectImageTable,
    selectImageChart,
    renderSelectedImageChart,
    save,
    saveWithCommit,
    rename,
    selectSendBackTornado,
    selectSendBackTo,
    addSendBack,
    deleteSendBack,
    selectTornado,
    selectWithinMetalog,
    excludeInput,
    includeInput,
    selectTableInput,
    deleteAppStructure,
    addNewAppStructure,
    openNew,
    addCompareValueItem,
    deleteCompareValueItem,
    addFailurebranch,
    deleteFailurebranchStage,
    addCFOChartItem,
    deleteCFOChartItem,
    addInnovationScreenItem,
    deleteInnovationScreenItem,
    addScatterPlotItem,
    deleteScatterPlotItem,
    addBucketChartSet,
    generateBuckets,
    toggleNameEdit,
    toggleRuleEdit,
    addBucket,
    deleteBucket,
    deleteBucketSet,
    insertParamsToWaterfallTables,
    addNewParamsToWaterfall,
    deleteTableInWaterfall,
    changePrecisionOptions,
  });
}
