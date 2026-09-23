# Huashan Wizard

Huashan Wizard is a browser application for managing SmartOrg templates and
turning Excel-backed models into web applications. This repository contains
the modern Vite and vanilla JavaScript implementation. The previous AngularJS
application remains under `legacy/` as a reference only.

## Features

- Authenticate through the SmartOrg and Kirk APIs.
- Browse, create, rename, archive, restore, upload, and download templates.
- Edit project and platform Data, App, and Portfolio Structures.
- Configure command-specific App Structure settings, including tornado,
  metalog, chart, bucket, and waterfall commands.
- Edit complete template JSON files with syntax highlighting, JSON linting,
  brace matching, code folding, undo/redo, and two-space indentation.
- Save changes with commit messages and browse or restore revisions.
- Preview tables and Highcharts charts returned by the CalcEngine API.

## Technology

- Vite 5
- Vanilla JavaScript ES modules
- CodeMirror 6 for JSON editing
- Highcharts for chart previews
- Font Awesome 4 icons
- Framework-free CSS and UI interactions

Bootstrap, AngularJS, `spin.js`, and `iosOverlay.js` are not used by the modern
application.

## Prerequisites

- Node.js 18 or newer
- npm
- Network access to the configured SmartOrg/Kirk backend
- A valid Huashan account

## Quick Start

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Vite serves the frontend and proxies requests beginning with `/kirk` to the
backend configured in `vite.config.js`.

## Available Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server on port 5173. |
| `npm run build` | Create a production build in `dist/`. |
| `npm run preview` | Serve the production build locally on port 4173. |
| `npm run lint` | Run ESLint, including undefined-variable checks. |
| `npm test` | Run the API client tests with Node's built-in test runner. |
| `npm run test:browser` | Run mocked-backend browser smoke tests in Chromium. |
| `npm run check` | Run lint, unit tests, build, and browser tests. |

The automated tests cover API transport, command-response parsing, session
restoration, navigation cancellation, hard-refresh route loading, modal
interaction, and Excel downloads. Install the Playwright browser once after
installing dependencies:

```bash
npx playwright install chromium
```

## Backend Configuration

The browser uses same-origin API URLs. The relevant configuration is:

```js
// src/core/config.js
export const DOMAIN = window.location.origin;
export const ENDPOINT = 'kirk';
```

This produces URLs such as:

```text
http://localhost:5173/kirk/framework/login/a/...
http://localhost:5173/kirk/wizard/main?command=...
```

During local development and preview, Vite forwards `/kirk` requests:

```js
// vite.config.js
const proxy = {
  '/kirk': {
    target: 'https://backend-corteva-redhat-container.smartorg.com',
    changeOrigin: true,
  },
};
```

### Change the Backend Host

Change only the `target` value in `vite.config.js`, then restart Vite:

```js
target: 'https://your-backend.example.com',
```

### Change the Endpoint Path

If the backend path is not `/kirk`, update both locations:

1. Change `ENDPOINT` in `src/core/config.js`.
2. Change the proxy key in `vite.config.js`.

For example, an endpoint named `huashan-api` must use an `ENDPOINT` value of
`'huashan-api'` and a `'/huashan-api'` proxy entry. Do not add an `/api` prefix
unless the backend actually serves that path.

### Production Proxy

The Vite proxy only applies to `npm run dev` and `npm run preview`. A production
web server must serve `dist/` and reverse-proxy the configured endpoint path to
the backend. Keeping API requests same-origin avoids browser CORS failures.

For an Nginx deployment, the required shape is:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}

location /kirk/ {
    proxy_pass https://backend.example.com/kirk/;
    proxy_set_header Host backend.example.com;
}
```

Adjust the upstream host and path for the target environment.

> **Docker status:** the checked-in `Dockerfile` still references the retired
> Angular application paths and scripts. It is not a supported build path for
> the current Vite application until it is updated.

## Application Routes

The application uses hash-based routing, so deep links have the form
`http://localhost:5173/#/route`.

| Route | View |
| --- | --- |
| `#/login` | Authentication |
| `#/admin` | Administrative operations |
| `#/selectTemplate` | Template selection and management |
| `#/json/:templateID` | Full JSON editors |
| `#/datastructure/:templateID` | Project Data Structure |
| `#/platformDataStructure/:templateID` | Platform Data Structure |
| `#/appstructure/:templateID` | Project App Structure |
| `#/platformAppStructure/:templateID` | Platform App Structure |
| `#/portfoliostructure/:templateID` | Project Portfolio Structure |
| `#/platformPortfolioStructure/:templateID` | Platform Portfolio Structure |
| `#/revisions/:templateID` | Revision history and comparison |

Platform routes are registered and can be opened directly, although the
current navigation menu exposes only project structure links.

## Project Structure

