/* Ported from portfolioStructureController.ts + views/portfolioStructure.html. */
import { huashan, isRequestAborted } from '../../api/huashanClient.js';
import { session, restoreSession } from '../../core/session.js';
import { SERVER_URL } from '../../core/config.js';
import { setNavigationGuard, clearNavigationGuard } from '../../core/router.js';
import { appNavHtml } from '../../components/appNav.js';
import { renderAlerts, wireAlertClose } from '../../components/alerts.js';
import { commitMessageModalHtml, initCommitMessageModal, closeCommitMessageModal } from '../../components/commitMessageModal.js';
import { loadingOverlayHtml } from '../../components/loadingOverlay.js';
import { handleLoadError, loadErrorHtml, loadErrorMessage, requireResponseResult } from '../../components/loadError.js';
import { onModalShown, hideModal } from '../../components/uiInteractions.js';
import { makeSortable } from '../../components/sortable.js';
import { escapeHtml } from '../../core/html.js';
import { makeActionIDFrom } from '../../core/common.js';
import {
  bindCfoChartEditor,
  bindAddTablesEditor,
  bindBucketChartEditor,
  bindCompareValueEditor,
  bindInnovationScreenEditor,
  bindPortfolioUncertaintyEditor,
  bindScatterPlotEditor,
  renderAddTablesEditor,
  renderBucketChartEditor,
  renderCfoChartEditor,
  renderCompareUncertaintyEditor,
  renderCompareValueEditor,
  renderInnovationScreenEditor,
  renderPortfolioUncertaintyEditor,
  renderScatterPlotEditor,
} from './commandEditors.js';

function escapeAttr(str) {
  return escapeHtml(str);
}

function numOrEmpty(v) {
  return v === null || v === undefined ? '' : v;
}

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

// ---- BucketManager, ported from the `BucketManager`/`EditableBucket`/`RuleOption`
// classes at the bottom of portfolioStructureController.ts. ----

const RULE1_OPTIONS = [
  { Label: '', Value: 'NONE' },
  { Label: '>', Value: 'GT' },
  { Label: '>=', Value: 'GE' },
];
const RULE2_OPTIONS = [
  { Label: '', Value: 'NONE' },
  { Label: '<', Value: 'LT' },
  { Label: '<=', Value: 'LE' },
];

// Truthy checks (not `!== undefined`), matching the legacy `bucket.GT ? ... : bucket.GE ? ...`
// quirk: a boundary value of 0 is treated the same as "not set".
function rule1From(bucket) {
  return bucket.GT ? RULE1_OPTIONS[1] : bucket.GE ? RULE1_OPTIONS[2] : RULE1_OPTIONS[0];
}
function rule2From(bucket) {
  return bucket.LT ? RULE2_OPTIONS[1] : bucket.LE ? RULE2_OPTIONS[2] : RULE2_OPTIONS[0];
}

