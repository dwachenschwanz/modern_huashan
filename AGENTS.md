# AGENTS.md

Huashan Wizard: Vite + vanilla JavaScript (ES modules) frontend for managing
SmartOrg templates. See `README.md` for full product/architecture docs.

## Never search or read

- `node_modules/` — dependencies.
- `dist/` — generated build output (gitignored).
- `legacy/` — previous AngularJS app, kept as inactive reference only.
- `test-results/` — Playwright run output (`.last-run.json` etc.), not test
  source.
- `public/vendor/` — third-party vendored code (e.g. `smartorg.js`, loaded
  as a browser global), not app code.

README states Node.js 20.19+ (20.x line) or 22.12+, but there's no `engines`
field in `package.json` and no npm engine warnings — in practice newer Node
(tested with v24) installs and lints cleanly. Don't treat Node version as a
suspect for unrelated failures; it isn't enforced.

## Commands

| Command | Purpose | Cost |
| --- | --- | --- |
| `npm run lint` | ESLint (`--max-warnings=0`) | fast |
| `npm test` | Node test runner, `test/*.test.js` | fast |
| `npm run dev` | Vite dev server, port 5173, proxies `/kirk` | long-running, foreground |
| `npm run build` | Production build into `dist/` | slow |
| `npm run test:browser` | Playwright smoke tests (mocked backend) | slow |
| `npm run check` | lint + test + build + test:browser | slow |

Use `lint`/`test` for fast iteration while editing. Reserve `npm run check`
for final verification before calling a change done — don't rerun it after
every small edit. If it can't be run, say so rather than claiming verified.

Setup (only if not already done): `npm install`, then
`npx playwright install chromium` once for browser tests.

## Where to look for a task

- Editing a structure screen (Data/App/Portfolio) → its coordinator in
  `src/views/<name>/<name>.js` plus editor submodules in the same folder
  (e.g. `dataStructure/inputEditor.js`, `tableInputEditor.js`,
  `outputEditor.js`).
- Backend/API request behavior → `src/api/huashanClient.js` (all Kirk/
  CalcEngine calls go through here) and `src/core/config.js` (endpoint
  config, same-origin `/kirk/...` paths, Vite proxy in `vite.config.js`).
- Auth/session bugs → `src/core/auth.js`, `session.js`, `cookies.js`.
  Session state: `JWT-TOKEN`/`INFO` in `localStorage`, `huashansession`
  cookie for restore; authenticated views call `restoreSession()`.
- Routing/navigation guards → `src/core/router.js`; route registration and
  app startup → `src/main.js` (routes are imported lazily there — keep new
  route registrations there rather than scattering imports elsewhere).
- Shared UI (modals, overlays, JSON editor, nav) → `src/components/`.
- Unit tests → `test/`; Playwright workflow tests → `tests/browser/`.

## Code conventions (deviations worth knowing)

- No framework — vanilla ES modules only. Don't reintroduce Bootstrap,
  AngularJS, or jQuery.
- `no-unused-vars` and `no-useless-assignment` are disabled in
  `eslint.config.js` — don't flag or "fix" these as if they were errors.
- Route modules export `mount(container, params)` and return a cleanup
  function when they register guards, listeners, timers, or chart
  instances — destroy CodeMirror/Highcharts instances and listeners there.
- Use `escapeHtml()` (`src/core/html.js`) for server-provided text in HTML.

## CSS

- Plain CSS, no preprocessor, no Bootstrap/Tailwind.
- `src/styles/tokens.css` holds the design tokens (colour, spacing, radius,
  shadow, type) as `:root` custom properties, and is imported first. Reach
  for a token rather than a literal: `var(--border)`, not `#ddd`. Prefer the
  semantic name (`--surface`, `--ink-muted`) over the raw ramp (`--n-0`).
- The app is single-accent: `--action` is an alias of `--brand` (SmartOrg
  maroon), so there is no second interactive colour — don't add one. Say
  `--action` where a rule means "interactive" and `--brand` where it means
  "SmartOrg" (nav, login, selection markers); they resolve alike, but the
  intent stays readable at the call site. Remaining hues are reserved by
  meaning: `--edit` (teal-blue) for edit affordances, `--ok` for additive
  actions, `--warn`, and `--danger` for destructive only, never "save".
- Buttons are tiered by purpose: `.btn-primary` (the one thing a screen is
  for), `.btn-tonal` (supporting actions, forward navigation), `.btn-edit`
  (the Edit All toggle and per-row pencils), `.btn-default` (back
  navigation, row controls), `.btn-ghost` (dismissal). `.btn-success` and
  `.btn-danger` keep their meanings; `.btn-info` is a legacy name aliased
  onto the neutral fill. A filled non-primary tier needs a border clearing
  3:1 against the page (WCAG 1.4.11) — a hairline is invisible.
- `.row` / `col-sm-*` are a CSS Grid shim in `base.css`, not Bootstrap, and
  renaming them is churn. Don't give `.row` a clearfix (the pseudo-element
  becomes a grid item) and don't convert the columns back to floats.
  `.pull-left` / `.pull-right` remain for containers that still hold floats.
- `src/styles/app.css` is the single entry point; it only `@import`s the
  other files in the folder. Add a new view's stylesheet there.
- Icons are Font Awesome throughout. Bootstrap glyphicons are gone — don't
  reintroduce `glyphicon-*` class names.
- One stylesheet per view (`data-structure.css`, `app-structure.css`,
  `select-template.css`, etc.); `base.css`/`main.css` hold shared/global
  rules, `admin.css`/`json.css`/`loading-overlay.css` are component/route
  specific. Put view-specific rules in that view's file, not `base.css`.
- `animate.css` is a vendored third-party library — never hand-edit it.

## Git / PR hygiene

- Don't touch `legacy/` or `dist/`.
- Keep commits scoped to the requested change.
