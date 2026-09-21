/* Ported from revisionsController.ts + views/revisions.html. */
import { huashan } from '../../api/huashanClient.js';
import { session, restoreSession } from '../../core/session.js';
import { SERVER_URL, TOKEN_KEY } from '../../core/config.js';
import { appNavHtml } from '../../components/appNav.js';
import { accordionGroupHtml, initAccordions } from '../../components/accordion.js';
import { initTooltips } from '../../components/bootstrapUI.js';
import { escapeHtml } from '../../core/html.js';

function stringify(jsonObject) {
  return JSON.stringify(jsonObject, undefined, 2);
}

function customDateFormat(input) {
  if (!input) return '';
  const date = new Date(input);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month < 10 ? '0' : ''}${month}/${day < 10 ? '0' : ''}${day}/${year}`;
}

function getIsAdmin() {
  try {
    const infoGot = localStorage.getItem('INFO');
    if (!infoGot) return false;
    return !!JSON.parse(atob(infoGot)).is_admin;
  } catch (e) {
    return false;
  }
}

const DISPLAY_NAMES = {
  appStructure: 'App Structure',
  dataStructure: 'Data Structure',
  portfolio: 'Portfolio Structure',
  platformAppStructure: 'Platform App Structure',
  platformDataStructure: 'Platform Data Structure',
  platformPortfolio: 'Platform Portfolio Structure',
};

function getDisplayNameBy(fileName) {
  if (!fileName) return 'fileName is not exit.';
  const key = fileName.split('_')[1].split('.')[0];
  return key in DISPLAY_NAMES ? DISPLAY_NAMES[key] : 'no match name!';
}

export function mount(container, params) {
  if (!restoreSession()) return () => {};

  const state = {
    selectedTemplate: params.templateID,
    isAdmin: getIsAdmin(),
    re: null,
    selectedRevisionIndex: null,
    selectedRevisionCompareIndex: null,
    jsonData: null,
    jsonCompareResult: null,
    templateGot: {},
    alerts: [],
  };

  function addAlert(msg) {
    state.alerts.push({ type: 'danger', msg });
    console.error(msg);
  }

  function platformExists() {
    return (
      state.jsonData !== null &&
      state.jsonData.platformDataStructure !== undefined &&
      state.jsonData.platformDataStructure.indexOf('Does not exist') === -1
    );
  }

  function render() {
    const revisions = (state.re && state.re.revisionLogs) || [];
    const selectedRevision = state.selectedRevisionIndex != null ? revisions[state.selectedRevisionIndex] : null;
    const selectedRevisionCompare =
      state.selectedRevisionCompareIndex != null ? revisions[state.selectedRevisionCompareIndex] : null;

    container.innerHTML = `
