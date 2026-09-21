var module;
try {
  module = angular.module('huashanApp');
} catch (e) {
  module = angular.module('huashanApp', []);
}

module.run(['$templateCache', function ($templateCache) {
  $templateCache.put('views/revisions.html',
    '<nav class="navbar navbar-inverse navbar-static-top" role="navigation" style="margin-bottom: 10px;">\n' +
    '    <div class="container-fluid">\n' +
    '        <!-- Brand and toggle get grouped for better mobile display -->\n' +
    '        <div class="navbar-header">\n' +
    '            <a class="navbar-brand">Huashan</a>\n' +
    '        </div>\n' +
    '\n' +
    '        <!-- Collect the nav links, forms, and other content for toggling -->\n' +
    '        <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">\n' +
    '            <ul class="nav navbar-nav">\n' +
    '                <li><a href="#">Home</a></li>\n' +
    '                <li><a ng-if="ctrl.isAdmin" href="#/admin">Admin</a></li>\n' +
    '                <li><a href="#/selectTemplate">Select Template</a></li>\n' +
    '                <li ng-hide="ctrl.selectedTemplate === \'Not Selected\'"><a\n' +
    '                        href="#/json/{{ctrl.selectedTemplate}}">JSON</a></li>\n' +
    '                <li class="dropdown" ng-hide="ctrl.selectedTemplate === \'Not Selected\'">\n' +
    '                    <a href="" class="dropdown-toggle" data-toggle="dropdown">Data\n' +
    '                        Structure <span class="caret"></span></a>\n' +
    '                    <ul class="dropdown-menu" role="menu">\n' +
    '                        <li><a href="#/datastructure/{{ctrl.selectedTemplate}}">Project\n' +
    '                                Data Structure</a></li>\n' +
    '                        <!-- <li>\n' +
    '                            <a href="#/platformDataStructure/{{ctrl.selectedTemplate}}">Platform\n' +
    '                                Data Structure</a>\n' +
    '                        </li> -->\n' +
    '                    </ul>\n' +
    '                </li>\n' +
    '                <li class="dropdown" ng-hide="ctrl.selectedTemplate === \'Not Selected\'">\n' +
    '                    <a href="" class="dropdown-toggle" data-toggle="dropdown">App\n' +
    '                        Structure <span class="caret"></span></a>\n' +
    '                    <ul class="dropdown-menu" role="menu">\n' +
    '                        <li><a href="#/appstructure/{{ctrl.selectedTemplate}}">Project\n' +
    '                                App Structure</a></li>\n' +
    '                        <!-- <li>\n' +
    '                            <a href="#/platformAppStructure/{{ctrl.selectedTemplate}}">Platform\n' +
    '                                App Structure</a>\n' +
    '                        </li> -->\n' +
    '                    </ul>\n' +
    '                </li>\n' +
    '                <li class="dropdown" ng-hide="ctrl.selectedTemplate === \'Not Selected\'">\n' +
    '                    <a href="" class="dropdown-toggle" data-toggle="dropdown">Portfolio\n' +
    '                        Structure <span class="caret"></span></a>\n' +
    '                    <ul class="dropdown-menu" role="menu">\n' +
    '                        <li>\n' +
    '                            <a href="#/portfoliostructure/{{ctrl.selectedTemplate}}">Project\n' +
    '                                Portfolio Structure</a>\n' +
    '                        </li>\n' +
    '                        <!-- <li><a href="#/platformPortfolioStructure/{{ctrl.selectedTemplate}}">Platform\n' +
    '                                Portfolio Structure</a></li> -->\n' +
    '                    </ul>\n' +
    '                </li>\n' +
    '                <li class="active"><a href="#/revisions/{{ctrl.selectedTemplate}}">Revisions</a>\n' +
    '                </li>\n' +
    '            </ul>\n' +
    '            <ul class="nav navbar-nav navbar-right">\n' +
    '                <li class="active"><a class="navbar-brand" href=""><b>{{ctrl.selectedTemplate}}</b></a>\n' +
    '                </li>\n' +
    '            </ul>\n' +
    '        </div>\n' +
    '        <!-- /.navbar-collapse -->\n' +
    '    </div>\n' +
    '    <!-- /.container-fluid -->\n' +
    '</nav>\n' +
    '\n' +
    '\n' +
    '<div class="select-template" class="animated fadeIn" style="height: 100%">\n' +
    '\n' +
    '    <!--Left side: list of templates to choose from-->\n' +
    '    <div id="choose-from" style="height: 100%">\n' +
    '        <div class="select-template-title">\n' +
    '            <h4><b>Revision History</b></h4>\n' +
    '        </div>\n' +
    '        <div class="panel panel-primary" style="height: calc(100% - 260px)">\n' +
    '            <div class="list-of-templates height-for-list" style="height: 100%">\n' +
    '                <!-- List group -->\n' +
    '                <div ng-model="ctrl.selectedRevision" class="list-group" id="revisons-list">\n' +
    '                    <a href="" class="list-group-item\n' +
    '                    cursor-move" ng-repeat="revision in ctrl.re.revisionLogs track by $index"\n' +
    '                        ng-click="ctrl.clickItem($event, revision.commitNum, revision)"\n' +
    '                        ng-class="{active: ctrl.selectedRevision == revision || ctrl.selectedRevisionCompare == revision}">\n' +
    '\n' +
    '                        <table>\n' +
    '                            <tr>\n' +
    '                                <td colspan="2" class="appStructList no-wrap">\n' +
    '                                    {{revision.commitMessage}}\n' +
    '                                </td>\n' +
    '                            </tr>\n' +
    '                            <tr>\n' +
    '                                <td class="appStructList no-wrap">\n' +
    '                                    {{revision.relativeTime}}\n' +
    '                                </td>\n' +
    '                                <td class="appStructList no-wrap">\n' +
    '                                    {{revision.committer}}\n' +
    '                                </td>\n' +
    '                            </tr>\n' +
    '                        </table>\n' +
    '                    </a>\n' +
    '                </div>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '        <div class="">\n' +
    '            <!-- View Trash Button -->\n' +
    '            <button class="btn btn-info pull-left" ng-show="ctrl.selectedRevisionCompare != null" tooltip="Compare"\n' +
    '                tooltip-trigger="mouseenter" tooltip-popup-delay="500"\n' +
    '                ng-click="ctrl.compareJsonFiles(ctrl.selectedRevision, ctrl.selectedRevisionCompare)">\n' +
    '                Compare\n' +
    '            </button>\n' +
    '\n' +
    '\n' +
    '        </div>\n' +
    '        <!--container of all popups-->\n' +
    '    </div>\n' +
    '\n' +
    '\n' +
    '    <!--Right Side: selected template and JSON-->\n' +
    '    <div id="selected-template">\n' +
    '        <div class="select-template-title" style="padding-left: 15px">\n' +
    '            <h4><b>Revision Details</b></h4>\n' +
    '        </div>\n' +
    '        <div class="panel panel-default panel-body" style="padding-left: 15px;  margin-left: 13px; margin-right: 13px">\n' +
    '            <div>\n' +
    '                <b>{{ctrl.selectedRevision.committer}}</b> saved changes on <b>{{ctrl.selectedRevision.timeStamp | customDateFormat}}</b>;\n' +
    '                &nbsp; Commit Message: {{ctrl.selectedRevision.commitMessage}};\n' +
    '                &nbsp; GUID: {{ctrl.selectedRevision.commitNum}}\n' +
    '\n' +
    '            </div>\n' +
    '        </div>\n' +
    '\n' +
    '        <div class="select-template-title" style="padding-left: 15px"\n' +
    '            ng-show="ctrl.jsonCompareResult != null && ctrl.selectedRevisionCompare != null">\n' +
    '            <h4><b>Compare Result</b></h4>\n' +
    '        </div>\n' +
    '\n' +
    '        <div class="panel panel-default panel-body" style="padding-left: 15px;  margin-left: 13px; margin-right: 13px"\n' +
    '            ng-repeat="js in ctrl.jsonCompareResult track by $index"\n' +
    '            ng-show="(js.values_changed || js.iterable_item_added || js.iterable_item_removed || js.dictionary_item_added || js.dictionary_item_removed) && ctrl.selectedRevisionCompare != null">\n' +
    '            <h4 style="color: #3383bb;">{{ctrl.getDisplayNameBy(js.fileName)}}</h4>\n' +
    '\n' +
    '\n' +
    '            <h5 ng-show="js.values_changed" style="padding-left: 20px">\n' +
    '                Values Changed:</h5>\n' +
    '            <ul ng-show="js.values_changed" class="json-container-revision" ng-repeat="item in js.values_changed"\n' +
    '                style="padding-left: 45px">\n' +
    '                <li>\n' +
    '                    <b>{{item.path}}</b>\n' +
    '                    <div ng-show="item.key">Key: <b>{{item.key}}</b></div>\n' +
    '                    <div style="padding-left: 25px">Current Version:</div>\n' +
    '                    <textarea class="revision-text">{{item.result.currentValue}}</textarea>\n' +
    '                    <div style="padding-left: 25px">Compared Version:</div>\n' +
    '                    <textarea class="revision-text">{{item.result.comparedValue}}</textarea>\n' +
    '                </li>\n' +
    '            </ul>\n' +
    '\n' +
    '            <h5 ng-show="js.iterable_item_added" style="padding-left: 20px">\n' +
    '                Iterable Item Added:</h5>\n' +
    '            <ul ng-show="js.iterable_item_added" class="json-container-revision"\n' +
    '                ng-repeat="item in js.iterable_item_added" style="padding-left: 45px">\n' +
    '                <li>\n' +
    '                    <b>{{item.path}}</b>\n' +
    '                    <div ng-show="item.key">Key: <b>{{item.key}}</b></div>\n' +
    '                    <div style="padding-left: 25px">Current Version:</div>\n' +
    '                    <textarea class="revision-text">{{item.result.currentValue}}</textarea>\n' +
    '                    <div style="padding-left: 25px">Compared Version:</div>\n' +
    '                    <textarea class="revision-text">{{item.result.comparedValue}}</textarea>\n' +
    '                </li>\n' +
    '            </ul>\n' +
    '\n' +
    '            <h5 ng-show="js.iterable_item_removed" style="padding-left: 20px">\n' +
    '                Iterable Item Removed:</h5>\n' +
    '            <ul ng-show="js.iterable_item_removed" class="json-container-revision"\n' +
    '                ng-repeat="item in js.iterable_item_removed" style="padding-left: 45px">\n' +
    '                <li>\n' +
    '                    <b>{{item.path}}</b>\n' +
    '                    <div ng-show="item.key">Key: <b>{{item.key}}</b></div>\n' +
    '                    <div style="padding-left: 25px">Current Version:</div>\n' +
    '                    <textarea class="revision-text">{{item.result.currentValue}}</textarea>\n' +
    '                    <div style="padding-left: 25px">Compared Version:</div>\n' +
    '                    <textarea class="revision-text">{{item.result.comparedValue}}</textarea>\n' +
    '                </li>\n' +
    '            </ul>\n' +
    '\n' +
    '            <h5 ng-show="js.dictionary_item_added" style="padding-left: 20px">\n' +
    '                Dictionary Item Added:</h5>\n' +
    '            <ul ng-show="js.dictionary_item_added" class="json-container-revision"\n' +
    '                ng-repeat="item in js.dictionary_item_added" style="padding-left: 45px">\n' +
    '                <li>\n' +
    '                    <b>{{item.path}}</b>\n' +
    '                    <div ng-show="item.key">Key: <b>{{item.key}}</b></div>\n' +
    '                    <div style="padding-left: 25px">Current Version:</div>\n' +
    '                    <textarea class="revision-text">{{item.result.currentValue}}</textarea>\n' +
    '                    <div style="padding-left: 25px">Compared Version:</div>\n' +
    '                    <textarea class="revision-text">{{item.result.comparedValue}}</textarea>\n' +
    '                </li>\n' +
    '            </ul>\n' +
    '\n' +
    '            <h5 ng-show="js.dictionary_item_removed" style="padding-left: 20px">\n' +
    '                Dictionary Item Removed:</h5>\n' +
    '            <ul ng-show="js.dictionary_item_removed" class="json-container-revision"\n' +
    '                ng-repeat="item in js.dictionary_item_removed" style="padding-left: 45px">\n' +
    '                <li>\n' +
    '                    <b>{{item.path}}</b>\n' +
    '                    <div ng-show="item.key">Key: <b>{{item.key}}</b></div>\n' +
    '                    <div style="padding-left: 25px">Current Version:</div>\n' +
    '                    <textarea class="revision-text">{{item.result.currentValue}}</textarea>\n' +
    '                    <div style="padding-left: 25px">Compared Version:</div>\n' +
    '                    <textarea class="revision-text">{{item.result.comparedValue}}</textarea>\n' +
    '                </li>\n' +
    '            </ul>\n' +
    '        </div>\n' +
    '\n' +
    '        <div id="revision-json">\n' +
    '            <div class="col-sm-4">\n' +
    '                <accordion close-others="false">\n' +
    '                    <accordion-group is-open="status.isFirstOpen" ng-init="status.isFirstOpen=true;">\n' +
    '                        <accordion-heading>\n' +
    '                            Data Structure <i class="pull-right glyphicon"\n' +
    '                                ng-class="{\'glyphicon-chevron-down\': status.isFirstOpen, \'glyphicon-chevron-left\': !status.isFirstOpen}"></i>\n' +
    '                        </accordion-heading>\n' +
    '                        <textarea ng-model="ctrl.jsonData.dataStructure" class="json-container"></textarea>\n' +
    '                    </accordion-group>\n' +
    '                    <accordion-group is-open="status.isSecondOpen" ng-if="ctrl.platformExists()">\n' +
    '                        <accordion-heading>\n' +
    '                            Platform Data Structure <i class="pull-right glyphicon"\n' +
    '                                ng-class="{\'glyphicon-chevron-down\': status.isSecondOpen, \'glyphicon-chevron-left\': !status.isSecondOpen}"></i>\n' +
    '                        </accordion-heading>\n' +
    '                        <textarea ng-model="ctrl.jsonData.platformDataStructure" class="json-container"></textarea>\n' +
    '                    </accordion-group>\n' +
    '                </accordion>\n' +
    '            </div>\n' +
    '\n' +
    '            <div class="col-sm-4">\n' +
    '                <accordion close-others="false">\n' +
    '                    <accordion-group is-open="status.isThirdOpen" ng-init="status.isThirdOpen=true;">\n' +
    '                        <accordion-heading>\n' +
    '                            App Structure <i class="pull-right glyphicon"\n' +
    '                                ng-class="{\'glyphicon-chevron-down\': status.isThirdOpen, \'glyphicon-chevron-left\': !status.isThirdOpen}"></i>\n' +
    '                        </accordion-heading>\n' +
    '                        <textarea ng-model="ctrl.jsonData.appStructure" class="json-container"></textarea>\n' +
    '                    </accordion-group>\n' +
    '\n' +
    '                    <accordion-group is-open="status.isFourthOpen" ng-if="ctrl.platformExists()">\n' +
    '                        <accordion-heading>\n' +
    '                            Platform App Structure <i class="pull-right glyphicon"\n' +
    '                                ng-class="{\'glyphicon-chevron-down\': status.isFourthOpen, \'glyphicon-chevron-left\': !status.isFourthOpen}"></i>\n' +
    '                        </accordion-heading>\n' +
    '                        <textarea ng-model="ctrl.jsonData.platformAppStructure" class="json-container"></textarea>\n' +
    '                    </accordion-group>\n' +
    '                </accordion>\n' +
    '\n' +
    '            </div>\n' +
    '\n' +
    '            <div class="col-sm-4">\n' +
    '                <accordion close-others="false">\n' +
    '                    <accordion-group is-open="status.isFifthOpen" ng-init="status.isFifthOpen=true;">\n' +
    '                        <accordion-heading>\n' +
    '                            Portfolio Structure <i class="pull-right glyphicon"\n' +
    '                                ng-class="{\'glyphicon-chevron-down\': status.isFifthOpen, \'glyphicon-chevron-left\': !status.isFifthOpen}"></i>\n' +
    '                        </accordion-heading>\n' +
    '                        <textarea ng-model="ctrl.jsonData.portfolioStructure" class="json-container"></textarea>\n' +
    '                    </accordion-group>\n' +
    '                    <accordion-group is-open="status.isSixthOpen" ng-if="ctrl.platformExists()">\n' +
    '                        <accordion-heading>\n' +
    '                            Platform Portfolio Structure <i class="pull-right glyphicon"\n' +
    '                                ng-class="{\'glyphicon-chevron-down\': status.isSixthOpen, \'glyphicon-chevron-left\': !status.isSixthOpen}"></i>\n' +
    '                        </accordion-heading>\n' +
    '                        <textarea ng-model="ctrl.jsonData.platformPortfolioStructure" class="json-container"></textarea>\n' +
    '                    </accordion-group>\n' +
    '                </accordion>\n' +
    '            </div>\n' +
    '        </div>\n' +
    '    </div>\n' +
    '    <!--Right side-->\n' +
    '\n' +
    '</div>\n' +
    '<!--Right side-->');
}]);
