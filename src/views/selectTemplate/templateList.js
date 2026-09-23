import { escapeHtml } from '../../core/html.js';
import { initTooltips } from '../../components/uiInteractions.js';

export function filteredSortedTemplates(state) {
  const search = state.searchText.toLowerCase();
  const filtered = state.templates.filter((template) => !search || (template.name || '').toLowerCase().includes(search));
  const { column, descending } = state.sort;
  return [...filtered].sort((left, right) => {
    if (left[column] === right[column]) return 0;
    const comparison = left[column] > right[column] ? 1 : -1;
    return descending ? -comparison : comparison;
  });
}

export function templateListHtml(state) {
  if (state.loadingTable) return '<div class="loader-small"></div>';
  if (state.tableLoadError) {
    return `<div class="alert alert-danger" role="alert">${escapeHtml(state.tableLoadError)}</div>
      <button type="button" class="btn btn-primary" id="st-template-retry">Retry</button>`;
  }
  return filteredSortedTemplates(state).map((template, index) => `
    <a href="" class="list-group-item ${state.selectedTemplate === template.name ? 'active' : ''}" data-template-index="${index}" data-toggle="tooltip" title="${escapeHtml(template.name)}">
      <table><tr>
        <td class="appStructList">${escapeHtml(template.name)}</td>
        <td class="appStructList" style="width:60px">
          ${state.selectedTemplate === template.name && state.isAdmin ? '<span data-toggle="modal" data-target="#deleteModal" class="inline-icon pull-right glyphicon glyphicon-trash" title="Delete"></span><span data-toggle="modal" data-target="#renameModal" class="inline-icon pull-right glyphicon glyphicon-pencil" title="Rename"></span>' : ''}
        </td>
      </tr></table>
    </a>`).join('');
}

export function renderTemplateList({ container, state, onRetry, onSelect }) {
  const listElement = container.querySelector('#st-template-list');
  if (!listElement) return;
  listElement.innerHTML = templateListHtml(state);
  listElement.querySelector('#st-template-retry')?.addEventListener('click', onRetry);
  const rows = filteredSortedTemplates(state);
  listElement.querySelectorAll('[data-template-index]').forEach((element) => {
    element.addEventListener('click', (event) => {
      event.preventDefault();
      onSelect(rows[Number(element.dataset.templateIndex)]);
    });
  });
  initTooltips(listElement);
}
