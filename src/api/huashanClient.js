/*
 * Ported from huashan.service.ts. Talks to the REST CalcEngine's
 * `wizard/main` command endpoint. Every command is a GET (BasicCommand) or a
 * POST (TemplatePostCommand) built from the same querystring shape:
 *   {server}/wizard/main?command={name}&kreds={kreds}&...extra params
 * and returns `{ msg, status, result, credentials }`, matching the shape the
 * original Angular services returned so the ported controllers/views can be
 * translated close to line-for-line.
 */
import { WIZARD_URL, FILE_UPLOAD_URL, TOKEN_KEY } from '../core/config.js';
import { TheUte } from '../core/textUtils.js';
import { hex_md5 } from '../lib/md5.js';

function authHeaders(extra = {}) {
  return {
    Authorization: 'jwttoken ' + (localStorage.getItem(TOKEN_KEY) || ''),
    ...extra,
  };
}

function storeTokenIfPresent(payload) {
  if (payload && payload.token) {
    localStorage.setItem(TOKEN_KEY, payload.token);
  }
}

/** Parses the `{commands: [...]}` envelope from a GET (BasicCommand) response. */
function parseGetResponse(kreds, payload) {
  storeTokenIfPresent(payload);
  const answer = { msg: '', status: false, result: null, credentials: kreds };
  const first = payload.commands[0];
  if (first.name === 'Alert') {
    answer.msg = TheUte.unravel(first.parameters[0].value);
  } else if (first.parameters[1].value === '1') {
    const unravelled = TheUte.unravel(first.parameters[0].value);
    // Preserves the original quirk: only attempt JSON.parse when the
    // unravelled payload looks array-ish; otherwise keep it as a raw string
    // (JSON.parse(JSON.stringify(str)) round-trips to the same string).
    answer.result = unravelled.indexOf('[') === -1 ? unravelled : JSON.parse(unravelled);
    answer.status = true;
  }
  return answer;
}

/** Parses the `{commands: [...]}` envelope from a POST (TemplatePostCommand) response. */
function parsePostResponse(kreds, payload) {
  storeTokenIfPresent(payload);
  const answer = { msg: '', status: false, result: null, credentials: kreds };
  const first = payload.commands[0];
  if (first.name === 'Alert') {
    answer.msg = TheUte.unravel(first.parameters[0].value);
  } else if (first.parameters[1].value === '1') {
    answer.result = TheUte.unravel(first.parameters[0].value);
    answer.status = true;
  }
  return answer;
}

async function getCommand(kreds, params) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${WIZARD_URL}${qs}`, {
    method: 'GET',
    headers: authHeaders(),
  });
  const payload = await res.json();
  return parseGetResponse(kreds, payload);
}

async function postCommand(kreds, params, data) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${WIZARD_URL}${qs}`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  const payload = await res.json();
  return parsePostResponse(kreds, payload);
}

function makeKreds(username, password) {
  return TheUte.pack(`${username}_${hex_md5(password)}`);
}

export const huashan = {
  auth(username, password) {
    const kreds = makeKreds(username, password);
    return getCommand(kreds, { command: 'Auth', kreds });
  },

  getTemplates(kreds) {
    return getCommand(kreds, { command: 'GetTemplates', kreds });
  },

  getAstroTemplates(kreds) {
    return getCommand(kreds, { command: 'GetAstroTemplates', kreds });
  },

  getArchivedAstroTemplates(kreds) {
    return getCommand(kreds, { command: 'GetArchivedAstroTemplates', kreds });
  },

  listDeletedTemplates(kreds) {
    return getCommand(kreds, { command: 'ListDeletedTemplates', kreds });
  },

  findAssociatedPortfolios(kreds, templateName) {
    return getCommand(kreds, { command: 'FindAssociatedPortfolios', kreds, templateName });
  },

  updateDataStructure(kreds, portfolioName, leaf, platform) {
    return getCommand(kreds, {
      command: 'UpdateDataStructure',
      kreds,
      portfolioName,
      runLeaf: leaf,
      runPlatform: platform,
    });
  },

  getTemplateJsonFiles(kreds, templateName) {
    return getCommand(kreds, { command: 'GetTemplateJsonFiles', kreds, templateName });
  },

  getIncludedDataStructureComponents(kreds, templateName, isPlatform) {
    return getCommand(kreds, { command: 'GetDataStructure', kreds, templateName, isPlatform });
  },

  getExcludedDataStructureComponents(kreds, templateName, isPlatform) {
    return getCommand(kreds, { command: 'GetExcludedDataStructureComponents', kreds, templateName, isPlatform });
  },

  getAppStructure(kreds, templateName, isPlatform) {
    return getCommand(kreds, { command: 'GetAppStructure', kreds, templateName, isPlatform });
  },

  getPortfolioStructure(kreds, templateName, isPlatform) {
    return getCommand(kreds, { command: 'GetPortfolioStructure', kreds, templateName, isPlatform });
  },

  getPotentialTables(kreds, templateName) {
    return getCommand(kreds, { command: 'GetPotentialTables', kreds, templateName });
  },

  getCharts(kreds, templateName) {
    return getCommand(kreds, { command: 'GetCharts', kreds, templateName });
  },

  getRevisions(kreds, templateName) {
    return getCommand(kreds, { command: 'GetRevisions', kreds, templateName });
  },

  syncTemplate(kreds, templateName) {
    return getCommand(kreds, { command: 'SyncTemplate', kreds, templateName });
  },

  renameTemplate(kreds, templateName, newTemplateName) {
    return getCommand(kreds, { command: 'RenameTemplate', kreds, templateName, newTemplateName });
  },

  deleteTemplate(kreds, templateName) {
    return getCommand(kreds, { command: 'DeleteTemplate', kreds, templateName });
  },

  undeleteTemplate(kreds, templateName) {
    return getCommand(kreds, { command: 'UndeleteTemplate', kreds, templateName });
  },

  ogreMakeTemplate(kreds, templateName, modelName) {
    return getCommand(kreds, { command: 'MakeTemplate', kreds, templateName, modelName });
  },

  saveTemplateInfo(kreds, templateName, data, isPlatform) {
    return postCommand(kreds, { command: 'SaveTemplateInfo', kreds, templateName, isPlatform }, data);
  },

  saveTemplateJsonFiles(kreds, templateName, data, isPlatform) {
    return postCommand(kreds, { command: 'SaveTemplateJSON', kreds, templateName, isPlatform }, data);
  },

  saveDataStructure(kreds, templateName, data, isPlatform) {
    return postCommand(kreds, { command: 'SaveDataStructure', kreds, templateName, isPlatform }, data);
  },

  saveAppStructure(kreds, templateName, data, isPlatform) {
    return postCommand(kreds, { command: 'SaveAppStructure', kreds, templateName, isPlatform }, data);
  },

  savePortfolioStructure(kreds, templateName, data, isPlatform) {
    return postCommand(kreds, { command: 'SavePortfolioStructure', kreds, templateName, isPlatform }, data);
  },

  switchRevisionByCommitHash(kreds, templateName, data, isPlatform) {
    return postCommand(kreds, { command: 'SwitchRevisionByCommitHash', kreds, templateName, isPlatform }, data);
  },

  compareJsonFiles(kreds, templateName, data, isPlatform) {
    return postCommand(kreds, { command: 'CompareJsonFiles', kreds, templateName, isPlatform }, data);
  },

  async uploadFile(kreds, fileName, file) {
    const formData = new FormData();
    formData.append('kreds', kreds);
    formData.append('file', file);
    const res = await fetch(FILE_UPLOAD_URL, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    });
    return res.json();
  },
};
