/* Ported from adminController.ts + views/admin.html. */
import { huashan, isRequestAborted } from '../../api/huashanClient.js';
import { session, restoreSession } from '../../core/session.js';
import { SERVER_URL, TOKEN_KEY } from '../../core/config.js';
import { getRouteSignal, navigate } from '../../core/router.js';
import { flashAlert, initDropdowns } from '../../components/uiInteractions.js';
import { loadErrorMessage } from '../../components/loadError.js';
import { appNavHtml } from '../../components/appNav.js';
import { searchClearButtonHtml } from '../../components/searchField.js';
import { escapeHtml, escapeAttr } from '../../core/html.js';

const ALL_GROUP = 'ALL';
const ADMINISTRATORS = 'administrators';
const DEFAULT_SORT = Object.freeze({ column: 'name', descending: false });

function getUserInfo() {
  const infoGot = localStorage.getItem('INFO');
  return infoGot ? JSON.parse(atob(infoGot)) : null;
}

function shortDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: '2-digit', month: 'numeric', day: 'numeric' });
}

/** Rough equivalent of Angular's generic `filter:text`: substring match
 * (case-insensitive) against any stringified field of the object. */
function matchesSearch(item, text) {
  if (!text) return true;
  try {
    return JSON.stringify(item).toLowerCase().includes(text.toLowerCase());
  } catch (e) {
    return true;
  }
}

function normalizeTemplate(template) {
  if (typeof template === 'string') return { name: template, groups: [] };
  if (!template || typeof template !== 'object') return null;
  return { ...template, groups: Array.isArray(template.groups) ? template.groups : [] };
}

function normalizeTemplates(result) {
  if (!Array.isArray(result)) throw new Error('The server returned an invalid template list.');
  return result.map(normalizeTemplate).filter(Boolean);
}

