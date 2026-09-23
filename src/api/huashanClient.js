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
import { getRouteSignal } from '../core/router.js';
import { TheUte } from '../core/textUtils.js';
import { hex_md5 } from '../lib/md5.js';

const COMMAND_TIMEOUT_MS = 30_000;
const UPLOAD_TIMEOUT_MS = 120_000;
const MAX_ERROR_DETAIL_LENGTH = 300;

export class HuashanApiError extends Error {
  constructor(message, { code = 'API_ERROR', status = 0, cause } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = 'HuashanApiError';
    this.code = code;
    this.status = status;
  }
}

export function isRequestAborted(error) {
  return error instanceof HuashanApiError && error.code === 'REQUEST_ABORTED';
}

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

function responseDetail(text) {
  if (!text) return '';
  let detail = text;
  try {
    const payload = JSON.parse(text);
    detail = payload.message || payload.msg || payload.error || text;
  } catch (error) {
    // Keep plain-text responses, but remove markup from proxy/server error pages.
    detail = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  if (typeof detail !== 'string') detail = JSON.stringify(detail);
  return detail.length > MAX_ERROR_DETAIL_LENGTH
    ? `${detail.slice(0, MAX_ERROR_DETAIL_LENGTH)}...`
    : detail;
}

async function requestJson(url, options, operation, timeoutMs = COMMAND_TIMEOUT_MS) {
  const controller = new AbortController();
  const routeSignal = getRouteSignal();
  let timedOut = false;
  const abortForNavigation = () => controller.abort();
  if (routeSignal) {
    if (routeSignal.aborted) controller.abort();
    else routeSignal.addEventListener('abort', abortForNavigation, { once: true });
  }
  const timeout = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) localStorage.removeItem(TOKEN_KEY);
      const detail = responseDetail(text);
      throw new HuashanApiError(
        `${operation} failed with HTTP ${response.status}${detail ? `: ${detail}` : ''}`,
        { code: 'HTTP_ERROR', status: response.status }
      );
    }

    if (!text.trim()) {
      throw new HuashanApiError(`${operation} returned an empty response.`, {
        code: 'EMPTY_RESPONSE',
        status: response.status,
      });
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      throw new HuashanApiError(`${operation} returned invalid JSON.`, {
        code: 'INVALID_JSON',
        status: response.status,
        cause: error,
      });
    }
  } catch (error) {
    if (error instanceof HuashanApiError) throw error;
    if (error.name === 'AbortError') {
      if (!timedOut && routeSignal && routeSignal.aborted) {
        throw new HuashanApiError(`${operation} was cancelled.`, {
          code: 'REQUEST_ABORTED',
          cause: error,
        });
      }
      throw new HuashanApiError(`${operation} timed out after ${Math.round(timeoutMs / 1000)} seconds.`, {
        code: 'TIMEOUT',
        cause: error,
      });
    }
    throw new HuashanApiError(`${operation} could not reach the server: ${error.message || 'Network error'}`, {
      code: 'NETWORK_ERROR',
      cause: error,
    });
  } finally {
    window.clearTimeout(timeout);
    if (routeSignal) routeSignal.removeEventListener('abort', abortForNavigation);
  }
}

function commandFromPayload(payload, operation) {
  if (!payload || typeof payload !== 'object' || !Array.isArray(payload.commands) || payload.commands.length === 0) {
    throw new HuashanApiError(`${operation} returned an invalid command envelope.`, {
      code: 'INVALID_ENVELOPE',
    });
  }

  const command = payload.commands[0];
  if (
    !command ||
    typeof command !== 'object' ||
    typeof command.name !== 'string' ||
    !Array.isArray(command.parameters)
  ) {
    throw new HuashanApiError(`${operation} returned an invalid command result.`, {
      code: 'INVALID_COMMAND',
    });
  }
  return command;
}

function parameterValue(command, index, operation) {
  const parameter = command.parameters[index];
  if (!parameter || !Object.prototype.hasOwnProperty.call(parameter, 'value')) {
    throw new HuashanApiError(`${operation} response is missing parameter ${index}.`, {
      code: 'INVALID_COMMAND',
    });
  }
  return parameter.value;
}

function decodeValue(value, operation) {
  try {
    return TheUte.unravel(value);
  } catch (error) {
    throw new HuashanApiError(`${operation} returned a value that could not be decoded.`, {
      code: 'DECODE_ERROR',
      cause: error,
    });
  }
}

function parseStructuredResult(value, operation) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return value;
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    throw new HuashanApiError(`${operation} returned malformed JSON in its result.`, {
      code: 'INVALID_RESULT',
      cause: error,
    });
  }
}

/** Parses the `{commands: [...]}` envelope from a GET (BasicCommand) response. */
function parseGetResponse(kreds, payload, operation) {
  storeTokenIfPresent(payload);
  const answer = { msg: '', status: false, result: null, credentials: kreds };
  const first = commandFromPayload(payload, operation);
  const unravelled = decodeValue(parameterValue(first, 0, operation), operation);
  if (first.name === 'Alert') {
    answer.msg = unravelled;
  } else if (String(parameterValue(first, 1, operation)) === '1') {
    // Revision history is newline-delimited JSON, not one JSON document.
    // Its consumers split and parse each line independently.
    answer.result = operation === 'GetRevisions' ? unravelled : parseStructuredResult(unravelled, operation);
    answer.status = true;
  } else {
    answer.msg = unravelled || `${operation} failed.`;
  }
  return answer;
}

/** Parses the `{commands: [...]}` envelope from a POST (TemplatePostCommand) response. */
function parsePostResponse(kreds, payload, operation) {
  storeTokenIfPresent(payload);
  const answer = { msg: '', status: false, result: null, credentials: kreds };
  const first = commandFromPayload(payload, operation);
  const unravelled = decodeValue(parameterValue(first, 0, operation), operation);
  if (first.name === 'Alert') {
    answer.msg = unravelled;
  } else if (String(parameterValue(first, 1, operation)) === '1') {
    answer.result = unravelled;
    answer.status = true;
  } else {
    answer.msg = unravelled || `${operation} failed.`;
  }
  return answer;
}

async function getCommand(kreds, params) {
  const operation = params.command || 'Wizard request';
  const qs = new URLSearchParams(params).toString();
  const payload = await requestJson(`${WIZARD_URL}${qs}`, {
    method: 'GET',
    headers: authHeaders(),
  }, operation);
  return parseGetResponse(kreds, payload, operation);
}

async function postCommand(kreds, params, data) {
  const operation = params.command || 'Wizard request';
  const qs = new URLSearchParams(params).toString();
  const payload = await requestJson(`${WIZARD_URL}${qs}`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  }, operation);
  return parsePostResponse(kreds, payload, operation);
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
    return requestJson(FILE_UPLOAD_URL, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    }, `Upload ${fileName}`, UPLOAD_TIMEOUT_MS);
  },
};
