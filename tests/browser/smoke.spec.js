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
  Inputs: [
    { CellLink: 'Sheet1!Input', Key: 'Input', Display: 'Input', Description: 'Base input', Type: 'SCALAR', Val: 0, Units: '', Constraint: 'double', Inherited: false },
    { CellLink: 'Sheet1!IncludedTable', Key: 'IncludedTable', Display: 'Included table', Description: '', Type: 'TABLE', Val: [], Units: '', Constraint: 'double', Inherited: false },
  ],
  Outputs: [
    { CellLink: 'Sheet1!Output', Key: 'Output', Display: 'Output', Units: 'USD', UsePostProcessingOutputs: false },
    { CellLink: 'Sheet1!Growth', Key: 'Growth', Display: 'Growth', Units: '%', UsePostProcessingOutputs: false },
  ],
};

const excludedDataStructure = {
  Excluded: {
    Inputs: [
      { CellLink: 'Sheet1!ExcludedInput', Key: 'ExcludedInput', Display: 'Excluded input', Description: '', Type: 'DATE', Val: 'Jan 2025', Units: '', Constraint: 'date', Inherited: false },
      { CellLink: 'Sheet1!ExcludedTable', Key: 'ExcludedTable', Display: 'Excluded table', Description: '', Type: 'TABLE', Val: [], Units: '', Constraint: 'double', Inherited: false },
    ],
    Outputs: [
      { CellLink: 'Sheet1!ExcludedOutput', Key: 'ExcludedOutput', Display: 'Excluded output', Units: 'count', UsePostProcessingOutputs: false },
    ],
  },
};

const potentialTableInputs = [
  { CellLink: 'Sheet1!AvailableTable', Key: 'AvailableTable', Display: 'Available table', Inherited: false, Type: 'TABLE', HtmlPreview: '<table><tr><td>Available preview</td></tr></table>' },
  { CellLink: 'Sheet1!ExcludedTable', Key: 'ExcludedTable', Display: 'Excluded table', Inherited: false, Type: 'TABLE', HtmlPreview: '<table><tr><td>Excluded preview</td></tr></table>' },
];

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
    {
      ID: 'metalog',
      Display: 'Metalog',
      Command: 'METALOG_DISPLAY',
      Parameters: {
        MetaLogKeys: [],
        FittedPointExplanation: '',
        CalcMVSFromFittedPoints: false,
      },
    },
    {
      ID: 'portfolio-source',
      Display: 'Portfolio Source',
      Command: 'METALOG_DISPLAY',
      Parameters: { MetaLogKeys: ['Output', 'Growth'] },
    },
    {
      ID: 'portfolio-table',
      Display: 'Portfolio Table',
      Command: 'TABLE',
      Parameters: { OutputKey: 'Table', CellLink: 'Sheet1!Table' },
    },
  ],
  PostProcessingOutputsForPortfolio: [],
};

const platformAppStructure = {
  MENU: [
    {
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
    },
    {
      ID: 'cfo-chart',
      Display: 'CFO Chart',
      Command: 'CFO_CHART',
      Parameters: { Sets: [{ AverageCost: '', xTitle: '', AverageValueMinusCost: '', yTitle: '', name: 'CFOChart1' }] },
    },
    {
      ID: 'innovation-screen',
      Display: 'Innovation Screen',
      Command: 'INNOVATION_SCREEN',
      Parameters: { Sets: [{ x: '', xTitle: '', y: '', yTitle: '', VerticalCutoff: null, name: 'Innovation Screen1' }] },
    },
    {
      ID: 'scatter-plot',
      Display: 'Scatter Plot',
      Command: 'SCATTER_PLOT',
      Parameters: { Sets: [{ x: '', y: '', xTitle: '', yTitle: '', name: 'Series 1' }], SameScale: false, Min: null, Max: null },
    },
  ],
  PostProcessingOutputsForPortfolio: [],
};

const portfolioStructure = {
  MENU: [
    {
      ID: 'compare-value',
      Display: 'Compare Value',
      Command: 'COMPARE_VALUE',
      Parameters: { Keys: [], Units: [], Titles: [], PrecisionOptions: [], DefaultPrecision: 0, Total: false, Min: null, Max: null },
    },
    {
      ID: 'portfolio-cfo',
      Display: 'Portfolio CFO',
      Command: 'CFO_CHART',
      Parameters: { Sets: [{ AverageCost: '', xTitle: '', AverageValueMinusCost: '', yTitle: '', name: 'CFOChart1' }] },
    },
    {
      ID: 'portfolio-innovation',
      Display: 'Portfolio Innovation',
      Command: 'INNOVATION_SCREEN',
      Parameters: { Sets: [{ x: '', xTitle: '', y: '', yTitle: '', VerticalCutoff: null, name: 'Innovation Screen1' }] },
    },
    {
      ID: 'portfolio-scatter',
      Display: 'Portfolio Scatter',
      Command: 'SCATTER_PLOT',
      Parameters: { Sets: [{ x: '', y: '', xTitle: '', yTitle: '', name: 'Series 1' }], SameScale: false, Min: null, Max: null },
    },
    {
      ID: 'portfolio-table-view',
      Display: 'Portfolio Table View',
      Command: 'ADD_TABLES',
      Parameters: { Key: 'Table', NodeLookup: 'Outputs', Pnl: false, PrecisionOptions: [0, 1, 2], DefaultPrecision: 2, Keys: [], Units: [], Titles: [] },
    },
    {
      ID: 'portfolio-buckets',
      Display: 'Portfolio Buckets',
      Command: 'BUCKET_CHART',
      Parameters: { Sets: [{ Title: 'Distribution', xTitle: 'Value', yTitle: 'Percentage', Key: 'Output', Counts: false, xBuckets: [{ GE: '0', LT: '10', Name: '0-10' }] }] },
    },
    {
      ID: 'portfolio-uncertainty',
      Display: 'Portfolio Uncertainty',
      Command: 'PORTFOLIO_UNCERTAINTY',
      Parameters: { Source: '', MVSType: '', RollupKeys: [], PortfolioUncExplanation: '', Representation: '' },
    },
  ],
};

const templateJson = {
  dataStructure,
  appStructure,
  portfolioStructure,
  platformDataStructure: 'Does not exist',
  platformAppStructure,
  platformPortfolioStructure: 'Does not exist',
};

