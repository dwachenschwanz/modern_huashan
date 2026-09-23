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
  Outputs: [
    { CellLink: 'Sheet1!Output', Key: 'Output', Display: 'Output', Units: 'USD' },
    { CellLink: 'Sheet1!Growth', Key: 'Growth', Display: 'Growth', Units: '%' },
  ],
};

const appStructure = {
  MENU: [
    {
      ID: 'input-screen',
      Display: 'Inputs',
      Command: 'INPUT_SCREEN',
      Parameters: { InputKeys: [] },
    },
    {
      ID: 'tornado',
      Display: 'Tornado',
      Command: 'TORNADODIST',
      Parameters: {
        ChartTitle: 'Risk drivers',
        CombinedUncertaintyLabel: 'Combined uncertainty',
        Depth: 2,
        ValueMetricKeys: ['Output'],
        MetaLogKeys: [],
        Weights: { High: 0.25, Med: 0.5, Low: 0.25 },
      },
    },
    {
      ID: 'waterfall',
      Display: 'Waterfall',
      Command: 'WATERFALL',
      Parameters: {
        CellLink: 'Sheet1!Table',
        OutputKey: 'Table',
        Sets: [{ CellLink: 'Sheet1!Table', OutputKey: 'Table', Units: 'USD', name: 'Base', yTitle: 'Value' }],
      },
    },
  ],
  PostProcessingOutputsForPortfolio: [],
};