${appNavHtml({ active: 'revisions', isAdmin: state.isAdmin, selectedTemplate: state.selectedTemplate })}
<div class="select-template animated fadeIn" style="height: 100%">
  <div id="choose-from" style="height: 100%">
    <div class="select-template-title"><h4><b>Revision History</b></h4></div>
    <div class="panel panel-primary" style="height: calc(100% - 260px)">
      <div class="list-of-templates height-for-list" style="height: 100%">
        <div class="list-group" id="revisons-list">
          ${revisions
            .map(
              (revision, i) => `
          <a href="" class="list-group-item cursor-move" data-revision-index="${i}"
             style="${i === state.selectedRevisionIndex || i === state.selectedRevisionCompareIndex ? 'background-color:#f5f5f5;' : ''}">
            <table>
              <tr><td colspan="2" class="appStructList no-wrap">${escapeHtml(revision.commitMessage)}</td></tr>
              <tr>
                <td class="appStructList no-wrap">${escapeHtml(revision.relativeTime)}</td>
                <td class="appStructList no-wrap">${escapeHtml(revision.committer)}</td>
              </tr>
            </table>
          </a>`
            )
            .join('')}
        </div>
      </div>
    </div>
    <div>
      <button class="btn btn-info pull-left" id="compare-btn" title="Compare" data-toggle="tooltip"
              ${selectedRevisionCompare != null ? '' : 'hidden'}>Compare</button>
    </div>
  </div>

  <div id="selected-template">
    <div class="select-template-title" style="padding-left: 15px"><h4><b>Revision Details</b></h4></div>
    <div class="panel panel-default panel-body" style="padding-left: 15px; margin-left: 13px; margin-right: 13px">
      ${
        selectedRevision
          ? `<div><b>${escapeHtml(selectedRevision.committer)}</b> saved changes on <b>${customDateFormat(selectedRevision.timeStamp)}</b>;
              &nbsp; Commit Message: ${escapeHtml(selectedRevision.commitMessage)};
              &nbsp; GUID: ${escapeHtml(selectedRevision.commitNum)}</div>`
          : ''
      }
    </div>

    ${
      state.jsonCompareResult != null && selectedRevisionCompare != null
        ? `<div class="select-template-title" style="padding-left: 15px"><h4><b>Compare Result</b></h4></div>
           ${state.jsonCompareResult.map((js) => renderCompareEntry(js)).join('')}`
        : ''
    }

    <div id="revision-json">
      ${
        state.jsonData
          ? `
      <div class="col-sm-4">
        ${accordionGroupHtml({ id: 'rds', heading: 'Data Structure', bodyHtml: `<textarea class="json-container" readonly>${escapeHtml(state.jsonData.dataStructure)}</textarea>` })}
        ${platformExists() ? accordionGroupHtml({ id: 'rpds', heading: 'Platform Data Structure', bodyHtml: `<textarea class="json-container" readonly>${escapeHtml(state.jsonData.platformDataStructure)}</textarea>` }) : ''}
      </div>
      <div class="col-sm-4">
        ${accordionGroupHtml({ id: 'ras', heading: 'App Structure', bodyHtml: `<textarea class="json-container" readonly>${escapeHtml(state.jsonData.appStructure)}</textarea>` })}
        ${platformExists() ? accordionGroupHtml({ id: 'rpas', heading: 'Platform App Structure', bodyHtml: `<textarea class="json-container" readonly>${escapeHtml(state.jsonData.platformAppStructure)}</textarea>` }) : ''}
      </div>
      <div class="col-sm-4">
        ${accordionGroupHtml({ id: 'rps', heading: 'Portfolio Structure', bodyHtml: `<textarea class="json-container" readonly>${escapeHtml(state.jsonData.portfolioStructure)}</textarea>` })}
        ${platformExists() ? accordionGroupHtml({ id: 'rpps', heading: 'Platform Portfolio Structure', bodyHtml: `<textarea class="json-container" readonly>${escapeHtml(state.jsonData.platformPortfolioStructure)}</textarea>` }) : ''}
      </div>`
          : ''
      }
    </div>
  </div>