function editableBucketsFrom(buckets) {
  return buckets.map((bucket) => {
    const rule1Type = rule1From(bucket);
    const rule2Type = rule2From(bucket);
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

function createBucketManager(buckets) {
  return {
    rule1Options: RULE1_OPTIONS,
    rule2Options: RULE2_OPTIONS,
    editableBuckets: editableBucketsFrom(buckets),
    editing: false,
  };
}

/** Port of `BucketManager.buckets()`: rebuilds the raw GE/LT-style bucket
 * array from a manager's editable rows. */
function bucketsFromManager(manager) {
  return manager.editableBuckets.map((bucket) => {
    const packet = { Name: bucket.Name };
    switch (bucket.rule1Type.Value) {
      case 'GT':
        packet.GT = bucket.rule1Value;
        break;
      case 'GE':
        packet.GE = bucket.rule1Value;
        break;
    }
    switch (bucket.rule2Type.Value) {
      case 'LT':
        packet.LT = bucket.rule2Value;
        break;
      case 'LE':
        packet.LE = bucket.rule2Value;
        break;
    }
    return packet;
  });
}

export function mount(container, params) {
  if (!restoreSession()) return () => {};
  let disposed = false;

  const state = {
    selectedTemplate: params.templateID,
    isPlatform: !!params.isPlatform,
    isAdmin: getIsAdmin(),
    portfolioStructure: null,
    portfolioStructureCopy: null,
    selectedMenu: null,
    saveComplete: true,
    tables: [],
    selectedTable: null,
    appStructure: null,
    potentialTables: [],
    selectedPotentialTable: null,
    server: SERVER_URL,
    minPrecision: null,
    maxPrecision: null,
    saveAlerts: [],
    inputs: [],
    outputs: [],
    tornadoOutputs: [],
    allOutputs: [],
    newPortfolioStructureAlerts: [],
    bucketManagers: [],
    numBuckets: '',
    bucketLow: '',
    bucketHigh: '',
    numBucketsClone: 0,
    searchText: '',
    loadError: '',
  };

  let sortableHandle = null;

  // ---- data loading (constructor + getX methods) ----

  function getPortfolioStructure() {
    huashan
      .getPortfolioStructure(session.getCredentials(), params.templateID, state.isPlatform)
      .then((response) => {
        const result = requireResponseResult(response, 'Loading the portfolio structure');
        if (!Array.isArray(result.MENU)) throw new Error('The portfolio structure response did not contain a MENU array.');
        state.portfolioStructure = result;
        state.portfolioStructureCopy = structuredClone(state.portfolioStructure);
        state.selectedMenu = state.portfolioStructure.MENU[0] || null;
        selectMenu(state.selectedMenu);
        state.numBucketsClone = 0;
        // This is the first full render; incremental refreshes are safe after it.
        render();
      })
      .catch(handleInitialLoadError);
  }

  function getAppStructure() {
    huashan.getAppStructure(session.getCredentials(), params.templateID, state.isPlatform).then((response) => {
      state.appStructure = requireResponseResult(response, 'Loading the app structure for portfolio configuration');
      if (!Array.isArray(state.appStructure.MENU)) throw new Error('The app structure response did not contain a MENU array.');
      state.tornadoOutputs = state.appStructure.PostProcessingOutputsForPortfolio || [];
      getDataStructure(); // Ensure GetAppStructure already returned before getting data structure
      const tables = (state.appStructure.MENU || []).filter((menu) => menu.Command === 'TABLE');
      state.tables = state.tables.concat(tables);
      onDataChanged();
    }).catch(handleInitialLoadError);
    // when isPlatform, still need data from the regular (non-platform) app structure
    if (state.isPlatform === true) {
      huashan.getAppStructure(session.getCredentials(), params.templateID, false).then((response) => {
        const regularAppStructure = requireResponseResult(response, 'Loading the project app structure');
        if (!Array.isArray(regularAppStructure.MENU)) throw new Error('The project app structure response did not contain a MENU array.');
        const tables = (regularAppStructure.MENU || []).filter((menu) => menu.Command === 'TABLE');
        state.tables = state.tables.concat(tables);
        onDataChanged();
      }).catch(handleInitialLoadError);
    }
  }

  function getPotentialTables() {
    huashan.getPotentialTables(session.getCredentials(), params.templateID).then((response) => {
      const result = requireResponseResult(response, 'Loading potential tables');
      if (!Array.isArray(result.PotentialTableOutputs)) throw new Error('Potential tables were missing from the response.');
      state.potentialTables = result.PotentialTableOutputs;
      onDataChanged();
    }).catch(handleInitialLoadError);
  }

  function getDataStructure() {
    huashan.getIncludedDataStructureComponents(session.getCredentials(), params.templateID, state.isPlatform).then((data) => {
      const result = requireResponseResult(data, 'Loading portfolio inputs and outputs');
      if (!Array.isArray(result.Inputs) || !Array.isArray(result.Outputs)) {
        throw new Error('Inputs or outputs were missing from the data structure response.');
      }
      state.inputs = result.Inputs;
      state.outputs = result.Outputs;
      state.allOutputs = state.outputs.concat(state.tornadoOutputs);
      onDataChanged();
    }).catch(handleInitialLoadError);
  }

  function handleInitialLoadError(error) {
    if (disposed) return;
    handleLoadError(error, state, render);
  }

  function loadPortfolioStructure() {
    state.loadError = '';
    state.portfolioStructure = null;
    state.portfolioStructureCopy = null;
    state.selectedMenu = null;
    state.appStructure = null;
    state.tables = [];
    state.potentialTables = [];
    state.inputs = [];
    state.outputs = [];
    state.allOutputs = [];
    render();
    getPortfolioStructure();
    getPotentialTables();
    getAppStructure();
  }

  /** Called after each async load resolves: refreshes just the bits of the
   * page that could depend on newly-arrived data, without disturbing
   * whatever the user might be doing elsewhere (e.g. typing in the search box). */
  function onDataChanged() {
    renderMenuList();
    renderActionForm();
    renderDeleteModalBody();
    renderEditModalValue();
    refreshSaveButton();
  }

  // ---- selection ----

  function selectMenu(menu) {
    state.selectedMenu = menu;
    if (!menu) return;
    if (state.selectedMenu.Command === 'ADD_TABLES') {
      state.selectedTable = state.tables.find(
        (table) => table.Parameters.OutputKey === state.selectedMenu.Parameters.Key
      );
      state.selectedPotentialTable = state.potentialTables.find(
        (table) => state.selectedTable && table.CellLink === state.selectedTable.Parameters.CellLink
      );
      const opts = state.selectedMenu.Parameters.PrecisionOptions;
      state.minPrecision = opts === undefined || opts.length === 0 ? null : opts[0];
      state.maxPrecision = opts === undefined || opts.length === 0 ? null : opts[opts.length - 1];
    }
    if (state.selectedMenu.Command === 'BUCKET_CHART') {
      state.bucketLow = '';
      state.bucketHigh = '';
      state.numBuckets = '';
      const sets = state.selectedMenu.Parameters.Sets;
      state.bucketManagers = sets.map((set) => createBucketManager(set.xBuckets));
    }
    if (state.selectedMenu.Command === 'PORTFOLIO_UNCERTAINTY') {
      // check if every key in RollupKeys is in MetalogKeys by source; if not remove it
      const source = state.selectedMenu.Parameters.Source;
      let metalogKeysBySource = [];
      // Defensive: legacy reads `this.appStructure.MENU` unconditionally here, which can
      // race ahead of GetAppStructure's response if this is the first menu item selected
      // on load; guarded here so it doesn't throw.
      (state.appStructure ? state.appStructure.MENU : []).forEach((item) => {
        if (item.Command === 'METALOG_DISPLAY' && item.ID === source) {
          metalogKeysBySource = item.Parameters.MetaLogKeys;
        }
      });
      if (state.selectedMenu.Parameters.RollupKeys.length > 0) {
        state.selectedMenu.Parameters.RollupKeys.forEach((item) => {
          if (metalogKeysBySource.indexOf(item) === -1) {
            state.selectedMenu.Parameters.RollupKeys = remove(state.selectedMenu.Parameters.RollupKeys, item);
          }
        });
      }
    }
  }

  function onSelectMenu(menu) {
    selectMenu(menu);
    renderMenuList();
    renderActionForm();
    renderDeleteModalBody();
    renderEditModalValue();
    refreshSaveButton();
  }

  function selectTable(table) {
    state.selectedTable = table;
    state.selectedMenu.Parameters.Key = table.Parameters.OutputKey;
    state.selectedPotentialTable = state.potentialTables.find(
      (t) => t.CellLink === state.selectedTable.Parameters.CellLink
    );
  }

  // ---- save ----

  function saveWithCommit(commitMessage = 'Save Changes!') {
    save(commitMessage);
    closeCommitMessageModal();
  }

  function save(message) {
    checkID();
    checkCFOChartInnovationScreen();
    state.saveAlerts = [];
    if (!checkScatterPlotName()) {
      renderSaveAlerts();
      return;
    }
    if (!checkBucketChartNum()) {
      renderSaveAlerts();
      return;
    }
    checkMinAndMax();
    state.saveComplete = false;
    refreshSaveButton();
    huashan
      .savePortfolioStructure(session.getCredentials(), params.templateID, { data: state.portfolioStructure, commitMessage: message }, state.isPlatform)
      .then((response) => {
        state.saveComplete = true;
        if (response.status) {
          state.portfolioStructureCopy = structuredClone(state.portfolioStructure);
        } else {
          addAlert(state.saveAlerts, 'danger', response.msg);
        }
        renderSaveAlerts();
        refreshSaveButton();
      })
      .catch((error) => {
        if (disposed || isRequestAborted(error)) return;
        state.saveComplete = true;
        addAlert(state.saveAlerts, 'danger', loadErrorMessage(error, 'The portfolio structure could not be saved.'));
        renderSaveAlerts();
        refreshSaveButton();
      });
  }

  function checkMinAndMax() {
    state.portfolioStructure.MENU.forEach((menu) => {
      if (menu.Parameters.Min === null) delete menu.Parameters.Min;
      if (menu.Parameters.Max === null) delete menu.Parameters.Max;
      if (menu.Parameters.PrecisionOptions !== undefined && menu.Parameters.PrecisionOptions.length === 0) {
        delete menu.Parameters.DefaultPrecision;
      }
    });
  }

  function checkScatterPlotName() {
    let result = true;
    for (let i = 0; i < state.portfolioStructure.MENU.length; i++) {
      const menu = state.portfolioStructure.MENU[i];
      if (menu.Command === 'SCATTER_PLOT' && menu.Parameters.Sets.length > 1) {
        for (let j = 0; j < menu.Parameters.Sets.length; j++) {
          if (menu.Parameters.Sets[j].name === '' || menu.Parameters.Sets[j].name === undefined) {
            addAlert(state.saveAlerts, 'danger', 'SCATTER_PLOT must have names!');
            result = false;
            break;
          }
        }
      }
      if (result === false) break;
    }
    return result;
  }

  function checkBucketChartNum() {
    let result = true;
    for (let i = 0; i < state.portfolioStructure.MENU.length; i++) {
      const menu = state.portfolioStructure.MENU[i];
      if (menu.Command === 'BUCKET_CHART' && menu.Parameters.Sets.length > 1) {
        for (let j = 0; j < menu.Parameters.Sets.length; j++) {
          if (
            menu.Parameters.Sets[j].xBuckets.length === 0 ||
            state.numBucketsClone === undefined ||
            state.numBucketsClone === null
          ) {
            addAlert(state.saveAlerts, 'danger', 'Buckets can not be empty!');
            result = false;
            break;
          }
        }
      }
      if (result === false) break;
    }
    return result;
  }

  function checkID() {
    if (state.portfolioStructure.ID === undefined) {
      state.portfolioStructure.ID = params.templateID;
    }
  }

  function changePrecisionOptions() {
    state.selectedMenu.Parameters.PrecisionOptions = [];
    if (state.minPrecision === null || state.maxPrecision === null || state.minPrecision > state.maxPrecision) {
      return;
    }
    for (let i = state.minPrecision; i <= state.maxPrecision; i++) {
      state.selectedMenu.Parameters.PrecisionOptions.push(i);
    }
  }

  // ---- output/key lookup helpers ----

  function getKeyFrom(axis) {
    if (axis === '' || axis === undefined) return '';
    const startIndex = axis.indexOf("'");
    const result = axis.slice(startIndex + 1);
    const endIndex = result.indexOf("'");
    return result.slice(0, endIndex);
  }

  function getOutputUnitFromKey(key) {
    const output = (state.outputs || []).find((o) => o.Key === key);
    return output !== undefined ? output.Units : '';
  }

  function getOutputDisplayFromKey(key) {
    const output = (state.outputs || []).find((o) => o.Key === key);
    if (output !== undefined) return output.Display;
    const tornadoOutput = (state.tornadoOutputs || []).find((o) => o.Key === key);
    // Defensive: legacy does `output.Title` unguarded here and would throw if not
    // found in either list; guarded so a stale/unknown key doesn't crash the page.
    return tornadoOutput ? tornadoOutput.Title : '';
  }

  function getSourceFromAppStruMetalog() {
    const a = [];
    (state.appStructure ? state.appStructure.MENU : []).forEach((item) => {
      if (item.Command === 'METALOG_DISPLAY') a.push(item.ID);
    });
    return a;
  }

  function getPortfolioUncKeyFromMetalogBySource() {
    let key = [];
    const source = state.selectedMenu.Parameters.Source;
    (state.appStructure ? state.appStructure.MENU : []).forEach((item) => {
      if (item.Command === 'METALOG_DISPLAY' && item.ID === source) {
        key = item.Parameters.MetaLogKeys;
      }
    });
    return key;
  }

  function addToRollupKeys(key) {
    state.selectedMenu.Parameters.RollupKeys.push(key);
  }

  function removeFromIncludedKeys(key) {
    state.selectedMenu.Parameters.RollupKeys.forEach((item) => {
      if (item === key) {
        state.selectedMenu.Parameters.RollupKeys = remove(state.selectedMenu.Parameters.RollupKeys, key);
      }
    });
  }

  function remove(array, element) {
    return array.filter((e) => e !== element);
  }

  function findKey(arr) {
    return function (key) {
      return arr.find((element) => element.Key === key);
    };
  }

  function buildOutputFromKey(key) {
    return "Outputs['" + key + "']";
  }

  function outputOptionsHtml(selectedKey) {
    return (
      `<option value=""></option>` +
      (state.allOutputs || [])
        .map(
          (output) =>
            `<option value="${escapeAttr(output.Key)}" ${output.Key === selectedKey ? 'selected' : ''}>${escapeHtml(getOutputDisplayFromKey(output.Key))}</option>`
        )
        .join('')
    );
  }

  // ---- add/delete item helpers (Compare Value / CFO Chart / Innovation Screen / Scatter Plot) ----

  function addCompareValueItem() {
    const length = state.selectedMenu.Parameters.Keys.length;
    state.selectedMenu.Parameters.Keys[length] = '';
    state.selectedMenu.Parameters.Units[length] = '';
    state.selectedMenu.Parameters.Titles[length] = '';
    renderActionForm();
  }

  function deleteCompareValueItem(index) {
    state.selectedMenu.Parameters.Keys.splice(index, 1);
    state.selectedMenu.Parameters.Units.splice(index, 1);
    state.selectedMenu.Parameters.Titles.splice(index, 1);
    renderActionForm();
  }

  function addCFOChartItem() {
    state.selectedMenu.Parameters.Sets.push({
      AverageCost: '',
      xTitle: '',
      AverageValueMinusCost: '',
      yTitle: '',
      name: 'CFOChart' + (state.selectedMenu.Parameters.Sets.length + 1),
    });
    renderActionForm();
  }

  function deleteCFOChartItem(index) {
    state.selectedMenu.Parameters.Sets.splice(index, 1);
    renderActionForm();
  }

  function checkCFOChartInnovationScreen() {
    if (state.selectedMenu.Command === 'INNOVATION_SCREEN' || state.selectedMenu.Command === 'CFO_CHART') {
      for (let i = state.selectedMenu.Parameters.Sets.length - 1; i >= 0; i--) {
        if (state.selectedMenu.Parameters.Sets[i].xTitle === '' || state.selectedMenu.Parameters.Sets[i].yTitle === '') {
          state.selectedMenu.Parameters.Sets.splice(i, 1);
        }
      }
    }
  }

  function addInnovationScreenItem() {
    state.selectedMenu.Parameters.Sets.push({
      x: '',
      xTitle: '',
      y: '',
      yTitle: '',
      VerticalCutoff: null,
      name: 'Innovation Screen' + (state.selectedMenu.Parameters.Sets.length + 1),
    });
    renderActionForm();
  }

  function deleteInnovationScreenItem(index) {
    state.selectedMenu.Parameters.Sets.splice(index, 1);
    renderActionForm();
  }

  function addScatterPlotItem() {
    state.selectedMenu.Parameters.Sets.push({ x: '', y: '', xTitle: '', yTitle: '', name: '' });
    renderActionForm();
  }

  function deleteScatterPlotItem(index) {
    state.selectedMenu.Parameters.Sets.splice(index, 1);
    renderActionForm();
  }

  // ---- Bucket Chart ----

  function generateBuckets(setIndex) {
    state.numBucketsClone = state.numBuckets;
    const numBuckets = Number(state.numBuckets);
    const delta = (parseInt(state.bucketHigh) - parseInt(state.bucketLow)) / numBuckets;
    for (let i = 0; i < numBuckets; i++) {
      const lower = (parseInt(state.bucketLow) + i * delta).toFixed(2);
      const upper = (parseInt(state.bucketLow) + (i + 1) * delta).toFixed(2);
      state.selectedMenu.Parameters.Sets[setIndex].xBuckets.push({ GE: lower, LT: upper, Name: lower + '-' + upper });
    }
    // Legacy always PUSHES the new manager onto the end of the array rather than
    // inserting it at setIndex; this only works because generateBuckets() is only ever
    // reachable for a set that has no manager yet, and new sets are always appended at
    // the end (see addBucketChartSet), so "push" and "set at setIndex" coincide. Ported
    // as-is to match.
    state.bucketManagers.push(createBucketManager(state.selectedMenu.Parameters.Sets[setIndex].xBuckets));
    state.bucketLow = '';
    state.bucketHigh = '';
    state.numBuckets = null;
    renderActionForm();
  }

  function toggleNameEdit(bucket, setIndex) {
    if (bucket.nameEditable === true) {
      state.selectedMenu.Parameters.Sets[setIndex].xBuckets = bucketsFromManager(state.bucketManagers[setIndex]);
    }
    bucket.nameEditable = !bucket.nameEditable;
    renderActionForm();
  }

  function toggleRuleEdit(bucket, setIndex) {
    if (bucket.rulesEditable === true) {
      state.selectedMenu.Parameters.Sets[setIndex].xBuckets = bucketsFromManager(state.bucketManagers[setIndex]);
    }
    bucket.rulesEditable = !bucket.rulesEditable;
    renderActionForm();
  }

  function addBucketChartSet() {
    state.selectedMenu.Parameters.Sets.push(emptyBucketSet());
    state.numBucketsClone = null;
    renderActionForm();
  }

  function addBucket(setIndex) {
    // Legacy quirk: rule1Type/rule2Type start as plain empty strings here (not a
    // {Label,Value} RuleOption object as editableBucketsFrom produces), so
    // `bucket.rule1Type.Value` reads as `undefined` until the user picks a rule from
    // the dropdown - which also means the value-rule-type's !== 'NONE' check is true
    // prematurely, showing the value input before a rule is chosen. Ported as-is.
    const emptyBucket = {
      nameEditable: false,
      rulesEditable: false,
      rule1Type: '',
      rule2Type: '',
      rule1Value: null,
      rule2Value: null,
    };
    state.bucketManagers[setIndex].editableBuckets.push(emptyBucket);
    state.selectedMenu.Parameters.Sets[setIndex].xBuckets = bucketsFromManager(state.bucketManagers[setIndex]);
    renderActionForm();
  }

  function deleteBucket(setIndex) {
    if (state.bucketManagers[setIndex].editableBuckets.length > 0) {
      state.bucketManagers[setIndex].editableBuckets.splice(state.bucketManagers[setIndex].editableBuckets.length - 1, 1);
    }
    state.selectedMenu.Parameters.Sets[setIndex].xBuckets = bucketsFromManager(state.bucketManagers[setIndex]);
    renderActionForm();
  }

  function deleteBucketSet(setIndex) {
    state.selectedMenu.Parameters.Sets.splice(setIndex, 1);
    state.bucketManagers.splice(setIndex, 1);
    state.numBucketsClone = 0;
    renderActionForm();
  }

  function makeEditable(setIndex) {
    state.bucketManagers[setIndex].editing = true;
    renderActionForm();
  }

  function stopEditing(setIndex) {
    state.bucketManagers[setIndex].editing = false;
    renderActionForm();
  }

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

  // ---- New menu item ----

  function checkDisplay(display) {
    if (display === undefined) {
      addAlert(state.newPortfolioStructureAlerts, 'danger', 'please type in the name of the new portfolio structure!');
      return false;
    }
    return true;
  }

  function checkCommand(command) {
    if (command === undefined) {
      addAlert(state.newPortfolioStructureAlerts, 'danger', 'please choose a command of the new portfolio structure!');
      return false;
    }
    return true;
  }

  function buildParams(command) {
    switch (command) {
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
      case 'COMPARE_UNCERTAINTY':
        return { Keys: ['Key', 'Summary', 'Mean', 'Display', 'Units'], NodeLookup: 'TornadoDistOutputs' };
      case 'INNOVATION_SCREEN':
        return { Sets: [{ x: '', xTitle: '', y: '', yTitle: '', VerticalCutoff: null, name: 'Innovation Screen1' }] };
      case 'CFO_CHART':
        return { Sets: [{ AverageCost: '', xTitle: '', AverageValueMinusCost: '', yTitle: '', name: 'CFOChart1' }] };
      case 'SCATTER_PLOT':
        return { Sets: [{ x: '', y: '', xTitle: '', yTitle: '' }], SameScale: false, Min: null, Max: null };
      case 'BUCKET_CHART':
        return { Sets: [] };
      case 'PORTFOLIO_UNCERTAINTY':
        return { Source: '', MVSType: '', RollupKeys: [], PortfolioUncExplanation: '', Representation: '' };
      default:
        return {};
    }
  }

  function openNew() {
    state.newPortfolioStructureAlerts = [];
    const displayInput = container.querySelector('#new-display');
    const commandSelect = container.querySelector('#new-command');
    if (displayInput) displayInput.value = '';
    if (commandSelect) commandSelect.value = '';
    renderNewModalAlerts();
  }

  function addNewPortfolioStructure(display, command) {
    state.newPortfolioStructureAlerts = [];
    if (!checkDisplay(display)) {
      renderNewModalAlerts();
      return;
    }
    if (!checkCommand(command)) {
      renderNewModalAlerts();
      return;
    }
    const newPortfolioStructure = {};
    newPortfolioStructure.Command = command;
    newPortfolioStructure.Display = display;
    newPortfolioStructure.ID = makeActionIDFrom(display, state.portfolioStructure.MENU);
    newPortfolioStructure.Visible = true;
    newPortfolioStructure.Parameters = buildParams(command);
    if (command === 'COMPARE_UNCERTAINTY') {
      newPortfolioStructure.Context = { RequiredCommandInNodeTemplate: 'TORNADO_DIST' };
    }
    state.portfolioStructure.MENU.push(newPortfolioStructure);
    onSelectMenu(newPortfolioStructure);
  }

  // ---- unsaved-changes / alerts ----

  function isUnchanged() {
    return JSON.stringify(state.portfolioStructure) === JSON.stringify(state.portfolioStructureCopy);
  }

  function addAlert(alerts, type, msg) {
    alerts.push({ type, msg });
  }

  function rename() {
    save();
    hideModal('editPortfolioStructureModal');
  }

  function deletePortfolioStructure() {
    state.portfolioStructure.MENU.splice(state.portfolioStructure.MENU.indexOf(state.selectedMenu), 1);
    if (!isUnchanged()) {
      save('Delete ' + state.selectedMenu.Display);
    }
    // Legacy quirk: assigns the new selectedMenu directly rather than calling
    // selectMenu() again, so derived state (selectedTable/minPrecision/bucketManagers/
    // RollupKeys cleanup) is NOT recomputed for the new selection here. Ported as-is.
    state.selectedMenu = state.portfolioStructure.MENU[0];
    hideModal('deletePortfolioStructureModal');
    renderMenuList();
    renderActionForm();
    renderDeleteModalBody();
    renderEditModalValue();
    refreshSaveButton();
  }

  // ---- rendering: menu list (left panel) ----

  function matchesSearch(menu) {
    if (!state.searchText) return true;
    return (menu.Display || '').toLowerCase().includes(state.searchText.toLowerCase());
  }

  function renderMenuList() {
    const listEl = container.querySelector('#ps-menu-list');
    if (!listEl) return;
    if (!state.portfolioStructure) {
      listEl.innerHTML = '';
      return;
    }
    const menuItems = state.portfolioStructure.MENU;
    listEl.innerHTML = menuItems
      .map((menu, i) => {
        if (!matchesSearch(menu)) return '';
        const active = state.selectedMenu === menu;
        return `
      <a href="" class="list-group-item cursor-move ${active ? 'active' : ''}" data-menu-index="${i}">
        <table>
          <tr>
            <td class="appStructList no-wrap">${escapeHtml(menu.Display)}</td>
            <td class="appStructList" style="width:60px">
              ${active ? `<span data-toggle="modal" data-target="#deletePortfolioStructureModal" class="inline-icon pull-right glyphicon glyphicon-trash" title="Delete"></span>` : ''}
              ${active ? `<span data-toggle="modal" data-target="#editPortfolioStructureModal" class="inline-icon pull-right glyphicon glyphicon-pencil" title="Rename"></span>` : ''}
            </td>
          </tr>
        </table>
      </a>`;
      })
      .join('');

    listEl.querySelectorAll('[data-menu-index]').forEach((el) => {
      el.addEventListener('click', (evt) => {
        evt.preventDefault();
        onSelectMenu(menuItems[Number(el.getAttribute('data-menu-index'))]);
      });
    });

    if (sortableHandle) sortableHandle.destroy();
    // Reordering while a search filter is active would silently drop the non-matching
    // items from the backing array (they never appear in the DOM to be reordered), so
    // dragging is only wired up when the full list is shown.
    if (!state.searchText) {
      sortableHandle = makeSortable(listEl, {
        itemSelector: '[data-menu-index]',
        onReorder: (orderedEls) => {
          state.portfolioStructure.MENU = orderedEls.map((el) => menuItems[Number(el.getAttribute('data-menu-index'))]);
          renderMenuList();
          refreshSaveButton();
        },
      });
    }
  }

  // ---- rendering: action form (right panel) ----

  function commandHeaderHtml(menu) {
    return `
    <div class="col-sm-6"><h4>${escapeHtml(menu.Command)}</h4></div>
    <div class="col-sm-6"><h4><input type="checkbox" id="ps-visible-toggle" ${menu.Visible ? 'checked' : ''}> Visible</h4></div>`;
  }

  function renderActionForm() {
    const formEl = container.querySelector('#ps-action-form');
    const titleEl = container.querySelector('#ps-selected-title');
    if (!formEl) return;
    const menu = state.selectedMenu;
    if (titleEl) titleEl.textContent = menu ? menu.Display : '';
    if (!menu) {
      formEl.innerHTML = '';
      return;
    }
    let html = '';
    switch (menu.Command) {
      case 'ADD_TABLES':
        html = renderAddTablesEditor({ menu, state, commandHeaderHtml, outputOptionsHtml });
        break;
      case 'COMPARE_VALUE':
        html = renderCompareValueEditor({ menu, commandHeaderHtml, outputOptionsHtml });
        break;
      case 'COMPARE_UNCERTAINTY':
        html = renderCompareUncertaintyEditor(menu);
        break;
      case 'INNOVATION_SCREEN':
        html = renderInnovationScreenEditor({ menu, commandHeaderHtml, outputOptionsHtml, getKeyFrom });
        break;
      case 'SCATTER_PLOT':
        html = renderScatterPlotEditor({ menu, commandHeaderHtml, outputOptionsHtml, getKeyFrom });
        break;
      case 'CFO_CHART':
        html = renderCfoChartEditor({ menu, commandHeaderHtml, outputOptionsHtml, getKeyFrom });
        break;
      case 'BUCKET_CHART':
        html = renderBucketChartEditor({ menu, state, commandHeaderHtml, outputOptionsHtml, rule1Options: RULE1_OPTIONS, rule2Options: RULE2_OPTIONS });
        break;
      case 'PORTFOLIO_UNCERTAINTY':
        html = renderPortfolioUncertaintyEditor({
          menu,
          commandHeaderHtml,
          sourceIds: getSourceFromAppStruMetalog(),
          availableKeys: getPortfolioUncKeyFromMetalogBySource().filter((key) => menu.Parameters.RollupKeys.indexOf(key) === -1),
          outputsByKey: findKey(state.outputs),
        });
        break;
      default:
        html = '';
    }
    formEl.innerHTML = `<div class="col-sm-12">${html}</div>`;
    wireActionForm(formEl, menu);
    refreshSaveButton();
  }

  function refreshDefaultPrecisionOptions() {
    const sel = container.querySelector('#ps-default-precision');
    if (!sel || !state.selectedMenu) return;
    const opts = state.selectedMenu.Parameters.PrecisionOptions || [];
    sel.innerHTML = opts
      .map((opt) => `<option value="${opt}" ${state.selectedMenu.Parameters.DefaultPrecision === opt ? 'selected' : ''}>${opt}</option>`)
      .join('');
  }

  function wireActionForm(formEl, menu) {
    const visible = formEl.querySelector('#ps-visible-toggle');
    if (visible) {
      visible.addEventListener('change', (e) => {
        menu.Visible = e.target.checked;
        refreshSaveButton();
      });
    }
    switch (menu.Command) {
      case 'ADD_TABLES':
        bindAddTablesEditor({ formEl, state, selectTable, render: renderActionForm, changePrecisionOptions, refreshDefaultPrecisionOptions, refreshSaveButton, getOutputUnitFromKey, getOutputDisplayFromKey });
        break;
      case 'COMPARE_VALUE':
        bindCompareValueEditor({ formEl, menu, refreshSaveButton, getOutputUnitFromKey, getOutputDisplayFromKey, addItem: addCompareValueItem, deleteItem: deleteCompareValueItem });
        break;
      case 'INNOVATION_SCREEN':
        bindInnovationScreenEditor({ formEl, menu, refreshSaveButton, buildOutputFromKey, getOutputDisplayFromKey, addItem: addInnovationScreenItem, deleteItem: deleteInnovationScreenItem });
        break;
      case 'SCATTER_PLOT':
        bindScatterPlotEditor({ formEl, menu, refreshSaveButton, buildOutputFromKey, getOutputDisplayFromKey, addItem: addScatterPlotItem, deleteItem: deleteScatterPlotItem });
        break;
      case 'CFO_CHART':
        bindCfoChartEditor({ formEl, menu, refreshSaveButton, buildOutputFromKey, getOutputDisplayFromKey, addItem: addCFOChartItem, deleteItem: deleteCFOChartItem });
        break;
      case 'BUCKET_CHART':
        bindBucketChartEditor({ formEl, menu, state, render: renderActionForm, refreshSaveButton, generateBuckets, makeEditable, addBucket, deleteBucket, stopEditing, deleteBucketSet, addBucketChartSet, toggleNameEdit, toggleRuleEdit, rule1Options: RULE1_OPTIONS, rule2Options: RULE2_OPTIONS });
        break;
      case 'PORTFOLIO_UNCERTAINTY':
        bindPortfolioUncertaintyEditor({ formEl, menu, render: renderActionForm, refreshSaveButton, addKey: addToRollupKeys, removeKey: removeFromIncludedKeys });
        break;
      default:
        break;
    }
  }

  function refreshSaveButton() {
    const btn = container.querySelector('#ps-save-btn');
    if (btn) btn.disabled = isUnchanged();
    const spinner = container.querySelector('#ps-save-spinner');
    const text = container.querySelector('#ps-save-text');
    if (spinner) spinner.hidden = state.saveComplete;
    if (text) text.hidden = !state.saveComplete;
  }

  function renderSaveAlerts() {
    const box = container.querySelector('#ps-save-alerts');
    if (!box) return;
    box.innerHTML = renderAlerts(state.saveAlerts, { prefix: 'Saving failed.' });
    wireAlertClose(box, state.saveAlerts, renderSaveAlerts);
  }

  function renderNewModalAlerts() {
    const box = container.querySelector('#ps-new-alerts');
    if (!box) return;
    box.innerHTML = renderAlerts(state.newPortfolioStructureAlerts);
    wireAlertClose(box, state.newPortfolioStructureAlerts, renderNewModalAlerts);
  }

  function renderDeleteModalBody() {
    const body = container.querySelector('#ps-delete-modal-body');
    if (!body) return;
    body.innerHTML = `<h4 class="modal-title">Are you sure to delete <b>${escapeHtml(state.selectedMenu ? state.selectedMenu.Display : '')}</b>?</h4>`;
  }

  function renderEditModalValue() {
    const input = container.querySelector('#ps-edit-name-input');
    if (input) input.value = state.selectedMenu ? state.selectedMenu.Display : '';
  }

  function render() {
    if (disposed) return;
    if (!state.portfolioStructure) {
      if (state.loadError) {
        container.innerHTML = `
${appNavHtml({ active: 'portfolioStructure', isAdmin: state.isAdmin, selectedTemplate: state.selectedTemplate })}
${loadErrorHtml({ title: 'Portfolio structure could not be loaded.', message: state.loadError, retryId: 'ps-load-retry' })}`;
        container.querySelector('#ps-load-retry').addEventListener('click', loadPortfolioStructure);
        return;
      }
      container.innerHTML = `
${appNavHtml({ active: 'portfolioStructure', isAdmin: state.isAdmin, selectedTemplate: state.selectedTemplate })}
${loadingOverlayHtml('Loading portfolio structure')}`;
      return;
    }

    container.innerHTML = `
${appNavHtml({ active: 'portfolioStructure', isAdmin: state.isAdmin, selectedTemplate: state.selectedTemplate })}
<div class="select-template fadeIn structure-editor" style="height: calc(100% - 100px)">
  <div class="choose-from structure-sidebar">
    <div class="select-template-title"><h4>${state.isPlatform ? 'Platform Portfolio Structure' : 'Portfolio Structure'}</h4></div>
    <div class="select-template-title">
      <input type="text" class="form-control" id="ps-search" placeholder="Search" value="${escapeAttr(state.searchText)}">
    </div>
    <div class="panel panel-primary structure-menu-panel">
      <div class="list-of-templates height-for-list" style="height: 100%">
        <div id="ps-menu-list" class="list-group"></div>
      </div>
    </div>
    <div class="pull-left">
      <button class="btn btn-success" id="ps-new-btn" data-toggle="modal" data-target="#newPortfolioStructureModal" title="New">
        <span class="glyphicon glyphicon-plus"></span>
      </button>
    </div>
  </div>

  <div id="selected-template">
    <div class="select-template-title">
      <div class="col-sm-12"><h4 id="ps-selected-title"></h4></div>
    </div>
    <div class="selected-inputs" style="background-color: #eee; overflow: scroll">
      <div id="ps-action-form"></div>
    </div>
  </div>

  <div class="col-sm-12 text-center align-to-bottom">
    <a href="#/appstructure/${encodeURIComponent(state.selectedTemplate)}" class="btn btn-primary pull-left" role="button">
      <span class="glyphicon glyphicon-chevron-left"></span> Previous: App Structure
    </a>
    <button class="btn btn-danger" id="ps-save-btn" style="width:60px;" data-toggle="modal" data-target="#commitMessageModal" ${isUnchanged() ? 'disabled' : ''}>
      <i class="fa fa-spinner fa-spin fa-lg" id="ps-save-spinner" ${state.saveComplete ? 'hidden' : ''}></i><span id="ps-save-text" ${state.saveComplete ? '' : 'hidden'}>save</span>
    </button>
    <div class="col-sm-12 save-alert" id="ps-save-alerts">${renderAlerts(state.saveAlerts, { prefix: 'Saving failed.' })}</div>
  </div>

  <!-- Delete Modal -->
  <div class="modal fade" id="deletePortfolioStructureModal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog"><div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
        <h4 class="modal-title">Delete Menu Item</h4>
      </div>
      <div class="modal-body" id="ps-delete-modal-body"></div>
      <div class="modal-footer">
        <button class="btn btn-primary" id="ps-delete-confirm">Delete</button>
        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
      </div>
    </div></div>
  </div>

  <!-- Edit Modal -->
  <div class="modal fade" id="editPortfolioStructureModal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog"><div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
        <h4 class="modal-title">Rename Menu Item</h4>
      </div>
      <div class="modal-body">
        <h4>New Name:</h4>
        <input type="text" id="ps-edit-name-input" class="form form-control">
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" id="ps-rename-btn">Rename</button>
        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
      </div>
    </div></div>
  </div>

  <!-- New Modal -->
  <div class="modal fade" id="newPortfolioStructureModal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog"><div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
        <h4 class="modal-title">New Menu Item</h4>
      </div>
      <div class="modal-body">
        <div class="container-fluid">
          <div class="row table-padding">
            <div class="col-sm-3 col-sm-offset-1 text-right"><h4>Name</h4></div>
            <div class="col-sm-6"><input type="text" class="form form-control" id="new-display"></div>
          </div>
          <div class="row table-padding">
            <div class="col-sm-3 col-sm-offset-1 text-right"><h4>Command</h4></div>
            <div class="col-sm-6">
              <select class="form form-control" id="new-command">
                <option value=""></option>
                <option value="COMPARE_VALUE">COMPARE_VALUE</option>
                <option value="COMPARE_UNCERTAINTY">COMPARE_UNCERTAINTY</option>
                <option value="CFO_CHART">CFO_CHART</option>
                <option value="INNOVATION_SCREEN">INNOVATION_SCREEN</option>
                <option value="ADD_TABLES">ADD_TABLES</option>
                <option value="SCATTER_PLOT">SCATTER_PLOT</option>
                <option value="BUCKET_CHART">BUCKET_CHART</option>
                <option value="PORTFOLIO_UNCERTAINTY">PORTFOLIO_UNCERTAINTY</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div class="col-sm-12 save-alert text-center" id="ps-new-alerts"></div>
      <div class="modal-footer">
        <button class="btn btn-primary" id="ps-new-add-btn" data-dismiss="modal">Add</button>
        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
      </div>
    </div></div>
  </div>
</div>
${commitMessageModalHtml()}`;

    container.querySelector('#ps-search').addEventListener('input', (e) => {
      state.searchText = e.target.value;
      renderMenuList();
    });
    container.querySelector('#ps-new-btn').addEventListener('click', openNew);
    container.querySelector('#ps-delete-confirm').addEventListener('click', deletePortfolioStructure);
    container.querySelector('#ps-rename-btn').addEventListener('click', rename);
    container.querySelector('#ps-edit-name-input').addEventListener('input', (e) => {
      if (!state.selectedMenu) return;
      state.selectedMenu.Display = e.target.value;
      renderMenuList();
    });
    container.querySelector('#ps-new-add-btn').addEventListener('click', () => {
      const display = container.querySelector('#new-display').value;
      const command = container.querySelector('#new-command').value;
      addNewPortfolioStructure(display === '' ? undefined : display, command === '' ? undefined : command);
    });
    onModalShown('newPortfolioStructureModal', () => {
      const el = container.querySelector('#new-display');
      if (el) el.focus();
    });

    initCommitMessageModal(container, saveWithCommit);

    renderMenuList();
    renderActionForm();
    renderDeleteModalBody();
    renderEditModalValue();
  }

  loadPortfolioStructure();

  setNavigationGuard((nextPath) => {
    // Legacy bug ported as-is: the original `$locationChangeStart` guard tested
    // `current.indexOf("#/portfoliostructure/")` (lowercase) against the URL being left,
    // which never matches the platform route's "#/platformPortfolioStructure/..." (capital
    // P, "platform" prefix) - so the unsaved-changes confirmation never fired there.
    if (state.isPlatform) return true;
    if (isUnchanged()) return true;
    const confirmed = confirm(`You have unsaved changes in portfolio structure, continue navigating to ${nextPath} ?`);
    if (!confirmed) return false;
    state.portfolioStructure = structuredClone(state.portfolioStructureCopy);
    return true;
  });

  return () => {
    disposed = true;
    clearNavigationGuard();
  };
}
