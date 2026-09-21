var module;
try {
  module = angular.module('huashanApp');
} catch (e) {
  module = angular.module('huashanApp', []);
}

module.run(['$templateCache', function ($templateCache) {
  $templateCache.put('views/json.html',
    '<nav class="navbar navbar-inverse navbar-static-top" role="navigation">\n' +
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
    '        <li><a ng-if="json.isAdmin" href="#/admin">Admin</a></li>\n' +
    '        <li><a href="#/selectTemplate">Select Template</a></li>\n' +
    '        <li class="active" ng-hide="json.selectedTemplate === \'Not Selected\'"><a\n' +
    '            href="#/json/{{json.selectedTemplate}}">JSON</a></li>\n' +
    '        <li class="dropdown" ng-hide="json.selectedTemplate === \'Not Selected\'">\n' +
    '          <a href="" class="dropdown-toggle" data-toggle="dropdown">Data\n' +
    '            Structure <span class="caret"></span></a>\n' +
    '          <ul class="dropdown-menu" role="menu">\n' +
    '            <li><a href="#/datastructure/{{json.selectedTemplate}}">Project Data\n' +
    '              Structure</a></li>\n' +
    '            <!-- <li><a href="#/platformDataStructure/{{json.selectedTemplate}}">Platform\n' +
    '              Data Structure</a></li> -->\n' +
    '          </ul>\n' +
    '        </li>\n' +
    '        <li class="dropdown" ng-hide="json.selectedTemplate === \'Not Selected\'">\n' +
    '          <a href="" class="dropdown-toggle" data-toggle="dropdown">App\n' +
    '            Structure <span class="caret"></span></a>\n' +
    '          <ul class="dropdown-menu" role="menu">\n' +
    '            <li><a href="#/appstructure/{{json.selectedTemplate}}">Project App\n' +
    '              Structure</a></li>\n' +
    '            <!-- <li><a href="#/platformAppStructure/{{json.selectedTemplate}}">Platform\n' +
    '              App Structure</a></li> -->\n' +
    '          </ul>\n' +
    '        </li>\n' +
    '        <li class="dropdown" ng-hide="json.selectedTemplate === \'Not Selected\'">\n' +
    '          <a href="" class="dropdown-toggle" data-toggle="dropdown">Portfolio\n' +
    '            Structure <span class="caret"></span></a>\n' +
    '          <ul class="dropdown-menu" role="menu">\n' +
    '            <li><a href="#/portfoliostructure/{{json.selectedTemplate}}">Project\n' +
    '              Portfolio Structure</a></li>\n' +
    '            <!-- <li><a\n' +
    '                href="#/platformPortfolioStructure/{{json.selectedTemplate}}">Platform\n' +
    '              Portfolio Structure</a></li> -->\n' +
    '          </ul>\n' +
    '        </li>\n' +
    '        <li>\n' +
    '          <a href="#/revisions/{{json.selectedTemplate}}">Revisions</a>\n' +
    '        </li>\n' +
    '      </ul>\n' +
    '      <ul class="nav navbar-nav navbar-right">\n' +
    '      </ul>\n' +
    '    </div><!-- /.navbar-collapse -->\n' +
    '  </div><!-- /.container-fluid -->\n' +
    '</nav>\n' +
    '\n' +
    '<div class="select-template fadeIn"\n' +
    '     style="height:650px;background-color: #eee;margin-bottom: 60px;">\n' +
    '  <div class="container-fluid">\n' +
    '    <div class="col-sm-12">\n' +
    '      <h3>{{json.selectedTemplate}}\n' +
    '        <small>JSON</small>\n' +
    '        <small><a target="_blank" class="pull-right"\n' +
    '                  href="http://jsoneditoronline.org/">Open JSON Editor</a>\n' +
    '        </small>\n' +
    '      </h3>\n' +
    '\n' +
    '    </div>\n' +
    '    <div id="json">\n' +
    '      <div class="col-sm-4">\n' +
    '        <accordion close-others="false">\n' +
    '          <accordion-group is-open="status.isFirstOpen"\n' +
    '                           ng-init="status.isFirstOpen=true;">\n' +
    '            <accordion-heading>\n' +
    '              Data Structure <i class="pull-right glyphicon"\n' +
    '                                ng-class="{\'glyphicon-chevron-down\': status.isFirstOpen, \'glyphicon-chevron-left\': !status.isFirstOpen}"></i>\n' +
    '            </accordion-heading>\n' +
    '            <textarea ng-model="json.data.dataStructure"\n' +
    '                      class="json-container"></textarea>\n' +
    '          </accordion-group>\n' +
    '          <accordion-group is-open="status.isSecondOpen"\n' +
    '                           ng-if="json.platformExists()">\n' +
    '            <accordion-heading>\n' +
    '              Platform Data Structure <i class="pull-right glyphicon"\n' +
    '                                         ng-class="{\'glyphicon-chevron-down\': status.isSecondOpen, \'glyphicon-chevron-left\': !status.isSecondOpen}"></i>\n' +
    '            </accordion-heading>\n' +
    '            <textarea ng-model="json.data.platformDataStructure"\n' +
    '                      class="json-container"></textarea>\n' +
    '          </accordion-group>\n' +
    '        </accordion>\n' +
    '      </div>\n' +
    '\n' +
    '      <div class="col-sm-4">\n' +
    '        <accordion close-others="false">\n' +
    '          <accordion-group is-open="status.isThirdOpen"\n' +
    '                           ng-init="status.isThirdOpen=true;">\n' +
    '            <accordion-heading>\n' +
    '              App Structure <i class="pull-right glyphicon"\n' +
    '                               ng-class="{\'glyphicon-chevron-down\': status.isThirdOpen, \'glyphicon-chevron-left\': !status.isThirdOpen}"></i>\n' +
    '            </accordion-heading>\n' +
    '            <textarea ng-model="json.data.appStructure"\n' +
    '                      class="json-container"></textarea>\n' +
    '          </accordion-group>\n' +
    '          <!-- <div ng-if="!json.platformExists()">\n' +
    '            <button style="margin-left: 100px;margin-top: 10px;"\n' +
    '                    class="btn btn-primary" align="center"\n' +
    '                    ng-click="json.addPlatformStubs()">Add Platform\n' +
    '            </button>\n' +
    '            <p/>\n' +
    '          </div> -->\n' +
    '          <accordion-group is-open="status.isFourthOpen"\n' +
    '                           ng-if="json.platformExists()">\n' +
    '            <accordion-heading>\n' +
    '              Platform App Structure <i class="pull-right glyphicon"\n' +
    '                                        ng-class="{\'glyphicon-chevron-down\': status.isFourthOpen, \'glyphicon-chevron-left\': !status.isFourthOpen}"></i>\n' +
    '            </accordion-heading>\n' +
    '            <textarea ng-model="json.data.platformAppStructure"\n' +
    '                      class="json-container"></textarea>\n' +
    '          </accordion-group>\n' +
    '        </accordion>\n' +
    '\n' +
    '      </div>\n' +
    '\n' +
    '      <div class="col-sm-4">\n' +
    '        <accordion close-others="false">\n' +
    '          <accordion-group is-open="status.isFifthOpen"\n' +
    '                           ng-init="status.isFifthOpen=true;">\n' +
    '            <accordion-heading>\n' +
    '              Portfolio Structure <i class="pull-right glyphicon"\n' +
    '                                     ng-class="{\'glyphicon-chevron-down\': status.isFifthOpen, \'glyphicon-chevron-left\': !status.isFifthOpen}"></i>\n' +
    '            </accordion-heading>\n' +
    '            <textarea ng-model="json.data.portfolioStructure"\n' +
    '                      class="json-container"></textarea>\n' +
    '          </accordion-group>\n' +
    '          <accordion-group is-open="status.isSixthOpen"\n' +
    '                           ng-if="json.platformExists()">\n' +
    '            <accordion-heading>\n' +
    '              Platform Portfolio Structure <i class="pull-right glyphicon"\n' +
    '                                              ng-class="{\'glyphicon-chevron-down\': status.isSixthOpen, \'glyphicon-chevron-left\': !status.isSixthOpen}"></i>\n' +
    '            </accordion-heading>\n' +
    '            <textarea ng-model="json.data.platformPortfolioStructure"\n' +
    '                      class="json-container"></textarea>\n' +
    '          </accordion-group>\n' +
    '        </accordion>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '</div>\n' +
    '\n' +
    '\n' +
    '<div class="col-sm-12 text-center align-to-bottom">\n' +
    '  <button class="btn btn-link pull-left" ng-click="json.closeJSON()"><span\n' +
    '      class="glyphicon glyphicon-chevron-left"></span> Back to Select Template\n' +
    '  </button>\n' +
    '  <button style="width:60px;"\n' +
    '          class="btn btn-danger pull-right"\n' +
    '          data-toggle="modal"\n' +
    '          data-target="#commitMessageModal"\n' +
    '          ng-disabled="json.isUnchanged()"><i\n' +
    '      class="fa fa-spinner fa-spin fa-lg" ng-show="!json.saveComplete"></i><span\n' +
    '      ng-show="json.saveComplete">save</span></button>\n' +
    '\n' +
    '  <div class="col-sm-12 save-alert">\n' +
    '    <alert class="animated shake" ng-repeat="alert in json.alerts"\n' +
    '           type="{{alert.type}}" close="json.closeAlert($index)"><i\n' +
    '        class="fa fa-exclamation-triangle fa-lg"></i> <b>Saving failed.</b>\n' +
    '      {{alert.msg}}\n' +
    '    </alert>\n' +
    '  </div>\n' +
    '</div>\n' +
    '\n' +
    '<commit-message-modal\n' +
    '    save-function="json.saveWithCommit(commitMessage)"></commit-message-modal>\n' +
    '');
}]);