const platformAppStructure = {
  MENU: [{
    ID: 'bucket-chart',
    Display: 'Bucket Chart',
    Command: 'BUCKET_CHART',
    Parameters: {
      Sets: [{
        Title: 'Distribution',
        xTitle: 'Value',
        yTitle: 'Percentage',
        Key: 'Output',
        Counts: false,
        xBuckets: [{ GE: '0', LT: '10', Name: '0-10' }],
      }],
    },
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
  platformAppStructure,
  platformPortfolioStructure: 'Does not exist',
};

function commandResult(command, url) {
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
    GetAppStructure: url.searchParams.get('isPlatform') === 'true' ? platformAppStructure : appStructure,
    GetPortfolioStructure: portfolioStructure,
    GetPotentialTables: {
      PotentialTableOutputs: [{ CellLink: 'Sheet1!Table', HtmlPreview: '<table><tr><td>Smoke table</td></tr></table>' }],
    },
    GetCharts: { Charts: [] },
    GetTemplateJsonFiles: templateJson,
    SaveAppStructure: 'Saved',
  };
  if (!(command in results)) throw new Error(`Unhandled Wizard command: ${command}`);
  return results[command];
}

async function mockBackend(page, saveRequests) {
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
      if (url.searchParams.get('command') === 'SaveAppStructure') {
        saveRequests.push(route.request().postDataJSON());
      }
      await route.fulfill({ json: commandEnvelope(commandResult(url.searchParams.get('command'), url)) });
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

async function expectAboveFixedFooter(page, buttonSelector) {
  const button = page.locator(buttonSelector);
  const footer = page.locator('.align-to-bottom');
  await expect(button).toBeVisible();
  await expect(footer).toBeVisible();
  const buttonBox = await button.boundingBox();
  const footerBox = await footer.boundingBox();
  expect(buttonBox).not.toBeNull();
  expect(footerBox).not.toBeNull();
  expect(buttonBox.y + buttonBox.height).toBeLessThan(footerBox.y);
}

let saveRequests;

test.beforeEach(async ({ page }) => {
  saveRequests = [];
  await mockBackend(page, saveRequests);
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

test('left-column action buttons remain above the fixed footer', async ({ page }) => {
  const assertNoPageErrors = failOnPageErrors(page);
  await page.setViewportSize({ width: 1280, height: 720 });

  await page.goto(`/#/appstructure/${TEMPLATE}`);
  await expectAboveFixedFooter(page, '#as-new-btn');

  await page.goto(`/#/portfoliostructure/${TEMPLATE}`);
  await expectAboveFixedFooter(page, '#ps-new-btn');

  await page.goto('/#/selectTemplate');
  await expectAboveFixedFooter(page, '#st-archive-btn');
  await expectAboveFixedFooter(page, '#st-upload-btn');
  assertNoPageErrors();
});

test('App Structure edits and saves Tornado settings with a commit message', async ({ page }) => {
  const assertNoPageErrors = failOnPageErrors(page);
  await page.goto(`/#/appstructure/${TEMPLATE}`);

  await page.getByText('Tornado', { exact: true }).click();
  await page.locator('[data-tornado-key="Growth"]').click();
  await page.getByText('Parameters', { exact: true }).click();
  await page.locator('[data-field="Parameters.ChartTitle"]').fill('Updated risk drivers');
  await page.locator('[data-field="Parameters.Depth"]').fill('4');

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('unsaved changes');
    await dialog.dismiss();
  });
  await page.getByRole('link', { name: /Previous: Data Structure/ }).click();
  await expect(page).toHaveURL(new RegExp(`/appstructure/${TEMPLATE}$`));

  await page.locator('#as-save-btn').click();
  const commitDialog = page.getByRole('dialog', { name: 'Change Message' });
  await commitDialog.locator('#commit-display').fill('Update Tornado settings');
  await commitDialog.getByRole('button', { name: 'Ok' }).click();

  await expect.poll(() => saveRequests.length).toBe(1);
  const savedTornado = saveRequests[0].data.MENU.find((menu) => menu.ID === 'tornado');
  expect(saveRequests[0].commitMessage).toBe('Update Tornado settings');
  expect(savedTornado.Parameters).toMatchObject({
    ChartTitle: 'Updated risk drivers',
    Depth: 4,
    ValueMetricKeys: ['Output', 'Growth'],
  });
  assertNoPageErrors();
});

test('App Structure adds and removes Waterfall rows', async ({ page }) => {
  const assertNoPageErrors = failOnPageErrors(page);
  await page.goto(`/#/appstructure/${TEMPLATE}`);

  await page.getByText('Waterfall', { exact: true }).click();
  await page.locator('#as-waterfall-add').click();
  await expect(page.locator('[data-waterfall-field^="OutputKey:"]')).toHaveCount(2);

  await page.locator('[data-waterfall-table="0"]').click();
  await expect(page.locator('[data-waterfall-field="OutputKey:1"]')).toHaveValue('Table');
  await page.locator('[data-waterfall-field="name:1"]').fill('Upside');
  await expect(page.locator('[data-waterfall-field="name:1"]')).toHaveValue('Upside');

  await page.locator('[data-waterfall-delete="1"]').click();
  await expect(page.locator('[data-waterfall-field^="OutputKey:"]')).toHaveCount(1);
  assertNoPageErrors();
});

test('Platform App Structure edits and generates Bucket Chart buckets', async ({ page }) => {
  const assertNoPageErrors = failOnPageErrors(page);
  await page.goto(`/#/platformAppStructure/${TEMPLATE}`);

  await expect(page.getByText('Platform App Structure', { exact: true })).toBeVisible();
  await page.locator('[data-bucket-edit="0"]').click();
  await page.locator('[data-bucket-name="0:0"]').fill('Low');
  await page.locator('[data-bucket-add="0"]').click();
  await expect(page.locator('[data-bucket-name^="0:"]')).toHaveCount(2);
  await page.locator('[data-bucket-remove="0"]').click();
  await expect(page.locator('[data-bucket-name^="0:"]')).toHaveCount(1);

  await page.locator('#as-bucket-set-add').click();
  await page.locator('#as-bucket-count-1').fill('2');
  await page.locator('#as-bucket-low-1').fill('0');
  await page.locator('#as-bucket-high-1').fill('10');
  await page.locator('[data-bucket-generate="1"]').click();
  await expect(page.locator('[data-bucket-name^="1:"]')).toHaveCount(2);
  await expect(page.locator('[data-bucket-name="1:0"]')).toHaveValue('0.00-5.00');
  assertNoPageErrors();
});

test('App Structure supports adding, renaming, and deleting menu entries', async ({ page }) => {
  const assertNoPageErrors = failOnPageErrors(page);
  await page.goto(`/#/appstructure/${TEMPLATE}`);

  await page.locator('[data-menu-edit]').click();
  const renameDialog = page.getByRole('dialog', { name: 'Rename Menu Item' });
  await renameDialog.locator('#as-rename-input').fill('Model Inputs');
  await renameDialog.getByRole('button', { name: 'Rename' }).click();
  await expect(page.getByText('Model Inputs', { exact: true }).first()).toBeVisible();
  await expect.poll(() => saveRequests.length).toBe(1);

  await page.locator('#as-new-btn').click();
  const newDialog = page.getByRole('dialog', { name: 'New Menu Item' });
  await newDialog.locator('#new-display').fill('Additional Table');
  await newDialog.locator('#new-command-project').selectOption('TABLE');
  await newDialog.getByRole('button', { name: 'Add' }).click();
  await expect(page.getByText('Additional Table', { exact: true }).first()).toBeVisible();

  await page.locator('[data-menu-delete]').click();
  const deleteDialog = page.getByRole('dialog', { name: 'Delete Menu Item' });
  await deleteDialog.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('Additional Table', { exact: true })).toHaveCount(0);
  assertNoPageErrors();
});

test('App Structure exposes retry after a load failure', async ({ page }) => {
  const assertNoPageErrors = failOnPageErrors(page);
  let failAppStructure = true;
  await page.route('**/kirk/wizard/main**', async (route) => {
    const url = new URL(route.request().url());
    if (failAppStructure && url.searchParams.get('command') === 'GetAppStructure') {
      await route.fulfill({ status: 500, json: { message: 'Temporary failure' } });
      return;
    }
    await route.fallback();
  });

  await page.goto(`/#/appstructure/${TEMPLATE}`);
  await expect(page.getByText('App structure could not be loaded.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();

  failAppStructure = false;
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByText('App Structure', { exact: true })).toBeVisible();
  await expect(page.getByText('App structure could not be loaded.', { exact: true })).toHaveCount(0);
  assertNoPageErrors();
});
