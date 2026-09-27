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

export function appNavHtml({ active = null, isAdmin = false, selectedTemplate = 'Not Selected', showTemplateBadge = true } = {}) {
  const hasTemplate = selectedTemplate && selectedTemplate !== 'Not Selected';
  const encodedTemplate = encodeURIComponent(selectedTemplate || '');

  return `
<nav class="app-nav navbar navbar-inverse navbar-static-top" role="navigation" style="margin-bottom: 10px;">
  <div class="container-fluid">
    <div class="navbar-header">
      <a class="app-nav-brand navbar-brand" href="#/selectTemplate">
        <img src="/images/smartorg-icon.png" alt="" class="app-nav-brand-icon">
        <span class="app-nav-brand-text">Huashan Wizard</span>
      </a>
    </div>
    <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
      <ul class="nav navbar-nav">
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
      </ul>
    </div>
  </div>
</nav>`;
}
