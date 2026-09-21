var module;
try {
  module = angular.module('huashanApp');
} catch (e) {
  module = angular.module('huashanApp', []);
}

module.run(['$templateCache', function ($templateCache) {
  $templateCache.put('views/datastructure.html',
    '<nav class="navbar navbar-inverse navbar-static-top" role="navigation"\n' +
    '     style="margin-bottom: 10px;">\n' +
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
    '        <li><a ng-if="data.isAdmin" href="#/admin">Admin</a></li>\n' +
    '        <li><a href="#/selectTemplate">Select Template</a></li>\n' +
    '        <li ng-hide="data.selectedTemplate === \'Not Selected\'"><a\n' +
    '            href="#/json/{{data.selectedTemplate}}">JSON</a></li>\n' +
    '        <li class="dropdown active"\n' +
    '            ng-hide="data.selectedTemplate === \'Not Selected\'">\n' +
    '          <a href="" class="dropdown-toggle" data-toggle="dropdown">Data\n' +
    '            Structure <span class="caret"></span></a>\n' +
    '          <ul class="dropdown-menu" role="menu">\n' +
    '            <li><a href="#/datastructure/{{data.selectedTemplate}}">Project\n' +
    '              Data Structure</a></li>\n' +
    '            <!-- <li>\n' +
    '              <a href="#/platformDataStructure/{{data.selectedTemplate}}">Platform\n' +
    '                Data Structure</a></li> -->\n' +
    '          </ul>\n' +
    '        </li>\n' +
    '        <li class="dropdown"\n' +
    '            ng-hide="data.selectedTemplate === \'Not Selected\'">\n' +
    '          <a href="" class="dropdown-toggle" data-toggle="dropdown">App\n' +
    '            Structure <span class="caret"></span></a>\n' +
    '          <ul class="dropdown-menu" role="menu">\n' +
    '            <li><a href="#/appstructure/{{data.selectedTemplate}}">Project\n' +
    '              App Structure</a></li>\n' +
    '            <!-- <li>\n' +
    '              <a href="#/platformAppStructure/{{data.selectedTemplate}}">Platform\n' +
    '                App Structure</a></li> -->\n' +
    '          </ul>\n' +
    '        </li>\n' +
    '        <li class="dropdown"\n' +
    '            ng-hide="data.selectedTemplate === \'Not Selected\'">\n' +
    '          <a href="" class="dropdown-toggle" data-toggle="dropdown">Portfolio\n' +
    '            Structure <span class="caret"></span></a>\n' +
    '          <ul class="dropdown-menu" role="menu">\n' +
    '            <li>\n' +
    '              <a href="#/portfoliostructure/{{data.selectedTemplate}}">Project\n' +
    '                Portfolio Structure</a></li>\n' +
    '            <!-- <li>\n' +
    '              <a href="#/platformPortfolioStructure/{{data.selectedTemplate}}">Platform\n' +
    '                Portfolio Structure</a></li> -->\n' +
    '          </ul>\n' +
    '        </li>\n' +
    '        <li>\n' +
    '          <a href="#/revisions/{{data.selectedTemplate}}">Revisions</a>\n' +
    '        </li>\n' +
    '      </ul>\n' +
    '      <ul class="nav navbar-nav navbar-right">\n' +
    '        <li class="active"><a\n' +
    '            href=""><b>{{data.selectedTemplate}}</b></a></li>\n' +
    '      </ul>\n' +
    '    </div><!-- /.navbar-collapse -->\n' +
    '  </div><!-- /.container-fluid -->\n' +
    '</nav>\n' +
    '\n' +
    '<div id="loadingSpinner" ng-show="data.showLoading"></div>\n' +
    '\n' +
    '<div class="select-template no-padding" ng-hide="data.showLoading">\n' +
    '  <!--Input/Output Tabs-->\n' +
    '  <tabset class="animated fadeIn">\n' +
    '    <tab heading="Input">\n' +
    '      <div class="select-input">\n' +
    '        <!--Left side: list of templates to choose from-->\n' +
    '        <div class="choose-from">\n' +
    '          <div class="select-template-title">\n' +
    '            <h4 ng-show="!data.isPlatform">Data Structure</h4>\n' +
    '            <h4 ng-show="data.isPlatform">Platform Data\n' +
    '              Structure</h4>\n' +
    '          </div>\n' +
    '          <div class="select-template-title">\n' +
    '            <input type="text" class="form-control"\n' +
    '                   placeholder="Search"\n' +
    '                   ng-model="searchInput.CellLink">\n' +
    '          </div>\n' +
    '          <div class="panel panel-primary">\n' +
    '\n' +
    '            <!-- List group -->\n' +
    '            <div class="list-of-templates" id="input-list">\n' +
    '              <ul class="list-group">\n' +
    '                <li ng-show="!data.showLoading"\n' +
    '                    class="list-group-item"\n' +
    '                    ng-repeat="input in data.excludedComponents.Inputs|filter:searchInput track by $index"\n' +
    '                    tooltip="{{input.CellLink}}"\n' +
    '                    tooltip-trigger="mouseenter"\n' +
    '                    tooltip-popup-delay="500">\n' +
    '                  <div class="no-wrap">\n' +
    '                    <a href="" class="text-success"\n' +
    '                       ng-click="data.includeInput(input)">\n' +
    '                      <i class="fa fa-plus-square"></i>\n' +
    '                    </a>\n' +
    '                    {{input.CellLink}}\n' +
    '                  </div>\n' +
    '                </li>\n' +
    '              </ul>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '        </div><!--Left side-->\n' +
    '\n' +
    '        <!--Right Side: selected template and JSON-->\n' +
    '        <div class="selected">\n' +
    '          <div class="select-template-title">\n' +
    '            <h4>Inputs</h4>\n' +
    '          </div>\n' +
    '          <div class="selected-inputs" id="included-inputs">\n' +
    '            <table id="inputTable" class="table table-striped"\n' +
    '                   fixed-header\n' +
    '                   style="min-width:1100px; max-width:1100px;">\n' +
    '              <thead>\n' +
    '              <tr>\n' +
    '                <th style="border:none;min-width: 20px;max-width: 20px;"></th>\n' +
    '                <th style="min-width: 150px;max-width: 150px;">\n' +
    '                  Excel Range Name\n' +
    '                </th>\n' +
    '                <th style="min-width: 100px;max-width: 100px;">\n' +
    '                  Display\n' +
    '                </th>\n' +
    '                <th style="min-width: 70px;max-width: 70px;">\n' +
    '                  Units\n' +
    '                </th>\n' +
    '                <th style="min-width: 260px;max-width: 260px;">\n' +
    '                  Description\n' +
    '                </th>\n' +
    '                <th style="min-width: 100px;max-width: 100px;">\n' +
    '                  Default\n' +
    '                </th>\n' +
    '                <th style="min-width: 150px;max-width: 150px;">\n' +
    '                  Type\n' +
    '                </th>\n' +
    '                <th style="min-width: 100px;max-width: 100px;">\n' +
    '                  Kind\n' +
    '                </th>\n' +
    '                <th style="min-width: 70px;max-width: 70px;">\n' +
    '                  Inherited\n' +
    '                </th>\n' +
    '                <th style="min-width: 70px;max-width: 70px;">\n' +
    '                  Edit\n' +
    '                </th>\n' +
    '              </tr>\n' +
    '              </thead>\n' +
    '\n' +
    '              <tbody>\n' +
    '              <tr ng-repeat="input in data.includedComponents.Inputs"\n' +
    '                  ng-init="show=true"\n' +
    '                  ng-show="input.Type != \'TABLE\'">\n' +
    '                <td style="min-width: 20px;max-width: 20px;border:none;background-color: white;">\n' +
    '                  <div>\n' +
    '                    <a href="" class="text-danger"\n' +
    '                       ng-click="data.excludeInput(input)">\n' +
    '                      <i class="fa fa-minus-square"></i></a>\n' +
    '                  </div>\n' +
    '                </td>\n' +
    '                <td style="min-width: 150px;max-width: 150px;">\n' +
    '                  <div class="no-wrap"\n' +
    '                       tooltip="{{input.CellLink}}"\n' +
    '                       tooltip-trigger="mouseenter"\n' +
    '                       tooltip-popup-delay="500">\n' +
    '                    {{input.CellLink}}\n' +
    '                  </div>\n' +
    '                  <input type="text" ng-model="input.Key"\n' +
    '                         ng-show="!show || !show2"\n' +
    '                         style="width:100%;"\n' +
    '                         class="form form-control">\n' +
    '                </td>\n' +
    '                <td style="min-width: 100px;max-width: 100px;">\n' +
    '                  <p ng-show="show && show2">\n' +
    '                    {{input.Display}}</p>\n' +
    '                  <input type="text" ng-model="input.Display"\n' +
    '                         ng-show="!show || !show2"\n' +
    '                         style="width:100%;"\n' +
    '                         class="form form-control">\n' +
    '                </td>\n' +
    '                <td style="min-width: 70px;max-width: 70px;">\n' +
    '                  <p ng-show="show && show2">\n' +
    '                    {{input.Units}}</p>\n' +
    '                  <input type="text" ng-model="input.Units"\n' +
    '                         ng-show="!show || !show2"\n' +
    '                         style="width:100%;"\n' +
    '                         class="form form-control">\n' +
    '                </td>\n' +
    '                <td style="min-width: 260px;max-width: 260px;">\n' +
    '                  <p ng-show="show && show2">\n' +
    '                    {{input.Description}}</p>\n' +
    '                  <textarea ng-show="!show || !show2"\n' +
    '                            ng-model="input.Description"\n' +
    '                            class="form form-control"\n' +
    '                            style="height:100px;"></textarea>\n' +
    '                </td>\n' +
    '\n' +
    '                <td style="min-width: 100px;max-width: 100px;">\n' +
    '                  <div ng-show="show && show2" ng-switch\n' +
    '                       on="input.Type" class="no-wrap">\n' +
    '                    <p ng-switch-when="SCALAR">\n' +
    '                      {{input.Val}}</p>\n' +
    '                    <p ng-switch-when="DISTRIBUTION">\n' +
    '                      {{input.Val[0]}}<br/>{{input.Val[1]}}<br/>{{input.Val[2]}}\n' +
    '                    </p>\n' +
    '                    <p ng-switch-when="TABLE">\n' +
    '                      {{input.Key}}</p>\n' +
    '                    <p ng-switch-when="DATE">\n' +
    '                      {{input.Val}}\n' +
    '                    </p>\n' +
    '                  </div>\n' +
    '                  <div ng-show="!show || !show2" ng-switch\n' +
    '                       on="input.Type">\n' +
    '                    <input type="text" ng-model="input.Val"\n' +
    '                           ng-switch-when="SCALAR"\n' +
    '                           style="width:100%;"\n' +
    '                           class="form form-control">\n' +
    '                    <div ng-switch-when="DISTRIBUTION">\n' +
    '                      <input type="text"\n' +
    '                             ng-model="input.Val[0]"\n' +
    '                             style="width:100%;"\n' +
    '                             class="form form-control"><br/>\n' +
    '                      <input type="text"\n' +
    '                             ng-model="input.Val[1]"\n' +
    '                             style="width:100%;"\n' +
    '                             class="form form-control"><br/>\n' +
    '                      <input type="text"\n' +
    '                             ng-model="input.Val[2]"\n' +
    '                             style="width:100%;"\n' +
    '                             class="form form-control"><br/>\n' +
    '                    </div>\n' +
    '                    <div ng-switch-when="TABLE">\n' +
    '                      {{input.Key}}\n' +
    '                    </div>\n' +
    '\n' +
    '                    <div ng-switch-when="DATE">\n' +
    '                      <div>Month</div>\n' +
    '                      <select class="form-control"\n' +
    '                              style="width: 80px;"\n' +
    '                              ng-init="monthTem = data.initDataEdit(input.Val).month"\n' +
    '                              ng-model="monthTem"\n' +
    '                              ng-change="input.Val = data.updateFormat(input.Val, monthTem, undefined)">\n' +
    '                        <option value="Jan">Jan</option>\n' +
    '                        <option value="Feb">Feb</option>\n' +
    '                        <option value="Mar">Mar</option>\n' +
    '                        <option value="Apr">Apr</option>\n' +
    '                        <option value="May">May</option>\n' +
    '                        <option value="Jun">Jun</option>\n' +
    '                        <option value="Jul">Jul</option>\n' +
    '                        <option value="Aug">Aug</option>\n' +
    '                        <option value="Sep">Sep</option>\n' +
    '                        <option value="Oct">Oct</option>\n' +
    '                        <option value="Nov">Nov</option>\n' +
    '                        <option value="Dec">Dec</option>\n' +
    '                      </select>\n' +
    '                      <div>Year</div>\n' +
    '                      <input\n' +
    '                          ng-init="yearTem = data.initDataEdit(input.Val).year"\n' +
    '                          ng-model="yearTem"\n' +
    '                          ng-change="input.Val = data.updateFormat(input.Val, undefined, yearTem)"\n' +
    '                          type="text"\n' +
    '                          class="form-control"\n' +
    '                          style="width: 80px;">\n' +
    '                    </div>\n' +
    '                    <div ng-switch-default></div>\n' +
    '                  </div>\n' +
    '                </td>\n' +
    '\n' +
    '                <td style="min-width: 150px;max-width: 150px;">\n' +
    '                  <p ng-show="show && show2 || input.Table !== undefined">\n' +
    '                    {{input.Type}}</p>\n' +
    '                  <select\n' +
    '                      ng-show="(!show && input.Table === undefined) || (!show2 && input.Table === undefined)"\n' +
    '                      class="btn btn-default form-control"\n' +
    '                      ng-model="input.Type"\n' +
    '                      ng-change="data.changeType(input);">\n' +
    '                    <option value="DISTRIBUTION">\n' +
    '                      DISTRIBUTION\n' +
    '                    </option>\n' +
    '                    <option value="SCALAR">SCALAR</option>\n' +
    '                    <option value="TABLE">TABLE</option>\n' +
    '                    <option value="DATE">DATE</option>\n' +
    '                  </select>\n' +
    '                </td>\n' +
    '                <td style="min-width: 100px;max-width: 100px;">\n' +
    '                  <p ng-show="show && show2">\n' +
    '                    {{input.Constraint}}</p>\n' +
    '                  <select ng-show="!show || !show2"\n' +
    '                          class="btn btn-default form-control"\n' +
    '                          ng-model="input.Constraint">\n' +
    '                    <option value="double">double</option>\n' +
    '                    <option value="string">string</option>\n' +
    '                    <option value="integer">integer</option>\n' +
    '                    <option value="date">date</option>\n' +
    '                    <option value="year">year</option>\n' +
    '                  </select>\n' +
    '                </td>\n' +
    '                <td align="center"\n' +
    '                    style="min-width: 70px;max-width: 70px;">\n' +
    '                  <input type="checkbox"\n' +
    '                         ng-model="input.Inherited"\n' +
    '                         ng-disabled="show && show2">\n' +
    '                </td>\n' +
    '                <td style="min-width: 70px;max-width: 70px;">\n' +
    '                  <button type="button"\n' +
    '                          class="btn btn-success btn-sm"\n' +
    '                          ng-click="show=false"\n' +
    '                          ng-show="show && show2">\n' +
    '                    <span class="glyphicon glyphicon-pencil"></span>\n' +
    '                  </button>\n' +
    '                  <button type="button" class="btn btn-danger"\n' +
    '                          ng-click="show=true"\n' +
    '                          ng-show="!show || !show2">\n' +
    '                    <span class="glyphicon glyphicon-ok"></span>\n' +
    '                  </button>\n' +
    '                </td>\n' +
    '              </tr>\n' +
    '            </table>\n' +
    '          </div>\n' +
    '\n' +
    '\n' +
    '        </div><!--Right side-->\n' +
    '      </div>\n' +
    '    </tab>\n' +
    '    <tab heading="Table Inputs">\n' +
    '      <div class="select-input">\n' +
    '        <!--Left side: list of templates to choose from-->\n' +
    '        <div class="choose-from">\n' +
    '          <div class="select-template-title">\n' +
    '            <h4>Choose From</h4>\n' +
    '          </div>\n' +
    '          <div class="select-template-title">\n' +
    '            <input type="text" class="form-control"\n' +
    '                   placeholder="Search"\n' +
    '                   ng-model="searchInput.CellLink">\n' +
    '          </div>\n' +
    '          <div class="panel panel-primary">\n' +
    '            <!-- List group -->\n' +
    '            <div class="list-of-templates"\n' +
    '                 id="potential-tableInput-list">\n' +
    '\n' +
    '              <a href=""\n' +
    '                 class="list-group-item"\n' +
    '                 ng-repeat="ptInputs in data.excludedPotentialTableInputs|filter:searchInput track by $index"\n' +
    '                 ng-click="data.selectedChooseFrom(ptInputs)"\n' +
    '                 ng-class="{active: data.selectedCelllink == ptInputs.CellLink}"\n' +
    '                 tooltip="{{ptInputs.CellLink}}"\n' +
    '                 tooltip-trigger="mouseenter"\n' +
    '                 tooltip-popup-delay="500">\n' +
    '                <table>\n' +
    '                  <tr>\n' +
    '                    <td class="appStructList">\n' +
    '                      <div class="no-wrap">\n' +
    '                        <a href="" class="text-success"\n' +
    '                           ng-click="data.includePotentialTableInput(ptInputs)">\n' +
    '                          <i class="fa fa-plus-square"></i>\n' +
    '                        </a>\n' +
    '\n' +
    '                        {{ptInputs.CellLink}}\n' +
    '                      </div>\n' +
    '                    </td>\n' +
    '                  </tr>\n' +
    '                </table>\n' +
    '              </a>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '        </div><!--Left side-->\n' +
    '\n' +
    '        <!--Right Side: selected template and JSON-->\n' +
    '\n' +
    '        <div class="selected">\n' +
    '          <div class="select-template-title">\n' +
    '            <h4>Table Inputs</h4>\n' +
    '          </div>\n' +
    '          <div class="col-sm-12">\n' +
    '            <div class="col-sm-6">\n' +
    '\n' +
    '              <div style="border:1px;\n' +
    '                                        height:400px;\n' +
    '                                        overflow-y:scroll;\n' +
    '                                        overflow-x:scroll;\n' +
    '                                        margin-top: 30px;\n' +
    '                                        margin-left: 10px">\n' +
    '                <!-- REST CalcEngine (WI-3): inline HTML table rendered directly in a div\n' +
    '                     (body-inner only, via tablePreviewHtml filter) — no iframe -->\n' +
    '                <div ng-if="data.htmlPreview" ng-bind-html="data.htmlPreview | tablePreviewHtml"\n' +
    '                     style="width:100%; height:100%;"></div>\n' +
    '                <!-- Legacy SOAP: server-generated PNG preview -->\n' +
    '                <img ng-if="!data.htmlPreview" src="{{data.imageURL}}">\n' +
    '              </div>\n' +
    '\n' +
    '            </div>\n' +
    '            <div class="col-sm-6">\n' +
    '              <div class="selected-inputs" id="potential-included-inputs">\n' +
    '                <div class="table-left">\n' +
    '                  <table id="potentialinputTable"\n' +
    '                         class="table table-striped"\n' +
    '                  >\n' +
    '                    <thead>\n' +
    '                    <tr>\n' +
    '                      <th width="5%"></th>\n' +
    '                      <th width="35%">\n' +
    '                        Excel Range Name\n' +
    '                      </th>\n' +
    '                      <th>\n' +
    '                        Display\n' +
    '                      </th>\n' +
    '                      <th>\n' +
    '                        Inherited\n' +
    '                      </th>\n' +
    '                      <th>\n' +
    '                        Edit\n' +
    '                      </th>\n' +
    '                    </tr>\n' +
    '                    </thead>\n' +
    '\n' +
    '                    <tbody>\n' +
    '                    <tr ng-repeat="ptInput in data.includedComponents.Inputs track by $index"\n' +
    '                        ng-init="show=true; showImage=true;"\n' +
    '                        ng-click="data.select(ptInput)"\n' +
    '                        ng-class="{\'selectPTI\': data.selectedCelllink == ptInput.CellLink}"\n' +
    '                        ng-show="ptInput.Type === \'TABLE\'">\n' +
    '                      <td>\n' +
    '                        <div>\n' +
    '                          <a href="" class="text-danger"\n' +
    '                             ng-click="data.excludePotentialTableInput(ptInput)">\n' +
    '                            <i class="fa fa-minus-square"></i></a>\n' +
    '                        </div>\n' +
    '                      </td>\n' +
    '                      <td>\n' +
    '                        <div class="no-wrap"\n' +
    '                             tooltip="{{ptInput.CellLink}}"\n' +
    '                             tooltip-trigger="mouseenter"\n' +
    '                             tooltip-popup-delay="500">\n' +
    '                          {{ptInput.CellLink}}\n' +
    '                        </div>\n' +
    '                        <input type="text"\n' +
    '                               ng-model="ptInput.Key"\n' +
    '                               ng-show="!show || !show2"\n' +
    '                               style="width:100%;"\n' +
    '                               class="form form-control">\n' +
    '                      </td>\n' +
    '                      <td>\n' +
    '                        <p ng-show="show && show2">\n' +
    '                          {{ptInput.Display}}</p>\n' +
    '                        <input type="text"\n' +
    '                               ng-model="ptInput.Display"\n' +
    '                               ng-show="!show || !show2"\n' +
    '                               style="width:100%;"\n' +
    '                               class="form form-control">\n' +
    '                      </td>\n' +
    '\n' +
    '                      <td align="center"\n' +
    '                      >\n' +
    '                        <input type="checkbox"\n' +
    '                               ng-model="ptInput.Inherited"\n' +
    '                               ng-disabled="show && show2">\n' +
    '                      </td>\n' +
    '                      <td>\n' +
    '                        <button type="button"\n' +
    '                                class="btn btn-success btn-sm"\n' +
    '                                ng-click="show=false"\n' +
    '                                ng-show="show && show2">\n' +
    '                          <span class="glyphicon glyphicon-pencil"></span>\n' +
    '                        </button>\n' +
    '                        <button type="button"\n' +
    '                                class="btn btn-danger"\n' +
    '                                ng-click="show=true"\n' +
    '                                ng-show="!show || !show2">\n' +
    '                          <span class="glyphicon glyphicon-ok"></span>\n' +
    '                        </button>\n' +
    '                      </td>\n' +
    '                  </table>\n' +
    '                </div>\n' +
    '                <!--<div class="right-image">-->\n' +
    '                <!--<div style="border:1px;-->\n' +
    '                <!--width:440px;-->\n' +
    '                <!--height:400px;-->\n' +
    '                <!--overflow-y:scroll;-->\n' +
    '                <!--overflow-x:scroll;"><img-->\n' +
    '                <!--src="{{data.imageURL}}">-->\n' +
    '                <!--</div>-->\n' +
    '                <!--</div>-->\n' +
    '              </div>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '        </div><!--Right side-->\n' +
    '      </div>\n' +
    '    </tab>\n' +
    '    <tab heading="Output">\n' +
    '      <div class="select-input">\n' +
    '        <!--Left side: list of templates to choose from-->\n' +
    '        <div class="choose-from">\n' +
    '          <div class="select-template-title">\n' +
    '            <h4>Choose From</h4></div>\n' +
    '          <div class="select-template-title">\n' +
    '            <input type="text" class="form-control"\n' +
    '                   placeholder="Search" ng-model="searchOutput">\n' +
    '          </div>\n' +
    '          <div class="panel panel-primary">\n' +
    '            <!-- List group -->\n' +
    '            <div class="list-of-templates">\n' +
    '              <ul class="list-group">\n' +
    '                <li class="list-group-item"\n' +
    '                    ng-repeat="output in data.excludedComponents.Outputs|filter:searchOutput track by $index"\n' +
    '                    tooltip="{{output.CellLink}}"\n' +
    '                    tooltip-trigger="mouseenter"\n' +
    '                    tooltip-popup-delay="500">\n' +
    '                  <div class="no-wrap">\n' +
    '                    <a href="" class="text-success"\n' +
    '                       ng-click="data.includeOutput(output)">\n' +
    '                      <i class="fa fa-plus-square"></i>\n' +
    '                    </a>\n' +
    '                    {{output.CellLink}}\n' +
    '                  </div>\n' +
    '                </li>\n' +
    '              </ul>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '        </div><!--Left side-->\n' +
    '\n' +
    '        <!--Right Side: selected template and JSON-->\n' +
    '        <div class="selected">\n' +
    '          <div class="select-template-title">\n' +
    '            <h4>Outputs</h4>\n' +
    '          </div>\n' +
    '          <div class="selected-inputs" id="included-outputs">\n' +
    '            <table id="outputTable" class="table table-striped"\n' +
    '                   fixed-header\n' +
    '                   style="min-width:1100px; max-width:1100px;">\n' +
    '              <thead>\n' +
    '              <tr>\n' +
    '                <th style="border:none;min-width: 20px;max-width: 20px;"></th>\n' +
    '                <th style="min-width: 400px;max-width: 400px;">\n' +
    '                  Excel Range Name\n' +
    '                </th>\n' +
    '                <th style="min-width: 300px;max-width: 300px;">\n' +
    '                  Display\n' +
    '                </th>\n' +
    '                <th style="min-width: 150px;max-width: 150px;">\n' +
    '                  Units\n' +
    '                </th>\n' +
    '                <th style="min-width: 150px;max-width: 150px;">\n' +
    '                  Postprocessing\n' +
    '                </th>\n' +
    '                <th style="min-width: 70px;max-width: 70px;">\n' +
    '                  Edit\n' +
    '                </th>\n' +
    '\n' +
    '              </tr>\n' +
    '              </thead>\n' +
    '              <tbody>\n' +
    '\n' +
    '              <tr ng-repeat="output in data.includedComponents.Outputs"\n' +
    '                  ng-init="show=true">\n' +
    '                <td style="border:none;background-color: white;min-width: 20px;max-width: 20px;">\n' +
    '                  <div>\n' +
    '                    <a href="" class="text-danger"\n' +
    '                       ng-click="data.excludeOutput(output)">\n' +
    '                      <i class="fa fa-minus-square"></i>\n' +
    '                    </a>\n' +
    '                  </div>\n' +
    '                </td>\n' +
    '                <td style="min-width: 400px;max-width: 400px;">\n' +
    '                  <div class="no-wrap"\n' +
    '                       tooltip="{{output.CellLink}}"\n' +
    '                       tooltip-trigger="mouseenter"\n' +
    '                       tooltip-popup-delay="500">\n' +
    '                    {{output.CellLink}}\n' +
    '                  </div>\n' +
    '                  <input type="text" ng-show="!show || !show2"\n' +
    '                         ng-model="output.Key"\n' +
    '                         style="width:100%;"\n' +
    '                         class="form form-control">\n' +
    '                </td>\n' +
    '                <td style="min-width: 300px;max-width: 300px;">\n' +
    '                  <p ng-show="show && show2">\n' +
    '                    {{output.Display}}</p>\n' +
    '                  <input type="text" ng-show="!show || !show2"\n' +
    '                         ng-model="output.Display"\n' +
    '                         style="width:100%;"\n' +
    '                         class="form form-control">\n' +
    '                </td>\n' +
    '                <td style="min-width: 150px;max-width: 150px;">\n' +
    '                  <p ng-show="show && show2">\n' +
    '                    {{output.Units}}</p>\n' +
    '                  <input type="text" ng-show="!show || !show2"\n' +
    '                         ng-model="output.Units"\n' +
    '                         style="width:100%;"\n' +
    '                         class="form form-control">\n' +
    '                </td>\n' +
    '                <td align="center"\n' +
    '                    style="min-width: 150px;max-width: 150px;">\n' +
    '                  <input type="checkbox"\n' +
    '                         ng-model="output.UsePostProcessingOutputs"\n' +
    '                         ng-disabled="show && show2"></td>\n' +
    '                <td style="min-width: 70px;max-width: 70px;">\n' +
    '                  <button type="button"\n' +
    '                          class="btn btn-success"\n' +
    '                          ng-click="show=false"\n' +
    '                          ng-show="show">\n' +
    '                    <span class="glyphicon glyphicon-pencil"></span>\n' +
    '                  </button>\n' +
    '                  <button type="button" class="btn btn-danger"\n' +
    '                          ng-click="show=true"\n' +
    '                          ng-show="!show">\n' +
    '                    <span class="glyphicon glyphicon-ok"></span>\n' +
    '                  </button>\n' +
    '                </td>\n' +
    '              </tr>\n' +
    '\n' +
    '              </tbody>\n' +
    '            </table>\n' +
    '          </div>\n' +
    '        </div><!--Right side-->\n' +
    '      </div>\n' +
    '    </tab>\n' +
    '\n' +
    '  </tabset><!--Input/Output Tabs-->\n' +
    '</div>\n' +
    '\n' +
    '<div class="col-sm-12 text-center align-to-bottom">\n' +
    '  <a href="#/selectTemplate" class="btn btn-primary pull-left" role="button">\n' +
    '    <span class="glyphicon glyphicon-chevron-left"></span> Previous: Select\n' +
    '    Template</a>\n' +
    '  <a href="#/appstructure/{{data.selectedTemplate}}"\n' +
    '     class="btn btn-primary pull-right" role="button">Next: App Structure\n' +
    '    <span class="glyphicon glyphicon-chevron-right"></span></a>\n' +
    '\n' +
    '  <button type="button" class="btn btn-success" ng-click="show2=false"\n' +
    '          ng-show="show2" ng-init="show2 = true">Edit\n' +
    '    <!--<span class="glyphicon glyphicon-pencil"></span>-->\n' +
    '  </button>\n' +
    '  <button type="button" class="btn btn-danger" ng-click="show2=true"\n' +
    '          ng-show="!show2">\n' +
    '    <span class="glyphicon glyphicon-ok"></span>\n' +
    '  </button>\n' +
    '  <button class="btn btn-danger"\n' +
    '          style="width:60px;"\n' +
    '          data-toggle="modal"\n' +
    '          data-target="#commitMessageModal"\n' +
    '          ng-disabled="data.isUnchanged()"\n' +
    '          ng-click="show2=true"><i class="fa fa-spinner fa-spin fa-lg"\n' +
    '        ng-show="!data.saveComplete"></i><span\n' +
    '      ng-show="data.saveComplete">save</span>\n' +
    '  </button>\n' +
    '\n' +
    '  <div class="col-sm-12 save-alert">\n' +
    '    <alert class="animated shake" ng-repeat="alert in data.alerts"\n' +
    '           type="{{alert.type}}" close="data.closeAlert($index)"><i\n' +
    '        class="fa fa-exclamation-triangle fa-lg"></i> <b>Saving\n' +
    '      failed.</b> {{alert.msg}}\n' +
    '    </alert>\n' +
    '  </div>\n' +
    '</div>\n' +
    '\n' +
    '<!-- Check Save Modal -->\n' +
    '<div class="modal fade" id="checkSaveModal" tabindex="-1" role="dialog"\n' +
    '     aria-labelledby="checkSaveModalLabel" aria-hidden="true">\n' +
    '  <div class="modal-dialog">\n' +
    '    <div class="modal-content">\n' +
    '      <div class="modal-header">\n' +
    '        <button type="button" class="close" data-dismiss="modal"><span\n' +
    '            aria-hidden="true">&times;</span><span class="sr-only">Close</span>\n' +
    '        </button>\n' +
    '        <h4 class="modal-title">Delete Template</h4>\n' +
    '\n' +
    '      </div>\n' +
    '      <div class="modal-body">\n' +
    '        <h4 class="modal-title" id="checkSaveModalLabel">Do you want to\n' +
    '          save changes to data structure?</h4>\n' +
    '      </div>\n' +
    '\n' +
    '      <div class="modal-footer">\n' +
    '        <button class="btn btn-primary" ng-click="data.save()">Save\n' +
    '        </button>\n' +
    '        <button type="button" class="btn btn-warning"\n' +
    '                data-dismiss="modal">Discard\n' +
    '        </button>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '</div>\n' +
    '\n' +
    '<commit-message-modal save-function="data.saveWithCommit(commitMessage)"></commit-message-modal>\n' +
    '\n' +
    '<script>\n' +
    '    angular.module(\'huashanApp\', []);\n' +
    '    (function () {\n' +
    '        var opts = {\n' +
    '            lines: 13, // The number of lines to draw\n' +
    '            length: 11, // The length of each line\n' +
    '            width: 5, // The line thickness\n' +
    '            radius: 17, // The radius of the inner circle\n' +
    '            corners: 1, // Corner roundness (0..1)\n' +
    '            rotate: 0, // The rotation offset\n' +
    '            color: \'#FFF\', // #rgb or #rrggbb\n' +
    '            speed: 1, // Rounds per second\n' +
    '            trail: 60, // Afterglow percentage\n' +
    '            shadow: false, // Whether to render a shadow\n' +
    '            hwaccel: false, // Whether to use hardware acceleration\n' +
    '            className: \'spinner\', // The CSS class to assign to the spinner\n' +
    '            zIndex: 2e9, // The z-index (defaults to 2000000000)\n' +
    '            top: \'auto\', // Top position relative to parent in px\n' +
    '            left: \'auto\' // Left position relative to parent in px\n' +
    '        };\n' +
    '        var target = document.getElementById("loadingSpinner");\n' +
    '        var spinner = new Spinner(opts).spin(target);\n' +
    '        iosOverlay({\n' +
    '            text: "Loading",\n' +
    '            spinner: spinner,\n' +
    '            parentEl: "loadingSpinner"\n' +
    '        });\n' +
    '    })();\n' +
    '</script>\n' +
    '');
}]);