export function mount(container) {
  if (!restoreSession()) return () => {};
  let disposed = false;
  let dialogReturnFocus = null;

  const userInfo = getUserInfo();
  if (!userInfo || !userInfo.is_admin) {
    navigate('/selectTemplate');
    return () => {};
  }

  const state = {
    activeTab: 'allTemplates',
    groups: [{ _id: 1, groupname: ALL_GROUP }],
    filterGroups: [],
    selectedfilterGroups: [],
    sort: { ...DEFAULT_SORT },
    astroTemplates: [],
    archivedAstroTemplates: [],
    loading: false,
    loadingTable: true,
    tableLoadError: '',
    searchText: '',
    selectedTemplate: null,
    showEditModal: false,
    showDeleteModal: false,
    showUnarchiveModal: false,
    dialogError: '',
    alertMsg: {},
  };
  state.filterGroups = structuredClone(state.groups);

  // ---- data helpers ----

  function isGroupSelected(group) {
    return state.selectedTemplate.groups.some(
      (selectedGroup) => String(selectedGroup._id) === String(group._id) || group.groupname === ADMINISTRATORS
    );
  }

  function prepareGroupsForSorting() {
    state.groups.forEach((group) => {
      group.sortOrder = isGroupSelected(group) ? 0 : 1;
    });
  }

  function filteredSortedRows(rows) {
    let result = rows.filter((t) => matchesSearch(t, state.searchText)).filter(filterBySelectedGroups);
    const { column, descending } = state.sort;
    result = [...result].sort((a, b) => {
      const av = a[column];
      const bv = b[column];
      const aMissing = av == null || av === '';
      const bMissing = bv == null || bv === '';
      if (aMissing || bMissing) {
        if (aMissing && bMissing) return 0;
        return aMissing ? 1 : -1;
      }
      let cmp;
      if (column === 'createdDate' || column === 'modifiedDate') {
        cmp = new Date(av).getTime() - new Date(bv).getTime();
      } else {
        cmp = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
      }
      return descending ? -cmp : cmp;
    });
    return result;
  }

  function isDefaultSorting() {
    return state.sort.column === DEFAULT_SORT.column && state.sort.descending === DEFAULT_SORT.descending;
  }

  function filterBySelectedGroups(template) {
    if (state.selectedfilterGroups.length === 0) return true;
    return state.selectedfilterGroups.some((groupName) =>
      (template.groups || []).some((group) => group.groupname === groupName)
    );
  }

  // ---- API calls ----

  function getGroups() {
    fetch(`${SERVER_URL}/framework/admin/group/list`, {
      headers: { Authorization: 'jwttoken ' + (localStorage.getItem(TOKEN_KEY) || '') },
      signal: getRouteSignal(),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Group list failed with HTTP ${res.status}`);
        return res.json();
      })
      .then((body) => {
        if (body.token) localStorage.setItem(TOKEN_KEY, body.token);
        const data = body.data || [];
        if (!Array.isArray(data)) throw new Error('The server returned an invalid group list.');
        for (const group of data) state.groups.push(group);
        state.filterGroups = structuredClone(state.groups);
        renderToolbar();
        getAstroTemplates();
      })
      .catch((err) => {
        if (disposed || err.name === 'AbortError') return;
        console.error(err);
        state.alertMsg.type = 'danger';
        state.alertMsg.msg = '(SESSION EXPIRED) Data retrieval failed due to: ' + (err.data ? err.data.message : err);
        showAlert('errorMsgAlert');
        navigate('/login');
      });
  }

  function getAstroTemplates() {
    state.loadingTable = true;
    state.tableLoadError = '';
    renderRows();
    huashan.getAstroTemplates(session.getCredentials()).then((response) => {
      if (response.status) {
        state.astroTemplates = normalizeTemplates(response.result);
      } else {
        state.tableLoadError = response.msg || 'Templates could not be loaded.';
      }
      state.loadingTable = false;
      renderRows();
    }).catch((error) => {
      if (disposed || isRequestAborted(error)) return;
      state.loadingTable = false;
      state.tableLoadError = loadErrorMessage(error, 'Templates could not be loaded.');
      renderRows();
    });
  }

  function getArchivedAstroTemplates() {
    state.archivedAstroTemplates = [];
    state.loadingTable = true;
    state.tableLoadError = '';
    renderRows();
    huashan.getArchivedAstroTemplates(session.getCredentials()).then((response) => {
      if (response.status) {
        state.archivedAstroTemplates = normalizeTemplates(response.result);
      } else {
        state.tableLoadError = response.msg || 'Archived templates could not be loaded.';
      }
      state.loadingTable = false;
      renderRows();
    }).catch((error) => {
      if (disposed || isRequestAborted(error)) return;
      state.loadingTable = false;
      state.tableLoadError = loadErrorMessage(error, 'Archived templates could not be loaded.');
      renderRows();
    });
  }

  function editAstroTemplate() {
    setDialogBusy(true);
    fetch(`${SERVER_URL}/domain/astro-templates`, {
      method: 'PUT',
      headers: {
        Authorization: 'jwttoken ' + (localStorage.getItem(TOKEN_KEY) || ''),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(state.selectedTemplate),
      signal: getRouteSignal(),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Template update failed with HTTP ${res.status}`);
        return res.json();
      })
      .then((body) => {
        if (body.token) localStorage.setItem(TOKEN_KEY, body.token);
        if (!body.data || typeof body.data.status === 'undefined') {
          throw new Error('The server returned an invalid template update response.');
        }
        state.alertMsg.msg = body.data.message || 'Template update failed.';
        if (body.data.status !== 0) {
          setDialogBusy(false);
          showDialogError(state.alertMsg.msg);
          return;
        }
        setDialogBusy(false);
        showAlert('successMsgAlert');
        closeEditModal();
        state.astroTemplates = [];
        getAstroTemplates();
      })
      .catch((err) => {
        if (disposed || err.name === 'AbortError') return;
        console.error(err);
        setDialogBusy(false);
        showDialogError('Template update failed due to: ' + (err.data ? err.data.message : err));
      });
  }

  function deleteAstroTemplate() {
    setDialogBusy(true);
    huashan.deleteTemplate(session.getCredentials(), state.selectedTemplate['name']).then((response) => {
      if (response.status) {
        setDialogBusy(false);
        state.alertMsg.msg = response.result;
        showAlert('successMsgAlert');
        closeDeleteModal();
        state.astroTemplates = [];
        getAstroTemplates();
      } else {
        setDialogBusy(false);
        showDialogError('Template archive failed due to: ' + response.msg);
      }
    }).catch((error) => {
      if (disposed || isRequestAborted(error)) return;
      setDialogBusy(false);
      showDialogError(loadErrorMessage(error, 'The template could not be archived.'));
    });
  }

  function unarchiveAstroTemplate() {
    setDialogBusy(true);
    huashan.undeleteTemplate(session.getCredentials(), state.selectedTemplate['name']).then((response) => {
      if (response.status) {
        setDialogBusy(false);
        state.alertMsg.msg = response.result;
        showAlert('successMsgAlert');
        closeUnarchiveModal();
        state.astroTemplates = [];
        switchTab('allTemplates');
        state.archivedAstroTemplates = [];
        getAstroTemplates();
      } else {
        setDialogBusy(false);
        showDialogError('Template unarchive failed due to: ' + response.msg);
      }
    }).catch((error) => {
      if (disposed || isRequestAborted(error)) return;
      setDialogBusy(false);
      showDialogError(loadErrorMessage(error, 'The template could not be restored.'));
    });
  }

  function showAlert(id) {
    renderAlertBoxes();
    flashAlert(id, id === 'successMsgAlert' || id === 'uploadSuccessAlert' ? 2000 : 3000);
  }

  // ---- UI actions ----

  function selectTemplate(template, trigger) {
    state.selectedTemplate = structuredClone(template);
    prepareGroupsForSorting();
    openDialog('showEditModal', trigger);
  }

  function deleteTemplate(template, trigger) {
    state.selectedTemplate = structuredClone(template);
    openDialog('showDeleteModal', trigger);
  }

  function unarchiveTemplate(template, trigger) {
    state.selectedTemplate = structuredClone(template);
    openDialog('showUnarchiveModal', trigger);
  }

  function openDialog(stateKey, trigger) {
    state.dialogError = '';
    dialogReturnFocus = trigger || document.activeElement;
    state[stateKey] = true;
    document.body.classList.add('modal-open');
    renderModals();
  }

  function closeDialog(stateKey) {
    if (state.loading) return;
    state[stateKey] = false;
    state.dialogError = '';
    document.body.classList.remove('modal-open');
    renderModals();
    const returnFocus = dialogReturnFocus;
    dialogReturnFocus = null;
    if (returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
  }

  function closeActiveDialog() {
    if (state.showEditModal) closeEditModal();
    else if (state.showDeleteModal) closeDeleteModal();
    else if (state.showUnarchiveModal) closeUnarchiveModal();
  }

  function closeEditModal() {
    closeDialog('showEditModal');
  }
  function closeDeleteModal() {
    closeDialog('showDeleteModal');
  }
  function closeUnarchiveModal() {
    closeDialog('showUnarchiveModal');
  }

  function showDialogError(message) {
    state.dialogError = message;
    const error = container.querySelector('[data-admin-dialog-error]');
    if (!error) return;
    error.textContent = message;
    error.hidden = false;
  }

  function setDialogBusy(isBusy) {
    state.loading = isBusy;
    const dialog = container.querySelector('.admin-action-modal');
    if (!dialog) return;
    dialog.setAttribute('aria-busy', String(isBusy));
    dialog.querySelectorAll('button').forEach((button) => {
      button.disabled = isBusy;
    });
    const action = dialog.querySelector('[data-busy-label]');
    if (action) action.textContent = isBusy ? action.dataset.busyLabel : action.dataset.idleLabel;
  }

  function trapDialogFocus(event, dialog) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeActiveDialog();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.querySelectorAll(
      'button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])'
    )].filter((element) => !element.hidden);
    if (focusable.length === 0) {
      event.preventDefault();
      dialog.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function toggleGroupSelection(group) {
    if (!group) return;
    const index = state.selectedTemplate.groups.findIndex((g) => String(g._id) === String(group._id));
    if (index === -1) {
      state.selectedTemplate.groups.push({ _id: group._id, groupname: group.groupname });
    } else {
      state.selectedTemplate.groups.splice(index, 1);
    }
    prepareGroupsForSorting();
    renderModals(String(group._id));
  }

  function switchTab(tab) {
    state.activeTab = tab;
    state.searchText = '';
    state.sort = { ...DEFAULT_SORT };
    resetFilter();
    renderTableHeaders();
    if (tab === 'archive') {
      getArchivedAstroTemplates();
    }
  }

  function resetSelectedFilter() {
    state.selectedfilterGroups = [];
  }

  function resetFilter() {
    state.filterGroups = structuredClone(state.groups);
    resetSelectedFilter();
    renderToolbar();
    renderRows();
  }

  function applyFilter() {
    resetSelectedFilter();
    state.filterGroups.forEach((group) => {
      if (group.checked) state.selectedfilterGroups.push(group.groupname);
    });
    const badge = container.querySelector('#admin-filter-count');
    const clearButton = container.querySelector('#admin-clear-filter');
    if (badge) {
      badge.textContent = String(state.selectedfilterGroups.length);
      badge.hidden = state.selectedfilterGroups.length === 0;
    }
    if (clearButton) clearButton.hidden = state.selectedfilterGroups.length === 0;
    renderRows();
  }

  function changeSorting(column) {
    if (state.sort.column === column) {
      state.sort.descending = !state.sort.descending;
    } else {
      state.sort.column = column;
      state.sort.descending = false;
    }
    renderTableHeaders();
    renderRows();
    updateSortResetButton();
  }

  function resetSorting() {
    state.sort = { ...DEFAULT_SORT };
    renderTableHeaders();
    renderRows();
    updateSortResetButton();
  }

  // ---- rendering ----

  function groupCloudHtml(groups, onClickMoreAttr) {
    const shown = (groups || []).slice(0, 2);
    const extra = (groups || []).length - 2;
    return `<div class="group-cloud">
      ${shown.map((g) => `<div class="group-cloud-item">${escapeHtml(g.groupname)}</div>`).join('')}
      ${extra > 0 ? `<div class="group-cloud-item ${onClickMoreAttr ? 'group-cursor' : ''}" ${onClickMoreAttr || ''}>+${extra}</div>` : ''}
    </div>`;
  }

  function sortableHeaderHtml(column, label) {
    const selected = state.sort.column === column;
    const direction = selected ? (state.sort.descending ? 'descending' : 'ascending') : 'none';
    const icon = selected ? (state.sort.descending ? 'fa-sort-desc' : 'fa-sort-asc') : 'fa-sort';
    return `<th scope="col" class="sortable ${selected ? 'is-sorted' : ''}" aria-sort="${direction}">
      <button type="button" class="admin-sort-button" data-sort="${column}">
        <span>${label}</span>
        <i class="fa ${icon}" aria-hidden="true"></i>
        ${selected ? `<span class="sr-only">Sorted ${direction}</span>` : ''}
      </button>
    </th>`;
  }

  function tableHeaderHtml() {
    return `
    <tr>
      ${sortableHeaderHtml('name', 'Template Name')}
      ${sortableHeaderHtml('creatorUsername', 'Creator Name')}
      ${sortableHeaderHtml('createdDate', 'Creation Date')}
      ${sortableHeaderHtml('modifiedDate', 'Last Modified Date')}
      <th scope="col">Groups</th>
      <th scope="col">Action</th>
    </tr>`;
  }

  function renderTableHeaders() {
    container.querySelectorAll('[data-admin-table-header]').forEach((header) => {
      header.innerHTML = tableHeaderHtml();
    });
    container.querySelectorAll('[data-sort]').forEach((button) => {
      button.addEventListener('click', () => changeSorting(button.getAttribute('data-sort')));
    });
  }

  function updateSortResetButton() {
    const resetButton = container.querySelector('#admin-reset-sort');
    if (resetButton) resetButton.disabled = isDefaultSorting();
  }

  function allTemplatesRowsHtml() {
    if (state.loadingTable) return `<tr><td colspan="6"><div class="loader"></div></td></tr>`;
    if (state.tableLoadError) return tableLoadErrorRowHtml();
    return filteredSortedRows(state.astroTemplates)
      .map(
        (template, i) => `
      <tr>
        <td>${escapeHtml(template.name)}</td>
        <td>${escapeHtml(template.creatorUsername)}</td>
        <td>${shortDate(template.createdDate)}</td>
        <td>${shortDate(template.modifiedDate)}</td>
        <td>${groupCloudHtml(template.groups, `data-select-index="${i}"`)}</td>
        <td class="action-icons">
          <button type="button" class="admin-icon-button" data-share-index="${i}" title="Manage access for ${escapeHtml(template.name)}" aria-label="Manage access for ${escapeHtml(template.name)}"><i class="fa fa-users" aria-hidden="true"></i></button>
          <button type="button" class="admin-icon-button" data-delete-index="${i}" title="Archive ${escapeHtml(template.name)}" aria-label="Archive ${escapeHtml(template.name)}"><i class="fa fa-trash" aria-hidden="true"></i></button>
        </td>
      </tr>`
      )
      .join('');
  }

  function archiveRowsHtml() {
    if (state.loadingTable) return `<tr><td colspan="6"><div class="loader"></div></td></tr>`;
    if (state.tableLoadError) return tableLoadErrorRowHtml();
    return filteredSortedRows(state.archivedAstroTemplates)
      .map(
        (template, i) => `
      <tr>
        <td>${escapeHtml(template.name)}</td>
        <td>${escapeHtml(template.creatorUsername)}</td>
        <td>${shortDate(template.createdDate)}</td>
        <td>${shortDate(template.modifiedDate)}</td>
        <td>${groupCloudHtml(template.groups, null)}</td>
        <td class="action-icons">
          <button type="button" class="admin-icon-button" data-unarchive-index="${i}" title="Restore ${escapeHtml(template.name)}" aria-label="Restore ${escapeHtml(template.name)}"><i class="fa fa-undo" aria-hidden="true"></i></button>
        </td>
      </tr>`
      )
      .join('');
  }

  function renderRows() {
    const allBody = container.querySelector('#allTemplates-tbody');
    const archiveBody = container.querySelector('#archive-tbody');
    if (allBody) allBody.innerHTML = allTemplatesRowsHtml();
    if (archiveBody) archiveBody.innerHTML = archiveRowsHtml();
    container.querySelectorAll('[data-admin-load-retry]').forEach((button) => {
      button.addEventListener('click', () => {
        if (state.activeTab === 'archive') getArchivedAstroTemplates();
        else getAstroTemplates();
      });
    });
    wireRowActions();
  }

  function tableLoadErrorRowHtml() {
    return `<tr><td colspan="6">
      <div class="alert alert-danger" role="alert">${escapeHtml(state.tableLoadError)}</div>
      <button type="button" class="btn btn-primary" data-admin-load-retry>Retry</button>
    </td></tr>`;
  }

  function wireRowActions() {
    const allRows = filteredSortedRows(state.astroTemplates);
    container.querySelectorAll('[data-select-index]').forEach((el) => {
      el.addEventListener('click', () => selectTemplate(allRows[Number(el.getAttribute('data-select-index'))], el));
    });
    container.querySelectorAll('[data-share-index]').forEach((el) => {
      el.addEventListener('click', () => selectTemplate(allRows[Number(el.getAttribute('data-share-index'))], el));
    });
    container.querySelectorAll('[data-delete-index]').forEach((el) => {
      el.addEventListener('click', () => deleteTemplate(allRows[Number(el.getAttribute('data-delete-index'))], el));
    });
    const archiveRows = filteredSortedRows(state.archivedAstroTemplates);
    container.querySelectorAll('[data-unarchive-index]').forEach((el) => {
      el.addEventListener('click', () => unarchiveTemplate(archiveRows[Number(el.getAttribute('data-unarchive-index'))], el));
    });
  }

  function renderToolbar() {
    const toolbar = container.querySelector('#admin-toolbar');
    if (!toolbar) return;
    toolbar.innerHTML = `
      <ul class="nav nav-tabs" role="tablist" style="margin-right: 20px;">
        <li class="nav-item ${state.activeTab === 'allTemplates' ? 'active' : ''}" role="presentation"><button type="button" class="admin-tab-button" id="tab-all" role="tab" aria-selected="${state.activeTab === 'allTemplates'}">All Templates</button></li>
        <li class="nav-item ${state.activeTab === 'archive' ? 'active' : ''}" role="presentation"><button type="button" class="admin-tab-button" id="tab-archive" role="tab" aria-selected="${state.activeTab === 'archive'}">Archive</button></li>
      </ul>
      <div class="search-box">
        <input type="text" id="admin-search" placeholder="Search templates" value="${escapeAttr(state.searchText)}">
        <i class="fa fa-search search-icon"></i>
        ${searchClearButtonHtml('admin-search')}
      </div>
      <div class="filter-box dropdown">
        <button type="button" class="btn dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          <i class="fa fa-filter filter-icon"></i> Filter by groups
        </button>
        <span class="badge" id="admin-filter-count" ${state.selectedfilterGroups.length === 0 ? 'hidden' : ''}>${state.selectedfilterGroups.length}</span>
        <button type="button" class="clear-x" id="admin-clear-filter" aria-label="Clear group filters" ${state.selectedfilterGroups.length === 0 ? 'hidden' : ''}>X</button>
        <div class="dropdown-menu dropdown-admin" id="admin-filter-menu">
          ${state.filterGroups
            .map(
              (group, i) => `
          <label class="dropdown-item">
            <input type="checkbox" data-filter-group-index="${i}" ${group.checked ? 'checked' : ''}> ${escapeHtml(group.groupname)}
          </label>`
            )
            .join('')}
        </div>
      </div>
      <button type="button" class="admin-icon-button admin-reset-sort" id="admin-reset-sort" title="Reset sorting" aria-label="Reset sorting" ${isDefaultSorting() ? 'disabled' : ''}>
        <i class="fa fa-undo" aria-hidden="true"></i>
      </button>`;

    toolbar.querySelector('#tab-all').addEventListener('click', () => switchTab('allTemplates'));
    toolbar.querySelector('#tab-archive').addEventListener('click', () => switchTab('archive'));
    toolbar.querySelector('#admin-search').addEventListener('input', (e) => {
      state.searchText = e.target.value;
      renderRows();
    });
    toolbar.querySelector('#admin-clear-filter').addEventListener('click', resetFilter);
    toolbar.querySelector('#admin-reset-sort').addEventListener('click', resetSorting);
    toolbar.querySelector('#admin-filter-menu').addEventListener('click', (evt) => evt.stopPropagation());
    toolbar.querySelectorAll('[data-filter-group-index]').forEach((cb) => {
      cb.addEventListener('change', (e) => {
        state.filterGroups[Number(cb.getAttribute('data-filter-group-index'))].checked = e.target.checked;
        applyFilter();
      });
    });
    initDropdowns(toolbar);

    const panes = container.querySelectorAll('.tab-pane');
    panes.forEach((pane) => {
      const isActive = pane.id === state.activeTab;
      pane.classList.toggle('show', isActive);
      pane.classList.toggle('active', isActive);
    });

    const loaderContainer = container.querySelector('#admin-loading');
    if (loaderContainer) loaderContainer.hidden = !state.loading;
  }

  function renderModals(focusGroupId = '') {
    const modals = container.querySelector('#admin-modals');
    if (!modals) return;
    let html = '';
    if (state.showEditModal) {
      html += `
      <div class="admin-action-modal editModal" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="admin-share-title">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <button type="button" class="close" id="edit-modal-close"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
              <h3 class="modal-title" id="admin-share-title">Manage Template Access</h3>
            </div>
            <div class="modal-body">
              <div class="owner-details-div">
                <p><i style="margin: 3px" class="fa fa-file group-icon"></i>${escapeHtml(state.selectedTemplate.name)}</p>
                <p>${escapeHtml(state.selectedTemplate.creatorUsername)} (Owner)</p>
              </div>
              <h3>Groups:</h3>
              <div class="alert alert-danger" role="alert" data-admin-dialog-error ${state.dialogError ? '' : 'hidden'}>${escapeHtml(state.dialogError)}</div>
              <div class="groups-list">
                ${[...state.groups]
                  .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                  .map((group) => {
                    const selected = isGroupSelected(group);
                    return `
                <div class="group-item ${selected ? 'group-selected' : ''} ${selected && group.groupname === ALL_GROUP ? 'group-all' : ''}">
                  <span><i class="fa fa-users group-icon"></i><span class="group-name">${escapeHtml(group.groupname)}</span></span>
                  ${
                    group.groupname !== ADMINISTRATORS
                      ? `<button type="button" class="admin-icon-button" data-toggle-group-id="${escapeHtml(group._id)}" aria-label="${selected ? 'Remove' : 'Add'} ${escapeHtml(group.groupname)}"><i class="fa ${selected ? 'fa-minus' : 'fa-plus'}" aria-hidden="true"></i></button>`
                      : ''
                  }
                </div>`;
                  })
                  .join('')}
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-primary" id="edit-modal-save" data-idle-label="Save" data-busy-label="Saving">Save</button>
              <button class="btn btn-default" id="edit-modal-close2">Close</button>
            </div>
          </div>
        </div>
      </div>`;
    }
    if (state.showDeleteModal) {
      html += `
      <div class="admin-action-modal deleteModal" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="admin-archive-title">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <button type="button" class="close" id="delete-modal-close"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
              <h4 class="modal-title" id="admin-archive-title">Archive Template</h4>
            </div>
            <div class="modal-body">
              <h4 class="modal-title">Are you sure to archive <b>${escapeHtml(state.selectedTemplate.name)}</b>?</h4>
              <div class="alert alert-danger" role="alert" data-admin-dialog-error ${state.dialogError ? '' : 'hidden'}>${escapeHtml(state.dialogError)}</div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-primary" id="delete-modal-confirm" data-idle-label="Archive" data-busy-label="Archiving">Archive</button>
              <button class="btn btn-default" id="delete-modal-close2">Close</button>
            </div>
          </div>
        </div>
      </div>`;
    }
    if (state.showUnarchiveModal) {
      html += `
      <div class="admin-action-modal unarchiveModal" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="admin-restore-title">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <button type="button" class="close" id="unarchive-modal-close"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
              <h4 class="modal-title" id="admin-restore-title">Unarchive Template</h4>
            </div>
            <div class="modal-body">
              <h4 class="modal-title">Are you sure to unarchive <b>${escapeHtml(state.selectedTemplate.name)}</b>?</h4>
              <div class="alert alert-danger" role="alert" data-admin-dialog-error ${state.dialogError ? '' : 'hidden'}>${escapeHtml(state.dialogError)}</div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-primary" id="unarchive-modal-confirm" data-idle-label="Unarchive" data-busy-label="Restoring">Unarchive</button>
              <button class="btn btn-default" id="unarchive-modal-close2">Close</button>
            </div>
          </div>
        </div>
      </div>`;
    }
    modals.innerHTML = html;

    if (state.showEditModal) {
      modals.querySelector('#edit-modal-close').addEventListener('click', closeEditModal);
      modals.querySelector('#edit-modal-close2').addEventListener('click', closeEditModal);
      modals.querySelector('#edit-modal-save').addEventListener('click', editAstroTemplate);
      modals.querySelectorAll('[data-toggle-group-id]').forEach((el) => {
        el.addEventListener('click', () => {
          const id = el.getAttribute('data-toggle-group-id');
          toggleGroupSelection(state.groups.find((g) => String(g._id) === id));
        });
      });
    }
    if (state.showDeleteModal) {
      modals.querySelector('#delete-modal-close').addEventListener('click', closeDeleteModal);
      modals.querySelector('#delete-modal-close2').addEventListener('click', closeDeleteModal);
      modals.querySelector('#delete-modal-confirm').addEventListener('click', deleteAstroTemplate);
    }
    if (state.showUnarchiveModal) {
      modals.querySelector('#unarchive-modal-close').addEventListener('click', closeUnarchiveModal);
      modals.querySelector('#unarchive-modal-close2').addEventListener('click', closeUnarchiveModal);
      modals.querySelector('#unarchive-modal-confirm').addEventListener('click', unarchiveAstroTemplate);
    }

    const dialog = modals.querySelector('.admin-action-modal');
    if (!dialog) return;
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) closeActiveDialog();
    });
    dialog.addEventListener('keydown', (event) => trapDialogFocus(event, dialog));
    if (focusGroupId) {
      const groupButton = [...dialog.querySelectorAll('[data-toggle-group-id]')]
        .find((button) => button.getAttribute('data-toggle-group-id') === focusGroupId);
      if (groupButton) groupButton.focus();
      else dialog.focus();
    } else {
      dialog.focus();
    }
  }

  function renderAlertBoxes() {
    const box = (id) => container.querySelector(`#${id} .alert-body`);
    const infoBox = box('infoMsgAlert');
    const errorBox = box('errorMsgAlert');
    const successBox = box('successMsgAlert');
    if (infoBox) infoBox.textContent = state.alertMsg.msg || '';
    if (errorBox) errorBox.textContent = state.alertMsg.msg || '';
    if (successBox) successBox.textContent = state.alertMsg.msg || '';
  }

  function render() {
    container.innerHTML = `
${appNavHtml({ active: 'admin', isAdmin: true })}

<div class="admin-templates animated fadeIn">
  <h3>Admin</h3>

  <div class="loader-container" id="admin-loading" ${state.loading ? '' : 'hidden'}>
    <div class="loader"></div>
  </div>

  <div class="admin-container">
    <div class="tab-search-container" id="admin-toolbar"></div>
    <div class="tab-content">
      <div id="allTemplates" class="tab-pane ${state.activeTab === 'allTemplates' ? 'show active' : ''}">
        <div class="admin-table-scroll" tabindex="0" role="region" aria-label="All templates table">
          <table class="astro-table">
            <thead data-admin-table-header></thead>
            <tbody id="allTemplates-tbody"></tbody>
          </table>
        </div>
      </div>
      <div id="archive" class="tab-pane ${state.activeTab === 'archive' ? 'show active' : ''}">
        <div class="admin-table-scroll" tabindex="0" role="region" aria-label="Archived templates table">
          <table class="astro-table">
            <thead data-admin-table-header></thead>
            <tbody id="archive-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>

<div id="admin-modals"></div>

  <div id="uploadSuccessAlert" class="text-center" style="display:none;position:fixed; top:40%;left:35%;height:100px;width:30%;">
    <div class="alert alert-success"><i class="fa fa-check fa-lg"></i> Successfully Uploaded!</div>
  </div>
  <div id="infoMsgAlert" class="text-center" style="display:none;position:fixed; top:40%;left:35%;height:100px;width:30%;">
    <div class="alert alert-info alert-body"></div>
  </div>
  <div id="errorMsgAlert" class="text-center" style="display:none;position:fixed; top:40%;left:35%;height:100px;width:30%;">
    <div class="alert alert-danger alert-body"></div>
  </div>
  <div id="successMsgAlert" class="text-center" style="display:none;position:fixed; top:40%;left:35%;height:100px;width:30%;">
    <div class="alert alert-success"><i class="fa fa-check fa-lg"></i> <span class="alert-body"></span></div>
  </div>
`;

    renderToolbar();
    renderTableHeaders();
    renderRows();
    renderModals();
    renderAlertBoxes();
  }

  render();
  getGroups();

  return () => {
    disposed = true;
    document.body.classList.remove('modal-open');
  };
}
