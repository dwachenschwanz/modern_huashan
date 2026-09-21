/*
 * Shared authenticated-area navbar, ported from the near-identical markup
 * repeated at the top of admin.html, json.html, datastructure.html,
 * appstructure.html, portfolioStructure.html and revisions.html.
 *
 * The legacy views also linked to the "platform" variant of each structure
 * (`#/platformDataStructure/...` etc.) but that `<li>` was commented out in
 * every view (dead markup) - only the "Project X Structure" link is live, so
 * that's all this renders.
 *
 * `active` selects which nav entry gets the `active` class:
 * 'json' | 'dataStructure' | 'appStructure' | 'portfolioStructure' | 'revisions' | 'admin' | 'selectTemplate' | null
 */
import { escapeHtml } from '../core/html.js';

export function appNavHtml({ active = null, isAdmin = false, selectedTemplate = 'Not Selected', showTemplateBadge = true } = {}) {
  const hasTemplate = selectedTemplate && selectedTemplate !== 'Not Selected';
  const cls = (name) => (active === name ? 'dropdown active' : 'dropdown');
  const encodedTemplate = encodeURIComponent(selectedTemplate || '');

  return `
<nav class="navbar navbar-inverse navbar-static-top" role="navigation" style="margin-bottom: 10px;">
  <div class="container-fluid">
    <div class="navbar-header">
      <a class="navbar-brand">Huashan</a>
    </div>
    <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
      <ul class="nav navbar-nav">
        <li><a href="#">Home</a></li>
        ${isAdmin ? `<li${active === 'admin' ? ' class="active"' : ''}><a href="#/admin">Admin</a></li>` : ''}
        <li${active === 'selectTemplate' ? ' class="active"' : ''}><a href="#/selectTemplate">Select Template</a></li>
        ${
          hasTemplate
            ? `<li${active === 'json' ? ' class="active"' : ''}><a href="#/json/${encodedTemplate}">JSON</a></li>
        <li class="${cls('dataStructure')}">
          <a href="" class="dropdown-toggle" data-toggle="dropdown">Data Structure <span class="caret"></span></a>
          <ul class="dropdown-menu" role="menu">
            <li><a href="#/datastructure/${encodedTemplate}">Project Data Structure</a></li>
          </ul>
        </li>
        <li class="${cls('appStructure')}">
          <a href="" class="dropdown-toggle" data-toggle="dropdown">App Structure <span class="caret"></span></a>
          <ul class="dropdown-menu" role="menu">
            <li><a href="#/appstructure/${encodedTemplate}">Project App Structure</a></li>
          </ul>
        </li>
        <li class="${cls('portfolioStructure')}">
          <a href="" class="dropdown-toggle" data-toggle="dropdown">Portfolio Structure <span class="caret"></span></a>
          <ul class="dropdown-menu" role="menu">
            <li><a href="#/portfoliostructure/${encodedTemplate}">Project Portfolio Structure</a></li>
          </ul>
        </li>
        <li${active === 'revisions' ? ' class="active"' : ''}><a href="#/revisions/${encodedTemplate}">Revisions</a></li>`
            : ''
        }
      </ul>
      <ul class="nav navbar-nav navbar-right">
        ${
          hasTemplate && showTemplateBadge
            ? `<li class="active"><a class="navbar-brand" href=""><b>${escapeHtml(selectedTemplate)}</b></a></li>`
            : ''
        }
      </ul>
    </div>
  </div>
</nav>`;
}
