var module;
try {
  module = angular.module('huashanApp');
} catch (e) {
  module = angular.module('huashanApp', []);
}

module.run(['$templateCache', function ($templateCache) {
  $templateCache.put('views/admin.html',
    '<nav class="navbar navbar-inverse navbar-static-top" role="navigation" style="margin-bottom: 10px;">\n' +
    '  <div class="container-fluid">\n' +
    '    <!-- Brand and toggle get grouped for better mobile display -->\n' +
    '    <div class="navbar-header">\n' +
    '      <a class="navbar-brand">Huashan</a>\n' +
    '    </div>\n' +
    '\n' +
    '    <!-- Collect the nav links, forms, and other content for toggling -->\n' +
    '    <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">\n' +
    '      <ul class="nav navbar-nav">\n' +
    '        <li><a href="#">Home</a></li>\n' +
    '        <li class="active"><a href="#/admin">Admin</a></li>\n' +
    '        <li><a href="#/selectTemplate">Select Template</a></li>\n' +
    '      </ul>\n' +
    '      <ul class="nav navbar-nav navbar-right">\n' +
    '      </ul>\n' +
    '    </div>\n' +
    '    <!-- /.navbar-collapse -->\n' +
    '  </div>\n' +
    '  <!-- /.container-fluid -->\n' +
    '</nav>\n' +
    '\n' +
    '<div class="admin-templates" class="animated fadeIn" style="height: 100%">\n' +
    '\n' +
    '  <h3>Admin</h3>\n' +
    '\n' +
    '  <div class="loader-container" ng-show="admin.loading">\n' +
    '    <div class="loader"></div>\n' +
    '  </div>\n' +
    '\n' +
    '  <div class="admin-container">\n' +
    '\n' +
    '    <!-- Tab and Search container -->\n' +
    '    <div class="tab-search-container">\n' +
    '\n' +
    '      <!-- Tabs -->\n' +
    '      <ul class="nav nav-tabs" style="margin-right: 20px;">\n' +
    '        <li class="nav-item" ng-class="{ \'active\': admin.activeTab === \'allTemplates\' }">\n' +
    '          <a class="nav-link" ng-click="admin.switchTab(\'allTemplates\')">All Templates</a>\n' +
    '        </li>\n' +
    '        <li class="nav-item" ng-class="{ \'active\': admin.activeTab === \'archive\' }">\n' +
    '          <a class="nav-link" ng-click="admin.switchTab(\'archive\')">Archive</a>\n' +
    '        </li>\n' +
    '      </ul>\n' +
    '\n' +
    '      <!-- Search Input -->\n' +
    '      <!-- <input type="text" ng-model="admin.searchText" class="search-input" placeholder="Search templates"> -->\n' +
    '\n' +
    '      <div class="search-box">\n' +
    '        <input type="text" ng-model="admin.searchText" placeholder="Search templates">\n' +
    '        <i class="fa fa-search search-icon"></i>\n' +
    '      </div>\n' +
    '\n' +
    '      <div class="filter-box">\n' +
    '        <button type="button" class="btn dropdown-toggle" data-toggle="dropdown" aria-haspopup="true"\n' +
    '          aria-expanded="false">\n' +
    '          <i class="fa fa-filter filter-icon"></i> Filter by groups\n' +
    '        </button>\n' +
    '        <span class="badge" ng-show="admin.selectedFilterCount() > 0">{{ admin.selectedFilterCount() }}</span>\n' +
    '        <span class="clear-x" ng-show="admin.selectedFilterCount() > 0" ng-click="admin.resetFilter()">X</span>\n' +
    '\n' +
    '        <div class="dropdown-menu dropdown-admin" aria-labelledby="dropdownMenuButton"\n' +
    '          ng-click="$event.stopPropagation()">\n' +
    '          <label class="dropdown-item" ng-repeat="group in admin.filterGroups">\n' +
    '            <input type="checkbox" ng-model="group.checked" ng-change="admin.applyFilter()"> {{group.groupname}}\n' +
    '          </label>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '\n' +
    '    <!-- Tab content -->\n' +
    '    <div class="tab-content">\n' +
    '      <!-- All Templates tab -->\n' +
    '      <div id="allTemplates" class="tab-pane" ng-class="{ \'show active\': admin.activeTab === \'allTemplates\' }">\n' +
    '        <table class="astro-table">\n' +
    '          <thead>\n' +
    '            <tr>\n' +
    '              <th class="sortable" ng-click="admin.changeSorting(\'name\')">Template Name\n' +
    '                <span ng-show="admin.sort.column === \'name\'" class="fa"\n' +
    '                  ng-class="{\'fa-arrow-up\': !admin.sort.descending, \'fa-arrow-down\': admin.sort.descending}"></span>\n' +
    '              </th>\n' +
    '              <th class="sortable" ng-click="admin.changeSorting(\'creatorUsername\')">Creator Name\n' +
    '                <span ng-show="admin.sort.column === \'creatorUsername\'" class="fa"\n' +
    '                  ng-class="{\'fa-arrow-up\': !admin.sort.descending, \'fa-arrow-down\': admin.sort.descending}"></span>\n' +
    '              </th>\n' +
    '              <th class="sortable" ng-click="admin.changeSorting(\'createdDate\')">Creation Date\n' +
    '                <span ng-show="admin.sort.column === \'createdDate\'" class="fa"\n' +
    '                  ng-class="{\'fa-arrow-up\': !admin.sort.descending, \'fa-arrow-down\': admin.sort.descending}"></span>\n' +
    '              </th>\n' +
    '              <th class="sortable" ng-click="admin.changeSorting(\'modifiedDate\')">Last Modified Date\n' +
    '                <span ng-show="admin.sort.column === \'modifiedDate\'" class="fa"\n' +
    '                  ng-class="{\'fa-arrow-up\': !admin.sort.descending, \'fa-arrow-down\': admin.sort.descending}"></span>\n' +
    '              </th>\n' +
    '              <th>Groups</th>\n' +
    '              <th>Action</th>\n' +
    '            </tr>\n' +
    '\n' +
    '          </thead>\n' +
    '          <tbody>\n' +
    '            <tr>\n' +
    '              <td colspan="6" ng-show="admin.loadingTable">\n' +
    '                <div class="loader"></div>\n' +
    '              </td>\n' +
    '            </tr>\n' +
    '            <tr\n' +
    '              ng-repeat="template in admin.astroTemplates | filter: admin.searchText | filter: admin.filterBySelectedGroups | orderBy: admin.sort.column: admin.sort.descending">\n' +
    '              <td>{{ template.name }}</td>\n' +
    '              <td>{{ template.creatorUsername }}</td>\n' +
    '              <td>{{ template.createdDate | date:\'shortDate\' }}</td>\n' +
    '              <td>{{ template.modifiedDate | date:\'shortDate\' }}</td>\n' +
    '              <td>\n' +
    '                <div class=" group-cloud">\n' +
    '                  <div class="group-cloud-item" ng-repeat="group in template.groups.slice(0, 2)">\n' +
    '                    {{ group.groupname }}\n' +
    '                  </div>\n' +
    '                  <div class="group-cloud-item group-cursor" ng-click="admin.selectTemplate(template)" ng-show="template.groups.length > 2">\n' +
    '                    +{{ template.groups.length - 2 }}\n' +
    '                  </div>\n' +
    '                </div>\n' +
    '              </td>\n' +
    '              <td class="action-icons">\n' +
    '                <span ng-click="admin.selectTemplate(template)"><i class="fa fa-share"></i></span>\n' +
    '                <span ng-click="admin.deleteTemplate(template)"><i class="fa fa-trash"></i></span>\n' +
    '              </td>\n' +
    '            </tr>\n' +
    '          </tbody>\n' +
    '        </table>\n' +
    '      </div>\n' +
    '      <!-- Archive tab -->\n' +
    '      <div id="archive" class="tab-pane" ng-class="{ \'show active\': admin.activeTab === \'archive\' }">\n' +
    '        <table class="astro-table">\n' +
    '          <thead>\n' +
    '            <tr>\n' +
    '              <th class="sortable" ng-click="admin.changeSorting(\'name\')">Template Name\n' +
    '                <span ng-show="admin.sort.column === \'name\'" class="fa"\n' +
    '                  ng-class="{\'fa-arrow-up\': !admin.sort.descending, \'fa-arrow-down\': admin.sort.descending}"></span>\n' +
    '              </th>\n' +
    '              <th class="sortable" ng-click="admin.changeSorting(\'creatorUsername\')">Creator Name\n' +
    '                <span ng-show="admin.sort.column === \'creatorUsername\'" class="fa"\n' +
    '                  ng-class="{\'fa-arrow-up\': !admin.sort.descending, \'fa-arrow-down\': admin.sort.descending}"></span>\n' +
    '              </th>\n' +
    '              <th class="sortable" ng-click="admin.changeSorting(\'createdDate\')">Creation Date\n' +
    '                <span ng-show="admin.sort.column === \'createdDate\'" class="fa"\n' +
    '                  ng-class="{\'fa-arrow-up\': !admin.sort.descending, \'fa-arrow-down\': admin.sort.descending}"></span>\n' +
    '              </th>\n' +
    '              <th class="sortable" ng-click="admin.changeSorting(\'modifiedDate\')">Last Modified Date\n' +
    '                <span ng-show="admin.sort.column === \'modifiedDate\'" class="fa"\n' +
    '                  ng-class="{\'fa-arrow-up\': !admin.sort.descending, \'fa-arrow-down\': admin.sort.descending}"></span>\n' +
    '              </th>\n' +
    '              <th>Groups</th>\n' +
    '              <th>Action</th>\n' +
    '            </tr>\n' +
    '\n' +
    '          </thead>\n' +
    '          <tbody>\n' +
    '            <tr>\n' +
    '              <td colspan="6" ng-show="admin.loadingTable">\n' +
    '                <div class="loader"></div>\n' +
    '              </td>\n' +
    '            </tr>\n' +
    '            <tr\n' +
    '              ng-repeat="template in admin.archivedAstroTemplates | filter: admin.searchText | filter: admin.filterBySelectedGroups | orderBy: admin.sort.column: admin.sort.descending">\n' +
    '              <td>{{ template.name }}</td>\n' +
    '              <td>{{ template.creatorUsername }}</td>\n' +
    '              <td>{{ template.createdDate | date:\'shortDate\' }}</td>\n' +
    '              <td>{{ template.modifiedDate | date:\'shortDate\' }}</td>\n' +
    '              <td>\n' +
    '                <div class="group-cloud">\n' +
    '                  <div class="group-cloud-item" ng-repeat="group in template.groups.slice(0, 2)">\n' +
    '                    {{ group.groupname }}\n' +
    '                  </div>\n' +
    '                  <div class="group-cloud-item" ng-show="template.groups.length > 2">\n' +
    '                    +{{ template.groups.length - 2 }}\n' +
    '                  </div>\n' +
    '                </div>\n' +
    '              </td>\n' +
    '              <td class="action-icons">\n' +
    '                <span ng-click="admin.unarchiveTemplate(template)">\n' +
    '                  <i class="fa fa-undo"></i>\n' +
    '                </span>\n' +
    '              </td>\n' +
    '            </tr>\n' +
    '          </tbody>\n' +
    '        </table>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '\n' +
    '  </div>\n' +
    '\n' +
    '  </hr>\n' +
    '\n' +
    '  <div class="editModal" tabindex="-1" role="dialog" ng-if="admin.showEditModal">\n' +
    '    <div class="modal-dialog">\n' +
    '      <div class="modal-content">\n' +
    '        <div class="modal-header">\n' +
    '          <button type="button" class="close" ng-click="admin.closeEditModal()"><span\n' +
    '              aria-hidden="true">&times;</span><span class="sr-only">Close</span>\n' +
    '          </button>\n' +
    '          <h3 class="modal-title">Share Template</h4>\n' +
    '        </div>\n' +
    '        <div class="modal-body">\n' +
    '          <div class="owner-details-div">\n' +
    '            <p><i style="margin: 3px" class="fa fa-file group-icon"></i>{{ admin.selectedTemplate.name }}</p>\n' +
    '            <p>{{ admin.selectedTemplate.creatorUsername }} (Owner)</p>\n' +
    '          </div>\n' +
    '          <h3>Groups:</h3>\n' +
    '          <div class="groups-list">\n' +
    '            <div class="group-item" ng-repeat="group in admin.groups | orderBy:\'sortOrder\'"\n' +
    '              ng-class="{\'group-selected\': admin.isGroupSelected(group), \'group-all\': admin.isGroupSelected(group) && group.groupname == admin.allGroup}">\n' +
    '              <span>\n' +
    '                <i class="fa fa-users group-icon"></i>\n' +
    '                <span class="group-name">{{ group.groupname }}</span>\n' +
    '              </span>\n' +
    '              <span ng-if="group.groupname !== admin.administrators">\n' +
    '                <i class="fa"\n' +
    '                ng-class="{\'fa-plus\': !admin.isGroupSelected(group), \'fa-minus\': admin.isGroupSelected(group)}"\n' +
    '                ng-click="admin.toggleGroupSelection(group)"></i>\n' +
    '              </span>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div class="modal-footer">\n' +
    '          <button class="btn btn-default" ng-click="admin.closeEditModal()">Close</button>\n' +
    '          <button class="btn btn-primary" ng-click="admin.editAstroTemplate()">Save</button>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '\n' +
    '\n' +
    '\n' +
    '  <div class="deleteModal" tabindex="-1" role="dialog" ng-if="admin.showDeleteModal">\n' +
    '    <div class="modal-dialog">\n' +
    '      <div class="modal-content">\n' +
    '        <div class="modal-header">\n' +
    '          <button type="button" class="close" ng-click="admin.closeDeleteModal()"><span\n' +
    '              aria-hidden="true">&times;</span><span class="sr-only">Close</span>\n' +
    '          </button>\n' +
    '          <h4 class="modal-title">Archive Template</h4>\n' +
    '\n' +
    '        </div>\n' +
    '        <div class="modal-body">\n' +
    '          <h4 class="modal-title" id="deleteModalLabel">Are you sure to archive\n' +
    '            <b>{{admin.selectedTemplate.name}}</b>?\n' +
    '          </h4>\n' +
    '        </div>\n' +
    '        <div class="modal-footer">\n' +
    '          <button class="btn btn-primary" ng-click="admin.deleteAstroTemplate()">Archive\n' +
    '          </button>\n' +
    '          <button class="btn btn-default" ng-click="admin.closeDeleteModal()">Close</button>\n' +
    '\n' +
    '        </div>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '  <div class="unarchiveModal" tabindex="-1" role="dialog" ng-if="admin.showUnarchiveModal">\n' +
    '    <div class="modal-dialog">\n' +
    '      <div class="modal-content">\n' +
    '        <div class="modal-header">\n' +
    '          <button type="button" class="close" ng-click="admin.closeUnarchiveModal()"><span\n' +
    '              aria-hidden="true">&times;</span><span class="sr-only">Close</span>\n' +
    '          </button>\n' +
    '          <h4 class="modal-title">Unarchive Template</h4>\n' +
    '\n' +
    '        </div>\n' +
    '        <div class="modal-body">\n' +
    '          <h4 class="modal-title" id="deleteModalLabel">Are you sure to unarchive\n' +
    '            <b>{{admin.selectedTemplate.name}}</b>?\n' +
    '          </h4>\n' +
    '        </div>\n' +
    '        <div class="modal-footer">\n' +
    '          <button class="btn btn-primary" ng-click="admin.unarchiveAstroTemplate()">Unarchive\n' +
    '          </button>\n' +
    '          <button class="btn btn-default" ng-click="admin.closeUnarchiveModal()">Close</button>\n' +
    '\n' +
    '        </div>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '\n' +
    '\n' +
    '  <div id="uploadSuccessAlert" class="text-center"\n' +
    '    style="display:none;position:fixed; top:40%;left:35%;height:100px;width:30%;">\n' +
    '    <alert type="success"><i class="fa fa-check fa-lg"></i> Successfully\n' +
    '      Uploaded!\n' +
    '    </alert>\n' +
    '  </div>\n' +
    '\n' +
    '  <div id="infoMsgAlert" class="text-center"\n' +
    '    style="display:none;position:fixed; top:40%;left:35%;height:100px;width:30%;">\n' +
    '    <alert type="info">{{admin.alertMsg.msg}}\n' +
    '    </alert>\n' +
    '  </div>\n' +
    '\n' +
    '  <div id="errorMsgAlert" class="text-center"\n' +
    '    style="display:none;position:fixed; top:40%;left:35%;height:100px;width:30%;">\n' +
    '    <alert type="danger">{{admin.alertMsg.msg}}\n' +
    '    </alert>\n' +
    '  </div>\n' +
    '\n' +
    '  <div id="successMsgAlert" class="text-center"\n' +
    '    style="display:none;position:fixed; top:40%;left:35%;height:100px;width:30%;">\n' +
    '    <alert type="success"><i class="fa fa-check fa-lg"></i> {{admin.alertMsg.msg}}\n' +
    '    </alert>\n' +
    '  </div>\n' +
    '\n' +
    '</div>');
}]);
