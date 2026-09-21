var module;
try {
  module = angular.module('huashanApp');
} catch (e) {
  module = angular.module('huashanApp', []);
}

module.run(['$templateCache', function ($templateCache) {
  $templateCache.put('views/selectTemplate.html',
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
    '        <li><a ng-if="select.isAdmin" href="#/admin">Admin</a></li>\n' +
    '        <li class="active"><a href="#/selectTemplate">Select Template</a></li>\n' +
    '        <li ng-hide="select.selectedTemplate === \'Not Selected\'"><a href="#/json/{{select.selectedTemplate}}">JSON</a>\n' +
    '        </li>\n' +
    '        <li class="dropdown" ng-hide="select.selectedTemplate === \'Not Selected\'">\n' +
    '          <a href="" class="dropdown-toggle" data-toggle="dropdown">Data\n' +
    '            Structure <span class="caret"></span></a>\n' +
    '          <ul class="dropdown-menu" role="menu">\n' +
    '            <li><a href="#/datastructure/{{select.selectedTemplate}}">Project\n' +
    '                Data Structure</a></li>\n' +
    '            <!-- <li><a href="#/platformDataStructure/{{select.selectedTemplate}}">Platform\n' +
    '                Data Structure</a></li> -->\n' +
    '          </ul>\n' +
    '        </li>\n' +
    '        <li class="dropdown" ng-hide="select.selectedTemplate === \'Not Selected\'">\n' +
    '          <a href="" class="dropdown-toggle" data-toggle="dropdown">App\n' +
    '            Structure <span class="caret"></span></a>\n' +
    '          <ul class="dropdown-menu" role="menu">\n' +
    '            <li><a href="#/appstructure/{{select.selectedTemplate}}">Project\n' +
    '                App Structure</a></li>\n' +
    '            <!-- <li><a href="#/platformAppStructure/{{select.selectedTemplate}}">Platform\n' +
    '                App Structure</a></li> -->\n' +
    '          </ul>\n' +
    '        </li>\n' +
    '        <li class="dropdown" ng-hide="select.selectedTemplate === \'Not Selected\'">\n' +
    '          <a href="" class="dropdown-toggle" data-toggle="dropdown">Portfolio\n' +
    '            Structure <span class="caret"></span></a>\n' +
    '          <ul class="dropdown-menu" role="menu">\n' +
    '            <li><a href="#/portfoliostructure/{{select.selectedTemplate}}">Project\n' +
    '                Portfolio Structure</a></li>\n' +
    '            <!-- <li><a href="#/platformPortfolioStructure/{{select.selectedTemplate}}">Platform\n' +
    '                Portfolio Structure</a></li> -->\n' +
    '          </ul>\n' +
    '        </li>\n' +
    '        <li ng-hide="select.selectedTemplate === \'Not Selected\'">\n' +
    '          <a href="#/revisions/{{select.selectedTemplate}}">Revisions</a>\n' +
    '        </li>\n' +
    '      </ul>\n' +
    '      <ul class="nav navbar-nav navbar-right">\n' +
    '      </ul>\n' +
    '    </div>\n' +
    '    <!-- /.navbar-collapse -->\n' +
    '  </div>\n' +
    '  <!-- /.container-fluid -->\n' +
    '</nav>\n' +
    '\n' +
    '\n' +
    '<div class="select-template" class="animated fadeIn" style="height: 100%">\n' +
    '\n' +
    '  <div class="loader-container" ng-show="select.loading">\n' +
    '    <div class="loader"></div>\n' +
    '  </div>\n' +
    '  <!--Left side: list of templates to choose from-->\n' +
    '  <div id="choose-from" style="height: 100%">\n' +
    '    <div class="select-template-title">\n' +
    '      <h4>Select a Template</h4>\n' +
    '    </div>\n' +
    '    <div class="select-template-title">\n' +
    '      <input type="text" class="form-control" placeholder="Search" ng-model="searchName.name">\n' +
    '    </div>\n' +
    '    <div class="panel panel-primary" style="height: calc(100% - 260px)">\n' +
    '\n' +
    '\n' +
    '      <!-- List group -->\n' +
    '      <div class="list-of-templates height-for-list" style="height: 100%">\n' +
    '\n' +
    '        <div class="list-group" style="height: 100%">\n' +
    '          <div ng-show="select.loadingTable" class="loader-small"></div>\n' +
    '          <a href="" class="list-group-item"\n' +
    '            ng-repeat="template in select.templates|filter:searchName:strict | orderBy: select.sort.column: select.sort.descending track by $index"\n' +
    '            ng-click="select.select(template)" ng-class="{active: select.selectedTemplate == template.name}"\n' +
    '            tooltip="{{template.name}}" tooltip-trigger="mouseenter" tooltip-popup-delay="500">\n' +
    '            <table>\n' +
    '              <tr>\n' +
    '                <td class="appStructList">{{template.name}}</td>\n' +
    '                <td class="appStructList" style="width:60px">\n' +
    '                  <span data-toggle="modal" data-target="#deleteModal"\n' +
    '                    ng-show="select.selectedTemplate == template.name && select.isAdmin" ng-click="$(\'#deleteModal\').modal(\'show\')"\n' +
    '                    class="inline-icon pull-right glyphicon glyphicon-trash" tooltip="Delete"\n' +
    '                    tooltip-trigger="mouseenter" tooltip-popup-delay="500"></span>\n' +
    '                  <span data-toggle="modal" data-target="#renameModal"\n' +
    '                    ng-show="select.selectedTemplate == template.name && select.isAdmin" ng-click="$(\'#renameModal\').modal(\'show\')"\n' +
    '                    class="inline-icon pull-right glyphicon glyphicon-pencil" tooltip="Rename"\n' +
    '                    tooltip-trigger="mouseenter" tooltip-popup-delay="500"></span>\n' +
    '                </td>\n' +
    '              </tr>\n' +
    '            </table>\n' +
    '\n' +
    '\n' +
    '          </a>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '\n' +
    '    <div class="">\n' +
    '      <!-- View Trash Button -->\n' +
    '      <button ng-if="select.isAdmin" class="btn btn-primary pull-left" data-toggle="modal" data-target="#trashModal" tooltip="Open Archive"\n' +
    '        tooltip-trigger="mouseenter" tooltip-popup-delay="500" ng-click="select.listDeletedTemplates()">Archive\n' +
    '      </button>\n' +
    '\n' +
    '      <!-- Rename Button -->\n' +
    '      <!--<button class="btn btn-warning pull-right"-->\n' +
    '      <!--ng-disabled="select.selectedTemplate == \'Not Selected\'"-->\n' +
    '      <!--data-toggle="modal" data-target="#renameModal" tooltip="Edit"-->\n' +
    '      <!--tooltip-trigger="mouseenter" tooltip-popup-delay="500"><span-->\n' +
    '      <!--class="glyphicon glyphicon-pencil"></span></button>-->\n' +
    '\n' +
    '      <!-- Delete Button -->\n' +
    '      <!--<button class="btn btn-danger pull-right"-->\n' +
    '      <!--ng-disabled="select.selectedTemplate == \'Not Selected\'"-->\n' +
    '      <!--data-toggle="modal" data-target="#deleteModal" tooltip="Delete"-->\n' +
    '      <!--tooltip-trigger="mouseenter" tooltip-popup-delay="500"><span-->\n' +
    '      <!--class="glyphicon glyphicon-trash"></span></button>-->\n' +
    '\n' +
    '      <!-- Upload Button -->\n' +
    '      <button class="btn btn-success pull-right" data-toggle="modal" data-target="#uploadModal" tooltip="Upload"\n' +
    '        tooltip-trigger="mouseenter" tooltip-popup-delay="500"><span class="glyphicon glyphicon-open"></span></button>\n' +
    '\n' +
    '    </div>\n' +
    '    <!--container of all popups-->\n' +
    '\n' +
    '  </div>\n' +
    '  <!--Left side-->\n' +
    '\n' +
    '  <!--Right Side: selected template and JSON-->\n' +
    '  <div id="selected-template">\n' +
    '\n' +
    '    <div ng-if="select.syncTemplateResult == \'Success\'" class="alert alert-success alert-dismissible text-center"\n' +
    '      role="alert">\n' +
    '      <button class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>\n' +
    '      Synchronize template to multiple calculation engine for\n' +
    '      \'{{select.selectedTemplate}}\' portfolio is successfully!\n' +
    '    </div>\n' +
    '\n' +
    '    <div ng-if="select.runningUpdateDataStructure == \'Running\'" class="alert alert-info alert-dismissible text-center"\n' +
    '      role="alert">\n' +
    '      <button class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>\n' +
    '      Updating Data Structure for \'{{select.selectedPortfolioName}}\' portfolio.\n' +
    '      Will be notified when done.\n' +
    '    </div>\n' +
    '    <div ng-if="select.runningUpdateDataStructure == \'Success\'"\n' +
    '      class="alert alert-success alert-dismissible text-center" role="alert">\n' +
    '      <button class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>\n' +
    '      Data Structure for \'{{select.selectedPortfolioName}}\' portfolio is\n' +
    '      updated successfully!\n' +
    '    </div>\n' +
    '    <div ng-if="select.runningUpdateDataStructure == \'Failure\'" class="alert alert-danger alert-dismissible text-center"\n' +
    '      role="alert">\n' +
    '      <button class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>\n' +
    '      Updating Data Structure for \'{{select.selectedPortfolioName}}\' was not\n' +
    '      successful. {select.responseMsg}\n' +
    '    </div>\n' +
    '\n' +
    '\n' +
    '    <div ng-if="select.showMessage"\n' +
    '      ng-class="{\'alert-success\': select.showMessage === \'Success\', \'alert-danger\': select.showMessage === \'Failure\'}"\n' +
    '      class="alert alert-success alert-dismissible text-center" role="alert">\n' +
    '      <button class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>\n' +
    '      {{select.showMessageContent}}\n' +
    '    </div>\n' +
    '\n' +
    '    <div class="st-ipointer" id="template-description">\n' +
    '\n' +
    '      <div class="col-sm-6" id="description">\n' +
    '        <div ng-show="select.selectedTemplate != \'Not Selected\'">\n' +
    '\n' +
    '\n' +
    '          <h2>{{select.selectedTemplate}}</h2>\n' +
    '\n' +
    '          <h4>\n' +
    '            <div ng-show="!select.revisionInfo">\n' +
    '              <span>No Version Info</span>&nbsp;\n' +
    '            </div>\n' +
    '          </h4>\n' +
    '\n' +
    '\n' +
    '          <div style="display: flex; justify-content: space-between">\n' +
    '            <h4 ng-if="select.revisionInfo">Version Info:</h4>\n' +
    '            <!--            <button type="button"-->\n' +
    '            <!--                    class="btn btn-danger"-->\n' +
    '            <!--                    tooltip="Send template to multipal calculation servers"-->\n' +
    '            <!--                    tooltip-trigger="mouseenter"-->\n' +
    '            <!--                    tooltip-popup-delay="500"-->\n' +
    '            <!--                    ng-click="select.syncTemplate(select.selectedTemplate)">Synchronize-->\n' +
    '            <!--            </button>-->\n' +
    '          </div>\n' +
    '\n' +
    '          <div ng-if="select.revisionInfo" class="panel panel-default panel-body">\n' +
    '            <div><b>{{select.revisionInfo.committer}}</b> saved changes <b>{{select.revisionInfo.relativeTime}}</b>\n' +
    '            </div>\n' +
    '            <div>Commit Hash: {{select.revisionInfo.commitNum}}</div>\n' +
    '            <div>Commit Message: {{select.revisionInfo.commitMessage}}</div>\n' +
    '          </div>\n' +
    '\n' +
    '          <div ng-if="select.showVersionLog" class="panel panel-default">\n' +
    '            <div class="panel-body st-versionlog">\n' +
    '              <span ng-if="!select.selected.info.VersionLog && !select.selected.info.VersionLogs">\n' +
    '                No VersionLog\n' +
    '              </span>\n' +
    '              <ul>\n' +
    '                <li ng-repeat="log in select.selected.info.VersionLogs">\n' +
    '                  <h5>V{{log.Version}} - {{log.VersionTime}}</h5>\n' +
    '                  <span style="white-space: pre;">{{log.VersionLog}}</span>\n' +
    '                </li>\n' +
    '              </ul>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '\n' +
    '          <!-- <h4>Description</h4>\n' +
    '          <div class="panel panel-default">\n' +
    '            <div ng-if="!select.editDescription" class="panel-body">\n' +
    '              <span ng-if="!select.selected.info.Description">No Description</span>\n' +
    '              <span>{{select.selected.info.Description}}</span>\n' +
    '              &nbsp;\n' +
    '              <i class="fa fa-pencil" ng-click="select.toggleEditDescription(true);"></i>\n' +
    '            </div>\n' +
    '            <div ng-if="select.editDescription">\n' +
    '              <textarea rows="15" ng-model="select.selected.info.Description"></textarea>\n' +
    '              &nbsp;<i class="fa fa-check" ng-click="select.toggleEditDescription(false)"></i>\n' +
    '            </div>\n' +
    '          </div> -->\n' +
    '\n' +
    '          <!-- <div>\n' +
    '            <div ng-if="!select.editCreator">\n' +
    '              <span ng-if="!select.selected.info.Creator">Add Creator Info</span>\n' +
    '              <span ng-if="select.selected.info.Creator">Created by {{select.selected.info.Creator}}</span>\n' +
    '              &nbsp;\n' +
    '              <i class="fa fa-pencil" ng-click="select.toggleEditCreator(true)"></i>\n' +
    '            </div>\n' +
    '            <div ng-if="select.editCreator">\n' +
    '              <input type="text" ng-model="select.selected.info.Creator" placeholder="Creater Name...">\n' +
    '              &nbsp;\n' +
    '              <i class="fa fa-check" ng-click="select.toggleEditCreator(false)"></i>\n' +
    '            </div>\n' +
    '          </div> -->\n' +
    '          <!-- <div>\n' +
    '            <div ng-if="!select.editCreatorLink">\n' +
    '              <span ng-if="!select.selected.info.CreatorLink">Add Creator Link</span>\n' +
    '              <a ng-if="select.selected.info.CreatorLink" ng-href="{{select.selected.info.CreatorLink}}">\n' +
    '                {{select.selected.info.CreatorLink}}</a>\n' +
    '              &nbsp;\n' +
    '              <i class="fa fa-pencil" ng-click="select.toggleEditCreatorLink(true)"></i>\n' +
    '            </div>\n' +
    '            <div ng-if="select.editCreatorLink">\n' +
    '              <input type="text" ng-model="select.selected.info.CreatorLink" placeholder="Creater Website...">\n' +
    '              &nbsp;\n' +
    '              <i class="fa fa-check" ng-click="select.toggleEditCreatorLink(false)"></i>\n' +
    '            </div>\n' +
    '          </div> -->\n' +
    '\n' +
    '          <!-- <div>\n' +
    '            <div ng-if="!select.editEmail">\n' +
    '              <span ng-if="!select.selected.info.Email">Add Creator Email</span>\n' +
    '              <a ng-if="select.selected.info.Email" ng-href="mailto:#">{{select.selected.info.Email}}</a>\n' +
    '              &nbsp;\n' +
    '              <i class="fa fa-pencil" ng-click="select.toggleEditEmail(true)"></i>\n' +
    '            </div>\n' +
    '            <div ng-if="select.editEmail">\n' +
    '              <input type="text" ng-model="select.selected.info.Email" placeholder="Creater Email...">\n' +
    '              &nbsp;\n' +
    '              <i class="fa fa-check" ng-click="select.toggleEditEmail(false)"></i>\n' +
    '            </div>\n' +
    '          </div> -->\n' +
    '\n' +
    '          <br />\n' +
    '          <a ng-href="#/json/{{select.selectedTemplate}}" class="btn btn-primary" role="button"\n' +
    '            ng-hide="select.selectedTemplate == \'Not Selected\'">View JSON</a>\n' +
    '          <a class="btn btn-primary" ng-click="select.downloadTemplate()" role="button"\n' +
    '            ng-hide="select.selectedTemplate == \'Not Selected\'">Download Excel\n' +
    '            model</a>\n' +
    '          <div ng-if="select.portfolioNameList.length > 0">\n' +
    '            <br>\n' +
    '            <a class="btn btn-primary" ng-click="select.initializeUpdateDataStructure()" role="button"\n' +
    '              ng-hide="select.selectedTemplate == \'Not Selected\'" data-toggle="modal"\n' +
    '              data-target="#updateDataStructureModal">Update Data Structure\n' +
    '            </a>\n' +
    '\n' +
    '            <!--Update DataStructure Modal -->\n' +
    '            <div class="modal fade" id="updateDataStructureModal" role="dialog">ke i\n' +
    '              <div class="modal-dialog">\n' +
    '\n' +
    '                <!--Update DataStructure Modal content-->\n' +
    '                <div class="modal-content">\n' +
    '                  <div class="modal-header">\n' +
    '                    <h4 class="modal-title">Update Data Structure</h4>\n' +
    '                  </div>\n' +
    '                  <div class="modal-body">\n' +
    '                    <h4>Select a Portfolio </h4>\n' +
    '                    <div class="list-of-portfolios">\n' +
    '                      <div class="list-group">\n' +
    '                        <a href="" class="list-group-item"\n' +
    '                          ng-repeat="portfolioName in select.portfolioNameList track by $index"\n' +
    '                          ng-click="select.selectPortfolioName(portfolioName)"\n' +
    '                          ng-class="{active: select.selectedPortfolioName === portfolioName}"\n' +
    '                          tooltip="{{portfolioName}}" tooltip-trigger="mouseenter" tooltip-popup-delay="500">\n' +
    '                          {{portfolioName}}\n' +
    '                        </a>\n' +
    '                      </div>\n' +
    '                    </div>\n' +
    '                    <h4>Select Leaf / Platform </h4>\n' +
    '                    <label>\n' +
    '                      <input type="checkbox" ng-model="select.updateDataStructure.Leaf"> Leaf\n' +
    '                    </label><br />\n' +
    '                    <label>\n' +
    '                      <input type="checkbox" ng-model="select.updateDataStructure.Platform">\n' +
    '                      Platform\n' +
    '                    </label><br />\n' +
    '                  </div>\n' +
    '                  <div class="modal-footer">\n' +
    '                    <button ng-if="select.selectedPortfolioName !== \'\'" class="btn btn-primary" data-dismiss="modal"\n' +
    '                      ng-click="select.runUpdateDataStructure()">Run\n' +
    '                    </button>\n' +
    '                    <button class="btn btn-default" data-dismiss="modal" ng-click="select.resetPortfolioName()">Close\n' +
    '                    </button>\n' +
    '                  </div>\n' +
    '                </div>\n' +
    '\n' +
    '              </div>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '      <div class="col-sm-6 select-template-title"></div>\n' +
    '      <!-- <div class="col-sm-6" ng-hide="select.selectedTemplate ===\'Not Selected\'">\n' +
    '        <div style="height: 305px;">\n' +
    '          <carousel interval="myInterval" style="height:100%;width:100%;overflow: hidden;">\n' +
    '            <slide ng-repeat="slide in select.slides" active="slide.active">\n' +
    '              <img ng-src="{{slide.image}}" style="margin:auto;">\n' +
    '\n' +
    '              <div class="carousel-caption">\n' +
    '              </div>\n' +
    '            </slide>\n' +
    '          </carousel>\n' +
    '        </div>\n' +
    '      </div> -->\n' +
    '    </div>\n' +
    '  </div>\n' +
    '  <!--Right side-->\n' +
    '\n' +
    '</div>\n' +
    '\n' +
    '\n' +
    '\n' +
    '\n' +
    '<div class="col-sm-12 text-center align-to-bottom">\n' +
    '  <a ng-href="#/datastructure/{{select.selectedTemplate}}" class="btn btn-primary pull-right" role="button"\n' +
    '    ng-disabled="select.selectedTemplate == \'Not Selected\'">Next: Data\n' +
    '    Structure <span class="glyphicon glyphicon-chevron-right"></span></a>\n' +
    '</div>\n' +
    '\n' +
    '\n' +
    '<!--Rename Modal -->\n' +
    '<div class="modal fade" id="renameModal" tabindex="-1" role="dialog" aria-labelledby="renameModalLabel"\n' +
    '  aria-hidden="true">\n' +
    '  <div class="modal-dialog">\n' +
    '    <div class="modal-content">\n' +
    '      <div class="modal-header">\n' +
    '        <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span\n' +
    '            class="sr-only">Close</span>\n' +
    '        </button>\n' +
    '        <h4 class="modal-title" id="renameModalLabel">Rename\n' +
    '          {{select.selectedTemplate}}</h4>\n' +
    '      </div>\n' +
    '      <div class="modal-body">\n' +
    '        <h4>New Name:</h4>\n' +
    '        <input type="text" ng-model="select.newTemplateName" class="form form-control" />\n' +
    '\n' +
    '        <div class="col-sm-12 save-alert text-center">\n' +
    '          <alert class="animated shake" ng-repeat="alert in select.renameAlerts" type="{{alert.type}}"\n' +
    '            close="select.closeAlert(select.renameAlerts,$index)"><i class="fa fa-exclamation-triangle fa-lg"></i>\n' +
    '            {{alert.msg}}\n' +
    '          </alert>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '      <div class="modal-footer">\n' +
    '        <button class="btn btn-primary" ng-click="select.rename()">Rename\n' +
    '        </button>\n' +
    '        <!--<button class= "btn btn-warning" ng-click="uploads.cancel()">Cancel</button>-->\n' +
    '        <button type="button" class="btn btn-default" data-dismiss="modal">\n' +
    '          Close\n' +
    '        </button>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '</div>\n' +
    '\n' +
    '<!-- Delete Modal -->\n' +
    '<div class="modal fade" id="deleteModal" tabindex="-1" role="dialog" aria-labelledby="deleteModalLabel"\n' +
    '  aria-hidden="true">\n' +
    '  <div class="modal-dialog">\n' +
    '    <div class="modal-content">\n' +
    '      <div class="modal-header">\n' +
    '        <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span\n' +
    '            class="sr-only">Close</span>\n' +
    '        </button>\n' +
    '        <h4 class="modal-title">Delete Template</h4>\n' +
    '\n' +
    '      </div>\n' +
    '      <div class="modal-body">\n' +
    '        <h4 class="modal-title" id="deleteModalLabel">Are you sure to delete\n' +
    '          <b>{{select.selectedTemplate}}</b>?\n' +
    '        </h4>\n' +
    '\n' +
    '        <div class="col-sm-12 save-alert text-center">\n' +
    '          <alert class="animated shake" ng-repeat="alert in select.deleteAlerts" type="{{alert.type}}"\n' +
    '            close="closeAlert(deleteAlerts,$index)"><i class="fa fa-exclamation-triangle fa-lg"></i> {{alert.msg}}\n' +
    '          </alert>\n' +
    '          <alert class="animated fadeIn" ng-repeat="alert in select.submitSuccess" type="{{alert.type}}"\n' +
    '            close="closeAlert(submitSuccess,$index)"><i class="fa fa-check-circle-o fa-lg"></i> {{alert.msg}}\n' +
    '          </alert>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '      <div class="modal-footer">\n' +
    '        <button class="btn btn-primary" ng-click="select.delete()">Delete\n' +
    '        </button>\n' +
    '        <!--<button class= "btn btn-warning" ng-click="uploads.cancel()">Cancel</button>-->\n' +
    '        <button type="button" class="btn btn-default" data-dismiss="modal">\n' +
    '          Close\n' +
    '        </button>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '</div>\n' +
    '\n' +
    '\n' +
    '<!-- Trash Modal -->\n' +
    '<div class="modal fade" id="trashModal" tabindex="-1" role="dialog" aria-labelledby="trashModalLabel"\n' +
    '  aria-hidden="true">\n' +
    '  <div class="modal-dialog">\n' +
    '    <div class="modal-content">\n' +
    '      <div class="modal-header">\n' +
    '        <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span\n' +
    '            class="sr-only">Close</span>\n' +
    '        </button>\n' +
    '        <h4 class="modal-title" id="trashModalLabel">Templates in\n' +
    '          Archive:</h4>\n' +
    '      </div>\n' +
    '      <div class="modal-body">\n' +
    '        <!-- List group -->\n' +
    '        <!-- <h4 ng-show="select.deletedTemplates.length == 0">Archive is\n' +
    '          Empty</h4> -->\n' +
    '          <div ng-show="select.loadingDeleteList" class="loader-small"></div>\n' +
    '\n' +
    '        <div class="list-of-templates">\n' +
    '          <div class="list-group">\n' +
    '            <a class="list-group-item" ng-repeat="deleted in select.deletedTemplates"\n' +
    '              ng-click="select.selectDeleted(deleted)" ng-class="{active: select.selectedDeletedTemplate == deleted}"\n' +
    '              tooltip="{{deleted}}" tooltip-trigger="mouseenter" tooltip-popup-delay="500">{{deleted}}</a>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div class="col-sm-12 save-alert text-center">\n' +
    '          <alert class="animated shake" ng-repeat="alert in select.undeleteAlerts" type="{{alert.type}}"\n' +
    '            close="select.closeAlert(select.undeleteAlerts,$index)"><i class="fa fa-exclamation-triangle fa-lg"></i>\n' +
    '            {{alert.msg}}\n' +
    '          </alert>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '      <div class="modal-footer">\n' +
    '        <button class="btn btn-primary" ng-click="select.undelete()"\n' +
    '          ng-disabled="select.selectedDeletedTemplate == \'Not Selected\'">\n' +
    '          Unarchive\n' +
    '        </button>\n' +
    '        <button type="button" class="btn btn-default" data-dismiss="modal">\n' +
    '          Close\n' +
    '        </button>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '</div>\n' +
    '\n' +
    '\n' +
    '<!-- Upload Modal -->\n' +
    '<div class="modal fade" id="uploadModal" tabindex="-1" role="dialog" aria-labelledby="uploadModalLabel"\n' +
    '  aria-hidden="true">\n' +
    '  <div class="modal-dialog">\n' +
    '    <div class="modal-content">\n' +
    '      <div class="modal-header">\n' +
    '        <div ng-if="select.ogre===false">\n' +
    '          <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span\n' +
    '              class="sr-only">Close</span></button>\n' +
    '          <h4 class="modal-title" id="uploadModalLabel">Select a Template to\n' +
    '            upload</h4>\n' +
    '        </div>\n' +
    '        <div ng-if="select.ogre===true && select.ogreStage === \'SelectModel\'">\n' +
    '          <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span\n' +
    '              class="sr-only">Close</span></button>\n' +
    '          <h2 class="modal-title" id="uploadModalLabel">Help the Smart Ogre\n' +
    '            out</h2>\n' +
    '        </div>\n' +
    '        <div ng-if="select.ogre===true && select.ogreStage === \'GeneratingTemplate\'">\n' +
    '          <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span\n' +
    '              class="sr-only">Close</span></button>\n' +
    '          <h2 class="modal-title" id="uploadModalLabel">Smart Ogre is doing its\n' +
    '            thing...</h2>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '      <div class="modal-body">\n' +
    '        <div ng-if="select.ogre===false">\n' +
    '          <iframe name="targetFrame" id="itargetFrame" style="display: none; height: 0px; width:0px;"></iframe>\n' +
    '          <h4>Please choose an Excel file.</h4>\n' +
    '\n' +
    '          <p class="text-danger"> No spaces or underscores allowed in file\n' +
    '            name.</p>\n' +
    '          <input type="file" name="zFileToUpload" id="FileToUploadID" file-model="select.fileToUpload" />\n' +
    '        </div>\n' +
    '        <div ng-if="select.ogre===true && select.ogreStage === \'SelectModel\'">\n' +
    '          <iframe name="targetFrame" id="itargetFrame" style="display: none; height: 0px; width:0px;"></iframe>\n' +
    '          <h4>What evaluation model is this?</h4>\n' +
    '          <table class="table">\n' +
    '            <tr>\n' +
    '              <td class="centeredText">\n' +
    '                <img src="images/cube.png" align="middle"\n' +
    '                  ng-click="select.generateProductPortfolio(\'Product Portfolio\')" /><br />\n' +
    '                Product Portfolio (R&D)\n' +
    '              </td>\n' +
    '              <td align="center">\n' +
    '                <img src="images/complexCrystal.png" align="middle"\n' +
    '                  ng-click="select.generateProductPortfolio(\'Platform Portfolio\')" /><br />\n' +
    '                Platform Product Portfolio (R&D)\n' +
    '              </td>\n' +
    '            </tr>\n' +
    '          </table>\n' +
    '        </div>\n' +
    '        <div ng-if="select.ogre===true && select.ogreStage === \'GeneratingTemplate\'">\n' +
    '          <iframe name="targetFrame" id="itargetFrame" style="display: none; height: 0px; width:0px;"></iframe>\n' +
    '          <h4>Building {{select.templateName}} with a\n' +
    '            {{select.selectedOgreModel}} model</h4>\n' +
    '          <i ng-if="select.ogreBuildCompleted === false" class="fa fa-circle-o-notch fa-spin"></i>\n' +
    '          <span ng-if="select.ogreBuildCompleted === true">Build completed! Check your template.</span>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '      <div class="col-sm-12 save-alert text-center">\n' +
    '        <alert class="animated shake" ng-repeat="alert in select.submitAlerts" type="{{alert.type}}"\n' +
    '          close="select.closeAlert(select.submitAlerts,$index)"><i class="fa fa-exclamation-triangle fa-lg"></i>\n' +
    '          {{alert.msg}}\n' +
    '        </alert>\n' +
    '      </div>\n' +
    '      <div class="modal-footer">\n' +
    '        <div ng-if="select.ogre===false">\n' +
    '\n' +
    '          <!--          <a class="btn btn-primary btn pull-left"-->\n' +
    '          <!--             ng-click="select.smartogrify()">-->\n' +
    '          <!--            Smartogrify-->\n' +
    '          <!--          </a>-->\n' +
    '          <button class="btn btn-primary" ng-click="select.submit()">Upload\n' +
    '          </button>\n' +
    '          <button class="btn btn-default" data-dismiss="modal">Close</button>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '</div>\n' +
    '\n' +
    '<!-- Delete Modal -->\n' +
    '<div class="modal fade" id="deleteModal" tabindex="-1" role="dialog" aria-labelledby="deleteModalLabel"\n' +
    '  aria-hidden="true">\n' +
    '  <div class="modal-dialog">\n' +
    '    <div class="modal-content">\n' +
    '      <div class="modal-header">\n' +
    '        <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span\n' +
    '            class="sr-only">Close</span>\n' +
    '        </button>\n' +
    '        <h4 class="modal-title">Delete Template</h4>\n' +
    '\n' +
    '      </div>\n' +
    '      <div class="modal-body">\n' +
    '        <h4 class="modal-title" id="deleteModalLabel">Are you sure to delete\n' +
    '          <b>{{select.selectedTemplate}}</b>?\n' +
    '        </h4>\n' +
    '\n' +
    '        <div class="col-sm-12 save-alert text-center">\n' +
    '          <alert class="animated shake" ng-repeat="alert in select.deleteAlerts" type="{{alert.type}}"\n' +
    '            close="closeAlert(deleteAlerts,$index)"><i class="fa fa-exclamation-triangle fa-lg"></i> {{alert.msg}}\n' +
    '          </alert>\n' +
    '          <alert class="animated fadeIn" ng-repeat="alert in select.submitSuccess" type="{{alert.type}}"\n' +
    '            close="closeAlert(submitSuccess,$index)"><i class="fa fa-check-circle-o fa-lg"></i> {{alert.msg}}\n' +
    '          </alert>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '      <div class="modal-footer">\n' +
    '        <button class="btn btn-primary" ng-click="select.delete()">Delete\n' +
    '        </button>\n' +
    '        <!--<button class= "btn btn-warning" ng-click="uploads.cancel()">Cancel</button>-->\n' +
    '        <button type="button" class="btn btn-default" data-dismiss="modal">\n' +
    '          Close\n' +
    '        </button>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '</div>\n' +
    '\n' +
    '<div id="uploadSuccessAlert" class="text-center"\n' +
    '  style="display:none;position:fixed; top:40%;left:35%;height:100px;width:30%;">\n' +
    '  <alert type="success"><i class="fa fa-check fa-lg"></i> Successfully\n' +
    '    Uploaded!\n' +
    '  </alert>\n' +
    '</div>\n' +
    '\n' +
    '<div id="infoMsgAlert" class="text-center"\n' +
    '  style="display:none;position:fixed; top:40%;left:35%;height:100px;width:30%;z-index: 9999;">\n' +
    '  <alert type="info">{{select.alertMsg.msg}}\n' +
    '  </alert>\n' +
    '</div>\n' +
    '\n' +
    '<div id="errorMsgAlert" class="text-center"\n' +
    '  style="display:none;position:fixed; top:40%;left:35%;height:100px;width:30%;">\n' +
    '  <alert type="danger">{{select.alertMsg.msg}}\n' +
    '  </alert>\n' +
    '</div>\n' +
    '\n' +
    '<div id="pyOrgrigySuccessAlert" class="text-center"\n' +
    '  style="display:none;position:fixed; top:40%;left:35%;height:100px;width:30%;">\n' +
    '  <alert type="success"><i class="fa fa-check fa-lg"></i> SmartOgrify\n' +
    '    Successfully\n' +
    '    Executed!\n' +
    '  </alert>\n' +
    '</div>');
}]);