const adminGroups = [
  { _id: 'finance-group', groupname: 'Finance' },
  { _id: 'research-group', groupname: 'Research' },
  { _id: 'admin-group', groupname: 'administrators' },
];

const adminTemplates = [
  {
    name: TEMPLATE,
    history: { guid: 'commit-1' },
    groups: [{ _id: 'finance-group', groupname: 'Finance' }],
    creatorUsername: 'Smoke User',
    createdDate: '2026-01-01T00:00:00Z',
    modifiedDate: '2026-01-02T00:00:00Z',
  },
  {
    name: 'ZetaTemplate',
    history: { guid: 'commit-2' },
    groups: [{ _id: 'research-group', groupname: 'Research' }],
    creatorUsername: 'Other User',
    createdDate: '2026-02-01T00:00:00Z',
    modifiedDate: '2026-02-02T00:00:00Z',
  },
];

function commandResult(command, url) {
  const results = {
    GetAstroTemplates: structuredClone(adminTemplates),
    GetArchivedAstroTemplates: [{ name: 'ArchivedTemplate' }],
    FindAssociatedPortfolios: ['Smoke Portfolio'],
    GetRevisions: JSON.stringify({
      commitNum: 'commit-1',
      commitMessage: 'Smoke revision',
      committer: 'Smoke User',
      relativeTime: 'now',
      timeStamp: '2026-01-01T00:00:00Z',
    }),
    GetDataStructure: dataStructure,
    GetExcludedDataStructureComponents: excludedDataStructure,
    GetAppStructure: url.searchParams.get('isPlatform') === 'true' ? platformAppStructure : appStructure,
    GetPortfolioStructure: portfolioStructure,
    GetPotentialTables: {
      PotentialTableOutputs: [{ CellLink: 'Sheet1!Table', HtmlPreview: '<table><tr><td>Smoke table</td></tr></table>' }],
    },
    GetCharts: { Charts: [] },
    GetTemplateJsonFiles: templateJson,
    SaveAppStructure: 'Saved',
    SavePortfolioStructure: 'Saved',
    SaveDataStructure: 'Saved',
    RenameTemplate: 'Renamed',
    DeleteTemplate: 'Archived',
    UndeleteTemplate: 'Restored',
    UpdateDataStructure: 'Updated',
  };
  if (!(command in results)) throw new Error(`Unhandled Wizard command: ${command}`);
  return results[command];
}