</div>`;

    initAccordions(container);
    initTooltips(container);

    container.querySelectorAll('[data-revision-index]').forEach((el) => {
      el.addEventListener('click', (evt) => {
        evt.preventDefault();
        const i = Number(el.getAttribute('data-revision-index'));
        clickItem(evt, revisions[i].commitNum, i);
      });
    });

    const compareBtn = container.querySelector('#compare-btn');
    if (compareBtn) {
      compareBtn.addEventListener('click', () => compareJsonFiles(selectedRevision, selectedRevisionCompare));
    }
  }

  function renderCompareEntry(js) {
    const show =
      js.values_changed || js.iterable_item_added || js.iterable_item_removed || js.dictionary_item_added || js.dictionary_item_removed;
    if (!show) return '';
    const section = (title, items) =>
      items
        ? `<h5 style="padding-left: 20px">${title}:</h5>
      <ul class="json-container-revision" style="padding-left: 45px">
        ${items
          .map(
            (item) => `<li>
          <b>${escapeHtml(item.path)}</b>
          ${item.key ? `<div>Key: <b>${escapeHtml(item.key)}</b></div>` : ''}
          <div style="padding-left: 25px">Current Version:</div>
          <textarea class="revision-text" readonly>${escapeHtml(item.result && item.result.currentValue)}</textarea>
          <div style="padding-left: 25px">Compared Version:</div>
          <textarea class="revision-text" readonly>${escapeHtml(item.result && item.result.comparedValue)}</textarea>
        </li>`
          )
          .join('')}
      </ul>`
        : '';

    return `
    <div class="panel panel-default panel-body" style="padding-left: 15px; margin-left: 13px; margin-right: 13px">
      <h4 style="color: #3383bb;">${escapeHtml(getDisplayNameBy(js.fileName))}</h4>
      ${section('Values Changed', js.values_changed)}
      ${section('Iterable Item Added', js.iterable_item_added)}
      ${section('Iterable Item Removed', js.iterable_item_removed)}
      ${section('Dictionary Item Added', js.dictionary_item_added)}
      ${section('Dictionary Item Removed', js.dictionary_item_removed)}
    </div>`;
  }

  async function getTemplateData() {
    try {
      const res = await fetch(`${SERVER_URL}/domain/astro-templates/${params.templateID}`, {
        headers: { Authorization: 'jwttoken ' + (localStorage.getItem(TOKEN_KEY) || '') },
      });
      const body = await res.json();
      if (body.token) localStorage.setItem(TOKEN_KEY, body.token);
      if (body.data.status === 1) {
        state.templateGot = body.data.template;
        await getRevisions();
      } else {
        addAlert(body.data.message);
      }
    } catch (err) {
      addAlert(err);
    }
  }

  async function getRevisions() {
    try {
      const response = await huashan.getRevisions(session.getCredentials(), params.templateID);
      if (response.status) {
        const temLog = response.result.split('\n').map((item) => JSON.parse(item));
        state.re = { revisionLogs: temLog };
        let revisionIndex = state.re.revisionLogs.findIndex(
          (t) => t.commitNum === (state.templateGot.history && state.templateGot.history.guid)
        );
        if (revisionIndex === -1 && state.re.revisionLogs.length > 0) revisionIndex = 0;
        state.selectedRevisionIndex = revisionIndex === -1 ? null : revisionIndex;
        await getTemplateJsonFiles();
      } else {
        addAlert(response.msg);
      }
      render();
    } catch (err) {
      console.error(err);
    }
  }

  function selectRevision(commitNumber, index) {
    state.selectedRevisionIndex = index;
    switchRevisionByCommitHash(commitNumber);
  }

  async function switchRevisionByCommitHash(commitHash) {
    try {
      await huashan.switchRevisionByCommitHash(session.getCredentials(), params.templateID, { commitHash });
      state.selectedTemplate = params.templateID;
      await getTemplateJsonFiles();
      render();
    } catch (err) {
      console.error(err);
    }
  }

  async function getTemplateJsonFiles() {
    const response = await huashan.getTemplateJsonFiles(session.getCredentials(), params.templateID);
    setData(response.result);
  }

  function setData(jsonFiles) {
    state.jsonData = {
      name: state.selectedTemplate,
      hasPlatform: jsonFiles.appStructure.Platform,
      dataStructure: stringify(jsonFiles.dataStructure),
      appStructure: stringify(jsonFiles.appStructure),
      portfolioStructure: stringify(jsonFiles.portfolioStructure),
      platformDataStructure: stringify(jsonFiles.platformDataStructure),
      platformAppStructure: stringify(jsonFiles.platformAppStructure),
      platformPortfolioStructure: stringify(jsonFiles.platformPortfolioStructure),
    };
  }

  function clickItem(evt, commitNum, index) {
    state.jsonCompareResult = null;
    if (evt.metaKey || evt.ctrlKey || evt.shiftKey) {
      state.selectedRevisionCompareIndex = index;
      render();
    } else {
      const confirmed = confirm('Are you sure to switch to different revision of the template? (You can revert back anytime)');
      if (confirmed) {
        state.selectedRevisionCompareIndex = null;
        selectRevision(commitNum, index);
        render();
      }
    }
  }

  async function compareJsonFiles(selectedRevision, selectedRevisionCompare) {
    try {
      const response = await huashan.compareJsonFiles(session.getCredentials(), params.templateID, {
        selectedRevision,
        selectedRevisionCompare,
      });
      const temp = response.result.split('\n').map((item) => JSON.parse(item));
      state.jsonCompareResult = temp[0];
      render();
    } catch (err) {
      console.error(err);
    }
  }

  getTemplateData();
  render();

  return () => {};
}
