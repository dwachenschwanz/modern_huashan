/*
 * Shared authenticated-area navbar, ported from the near-identical markup
 * repeated at the top of admin.html, json.html, datastructure.html,
 * appstructure.html, portfolioStructure.html and revisions.html.
 *
 * The legacy views also linked to the "platform" variant of each structure
 * (`#/platformDataStructure/...` etc.) but that `<li>` was commented out in
 * every view (dead markup) - only the "Project X Structure" route is live,
 * so each structure entry links straight there instead of behind a dropdown.
 *
 * `active` selects which nav entry gets the `active` class:
 * 'json' | 'dataStructure' | 'appStructure' | 'portfolioStructure' | 'revisions' | 'admin' | 'selectTemplate' | null
 */
import { escapeHtml } from '../core/html.js';
import { getUserName } from '../core/user.js';
import { logout } from '../core/session.js';
import smartorgIconUrl from '../assets/smartorg-icon.png';

/* `userName` defaults from the session rather than being threaded through
 * every view the way `isAdmin` is: it is the same for every screen, so a
 * parameter would only mean six call sites repeating one lookup. */
export function appNavHtml({
  active = null, isAdmin = false, selectedTemplate = 'Not Selected', showTemplateBadge = true, userName = getUserName(),
} = {}) {
  const hasTemplate = selectedTemplate && selectedTemplate !== 'Not Selected';
  const encodedTemplate = encodeURIComponent(selectedTemplate || '');
  const displayName = userName || 'Account';

  return `
<nav class="app-nav navbar navbar-inverse navbar-static-top" role="navigation" style="margin-bottom: 10px;">
  <div class="container-fluid">
    <div class="navbar-header">
      <a class="app-nav-brand navbar-brand" href="#/selectTemplate">
        <img src="${smartorgIconUrl}" alt="" class="app-nav-brand-icon">
        <span class="app-nav-brand-text">Huashan Wizard</span>
      </a>
    </div>
    <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
      <ul class="nav navbar-nav app-nav-views">
        ${isAdmin ? `<li${active === 'admin' ? ' class="active"' : ''}><a href="#/admin">Admin</a></li>` : ''}
        <li${active === 'selectTemplate' ? ' class="active"' : ''}><a href="#/selectTemplate">Select Template</a></li>
        ${
          hasTemplate
            ? `<li${active === 'json' ? ' class="active"' : ''}><a href="#/json/${encodedTemplate}">JSON</a></li>
        <li${active === 'dataStructure' ? ' class="active"' : ''}><a href="#/datastructure/${encodedTemplate}">Data Structure</a></li>
        <li${active === 'appStructure' ? ' class="active"' : ''}><a href="#/appstructure/${encodedTemplate}">App Structure</a></li>
        <li${active === 'portfolioStructure' ? ' class="active"' : ''}><a href="#/portfoliostructure/${encodedTemplate}">Portfolio Structure</a></li>
        <li${active === 'revisions' ? ' class="active"' : ''}><a href="#/revisions/${encodedTemplate}">Revisions</a></li>`
            : ''
        }
      </ul>
      <ul class="nav navbar-nav navbar-right">
        ${
          hasTemplate && showTemplateBadge
            ? `<li class="app-nav-template"><span class="app-nav-template-chip"><i class="fa fa-file-text-o" aria-hidden="true"></i>${escapeHtml(selectedTemplate)}</span></li>`
            : ''
        }
        <li class="dropdown app-nav-user">
          <a href="#" class="dropdown-toggle app-nav-user-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">
            <i class="fa fa-user-circle" aria-hidden="true"></i>
            <span class="app-nav-user-name">${escapeHtml(displayName)}</span>
            <span class="caret"></span>
          </a>
          <ul class="dropdown-menu app-nav-user-menu">
            <li class="app-nav-user-identity">
              <span class="app-nav-user-identity-label">Signed in as</span>
              <span class="app-nav-user-identity-name">${escapeHtml(displayName)}</span>
              ${isAdmin ? '<span class="app-nav-user-role">Admin</span>' : ''}
            </li>
            <li class="app-nav-user-divider" role="separator"></li>
            <li><a href="#/login" data-logout><i class="fa fa-sign-out" aria-hidden="true"></i> Log out</a></li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</nav>`;
}

/*
 * Delegated from the document, because every view replaces the navbar when it
 * re-renders. The link is a real `#/login` anchor so the router's unsaved
 * changes guard intercepts it in the capture phase like any other in-app
 * link: if it blocks the click it also stops propagation, and this handler
 * never runs. Logging out therefore cannot skip the prompt.
 */
export function initAppNavLogout(root = document) {
  root.addEventListener('click', (event) => {
    if (!event.target.closest('[data-logout]')) return;
    event.preventDefault();
    logout();
    /* A full load rather than a route change: whatever logout() missed -
     * module state, the vendored SmartOrg global, a timer nobody stopped -
     * does not outlive it. */
    window.location.hash = '#/login';
    window.location.reload();
  });
}