```text
.
|-- index.html                 Vite entry document
|-- public/
|   |-- images/                Static images
|   `-- vendor/smartorg.js     SmartOrg browser API loaded as a global
|-- src/
|   |-- api/                   Kirk/CalcEngine API client
|   |-- components/            Shared UI and behavior
|   |-- core/                  Router, session, configuration, and utilities
|   |-- lib/                   Local third-party compatibility code
|   |-- styles/                Global and view-specific CSS
|   |-- views/                 Route-level screens
|   `-- main.js                Route registration and app startup
|-- legacy/                    Read-only reference AngularJS application
|-- vite.config.js             Development and preview proxy configuration
`-- package.json               Dependencies and npm scripts
```

### Important Modules

- `src/api/huashanClient.js` wraps Wizard command GET/POST requests, uploads,
  response decoding, and token updates.
- `src/core/config.js` is the single source of truth for frontend endpoint
  paths and SmartOrg initialization.
- `src/core/router.js` handles hash routes, route cleanup, and unsaved-change
  guards.
- `src/core/session.js` restores the Huashan session from the
  `huashansession` cookie.
- `src/components/uiInteractions.js` implements modals, dropdowns, tooltips,
  popovers, and transient alerts without Bootstrap JavaScript.
- `src/components/loadingOverlay.js` provides the shared loading indicator.
- `src/components/jsonEditor.js` configures CodeMirror for JSON documents.

## Authentication and Session Data

Login is a two-stage operation:

1. `public/vendor/smartorg.js` authenticates the user and returns a JWT plus
   user metadata.
2. `src/api/huashanClient.js` runs the Kirk `Auth` command and stores the
   returned credentials in the current session and `huashansession` cookie.

The browser stores:

| Key | Location | Purpose |
| --- | --- | --- |
| `JWT-TOKEN` | `localStorage` | Authorization header for API requests |
| `INFO` | `localStorage` | Base64-encoded user metadata |
| `huashansession` | Cookie | Restores Kirk credentials after refresh |

Authenticated views call `restoreSession()` during mounting. Missing session
data redirects the user to `#/login`.

## Structure Editors

### Data Structure

The Data Structure screen loads included and excluded components, supports
component configuration and ordering, previews table outputs, and saves with a
commit message.

### App Structure

The App Structure screen renders command-specific controls rather than a raw
parameter textarea. Supported commands include:

- `INPUT_SCREEN`
- `TABLE`
- `TABLE_INPUT`
- `IMAGE`
- `ADD_TABLES`
- `COMPARE_VALUE`
- `COMPARE_UNCERTAINTY`
- `TORNADODIST`
- `METALOG_DISPLAY`
- `CFO_CHART`
- `INNOVATION_SCREEN`
- `SCATTER_PLOT`
- `BUCKET_CHART`
- `WATERFALL`

Project and platform structures expose different command choices. The tornado
editor includes Tornado Output, Parameters, and Post Processing tabs.

### Portfolio Structure

The Portfolio Structure screen configures portfolio menu commands.

All three structure views warn before navigation when unsaved changes exist.
They replace a failed initial load with an actionable error and Retry button,
and failed saves restore the controls instead of leaving a spinner active.

## Full JSON Editors

The JSON route provides independent CodeMirror editors for Data Structure, App
Structure, and Portfolio Structure JSON. Platform documents appear when the
template has platform data.

Editor behavior includes:

- Two-space indentation and Tab indentation
- Syntax highlighting and line numbers
- Parse-error highlighting and lint gutter markers
- Matching braces and automatic bracket/quote closing
- Code folding and selection matching
- Independent undo/redo history
- A validity message below each editor

Saving validates every displayed JSON document before submitting
`SaveTemplateJSON`. Invalid JSON is not sent to the backend.

## API Request Model

Most Wizard operations use one endpoint:

```text
/kirk/wizard/main?command=<CommandName>&kreds=<credentials>&...
```

Read operations use GET requests. Save operations use POST requests with a JSON
body. Responses are converted to the shared shape:

```js
{
  msg: '',
  status: true,
  result: {},
  credentials: '...'
}
```

File upload uses `/kirk/fileD`. Excel download uses
`/kirk/wizard/download/excel/:templateName` and validates the HTTP status,
content type, and response size before creating the browser download.

Wizard requests time out after 30 seconds (uploads after 120 seconds). Changing
routes aborts requests owned by the previous view, and cancelled requests do
not display an error. Transport, timeout, malformed-response, and HTTP errors
use consistent user-facing messages.

## Development Guidelines

- Keep endpoint configuration centralized in `src/core/config.js`.
- Add API operations through `src/api/huashanClient.js`.
- Route-level modules export a `mount(container, params)` function and return a
  cleanup function when they register guards or external resources.
- Destroy chart instances, editors, and listeners during route cleanup.
- Use `escapeHtml()` when inserting server-provided text into HTML templates.
- Use the shared components instead of adding Bootstrap or legacy vendor code.
- Treat `legacy/` as behavioral reference material, not active application
  code.

## Troubleshooting

### Browser Reports a CORS Error

Confirm requests are going to `http://localhost:5173/kirk/...`, not directly to
the remote backend. Restart Vite after editing `vite.config.js`. In production,
verify that the hosting server reverse-proxies `/kirk`.

### API Request Returns 405 Not Allowed

Check that the request path does not contain an unintended `/api` prefix and
that POST requests are reaching the same endpoint path expected by Kirk.

### A Structure Screen Keeps Loading

Inspect the failed `/kirk/wizard/main` request in browser developer tools. A
successful response must contain the expected structure and a `MENU` array.
Data Structure, App Structure, and Portfolio Structure display a retryable
error for invalid or failed responses.

### Login Works Until the Page Is Refreshed

Verify that the `huashansession` cookie is present and available at path `/`,
and that `JWT-TOKEN` exists in local storage.

### Excel Download Fails

Check the download request status and response `Content-Type`. JSON or HTML
responses usually indicate an authentication, proxy, or backend error rather
than an Excel file.

### JSON Cannot Be Saved

Resolve red lint markers and confirm every editor reports `Valid JSON`. The
save operation validates all project and platform documents together.

## Build Validation

Before committing changes, run:

```bash
npm run check
git diff --check
```

The generated `dist/` directory is ignored by Git and should be produced by
the deployment pipeline.