async function mockBackend(page, saveRequests, actionRequests, uploadRequests) {
  await page.route('**/kirk/**', async (route) => {
    const url = new URL(route.request().url());

    if (url.pathname === '/kirk/framework/admin/group/list') {
      await route.fulfill({ json: { token: 'smoke-token', data: structuredClone(adminGroups) } });
      return;
    }
    if (url.pathname === '/kirk/domain/astro-templates' && route.request().method() === 'PUT') {
      actionRequests.push({ command: 'EditAstroTemplate', ...route.request().postDataJSON() });
      await route.fulfill({ json: { token: 'smoke-token', data: { status: 0, message: 'Template updated' } } });
      return;
    }
    if (url.pathname === `/kirk/domain/astro-templates/${TEMPLATE}`) {
      await route.fulfill({ json: { data: { status: 1, template: { name: TEMPLATE, history: { guid: 'commit-1' } } } } });
      return;
    }
    if (url.pathname === `/kirk/wizard/potential-table-inputs/${TEMPLATE}`) {
      await route.fulfill({ json: { data: { PotentialTableInputs: structuredClone(potentialTableInputs) } } });
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
    if (url.pathname.startsWith('/kirk/wizard/upload/')) {
      uploadRequests.push({ path: url.pathname, method: route.request().method() });
      await route.fulfill({ json: { data: { status: 1, message: 'Uploaded' } } });
      return;
    }
    if (url.pathname === '/kirk/wizard/main') {
      actionRequests.push(Object.fromEntries(url.searchParams));
      if (['SaveAppStructure', 'SavePortfolioStructure', 'SaveDataStructure'].includes(url.searchParams.get('command'))) {
        saveRequests.push({
          ...route.request().postDataJSON(),
          command: url.searchParams.get('command'),
          isPlatform: url.searchParams.get('isPlatform'),
        });
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

/* Read every panel's geometry in one tick, and keep reading until it stops
 * changing: these views re-render on each API response, so measurements
 * taken across separate calls can land on an element that has since been
 * detached. Returns the last reading either way so the assertions below
 * still fail with real numbers rather than a timeout. */
async function readSettledLayout(page, selectors) {
  let previous = null;
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const current = await page.evaluate(([sidebar, content, list]) => {
      const box = (selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return {
          x: rect.x, y: rect.y, width: rect.width, height: rect.height,
          overflows: element.scrollHeight > element.clientHeight,
          overflowY: getComputedStyle(element).overflowY,
        };
      };
      return { sidebar: box(sidebar), content: box(content), list: box(list) };
    }, [selectors.sidebar, selectors.content, selectors.list]);
    if (previous && JSON.stringify(current) === JSON.stringify(previous)) return current;
    previous = current;
    await page.waitForTimeout(100);
  }
  return previous;
}

/* These views share generic layout class names across separate stylesheets,
 * and have twice regressed to a state where the content panel was still in
 * the DOM (so text and role assertions kept passing) but was painted
 * off-screen or collapsed to zero width. Assert the geometry, not just the
 * markup: that the panels sit side by side, both have real size, and the
 * menu list scrolls inside the fold rather than running off it. */
async function expectPanelLayout(page, selectors) {
  const { sidebar, content, list } = await readSettledLayout(page, selectors);
  const viewport = page.viewportSize();
  expect(sidebar, `${selectors.sidebar} is missing`).not.toBeNull();
  expect(content, `${selectors.content} is missing`).not.toBeNull();
  expect(list, `${selectors.list} is missing`).not.toBeNull();

  expect(sidebar.width).toBeGreaterThan(100);
  expect(content.width).toBeGreaterThan(300);
  expect(content.height).toBeGreaterThan(50);

  expect(content.x + 1).toBeGreaterThanOrEqual(sidebar.x + sidebar.width);
  expect(Math.abs(content.y - sidebar.y)).toBeLessThan(80);
  expect(content.x + content.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(content.y).toBeLessThan(viewport.height);

  /* Unconditional: the fixtures are too small to overflow these panels, but
   * a list that can't scroll spills its rows off the bottom of the page the
   * moment a real template has enough of them. */
  expect(list.y + list.height).toBeLessThanOrEqual(viewport.height + 1);
  expect(['auto', 'scroll']).toContain(list.overflowY);
}

/* A trailing edit icon is right-justified by a class name, so a misspelled
 * one fails silently: the icon still renders, still handles its click, and
 * only the alignment is wrong. Measure it rather than asserting on the class,
 * so any future way of moving it right also counts. */
async function expectPulledRight(page, selector, containerSelector) {
  const icon = page.locator(selector);
  await expect(icon).toBeVisible();
  const geometry = await icon.evaluate((element, container) => {
    const iconRect = element.getBoundingClientRect();
    const hostRect = element.closest(container).getBoundingClientRect();
    return {
      gap: hostRect.right - iconRect.right,
      pastMidpoint: iconRect.left - (hostRect.left + hostRect.width / 2),
      hostWidth: hostRect.width,
    };
  }, containerSelector);

  expect(geometry.hostWidth, `${selector}: container has no width to align within`).toBeGreaterThan(80);
  expect(geometry.gap, `${selector}: not flush with the right edge of ${containerSelector}`).toBeLessThan(16);
  expect(geometry.pastMidpoint, `${selector}: still sits beside its label rather than at the right edge`).toBeGreaterThan(0);
}

let saveRequests;
let actionRequests;
let uploadRequests;

test.beforeEach(async ({ page }) => {
  saveRequests = [];
  actionRequests = [];
  uploadRequests = [];
  await mockBackend(page, saveRequests, actionRequests, uploadRequests);
  await authenticate(page);
});

test('Admin searches, filters, sorts, and manages template access', async ({ page }) => {
  const assertNoPageErrors = failOnPageErrors(page);
  await page.goto('/#/admin');

  const rows = page.locator('#allTemplates-tbody tr');
  await expect(rows).toHaveCount(2);
  await page.locator('#admin-search').fill('Zeta');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('ZetaTemplate');
  await page.locator('#admin-search').fill('');

  await page.getByRole('button', { name: 'Filter by groups' }).click();
  await page.getByRole('checkbox', { name: 'Finance' }).check();
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText(TEMPLATE);
  await page.getByRole('button', { name: 'Clear group filters' }).click();
  await expect(rows).toHaveCount(2);

  await page.getByRole('columnheader', { name: /Template Name/ }).click();
  await expect(rows.first()).toContainText('ZetaTemplate');

  const manageAccessButton = page.getByRole('button', { name: `Manage access for ${TEMPLATE}` });
  await manageAccessButton.click();
  const dialog = page.getByRole('dialog', { name: 'Manage Template Access' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toBeFocused();
  const dialogBox = await dialog.locator('.modal-content').boundingBox();
  const viewport = page.viewportSize();
  expect(dialogBox).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(dialogBox.y).toBeGreaterThanOrEqual(0);
  expect(dialogBox.y + dialogBox.height).toBeLessThanOrEqual(viewport.height);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(manageAccessButton).toBeFocused();

  await manageAccessButton.click();
  await expect(dialog.getByRole('button', { name: 'Remove Finance' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Add Research' }).click();
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog).toBeHidden();
  await expect.poll(() => actionRequests.some((request) => (
    request.command === 'EditAstroTemplate'
      && request.groups.some((group) => group.groupname === 'Finance')
      && request.groups.some((group) => group.groupname === 'Research')
  ))).toBe(true);
  assertNoPageErrors();
});

test('Admin archives and restores templates', async ({ page }) => {
  const assertNoPageErrors = failOnPageErrors(page);
  await page.route('**/kirk/wizard/main**', async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('command') === 'GetArchivedAstroTemplates') {
      await route.fulfill({ json: commandEnvelope(['ArchivedTemplate']) });
      return;
    }
    await route.fallback();
  });
  await page.goto('/#/admin');

  await page.getByRole('button', { name: `Archive ${TEMPLATE}` }).click();
  const archiveDialog = page.getByRole('dialog', { name: 'Archive Template' });
  await archiveDialog.getByRole('button', { name: 'Archive' }).click();
  await expect(archiveDialog).toBeHidden();
  await expect.poll(() => actionRequests.some((request) => (
    request.command === 'DeleteTemplate' && request.templateName === TEMPLATE
  ))).toBe(true);

  await page.getByRole('tab', { name: 'Archive' }).click();
  await expect(page.locator('#archive-tbody')).toContainText('ArchivedTemplate');
  await page.getByRole('button', { name: 'Restore ArchivedTemplate' }).click();
  const restoreDialog = page.getByRole('dialog', { name: 'Unarchive Template' });
  await restoreDialog.getByRole('button', { name: 'Unarchive' }).click();
  await expect(restoreDialog).toBeHidden();
  await expect.poll(() => actionRequests.some((request) => (
    request.command === 'UndeleteTemplate' && request.templateName === 'ArchivedTemplate'
  ))).toBe(true);
  assertNoPageErrors();
});

test('Admin exposes retry after the template list fails', async ({ page }) => {
  const assertNoPageErrors = failOnPageErrors(page);
  let failTemplates = true;
  await page.route('**/kirk/wizard/main**', async (route) => {
    const url = new URL(route.request().url());
    if (failTemplates && url.searchParams.get('command') === 'GetAstroTemplates') {
      await route.fulfill({ status: 500, json: { message: 'Temporary admin failure' } });
      return;
    }
    await route.fallback();
  });

  await page.goto('/#/admin');
  await expect(page.getByText(/GetAstroTemplates failed with HTTP 500/i).first()).toBeVisible();
  failTemplates = false;
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByRole('button', { name: `Manage access for ${TEMPLATE}` })).toBeVisible();
  assertNoPageErrors();
});

test('Admin keeps update failures actionable inside the access dialog', async ({ page }) => {
  const assertNoPageErrors = failOnPageErrors(page);
  let releaseUpdate;
  await page.route('**/kirk/domain/astro-templates', async (route) => {
    await new Promise((resolve) => { releaseUpdate = resolve; });
    await route.fulfill({ json: { data: { status: 1, message: 'Access update was rejected' } } });
  });

  await page.goto('/#/admin');
  await page.getByRole('button', { name: `Manage access for ${TEMPLATE}` }).click();
  const dialog = page.getByRole('dialog', { name: 'Manage Template Access' });
  const saveButton = dialog.getByRole('button', { name: 'Save' });
  await saveButton.click();
  await expect(dialog.getByRole('button', { name: 'Saving' })).toBeDisabled();
  await expect.poll(() => typeof releaseUpdate).toBe('function');
  releaseUpdate();

  await expect(dialog.getByRole('alert')).toHaveText('Access update was rejected');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Save' })).toBeEnabled();
  assertNoPageErrors();
});

test('Admin keeps the action column available on narrow screens', async ({ page }) => {
  const assertNoPageErrors = failOnPageErrors(page);
  await page.setViewportSize({ width: 600, height: 700 });
  await page.goto('/#/admin');

  const tableRegion = page.getByRole('region', { name: 'All templates table' });
  await expect(tableRegion).toBeVisible();
  const dimensions = await tableRegion.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth);
  await expect(page.getByRole('button', { name: `Manage access for ${TEMPLATE}` })).toBeVisible();
  assertNoPageErrors();
});

test('Admin scrolls table rows while keeping controls and column headers fixed', async ({ page }) => {
  const assertNoPageErrors = failOnPageErrors(page);
  const manyTemplates = Array.from({ length: 40 }, (_, index) => ({
    name: `Template${String(index + 1).padStart(2, '0')}`,
    groups: [{ _id: 'finance-group', groupname: 'Finance' }],
    creatorUsername: 'Smoke User',
    createdDate: '2026-01-01T00:00:00Z',
    modifiedDate: '2026-01-02T00:00:00Z',
  }));
  await page.route('**/kirk/wizard/main**', async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('command') === 'GetAstroTemplates') {
      await route.fulfill({ json: commandEnvelope(manyTemplates) });
      return;
    }
    await route.fallback();
  });
  await page.setViewportSize({ width: 1000, height: 600 });
  await page.goto('/#/admin');

  const tableRegion = page.getByRole('region', { name: 'All templates table' });
  await expect(tableRegion).toBeVisible();
  const toolbar = page.locator('#admin-toolbar');
  const firstHeader = page.locator('#allTemplates .astro-table th').first();
  const before = {
    toolbar: await toolbar.boundingBox(),
    header: await firstHeader.boundingBox(),
  };
  const scrollPosition = await tableRegion.evaluate((element) => {
    element.scrollTop = 500;
    return {
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      scrollTop: element.scrollTop,
    };
  });
  expect(scrollPosition.scrollHeight).toBeGreaterThan(scrollPosition.clientHeight);
  expect(scrollPosition.scrollTop).toBeGreaterThan(0);

  const after = {
    toolbar: await toolbar.boundingBox(),
    header: await firstHeader.boundingBox(),
  };
  expect(Math.abs(after.toolbar.y - before.toolbar.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(after.header.y - before.header.y)).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => globalThis.scrollY)).toBe(0);
  assertNoPageErrors();
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

test('Select Template keeps Data Structure update available without associated portfolios', async ({ page }) => {
  const assertNoPageErrors = failOnPageErrors(page);
  await page.route('**/kirk/wizard/main**', async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('command') === 'FindAssociatedPortfolios') {
      await route.fulfill({ json: commandEnvelope([]) });
      return;
    }
    await route.fallback();
  });

  await page.goto('/#/selectTemplate');
  await page.getByText(TEMPLATE, { exact: true }).click();
  const updateButton = page.getByRole('button', { name: 'Update Data Structure' });
  await expect(updateButton).toBeVisible();
  await updateButton.click();

  const dialog = page.getByRole('dialog', { name: 'Update Data Structure' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('No associated portfolios found.')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Run' })).toHaveCount(0);
  assertNoPageErrors();
});

test('Select Template renames, archives, and restores templates', async ({ page }) => {
  const assertNoPageErrors = failOnPageErrors(page);
  await page.goto('/#/selectTemplate');
  await page.locator('#st-template-list [data-template-index="0"]').click();

  await page.locator('[data-target="#renameModal"]').click();
  const renameDialog = page.getByRole('dialog', { name: `Rename ${TEMPLATE}` });
  await renameDialog.locator('#st-rename-input').fill('Renamed Template');
  await renameDialog.getByRole('button', { name: 'Rename' }).click();
  await expect(renameDialog).toBeHidden();
  await expect.poll(() => actionRequests.some((request) => request.command === 'RenameTemplate' && request.newTemplateName === 'Renamed_Template')).toBe(true);

  await page.locator('[data-target="#deleteModal"]').click();
  const deleteDialog = page.getByRole('dialog', { name: /Are you sure to delete/ });
  await deleteDialog.getByRole('button', { name: 'Delete' }).click();
  await expect(deleteDialog).toBeHidden();
  await expect.poll(() => actionRequests.some((request) => request.command === 'DeleteTemplate' && request.templateName === TEMPLATE)).toBe(true);

  await page.getByRole('button', { name: 'Archive' }).click();
  const archiveDialog = page.getByRole('dialog', { name: 'Templates in Archive:' });
  await expect(archiveDialog).toBeVisible();
  await archiveDialog.getByText('ArchivedTemplate', { exact: true }).click();
  await archiveDialog.getByRole('button', { name: 'Unarchive' }).click();
  await expect.poll(() => actionRequests.some((request) => request.command === 'UndeleteTemplate' && request.templateName === 'ArchivedTemplate')).toBe(true);
  assertNoPageErrors();
});

test('Select Template validates and uploads an Excel template', async ({ page }) => {
  const assertNoPageErrors = failOnPageErrors(page);
  await page.goto('/#/selectTemplate');
  await page.locator('#st-upload-btn').click();
  const dialog = page.getByRole('dialog', { name: 'Select a Template to upload' });

  await dialog.getByRole('button', { name: 'Upload' }).click();
  await expect(dialog.locator('#st-submit-alerts')).toContainText('Please select a file.');

  await dialog.locator('#FileToUploadID').setInputFiles({ name: 'Bad_Name.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: Buffer.from('bad') });
  await dialog.getByRole('button', { name: 'Upload' }).click();
  await expect(dialog.locator('#st-submit-alerts')).toContainText('No underscore allowed in file name.');

  await dialog.locator('#FileToUploadID').setInputFiles({ name: 'GoodTemplate.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: Buffer.from('workbook') });
  await dialog.getByRole('button', { name: 'Upload' }).click();
  await expect(dialog).toBeHidden();
  expect(uploadRequests).toEqual([{ path: '/kirk/wizard/upload/GoodTemplate.xlsx', method: 'POST' }]);
  assertNoPageErrors();
});

test('Select Template runs a Data Structure update with selected options', async ({ page }) => {
  const assertNoPageErrors = failOnPageErrors(page);
  await page.goto('/#/selectTemplate');
  await page.getByText(TEMPLATE, { exact: true }).click();
  await page.getByRole('button', { name: 'Update Data Structure' }).click();
  const dialog = page.getByRole('dialog', { name: 'Update Data Structure' });
  await dialog.getByText('Smoke Portfolio', { exact: true }).click();
  await dialog.getByRole('checkbox', { name: 'Leaf' }).uncheck();
  await dialog.getByRole('checkbox', { name: 'Platform' }).check();
  await dialog.getByRole('button', { name: 'Run' }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText(/updated successfully/i)).toBeVisible();
  await expect.poll(() => actionRequests.some((request) => request.command === 'UpdateDataStructure' && request.runLeaf === 'false' && request.runPlatform === 'true')).toBe(true);
  assertNoPageErrors();
});

test('Select Template exposes retry after the template list fails', async ({ page }) => {
  const assertNoPageErrors = failOnPageErrors(page);
  let failTemplates = true;
  await page.route('**/kirk/wizard/main**', async (route) => {
    const url = new URL(route.request().url());
    if (failTemplates && url.searchParams.get('command') === 'GetAstroTemplates') {
      await route.fulfill({ status: 500, json: { message: 'Temporary template failure' } });
      return;
    }
    await route.fallback();
  });

  await page.goto('/#/selectTemplate');
  await expect(page.getByText(/GetAstroTemplates failed with HTTP 500/i).first()).toBeVisible();
  failTemplates = false;
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByText(TEMPLATE, { exact: true })).toBeVisible();
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

test('search fields accept continuous typing and can be cleared', async ({ page }) => {
  const assertNoPageErrors = failOnPageErrors(page);

  /* These views re-render their whole container on every keystroke, so a
   * search field that is not restored afterwards takes one character and
   * then drops focus. */
  const fields = [
    { route: `/datastructure/${TEMPLATE}`, id: 'ds-search-input' },
    { route: `/datastructure/${TEMPLATE}`, id: 'ds-search-output', tab: 'output' },
    { route: `/datastructure/${TEMPLATE}`, id: 'ds-search-input-table', tab: 'table' },
    { route: `/appstructure/${TEMPLATE}`, id: 'as-search' },
    { route: `/portfoliostructure/${TEMPLATE}`, id: 'ps-search' },
    { route: '/selectTemplate', id: 'st-search' },
    { route: '/admin', id: 'admin-search' },
  ];

  for (const field of fields) {
    await page.goto(`/#${field.route}`);
    if (field.tab) await page.locator(`[data-tab="${field.tab}"]`).click();

    const input = page.locator(`[id="${field.id}"]`);
    await input.click();
    await page.keyboard.type('Alpha');

    await expect(input).toHaveValue('Alpha');
    await expect(input).toBeFocused();

    await page.locator(`[data-clears="${field.id}"]`).click();
    await expect(page.locator(`[id="${field.id}"]`)).toHaveValue('');
  }

  assertNoPageErrors();
});

test('sidebar and content panels stay side by side and on screen', async ({ page }) => {
  const assertNoPageErrors = failOnPageErrors(page);
  // Short viewport so the menu lists actually overflow their panels.
  await page.setViewportSize({ width: 1280, height: 640 });

  const views = [
    { route: `/datastructure/${TEMPLATE}`, sidebar: '.select-input > .choose-from', content: '.select-input > .selected', list: '.select-input .list-of-templates' },
    { route: `/appstructure/${TEMPLATE}`, sidebar: '.structure-sidebar', content: '.structure-content', list: '.structure-menu-panel .list-of-templates' },
    { route: `/portfoliostructure/${TEMPLATE}`, sidebar: '.structure-sidebar', content: '.structure-content', list: '.structure-menu-panel .list-of-templates' },
    { route: `/revisions/${TEMPLATE}`, sidebar: '.revisions-sidebar', content: '.revisions-content', list: '.revisions-sidebar .list-of-templates' },
    { route: '/selectTemplate', sidebar: '#choose-from', content: '#selected-template', list: '.template-menu-panel .list-of-templates' },
  ];

  for (const view of views) {
    await page.goto(`/#${view.route}`);
    await expectPanelLayout(page, view);
  }

  assertNoPageErrors();
});

test('Data Structure edits inputs and outputs and saves a commit message', async ({ page }) => {
  const assertNoPageErrors = failOnPageErrors(page);
  await page.goto(`/#/datastructure/${TEMPLATE}`);
  await expect(page.getByRole('heading', { name: 'Inputs' })).toBeVisible();

  await page.locator('#ds-edit-toggle').click();
  await page.locator('[data-input-display="Sheet1!Input"]').fill('Updated input');
  await page.locator('[data-input-units="Sheet1!Input"]').fill('months');
  await page.locator('[data-input-description="Sheet1!Input"]').fill('Updated input description');
  await page.locator('[data-input-val="Sheet1!Input"]').fill('42');
  await page.locator('[data-input-inherited="Sheet1!Input"]').check();

  await page.locator('[data-tab="output"]').click();
  await page.locator('[data-row-edit="Sheet1!Output"]').click();
  await page.locator('[data-output-display="Sheet1!Output"]').fill('Updated output');
  await page.locator('[data-output-units="Sheet1!Output"]').fill('EUR');
  await page.locator('[data-output-postprocessing="Sheet1!Output"]').check();

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('unsaved changes');
    await dialog.dismiss();
  });
  await page.locator('.align-to-bottom a[href^="#/appstructure/"]').click();
  await expect(page).toHaveURL(new RegExp(`/datastructure/${TEMPLATE}$`));

  await expect(page.locator('#ds-save-open-btn')).toBeEnabled();
  await page.locator('#ds-save-open-btn').click();
  const commitDialog = page.getByRole('dialog', { name: 'Change Message' });
  await commitDialog.locator('#commit-display').fill('Update data structure fields');
  await commitDialog.getByRole('button', { name: 'Ok' }).click();

  await expect.poll(() => saveRequests.filter((request) => request.command === 'SaveDataStructure').length).toBe(1);
  const request = saveRequests.find((item) => item.command === 'SaveDataStructure');
  expect(request.commitMessage).toBe('Update data structure fields');
  expect(request.data.Inputs.find((input) => input.CellLink === 'Sheet1!Input')).toMatchObject({
    Display: 'Updated input',
    Units: 'months',
    Description: 'Updated input description',
    Val: '42',
    Inherited: true,
  });
  expect(request.data.Outputs.find((output) => output.CellLink === 'Sheet1!Output')).toMatchObject({
    Display: 'Updated output',
    Units: 'EUR',
    UsePostProcessingOutputs: true,
  });
  await expect(page.locator('#ds-save-open-btn')).toBeDisabled();
  assertNoPageErrors();
});

test('Data Structure includes and removes inputs, table inputs, and outputs', async ({ page }) => {
  const assertNoPageErrors = failOnPageErrors(page);
  await page.goto(`/#/datastructure/${TEMPLATE}`);
  await expect(page.getByRole('heading', { name: 'Inputs' })).toBeVisible();

  await page.locator('[data-include-input="Sheet1!ExcludedInput"]').click();
  await page.locator('[data-exclude-input="Sheet1!Input"]').click();

  await page.locator('[data-tab="table"]').click();
  await expect(page.locator('[data-select-pti="Sheet1!IncludedTable"]')).toBeVisible();
  await expect(page.locator('[data-choose-pti="Sheet1!AvailableTable"]')).toBeVisible();
  await expect(page.locator('[data-choose-pti="Sheet1!ExcludedTable"]')).toBeVisible();
  await page.locator('[data-exclude-pti="Sheet1!IncludedTable"]').click();
  await expect(page.locator('[data-choose-pti="Sheet1!IncludedTable"]')).toBeVisible();
  await expect(page.getByText('Available preview', { exact: true })).toHaveCount(0);
  await page.locator('[data-choose-pti="Sheet1!ExcludedTable"]').click();
  await expect(page.getByText('Excluded preview', { exact: true })).toBeVisible();
  await page.locator('[data-include-pti="Sheet1!ExcludedTable"]').click();
  await expect(page.locator('[data-select-pti="Sheet1!ExcludedTable"]')).toBeVisible();

  await page.locator('[data-tab="output"]').click();
  await page.locator('[data-include-output="Sheet1!ExcludedOutput"]').click();
  await page.locator('[data-exclude-output="Sheet1!Growth"]').click();

  await page.locator('#ds-save-open-btn').click();
  const commitDialog = page.getByRole('dialog', { name: 'Change Message' });
  await commitDialog.locator('#commit-display').fill('Change included data ranges');
  await commitDialog.getByRole('button', { name: 'Ok' }).click();

  await expect.poll(() => saveRequests.filter((request) => request.command === 'SaveDataStructure').length).toBe(1);
  const request = saveRequests.find((item) => item.command === 'SaveDataStructure');
  expect(request.data.Inputs.map((input) => input.CellLink)).toEqual([
    'Sheet1!ExcludedInput',
    'Sheet1!ExcludedTable',
  ]);
  expect(request.data.Outputs.map((output) => output.CellLink)).toEqual([
    'Sheet1!Output',
    'Sheet1!ExcludedOutput',
  ]);
  assertNoPageErrors();
});

test('Platform Data Structure enables save for checkbox-only changes', async ({ page }) => {
  const assertNoPageErrors = failOnPageErrors(page);
  await page.goto(`/#/platformDataStructure/${TEMPLATE}`);
  await expect(page.getByRole('heading', { name: 'Platform Data Structure' })).toBeVisible();

  await page.locator('#ds-edit-toggle').click();
  await page.locator('[data-input-inherited="Sheet1!Input"]').check();
  await expect(page.locator('#ds-save-open-btn')).toBeEnabled();
  await page.locator('#ds-save-open-btn').click();
  await page.getByRole('dialog', { name: 'Change Message' }).getByRole('button', { name: 'Ok' }).click();

  await expect.poll(() => saveRequests.filter((request) => request.command === 'SaveDataStructure').length).toBe(1);
  const request = saveRequests.find((item) => item.command === 'SaveDataStructure');
  expect(request.isPlatform).toBe('true');
  expect(request.data.Inputs.find((input) => input.CellLink === 'Sheet1!Input').Inherited).toBe(true);
  assertNoPageErrors();
});

test('Data Structure exposes retry after a load failure', async ({ page }) => {
  const assertNoPageErrors = failOnPageErrors(page);
  let failDataStructure = true;
  await page.route('**/kirk/wizard/main**', async (route) => {
    const url = new URL(route.request().url());
    if (failDataStructure && url.searchParams.get('command') === 'GetDataStructure') {
      await route.fulfill({ status: 500, json: { message: 'Temporary data structure failure' } });
      return;
    }
    await route.fallback();
  });

  await page.goto(`/#/datastructure/${TEMPLATE}`);
  await expect(page.getByText(/GetDataStructure failed with HTTP 500/i).first()).toBeVisible();
  failDataStructure = false;
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByRole('heading', { name: 'Inputs' })).toBeVisible();
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

test('App Structure edits Metalog keys, failure stages, and simulation settings', async ({ page }) => {
  const assertNoPageErrors = failOnPageErrors(page);
  await page.goto(`/#/appstructure/${TEMPLATE}`);

  await page.getByText('Metalog', { exact: true }).click();
  await page.locator('[data-metalog-key="Output"]').click();
  await expect(page.getByText('Output', { exact: true }).last()).toBeVisible();

  await page.getByText('Explanation', { exact: true }).click();
  await page.locator('[data-field="Parameters.FittedPointExplanation"]').fill('Updated fitted-point guidance');

  await page.getByText('FailureBranch', { exact: true }).click();
  await page.locator('#as-failure-add').click();
  await page.locator('[data-failure-field="ProbabilityFailureOfStageKey:0"]').selectOption('Output');
  await page.locator('[data-failure-field="CumeCostOfStageKey:0"]').selectOption('Growth');
  await page.locator('#as-failure-add').click();
  await expect(page.locator('[data-failure-delete]')).toHaveCount(2);
  await page.locator('[data-failure-delete="1"]').click();
  await expect(page.locator('[data-failure-delete]')).toHaveCount(1);

  await page.getByText('Simulation', { exact: true }).click();
  await page.locator('[data-field="Parameters.CalcMVSFromFittedPoints"]').check();

  await page.locator('#as-save-btn').click();
  const commitDialog = page.getByRole('dialog', { name: 'Change Message' });
  await commitDialog.locator('#commit-display').fill('Update Metalog settings');
  await commitDialog.getByRole('button', { name: 'Ok' }).click();

  await expect.poll(() => saveRequests.length).toBe(1);
  const savedMetalog = saveRequests[0].data.MENU.find((menu) => menu.ID === 'metalog');
  const savedTornado = saveRequests[0].data.MENU.find((menu) => menu.ID === 'tornado');
  expect(savedMetalog.Parameters).toMatchObject({
    MetaLogKeys: ['Output'],
    FittedPointExplanation: 'Updated fitted-point guidance',
    CalcMVSFromFittedPoints: true,
    FailureBranch: {
      Stages: [{
        NodeLookup: 'Outputs',
        ProbabilityFailureOfStageKey: 'Output',
        CumeCostOfStageKey: 'Growth',
      }],
      SubtractCostGivenSuccess: true,
    },
  });
  expect(savedTornado.Parameters.MetaLogKeys).toEqual(['Output']);
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

test('Platform App Structure edits CFO, Innovation, and Scatter series', async ({ page }) => {
  const assertNoPageErrors = failOnPageErrors(page);
  await page.goto(`/#/platformAppStructure/${TEMPLATE}`);

  await page.getByText('CFO Chart', { exact: true }).click();
  await page.locator('[data-set-field="AverageCost:0"]').selectOption('Output');
  await page.locator('[data-set-field="AverageValueMinusCost:0"]').selectOption('Growth');
  await page.locator('#as-cfo-add').click();
  await expect(page.locator('[data-set-field^="name:"]')).toHaveCount(2);
  await page.locator('[data-cfo-delete="1"]').click();

  await page.getByText('Innovation Screen', { exact: true }).click();
  await page.locator('[data-set-field="x:0"]').selectOption('Output');
  await page.locator('[data-set-field="y:0"]').selectOption('Growth');
  await page.locator('[data-set-field="VerticalCutoff:0"]').fill('25');
  await page.locator('#as-innovation-add').click();
  await expect(page.locator('[data-set-field^="name:"]')).toHaveCount(2);
  await page.locator('[data-innovation-delete="1"]').click();

  await page.getByText('Scatter Plot', { exact: true }).click();
  await page.locator('[data-field="Parameters.SameScale"]').check();
  await page.locator('[data-field="Parameters.Min"]').fill('0');
  await page.locator('[data-field="Parameters.Max"]').fill('100');
  await page.locator('[data-set-field="x:0"]').selectOption('Output');
  await page.locator('[data-set-field="y:0"]').selectOption('Growth');
  await page.locator('#as-scatter-add').click();
  await expect(page.locator('[data-set-field^="name:"]')).toHaveCount(2);
  await page.locator('[data-scatter-delete="1"]').click();

  await page.locator('#as-save-btn').click();
  const commitDialog = page.getByRole('dialog', { name: 'Change Message' });
  await commitDialog.locator('#commit-display').fill('Update series charts');
  await commitDialog.getByRole('button', { name: 'Ok' }).click();

  await expect.poll(() => saveRequests.length).toBe(1);
  const menus = saveRequests[0].data.MENU;
  expect(menus.find((menu) => menu.ID === 'cfo-chart').Parameters.Sets[0]).toMatchObject({
    AverageCost: "Outputs['Output']",
    AverageValueMinusCost: "Outputs['Growth']",
    xTitle: 'Output',
    yTitle: 'Growth',
  });
  expect(menus.find((menu) => menu.ID === 'innovation-screen').Parameters.Sets[0]).toMatchObject({
    x: "Outputs['Output']",
    y: "Outputs['Growth']",
    xTitle: 'Output',
    yTitle: 'Growth',
    VerticalCutoff: 25,
  });
  expect(menus.find((menu) => menu.ID === 'scatter-plot').Parameters).toMatchObject({
    SameScale: true,
    Min: 0,
    Max: 100,
    Sets: [{
      x: "Outputs['Output']",
      y: "Outputs['Growth']",
      xTitle: 'Output',
      yTitle: 'Growth',
      name: 'Series 1',
    }],
  });
  assertNoPageErrors();
});

test('Portfolio Structure edits command forms and saves their settings', async ({ page }) => {
  const assertNoPageErrors = failOnPageErrors(page);
  await page.goto(`/#/portfoliostructure/${TEMPLATE}`);

  await page.locator('#ps-cv-add').click();
  await page.locator('[data-cv-key-index="0"]').selectOption('Output');
  await expect(page.locator('[data-cv-unit-index="0"]')).toHaveValue('USD');
  await expect(page.locator('[data-cv-title-index="0"]')).toHaveValue('Output');
  await page.locator('#ps-cv-total').check();
  await page.locator('#ps-cv-min').fill('10');
  await page.locator('#ps-cv-max').fill('90');

  await page.getByText('Portfolio CFO', { exact: true }).first().click();
  await page.locator('[data-cfo-xkey-index="0"]').selectOption('Output');
  await page.locator('[data-cfo-ykey-index="0"]').selectOption('Growth');
  await page.locator('#ps-cfo-add').click();
  await expect(page.locator('[data-cfo-name-index]')).toHaveCount(2);
  await page.locator('[data-cfo-delete-index="1"]').click();

  await page.getByText('Portfolio Innovation', { exact: true }).first().click();
  await page.locator('[data-is-xkey-index="0"]').selectOption('Output');
  await page.locator('[data-is-ykey-index="0"]').selectOption('Growth');
  await page.locator('[data-is-vcutoff-index="0"]').fill('25');

  await page.getByText('Portfolio Scatter', { exact: true }).first().click();
  await page.locator('#ps-sp-samescale').check();
  await page.locator('#ps-sp-min').fill('0');
  await page.locator('#ps-sp-max').fill('100');
  await page.locator('[data-sp-xkey-index="0"]').selectOption('Output');
  await page.locator('[data-sp-ykey-index="0"]').selectOption('Growth');

  await page.locator('#ps-save-btn').click();
  const commitDialog = page.getByRole('dialog', { name: 'Change Message' });
  await commitDialog.locator('#commit-display').fill('Update portfolio charts');
  await commitDialog.getByRole('button', { name: 'Ok' }).click();

  await expect.poll(() => saveRequests.length).toBe(1);
  expect(saveRequests[0].commitMessage).toBe('Update portfolio charts');
  const menus = saveRequests[0].data.MENU;
  expect(menus.find((menu) => menu.ID === 'compare-value').Parameters).toMatchObject({
    Keys: ['Output'],
    Units: ['USD'],
    Titles: ['Output'],
    Total: true,
    Min: 10,
    Max: 90,
  });
  expect(menus.find((menu) => menu.ID === 'portfolio-cfo').Parameters.Sets[0]).toMatchObject({
    AverageCost: "Outputs['Output']",
    AverageValueMinusCost: "Outputs['Growth']",
    xTitle: 'Output',
    yTitle: 'Growth',
  });
  expect(menus.find((menu) => menu.ID === 'portfolio-innovation').Parameters.Sets[0]).toMatchObject({
    x: "Outputs['Output']",
    y: "Outputs['Growth']",
    VerticalCutoff: 25,
  });
  expect(menus.find((menu) => menu.ID === 'portfolio-scatter').Parameters).toMatchObject({
    SameScale: true,
    Min: 0,
    Max: 100,
    Sets: [{ x: "Outputs['Output']", y: "Outputs['Growth']", name: 'Series 1' }],
  });
  assertNoPageErrors();
});

test('Portfolio Structure bucket editor right-justifies its edit pencils', async ({ page }) => {
  const assertNoPageErrors = failOnPageErrors(page);
  await page.goto(`/#/portfoliostructure/${TEMPLATE}`);
  await page.getByText('Portfolio Buckets', { exact: true }).first().click();

  await expectPulledRight(page, '[data-bc-makeeditable-index="0"]', '.col-md-9');
  await page.locator('[data-bc-makeeditable-index="0"]').click();
  await expectPulledRight(page, '[data-bucket-name-edit-toggle="0:0"]', 'td');
  await expectPulledRight(page, '[data-bucket-rules-edit-toggle="0:0"]', 'td');

  assertNoPageErrors();
});

test('Portfolio Structure edits tables, buckets, and uncertainty settings', async ({ page }) => {
  const assertNoPageErrors = failOnPageErrors(page);
  await page.goto(`/#/portfoliostructure/${TEMPLATE}`);

  await page.getByText('Portfolio Table View', { exact: true }).first().click();
  await expect(page.locator('[data-table-index="0"]')).toHaveText('Portfolio Table');
  await page.locator('[data-table-index="0"]').click();
  await page.locator('#ps-add-tables-pnl').check();
  await page.locator('#ps-min-precision').fill('1');
  await page.locator('#ps-max-precision').fill('3');
  await page.locator('#ps-default-precision').selectOption('3');

  await page.getByText('Portfolio Buckets', { exact: true }).first().click();
  await page.locator('[data-bc-makeeditable-index="0"]').click();
  await page.locator('[data-bucket-name-edit-toggle="0:0"]').click();
  await page.locator('[data-bucket-name-edit="0:0"]').fill('Low');
  await page.locator('[data-bucket-name-done="0:0"]').click();
  await page.locator('#ps-bc-add-set').click();
  await page.locator('[data-bc-title-index="1"]').fill('Second distribution');
  await page.locator('[data-bc-numbuckets-index="1"]').fill('2');
  await page.locator('[data-bc-low-index="1"]').fill('0');
  await page.locator('[data-bc-high-index="1"]').fill('20');
  await page.locator('[data-bc-generate-index="1"]').click();
  await page.locator('[data-bc-makeeditable-index="1"]').click();
  await expect(page.locator('[data-bucket-name-edit-toggle^="1:"]')).toHaveCount(2);

  await page.getByText('Portfolio Uncertainty', { exact: true }).first().click();
  await page.locator('#ps-pu-source').selectOption('portfolio-source');
  await page.locator('#ps-pu-mvstype').selectOption('MVSFromFittedPoints');
  await page.locator('#ps-pu-representation').selectOption('Curve');
  await page.locator('#ps-pu-explanation').fill('Portfolio uncertainty guidance');
  await page.locator('[data-pu-add-key="Output"]').click();

  await page.locator('#ps-save-btn').click();
  const commitDialog = page.getByRole('dialog', { name: 'Change Message' });
  await commitDialog.locator('#commit-display').fill('Update portfolio configuration');
  await commitDialog.getByRole('button', { name: 'Ok' }).click();

  await expect.poll(() => saveRequests.length).toBe(1);
  const menus = saveRequests[0].data.MENU;
  expect(menus.find((menu) => menu.ID === 'portfolio-table-view').Parameters).toMatchObject({
    Key: 'Table',
    Pnl: true,
    PrecisionOptions: [1, 2, 3],
    DefaultPrecision: 3,
  });
  expect(menus.find((menu) => menu.ID === 'portfolio-buckets').Parameters.Sets).toMatchObject([
    { xBuckets: [{ Name: 'Low' }] },
    { Title: 'Second distribution', xBuckets: [{ Name: '0.00-10.00' }, { Name: '10.00-20.00' }] },
  ]);
  expect(menus.find((menu) => menu.ID === 'portfolio-uncertainty').Parameters).toMatchObject({
    Source: 'portfolio-source',
    MVSType: 'MVSFromFittedPoints',
    Representation: 'Curve',
    PortfolioUncExplanation: 'Portfolio uncertainty guidance',
    RollupKeys: ['Output'],
  });
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

