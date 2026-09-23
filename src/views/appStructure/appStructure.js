/* Ported from appStructureController.ts + views/appstructure.html. */
import Highcharts from 'highcharts';
import { huashan, isRequestAborted } from '../../api/huashanClient.js';
import { session, restoreSession } from '../../core/session.js';
import { SERVER_URL } from '../../core/config.js';
import { navigate, setNavigationGuard, clearNavigationGuard } from '../../core/router.js';
import { appNavHtml } from '../../components/appNav.js';
import { renderAlerts, wireAlertClose } from '../../components/alerts.js';
import { commitMessageModalHtml, initCommitMessageModal, closeCommitMessageModal } from '../../components/commitMessageModal.js';
import { loadingOverlayHtml } from '../../components/loadingOverlay.js';
import { handleLoadError, loadErrorHtml, loadErrorMessage, requireResponseResult } from '../../components/loadError.js';
import { showModal, hideModal, onModalShown, initTooltips } from '../../components/uiInteractions.js';
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

  let render = () => {};
  let disposed = false;

  const state = {
    selectedTemplate: params.templateID,
    isPlatform: !!params.isPlatform,
    isAdmin: getIsAdmin(),
    appStructure: null,
    loadError: '',
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
      const result = requireResponseResult(response, 'Loading the app structure');
      if (!Array.isArray(result.MENU)) throw new Error('The app structure response did not contain a MENU array.');
      state.appStructure = result;
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
    }).catch(handleInitialLoadError);
    // platform app structure needs information in product app structure
    huashan.getAppStructure(session.getCredentials(), params.templateID, false).then((response) => {
      const regularAppStructure = requireResponseResult(response, 'Loading the project app structure');
      if (!Array.isArray(regularAppStructure.MENU)) throw new Error('The project app structure response did not contain a MENU array.');
      state.tables = regularAppStructure.MENU.filter((menu) => menu.Command === 'TABLE');
      if (state.selectedMenu && state.selectedMenu.Command === 'ADD_TABLES') selectMenu(state.selectedMenu);
      render();
    }).catch(handleInitialLoadError);
  }

  function getPotentialTables() {
    huashan.getPotentialTables(session.getCredentials(), params.templateID).then((response) => {
      const result = requireResponseResult(response, 'Loading potential tables');
      if (!Array.isArray(result.PotentialTableOutputs)) throw new Error('Potential tables were missing from the response.');
      state.potentialTables = result.PotentialTableOutputs;
      if (state.selectedMenu && ['TABLE', 'ADD_TABLES', 'WATERFALL'].includes(state.selectedMenu.Command)) {
        selectMenu(state.selectedMenu);
      } else if (state.selectedMenu && state.selectedMenu.Command === 'IMAGE' && state.selectedMenu.Parameters.Type === 'RANGE') {
        selectMenu(state.selectedMenu);
      }
      render();
    }).catch(handleInitialLoadError);
  }

  function getCharts() {
    huashan.getCharts(session.getCredentials(), params.templateID).then((response) => {
      const result = requireResponseResult(response, 'Loading charts');
      if (!Array.isArray(result.Charts)) throw new Error('Charts were missing from the response.');
      state.charts = result.Charts;
      if (state.selectedMenu && state.selectedMenu.Command === 'IMAGE' && state.selectedMenu.Parameters.Type === 'CHART') {
        selectMenu(state.selectedMenu);
      }
      render();
    }).catch(handleInitialLoadError);
  }

  function getDataStructure() {
    huashan.getIncludedDataStructureComponents(session.getCredentials(), params.templateID, state.isPlatform).then((data) => {
      const result = requireResponseResult(data, 'Loading app structure inputs and outputs');
      if (!Array.isArray(result.Inputs) || !Array.isArray(result.Outputs)) {
        throw new Error('Inputs or outputs were missing from the data structure response.');
      }
      state.inputs = result.Inputs;
      getExcludedInputs();
      state.outputs = result.Outputs;
      state.allDataStructureComponents = state.inputs.concat(state.outputs);
      state.tableInputs = state.inputs.filter((input) => input.Type === 'TABLE');
      state.tornadoOutputs = state.outputs.filter((output) => output.UsePostProcessingOutputs === true);
      state.allOutputs = state.outputs.concat(state.tornadoOutputs);
      render();
    }).catch(handleInitialLoadError);
  }

  function handleInitialLoadError(error) {
    if (disposed) return;
    handleLoadError(error, state, render);
  }

  function loadAppStructure() {
    state.loadError = '';
    state.appStructure = null;
    state.appStructureCopy = null;
    state.selectedMenu = null;
    state.potentialTables = [];
    state.tables = [];
    state.charts = [];
    state.inputs = [];
    state.outputs = [];
    state.excludedInputs = [];
    render();
    getAppStructure();
    getPotentialTables();
    getCharts();
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
      if (menu.Parameters.Pnl === undefined && menu.Parameters.PnL !== undefined) {
        menu.Parameters.Pnl = menu.Parameters.PnL;
        delete menu.Parameters.PnL;
      }
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
      state.selectedPotentialTable = index >= 0
        ? (state.potentialTables || []).find((table) => table.CellLink === state.waterfall[index].CellLink)
        : undefined;
    }
    if (menu.Command === 'COMPARE_VALUE') {
      if (menu.Parameters.Min === undefined && menu.Parameters.min !== undefined) menu.Parameters.Min = menu.Parameters.min;
      if (menu.Parameters.Max === undefined && menu.Parameters.max !== undefined) menu.Parameters.Max = menu.Parameters.max;
      delete menu.Parameters.min;
      delete menu.Parameters.max;
    }
    if (menu.Command === 'METALOG_DISPLAY' && menu.Parameters.FailureBranch) {
      menu.Parameters.FailureBranch.Stages.forEach((stage) => {
        if (stage.ProbabilityFailureOfStageKey === undefined && stage.ProbabilityKey !== undefined) {
          stage.ProbabilityFailureOfStageKey = stage.ProbabilityKey;
          delete stage.ProbabilityKey;
        }
        if (stage.CumeCostOfStageKey === undefined && stage.SubtractionValueKey !== undefined) {
          stage.CumeCostOfStageKey = stage.SubtractionValueKey;
          delete stage.SubtractionValueKey;
        }
      });
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
      })
      .catch((error) => {
        if (disposed || isRequestAborted(error)) return;
        state.saveComplete = true;
        addAlert(state.saveAlerts, 'danger', loadErrorMessage(error, 'The app structure could not be saved.'));
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
          Key: state.tables[0] ? state.tables[0].Parameters.OutputKey : '',
          NodeLookup: 'Outputs',
          Pnl: false,
          PrecisionOptions: [0, 1, 2],
          DefaultPrecision: 2,
        };
      case 'COMPARE_VALUE':
        return { Keys: [], Units: [], Titles: [], NodeLookup: 'Outputs', Min: 0, Max: 0, Total: false };
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
        Stages: [{ NodeLookup: 'Outputs', ProbabilityFailureOfStageKey: '', CumeCostOfStageKey: '' }],
        SubtractCostGivenSuccess: true,
      };
    } else {
      p.FailureBranch.Stages.push({ NodeLookup: 'Outputs', ProbabilityFailureOfStageKey: '', CumeCostOfStageKey: '' });
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
    loadAppStructure,
    isDisposed() {
      return disposed;
    },
    dispose() {
      disposed = true;
    },
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
    destroyImageChart,
    setRender(nextRender) {
      render = nextRender;
    },
  });
}

