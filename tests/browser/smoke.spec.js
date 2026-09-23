import { expect, test } from '@playwright/test';

const TEMPLATE = 'SmokeTemplate';
const SECRET = '0123456789abcdef0123456789abcdef';

function pack(value) {
  return encodeURIComponent(Buffer.from(value, 'binary').toString('base64'));
}

function commandEnvelope(result) {
  const value = typeof result === 'string' ? result : JSON.stringify(result);
  return {
    commands: [{ name: 'Result', parameters: [{ value: pack(value) }, { value: '1' }] }],
  };
}

const dataStructure = {
  ID: 'smoke-data',
  Description: 'Smoke data structure',
  ExcelFile: 'SmokeTemplate.xlsx',
  Inputs: [{ CellLink: "Sheet1!Input", Key: 'Input', Display: 'Input', Type: 'SCALAR', Val: 0, Units: '' }],
  Outputs: [{ CellLink: "Sheet1!Output", Key: 'Output', Display: 'Output', Units: '' }],
};

const appStructure = {
  MENU: [{
    ID: 'input-screen',
    Display: 'Inputs',
    Command: 'INPUT_SCREEN',
    Parameters: { InputKeys: [] },
  }],
  PostProcessingOutputsForPortfolio: [],
};

const portfolioStructure = {
  MENU: [{
    ID: 'compare-value',
    Display: 'Compare Value',
    Command: 'COMPARE_VALUE',
    Parameters: { Keys: [], PrecisionOptions: [], DefaultPrecision: 0, Total: false },
  }],
};

const templateJson = {
  dataStructure,
  appStructure,
  portfolioStructure,
  platformDataStructure: 'Does not exist',
  platformAppStructure: 'Does not exist',
  platformPortfolioStructure: 'Does not exist',
};

function commandResult(command) {
  const results = {
    GetAstroTemplates: [{ name: TEMPLATE, history: { guid: 'commit-1' }, groups: [] }],
    FindAssociatedPortfolios: ['Smoke Portfolio'],
    GetRevisions: JSON.stringify({
      commitNum: 'commit-1',
      commitMessage: 'Smoke revision',
      committer: 'Smoke User',
      relativeTime: 'now',
      timeStamp: '2026-01-01T00:00:00Z',
    }),
    GetDataStructure: dataStructure,
    GetExcludedDataStructureComponents: { Excluded: { Inputs: [], Outputs: [] } },
    GetAppStructure: appStructure,
    GetPortfolioStructure: portfolioStructure,
    GetPotentialTables: { PotentialTableOutputs: [] },
    GetCharts: { Charts: [] },
    GetTemplateJsonFiles: templateJson,
  };
  if (!(command in results)) throw new Error(`Unhandled Wizard command: ${command}`);
  return results[command];
}

async function mockBackend(page) {
  await page.route('**/kirk/**', async (route) => {
    const url = new URL(route.request().url());

    if (url.pathname === '/kirk/framework/admin/group/list') {
      await route.fulfill({ json: { token: 'smoke-token', data: [] } });
      return;
    }
    if (url.pathname === `/kirk/domain/astro-templates/${TEMPLATE}`) {
      await route.fulfill({ json: { data: { status: 1, template: { name: TEMPLATE, history: { guid: 'commit-1' } } } } });
      return;
    }
    if (url.pathname === `/kirk/wizard/potential-table-inputs/${TEMPLATE}`) {
      await route.fulfill({ json: { data: { PotentialTableInputs: [] } } });
      return;
    }
    if (url.pathname === `/kirk/wizard/download/excel/${TEMPLATE}`) {
      await route.fulfill({
        status: 200,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers: { 'content-disposition': `attachment; filename="${TEMPLATE}.xlsx"` },
        body: 'smoke workbook',
      });
      return;
    }
    if (url.pathname === '/kirk/wizard/main') {
      await route.fulfill({ json: commandEnvelope(commandResult(url.searchParams.get('command'))) });
      return;
    }

    throw new Error(`Unhandled backend request: ${url.pathname}${url.search}`);
  });
}

async function authenticate(page) {
  const credentials = pack(`smoke_user_${SECRET}`);
  await page.context().addCookies([{
    name: 'huashansession',
    value: encodeURIComponent(credentials),
    url: 'http://127.0.0.1:4173',
  }]);
  await page.addInitScript(({ info }) => {
    localStorage.setItem('JWT-TOKEN', 'smoke-token');
    localStorage.setItem('INFO', info);
  }, { info: Buffer.from(JSON.stringify({ is_admin: true })).toString('base64') });
}

function failOnPageErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error));
  return () => expect(errors, errors.map((error) => error.stack).join('\n\n')).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await mockBackend(page);
  await authenticate(page);
});

test('select template supports modal interaction and Excel download', async ({ page }) => {
  const assertNoPageErrors = failOnPageErrors(page);
  await page.goto('/#/selectTemplate');

  await page.getByText(TEMPLATE, { exact: true }).click();
  await expect(page.getByRole('button', { name: 'Update Data Structure' })).toBeVisible();

  await page.getByRole('button', { name: 'Update Data Structure' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByText('Smoke Portfolio', { exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Run' })).toBeEnabled();
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download Excel model' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(`${TEMPLATE}.xlsx`);
  assertNoPageErrors();
});

test('critical editor routes load after a hard refresh', async ({ page }) => {
  const assertNoPageErrors = failOnPageErrors(page);
  const routes = [
    [`/datastructure/${TEMPLATE}`, 'Data Structure'],
    [`/appstructure/${TEMPLATE}`, 'App Structure'],
    [`/portfoliostructure/${TEMPLATE}`, 'Portfolio Structure'],
    [`/json/${TEMPLATE}`, 'JSON'],
    [`/revisions/${TEMPLATE}`, 'Revision History'],
  ];

  for (const [route, heading] of routes) {
    await page.goto(`/#${route}`);
    await page.reload();
    await expect(page.getByText(heading, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/could not be loaded/i)).toHaveCount(0);
  }

  assertNoPageErrors();
});
