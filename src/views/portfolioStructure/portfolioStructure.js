/* Ported from portfolioStructureController.ts + views/portfolioStructure.html. */
import { huashan } from '../../api/huashanClient.js';
import { session, restoreSession } from '../../core/session.js';
import { SERVER_URL } from '../../core/config.js';
import { setNavigationGuard, clearNavigationGuard } from '../../core/router.js';
import { appNavHtml } from '../../components/appNav.js';
import { renderAlerts, wireAlertClose } from '../../components/alerts.js';
import { commitMessageModalHtml, initCommitMessageModal, closeCommitMessageModal } from '../../components/commitMessageModal.js';
import { loadingOverlayHtml } from '../../components/loadingOverlay.js';
import { onModalShown, hideModal } from '../../components/uiInteractions.js';
import { makeSortable } from '../../components/sortable.js';
import { scrollElementIntoView } from '../../components/scrollTo.js';
import { escapeHtml, extractTablePreviewHtml } from '../../core/html.js';
import { makeActionIDFrom } from '../../core/common.js';

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
    state.loadError = '';
    state.portfolioStructure = null;
    render();
    huashan
      .getPortfolioStructure(session.getCredentials(), params.templateID, state.isPlatform)
      .then((response) => {
        if (!response || !response.status || !response.result || !Array.isArray(response.result.MENU)) {
          throw new Error((response && response.msg) || 'The server returned an invalid portfolio structure.');
        }
        state.portfolioStructure = response.result;
        state.portfolioStructureCopy = structuredClone(state.portfolioStructure);
        state.selectedMenu = state.portfolioStructure.MENU[0] || null;
        selectMenu(state.selectedMenu);
        state.numBucketsClone = 0;
        // This is the first full render; incremental refreshes are safe after it.
        render();
      })
      .catch((error) => {
        console.error('Portfolio structure loading failed:', error);
        state.loadError = error instanceof Error ? error.message : 'Portfolio structure loading failed.';
        render();
      });
  }

  function getAppStructure() {
    huashan.getAppStructure(session.getCredentials(), params.templateID, state.isPlatform).then((response) => {
      state.appStructure = response.result;
      state.tornadoOutputs = state.appStructure.PostProcessingOutputsForPortfolio || [];
      getDataStructure(); // Ensure GetAppStructure already returned before getting data structure
      const tables = (state.appStructure.MENU || []).filter((menu) => menu.Command === 'TABLE');
      state.tables = state.tables.concat(tables);
      onDataChanged();
    });
    // when isPlatform, still need data from the regular (non-platform) app structure
    if (state.isPlatform === true) {
      huashan.getAppStructure(session.getCredentials(), params.templateID, false).then((response) => {
        const regularAppStructure = response.result;
        const tables = (regularAppStructure.MENU || []).filter((menu) => menu.Command === 'TABLE');
        state.tables = state.tables.concat(tables);
        onDataChanged();
      });
    }
  }

  function getPotentialTables() {
    huashan.getPotentialTables(session.getCredentials(), params.templateID).then((response) => {
      state.potentialTables = response.result.PotentialTableOutputs;
      onDataChanged();
    });
  }

  function getDataStructure() {
    huashan.getIncludedDataStructureComponents(session.getCredentials(), params.templateID, state.isPlatform).then((data) => {
      state.inputs = data.result.Inputs;
      state.outputs = data.result.Outputs;
      state.allOutputs = state.outputs.concat(state.tornadoOutputs);
      onDataChanged();
    });
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

  function addTablesFormHtml(menu) {
    const preview = state.selectedPotentialTable;
    let previewHtml = '';
    if (preview && preview.HtmlPreview) {
      previewHtml = `<div style="width:100%; overflow:auto;">${extractTablePreviewHtml(preview.HtmlPreview)}</div>`;
    } else if (preview) {
      previewHtml = `<img src="${escapeAttr(state.server)}${escapeAttr(preview.PreviewURL || '')}" alt="${escapeAttr(preview.CellLink || '')}" width="100%">`;
    }
    return `
    ${commandHeaderHtml(menu)}
    <div class="col-sm-4">
      <div class="list-group" id="ps-tables-list">
        ${state.tables
          .map(
            (table, i) => `
        <a href="" id="table${i}" class="list-group-item ${state.selectedTable === table ? 'active' : ''}" data-table-index="${i}">
          ${escapeHtml(table.Display)}
        </a>`
          )
          .join('')}
      </div>
    </div>
    <div class="col-sm-8">${previewHtml}</div>
    <div class="col-sm-12">
      <div class="row table-padding col-sm-4">
        <div class="col-sm-6 text-right"><b>PNL</b></div>
        <div class="col-sm-6"><input type="checkbox" id="ps-add-tables-pnl" ${menu.Parameters.Pnl ? 'checked' : ''}></div>
      </div>
    </div>
    <div class="col-sm-12">
      <div class="row table-padding col-sm-4">
        <div class="col-sm-6 text-right" style="padding-top: 2%"><b>Precision Options</b></div>
      </div>
    </div>
    <div class="col-sm-12">
      <div class="row table-padding col-sm-4">
        <div class="col-sm-6 text-right" style="padding-top: 2%"><b>Min</b></div>
        <div class="col-sm-6"><input type="number" class="form form-control" id="ps-min-precision" min="0" value="${numOrEmpty(state.minPrecision)}"></div>
      </div>
      <div class="row table-padding col-sm-4">
        <div class="col-sm-6 text-right" style="padding-top: 2%"><b>Max</b></div>
        <div class="col-sm-6"><input type="number" class="form form-control" id="ps-max-precision" min="0" value="${numOrEmpty(state.maxPrecision)}"></div>
      </div>
      <div class="row table-padding col-sm-4">
        <div class="col-sm-6 text-right"><b>Default Precision</b></div>
        <div class="col-sm-6">
          <select class="btn btn-default form-control" id="ps-default-precision">
            ${(menu.Parameters.PrecisionOptions || [])
              .map((opt) => `<option value="${opt}" ${menu.Parameters.DefaultPrecision === opt ? 'selected' : ''}>${opt}</option>`)
              .join('')}
          </select>
        </div>
      </div>
    </div>
    ${(menu.Parameters.Keys || [])
      .map(
        (key, i) => `
    <div class="row table-padding">
      <div class="col-sm-3"><select class="form form-control" data-special-key-index="${i}">${outputOptionsHtml(key)}</select></div>
    </div>`
      )
      .join('')}
    <div class="col-sm-12">
      <div class="row table-padding col-sm-4">
        <div class="col-sm-6 text-right"><b>Special Rules</b></div>
        <div class="col-sm-6">
          <select class="btn btn-default form-control">
            <option value="1">None</option>
            <option value="2">Ignore</option>
            <option value="3">IRR</option>
            <option value="4">MVSto Range</option>
            <option value="5">Year</option>
            <option value="6">Tooltip</option>
          </select>
        </div>
      </div>
    </div>`;
  }

  function compareValueFormHtml(menu) {
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
    ${keys
      .map(
        (key, i) => `
    <div class="row table-padding">
      <div class="col-sm-3"><select class="form form-control" data-cv-key-index="${i}">${outputOptionsHtml(key)}</select></div>
      <div class="col-sm-3"><input type="text" class="form form-control" data-cv-unit-index="${i}" value="${escapeAttr(menu.Parameters.Units[i])}"></div>
      <div class="col-sm-3"><input type="text" class="form form-control" data-cv-title-index="${i}" value="${escapeAttr(menu.Parameters.Titles[i])}"></div>
      <div class="col-sm-1"><button class="btn btn-danger" data-cv-delete-index="${i}"><span class="glyphicon glyphicon-trash"></span></button></div>
    </div>`
      )
      .join('')}
    <div class="row table-padding">
      <div class="col-sm-1"><button class="btn btn-success" id="ps-cv-add"><span class="glyphicon glyphicon-plus"></span></button></div>
    </div>`;
  }

  function compareUncertaintyFormHtml(menu) {
    return `
    <div class="col-sm-6">
      <h4>${escapeHtml(menu.Command)}</h4>
      <div><h4>There's nothing to customize in this menu item</h4></div>
    </div>
    <div class="col-sm-6"><h4><input type="checkbox" id="ps-visible-toggle" ${menu.Visible ? 'checked' : ''}> Visible</h4></div>`;
  }

  function innovationScreenFormHtml(menu) {
    return `
    ${commandHeaderHtml(menu)}
    ${menu.Parameters.Sets.map(
      (set, i) => `
    <div>
      <div class="row table-padding">
        <div class="col-sm-2"><b>X Axis</b></div>
        <div class="col-sm-3"><select class="form form-control" data-is-xkey-index="${i}">${outputOptionsHtml(getKeyFrom(set.x))}</select></div>
        <div class="col-sm-2"><b>X Title</b></div>
        <div class="col-sm-3"><input type="text" class="form form-control" data-is-xtitle-index="${i}" value="${escapeAttr(set.xTitle)}"></div>
      </div>
      <div class="row table-padding">
        <div class="col-sm-2"><b>Y Axis</b></div>
        <div class="col-sm-3"><select class="form form-control" data-is-ykey-index="${i}">${outputOptionsHtml(getKeyFrom(set.y))}</select></div>
        <div class="col-sm-2"><b>Y Title</b></div>
        <div class="col-sm-3"><input type="text" class="form form-control" data-is-ytitle-index="${i}" value="${escapeAttr(set.yTitle)}"></div>
      </div>
      <div class="row table-padding">
        <div class="col-sm-2"><b>Vertical Cut-off</b></div>
        <div class="col-sm-3"><input type="number" class="form form-control" data-is-vcutoff-index="${i}" value="${numOrEmpty(set.VerticalCutoff)}"></div>
        <div class="col-sm-2"><b>Name</b></div>
        <div class="col-sm-3"><input type="text" class="form form-control" data-is-name-index="${i}" value="${escapeAttr(set.name)}"></div>
        <div class="col-sm-1"><button class="btn btn-danger" data-is-delete-index="${i}"><span class="glyphicon glyphicon-trash"></span></button></div>
      </div>
    </div>`
    ).join('')}
    <div class="row table-padding">
      <div class="col-sm-1"><button class="btn btn-success" id="ps-is-add"><span class="glyphicon glyphicon-plus"></span></button></div>
    </div>`;
  }

  function cfoChartFormHtml(menu) {
    return `
    ${commandHeaderHtml(menu)}
    ${menu.Parameters.Sets.map(
      (set, i) => `
    <div>
      <div class="col-sm-12">
        <div class="row table-padding">
          <div class="col-sm-3"><b>X Axis</b></div>
          <div class="col-sm-3"><b>X Title</b></div>
          <div class="col-sm-3"><b>Name</b></div>
        </div>
      </div>
      <div class="row table-padding">
        <div class="col-sm-3"><select class="form form-control" data-cfo-xkey-index="${i}">${outputOptionsHtml(getKeyFrom(set.AverageCost))}</select></div>
        <div class="col-sm-3"><input type="text" class="form form-control" data-cfo-xtitle-index="${i}" value="${escapeAttr(set.xTitle)}"></div>
        <div class="col-sm-3"><input type="text" class="form form-control" data-cfo-name-index="${i}" value="${escapeAttr(set.name)}"></div>
      </div>
      <div class="col-sm-12">
        <div class="row table-padding">
          <div class="col-sm-3"><b>Y Axis</b></div>
          <div class="col-sm-3"><b>Y Title</b></div>
        </div>
      </div>
      <div class="row table-padding">
        <div class="col-sm-3"><select class="form form-control" data-cfo-ykey-index="${i}">${outputOptionsHtml(getKeyFrom(set.AverageValueMinusCost))}</select></div>
        <div class="col-sm-3"><input type="text" class="form form-control" data-cfo-ytitle-index="${i}" value="${escapeAttr(set.yTitle)}"></div>
        <div class="col-sm-1"><button class="btn btn-danger" data-cfo-delete-index="${i}"><span class="glyphicon glyphicon-trash"></span></button></div>
      </div>
    </div>`
    ).join('')}
    <div class="row table-padding">
      <div class="col-sm-1"><button class="btn btn-success" id="ps-cfo-add"><span class="glyphicon glyphicon-plus"></span></button></div>
    </div>`;
  }

  function scatterPlotFormHtml(menu) {
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
    ${menu.Parameters.Sets.map((set, i) => {
      const hasError = (set.name === undefined || set.name === '') && menu.Parameters.Sets.length > 1;
      return `
    <div>
      <div class="row table-padding"><div class="col-sm-2"><h3>Series ${i + 1}</h3></div></div>
      <div class="row table-padding">
        <div class="col-sm-2"><b>Name</b></div>
        <div class="col-sm-3 ${hasError ? 'has-error' : ''}" data-sp-name-wrapper="${i}">
          <input type="text" class="form form-control" data-sp-name-index="${i}" value="${escapeAttr(set.name)}">
        </div>
      </div>
      <div class="row table-padding">
        <div class="col-sm-2"><b>X Axis</b></div>
        <div class="col-sm-3"><select class="form form-control" data-sp-xkey-index="${i}">${outputOptionsHtml(getKeyFrom(set.x))}</select></div>
        <div class="col-sm-2"><b>X Title</b></div>
        <div class="col-sm-3"><input type="text" class="form form-control" data-sp-xtitle-index="${i}" value="${escapeAttr(set.xTitle)}"></div>
      </div>
      <div class="row table-padding">
        <div class="col-sm-2"><b>Y Axis</b></div>
        <div class="col-sm-3"><select class="form form-control" data-sp-ykey-index="${i}">${outputOptionsHtml(getKeyFrom(set.y))}</select></div>
        <div class="col-sm-2"><b>Y Title</b></div>
        <div class="col-sm-3"><input type="text" class="form form-control" data-sp-ytitle-index="${i}" value="${escapeAttr(set.yTitle)}"></div>
        <div class="col-sm-2"><button class="btn btn-danger" data-sp-delete-index="${i}"><span class="glyphicon glyphicon-trash"></span></button></div>
      </div>
    </div>`;
    }).join('')}
    <div class="col-sm-2"><button class="btn btn-success" id="ps-sp-add"><span class="glyphicon glyphicon-plus"></span></button></div>`;
  }

  function bucketRowHtml(b, bi, setIndex) {
    const rule1Editable = b.rulesEditable === true;
    return `
    <tr>
      <td>
        ${
          b.nameEditable === true
            ? `<div>
          <input class="form-control input-sm" type="text" data-bucket-name-edit="${setIndex}:${bi}" value="${escapeAttr(b.Name)}">
          <span><button class="btn btn-primary btn-sm" style="margin-top:15px;" data-bucket-name-done="${setIndex}:${bi}">Done</button></span>
        </div><br/>`
            : `<span>${escapeHtml(b.Name)}<br/>
        <i class="pull-righ glyphicon glyphicon-pencil" data-bucket-name-edit-toggle="${setIndex}:${bi}"></i></span>`
        }
      </td>
      <td>
        ${
          rule1Editable
            ? `<div>
          <select class="form-control input-sm" data-bucket-rule1-type="${setIndex}:${bi}">${ruleOptionsHtml(RULE1_OPTIONS, b.rule1Type)}</select>
          ${b.rule1Type.Value !== 'NONE' ? `<input type="text" class="form-control input-sm" data-bucket-rule1-value="${setIndex}:${bi}" value="${escapeAttr(b.rule1Value)}"/>` : ''}<br/>
          <select class="form-control input-sm" data-bucket-rule2-type="${setIndex}:${bi}">${ruleOptionsHtml(RULE2_OPTIONS, b.rule2Type)}</select>
          ${b.rule2Type.Value !== 'NONE' ? `<input type="text" class="form-control input-sm" data-bucket-rule2-value="${setIndex}:${bi}" value="${escapeAttr(b.rule2Value)}"/>` : ''}<br/>
          <button class="btn btn-primary btn-sm" data-bucket-rules-done="${setIndex}:${bi}">Done</button>
        </div>`
            : `<div>
          ${escapeHtml(b.rule1Type.Label || '')}&nbsp;${escapeHtml(numOrEmpty(b.rule1Value))}<br/>
          ${escapeHtml(b.rule2Type.Label || '')}&nbsp;${escapeHtml(numOrEmpty(b.rule2Value))}<br/>
          <i class="pull-righ glyphicon glyphicon-pencil" data-bucket-rules-edit-toggle="${setIndex}:${bi}"></i>
        </div>`
        }
      </td>
    </tr>`;
  }

  function ruleOptionsHtml(options, current) {
    const currentValue = current ? current.Value : undefined;
    return options.map((o) => `<option value="${o.Value}" ${o.Value === currentValue ? 'selected' : ''}>${escapeHtml(o.Label)}</option>`).join('');
  }

  function bucketSetHtml(s, i, menu) {
    const manager = state.bucketManagers[i];
    const titleError = (s.Title === undefined || s.Title === '') && menu.Parameters.Sets.length > 1;
    return `
    <div>
      <div class="row table-padding">
        <div class="col-sm-2 ${titleError ? 'has-error' : ''}" data-bc-title-wrapper="${i}"><b>Title</b></div>
        <div class="col-sm-3"><input type="text" class="form form-control" data-bc-title-index="${i}" value="${escapeAttr(s.Title)}"></div>
        <div class="col-sm-2"><b>Counts</b></div>
        <div class="col-sm-3">
          <select class="form form-control" data-bc-counts-index="${i}">
            <option value="false" ${!s.Counts ? 'selected' : ''}>false</option>
            <option value="true" ${s.Counts ? 'selected' : ''}>true</option>
          </select>
        </div>
      </div>
      <div class="row table-padding">
        <div class="col-sm-2"><b>X Axis</b></div>
        <div class="col-sm-3"><select class="form form-control" data-bc-key-index="${i}">${outputOptionsHtml(s.Key)}</select></div>
        <div class="col-sm-2"><b>X Label</b></div>
        <div class="col-sm-3"><input type="text" class="form form-control" data-bc-xtitle-index="${i}" value="${escapeAttr(s.xTitle)}"></div>
      </div>
      <div class="row table-padding">
        <div class="col-sm-2"><b>Y Label</b></div>
        <div class="col-sm-3"><input type="text" class="form form-control" data-bc-ytitle-index="${i}" value="${escapeAttr(s.yTitle)}"></div>
      </div>
      <div class="row">&nbsp;</div>
      ${
        s.xBuckets.length === 0 && !manager
          ? `
      <div class="row table-padding well">
        <div class="col-sm-2">Buckets<br/><input type="number" min="1" class="form form-control" data-bc-numbuckets-index="${i}" value="${state.numBuckets === '' || state.numBuckets === null || state.numBuckets === undefined ? '' : state.numBuckets}"></div>
        <div class="col-sm-2">Low<br/><input type="text" class="form-control" data-bc-low-index="${i}" value="${escapeAttr(state.bucketLow)}"></div>
        <div class="col-sm-2">High<br/><input type="text" class="form-control" data-bc-high-index="${i}" value="${escapeAttr(state.bucketHigh)}"></div>
        <div class="col-sm-1"><br/><button class="btn btn-primary" data-bc-generate-index="${i}">Generate Buckets</button></div>
      </div>`
          : ''
      }
      ${
        manager && manager.editing === false
          ? `
      <div class="row table-padding">
        <div class="col-md-9">
          <b>Buckets: ${manager.editableBuckets.map((b, bi) => `${escapeHtml(b.Name)}${bi < manager.editableBuckets.length - 1 ? ',' : ''}`).join(' ')}
          <i class="pull-righ glyphicon glyphicon-pencil" data-bc-makeeditable-index="${i}"></i></b>
        </div>
      </div>`
          : ''
      }
      ${
        manager && manager.editing === true
          ? `
      <div class="row table-padding">
        <div class="col-md-3"></div>
        <div class="col-md-6">
          <table class="table table-bordered table-striped table-condensed">
            <thead><th>Bucket Label</th><th>Bucket Rule</th></thead>
            <tbody>${manager.editableBuckets.map((b, bi) => bucketRowHtml(b, bi, i)).join('')}</tbody>
          </table>
          <div style="text-align:center">
            <button class="btn btn-primary" data-bc-addbucket-index="${i}">Add Bucket</button>
            <button class="btn btn-primary" data-bc-deletebucket-index="${i}" ${manager.editableBuckets.length === 0 ? 'disabled' : ''}>Delete Bucket</button>
            <button class="btn btn-primary" data-bc-stopediting-index="${i}">Stop Editing</button>
          </div>
        </div>
      </div>`
          : ''
      }
    </div>
    <div class="row table-padding">
      <div class="col-sm-1"><button class="btn btn-danger" data-bc-deleteset-index="${i}"><span class="glyphicon glyphicon-trash"></span></button></div>
    </div>
    <hr>`;
  }

  function bucketChartFormHtml(menu) {
    return `
    ${commandHeaderHtml(menu)}
    ${menu.Parameters.Sets.map((s, i) => bucketSetHtml(s, i, menu)).join('')}
    <div class="row table-padding">
      <div class="col-sm-1"><button class="btn btn-success" id="ps-bc-add-set"><span class="glyphicon glyphicon-plus"></span></button></div>
    </div>`;
  }

  function portfolioUncertaintyFormHtml(menu) {
    const includedKeys = menu.Parameters.RollupKeys;
    const availableKeys = getPortfolioUncKeyFromMetalogBySource().filter((k) => includedKeys.indexOf(k) === -1);
    return `
    ${commandHeaderHtml(menu)}
    <div class="row table-padding col-sm-12">
      <div class="col-sm-2"><b>Type</b></div>
      <div class="col-sm-3">
        <select class="form form-control" id="ps-pu-mvstype">
          <option value="" ${!menu.Parameters.MVSType ? 'selected' : ''}>--select type--</option>
          <option value="MVSFromFittedPoints" ${menu.Parameters.MVSType === 'MVSFromFittedPoints' ? 'selected' : ''}>MVSFromFittedPoints</option>
        </select>
      </div>
    </div>
    <div class="row table-padding col-sm-12">
      <div class="col-sm-2"><b>Source</b></div>
      <div class="col-sm-3">
        <select class="form form-control" id="ps-pu-source">
          <option value="" ${!menu.Parameters.Source ? 'selected' : ''}>--select source--</option>
          ${getSourceFromAppStruMetalog()
            .map((x) => `<option value="${escapeAttr(x)}" ${menu.Parameters.Source === x ? 'selected' : ''}>${escapeHtml(x)}</option>`)
            .join('')}
        </select>
      </div>
    </div>
    <div class="row table-padding col-sm-12">
      <div class="col-sm-2"><b>Representation</b></div>
      <div class="col-sm-3">
        <select class="form form-control" id="ps-pu-representation">
          <option value="" ${!menu.Parameters.Representation ? 'selected' : ''}>--slect representation--</option>
          <option value="Curve" ${menu.Parameters.Representation === 'Curve' ? 'selected' : ''}>Curve</option>
        </select>
      </div>
    </div>
    <div class="row table-padding col-sm-12">
      <div class="col-sm-2"><b>Explanation</b></div>
      <div class="col-sm-6"><textarea class="form-control" rows="4" id="ps-pu-explanation">${escapeHtml(menu.Parameters.PortfolioUncExplanation)}</textarea></div>
    </div>
    <div class="row table-padding col-sm-12">
      <div class="col-sm-6"><h4>Included Keys</h4></div>
      <div class="col-sm-6"><h4>Excluded Keys</h4></div>
      <div class="col-sm-6" style="overflow: auto;">
        <div class="list-of-templates"><ul class="list-group">
          ${includedKeys
            .map(
              (key) => `
          <li class="list-group-item"><div class="no-wrap">
            <a class="text-danger"><i class="fa fa-minus-square fa-lg" data-pu-remove-key="${escapeAttr(key)}"></i></a>
            ${escapeHtml((findKey(state.outputs)(key) || {}).Display)}
          </div></li>`
            )
            .join('')}
        </ul></div>
      </div>
      <div class="col-sm-6" style="overflow: auto;">
        <div class="list-of-templates"><ul class="list-group">
          ${availableKeys
            .map(
              (key) => `
          <li class="list-group-item"><div class="no-wrap">
            <a href="" class="text-success"><i class="fa fa-plus-square fa-lg" data-pu-add-key="${escapeAttr(key)}"></i></a>
            ${escapeHtml((findKey(state.outputs)(key) || {}).Display)}
          </div></li>`
            )
            .join('')}
        </ul></div>
      </div>
    </div>`;
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
        html = addTablesFormHtml(menu);
        break;
      case 'COMPARE_VALUE':
        html = compareValueFormHtml(menu);
        break;
      case 'COMPARE_UNCERTAINTY':
        html = compareUncertaintyFormHtml(menu);
        break;
      case 'INNOVATION_SCREEN':
        html = innovationScreenFormHtml(menu);
        break;
      case 'SCATTER_PLOT':
        html = scatterPlotFormHtml(menu);
        break;
      case 'CFO_CHART':
        html = cfoChartFormHtml(menu);
        break;
      case 'BUCKET_CHART':
        html = bucketChartFormHtml(menu);
        break;
      case 'PORTFOLIO_UNCERTAINTY':
        html = portfolioUncertaintyFormHtml(menu);
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
        wireAddTablesForm(formEl, menu);
        break;
      case 'COMPARE_VALUE':
        wireCompareValueForm(formEl, menu);
        break;
      case 'INNOVATION_SCREEN':
        wireInnovationScreenForm(formEl, menu);
        break;
      case 'SCATTER_PLOT':
        wireScatterPlotForm(formEl, menu);
        break;
      case 'CFO_CHART':
        wireCfoChartForm(formEl, menu);
        break;
      case 'BUCKET_CHART':
        wireBucketChartForm(formEl, menu);
        break;
      case 'PORTFOLIO_UNCERTAINTY':
        wirePortfolioUncertaintyForm(formEl, menu);
        break;
      default:
        break;
    }
  }

  function wireAddTablesForm(formEl) {
    formEl.querySelectorAll('[data-table-index]').forEach((el) => {
      el.addEventListener('click', (evt) => {
        evt.preventDefault();
        selectTable(state.tables[Number(el.getAttribute('data-table-index'))]);
        renderActionForm();
      });
    });
    const pnl = formEl.querySelector('#ps-add-tables-pnl');
    if (pnl) {
      pnl.addEventListener('change', (e) => {
        state.selectedMenu.Parameters.Pnl = e.target.checked;
        refreshSaveButton();
      });
    }
    const minEl = formEl.querySelector('#ps-min-precision');
    const maxEl = formEl.querySelector('#ps-max-precision');
    if (minEl) {
      minEl.addEventListener('input', (e) => {
        state.minPrecision = e.target.value === '' ? null : Number(e.target.value);
        changePrecisionOptions();
        refreshDefaultPrecisionOptions();
        refreshSaveButton();
      });
    }
    if (maxEl) {
      maxEl.addEventListener('input', (e) => {
        state.maxPrecision = e.target.value === '' ? null : Number(e.target.value);
        changePrecisionOptions();
        refreshDefaultPrecisionOptions();
        refreshSaveButton();
      });
    }
    const defPrec = formEl.querySelector('#ps-default-precision');
    if (defPrec) {
      defPrec.addEventListener('change', (e) => {
        state.selectedMenu.Parameters.DefaultPrecision = Number(e.target.value);
        refreshSaveButton();
      });
    }
    formEl.querySelectorAll('[data-special-key-index]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const i = Number(el.getAttribute('data-special-key-index'));
        state.selectedMenu.Parameters.Keys[i] = e.target.value;
        state.selectedMenu.Parameters.Units[i] = getOutputUnitFromKey(e.target.value);
        state.selectedMenu.Parameters.Titles[i] = getOutputDisplayFromKey(e.target.value);
        refreshSaveButton();
      });
    });
    if (state.selectedTable) {
      const idx = state.tables.indexOf(state.selectedTable);
      if (idx !== -1) {
        const listEl = formEl.querySelector('#ps-tables-list');
        const itemEl = formEl.querySelector(`#table${idx}`);
        if (listEl && itemEl) scrollElementIntoView(listEl, itemEl, 300);
      }
    }
  }

  function wireCompareValueForm(formEl, menu) {
    const total = formEl.querySelector('#ps-cv-total');
    if (total) total.addEventListener('change', (e) => { menu.Parameters.Total = e.target.checked; refreshSaveButton(); });
    const minEl = formEl.querySelector('#ps-cv-min');
    const maxEl = formEl.querySelector('#ps-cv-max');
    if (minEl) minEl.addEventListener('input', (e) => { menu.Parameters.Min = e.target.value === '' ? null : Number(e.target.value); refreshSaveButton(); });
    if (maxEl) maxEl.addEventListener('input', (e) => { menu.Parameters.Max = e.target.value === '' ? null : Number(e.target.value); refreshSaveButton(); });
    formEl.querySelectorAll('[data-cv-key-index]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const i = Number(el.getAttribute('data-cv-key-index'));
        menu.Parameters.Keys[i] = e.target.value;
        menu.Parameters.Units[i] = getOutputUnitFromKey(e.target.value);
        menu.Parameters.Titles[i] = getOutputDisplayFromKey(e.target.value);
        const unitInput = formEl.querySelector(`[data-cv-unit-index="${i}"]`);
        const titleInput = formEl.querySelector(`[data-cv-title-index="${i}"]`);
        if (unitInput) unitInput.value = menu.Parameters.Units[i];
        if (titleInput) titleInput.value = menu.Parameters.Titles[i];
        refreshSaveButton();
      });
    });
    formEl.querySelectorAll('[data-cv-unit-index]').forEach((el) => {
      el.addEventListener('input', (e) => { menu.Parameters.Units[Number(el.getAttribute('data-cv-unit-index'))] = e.target.value; refreshSaveButton(); });
    });
    formEl.querySelectorAll('[data-cv-title-index]').forEach((el) => {
      el.addEventListener('input', (e) => { menu.Parameters.Titles[Number(el.getAttribute('data-cv-title-index'))] = e.target.value; refreshSaveButton(); });
    });
    formEl.querySelectorAll('[data-cv-delete-index]').forEach((el) => {
      el.addEventListener('click', () => deleteCompareValueItem(Number(el.getAttribute('data-cv-delete-index'))));
    });
    const addBtn = formEl.querySelector('#ps-cv-add');
    if (addBtn) addBtn.addEventListener('click', addCompareValueItem);
  }

  function wireInnovationScreenForm(formEl, menu) {
    formEl.querySelectorAll('[data-is-xkey-index]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const i = Number(el.getAttribute('data-is-xkey-index'));
        const set = menu.Parameters.Sets[i];
        set.x = buildOutputFromKey(e.target.value);
        set.xTitle = getOutputDisplayFromKey(e.target.value);
        const xTitleInput = formEl.querySelector(`[data-is-xtitle-index="${i}"]`);
        if (xTitleInput) xTitleInput.value = set.xTitle;
        refreshSaveButton();
      });
    });
    formEl.querySelectorAll('[data-is-ykey-index]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const i = Number(el.getAttribute('data-is-ykey-index'));
        const set = menu.Parameters.Sets[i];
        set.y = buildOutputFromKey(e.target.value);
        set.yTitle = getOutputDisplayFromKey(e.target.value);
        const yTitleInput = formEl.querySelector(`[data-is-ytitle-index="${i}"]`);
        if (yTitleInput) yTitleInput.value = set.yTitle;
        refreshSaveButton();
      });
    });
    formEl.querySelectorAll('[data-is-xtitle-index]').forEach((el) => {
      el.addEventListener('input', (e) => { menu.Parameters.Sets[Number(el.getAttribute('data-is-xtitle-index'))].xTitle = e.target.value; refreshSaveButton(); });
    });
    formEl.querySelectorAll('[data-is-ytitle-index]').forEach((el) => {
      el.addEventListener('input', (e) => { menu.Parameters.Sets[Number(el.getAttribute('data-is-ytitle-index'))].yTitle = e.target.value; refreshSaveButton(); });
    });
    formEl.querySelectorAll('[data-is-vcutoff-index]').forEach((el) => {
      el.addEventListener('input', (e) => {
        menu.Parameters.Sets[Number(el.getAttribute('data-is-vcutoff-index'))].VerticalCutoff = e.target.value === '' ? null : Number(e.target.value);
        refreshSaveButton();
      });
    });
    formEl.querySelectorAll('[data-is-name-index]').forEach((el) => {
      el.addEventListener('input', (e) => { menu.Parameters.Sets[Number(el.getAttribute('data-is-name-index'))].name = e.target.value; refreshSaveButton(); });
    });
    formEl.querySelectorAll('[data-is-delete-index]').forEach((el) => {
      el.addEventListener('click', () => deleteInnovationScreenItem(Number(el.getAttribute('data-is-delete-index'))));
    });
    const addBtn = formEl.querySelector('#ps-is-add');
    if (addBtn) addBtn.addEventListener('click', addInnovationScreenItem);
  }

  function wireCfoChartForm(formEl, menu) {
    formEl.querySelectorAll('[data-cfo-xkey-index]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const i = Number(el.getAttribute('data-cfo-xkey-index'));
        const set = menu.Parameters.Sets[i];
        set.AverageCost = buildOutputFromKey(e.target.value);
        set.xTitle = getOutputDisplayFromKey(e.target.value);
        const xTitleInput = formEl.querySelector(`[data-cfo-xtitle-index="${i}"]`);
        if (xTitleInput) xTitleInput.value = set.xTitle;
        refreshSaveButton();
      });
    });
    formEl.querySelectorAll('[data-cfo-ykey-index]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const i = Number(el.getAttribute('data-cfo-ykey-index'));
        const set = menu.Parameters.Sets[i];
        set.AverageValueMinusCost = buildOutputFromKey(e.target.value);
        set.yTitle = getOutputDisplayFromKey(e.target.value);
        const yTitleInput = formEl.querySelector(`[data-cfo-ytitle-index="${i}"]`);
        if (yTitleInput) yTitleInput.value = set.yTitle;
        refreshSaveButton();
      });
    });
    formEl.querySelectorAll('[data-cfo-xtitle-index]').forEach((el) => {
      el.addEventListener('input', (e) => { menu.Parameters.Sets[Number(el.getAttribute('data-cfo-xtitle-index'))].xTitle = e.target.value; refreshSaveButton(); });
    });
    formEl.querySelectorAll('[data-cfo-ytitle-index]').forEach((el) => {
      el.addEventListener('input', (e) => { menu.Parameters.Sets[Number(el.getAttribute('data-cfo-ytitle-index'))].yTitle = e.target.value; refreshSaveButton(); });
    });
    formEl.querySelectorAll('[data-cfo-name-index]').forEach((el) => {
      el.addEventListener('input', (e) => { menu.Parameters.Sets[Number(el.getAttribute('data-cfo-name-index'))].name = e.target.value; refreshSaveButton(); });
    });
    formEl.querySelectorAll('[data-cfo-delete-index]').forEach((el) => {
      el.addEventListener('click', () => deleteCFOChartItem(Number(el.getAttribute('data-cfo-delete-index'))));
    });
    const addBtn = formEl.querySelector('#ps-cfo-add');
    if (addBtn) addBtn.addEventListener('click', addCFOChartItem);
  }

  function wireScatterPlotForm(formEl, menu) {
    const same = formEl.querySelector('#ps-sp-samescale');
    if (same) same.addEventListener('change', (e) => { menu.Parameters.SameScale = e.target.checked; refreshSaveButton(); });
    const minEl = formEl.querySelector('#ps-sp-min');
    const maxEl = formEl.querySelector('#ps-sp-max');
    if (minEl) minEl.addEventListener('input', (e) => { menu.Parameters.Min = e.target.value === '' ? null : Number(e.target.value); refreshSaveButton(); });
    if (maxEl) maxEl.addEventListener('input', (e) => { menu.Parameters.Max = e.target.value === '' ? null : Number(e.target.value); refreshSaveButton(); });
    formEl.querySelectorAll('[data-sp-xkey-index]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const i = Number(el.getAttribute('data-sp-xkey-index'));
        const set = menu.Parameters.Sets[i];
        set.x = buildOutputFromKey(e.target.value);
        set.xTitle = getOutputDisplayFromKey(e.target.value);
        const xTitleInput = formEl.querySelector(`[data-sp-xtitle-index="${i}"]`);
        if (xTitleInput) xTitleInput.value = set.xTitle;
        refreshSaveButton();
      });
    });
    formEl.querySelectorAll('[data-sp-ykey-index]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const i = Number(el.getAttribute('data-sp-ykey-index'));
        const set = menu.Parameters.Sets[i];
        set.y = buildOutputFromKey(e.target.value);
        set.yTitle = getOutputDisplayFromKey(e.target.value);
        const yTitleInput = formEl.querySelector(`[data-sp-ytitle-index="${i}"]`);
        if (yTitleInput) yTitleInput.value = set.yTitle;
        refreshSaveButton();
      });
    });
    formEl.querySelectorAll('[data-sp-xtitle-index]').forEach((el) => {
      el.addEventListener('input', (e) => { menu.Parameters.Sets[Number(el.getAttribute('data-sp-xtitle-index'))].xTitle = e.target.value; refreshSaveButton(); });
    });
    formEl.querySelectorAll('[data-sp-ytitle-index]').forEach((el) => {
      el.addEventListener('input', (e) => { menu.Parameters.Sets[Number(el.getAttribute('data-sp-ytitle-index'))].yTitle = e.target.value; refreshSaveButton(); });
    });
    formEl.querySelectorAll('[data-sp-name-index]').forEach((el) => {
      el.addEventListener('input', (e) => {
        const i = Number(el.getAttribute('data-sp-name-index'));
        const set = menu.Parameters.Sets[i];
        set.name = e.target.value;
        const wrapper = formEl.querySelector(`[data-sp-name-wrapper="${i}"]`);
        if (wrapper) {
          const hasError = (set.name === undefined || set.name === '') && menu.Parameters.Sets.length > 1;
          wrapper.classList.toggle('has-error', hasError);
        }
        refreshSaveButton();
      });
    });
    formEl.querySelectorAll('[data-sp-delete-index]').forEach((el) => {
      el.addEventListener('click', () => deleteScatterPlotItem(Number(el.getAttribute('data-sp-delete-index'))));
    });
    const addBtn = formEl.querySelector('#ps-sp-add');
    if (addBtn) addBtn.addEventListener('click', addScatterPlotItem);
  }

  function wireBucketChartForm(formEl, menu) {
    formEl.querySelectorAll('[data-bc-title-index]').forEach((el) => {
      el.addEventListener('input', (e) => {
        const i = Number(el.getAttribute('data-bc-title-index'));
        const s = menu.Parameters.Sets[i];
        s.Title = e.target.value;
        const wrapper = formEl.querySelector(`[data-bc-title-wrapper="${i}"]`);
        if (wrapper) wrapper.classList.toggle('has-error', (s.Title === undefined || s.Title === '') && menu.Parameters.Sets.length > 1);
        refreshSaveButton();
      });
    });
    formEl.querySelectorAll('[data-bc-counts-index]').forEach((el) => {
      el.addEventListener('change', (e) => { menu.Parameters.Sets[Number(el.getAttribute('data-bc-counts-index'))].Counts = e.target.value === 'true'; refreshSaveButton(); });
    });
    formEl.querySelectorAll('[data-bc-key-index]').forEach((el) => {
      el.addEventListener('change', (e) => { menu.Parameters.Sets[Number(el.getAttribute('data-bc-key-index'))].Key = e.target.value; refreshSaveButton(); });
    });
    formEl.querySelectorAll('[data-bc-xtitle-index]').forEach((el) => {
      el.addEventListener('input', (e) => { menu.Parameters.Sets[Number(el.getAttribute('data-bc-xtitle-index'))].xTitle = e.target.value; refreshSaveButton(); });
    });
    formEl.querySelectorAll('[data-bc-ytitle-index]').forEach((el) => {
      el.addEventListener('input', (e) => { menu.Parameters.Sets[Number(el.getAttribute('data-bc-ytitle-index'))].yTitle = e.target.value; refreshSaveButton(); });
    });
    formEl.querySelectorAll('[data-bc-numbuckets-index]').forEach((el) => {
      el.addEventListener('input', (e) => { state.numBuckets = e.target.value; });
    });
    formEl.querySelectorAll('[data-bc-low-index]').forEach((el) => {
      el.addEventListener('input', (e) => { state.bucketLow = e.target.value; });
    });
    formEl.querySelectorAll('[data-bc-high-index]').forEach((el) => {
      el.addEventListener('input', (e) => { state.bucketHigh = e.target.value; });
    });
    formEl.querySelectorAll('[data-bc-generate-index]').forEach((el) => {
      el.addEventListener('click', () => generateBuckets(Number(el.getAttribute('data-bc-generate-index'))));
    });
    formEl.querySelectorAll('[data-bc-makeeditable-index]').forEach((el) => {
      el.addEventListener('click', () => makeEditable(Number(el.getAttribute('data-bc-makeeditable-index'))));
    });
    formEl.querySelectorAll('[data-bc-addbucket-index]').forEach((el) => {
      el.addEventListener('click', () => addBucket(Number(el.getAttribute('data-bc-addbucket-index'))));
    });
    formEl.querySelectorAll('[data-bc-deletebucket-index]').forEach((el) => {
      el.addEventListener('click', () => deleteBucket(Number(el.getAttribute('data-bc-deletebucket-index'))));
    });
    formEl.querySelectorAll('[data-bc-stopediting-index]').forEach((el) => {
      el.addEventListener('click', () => stopEditing(Number(el.getAttribute('data-bc-stopediting-index'))));
    });
    formEl.querySelectorAll('[data-bc-deleteset-index]').forEach((el) => {
      el.addEventListener('click', () => deleteBucketSet(Number(el.getAttribute('data-bc-deleteset-index'))));
    });
    const addSetBtn = formEl.querySelector('#ps-bc-add-set');
    if (addSetBtn) addSetBtn.addEventListener('click', addBucketChartSet);

    formEl.querySelectorAll('[data-bucket-name-edit-toggle]').forEach((el) => {
      el.addEventListener('click', () => {
        const [si, bi] = el.getAttribute('data-bucket-name-edit-toggle').split(':').map(Number);
        toggleNameEdit(state.bucketManagers[si].editableBuckets[bi], si);
      });
    });
    formEl.querySelectorAll('[data-bucket-name-done]').forEach((el) => {
      el.addEventListener('click', () => {
        const [si, bi] = el.getAttribute('data-bucket-name-done').split(':').map(Number);
        toggleNameEdit(state.bucketManagers[si].editableBuckets[bi], si);
      });
    });
    formEl.querySelectorAll('[data-bucket-name-edit]').forEach((el) => {
      el.addEventListener('input', (e) => {
        const [si, bi] = el.getAttribute('data-bucket-name-edit').split(':').map(Number);
        state.bucketManagers[si].editableBuckets[bi].Name = e.target.value;
        refreshSaveButton();
      });
    });
    formEl.querySelectorAll('[data-bucket-rules-edit-toggle]').forEach((el) => {
      el.addEventListener('click', () => {
        const [si, bi] = el.getAttribute('data-bucket-rules-edit-toggle').split(':').map(Number);
        toggleRuleEdit(state.bucketManagers[si].editableBuckets[bi], si);
      });
    });
    formEl.querySelectorAll('[data-bucket-rules-done]').forEach((el) => {
      el.addEventListener('click', () => {
        const [si, bi] = el.getAttribute('data-bucket-rules-done').split(':').map(Number);
        toggleRuleEdit(state.bucketManagers[si].editableBuckets[bi], si);
      });
    });
    formEl.querySelectorAll('[data-bucket-rule1-type]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const [si, bi] = el.getAttribute('data-bucket-rule1-type').split(':').map(Number);
        state.bucketManagers[si].editableBuckets[bi].rule1Type = RULE1_OPTIONS.find((o) => o.Value === e.target.value) || '';
        renderActionForm();
      });
    });
    formEl.querySelectorAll('[data-bucket-rule2-type]').forEach((el) => {
      el.addEventListener('change', (e) => {
        const [si, bi] = el.getAttribute('data-bucket-rule2-type').split(':').map(Number);
        state.bucketManagers[si].editableBuckets[bi].rule2Type = RULE2_OPTIONS.find((o) => o.Value === e.target.value) || '';
        renderActionForm();
      });
    });
    formEl.querySelectorAll('[data-bucket-rule1-value]').forEach((el) => {
      el.addEventListener('input', (e) => {
        const [si, bi] = el.getAttribute('data-bucket-rule1-value').split(':').map(Number);
        state.bucketManagers[si].editableBuckets[bi].rule1Value = e.target.value;
        refreshSaveButton();
      });
    });
    formEl.querySelectorAll('[data-bucket-rule2-value]').forEach((el) => {
      el.addEventListener('input', (e) => {
        const [si, bi] = el.getAttribute('data-bucket-rule2-value').split(':').map(Number);
        state.bucketManagers[si].editableBuckets[bi].rule2Value = e.target.value;
        refreshSaveButton();
      });
    });
  }

  function wirePortfolioUncertaintyForm(formEl, menu) {
    const mvs = formEl.querySelector('#ps-pu-mvstype');
    if (mvs) mvs.addEventListener('change', (e) => { menu.Parameters.MVSType = e.target.value; refreshSaveButton(); });
    const source = formEl.querySelector('#ps-pu-source');
    if (source) {
      source.addEventListener('change', (e) => {
        menu.Parameters.Source = e.target.value;
        renderActionForm();
      });
    }
    const rep = formEl.querySelector('#ps-pu-representation');
    if (rep) rep.addEventListener('change', (e) => { menu.Parameters.Representation = e.target.value; refreshSaveButton(); });
    const explanation = formEl.querySelector('#ps-pu-explanation');
    if (explanation) explanation.addEventListener('input', (e) => { menu.Parameters.PortfolioUncExplanation = e.target.value; refreshSaveButton(); });
    formEl.querySelectorAll('[data-pu-remove-key]').forEach((el) => {
      el.addEventListener('click', () => {
        removeFromIncludedKeys(el.getAttribute('data-pu-remove-key'));
        renderActionForm();
      });
    });
    formEl.querySelectorAll('[data-pu-add-key]').forEach((el) => {
      el.addEventListener('click', (evt) => {
        evt.preventDefault();
        addToRollupKeys(el.getAttribute('data-pu-add-key'));
        renderActionForm();
      });
    });
  }

  // ---- rendering: bottom bar / modals ----

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
    if (!state.portfolioStructure) {
      if (state.loadError) {
        container.innerHTML = `
${appNavHtml({ active: 'portfolioStructure', isAdmin: state.isAdmin, selectedTemplate: state.selectedTemplate })}
<div class="container-fluid">
  <div class="alert alert-danger" role="alert">
    <b>Portfolio structure could not be loaded.</b>
    <div>${escapeHtml(state.loadError)}</div>
  </div>
  <button type="button" class="btn btn-primary" id="ps-load-retry">Retry</button>
</div>`;
        container.querySelector('#ps-load-retry').addEventListener('click', getPortfolioStructure);
        return;
      }
      container.innerHTML = `
${appNavHtml({ active: 'portfolioStructure', isAdmin: state.isAdmin, selectedTemplate: state.selectedTemplate })}
${loadingOverlayHtml('Loading portfolio structure')}`;
      return;
    }

    container.innerHTML = `
${appNavHtml({ active: 'portfolioStructure', isAdmin: state.isAdmin, selectedTemplate: state.selectedTemplate })}
<div class="select-template fadeIn" style="height: calc(100% - 100px)">
  <div class="choose-from" style="height: calc(100% - 260px)">
    <div class="select-template-title"><h4>${state.isPlatform ? 'Platform Portfolio Structure' : 'Portfolio Structure'}</h4></div>
    <div class="select-template-title">
      <input type="text" class="form-control" id="ps-search" placeholder="Search" value="${escapeAttr(state.searchText)}">
    </div>
    <div class="panel panel-primary" style="height: 100%">
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

  render();
  getPortfolioStructure();
  getPotentialTables();
  getAppStructure();

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
    clearNavigationGuard();
  };
}