function mountPart2({
  container,
  params,
  state,
  isUnchanged,
  getAppStructure,
  getPotentialTables,
  getCharts,
  loadAppStructure,
  isDisposed,
  dispose,
  selectMenu,
  findKey,
  findCellLink,
  getKeyFrom,
  buildOutputFromKey,
  getOutputDisplayFromKey,
  selectTable,
  selectPotentialTable,
  selectImageTable,
  selectImageChart,
  renderSelectedImageChart,
  saveWithCommit,
  rename,
  deleteAppStructure,
  addNewAppStructure,
  openNew,
  selectSendBackTornado,
  selectSendBackTo,
  addSendBack,
  deleteSendBack,
  selectTornado,
  selectWithinMetalog,
  excludeInput,
  includeInput,
  selectTableInput,
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
  destroyImageChart,
  setRender,
}) {
  const projectCommands = ['INPUT_SCREEN', 'TABLE', 'TABLE_INPUT', 'IMAGE', 'TORNADODIST', 'METALOG_DISPLAY', 'WATERFALL'];
  const platformCommands = [
    'INPUT_SCREEN', 'TABLE', 'TABLE_INPUT', 'IMAGE', 'TORNADODIST', 'METALOG_DISPLAY',
    'COMPARE_VALUE', 'COMPARE_UNCERTAINTY', 'CFO_CHART', 'INNOVATION_SCREEN',
    'ADD_TABLES', 'SCATTER_PLOT', 'BUCKET_CHART',
  ];

  function filteredMenus() {
    if (!state.appStructure || !Array.isArray(state.appStructure.MENU)) return [];
    const query = state.searchText.trim().toLowerCase();
    if (!query) return state.appStructure.MENU;
    return state.appStructure.MENU.filter((menu) => (menu.Display || '').toLowerCase().includes(query));
  }

  function menuListHtml() {
    return filteredMenus()
      .map((menu) => {
        const index = state.appStructure.MENU.indexOf(menu);
        const active = menu === state.selectedMenu ? ' active' : '';
        return `
          <a href="" class="list-group-item cursor-move${active}" data-menu-index="${index}">
            <table><tr>
              <td class="appStructList no-wrap">${escapeHtml(menu.Display || menu.ID || 'Untitled')}</td>
              <td class="appStructList" style="width:60px">
                ${active ? `<span data-toggle="modal" data-target="#deleteAppStructureModal" data-menu-delete class="inline-icon pull-right glyphicon glyphicon-trash" title="Delete"></span>
                <span data-toggle="modal" data-target="#editAppStructureModal" data-menu-edit class="inline-icon pull-right glyphicon glyphicon-pencil" title="Rename"></span>` : ''}
              </td>
            </tr></table>
          </a>`;
      })
      .join('');
  }

  function optionHtml(items, selected, value = (item) => item.Key, label = (item) => item.Display || item.Key) {
    return (items || []).map((item) => {
      const itemValue = value(item);
      return `<option value="${escapeAttr(itemValue)}" ${itemValue === selected ? 'selected' : ''}>${escapeHtml(label(item) || itemValue)}</option>`;
    }).join('');
  }

  function commandHeaderHtml(menu, extras = '') {
    return `<div class="row">
      <div class="col-sm-6"><h4>${escapeHtml(menu.Command)}</h4></div>
      <div class="col-sm-3"><h4><label><input type="checkbox" data-field="Visible" ${menu.Visible !== false ? 'checked' : ''}> Visible</label></h4></div>
      <div class="col-sm-3"><h4><label><input type="checkbox" data-field="UsePostProcessingOutputs" ${menu.UsePostProcessingOutputs ? 'checked' : ''}> Use Post Processing</label></h4></div>
      ${extras}
    </div>`;
  }

  function previewHtml(table) {
    if (!table) return '<p class="text-center">Select an item to preview it.</p>';
    if (table.HtmlPreview) return `<div style="width:100%; overflow:auto">${extractTablePreviewHtml(table.HtmlPreview)}</div>`;
    if (table.PreviewURL) return `<img src="${escapeAttr(SERVER_URL + table.PreviewURL)}" alt="${escapeAttr(table.CellLink || '')}" width="100%">`;
    return '<p class="text-center">No preview is available.</p>';
  }

  function tableInputFormHtml(menu) {
    const selected = findKey(state.tableInputs)(menu.Parameters.InputKey);
    return `${commandHeaderHtml(menu)}
      <div class="col-sm-3 no-padding"><div class="list-of-templates"><div class="list-group">
        ${state.tableInputs.map((input) => `<a href="" class="list-group-item ${input.Key === menu.Parameters.InputKey ? 'active' : ''}" data-table-input="${escapeAttr(input.Key)}">${escapeHtml(input.Display)}</a>`).join('')}
      </div></div></div>
      <div class="col-sm-9">
        <div class="row"><div class="col-sm-2 text-right"><h4>Cell Link</h4></div><div class="col-sm-10"><h5>${escapeHtml(selected && selected.CellLink)}</h5></div></div>
        <div class="row"><div class="col-sm-2 text-right"><h4>Description</h4></div><div class="col-sm-10"><h5>${escapeHtml(selected && selected.Description)}</h5></div></div>
        ${previewHtml(selected && findCellLink(selected.CellLink))}
      </div>`;
  }

  function inputScreenFormHtml(menu) {
    return `${commandHeaderHtml(menu)}
      <div class="col-sm-6"><h4>Included Inputs</h4></div><div class="col-sm-6"><h4>Excluded Inputs</h4></div>
      <div class="col-sm-6" style="height:420px;overflow:auto"><ul class="list-group">
        ${(menu.Parameters.InputKeys || []).map((key) => `<li class="list-group-item"><div class="no-wrap"><a class="text-danger"><i class="fa fa-minus-square fa-lg" data-exclude-input="${escapeAttr(key)}"></i></a> ${escapeHtml((findKey(state.inputs)(key) || {}).Display || key)}</div></li>`).join('')}
      </ul></div>
      <div class="col-sm-6" style="height:420px;overflow:auto"><ul class="list-group">
        ${state.excludedInputs.filter(Boolean).map((input) => `<li class="list-group-item"><div class="no-wrap"><a class="text-success"><i class="fa fa-plus-square fa-lg" data-include-input="${escapeAttr(input.Key)}"></i></a> ${escapeHtml(input.Display)}</div></li>`).join('')}
      </ul></div>`;
  }

  function tableFormHtml(menu) {
    return `${commandHeaderHtml(menu)}
      <div class="row table-padding"><div class="col-sm-2 text-right"><b>OutputKey</b></div><div class="col-sm-3"><input class="form-control" data-field="Parameters.OutputKey" value="${escapeAttr(menu.Parameters.OutputKey || '')}"></div><div class="col-sm-2"><label><input type="checkbox" data-field="Parameters.Pnl" ${menu.Parameters.Pnl ? 'checked' : ''}> Pnl</label></div></div>
      <div class="col-sm-3"><div class="list-of-templates"><div class="list-group">${state.potentialTables.map((table, i) => `<a href="" class="list-group-item ${table === state.selectedPotentialTable ? 'active' : ''}" data-potential-table="${i}">${escapeHtml(table.CellLink)}</a>`).join('')}</div></div></div>
      <div class="col-sm-9">${previewHtml(state.selectedPotentialTable)}</div>`;
  }

  function imageFormHtml(menu) {
    const isChart = menu.Parameters.Type === 'CHART';
    return `${commandHeaderHtml(menu)}
      <div class="row table-padding"><div class="col-sm-3"><label><input type="radio" name="image-type" data-image-type="RANGE" ${!isChart ? 'checked' : ''}> RANGE</label> &nbsp; <label><input type="radio" name="image-type" data-image-type="CHART" ${isChart ? 'checked' : ''}> CHART</label></div><div class="col-sm-3"><label><input type="checkbox" data-field="Parameters.FitToScreen" ${menu.Parameters.FitToScreen ? 'checked' : ''}> Fit To Screen</label></div></div>
      <div class="col-sm-3"><div class="list-of-templates"><div class="list-group">
        ${isChart ? state.charts.map((chart, i) => `<a href="" class="list-group-item ${chart === state.selectedImageChart ? 'active' : ''}" data-image-chart="${i}">${escapeHtml(chart.ChartName)}</a>`).join('') : state.potentialTables.map((table, i) => `<a href="" class="list-group-item ${table === state.selectedImageTable ? 'active' : ''}" data-image-table="${i}">${escapeHtml(table.CellLink)}</a>`).join('')}
      </div></div></div>
      <div class="col-sm-9" style="height:500px;overflow:auto">${isChart ? '<div id="appstructure-image-chart" style="width:100%;height:480px"></div>' : previewHtml(state.selectedImageTable)}</div>`;
  }

  function addTablesFormHtml(menu) {
    const precision = menu.Parameters.PrecisionOptions || [];
    return `${commandHeaderHtml(menu)}
      <div class="col-sm-4"><div class="list-group">${state.tables.map((table, i) => `<a href="" class="list-group-item ${table === state.selectedTable ? 'active' : ''}" data-add-table="${i}">${escapeHtml(table.Display)}</a>`).join('')}</div></div>
      <div class="col-sm-8">${previewHtml(state.selectedPotentialTable)}</div>
      <div class="col-sm-12"><div class="row table-padding"><div class="col-sm-2"><b>PNL</b></div><div class="col-sm-3"><input type="checkbox" data-field="Parameters.Pnl" ${menu.Parameters.Pnl ?? menu.Parameters.PnL ? 'checked' : ''}></div></div>
      <div class="row table-padding"><div class="col-sm-2"><b>Min Precision</b></div><div class="col-sm-2"><input type="number" min="0" class="form-control" id="as-min-precision" value="${state.minPrecision ?? ''}"></div><div class="col-sm-2"><b>Max Precision</b></div><div class="col-sm-2"><input type="number" min="0" class="form-control" id="as-max-precision" value="${state.maxPrecision ?? ''}"></div><div class="col-sm-2"><b>Default</b></div><div class="col-sm-2"><select class="form-control" data-field="Parameters.DefaultPrecision" data-number>${precision.map((p) => `<option value="${p}" ${p === menu.Parameters.DefaultPrecision ? 'selected' : ''}>${p}</option>`).join('')}</select></div></div>
      <div class="row table-padding"><div class="col-sm-2"><b>Special Rules</b></div><div class="col-sm-3"><select class="form-control"><option>None</option><option>Ignore</option><option>IRR</option><option>MVSto Range</option><option>Year</option><option>Tooltip</option></select></div></div></div>`;
  }

  function compareValueFormHtml(menu) {
    const p = menu.Parameters;
    return `${commandHeaderHtml(menu)}
      <div class="row table-padding"><div class="col-sm-2"><b>Total</b></div><div class="col-sm-3"><input type="checkbox" data-field="Parameters.Total" ${p.Total ? 'checked' : ''}></div></div>
      <div class="row table-padding"><div class="col-sm-2"><b>Min</b></div><div class="col-sm-3"><input type="number" class="form-control" data-field="Parameters.Min" value="${p.Min ?? ''}"></div><div class="col-sm-2"><b>Max</b></div><div class="col-sm-3"><input type="number" class="form-control" data-field="Parameters.Max" value="${p.Max ?? ''}"></div></div>
      <div class="row table-padding"><div class="col-sm-3"><b>Key</b></div><div class="col-sm-3"><b>Unit</b></div><div class="col-sm-3"><b>Title</b></div></div>
      ${(p.Keys || []).map((key, i) => `<div class="row table-padding"><div class="col-sm-3"><select class="form-control" data-array-field="Keys:${i}">${optionHtml(state.outputs, key)}</select></div><div class="col-sm-3"><input class="form-control" data-array-field="Units:${i}" value="${escapeAttr(p.Units[i] || '')}"></div><div class="col-sm-3"><input class="form-control" data-array-field="Titles:${i}" value="${escapeAttr(p.Titles[i] || '')}"></div><div class="col-sm-1"><button class="btn btn-danger" data-cv-delete="${i}"><span class="glyphicon glyphicon-trash"></span></button></div></div>`).join('')}
      <button class="btn btn-success" id="as-cv-add"><span class="glyphicon glyphicon-plus"></span></button>`;
  }

  function tornadoFormHtml(menu) {
    const p = menu.Parameters;
    const includedKeys = p.ValueMetricKeys || (p.ValueMetricKeys = []);
    const excludedOutputs = state.outputs.filter((output) => !includedKeys.includes(output.Key));
    const weights = p.Weights || (p.Weights = { High: 0.25, Med: 0.5, Low: 0.25 });
    return `${commandHeaderHtml(menu)}
      <ul class="nav nav-tabs"><li class="${state.tornadoTab === 'output' ? 'active' : ''}"><a href="" data-tornado-tab="output">Tornado Output</a></li><li class="${state.tornadoTab === 'settings' ? 'active' : ''}"><a href="" data-tornado-tab="settings">Parameters</a></li><li class="${state.tornadoTab === 'post' ? 'active' : ''}"><a href="" data-tornado-tab="post">Post Processing</a></li></ul>
      ${state.tornadoTab === 'output' ? `<div class="tornado-output-picker">
        <div class="col-sm-6"><h4>Included Outputs</h4></div>
        <div class="col-sm-6"><h4>Excluded Outputs</h4></div>
        <div class="col-sm-6" style="height:420px;overflow:auto">
          <div class="list-of-templates"><ul class="list-group">
            ${includedKeys.map((key) => {
              const output = findKey(state.outputs)(key);
              return `<li class="list-group-item"><div class="no-wrap"><a class="text-danger" href="" data-tornado-key="${escapeAttr(key)}" title="Exclude output"><i class="fa fa-minus-square fa-lg"></i></a> ${escapeHtml(output ? output.Display : key)}</div></li>`;
            }).join('')}
          </ul></div>
        </div>
        <div class="col-sm-6" style="height:420px;overflow:auto">
          <div class="list-of-templates"><ul class="list-group">
            ${excludedOutputs.map((output) => `<li class="list-group-item"><div class="no-wrap"><a class="text-success" href="" data-tornado-key="${escapeAttr(output.Key)}" title="Include output"><i class="fa fa-plus-square fa-lg"></i></a> ${escapeHtml(output.Display)}</div></li>`).join('')}
          </ul></div>
        </div>
      </div>` : ''}
      ${state.tornadoTab === 'settings' ? `<div class="container-fluid"><div class="row table-padding"><div class="col-sm-3 text-right"><b>Chart Title</b></div><div class="col-sm-6"><input class="form-control" data-field="Parameters.ChartTitle" value="${escapeAttr(p.ChartTitle || '')}"></div></div><div class="row table-padding"><div class="col-sm-3 text-right"><b>Combined Uncertainty Label</b></div><div class="col-sm-6"><input class="form-control" data-field="Parameters.CombinedUncertaintyLabel" value="${escapeAttr(p.CombinedUncertaintyLabel || '')}"></div></div><div class="row table-padding"><div class="col-sm-3 text-right"><b>Depth</b></div><div class="col-sm-3"><input type="number" class="form-control" data-field="Parameters.Depth" value="${p.Depth ?? 2}"></div></div>${['High','Med','Low'].map((key) => `<div class="row table-padding"><div class="col-sm-3 text-right"><b>${key === 'Med' ? 'Medium' : key}</b></div><div class="col-sm-3"><input type="number" min="0" max="1" step="0.01" class="form-control" data-field="Parameters.Weights.${key}" value="${weights[key]}"></div></div>`).join('')}</div>` : ''}
      ${state.tornadoTab === 'post' ? `<div class="container-fluid">${state.postProcessing.map((sendback, i) => `<div class="row table-padding"><div class="col-sm-1"><button class="btn btn-danger" data-sendback-delete="${i}"><span class="glyphicon glyphicon-trash"></span></button></div><div class="col-sm-2"><select class="form-control" data-sendback-to="${i}">${state.sendBackElements.map((x) => `<option value="${escapeAttr(x.value)}" ${sendback.Reference && sendback.Reference.slice(22) === x.value ? 'selected' : ''}>${escapeHtml(x.display)}</option>`).join('')}</select></div><div class="col-sm-3"><select class="form-control" data-sendback-tornado="${i}">${(p.ValueMetricKeys || []).map((key, ki) => `<option value="${ki}" ${sendback.Reference && Number(sendback.Reference[19]) === ki ? 'selected' : ''}>${escapeHtml((findKey(state.outputs)(key) || {}).Display || key)}</option>`).join('')}</select></div><div class="col-sm-4"><select class="form-control" data-sendback-field="${i}">${optionHtml(state.allDataStructureComponents, sendback.SendBack, (x) => x.CellLink, (x) => x.Display)}</select></div></div>`).join('')}<button class="btn btn-success" id="as-sendback-add"><span class="glyphicon glyphicon-plus"></span></button></div>` : ''}`;
  }

  function metalogFormHtml(menu) {
    const p = menu.Parameters;
    const included = p.MetaLogKeys || (p.MetaLogKeys = []);
    const available = state.tornadoValueMetricKeys.filter((key) => !included.includes(key));
    const failure = p.FailureBranch;
    return `${commandHeaderHtml(menu)}
      <ul class="nav nav-tabs"><li class="${state.metalogTab === 'metalogKeys' ? 'active' : ''}"><a href="" data-metalog-tab="metalogKeys">MetalogKeys</a></li><li class="${state.metalogTab === 'explanation' ? 'active' : ''}"><a href="" data-metalog-tab="explanation">Explanation</a></li><li class="${state.metalogTab === 'failure' ? 'active' : ''}"><a href="" data-metalog-tab="failure">FailureBranch</a></li><li class="${state.metalogTab === 'simulation' ? 'active' : ''}"><a href="" data-metalog-tab="simulation">Simulation</a></li></ul>
      ${state.metalogTab === 'metalogKeys' ? `<div><div class="col-sm-6"><h4>Included MetalogKeys</h4></div><div class="col-sm-6"><h4>Excluded MetalogKeys</h4></div><div class="col-sm-6" style="height:420px;overflow:auto"><ul class="list-group">${included.map((key) => `<li class="list-group-item"><a class="text-danger"><i class="fa fa-minus-square fa-lg" data-metalog-key="${escapeAttr(key)}"></i></a> ${escapeHtml((findKey(state.outputs)(key) || {}).Display || key)}</li>`).join('')}</ul></div><div class="col-sm-6" style="height:420px;overflow:auto"><ul class="list-group">${available.map((key) => `<li class="list-group-item"><a class="text-success"><i class="fa fa-plus-square fa-lg" data-metalog-key="${escapeAttr(key)}"></i></a> ${escapeHtml((findKey(state.outputs)(key) || {}).Display || key)}</li>`).join('')}</ul></div></div>` : ''}
      ${state.metalogTab === 'explanation' ? `<div class="container-fluid"><div class="row table-padding"><div class="col-sm-8"><p>The text entered here will be used to explain the metalog in the system.</p><textarea rows="10" class="form-control" data-field="Parameters.FittedPointExplanation">${escapeHtml(p.FittedPointExplanation || '')}</textarea></div></div></div>` : ''}
      ${state.metalogTab === 'failure' ? `<div class="container-fluid">${failure ? failure.Stages.map((stage, i) => `<div class="row table-padding"><div class="col-sm-2"><b>Probability of Failure of Stage Key</b></div><div class="col-sm-3"><select class="form-control" data-failure-field="ProbabilityFailureOfStageKey:${i}">${optionHtml(state.outputs, stage.ProbabilityFailureOfStageKey, (x) => x.Key, (x) => x.Key)}</select></div><div class="col-sm-2"><b>Cumulative Cost of Stage Key</b></div><div class="col-sm-3"><select class="form-control" data-failure-field="CumeCostOfStageKey:${i}">${optionHtml(state.outputs, stage.CumeCostOfStageKey, (x) => x.Key, (x) => x.Key)}</select></div><div class="col-sm-1"><button class="btn btn-danger" data-failure-delete="${i}"><span class="glyphicon glyphicon-trash"></span></button></div></div>`).join('') : ''}<button class="btn btn-success" id="as-failure-add"><span class="glyphicon glyphicon-plus"></span></button></div>` : ''}
      ${state.metalogTab === 'simulation' ? `<div class="container-fluid"><div class="row table-padding"><div class="col-sm-8"><label><input type="checkbox" data-field="Parameters.CalcMVSFromFittedPoints" ${p.CalcMVSFromFittedPoints ? 'checked' : ''}> <b>Calculate Mean, Variance and Skewness from Fitted Points</b></label></div></div></div>` : ''}`;
  }

  function seriesFormHtml(menu, kind) {
    const sets = menu.Parameters.Sets || [];
    const definitions = {
      CFO_CHART: { x: 'AverageCost', y: 'AverageValueMinusCost', add: 'as-cfo-add', del: 'data-cfo-delete' },
      INNOVATION_SCREEN: { x: 'x', y: 'y', add: 'as-innovation-add', del: 'data-innovation-delete' },
      SCATTER_PLOT: { x: 'x', y: 'y', add: 'as-scatter-add', del: 'data-scatter-delete' },
    };
    const def = definitions[kind];
    return `${commandHeaderHtml(menu)}
      ${kind === 'SCATTER_PLOT' ? `<div class="row table-padding"><div class="col-sm-2"><b>Use Same Scale</b></div><div class="col-sm-2"><input type="checkbox" data-field="Parameters.SameScale" ${menu.Parameters.SameScale ? 'checked' : ''}></div><div class="col-sm-1"><b>Min</b></div><div class="col-sm-2"><input type="number" class="form-control" data-field="Parameters.Min" value="${menu.Parameters.Min ?? ''}"></div><div class="col-sm-1"><b>Max</b></div><div class="col-sm-2"><input type="number" class="form-control" data-field="Parameters.Max" value="${menu.Parameters.Max ?? ''}"></div></div>` : ''}
      ${sets.map((set, i) => `<div class="well"><div class="row table-padding"><div class="col-sm-2"><b>${kind === 'SCATTER_PLOT' ? `Series ${i + 1}` : 'Name'}</b></div><div class="col-sm-3"><input class="form-control" data-set-field="name:${i}" value="${escapeAttr(set.name || '')}"></div></div><div class="row table-padding"><div class="col-sm-2"><b>X Axis</b></div><div class="col-sm-3"><select class="form-control" data-set-field="${def.x}:${i}">${optionHtml(state.allOutputs, getKeyFrom(set[def.x]), (x) => x.Key, (x) => getOutputDisplayFromKey(x.Key))}</select></div><div class="col-sm-2"><b>X Title</b></div><div class="col-sm-3"><input class="form-control" data-set-field="xTitle:${i}" value="${escapeAttr(set.xTitle || '')}"></div></div><div class="row table-padding"><div class="col-sm-2"><b>Y Axis</b></div><div class="col-sm-3"><select class="form-control" data-set-field="${def.y}:${i}">${optionHtml(state.allOutputs, getKeyFrom(set[def.y]), (x) => x.Key, (x) => getOutputDisplayFromKey(x.Key))}</select></div><div class="col-sm-2"><b>Y Title</b></div><div class="col-sm-3"><input class="form-control" data-set-field="yTitle:${i}" value="${escapeAttr(set.yTitle || '')}"></div><div class="col-sm-1"><button class="btn btn-danger" ${def.del}="${i}"><span class="glyphicon glyphicon-trash"></span></button></div></div>${kind === 'INNOVATION_SCREEN' ? `<div class="row table-padding"><div class="col-sm-2"><b>Vertical Cut-off</b></div><div class="col-sm-3"><input type="number" class="form-control" data-set-field="VerticalCutoff:${i}" value="${set.VerticalCutoff ?? ''}"></div></div>` : ''}</div>`).join('')}
      <button class="btn btn-success" id="${def.add}"><span class="glyphicon glyphicon-plus"></span></button>`;
  }

  function bucketChartFormHtml(menu) {
    const sets = menu.Parameters.Sets || [];
    return `${commandHeaderHtml(menu)}${sets.map((set, si) => {
      const manager = state.bucketManagers[si];
      return `<div class="well"><div class="row table-padding"><div class="col-sm-2"><b>Title</b></div><div class="col-sm-3"><input class="form-control" data-bucket-field="Title:${si}" value="${escapeAttr(set.Title || '')}"></div><div class="col-sm-2"><b>Counts</b></div><div class="col-sm-2"><input type="checkbox" data-bucket-field="Counts:${si}" ${set.Counts ? 'checked' : ''}></div></div><div class="row table-padding"><div class="col-sm-2"><b>X Axis</b></div><div class="col-sm-3"><select class="form-control" data-bucket-field="Key:${si}">${optionHtml(state.allOutputs, set.Key, (x) => x.Key, (x) => getOutputDisplayFromKey(x.Key))}</select></div><div class="col-sm-2"><b>X Label</b></div><div class="col-sm-3"><input class="form-control" data-bucket-field="xTitle:${si}" value="${escapeAttr(set.xTitle || '')}"></div></div><div class="row table-padding"><div class="col-sm-2"><b>Y Label</b></div><div class="col-sm-3"><input class="form-control" data-bucket-field="yTitle:${si}" value="${escapeAttr(set.yTitle || '')}"></div></div>
      ${manager ? `<div class="row table-padding"><div class="col-sm-12"><b>Buckets:</b> ${manager.editableBuckets.map((b) => escapeHtml(b.Name)).join(', ')} <button class="btn btn-default btn-sm" data-bucket-edit="${si}">Edit</button></div></div>${manager.editing ? `<table class="table table-bordered table-striped"><thead><tr><th>Bucket Label</th><th>Lower Rule</th><th>Lower Value</th><th>Upper Rule</th><th>Upper Value</th></tr></thead><tbody>${manager.editableBuckets.map((b, bi) => `<tr><td><input class="form-control input-sm" data-bucket-name="${si}:${bi}" value="${escapeAttr(b.Name)}"></td><td><select class="form-control input-sm" data-bucket-rule1="${si}:${bi}">${makeRule1Options().map((x) => `<option value="${x.Value}" ${x.Value === b.rule1Type.Value ? 'selected' : ''}>${escapeHtml(x.Label)}</option>`).join('')}</select></td><td><input class="form-control input-sm" data-bucket-rule1-value="${si}:${bi}" value="${b.rule1Value ?? ''}"></td><td><select class="form-control input-sm" data-bucket-rule2="${si}:${bi}">${makeRule2Options().map((x) => `<option value="${x.Value}" ${x.Value === b.rule2Type.Value ? 'selected' : ''}>${escapeHtml(x.Label)}</option>`).join('')}</select></td><td><input class="form-control input-sm" data-bucket-rule2-value="${si}:${bi}" value="${b.rule2Value ?? ''}"></td></tr>`).join('')}</tbody></table><button class="btn btn-primary" data-bucket-add="${si}">Add Bucket</button> <button class="btn btn-primary" data-bucket-remove="${si}">Delete Bucket</button>` : ''}` : `<div class="row table-padding"><div class="col-sm-2">Buckets<input type="number" class="form-control" id="as-bucket-count-${si}"></div><div class="col-sm-2">Low<input class="form-control" id="as-bucket-low-${si}"></div><div class="col-sm-2">High<input class="form-control" id="as-bucket-high-${si}"></div><div class="col-sm-2"><br><button class="btn btn-primary" data-bucket-generate="${si}">Generate Buckets</button></div></div>`}<div class="row table-padding"><button class="btn btn-danger" data-bucket-set-delete="${si}"><span class="glyphicon glyphicon-trash"></span></button></div></div>`;
    }).join('')}<button class="btn btn-success" id="as-bucket-set-add"><span class="glyphicon glyphicon-plus"></span></button>`;
  }

  function waterfallFormHtml(menu) {
    const sets = menu.Parameters.Sets || [];
    return `${commandHeaderHtml(menu)}<div class="col-sm-3"><div class="list-group">${state.potentialTables.map((table, i) => `<a href="" class="list-group-item ${table === state.selectedPotentialTable ? 'active' : ''}" data-waterfall-table="${i}">${escapeHtml(table.CellLink)}</a>`).join('')}</div></div><div class="col-sm-9">${previewHtml(state.selectedPotentialTable)}</div><div class="col-sm-12">${sets.map((set, i) => `<div class="well"><div class="row table-padding"><div class="col-sm-2"><b>OutputKey</b></div><div class="col-sm-3"><input class="form-control" data-waterfall-field="OutputKey:${i}" value="${escapeAttr(set.OutputKey || '')}"></div><div class="col-sm-2"><b>Units</b></div><div class="col-sm-3"><input class="form-control" data-waterfall-field="Units:${i}" value="${escapeAttr(set.Units || '')}"></div></div><div class="row table-padding"><div class="col-sm-2"><b>Name</b></div><div class="col-sm-3"><input class="form-control" data-waterfall-field="name:${i}" value="${escapeAttr(set.name || '')}"></div><div class="col-sm-2"><b>Y Title</b></div><div class="col-sm-3"><input class="form-control" data-waterfall-field="yTitle:${i}" value="${escapeAttr(set.yTitle || '')}"></div><div class="col-sm-1"><button class="btn btn-danger" data-waterfall-delete="${i}"><span class="glyphicon glyphicon-trash"></span></button></div></div></div>`).join('')}<button class="btn btn-success" id="as-waterfall-add"><span class="glyphicon glyphicon-plus"></span></button></div>`;
  }

  function editorHtml() {
    if (!state.selectedMenu) {
      return '<div class="panel panel-default panel-body">No app structure items are available.</div>';
    }
    const menu = state.selectedMenu;
    switch (menu.Command) {
      case 'TABLE_INPUT': return tableInputFormHtml(menu);
      case 'INPUT_SCREEN': return inputScreenFormHtml(menu);
      case 'TABLE': return tableFormHtml(menu);
      case 'IMAGE': return imageFormHtml(menu);
      case 'ADD_TABLES': return addTablesFormHtml(menu);
      case 'COMPARE_VALUE': return compareValueFormHtml(menu);
      case 'TORNADODIST': return tornadoFormHtml(menu);
      case 'METALOG_DISPLAY': return metalogFormHtml(menu);
      case 'COMPARE_UNCERTAINTY': return `${commandHeaderHtml(menu)}<h4>There's nothing to customize in this menu item</h4>`;
      case 'CFO_CHART': return seriesFormHtml(menu, 'CFO_CHART');
      case 'INNOVATION_SCREEN': return seriesFormHtml(menu, 'INNOVATION_SCREEN');
      case 'SCATTER_PLOT': return seriesFormHtml(menu, 'SCATTER_PLOT');
      case 'BUCKET_CHART': return bucketChartFormHtml(menu);
      case 'WATERFALL': return waterfallFormHtml(menu);
      default: return `${commandHeaderHtml(menu)}<p>This command has no configurable fields.</p>`;
    }
  }

  function modalsHtml() {
    const selectedName = state.selectedMenu ? state.selectedMenu.Display || '' : '';
    return `
      <div class="modal fade" id="deleteAppStructureModal" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog"><div class="modal-content">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
            <h4 class="modal-title">Delete Menu Item</h4>
          </div>
          <div class="modal-body"><h4>Are you sure you want to delete <b>${escapeHtml(selectedName)}</b>?</h4></div>
          <div class="modal-footer">
            <button class="btn btn-primary" id="as-delete-confirm">Delete</button>
            <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
          </div>
        </div></div>
      </div>

      <div class="modal fade" id="editAppStructureModal" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog"><div class="modal-content">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
            <h4 class="modal-title">Rename Menu Item</h4>
          </div>
          <div class="modal-body">
            <label for="as-rename-input">New name</label>
            <input id="as-rename-input" class="form-control" value="${escapeAttr(selectedName)}">
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" id="as-rename-confirm">Rename</button>
            <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
          </div>
        </div></div>
      </div>

      <div class="modal fade" id="newAppStructureModal" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog"><div class="modal-content">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
            <h4 class="modal-title">New Menu Item</h4>
          </div>
          <div class="modal-body">
            <div class="row table-padding">
              <div class="col-sm-3 text-right"><label for="new-display">Name</label></div>
              <div class="col-sm-8"><input id="new-display" class="form-control"></div>
            </div>
            <div class="row table-padding">
              <div class="col-sm-3 text-right"><label for="new-command-project">Command</label></div>
              <div class="col-sm-8">
                <select id="new-command-project" class="form-control" ${state.isPlatform ? 'hidden' : ''}>
                  <option value=""></option>
                  ${projectCommands.map((command) => `<option value="${command}">${command}</option>`).join('')}
                </select>
                <select id="new-command-platform" class="form-control" ${state.isPlatform ? '' : 'hidden'}>
                  <option value=""></option>
                  ${platformCommands.map((command) => `<option value="${command}">${command}</option>`).join('')}
                </select>
              </div>
            </div>
            <div id="as-new-alerts">${renderAlerts(state.newAppStructureAlerts)}</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" id="as-new-confirm">Add</button>
            <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
          </div>
        </div></div>
      </div>`;
  }

  function bindEditor() {
    if (!state.selectedMenu) return;
    const menu = state.selectedMenu;
    const bindAll = (selector, eventName, handler) => container.querySelectorAll(selector).forEach((el) => el.addEventListener(eventName, handler));
    const inputValue = (el) => el.type === 'checkbox' ? el.checked : el.type === 'number' || el.dataset.number !== undefined ? (el.value === '' ? null : Number(el.value)) : el.value;
    const setPath = (root, path, value) => {
      const parts = path.split('.');
      let target = root;
      for (let i = 0; i < parts.length - 1; i++) target = target[parts[i]];
      target[parts[parts.length - 1]] = value;
    };

    bindAll('[data-field]', 'change', (event) => setPath(menu, event.currentTarget.dataset.field, inputValue(event.currentTarget)));
    bindAll('input[data-field], textarea[data-field]', 'input', (event) => setPath(menu, event.currentTarget.dataset.field, inputValue(event.currentTarget)));
    bindAll('[data-array-field]', 'change', (event) => {
      const [field, index] = event.currentTarget.dataset.arrayField.split(':');
      menu.Parameters[field][Number(index)] = event.currentTarget.value;
      if (field === 'Keys') {
        const output = findKey(state.outputs)(event.currentTarget.value);
        if (output) {
          menu.Parameters.Units[Number(index)] = output.Units || '';
          menu.Parameters.Titles[Number(index)] = output.Display || '';
          render();
        }
      }
    });
    bindAll('input[data-array-field]', 'input', (event) => {
      const [field, index] = event.currentTarget.dataset.arrayField.split(':');
      menu.Parameters[field][Number(index)] = event.currentTarget.value;
    });

    bindAll('[data-table-input]', 'click', (event) => { event.preventDefault(); selectTableInput(event.currentTarget.dataset.tableInput); render(); });
    bindAll('[data-exclude-input]', 'click', (event) => { excludeInput(event.currentTarget.dataset.excludeInput); render(); });
    bindAll('[data-include-input]', 'click', (event) => { const input = findKey(state.inputs)(event.currentTarget.dataset.includeInput); if (input) includeInput(input); render(); });
    bindAll('[data-potential-table]', 'click', (event) => { event.preventDefault(); selectPotentialTable(state.potentialTables[Number(event.currentTarget.dataset.potentialTable)]); render(); });
    bindAll('[data-image-table]', 'click', (event) => { event.preventDefault(); selectImageTable(state.potentialTables[Number(event.currentTarget.dataset.imageTable)]); render(); });
    bindAll('[data-image-chart]', 'click', (event) => { event.preventDefault(); selectImageChart(state.charts[Number(event.currentTarget.dataset.imageChart)]); render(); });
    bindAll('[data-image-type]', 'change', (event) => { menu.Parameters.Type = event.currentTarget.dataset.imageType; selectMenu(menu); render(); });
    bindAll('[data-add-table]', 'click', (event) => { event.preventDefault(); selectTable(state.tables[Number(event.currentTarget.dataset.addTable)]); render(); });
    const minPrecision = container.querySelector('#as-min-precision');
    const maxPrecision = container.querySelector('#as-max-precision');
    const updatePrecision = () => { state.minPrecision = minPrecision.value === '' ? null : Number(minPrecision.value); state.maxPrecision = maxPrecision.value === '' ? null : Number(maxPrecision.value); if (state.minPrecision !== null && state.maxPrecision !== null) changePrecisionOptions(); render(); };
    if (minPrecision && maxPrecision) { minPrecision.addEventListener('change', updatePrecision); maxPrecision.addEventListener('change', updatePrecision); }

    const cvAdd = container.querySelector('#as-cv-add');
    if (cvAdd) cvAdd.addEventListener('click', () => { addCompareValueItem(); render(); });
    bindAll('[data-cv-delete]', 'click', (event) => { deleteCompareValueItem(Number(event.currentTarget.dataset.cvDelete)); render(); });
    bindAll('[data-tornado-tab]', 'click', (event) => { event.preventDefault(); state.tornadoTab = event.currentTarget.dataset.tornadoTab; render(); });
    bindAll('[data-tornado-key]', 'click', (event) => { event.preventDefault(); selectTornado(event.currentTarget.dataset.tornadoKey); render(); });
    const sendbackAdd = container.querySelector('#as-sendback-add');
    if (sendbackAdd) sendbackAdd.addEventListener('click', () => { addSendBack(); render(); });
    bindAll('[data-sendback-delete]', 'click', (event) => { deleteSendBack(state.postProcessing[Number(event.currentTarget.dataset.sendbackDelete)]); render(); });
    bindAll('[data-sendback-to]', 'change', (event) => { const i = Number(event.currentTarget.dataset.sendbackTo); selectSendBackTo(state.postProcessing[i], event.currentTarget.value); render(); });
    bindAll('[data-sendback-tornado]', 'change', (event) => { const i = Number(event.currentTarget.dataset.sendbackTornado); selectSendBackTornado(state.postProcessing[i], Number(event.currentTarget.value)); render(); });
    bindAll('[data-sendback-field]', 'change', (event) => { state.postProcessing[Number(event.currentTarget.dataset.sendbackField)].SendBack = event.currentTarget.value; });

    bindAll('[data-metalog-tab]', 'click', (event) => { event.preventDefault(); state.metalogTab = event.currentTarget.dataset.metalogTab; render(); });
    bindAll('[data-metalog-key]', 'click', (event) => { selectWithinMetalog(event.currentTarget.dataset.metalogKey); render(); });
    const failureAdd = container.querySelector('#as-failure-add');
    if (failureAdd) failureAdd.addEventListener('click', () => { addFailurebranch(); render(); });
    bindAll('[data-failure-delete]', 'click', (event) => { deleteFailurebranchStage(Number(event.currentTarget.dataset.failureDelete)); render(); });
    bindAll('[data-failure-field]', 'change', (event) => { const [field, index] = event.currentTarget.dataset.failureField.split(':'); menu.Parameters.FailureBranch.Stages[Number(index)][field] = event.currentTarget.value; });

    bindAll('[data-set-field]', 'change', (event) => { const [field, indexText] = event.currentTarget.dataset.setField.split(':'); const index = Number(indexText); const isAxis = ['x','y','AverageCost','AverageValueMinusCost'].includes(field); menu.Parameters.Sets[index][field] = isAxis ? buildOutputFromKey(event.currentTarget.value) : inputValue(event.currentTarget); if (isAxis) { menu.Parameters.Sets[index][field === 'x' || field === 'AverageCost' ? 'xTitle' : 'yTitle'] = getOutputDisplayFromKey(event.currentTarget.value) || ''; render(); } });
    bindAll('input[data-set-field]', 'input', (event) => { const [field, index] = event.currentTarget.dataset.setField.split(':'); menu.Parameters.Sets[Number(index)][field] = inputValue(event.currentTarget); });
    const setActions = [
      ['#as-cfo-add', addCFOChartItem], ['#as-innovation-add', addInnovationScreenItem], ['#as-scatter-add', addScatterPlotItem],
    ];
    setActions.forEach(([selector, action]) => { const el = container.querySelector(selector); if (el) el.addEventListener('click', () => { action(); render(); }); });
    bindAll('[data-cfo-delete]', 'click', (event) => { deleteCFOChartItem(Number(event.currentTarget.dataset.cfoDelete)); render(); });
    bindAll('[data-innovation-delete]', 'click', (event) => { deleteInnovationScreenItem(Number(event.currentTarget.dataset.innovationDelete)); render(); });
    bindAll('[data-scatter-delete]', 'click', (event) => { deleteScatterPlotItem(Number(event.currentTarget.dataset.scatterDelete)); render(); });

    bindAll('[data-bucket-field]', 'change', (event) => { const [field, index] = event.currentTarget.dataset.bucketField.split(':'); menu.Parameters.Sets[Number(index)][field] = inputValue(event.currentTarget); });
    bindAll('[data-bucket-edit]', 'click', (event) => { const manager = state.bucketManagers[Number(event.currentTarget.dataset.bucketEdit)]; manager.editing = !manager.editing; render(); });
    bindAll('[data-bucket-generate]', 'click', (event) => { const i = Number(event.currentTarget.dataset.bucketGenerate); state.numBuckets = Number(container.querySelector(`#as-bucket-count-${i}`).value); state.bucketLow = container.querySelector(`#as-bucket-low-${i}`).value; state.bucketHigh = container.querySelector(`#as-bucket-high-${i}`).value; generateBuckets(i); state.bucketManagers[i].editing = true; render(); });
    bindAll('[data-bucket-add]', 'click', (event) => { addBucket(Number(event.currentTarget.dataset.bucketAdd)); render(); });
    bindAll('[data-bucket-remove]', 'click', (event) => { deleteBucket(Number(event.currentTarget.dataset.bucketRemove)); render(); });
    bindAll('[data-bucket-set-delete]', 'click', (event) => { deleteBucketSet(Number(event.currentTarget.dataset.bucketSetDelete)); render(); });
    const bucketSetAdd = container.querySelector('#as-bucket-set-add');
    if (bucketSetAdd) bucketSetAdd.addEventListener('click', () => { addBucketChartSet(); selectMenu(menu); render(); });
    const updateBucket = (datasetName, property, options) => bindAll(`[data-${datasetName}]`, 'change', (event) => { const [si, bi] = event.currentTarget.dataset[datasetName.replace(/-([a-z])/g, (_, c) => c.toUpperCase())].split(':').map(Number); const bucket = state.bucketManagers[si].editableBuckets[bi]; bucket[property] = options ? options().find((x) => x.Value === event.currentTarget.value) : event.currentTarget.value; menu.Parameters.Sets[si].xBuckets = state.bucketManagers[si].buckets(); });
    updateBucket('bucket-name', 'Name'); updateBucket('bucket-rule1', 'rule1Type', makeRule1Options); updateBucket('bucket-rule1-value', 'rule1Value'); updateBucket('bucket-rule2', 'rule2Type', makeRule2Options); updateBucket('bucket-rule2-value', 'rule2Value');

    bindAll('[data-waterfall-table]', 'click', (event) => { event.preventDefault(); insertParamsToWaterfallTables(state.potentialTables[Number(event.currentTarget.dataset.waterfallTable)]); render(); });
    bindAll('[data-waterfall-field]', 'input', (event) => { const [field, index] = event.currentTarget.dataset.waterfallField.split(':'); menu.Parameters.Sets[Number(index)][field] = event.currentTarget.value; });
    bindAll('[data-waterfall-delete]', 'click', (event) => { deleteTableInWaterfall(Number(event.currentTarget.dataset.waterfallDelete)); render(); });
    const waterfallAdd = container.querySelector('#as-waterfall-add');
    if (waterfallAdd) waterfallAdd.addEventListener('click', () => { addNewParamsToWaterfall(); render(); });

    if (menu.Command === 'IMAGE' && menu.Parameters.Type === 'CHART') renderSelectedImageChart();
  }

  function render() {
    if (isDisposed()) return;
    if (state.loadError) {
      container.innerHTML = `
        ${appNavHtml({ active: 'appStructure', isAdmin: state.isAdmin, selectedTemplate: state.selectedTemplate })}
        ${loadErrorHtml({ title: 'App structure could not be loaded.', message: state.loadError, retryId: 'as-load-retry' })}`;
      container.querySelector('#as-load-retry').addEventListener('click', loadAppStructure);
      return;
    }
    if (!state.appStructure) {
      container.innerHTML = `
        ${appNavHtml({ active: 'appStructure', isAdmin: state.isAdmin, selectedTemplate: state.selectedTemplate })}
        ${loadingOverlayHtml('Loading app structure')}`;
      return;
    }

    const selectedName = state.selectedMenu ? state.selectedMenu.Display || '' : '';
    container.innerHTML = `
      ${appNavHtml({ active: 'appStructure', isAdmin: state.isAdmin, selectedTemplate: state.selectedTemplate })}
      <div class="select-template fadeIn" style="height:calc(100% - 100px)">
        <div class="choose-from" style="text-align:left; overflow:hidden; height:100%">
          <div class="select-template-title"><h4>${state.isPlatform ? 'Platform App Structure' : 'App Structure'}</h4></div>
          <div class="select-template-title">
            <input type="text" class="form-control" id="as-search" placeholder="Search" value="${escapeAttr(state.searchText)}">
          </div>
          <div class="panel panel-primary" style="height:calc(100% - 260px); margin-bottom:10px">
            <div class="list-of-templates" style="height:100%">
              <div class="list-group" id="app-structure-menu">${menuListHtml()}</div>
            </div>
          </div>
          <button class="btn btn-success" id="as-new-btn" data-toggle="modal" data-target="#newAppStructureModal" title="New">
            <span class="glyphicon glyphicon-plus"></span>
          </button>
        </div>

        <div id="selected-template" style="height:100%">
          <div class="select-template-title">
            <div class="col-sm-12"><h4 id="as-selected-title">${escapeHtml(selectedName)}</h4></div>
          </div>
          <div class="selected-inputs" style="overflow:auto; background:#eee; padding:15px">${editorHtml()}</div>
        </div>

        <div class="col-sm-12 text-center align-to-bottom">
          <a href="#/datastructure/${encodeURIComponent(state.selectedTemplate)}" class="btn btn-primary pull-left">
            <span class="glyphicon glyphicon-chevron-left"></span> Previous: Data Structure
          </a>
          <a href="#/portfoliostructure/${encodeURIComponent(state.selectedTemplate)}" class="btn btn-primary pull-right">
            Next: Portfolio Structure <span class="glyphicon glyphicon-chevron-right"></span>
          </a>
          <button class="btn btn-danger" id="as-save-btn" style="width:60px" data-toggle="modal" data-target="#commitMessageModal" ${isUnchanged() || !state.saveComplete ? 'disabled' : ''}>
            ${state.saveComplete ? 'save' : '<i class="fa fa-spinner fa-spin fa-lg"></i>'}
          </button>
          <div class="col-sm-12 save-alert" id="as-save-alerts">${renderAlerts(state.saveAlerts, { prefix: 'Saving failed.' })}</div>
        </div>
        ${modalsHtml()}
      </div>
      ${commitMessageModalHtml()}`;

    container.querySelector('#as-search').addEventListener('input', (event) => {
      state.searchText = event.target.value;
      render();
      const search = container.querySelector('#as-search');
      search.focus();
      search.setSelectionRange(search.value.length, search.value.length);
    });
    container.querySelectorAll('[data-menu-index]').forEach((item) => {
      item.addEventListener('click', (event) => {
        if (event.target.closest('[data-menu-delete], [data-menu-edit]')) return;
        event.preventDefault();
        selectMenu(state.appStructure.MENU[Number(item.dataset.menuIndex)]);
        render();
      });
    });

    const list = container.querySelector('#app-structure-menu');
    if (list && !state.searchText && state.appStructure) {
      makeSortable(list, {
        itemSelector: ':scope > [data-menu-index]',
        onReorder(elements) {
          state.appStructure.MENU = elements.map((element) => state.appStructure.MENU[Number(element.dataset.menuIndex)]);
          render();
        },
      });
    }

    container.querySelector('#as-new-btn').addEventListener('click', openNew);
    container.querySelector('#as-new-confirm').addEventListener('click', () => {
      const display = container.querySelector('#new-display').value || undefined;
      const commandSelector = state.isPlatform ? '#new-command-platform' : '#new-command-project';
      const command = container.querySelector(commandSelector).value || undefined;
      addNewAppStructure(display, command);
    });
    container.querySelector('#as-delete-confirm').addEventListener('click', deleteAppStructure);
    container.querySelector('#as-rename-input').addEventListener('input', (event) => {
      if (state.selectedMenu) state.selectedMenu.Display = event.target.value;
    });
    container.querySelector('#as-rename-confirm').addEventListener('click', rename);

    bindEditor();
    wireAlertClose(container.querySelector('#as-save-alerts'), state.saveAlerts, render);
    wireAlertClose(container.querySelector('#as-new-alerts'), state.newAppStructureAlerts, render);
    initCommitMessageModal(container, saveWithCommit);
    initTooltips(container);
  }

  setRender(render);
  loadAppStructure();

  setNavigationGuard((nextPath) => {
    if (isUnchanged()) return true;
    const confirmed = confirm(`You have unsaved changes in app structure, continue navigating to ${nextPath} ?`);
    if (!confirmed) return false;
    state.appStructure = structuredClone(state.appStructureCopy);
    return true;
  });

  return () => {
    dispose();
    destroyImageChart();
    clearNavigationGuard();
  };
}
