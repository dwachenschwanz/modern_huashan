/* Ported from adminController.ts + views/admin.html. */
import { huashan } from '../../api/huashanClient.js';
import { session, restoreSession } from '../../core/session.js';
import { SERVER_URL, TOKEN_KEY } from '../../core/config.js';
import { navigate } from '../../core/router.js';
import { flashAlert, initDropdowns } from '../../components/bootstrapUI.js';
import { escapeHtml } from '../../core/html.js';

const ALL_GROUP = 'ALL';
const ADMINISTRATORS = 'administrators';

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

export function mount(container) {
  if (!restoreSession()) return () => {};

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
    sort: { column: 'name', descending: false },
    astroTemplates: [],
    archivedAstroTemplates: [],
    loading: false,
    loadingTable: true,
    searchText: '',
    selectedTemplate: null,
    showEditModal: false,
    showDeleteModal: false,
    showUnarchiveModal: false,
    alertMsg: {},
  };
  state.filterGroups = structuredClone(state.groups);

  // ---- data helpers ----

  function isGroupSelected(group) {
    return state.selectedTemplate.groups.some(
      (selectedGroup) => selectedGroup._id === group._id || group.groupname === ADMINISTRATORS
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
      if (av === bv) return 0;
      const cmp = av > bv ? 1 : -1;
      return descending ? -cmp : cmp;
    });
    return result;
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
    })
      .then((res) => res.json())
      .then((body) => {
        if (body.token) localStorage.setItem(TOKEN_KEY, body.token);
        const data = body.data || [];
        for (const group of data) state.groups.push(group);
        state.filterGroups = structuredClone(state.groups);
        renderToolbar();
        getAstroTemplates();
      })
      .catch((err) => {
        console.error(err);
        state.alertMsg.type = 'danger';
        state.alertMsg.msg = '(SESSION EXPIRED) Data retrieval failed due to: ' + (err.data ? err.data.message : err);
        showAlert('errorMsgAlert');
        navigate('/login');
      });
  }

  function getAstroTemplates() {
    state.loadingTable = true;
    renderRows();
    huashan.getAstroTemplates(session.getCredentials()).then((response) => {
      if (response.status) {
        state.astroTemplates = response.result;
      } else {
        state.alertMsg.msg = 'Templates not found';
        showAlert('infoMsgAlert');
      }
      state.loadingTable = false;
      renderRows();
    });
  }

  function getArchivedAstroTemplates() {
    state.archivedAstroTemplates = [];
    state.loadingTable = true;
    renderRows();
    huashan.getArchivedAstroTemplates(session.getCredentials()).then((response) => {
      if (response.status) {
        state.archivedAstroTemplates = response.result;
      } else {
        state.alertMsg.msg = 'Archived templates not found';
        showAlert('infoMsgAlert');
      }
      state.loadingTable = false;
      renderRows();
    });
  }

  function editAstroTemplate() {
    state.loading = true;
    renderToolbar();
    fetch(`${SERVER_URL}/domain/astro-templates`, {
      method: 'PUT',
      headers: {
        Authorization: 'jwttoken ' + (localStorage.getItem(TOKEN_KEY) || ''),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(state.selectedTemplate),
    })
      .then((res) => res.json())
      .then((body) => {
        if (body.token) localStorage.setItem(TOKEN_KEY, body.token);
        state.alertMsg.msg = body.data.message;
        showAlert(body.data.status === 0 ? 'successMsgAlert' : 'infoMsgAlert');
        closeEditModal();
        state.astroTemplates = [];
        getAstroTemplates();
        state.loading = false;
        renderToolbar();
      })
      .catch((err) => {
        console.error(err);
        state.alertMsg.msg = 'Template Update failed due to: ' + (err.data ? err.data.message : err);
        showAlert('errorMsgAlert');
        state.loading = false;
        renderToolbar();
      });
  }

  function deleteAstroTemplate() {
    state.loading = true;
    renderToolbar();
    huashan.deleteTemplate(session.getCredentials(), state.selectedTemplate['name']).then((response) => {
      if (response.status) {
        state.alertMsg.msg = response.result;
        showAlert('successMsgAlert');
        closeDeleteModal();
        state.astroTemplates = [];
        getAstroTemplates();
      } else {
        state.alertMsg.msg = 'Template archive failed due to: ' + response.msg;
        showAlert('errorMsgAlert');
      }
      state.loading = false;
      renderToolbar();
    });
  }

  function unarchiveAstroTemplate() {
    state.loading = true;
    renderToolbar();
    huashan.undeleteTemplate(session.getCredentials(), state.selectedTemplate['name']).then((response) => {
      if (response.status) {
        state.alertMsg.msg = response.result;
        showAlert('successMsgAlert');
        closeUnarchiveModal();
        state.astroTemplates = [];
        switchTab('allTemplates');
        state.archivedAstroTemplates = [];
        getAstroTemplates();
      } else {
        state.alertMsg.msg = 'Template unarchive failed due to: ' + response.msg;
        showAlert('errorMsgAlert');
      }
      state.loading = false;
      renderToolbar();
    });
  }

  function showAlert(id) {
    renderAlertBoxes();
    flashAlert(id, id === 'successMsgAlert' || id === 'uploadSuccessAlert' ? 2000 : 3000);
  }

  // ---- UI actions ----

  function selectTemplate(template) {
    state.selectedTemplate = structuredClone(template);
    prepareGroupsForSorting();
    state.showEditModal = true;
    renderModals();
  }

  function deleteTemplate(template) {
    state.selectedTemplate = structuredClone(template);
    state.showDeleteModal = true;
    renderModals();
  }

  function unarchiveTemplate(template) {
    state.selectedTemplate = structuredClone(template);
    state.showUnarchiveModal = true;
    renderModals();
  }

  function closeEditModal() {
    state.showEditModal = false;
    renderModals();
  }
  function closeDeleteModal() {
    state.showDeleteModal = false;
    renderModals();
  }
  function closeUnarchiveModal() {
    state.showUnarchiveModal = false;
    renderModals();
  }

  function toggleGroupSelection(group) {
    const index = state.selectedTemplate.groups.findIndex((g) => g._id === group._id);
    if (index === -1) {
      state.selectedTemplate.groups.push({ _id: group._id, groupname: group.groupname });
    } else {
      state.selectedTemplate.groups.splice(index, 1);
    }
    prepareGroupsForSorting();
    renderModals();
  }

  function switchTab(tab) {
    state.activeTab = tab;
    state.searchText = '';
    resetFilter();
    if (tab === 'archive') {
      getArchivedAstroTemplates();
      state.sort = { column: 'name', descending: false };
    }
    renderToolbar();
  }

  function resetSelectedFilter() {
    state.selectedfilterGroups = [];
  }

  function resetFilter() {
    state.filterGroups = structuredClone(state.groups);
    resetSelectedFilter();
    renderToolbar();
  }

  function applyFilter() {
    resetSelectedFilter();
    state.filterGroups.forEach((group) => {
      if (group.checked) state.selectedfilterGroups.push(group.groupname);
    });
    renderRows();
  }

  function changeSorting(column) {
    if (state.sort.column === column) {
      state.sort.descending = !state.sort.descending;
    } else {
      state.sort.column = column;
      state.sort.descending = false;
    }
    renderRows();
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

  function sortCaret(column) {
    if (state.sort.column !== column) return '';
    return `<span class="fa ${state.sort.descending ? 'fa-arrow-down' : 'fa-arrow-up'}"></span>`;
  }

  function tableHeaderHtml() {
    return `
    <tr>
      <th class="sortable" data-sort="name">Template Name ${sortCaret('name')}</th>
      <th class="sortable" data-sort="creatorUsername">Creator Name ${sortCaret('creatorUsername')}</th>
      <th class="sortable" data-sort="createdDate">Creation Date ${sortCaret('createdDate')}</th>
      <th class="sortable" data-sort="modifiedDate">Last Modified Date ${sortCaret('modifiedDate')}</th>
      <th>Groups</th>
      <th>Action</th>
    </tr>`;
  }

  function allTemplatesRowsHtml() {
    if (state.loadingTable) return `<tr><td colspan="6"><div class="loader"></div></td></tr>`;
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
          <span data-share-index="${i}"><i class="fa fa-share"></i></span>
          <span data-delete-index="${i}"><i class="fa fa-trash"></i></span>
        </td>
      </tr>`
      )
      .join('');
  }

  function archiveRowsHtml() {
    if (state.loadingTable) return `<tr><td colspan="6"><div class="loader"></div></td></tr>`;
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
          <span data-unarchive-index="${i}"><i class="fa fa-undo"></i></span>
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
    wireRowActions();
  }

  function wireRowActions() {
    const allRows = filteredSortedRows(state.astroTemplates);
    container.querySelectorAll('[data-select-index]').forEach((el) => {
      el.addEventListener('click', () => selectTemplate(allRows[Number(el.getAttribute('data-select-index'))]));
    });
    container.querySelectorAll('[data-share-index]').forEach((el) => {
      el.addEventListener('click', () => selectTemplate(allRows[Number(el.getAttribute('data-share-index'))]));
    });
    container.querySelectorAll('[data-delete-index]').forEach((el) => {
      el.addEventListener('click', () => deleteTemplate(allRows[Number(el.getAttribute('data-delete-index'))]));
    });
    const archiveRows = filteredSortedRows(state.archivedAstroTemplates);
    container.querySelectorAll('[data-unarchive-index]').forEach((el) => {
      el.addEventListener('click', () => unarchiveTemplate(archiveRows[Number(el.getAttribute('data-unarchive-index'))]));
    });
    container.querySelectorAll('[data-sort]').forEach((el) => {
      el.addEventListener('click', () => changeSorting(el.getAttribute('data-sort')));
    });
  }

  function renderToolbar() {
    const toolbar = container.querySelector('#admin-toolbar');
    if (!toolbar) return;
    toolbar.innerHTML = `
      <ul class="nav nav-tabs" style="margin-right: 20px;">
        <li class="nav-item ${state.activeTab === 'allTemplates' ? 'active' : ''}"><a class="nav-link" id="tab-all">All Templates</a></li>
        <li class="nav-item ${state.activeTab === 'archive' ? 'active' : ''}"><a class="nav-link" id="tab-archive">Archive</a></li>
      </ul>
      <div class="search-box">
        <input type="text" id="admin-search" placeholder="Search templates" value="${escapeAttr(state.searchText)}">
        <i class="fa fa-search search-icon"></i>
      </div>
      <div class="filter-box">
        <button type="button" class="btn dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          <i class="fa fa-filter filter-icon"></i> Filter by groups
        </button>
        ${state.selectedfilterGroups.length > 0 ? `<span class="badge">${state.selectedfilterGroups.length}</span>` : ''}
        ${state.selectedfilterGroups.length > 0 ? `<span class="clear-x" id="admin-clear-filter">X</span>` : ''}
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
      </div>`;

    toolbar.querySelector('#tab-all').addEventListener('click', () => switchTab('allTemplates'));
    toolbar.querySelector('#tab-archive').addEventListener('click', () => switchTab('archive'));
    toolbar.querySelector('#admin-search').addEventListener('input', (e) => {
      state.searchText = e.target.value;
      renderRows();
    });
    const clearFilter = toolbar.querySelector('#admin-clear-filter');
    if (clearFilter) clearFilter.addEventListener('click', resetFilter);
    toolbar.querySelector('#admin-filter-menu').addEventListener('click', (evt) => evt.stopPropagation());
    toolbar.querySelectorAll('[data-filter-group-index]').forEach((cb) => {
      cb.addEventListener('change', (e) => {
        state.filterGroups[Number(cb.getAttribute('data-filter-group-index'))].checked = e.target.checked;
        applyFilter();
      });
    });
    initDropdowns(toolbar);

    const panes = container.querySelectorAll('.tab-pane');
    panes.forEach((pane) => pane.classList.toggle('show active', pane.id === state.activeTab));

    const loaderContainer = container.querySelector('#admin-loading');
    if (loaderContainer) loaderContainer.hidden = !state.loading;
  }

  function renderModals() {
    const modals = container.querySelector('#admin-modals');
    if (!modals) return;
    let html = '';
    if (state.showEditModal) {
      html += `
      <div class="editModal" tabindex="-1" role="dialog">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <button type="button" class="close" id="edit-modal-close"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
              <h3 class="modal-title">Share Template</h3>
            </div>
            <div class="modal-body">
              <div class="owner-details-div">
                <p><i style="margin: 3px" class="fa fa-file group-icon"></i>${escapeHtml(state.selectedTemplate.name)}</p>
                <p>${escapeHtml(state.selectedTemplate.creatorUsername)} (Owner)</p>
              </div>
              <h3>Groups:</h3>
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
                      ? `<span><i class="fa ${selected ? 'fa-minus' : 'fa-plus'}" data-toggle-group-id="${group._id}"></i></span>`
                      : ''
                  }
                </div>`;
                  })
                  .join('')}
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-default" id="edit-modal-close2">Close</button>
              <button class="btn btn-primary" id="edit-modal-save">Save</button>
            </div>
          </div>
        </div>
      </div>`;
    }
    if (state.showDeleteModal) {
      html += `
      <div class="deleteModal" tabindex="-1" role="dialog">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <button type="button" class="close" id="delete-modal-close"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
              <h4 class="modal-title">Archive Template</h4>
            </div>
            <div class="modal-body">
              <h4 class="modal-title">Are you sure to archive <b>${escapeHtml(state.selectedTemplate.name)}</b>?</h4>
            </div>
            <div class="modal-footer">
              <button class="btn btn-primary" id="delete-modal-confirm">Archive</button>
              <button class="btn btn-default" id="delete-modal-close2">Close</button>
            </div>
          </div>
        </div>
      </div>`;
    }
    if (state.showUnarchiveModal) {
      html += `
      <div class="unarchiveModal" tabindex="-1" role="dialog">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <button type="button" class="close" id="unarchive-modal-close"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
              <h4 class="modal-title">Unarchive Template</h4>
            </div>
            <div class="modal-body">
              <h4 class="modal-title">Are you sure to unarchive <b>${escapeHtml(state.selectedTemplate.name)}</b>?</h4>
            </div>
            <div class="modal-footer">
              <button class="btn btn-primary" id="unarchive-modal-confirm">Unarchive</button>
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
          const id = Number(el.getAttribute('data-toggle-group-id'));
          toggleGroupSelection(state.groups.find((g) => g._id === id));
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
<nav class="navbar navbar-inverse navbar-static-top" role="navigation" style="margin-bottom: 10px;">
  <div class="container-fluid">
    <div class="navbar-header"><a class="navbar-brand">Huashan</a></div>
    <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
      <ul class="nav navbar-nav">
        <li><a href="#">Home</a></li>
        <li class="active"><a href="#/admin">Admin</a></li>
        <li><a href="#/selectTemplate">Select Template</a></li>
      </ul>
      <ul class="nav navbar-nav navbar-right"></ul>
    </div>
  </div>
</nav>

<div class="admin-templates animated fadeIn" style="height: 100%">
  <h3>Admin</h3>

  <div class="loader-container" id="admin-loading" ${state.loading ? '' : 'hidden'}>
    <div class="loader"></div>
  </div>

  <div class="admin-container">
    <div class="tab-search-container" id="admin-toolbar"></div>
    <div class="tab-content">
      <div id="allTemplates" class="tab-pane ${state.activeTab === 'allTemplates' ? 'show active' : ''}">
        <table class="astro-table">
          <thead>${tableHeaderHtml()}</thead>
          <tbody id="allTemplates-tbody"></tbody>
        </table>
      </div>
      <div id="archive" class="tab-pane ${state.activeTab === 'archive' ? 'show active' : ''}">
        <table class="astro-table">
          <thead>${tableHeaderHtml()}</thead>
          <tbody id="archive-tbody"></tbody>
        </table>
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
</div>`;

    renderToolbar();
    renderRows();
    renderModals();
    renderAlertBoxes();
  }

  render();
  getGroups();

  return () => {};
}

function escapeAttr(str) {
  return escapeHtml(str);
}
