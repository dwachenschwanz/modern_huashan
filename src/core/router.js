/*
 * Minimal hash router replacing ngRoute's $routeProvider, preserving the
 * same route table/URLs as app.ts so existing bookmarks and any embedding
 * CMS links (e.g. #/appstructure/templateID) keep working.
 *
 * Each route's `mount(container, params)` receives the app's root element
 * and the route params (e.g. `{ templateID }`), and may return a cleanup
 * function that's called before the next route mounts.
 */

const routes = [];
let notFoundRoute = null;
let currentCleanup = null;
let rootEl = null;
let navigationGuard = null;

function compileRoute(path) {
  const paramNames = [];
  const pattern = path
    .split('/')
    .map((segment) => {
      if (segment.startsWith(':')) {
        paramNames.push(segment.slice(1));
        return '([^/]+)';
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');
  return { regex: new RegExp(`^${pattern}$`), paramNames };
}

export function addRoute(path, mount) {
  routes.push({ ...compileRoute(path), mount });
}

export function otherwise(mount) {
  notFoundRoute = { mount };
}

function currentHashPath() {
  const hash = window.location.hash || '';
  const path = hash.startsWith('#') ? hash.slice(1) : hash;
  return path.split('?')[0] || '/login';
}

async function handleRouteChange() {
  const path = currentHashPath();

  if (typeof currentCleanup === 'function') {
    try {
      currentCleanup();
    } catch (err) {
      console.error('Error cleaning up previous view', err);
    }
    currentCleanup = null;
  }

  for (const route of routes) {
    const match = route.regex.exec(path);
    if (match) {
      const params = {};
      route.paramNames.forEach((name, i) => {
        params[name] = decodeURIComponent(match[i + 1]);
      });
      currentCleanup = await route.mount(rootEl, params);
      return;
    }
  }

  if (notFoundRoute) {
    currentCleanup = await notFoundRoute.mount(rootEl, {});
  }
}

export function navigate(path) {
  window.location.hash = `#${path}`;
}

/*
 * Ported from the `$locationChangeStart` unsaved-changes guard used by the
 * JSON/dataStructure/appStructure/portfolioStructure controllers: while a
 * guard is set, clicking an in-app `#/...` link asks for confirmation first.
 * `guardFn(nextPath)` returns true to allow navigation, false to block it.
 * A view should call `setNavigationGuard` on mount and `clearNavigationGuard`
 * in its cleanup function.
 *
 * Note: unlike Angular's $locationChangeStart, this can only intercept link
 * clicks within the app - not the browser's back/forward buttons or manual
 * address-bar edits, since a `hashchange` event fires only after the URL has
 * already changed and can't be cancelled.
 */
export function setNavigationGuard(guardFn) {
  navigationGuard = guardFn;
}

export function clearNavigationGuard() {
  navigationGuard = null;
}

function guardedLinkClick(evt) {
  if (!navigationGuard) return;
  const link = evt.target.closest('a[href^="#/"]');
  if (!link) return;
  const nextPath = link.getAttribute('href').slice(1);
  if (!navigationGuard(nextPath)) {
    evt.preventDefault();
    evt.stopPropagation();
  }
}

export function startRouter(container) {
  rootEl = container;
  document.addEventListener('click', guardedLinkClick, true);
  window.addEventListener('hashchange', handleRouteChange);
  if (!window.location.hash) {
    window.location.hash = '#/login';
  } else {
    handleRouteChange();
  }
}
