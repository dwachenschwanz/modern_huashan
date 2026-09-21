var module;
try {
  module = angular.module('huashanApp');
} catch (e) {
  module = angular.module('huashanApp', []);
}

module.run(['$templateCache', function ($templateCache) {
  $templateCache.put('views/appstructure.html',
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
    '        <li><a ng-if="appCtrl.isAdmin" href="#/admin">Admin</a></li>\n' +
    '        <li><a href="#/selectTemplate">Select Template</a></li>\n' +
    '        <li ng-hide="appCtrl.selectedTemplate === \'Not Selected\'"><a\n' +
    '            href="#/json/{{appCtrl.selectedTemplate}}">JSON</a>\n' +
    '        </li>\n' +
    '        <li class="dropdown"\n' +
    '            ng-hide="appCtrl.selectedTemplate === \'Not Selected\'">\n' +
    '          <a href="" class="dropdown-toggle" data-toggle="dropdown">Data\n' +
    '            Structure <span class="caret"></span></a>\n' +
    '          <ul class="dropdown-menu" role="menu">\n' +
    '            <li><a href="#/datastructure/{{appCtrl.selectedTemplate}}">Project\n' +
    '              Data Structure</a></li>\n' +
    '            <!-- <li><a href="#/platformDataStructure/{{appCtrl.selectedTemplate}}">Platform\n' +
    '              Data Structure</a>\n' +
    '            </li> -->\n' +
    '          </ul>\n' +
    '        </li>\n' +
    '        <li class="dropdown active"\n' +
    '            ng-hide="appCtrl.selectedTemplate === \'Not Selected\'">\n' +
    '          <a href="" class="dropdown-toggle" data-toggle="dropdown">App\n' +
    '            Structure <span class="caret"></span></a>\n' +
    '          <ul class="dropdown-menu" role="menu">\n' +
    '            <li><a href="#/appstructure/{{appCtrl.selectedTemplate}}">Project\n' +
    '              App Structure</a></li>\n' +
    '            <!-- <li><a href="#/platformAppStructure/{{appCtrl.selectedTemplate}}">Platform\n' +
    '              App Structure</a>\n' +
    '            </li> -->\n' +
    '          </ul>\n' +
    '        </li>\n' +
    '        <li class="dropdown"\n' +
    '            ng-hide="appCtrl.selectedTemplate === \'Not Selected\'">\n' +
    '          <a href="" class="dropdown-toggle" data-toggle="dropdown">Portfolio\n' +
    '            Structure <span\n' +
    '                class="caret"></span></a>\n' +
    '          <ul class="dropdown-menu" role="menu">\n' +
    '            <li><a href="#/portfoliostructure/{{appCtrl.selectedTemplate}}">Project\n' +
    '              Portfolio Structure</a>\n' +
    '            </li>\n' +
    '            <!-- <li><a\n' +
    '                href="#/platformPortfolioStructure/{{appCtrl.selectedTemplate}}">Platform\n' +
    '              Portfolio\n' +
    '              Structure</a></li> -->\n' +
    '          </ul>\n' +
    '        </li>\n' +
    '        <li>\n' +
    '          <a href="#/revisions/{{appCtrl.selectedTemplate}}">Revisions</a>\n' +
    '        </li>\n' +
    '      </ul>\n' +
    '      <ul class="nav navbar-nav navbar-right">\n' +
    '        <li class="active"><a class="navbar-brand" href=""><b>{{appCtrl.selectedTemplate}}</b></a>\n' +
    '        </li>\n' +
    '      </ul>\n' +
    '    </div><!-- /.navbar-collapse -->\n' +
    '  </div><!-- /.container-fluid -->\n' +
    '</nav>\n' +
    '\n' +
    '\n' +
    '<div class="select-template"\n' +
    '     class="container col-sm-12 animated fadeIn"\n' +
    '     style="height: calc(100% - 100px);">\n' +
    '\n' +
    '  <!--Left side: list of templates to choose from-->\n' +
    '  <div class="choose-from"\n' +
    '       style="text-align: left; overflow: hidden; height: 100%;">\n' +
    '    <div class="select-template-title">\n' +
    '      <h4 ng-show="!appCtrl.isPlatform">App Structure</h4>\n' +
    '      <h4 ng-show="appCtrl.isPlatform">Platform App Structure</h4>\n' +
    '    </div>\n' +
    '\n' +
    '    <div class="select-template-title">\n' +
    '      <input type="text"\n' +
    '             class="form-control"\n' +
    '             placeholder="Search"\n' +
    '             ng-model="searchMenu.Display">\n' +
    '    </div>\n' +
    '\n' +
    '    <div class="panel panel-primary"\n' +
    '         style="height: calc(100% - 260px); margin-bottom: 10px">\n' +
    '\n' +
    '      <!-- List group -->\n' +
    '      <div class="list-of-templates"\n' +
    '           style="height: 100%">\n' +
    '        <div ui-sortable\n' +
    '             ng-model="appCtrl.appStructure.MENU"\n' +
    '             class="list-group"\n' +
    '             id="app-structure-menu">\n' +
    '          <a href=""\n' +
    '             class="list-group-item\n' +
    '                    cursor-move"\n' +
    '             ng-repeat="menu in appCtrl.appStructure.MENU|filter:searchMenu:strict track by $index"\n' +
    '             ng-click="appCtrl.selectMenu(menu)"\n' +
    '             ng-class="{active: appCtrl.selectedMenu == menu}">\n' +
    '            <table>\n' +
    '              <tr>\n' +
    '                <td class="appStructList no-wrap">\n' +
    '                  <!--<i class="fa fa-sort"></i>-->\n' +
    '                  {{menu.Display}}\n' +
    '                </td>\n' +
    '                <td class="appStructList" style="width:60px">\n' +
    '                   <span data-toggle="modal"\n' +
    '                         data-target="#deleteAppStructureModal"\n' +
    '                         ng-show="appCtrl.selectedMenu == menu"\n' +
    '                         ng-click="$(\'#deleteAppStructureModal\').modal(\'show\')"\n' +
    '                         class="inline-icon pull-right glyphicon glyphicon-trash"\n' +
    '                         tooltip="Delete"\n' +
    '                         tooltip-trigger="mouseenter"\n' +
    '                         tooltip-popup-delay="500"></span>\n' +
    '                  <span data-toggle="modal"\n' +
    '                        data-target="#editAppStructureModal"\n' +
    '                        ng-show="appCtrl.selectedMenu === menu"\n' +
    '                        ng-click="$(\'#editAppStructureModal\').modal(\'show\')"\n' +
    '                        class="inline-icon pull-right glyphicon glyphicon-pencil"\n' +
    '                        tooltip="Rename"\n' +
    '                        tooltip-trigger="mouseenter"\n' +
    '                        tooltip-popup-delay="500"></span>\n' +
    '                </td>\n' +
    '              </tr>\n' +
    '            </table>\n' +
    '          </a>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '\n' +
    '    <div class="pull-left">\n' +
    '      <!-- New Button -->\n' +
    '      <button class="btn btn-success"\n' +
    '              id="new-button"\n' +
    '              data-toggle="modal"\n' +
    '              ng-click="appCtrl.openNew()"\n' +
    '              data-target="#newAppStructureModal"\n' +
    '              tooltip="New"\n' +
    '              tooltip-trigger="mouseenter"\n' +
    '              tooltip-popup-delay="500">\n' +
    '        <span class="glyphicon glyphicon-plus"></span>\n' +
    '      </button>\n' +
    '    </div>\n' +
    '\n' +
    '  </div><!--Left side-->\n' +
    '\n' +
    '  <!--Right Side: selected template and JSON-->\n' +
    '  <div id="selected-template"\n' +
    '       style="height: 100%">\n' +
    '    <div class="select-template-title">\n' +
    '      <div class="col-sm-12">\n' +
    '        <h4 ng-show="!appCtrl.show">\n' +
    '          {{appCtrl.selectedMenu.Display}}\n' +
    '        </h4>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '\n' +
    '    <div class="selected-inputs" style="background-color: #eee;">\n' +
    '      <div class="col-sm-12"\n' +
    '           ng-show="appCtrl.selectedMenu.Command == \'TABLE_INPUT\'">\n' +
    '        <div class="row">\n' +
    '          <div class="col-sm-6">\n' +
    '            <h4>{{appCtrl.selectedMenu.Command}}</h4>\n' +
    '          </div>\n' +
    '          <div class="col-sm-3">\n' +
    '            <h4>\n' +
    '              <input type="checkbox" ng-model="appCtrl.selectedMenu.Visible">Visible\n' +
    '            </h4>\n' +
    '          </div>\n' +
    '          <div class="col-sm-3">\n' +
    '            <h4>\n' +
    '              <input type="checkbox"\n' +
    '                     ng-model="appCtrl.selectedMenu.UsePostProcessingOutputs">Use\n' +
    '              Post\n' +
    '              Processing\n' +
    '            </h4>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '\n' +
    '        <div class="col-sm-3 no-padding">\n' +
    '          <div class="list-of-templates">\n' +
    '            <div class="list-group">\n' +
    '              <a href=""\n' +
    '                 class="list-group-item"\n' +
    '                 ng-repeat="input in appCtrl.tableInputs"\n' +
    '                 ng-class="{active: appCtrl.selectedMenu.Parameters.InputKey === input.Key}"\n' +
    '                 ng-click="appCtrl.selectTableInput(input.Key);"\n' +
    '                 scroll-if="appCtrl.selectedMenu.Parameters.InputKey === input.Key">\n' +
    '                {{input.Display}}\n' +
    '              </a>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div class="col-sm-9">\n' +
    '          <table>\n' +
    '            <tr>\n' +
    '              <td class="text-right col-sm-2" style="vertical-align: top;">\n' +
    '                <h4>Cell Link</h4>\n' +
    '              </td>\n' +
    '              <td class="text-left col-sm-10" style="vertical-align: top;">\n' +
    '                <h5>\n' +
    '                  {{appCtrl.findKey(appCtrl.tableInputs)(appCtrl.selectedMenu.Parameters.InputKey).CellLink}}</h5></ht>\n' +
    '              </td>\n' +
    '            </tr>\n' +
    '            <tr>\n' +
    '              <td class="text-right col-sm-2" style="vertical-align: top;">\n' +
    '                <h4>Description</h4>\n' +
    '              </td>\n' +
    '              <td class="text-left col-sm-10" style="vertical-align: top;">\n' +
    '                <h5>\n' +
    '                  {{appCtrl.findKey(appCtrl.tableInputs)(appCtrl.selectedMenu.Parameters.InputKey).Description}}</h5>\n' +
    '              </td>\n' +
    '            </tr>\n' +
    '            <tr>\n' +
    '              <td class="text-right col-sm-2" style="vertical-align: top;">\n' +
    '                <h4>Preview</h4>\n' +
    '              </td>\n' +
    '              <td class="text-left col-sm-10" style="vertical-align: top;">\n' +
    '                <!-- REST CalcEngine: inline HTML table (HtmlPreview) rendered in a div -->\n' +
    '                <div ng-if="appCtrl.findCellLink(appCtrl.findKey(appCtrl.tableInputs)(appCtrl.selectedMenu.Parameters.InputKey).CellLink).HtmlPreview"\n' +
    '                     ng-bind-html="appCtrl.findCellLink(appCtrl.findKey(appCtrl.tableInputs)(appCtrl.selectedMenu.Parameters.InputKey).CellLink).HtmlPreview | tablePreviewHtml"\n' +
    '                     style="width:100%; overflow:auto;"></div>\n' +
    '                <!-- Legacy SOAP: PNG preview -->\n' +
    '                <img\n' +
    '                    ng-if="!appCtrl.findCellLink(appCtrl.findKey(appCtrl.tableInputs)(appCtrl.selectedMenu.Parameters.InputKey).CellLink).HtmlPreview"\n' +
    '                    src="{{appCtrl.server}}{{appCtrl.findCellLink(appCtrl.findKey(appCtrl.tableInputs)(appCtrl.selectedMenu.Parameters.InputKey).CellLink).PreviewURL}}"\n' +
    '                    alt="{{appCtrl.findKey(appCtrl.tableInputs)(appCtrl.selectedMenu.Parameters.InputKey).CellLink}}"\n' +
    '                    width="100%">\n' +
    '              </td>\n' +
    '            </tr>\n' +
    '          </table>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '\n' +
    '      <div class="col-sm-12"\n' +
    '           ng-show="appCtrl.selectedMenu.Command == \'INPUT_SCREEN\'">\n' +
    '        <div class="row">\n' +
    '          <div class="col-sm-6">\n' +
    '            <h4>{{appCtrl.selectedMenu.Command}}</h4>\n' +
    '          </div>\n' +
    '          <div class="col-sm-3">\n' +
    '            <h4>\n' +
    '              <input type="checkbox" ng-model="appCtrl.selectedMenu.Visible">Visible\n' +
    '            </h4>\n' +
    '          </div>\n' +
    '          <div class="col-sm-3">\n' +
    '            <h4>\n' +
    '              <input type="checkbox"\n' +
    '                     ng-model="appCtrl.selectedMenu.UsePostProcessingOutputs">Use\n' +
    '              Post\n' +
    '              Processing\n' +
    '            </h4>\n' +
    '          </div>\n' +
    '          <div>\n' +
    '          </div>\n' +
    '\n' +
    '          <div class="col-sm-6">\n' +
    '            <h4>Included Inputs</h4>\n' +
    '          </div>\n' +
    '          <div class="col-sm-6">\n' +
    '            <h4>Excluded Inputs</h4>\n' +
    '          </div>\n' +
    '\n' +
    '          <div class="col-sm-6" style=" height:420px;overflow: auto;">\n' +
    '            <div class="list-of-templates" style="height: 100%;">\n' +
    '              <ul class="list-group">\n' +
    '                <li class="list-group-item"\n' +
    '                    ng-repeat="key in appCtrl.selectedMenu.Parameters.InputKeys">\n' +
    '                  <div class="no-wrap">\n' +
    '                    <a class="text-danger">\n' +
    '                      <i class="fa fa-minus-square fa-lg"\n' +
    '                         ng-click="appCtrl.excludeInput(key)"></i>\n' +
    '                    </a>\n' +
    '                    {{appCtrl.findKey(appCtrl.inputs)(key).Display}}\n' +
    '                  </div>\n' +
    '                </li>\n' +
    '              </ul>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '\n' +
    '          <div class="col-sm-6" style=" height:420px;overflow: auto;">\n' +
    '            <div class="list-of-templates" style="height:100%;">\n' +
    '              <ul class="list-group">\n' +
    '                <li class="list-group-item"\n' +
    '                    ng-repeat="input in appCtrl.excludedInputs">\n' +
    '                  <div class="no-wrap">\n' +
    '                    <a class="text-success">\n' +
    '                      <i class="fa fa-plus-square fa-lg"\n' +
    '                         ng-click="appCtrl.includeInput(input)"></i>\n' +
    '                    </a>\n' +
    '                    {{input.Display}}\n' +
    '                  </div>\n' +
    '                </li>\n' +
    '              </ul>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '\n' +
    '        </div>\n' +
    '      </div>\n' +
    '\n' +
    '      <div class="col-sm-12 no-padding"\n' +
    '           ng-show="appCtrl.selectedMenu.Command == \'TABLE\'">\n' +
    '        <div class="row">\n' +
    '          <div class="col-sm-3">\n' +
    '            <h4>{{appCtrl.selectedMenu.Command}}</h4>\n' +
    '          </div>\n' +
    '          <div class="col-sm-1">\n' +
    '            <h4>OutputKey</h4>\n' +
    '          </div>\n' +
    '          <div class="col-sm-2">\n' +
    '            <input type="text" class="form form-control"\n' +
    '                   ng-model="appCtrl.selectedMenu.Parameters.OutputKey">\n' +
    '          </div>\n' +
    '          <div class="col-sm-2">\n' +
    '            <h4>\n' +
    '              <input type="checkbox" ng-model="appCtrl.selectedMenu.Visible">Visible\n' +
    '            </h4>\n' +
    '          </div>\n' +
    '          <div class="col-sm-2">\n' +
    '            <h4>\n' +
    '              <input type="checkbox"\n' +
    '                     ng-model="appCtrl.selectedMenu.Parameters.Pnl">Pnl\n' +
    '            </h4>\n' +
    '          </div>\n' +
    '          <div class="col-sm-2">\n' +
    '            <h4>\n' +
    '              <input type="checkbox"\n' +
    '                     ng-model="appCtrl.selectedMenu.UsePostProcessingOutputs">Use\n' +
    '              Post\n' +
    '              Processing\n' +
    '            </h4>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '\n' +
    '        <div class="col-sm-3">\n' +
    '          <div class="list-of-templates">\n' +
    '            <div class="list-group">\n' +
    '              <a href=""\n' +
    '                 id="table{{$index}}"\n' +
    '                 class="list-group-item"\n' +
    '                 ng-repeat="table in appCtrl.potentialTables"\n' +
    '                 ng-click="appCtrl.selectPotentialTable(table)"\n' +
    '                 ng-class="{active: appCtrl.selectedPotentialTable === table}"\n' +
    '                 scroll-if="table.CellLink === appCtrl.selectedPotentialTable.CellLink">\n' +
    '                {{table.CellLink}}\n' +
    '              </a>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div class="col-sm-9">\n' +
    '          <!-- REST CalcEngine: inline HTML table (HtmlPreview) rendered in a div -->\n' +
    '          <div ng-if="appCtrl.selectedPotentialTable.HtmlPreview"\n' +
    '               ng-bind-html="appCtrl.selectedPotentialTable.HtmlPreview | tablePreviewHtml"\n' +
    '               style="width:100%; overflow:auto;"></div>\n' +
    '          <!-- Legacy SOAP: PNG preview -->\n' +
    '          <img\n' +
    '              ng-if="!appCtrl.selectedPotentialTable.HtmlPreview"\n' +
    '              src="{{appCtrl.server}}{{appCtrl.selectedPotentialTable.PreviewURL}}"\n' +
    '              alt="{{appCtrl.selectedPotentialTable.CellLink}}" width="100%">\n' +
    '        </div>\n' +
    '      </div>\n' +
    '\n' +
    '      <div class="col-sm-12 no-padding"\n' +
    '           ng-show="appCtrl.selectedMenu.Command == \'IMAGE\'">\n' +
    '        <div class="container-fluid">\n' +
    '          <div class="row">\n' +
    '            <div class="col-sm-3">\n' +
    '              <h4>{{appCtrl.selectedMenu.Command}}</h4>\n' +
    '            </div>\n' +
    '            <div class="col-sm-3">\n' +
    '              <h4>\n' +
    '                <input name="test" type="radio"\n' +
    '                       ng-model=\'appCtrl.selectedMenu.Parameters.Type\'\n' +
    '                       value="RANGE"> RANGE\n' +
    '                <input name="test" type="radio"\n' +
    '                       ng-model=\'appCtrl.selectedMenu.Parameters.Type\'\n' +
    '                       value="CHART"> CHART\n' +
    '              </h4>\n' +
    '            </div>\n' +
    '            <div class="col-sm-2">\n' +
    '              <h4>\n' +
    '                <input type="checkbox" ng-model="appCtrl.selectedMenu.Visible"\n' +
    '                       checked>Visible\n' +
    '              </h4>\n' +
    '            </div>\n' +
    '\n' +
    '            <div class="col-sm-2">\n' +
    '              <h4>\n' +
    '                <input type="checkbox"\n' +
    '                       ng-model="appCtrl.selectedMenu.Parameters.FitToScreen"\n' +
    '                       checked>Fit To Screen\n' +
    '              </h4>\n' +
    '            </div>\n' +
    '\n' +
    '            <div class="col-sm-2">\n' +
    '              <h4>\n' +
    '                <input type="checkbox"\n' +
    '                       ng-model="appCtrl.selectedMenu.UsePostProcessingOutputs">Use\n' +
    '                Post\n' +
    '                Processing\n' +
    '              </h4>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '\n' +
    '        <div class="col-sm-3">\n' +
    '\n' +
    '          <div class="list-of-templates"\n' +
    '               ng-show="appCtrl.selectedMenu.Parameters.Type === \'RANGE\'">\n' +
    '            <div class="list-group">\n' +
    '              <a id="imageTable{{$index}}"\n' +
    '                 class="list-group-item"\n' +
    '                 ng-repeat="table in appCtrl.potentialTables"\n' +
    '                 ng-model="appCtrl.selectedMenu.Parameters.CellLink"\n' +
    '                 ng-class="{active: table.CellLink == appCtrl.selectedMenu.Parameters.CellLink}"\n' +
    '                 ng-click="appCtrl.selectImageTable(table);"\n' +
    '                 scroll-if="table.CellLink === appCtrl.selectedImageTable.CellLink">\n' +
    '                {{table.CellLink}}\n' +
    '              </a>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '          <div class="list-of-templates"\n' +
    '               ng-show="appCtrl.selectedMenu.Parameters.Type === \'CHART\'">\n' +
    '            <div class="list-group">\n' +
    '              <a class="list-group-item"\n' +
    '                 ng-repeat="chart in appCtrl.charts"\n' +
    '                 ng-model="appCtrl.selectedMenu.Parameters.CellLink"\n' +
    '                 ng-class="{active: appCtrl.selectedMenu.Parameters.CellLink == chart.ChartName}"\n' +
    '                 ng-click="appCtrl.selectImageChart(chart)"\n' +
    '                 scroll-if="chart.ChartName === appCtrl.selectedImageChart.ChartName">\n' +
    '                {{chart.ChartName}}\n' +
    '              </a>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div class="col-sm-9" style="height:500px;overflow: auto">\n' +
    '          <!-- RANGE image = inline HTML table. REST CalcEngine returns HtmlPreview; render in a div. -->\n' +
    '          <div ng-if="appCtrl.selectedMenu.Parameters.Type === \'RANGE\' && appCtrl.selectedImageTable.HtmlPreview"\n' +
    '               ng-bind-html="appCtrl.selectedImageTable.HtmlPreview | tablePreviewHtml"\n' +
    '               style="width:100%; overflow:auto;"></div>\n' +
    '          <img ng-if="appCtrl.selectedMenu.Parameters.Type === \'RANGE\' && !appCtrl.selectedImageTable.HtmlPreview"\n' +
    '               src="{{appCtrl.server}}{{appCtrl.selectedImageTable.PreviewURL}}"\n' +
    '               alt="{{appCtrl.selectedMenu.Parameters.CellLink}}"\n' +
    '               width="100%">\n' +
    '          <!-- CHART image. REST CalcEngine returns chart JSON (no PNG) under selectedImageChart.Chart;\n' +
    '               it is rendered client-side with Highcharts into this container by renderCalcEngineChart. -->\n' +
    '          <div id="appstructure-image-chart"\n' +
    '               ng-if="appCtrl.selectedMenu.Parameters.Type === \'CHART\' && appCtrl.selectedImageChart.Chart"\n' +
    '               style="width:100%; height:480px;"></div>\n' +
    '          <!-- Legacy SOAP fallback: server PNG, only if a PreviewURL is present. -->\n' +
    '          <img ng-if="appCtrl.selectedMenu.Parameters.Type === \'CHART\' && !appCtrl.selectedImageChart.Chart && appCtrl.selectedImageChart.PreviewURL"\n' +
    '               src="{{appCtrl.server}}{{appCtrl.selectedImageChart.PreviewURL}}"\n' +
    '               alt="{{appCtrl.selectedMenu.Parameters.CellLink}}"\n' +
    '               width="100%">\n' +
    '          <p ng-if="appCtrl.selectedMenu.Parameters.Type === \'CHART\' && !appCtrl.selectedImageChart.Chart && !appCtrl.selectedImageChart.PreviewURL"\n' +
    '             class="text-muted" style="padding-top:20px;">\n' +
    '            No chart preview available for this item.\n' +
    '          </p>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '\n' +
    '      <div class="col-sm-12"\n' +
    '           ng-show="appCtrl.selectedMenu.Command == \'ADD_TABLES\'">\n' +
    '        <div class="col-sm-12">\n' +
    '          <div class="col-sm-6">\n' +
    '            <h4>{{appCtrl.selectedMenu.Command}}</h4>\n' +
    '          </div>\n' +
    '          <div class="col-sm-2">\n' +
    '            <h4>\n' +
    '              <input type="checkbox" ng-model="appCtrl.selectedMenu.Visible"\n' +
    '                     checked>Visible\n' +
    '            </h4>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div class="col-sm-4">\n' +
    '          <div class="list-group">\n' +
    '            <a id="table{{$index}}"\n' +
    '               class="list-group-item"\n' +
    '               ng-repeat="table in appCtrl.tables"\n' +
    '               ng-class="{active: appCtrl.selectedTable === table}"\n' +
    '               ng-click="appCtrl.selectTable(table)"\n' +
    '               scroll-if="table.CellLink === appCtrl.selectedPotentialTable.CellLink">\n' +
    '              {{table.Display}}\n' +
    '            </a>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '\n' +
    '        <div class="col-sm-8">\n' +
    '          <!-- REST CalcEngine: inline HTML table (HtmlPreview) rendered in a div -->\n' +
    '          <div ng-if="appCtrl.selectedPotentialTable.HtmlPreview"\n' +
    '               ng-bind-html="appCtrl.selectedPotentialTable.HtmlPreview | tablePreviewHtml"\n' +
    '               style="width:100%; overflow:auto;"></div>\n' +
    '          <!-- Legacy SOAP: PNG preview -->\n' +
    '          <img\n' +
    '              ng-if="!appCtrl.selectedPotentialTable.HtmlPreview"\n' +
    '              src="{{appCtrl.server}}{{appCtrl.selectedPotentialTable.PreviewURL}}"\n' +
    '              alt="{{appCtrl.selectedPotentialTable.CellLink}}" width="100%">\n' +
    '        </div>\n' +
    '\n' +
    '\n' +
    '        <!--half bottom for special rules-->\n' +
    '        <div class="col-sm-12">\n' +
    '          <div class="row table-padding col-sm-4">\n' +
    '            <div class=" col-sm-6 text-right">\n' +
    '              <b>PNL</b>\n' +
    '            </div>\n' +
    '            <div class="col-sm-6">\n' +
    '              <input type="checkbox"\n' +
    '                     ng-model="appCtrl.selectedMenu.Parameters.Pnl">\n' +
    '            </div>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '\n' +
    '        <div class="col-sm-12">\n' +
    '          <div class="row table-padding col-sm-4">\n' +
    '            <div class="col-sm-6 text-right" style="padding-top: 2%">\n' +
    '              <b>Precision Options</b>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '\n' +
    '\n' +
    '        <div class="col-sm-12">\n' +
    '          <div class="row table-padding col-sm-4">\n' +
    '            <div class="col-sm-6 text-right" style="padding-top: 2%">\n' +
    '              <b>Min</b>\n' +
    '            </div>\n' +
    '            <div class="col-sm-6">\n' +
    '              <input type="number"\n' +
    '                     class="form form-control"\n' +
    '                     ng-model="appCtrl.minPrecision"\n' +
    '                     ng-change="appCtrl.changePrecisionOptions()"\n' +
    '                     min="0">\n' +
    '            </div>\n' +
    '          </div>\n' +
    '\n' +
    '          <div class="row table-padding col-sm-4">\n' +
    '            <div class="col-sm-6 text-right" style="padding-top: 2%">\n' +
    '              <b>Max</b>\n' +
    '            </div>\n' +
    '            <div class="col-sm-6">\n' +
    '              <input type="number"\n' +
    '                     class="form form-control"\n' +
    '                     ng-model="appCtrl.maxPrecision"\n' +
    '                     ng-change="appCtrl.changePrecisionOptions()"\n' +
    '                     min="0">\n' +
    '            </div>\n' +
    '          </div>\n' +
    '\n' +
    '\n' +
    '          <div class="row table-padding col-sm-4">\n' +
    '            <div class="col-sm-6 text-right">\n' +
    '              <b>Default Precision</b>\n' +
    '            </div>\n' +
    '            <div class="col-sm-6">\n' +
    '              <select class="btn btn-default form-control"\n' +
    '                      ng-model="appCtrl.selectedMenu.Parameters.DefaultPrecision"\n' +
    '                      ng-options="option for option in appCtrl.selectedMenu.Parameters.PrecisionOptions">\n' +
    '              </select>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '\n' +
    '        <div class="col-sm-12">\n' +
    '          <div class="row table-padding col-sm-4">\n' +
    '            <div class="col-sm-6 text-right" style="padding-top: 2%">\n' +
    '              <b>Special Rules</b>\n' +
    '            </div>\n' +
    '            <div class="col-sm-6">\n' +
    '              <select class="btn btn-default form-control">\n' +
    '                <option value="1">None</option>\n' +
    '                <option value="2">Ignore</option>\n' +
    '                <option value="3">IRR</option>\n' +
    '                <option value="4">MVSto Range</option>\n' +
    '                <option value="5">Year</option>\n' +
    '                <option value="6">Tooltip</option>\n' +
    '              </select>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '\n' +
    '      <div class="col-sm-12"\n' +
    '           ng-show="appCtrl.selectedMenu.Command == \'COMPARE_VALUE\'">\n' +
    '        <div class="col-sm-12">\n' +
    '          <div class="col-sm-6">\n' +
    '            <h4>{{appCtrl.selectedMenu.Command}}</h4>\n' +
    '          </div>\n' +
    '          <div class="col-sm-2">\n' +
    '            <h4>\n' +
    '              <input type="checkbox" ng-model="appCtrl.selectedMenu.Visible"\n' +
    '                     checked>Visible\n' +
    '            </h4>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '\n' +
    '        <div class="row table-padding">\n' +
    '          <div class="col-sm-2">\n' +
    '            <b>Total</b>\n' +
    '          </div>\n' +
    '          <div class="col-sm-3">\n' +
    '            <input type="checkbox"\n' +
    '                   ng-model="appCtrl.selectedMenu.Parameters.Total">\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div class="row table-padding">\n' +
    '          <div class="col-sm-2">\n' +
    '            <b>Min</b>\n' +
    '          </div>\n' +
    '          <div class="col-sm-3">\n' +
    '            <input type="number" class="form form-control"\n' +
    '                   ng-model="appCtrl.selectedMenu.Parameters.Min">\n' +
    '          </div>\n' +
    '          <div class="col-sm-2">\n' +
    '            <b>Max</b>\n' +
    '          </div>\n' +
    '          <div class="col-sm-3">\n' +
    '            <input type="number" class="form form-control"\n' +
    '                   ng-model="appCtrl.selectedMenu.Parameters.Max">\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div class="row table-padding">\n' +
    '          <div class="col-sm-3">\n' +
    '            <b>Key</b>\n' +
    '          </div>\n' +
    '          <div class="col-sm-3">\n' +
    '            <b>Unit</b>\n' +
    '          </div>\n' +
    '          <div class="col-sm-3">\n' +
    '            <b>Title</b>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div class="row table-padding"\n' +
    '             ng-repeat="key in appCtrl.selectedMenu.Parameters.Keys track by $index">\n' +
    '          <div class="col-sm-3">\n' +
    '            <select class="form form-control"\n' +
    '                    ng-options="output.Key as appCtrl.findKey(appCtrl.outputs)(output.Key).Display for output in appCtrl.outputs"\n' +
    '                    ng-model="appCtrl.selectedMenu.Parameters.Keys[$index]"\n' +
    '                    ng-change="appCtrl.selectedMenu.Parameters.Units[$index] = appCtrl.findKey(appCtrl.outputs)(appCtrl.selectedMenu.Parameters.Keys[$index]).Units;appCtrl.selectedMenu.Parameters.Titles[$index] = appCtrl.findKey(appCtrl.outputs)(appCtrl.selectedMenu.Parameters.Keys[$index]).Display;">\n' +
    '            </select>\n' +
    '          </div>\n' +
    '          <div class="col-sm-3">\n' +
    '            <input type="text" class="form form-control"\n' +
    '                   ng-model="appCtrl.selectedMenu.Parameters.Units[$index]">\n' +
    '          </div>\n' +
    '          <div class="col-sm-3">\n' +
    '            <input type="text" class="form form-control"\n' +
    '                   ng-model="appCtrl.selectedMenu.Parameters.Titles[$index]">\n' +
    '          </div>\n' +
    '          <div class="col-sm-1">\n' +
    '            <button class="btn btn-danger"\n' +
    '                    ng-click="appCtrl.deleteCompareValueItem($index);"><span\n' +
    '                class="glyphicon glyphicon-trash"></span></button>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div class="row table-padding">\n' +
    '          <div class="col-sm-1">\n' +
    '            <button class="btn btn-success"\n' +
    '                    ng-click="appCtrl.addCompareValueItem();"><span\n' +
    '                class="glyphicon glyphicon-plus"></span></button>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '\n' +
    '      <div class="col-sm-12"\n' +
    '           ng-show="appCtrl.selectedMenu.Command == \'TORNADODIST\'">\n' +
    '        <div class="row">\n' +
    '          <div class="col-sm-6">\n' +
    '            <h4>{{appCtrl.selectedMenu.Command}}</h4>\n' +
    '          </div>\n' +
    '          <div class="col-sm-3">\n' +
    '            <h4>\n' +
    '              <input type="checkbox" ng-model="appCtrl.selectedMenu.Visible">Visible\n' +
    '            </h4>\n' +
    '          </div>\n' +
    '          <div class="col-sm-3">\n' +
    '            <h4>\n' +
    '              <input type="checkbox"\n' +
    '                     ng-model="appCtrl.selectedMenu.UsePostProcessingOutputs">Use\n' +
    '              Post\n' +
    '              Processing\n' +
    '            </h4>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '\n' +
    '\n' +
    '        <tabset class="animated fadeIn">\n' +
    '          <tab heading="Tornado Output">\n' +
    '            <div>\n' +
    '              <div class="col-sm-6">\n' +
    '                <h4>Included Outputs</h4>\n' +
    '              </div>\n' +
    '              <div class="col-sm-6">\n' +
    '                <h4>Excluded Outputs</h4>\n' +
    '              </div>\n' +
    '\n' +
    '              <div class="col-sm-6" style=" height:420px;overflow: auto;">\n' +
    '                <div class="list-of-templates">\n' +
    '                  <ul class="list-group">\n' +
    '                    <li class="list-group-item"\n' +
    '                        ng-repeat="key in appCtrl.tornado.Parameters.ValueMetricKeys">\n' +
    '                      <div class="no-wrap">\n' +
    '                        <a class="text-danger">\n' +
    '                          <i class="fa fa-minus-square fa-lg"\n' +
    '                             ng-click="appCtrl.selectTornado(key)"></i>\n' +
    '                        </a>\n' +
    '                        {{appCtrl.findKey(appCtrl.outputs)(key).Display}}\n' +
    '                      </div>\n' +
    '                    </li>\n' +
    '                  </ul>\n' +
    '                </div>\n' +
    '              </div>\n' +
    '\n' +
    '              <div class="col-sm-6" style=" height:420px;overflow: auto;">\n' +
    '                <div class="list-of-templates">\n' +
    '                  <ul class="list-group">\n' +
    '                    <li class="list-group-item"\n' +
    '                        ng-repeat="output in appCtrl.outputs"\n' +
    '                        ng-show="appCtrl.tornado.Parameters.ValueMetricKeys.indexOf(output.Key)===-1">\n' +
    '                      <div class="no-wrap">\n' +
    '                        <a href="" class="text-success">\n' +
    '                          <i class="fa fa-plus-square fa-lg"\n' +
    '                             ng-click="appCtrl.selectTornado(output.Key)"></i>\n' +
    '                        </a>\n' +
    '                        {{appCtrl.findKey(appCtrl.outputs)(output.Key).Display}}\n' +
    '                      </div>\n' +
    '                    </li>\n' +
    '                  </ul>\n' +
    '                </div>\n' +
    '              </div>\n' +
    '\n' +
    '            </div>\n' +
    '          </tab>\n' +
    '          <tab heading="Parameters">\n' +
    '            <div class="container-fluid">\n' +
    '              <div class="row table-padding">\n' +
    '                <div class="col-sm-3 text-right">\n' +
    '                  <h5>Chart Title</h5>\n' +
    '                </div>\n' +
    '                <div class="col-sm-6" colspan="2">\n' +
    '                  <input type="text"\n' +
    '                         ng-model="appCtrl.tornado.Parameters.ChartTitle"\n' +
    '                         class="form form-control">\n' +
    '                </div>\n' +
    '              </div>\n' +
    '              <div class="row table-padding">\n' +
    '                <div class="col-sm-3 text-right">\n' +
    '                  <h5>Combined Uncertainty Label</h5>\n' +
    '                </div>\n' +
    '                <div class="col-sm-6" colspan="2">\n' +
    '                  <input type="text"\n' +
    '                         ng-model="appCtrl.tornado.Parameters.CombinedUncertaintyLabel"\n' +
    '                         class="form form-control">\n' +
    '                </div>\n' +
    '              </div>\n' +
    '              <div class="row table-padding">\n' +
    '                <div class="col-sm-3 text-right">\n' +
    '                  <h5>Depth</h5>\n' +
    '                </div>\n' +
    '                <div class="col-sm-3">\n' +
    '                  <select class="btn btn-default form-control"\n' +
    '                          ng-model="appCtrl.tornado.Parameters.Depth">\n' +
    '                    <option value="2">2</option>\n' +
    '                    <option value="3">3</option>\n' +
    '                    <option value="4">4</option>\n' +
    '                    <option value="5">5</option>\n' +
    '                    <option value="6">6</option>\n' +
    '                  </select>\n' +
    '                </div>\n' +
    '              </div>\n' +
    '              <div class="row table-padding">\n' +
    '                <div class="col-sm-3 text-right">\n' +
    '                  <h5>Probability Weights</h5>\n' +
    '                </div>\n' +
    '              </div>\n' +
    '              <div class="row table-padding">\n' +
    '                <div class="col-sm-3 text-right">\n' +
    '                  <h5>High</h5>\n' +
    '                </div>\n' +
    '                <div class="col-sm-3">\n' +
    '                  <input type="number"\n' +
    '                         ng-model="appCtrl.tornado.Parameters.Weights.High"\n' +
    '                         min="0" max="1" step="0.01"\n' +
    '                         class="form form-control">\n' +
    '                </div>\n' +
    '                <div class="col-sm-6">\n' +
    '                  <div class="text-danger"\n' +
    '                       ng-show="appCtrl.tornado.Parameters.Weights.High+appCtrl.tornado.Parameters.Weights.Med+appCtrl.tornado.Parameters.Weights.Low != 1">\n' +
    '                    <h4>Weights do not add up to 1.</h4>\n' +
    '                  </div>\n' +
    '                </div>\n' +
    '              </div>\n' +
    '              <div class="row table-padding">\n' +
    '                <div class="col-sm-3 text-right">\n' +
    '                  <h5>Medium</h5>\n' +
    '                </div>\n' +
    '                <div class="col-sm-3">\n' +
    '                  <input type="number"\n' +
    '                         ng-model="appCtrl.tornado.Parameters.Weights.Med"\n' +
    '                         min="0" max="1" step="0.01"\n' +
    '                         class="form form-control">\n' +
    '                </div>\n' +
    '                <div class="col-sm-6">\n' +
    '                  <div class="text-danger"\n' +
    '                       ng-show="appCtrl.tornado.Parameters.Weights.Med<appCtrl.tornado.Parameters.Weights.Low">\n' +
    '                    <h4>Med probability is lower than Low</h4>\n' +
    '                  </div>\n' +
    '                  <div class="text-danger"\n' +
    '                       ng-show="appCtrl.tornado.Parameters.Weights.Med < appCtrl.tornado.Parameters.Weights.High">\n' +
    '                    <h4>Med probability is lower than High</h4>\n' +
    '                  </div>\n' +
    '                </div>\n' +
    '              </div>\n' +
    '              <div class="row table-padding">\n' +
    '                <div class="col-sm-3 text-right">\n' +
    '                  <h5>Low</h5>\n' +
    '                </div>\n' +
    '                <div class="col-sm-3">\n' +
    '                  <input type="number"\n' +
    '                         ng-model="appCtrl.tornado.Parameters.Weights.Low"\n' +
    '                         min="0" max="1" step="0.01"\n' +
    '                         class="form form-control">\n' +
    '                </div>\n' +
    '              </div>\n' +
    '            </div>\n' +
    '          </tab>\n' +
    '          <tab heading="Post Processing">\n' +
    '            <div class="container-fluid" style="height:470px;overflow:auto;">\n' +
    '              <div class="row table-padding"\n' +
    '                   ng-repeat="sendback in appCtrl.postProcessing">\n' +
    '                <div class="col-sm-1">\n' +
    '                  <button class="btn btn-danger"\n' +
    '                          ng-click="appCtrl.deleteSendBack(sendback)"><span\n' +
    '                      class="glyphicon glyphicon-trash"></span></button>\n' +
    '                </div>\n' +
    '                <div class="col-sm-1">\n' +
    '                  <h5>Send</h5>\n' +
    '                </div>\n' +
    '                <div class="col-sm-2">\n' +
    '                  <select class="btn btn-default form-control"\n' +
    '                          ng-init="sendTo = sendback.Reference.slice(22)"\n' +
    '                          ng-change="appCtrl.selectSendBackTo(sendback,sendTo)"\n' +
    '                          ng-model="sendTo"\n' +
    '                          ng-options="element.value as element.display for element in appCtrl.sendBackElements">\n' +
    '                  </select>\n' +
    '                </div>\n' +
    '                <div class="col-sm-1">\n' +
    '                  <h5>of</h5>\n' +
    '                </div>\n' +
    '                <div class="col-sm-3">\n' +
    '                  <select class="btn btn-default form-control"\n' +
    '                          ng-init="index = sendback.Reference[19];appCtrl.selectSendBackTornado(sendback,index)"\n' +
    '                          ng-change="appCtrl.selectSendBackTornado(sendback,index)"\n' +
    '                          ng-model="index"\n' +
    '                          ng-options="appCtrl.tornado.Parameters.ValueMetricKeys.indexOf(key).toString()\n' +
    '                                            as appCtrl.findKey(appCtrl.outputs)(key).Display\n' +
    '                                            for key in appCtrl.tornado.Parameters.ValueMetricKeys">\n' +
    '                  </select>\n' +
    '                </div>\n' +
    '                <div class="col-sm-1">\n' +
    '                  <h5>Back To</h5>\n' +
    '                </div>\n' +
    '<!--                <div class="col-sm-1" style="padding-right: 0px;!important;">-->\n' +
    '<!--                  <input type="text" ng-model="sendback.SendBack"-->\n' +
    '<!--                         class="form form-control">-->\n' +
    '<!--                </div>-->\n' +
    '<!--                <div class="col-sm-2"-->\n' +
    '<!--                     style="padding-left: 0px;!important;">-->\n' +
    '<!--                  <select class="btn btn-default form-control"-->\n' +
    '<!--                          ng-model="sendback.SendBack">-->\n' +
    '<!--                    <option ng-repeat="io in appCtrl.allDataStructureComponents"-->\n' +
    '<!--                            value="{{io.CellLink}}">-->\n' +
    '<!--                      {{io.Display}}-->\n' +
    '<!--                    </option>-->\n' +
    '<!--                    <option ng-repeat="output in appCtrl.outputs"-->\n' +
    '<!--                            value="{{output.CellLink}}">-->\n' +
    '<!--                      {{output.Display}}-->\n' +
    '<!--                    </option>-->\n' +
    '<!--                  </select>-->\n' +
    '<!--                </div>-->\n' +
    '                <div class="col-sm-3"\n' +
    '                     style="padding-left: 0px;!important;">\n' +
    '                  <select class="btn btn-default form-control"\n' +
    '                          ng-init="sendback.SendBack = sendback.SendBack"\n' +
    '                          ng-model="sendback.SendBack"\n' +
    '                          ng-options="io.CellLink as io.Display for io in appCtrl.allDataStructureComponents">\n' +
    '                  </select>\n' +
    '                </div>\n' +
    '              </div>\n' +
    '              <div class="row table-padding">\n' +
    '                <div class="col-sm-1">\n' +
    '                  <button class="btn btn-success"\n' +
    '                          ng-click="appCtrl.addSendBack();"><span\n' +
    '                      class="glyphicon glyphicon-plus"></span></button>\n' +
    '                </div>\n' +
    '              </div>\n' +
    '            </div>\n' +
    '          </tab>\n' +
    '        </tabset>\n' +
    '      </div>\n' +
    '\n' +
    '      <div class="col-sm-12"\n' +
    '           ng-show="appCtrl.selectedMenu.Command == \'METALOG_DISPLAY\'">\n' +
    '        <div class="row">\n' +
    '          <div class="col-sm-6">\n' +
    '            <h4>{{appCtrl.selectedMenu.Command}}</h4>\n' +
    '          </div>\n' +
    '          <div class="col-sm-3">\n' +
    '            <h4>\n' +
    '              <input type="checkbox" ng-model="appCtrl.selectedMenu.Visible">Visible\n' +
    '            </h4>\n' +
    '          </div>\n' +
    '          <div class="col-sm-3">\n' +
    '            <h4>\n' +
    '              <input type="checkbox"\n' +
    '                     ng-model="appCtrl.selectedMenu.UsePostProcessingOutputs">Use\n' +
    '              Post\n' +
    '              Processing\n' +
    '            </h4>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <tabset class="animated fadeIn">\n' +
    '          <tab heading="MetalogKeys">\n' +
    '            <div>\n' +
    '              <div class="col-sm-6">\n' +
    '                <h4>Included MetalogKeys</h4>\n' +
    '              </div>\n' +
    '              <div class="col-sm-6">\n' +
    '                <h4>Excluded MetalogKeys</h4>\n' +
    '              </div>\n' +
    '\n' +
    '              <div class="col-sm-6" style=" height:420px;overflow: auto;">\n' +
    '                <div class="list-of-templates">\n' +
    '                  <ul class="list-group">\n' +
    '                    <li class="list-group-item"\n' +
    '                        ng-repeat="key in appCtrl.selectedMenu.Parameters.MetaLogKeys">\n' +
    '                      <div class="no-wrap">\n' +
    '                        <a class="text-danger">\n' +
    '                          <i class="fa fa-minus-square fa-lg"\n' +
    '                             ng-click="appCtrl.selectWithinMetalog(key)"></i>\n' +
    '                        </a>\n' +
    '                        {{appCtrl.findKey(appCtrl.outputs)(key).Display}}\n' +
    '                      </div>\n' +
    '                    </li>\n' +
    '                  </ul>\n' +
    '                </div>\n' +
    '              </div>\n' +
    '\n' +
    '              <div class="col-sm-6" style=" height:420px;overflow: auto;">\n' +
    '                <div class="list-of-templates">\n' +
    '                  <ul class="list-group">\n' +
    '                    <li class="list-group-item"\n' +
    '                        ng-repeat="key in appCtrl.tornadoValueMetricKeys"\n' +
    '                        ng-show="appCtrl.selectedMenu.Parameters.MetaLogKeys.indexOf(key)===-1">\n' +
    '                      <div class="no-wrap">\n' +
    '                        <a href="" class="text-success">\n' +
    '                          <i class="fa fa-plus-square fa-lg"\n' +
    '                             ng-click="appCtrl.selectWithinMetalog(key)"></i>\n' +
    '                        </a>\n' +
    '                        {{appCtrl.findKey(appCtrl.outputs)(key).Display}}\n' +
    '                      </div>\n' +
    '                    </li>\n' +
    '                  </ul>\n' +
    '                </div>\n' +
    '              </div>\n' +
    '\n' +
    '            </div>\n' +
    '          </tab>\n' +
    '          <tab heading="Explanation">\n' +
    '            <div class="container-fluid">\n' +
    '              <div class="row table-padding">\n' +
    '                <div class="col-sm-1">\n' +
    '                  <i style="cursor:pointer"\n' +
    '                     data-toggle="popover"\n' +
    '                     data-placement="right"\n' +
    '                     data-content="{{tableItem}}"\n' +
    '                     class="fa fa-question-circle"\n' +
    '                     ng-click="metalogHelpIcon=!metalogHelpIcon"\n' +
    '                  >\n' +
    '                  </i>\n' +
    '                </div>\n' +
    '                <div ng-if="metalogHelpIcon === true">\n' +
    '                  <div class="col-sm-10">\n' +
    '                    </p>\n' +
    '                    The text entered here will be used to explain the metalog in\n' +
    '                    the system.\n' +
    '                    </p>\n' +
    '                  </div>\n' +
    '                </div>\n' +
    '              </div>\n' +
    '            </div>\n' +
    '\n' +
    '            <div class="container-fluid">\n' +
    '              <div class="row table-padding">\n' +
    '                <div class="col-sm-1 text-right">\n' +
    '\n' +
    '                </div>\n' +
    '                <div class="col-sm-6" colspan="20">\n' +
    '                  <textarea type="text"\n' +
    '                            rows="10"\n' +
    '                            ng-model="appCtrl.selectedMenu.Parameters.FittedPointExplanation"\n' +
    '                            class="form form-control"></textarea>\n' +
    '                </div>\n' +
    '              </div>\n' +
    '            </div>\n' +
    '          </tab>\n' +
    '          <tab heading="FailureBranch">\n' +
    '            <div class="container-fluid" style="height:470px;overflow:auto;">\n' +
    '\n' +
    '              <div class="row table-padding">\n' +
    '                <div class="col-sm-1">\n' +
    '                  <i style="cursor:pointer"\n' +
    '                     data-toggle="popover"\n' +
    '                     data-placement="right"\n' +
    '                     data-content="{{tableItem}}"\n' +
    '                     class="fa fa-question-circle"\n' +
    '                     ng-click="showFittedPointsHelp=!showFittedPointsHelp"\n' +
    '                  >\n' +
    '                  </i>\n' +
    '                </div>\n' +
    '                <div ng-if="showFittedPointsHelp === true">\n' +
    '                  <div class="col-sm-10">\n' +
    '                    </p>\n' +
    '                    Use this to define stages of failure. Probability of\n' +
    '                    Failure at any given stage must be defined as\n' +
    '                    Probability\n' +
    '                    of Success at all earlier stages x Probability of\n' +
    '                    failure\n' +
    '                    at the given stage. Similarly, the cumulative cost is\n' +
    '                    the\n' +
    '                    cost of previous stages and current stage. Here is a\n' +
    '                    <a href="http://devblog.smartorg.com/single-post.php?id=25734&at=f0b9496fa3bbb364d506af38f"\n' +
    '                       target="_blank">blog post</a>\n' +
    '                    that helps you through this.\n' +
    '                    </p>\n' +
    '                  </div>\n' +
    '                </div>\n' +
    '              </div>\n' +
    '\n' +
    '              <div\n' +
    '                  ng-repeat="stage in appCtrl.selectedMenu.Parameters.FailureBranch.Stages track by $index">\n' +
    '                <div class="row table-padding">\n' +
    '                  <!--<div class="col-sm-2">-->\n' +
    '                  <!--<b>NodeLookup</b>-->\n' +
    '                  <!--</div>-->\n' +
    '                  <!--<div class="col-sm-3">-->\n' +
    '                  <!--<input type="text" class="form form-control"-->\n' +
    '                  <!--ng-model="stage.NodeLookup">-->\n' +
    '                  <!--</div>-->\n' +
    '                  <div class="col-sm-2">\n' +
    '                    <b>Probability of Failure of Stage Key</b>\n' +
    '                  </div>\n' +
    '                  <div class="col-sm-3">\n' +
    '                    <!--{{stage}}&#45;&#45;&#45;&#45;-->\n' +
    '                    <!--{{stage.ProbabilityKey}}-->\n' +
    '                    <select\n' +
    '                        ng-options="output.Key as output.Key for output in appCtrl.outputs"\n' +
    '                        class="form form-control"\n' +
    '                        ng-model="stage.ProbabilityFailureOfStageKey"\n' +
    '                        ng-init="stage.ProbabilityFailureOfStageKey = stage.ProbabilityFailureOfStageKey">\n' +
    '                    </select>\n' +
    '                  </div>\n' +
    '                  <div class="col-sm-2">\n' +
    '                    <b>Cumulative Cost of Stage Key</b>\n' +
    '                  </div>\n' +
    '                  <div class="col-sm-3">\n' +
    '                    <!--<input type="text" class="form form-control"-->\n' +
    '                    <!--ng-model="stage.SubtractionValueKey">-->\n' +
    '                    <select\n' +
    '                        ng-options="output.Key as output.Key for output in appCtrl.outputs"\n' +
    '                        class="form form-control"\n' +
    '                        ng-model="stage.CumeCostOfStageKey"\n' +
    '                        ng-init="stage.CumeCostOfStageKey = stage.CumeCostOfStageKey">\n' +
    '                    </select>\n' +
    '                  </div>\n' +
    '                  <div class="col-sm-1">\n' +
    '                    <button class="btn btn-danger"\n' +
    '                            ng-click="appCtrl.deleteFailurebranchStage($index)"><span\n' +
    '                        class="glyphicon glyphicon-trash"></span></button>\n' +
    '                  </div>\n' +
    '                </div>\n' +
    '              </div>\n' +
    '              <!--<div class="row table-padding" ng-show="appCtrl.failurebranchFlag">-->\n' +
    '              <!--<div class="col-sm-4">-->\n' +
    '              <!--<b>SubtractCostGivenSuccess</b>-->\n' +
    '              <!--</div>-->\n' +
    '              <!--<div class="col-sm-2">-->\n' +
    '              <!--<select class="form form-control"-->\n' +
    '              <!--ng-options="o.value as o.value for o in [{value: false}, {value:true}]"-->\n' +
    '              <!--ng-model="appCtrl.selectedMenu.Parameters.FailureBranch.SubtractCostGivenSuccess"-->\n' +
    '              <!--ng-init="appCtrl.selectedMenu.Parameters.FailureBranch.SubtractCostGivenSuccess=-->\n' +
    '              <!--appCtrl.selectedMenu.Parameters.FailureBranch.SubtractCostGivenSuccess"></select>-->\n' +
    '              <!--</div>-->\n' +
    '              <!--</div>-->\n' +
    '              <div class="row table-padding">\n' +
    '                <div class="col-sm-1">\n' +
    '                  <button class="btn btn-success"\n' +
    '                          ng-click="appCtrl.addFailurebranch();"><span\n' +
    '                      class="glyphicon glyphicon-plus"></span></button>\n' +
    '                </div>\n' +
    '              </div>\n' +
    '\n' +
    '            </div>\n' +
    '          </tab>\n' +
    '          <tab heading="Simulation">\n' +
    '            <div class="container-fluid">\n' +
    '              <div class="row table-padding">\n' +
    '                <div class="col-sm-1 text-right">\n' +
    '\n' +
    '                </div>\n' +
    '                <div class="col-sm-6" colspan="20">\n' +
    '                  <div class="checkbox">\n' +
    '                    <label><input type="checkbox"\n' +
    '                                  ng-model="appCtrl.selectedMenu.Parameters.CalcMVSFromFittedPoints"\n' +
    '                                  value=""><b>Calculate\n' +
    '                      Mean, Variance and Skewness from Fitted Points</b>\n' +
    '                    </label>\n' +
    '                  </div>\n' +
    '                </div>\n' +
    '              </div>\n' +
    '            </div>\n' +
    '          </tab>\n' +
    '        </tabset>\n' +
    '      </div>\n' +
    '\n' +
    '      <div class="col-sm-12"\n' +
    '           ng-show="appCtrl.selectedMenu.Command == \'COMPARE_UNCERTAINTY\'">\n' +
    '        <div class="col-sm-6">\n' +
    '          <h4>{{appCtrl.selectedMenu.Command}}</h4>\n' +
    '          <div>\n' +
    '            <h4>There\'s nothing to customize in this menu item</h4>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div class="col-sm-6">\n' +
    '          <h4>\n' +
    '            <input type="checkbox" ng-model="appCtrl.selectedMenu.Visible">Visible\n' +
    '          </h4>\n' +
    '        </div>\n' +
    '        <!--<div>-->\n' +
    '        <!--<h4>There\'s nothing to customize in this menu item</h4>-->\n' +
    '        <!--</div>-->\n' +
    '      </div>\n' +
    '\n' +
    '      <div class="col-sm-12"\n' +
    '           ng-show="appCtrl.selectedMenu.Command == \'CFO_CHART\'">\n' +
    '        <div class="col-sm-12">\n' +
    '          <div class="col-sm-6">\n' +
    '            <h4>{{appCtrl.selectedMenu.Command}}</h4>\n' +
    '          </div>\n' +
    '          <div class="col-sm-6">\n' +
    '            <h4>\n' +
    '              <input type="checkbox" ng-model="appCtrl.selectedMenu.Visible">Visible\n' +
    '            </h4>\n' +
    '          </div>\n' +
    '\n' +
    '          <div ng-repeat="set in appCtrl.selectedMenu.Parameters.Sets">\n' +
    '            <div class="col-sm-12">\n' +
    '              <div class="row table-padding">\n' +
    '                <div class="col-sm-3">\n' +
    '                  <b>X Axis</b>\n' +
    '                </div>\n' +
    '                <div class="col-sm-3">\n' +
    '                  <b>X Title</b>\n' +
    '                </div>\n' +
    '                <div class="col-sm-3">\n' +
    '                  <b>Name</b>\n' +
    '                </div>\n' +
    '              </div>\n' +
    '            </div>\n' +
    '\n' +
    '            <div class="row table-padding">\n' +
    '              <div class="col-sm-3">\n' +
    '                <select\n' +
    '                    ng-options="output.Key as appCtrl.getOutputDisplayFromKey(output.Key) for output in appCtrl.allOutputs"\n' +
    '                    class="form form-control"\n' +
    '                    ng-init="xKey = appCtrl.getKeyFrom(set.AverageCost);"\n' +
    '                    ng-model="xKey"\n' +
    '                    ng-change="set.AverageCost = appCtrl.buildOutputFromKey(xKey);\n' +
    '                                set.xTitle = appCtrl.getOutputDisplayFromKey(xKey);"></select>\n' +
    '              </div>\n' +
    '\n' +
    '              <div class="col-sm-3">\n' +
    '                <input type="text" class="form form-control"\n' +
    '                       ng-model="set.xTitle">\n' +
    '              </div>\n' +
    '              <div class="col-sm-3">\n' +
    '                <input type="text" class="form form-control"\n' +
    '                       ng-model="set.name">\n' +
    '              </div>\n' +
    '            </div>\n' +
    '\n' +
    '            <div class="col-sm-12">\n' +
    '              <div class="row table-padding">\n' +
    '                <div class="col-sm-3">\n' +
    '                  <b>Y Axis</b>\n' +
    '                </div>\n' +
    '                <div class="col-sm-3">\n' +
    '                  <b>Y Title</b>\n' +
    '                </div>\n' +
    '              </div>\n' +
    '            </div>\n' +
    '            <div class="row table-padding">\n' +
    '              <div class="col-sm-3">\n' +
    '                <select\n' +
    '                    ng-options="output.Key as appCtrl.getOutputDisplayFromKey(output.Key) for output in appCtrl.allOutputs"\n' +
    '                    class="form form-control"\n' +
    '                    ng-init="yKey = appCtrl.getKeyFrom(set.AverageValueMinusCost);"\n' +
    '                    ng-model="yKey"\n' +
    '                    ng-change="set.AverageValueMinusCost = appCtrl.buildOutputFromKey(yKey);set.yTitle = appCtrl.getOutputDisplayFromKey(yKey);"></select>\n' +
    '              </div>\n' +
    '              <div class="col-sm-3">\n' +
    '                <input type="text" class="form form-control"\n' +
    '                       ng-model="set.yTitle">\n' +
    '              </div>\n' +
    '              <div class="col-sm-1">\n' +
    '                <button class="btn btn-danger"\n' +
    '                        ng-click="appCtrl.deleteCFOChartItem($index);"><span\n' +
    '                    class="glyphicon glyphicon-trash"></span></button>\n' +
    '              </div>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '\n' +
    '          <div class="row table-padding">\n' +
    '            <div class="col-sm-1">\n' +
    '              <button class="btn btn-success"\n' +
    '                      ng-click="appCtrl.addCFOChartItem();"><span\n' +
    '                  class="glyphicon glyphicon-plus"></span></button>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '\n' +
    '      <div class="col-sm-12"\n' +
    '           ng-show="appCtrl.selectedMenu.Command == \'INNOVATION_SCREEN\'">\n' +
    '        <div class="col-sm-12">\n' +
    '          <div class="col-sm-6">\n' +
    '            <h4>{{appCtrl.selectedMenu.Command}}</h4>\n' +
    '          </div>\n' +
    '          <div class="col-sm-6">\n' +
    '            <h4>\n' +
    '              <input type="checkbox" ng-model="appCtrl.selectedMenu.Visible">Visible\n' +
    '            </h4>\n' +
    '          </div>\n' +
    '          <div ng-repeat="set in appCtrl.selectedMenu.Parameters.Sets">\n' +
    '            <div class="row table-padding">\n' +
    '              <div class="col-sm-2">\n' +
    '                <b>X Axis</b>\n' +
    '              </div>\n' +
    '              <div class="col-sm-3">\n' +
    '                <select\n' +
    '                    ng-options="output.Key as appCtrl.getOutputDisplayFromKey(output.Key) for output in appCtrl.allOutputs"\n' +
    '                    class="form form-control"\n' +
    '                    ng-init="xKey = appCtrl.getKeyFrom(set.x);"\n' +
    '                    ng-model="xKey"\n' +
    '                    ng-change="set.x = appCtrl.buildOutputFromKey(xKey);\n' +
    '                    set.xTitle = appCtrl.getOutputDisplayFromKey(xKey);"></select>\n' +
    '              </div>\n' +
    '              <div class="col-sm-2">\n' +
    '                <b>X Title</b>\n' +
    '              </div>\n' +
    '              <div class="col-sm-3">\n' +
    '                <input type="text" class="form form-control"\n' +
    '                       ng-model="set.xTitle">\n' +
    '              </div>\n' +
    '            </div>\n' +
    '            <div class="row table-padding">\n' +
    '              <div class="col-sm-2">\n' +
    '                <b>Y Axis</b>\n' +
    '              </div>\n' +
    '              <div class="col-sm-3">\n' +
    '                <select\n' +
    '                    ng-options="output.Key as appCtrl.getOutputDisplayFromKey(output.Key) for output in appCtrl.allOutputs"\n' +
    '                    class="form form-control"\n' +
    '                    ng-init="yKey = appCtrl.getKeyFrom(set.y);"\n' +
    '                    ng-model="yKey"\n' +
    '                    ng-change="set.y = appCtrl.buildOutputFromKey(yKey);set.yTitle = appCtrl.getOutputDisplayFromKey(yKey);"></select>\n' +
    '              </div>\n' +
    '              <div class="col-sm-2">\n' +
    '                <b>Y Title</b>\n' +
    '              </div>\n' +
    '              <div class="col-sm-3">\n' +
    '                <input type="text" class="form form-control"\n' +
    '                       ng-model="set.yTitle">\n' +
    '              </div>\n' +
    '            </div>\n' +
    '            <div class="row table-padding">\n' +
    '              <div class="col-sm-2">\n' +
    '                <b>Vertical Cut-off</b>\n' +
    '              </div>\n' +
    '              <div class="col-sm-3">\n' +
    '                <input type="number" class="form form-control"\n' +
    '                       ng-model="set.VerticalCutoff">\n' +
    '              </div>\n' +
    '\n' +
    '              <div class="col-sm-2">\n' +
    '                <b>Name</b>\n' +
    '              </div>\n' +
    '              <div class="col-sm-3">\n' +
    '                <input type="text" class="form form-control"\n' +
    '                       ng-model="set.name">\n' +
    '              </div>\n' +
    '\n' +
    '              <div class="col-sm-1">\n' +
    '                <button class="btn btn-danger"\n' +
    '                        ng-click="appCtrl.deleteInnovationScreenItem($index);"><span\n' +
    '                    class="glyphicon glyphicon-trash"></span></button>\n' +
    '              </div>\n' +
    '            </div>\n' +
    '\n' +
    '          </div><!-- end of ng-repeat -->\n' +
    '          <div class="row table-padding">\n' +
    '            <div class="col-sm-1">\n' +
    '              <button class="btn btn-success"\n' +
    '                      ng-click="appCtrl.addInnovationScreenItem();"><span\n' +
    '                  class="glyphicon glyphicon-plus"></span></button>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '\n' +
    '      <div class="col-sm-12"\n' +
    '           ng-show="appCtrl.selectedMenu.Command == \'SCATTER_PLOT\'">\n' +
    '        <div class="col-sm-12">\n' +
    '          <div class="col-sm-6">\n' +
    '            <h4>{{appCtrl.selectedMenu.Command}}</h4>\n' +
    '          </div>\n' +
    '          <div class="col-sm-6">\n' +
    '            <h4>\n' +
    '              <input type="checkbox" ng-model="appCtrl.selectedMenu.Visible">Visible\n' +
    '            </h4>\n' +
    '          </div>\n' +
    '          <div class="row table-padding">\n' +
    '            <div class="col-sm-2">\n' +
    '              <b>Use Same Scale</b>\n' +
    '            </div>\n' +
    '            <div class="col-sm-3">\n' +
    '              <input type="checkbox"\n' +
    '                     ng-model="appCtrl.selectedMenu.Parameters.SameScale">\n' +
    '            </div>\n' +
    '          </div>\n' +
    '          <div class="row table-padding">\n' +
    '            <div class="col-sm-2">\n' +
    '              <b>Min</b>\n' +
    '            </div>\n' +
    '            <div class="col-sm-3">\n' +
    '              <input type="number" class="form form-control"\n' +
    '                     ng-model="appCtrl.selectedMenu.Parameters.Min">\n' +
    '            </div>\n' +
    '            <div class="col-sm-2">\n' +
    '              <b>Max</b>\n' +
    '            </div>\n' +
    '            <div class="col-sm-3">\n' +
    '              <input type="number" class="form form-control"\n' +
    '                     ng-model="appCtrl.selectedMenu.Parameters.Max">\n' +
    '            </div>\n' +
    '          </div>\n' +
    '\n' +
    '          <div ng-repeat="set in appCtrl.selectedMenu.Parameters.Sets">\n' +
    '            <div class="row table-padding">\n' +
    '              <div class="col-sm-2"><h3>Series {{$index + 1}}</h3></div>\n' +
    '            </div>\n' +
    '            <div class="row table-padding">\n' +
    '              <div class="col-sm-2"><b>Name</b></div>\n' +
    '              <div class="col-sm-3"\n' +
    '                   ng-class="{\'has-error\': (set.name === undefined || set.name === \'\') && appCtrl.selectedMenu.Parameters.Sets.length > 1}">\n' +
    '                <input type="text" class="form form-control"\n' +
    '                       ng-model="set.name">\n' +
    '              </div>\n' +
    '            </div>\n' +
    '            <div class="row table-padding">\n' +
    '              <div class="col-sm-2">\n' +
    '                <b>X Axis</b>\n' +
    '              </div>\n' +
    '              <div class="col-sm-3">\n' +
    '                <select\n' +
    '                    ng-options="output.Key as appCtrl.getOutputDisplayFromKey(output.Key) for output in appCtrl.allOutputs"\n' +
    '                    class="form form-control"\n' +
    '                    ng-init="xKey = appCtrl.getKeyFrom(set.x);"\n' +
    '                    ng-model="xKey"\n' +
    '                    ng-change="set.x = appCtrl.buildOutputFromKey(xKey);set.xTitle = appCtrl.getOutputDisplayFromKey(xKey);"></select>\n' +
    '              </div>\n' +
    '\n' +
    '              <div class="col-sm-2">\n' +
    '                <b>X Title</b>\n' +
    '              </div>\n' +
    '              <div class="col-sm-3">\n' +
    '                <input type="text" class="form form-control"\n' +
    '                       ng-model="set.xTitle">\n' +
    '              </div>\n' +
    '            </div>\n' +
    '            <div class="row table-padding">\n' +
    '              <div class="col-sm-2">\n' +
    '                <b>Y Axis</b>\n' +
    '              </div>\n' +
    '              <div class="col-sm-3">\n' +
    '                <select\n' +
    '                    ng-options="output.Key as appCtrl.getOutputDisplayFromKey(output.Key) for output in appCtrl.allOutputs"\n' +
    '                    class="form form-control"\n' +
    '                    ng-init="yKey = appCtrl.getKeyFrom(set.y);"\n' +
    '                    ng-model="yKey"\n' +
    '                    ng-change="set.y = appCtrl.buildOutputFromKey(yKey);set.yTitle = appCtrl.getOutputDisplayFromKey(yKey);"></select>\n' +
    '              </div>\n' +
    '              <div class="col-sm-2">\n' +
    '                <b>Y Title</b>\n' +
    '              </div>\n' +
    '              <div class="col-sm-3">\n' +
    '                <input type="text" class="form form-control"\n' +
    '                       ng-model="set.yTitle">\n' +
    '              </div>\n' +
    '              <div class="col-sm-2">\n' +
    '                <button class="btn btn-danger"\n' +
    '                        ng-click="appCtrl.deleteScatterPlotItem($index);"><span\n' +
    '                    class="glyphicon glyphicon-trash"></span></button>\n' +
    '              </div>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '          <div class="col-sm-2">\n' +
    '            <button class="btn btn-success"\n' +
    '                    ng-click="appCtrl.addScatterPlotItem();"><span\n' +
    '                class="glyphicon glyphicon-plus"></span></button>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '\n' +
    '      <div class="col-sm-12"\n' +
    '           ng-show="appCtrl.selectedMenu.Command == \'BUCKET_CHART\'">\n' +
    '        <div class="col-sm-12">\n' +
    '          <div class="col-sm-6">\n' +
    '            <h4>{{appCtrl.selectedMenu.Command}}</h4>\n' +
    '          </div>\n' +
    '          <div class="col-sm-6">\n' +
    '            <h4>\n' +
    '              <input type="checkbox" ng-model="appCtrl.selectedMenu.Visible">Visible\n' +
    '            </h4>\n' +
    '          </div>\n' +
    '\n' +
    '          <!--Below had ng-repeat, may need ng-repeat later-->\n' +
    '          <!--class="panel"-->\n' +
    '          <div\n' +
    '              ng-repeat="s in appCtrl.selectedMenu.Parameters.Sets track by $index">\n' +
    '            <div>\n' +
    '              <div class="row table-padding">\n' +
    '                <div class="col-sm-2"\n' +
    '                     ng-class="{\'has-error\': (s.Title === undefined || s.Title === \'\') && appCtrl.selectedMenu.Parameters.Sets.length > 1}">\n' +
    '                  <b>Title</b>\n' +
    '                </div>\n' +
    '                <div class="col-sm-3">\n' +
    '                  <input type="text" class="form form-control"\n' +
    '                         ng-model="s.Title">\n' +
    '                </div>\n' +
    '                <div class="col-sm-2">\n' +
    '                  <b>Counts</b>\n' +
    '                </div>\n' +
    '                <div class="col-sm-3">\n' +
    '                  <select type="text" class="form form-control"\n' +
    '                          ng-model="s.Counts"\n' +
    '                          ng-options="o.v as o.v for o in [{v:false}, {v:true}]">\n' +
    '                  </select>\n' +
    '                </div>\n' +
    '              </div>\n' +
    '              <div class="row table-padding">\n' +
    '                <div class="col-sm-2">\n' +
    '                  <b>X Axis</b>\n' +
    '                </div>\n' +
    '                <div class="col-sm-3">\n' +
    '                  <select type="text" class="form form-control"\n' +
    '                          ng-model="s.Key"\n' +
    '                          ng-options="output.Key as appCtrl.getOutputDisplayFromKey(output.Key) for output in appCtrl.allOutputs">\n' +
    '                  </select>\n' +
    '                </div>\n' +
    '                <div class="col-sm-2">\n' +
    '                  <b>X Label</b>\n' +
    '                </div>\n' +
    '                <div class="col-sm-3">\n' +
    '                  <input type="text" class="form form-control"\n' +
    '                         ng-model="s.xTitle">\n' +
    '                </div>\n' +
    '              </div>\n' +
    '              <div class="row table-padding">\n' +
    '                <div class="col-sm-2">\n' +
    '                  <b>Y Label</b>\n' +
    '                </div>\n' +
    '                <div class="col-sm-3">\n' +
    '                  <input type="text" class="form form-control"\n' +
    '                         ng-model="s.yTitle">\n' +
    '                </div>\n' +
    '              </div>\n' +
    '\n' +
    '              <!--&& appCtrl.bucketManagers[$index].indicator-->\n' +
    '              <div class="row">&nbsp;</div>\n' +
    '              <div class="row table-padding well"\n' +
    '                   ng-if="s.xBuckets.length===0 && !appCtrl.bucketManagers[$index] ">\n' +
    '                <div class="col-sm-2">\n' +
    '                  Buckets<br/>\n' +
    '                  <input type="number" min="1" class="form form-control"\n' +
    '                         ng-init="s.xBuckets.length"\n' +
    '                         ng-model="appCtrl.numBuckets">\n' +
    '                </div>\n' +
    '                <div class="col-sm-2">Low<br/><input type="text"\n' +
    '                                                     class="form-control"\n' +
    '                                                     ng-model="appCtrl.bucketLow">\n' +
    '                </div>\n' +
    '                <div class="col-sm-2">High<br/><input type="text"\n' +
    '                                                      class="form-control"\n' +
    '                                                      ng-model="appCtrl.bucketHigh">\n' +
    '                </div>\n' +
    '                <div class="col-sm-1">\n' +
    '                  <br/>\n' +
    '                  <button class="btn btn-primary"\n' +
    '                          ng-click="appCtrl.generateBuckets($index);">Generate\n' +
    '                    Buckets\n' +
    '                  </button>\n' +
    '                </div>\n' +
    '              </div>\n' +
    '\n' +
    '              <div class="row table-padding"\n' +
    '                   ng-if="appCtrl.bucketManagers[$index].editing===false">\n' +
    '                <div class="col-md-9">\n' +
    '                  <b>Buckets: <span\n' +
    '                      ng-repeat="bucket in appCtrl.bucketManagers[$index].editableBuckets track by $index">{{bucket.Name}}<span\n' +
    '                      ng-show="$index < appCtrl.bucketManagers[$parent.$index].editableBuckets.length-1">,</span>\n' +
    '                   </span> <i class="pull-righ glyphicon glyphicon-pencil"\n' +
    '                              ng-click="appCtrl.bucketManagers[$index].makeEditable()"></i></b>\n' +
    '                </div>\n' +
    '              </div>\n' +
    '              <div class="row table-padding"\n' +
    '                   ng-if="appCtrl.bucketManagers[$index].editing===true">\n' +
    '                <div class="col-md-3"></div>\n' +
    '                <div class="col-md-6">\n' +
    '                  <table\n' +
    '                      class="table table-bordered table-striped table-condensed">\n' +
    '                    <thead>\n' +
    '                    <th>Bucket Label</th>\n' +
    '                    <th>Bucket Rule</th>\n' +
    '                    </thead>\n' +
    '                    <tbody>\n' +
    '                    <tr ng-repeat="bucket in appCtrl.bucketManagers[$index].editableBuckets track by $index">\n' +
    '\n' +
    '                      <td>\n' +
    '                        <div ng-if="bucket.nameEditable === true">\n' +
    '                          <input class="form-control input-sm" type="text"\n' +
    '                                 ng-model="bucket.Name"\n' +
    '                                 ng-if="bucket.nameEditable === true"/>\n' +
    '                          <span>\n' +
    '                            <button class="btn btn-primary btn-sm"\n' +
    '                                    style="margin-top: 15px;"\n' +
    '                                    ng-click="appCtrl.toggleNameEdit(bucket, $parent.$parent.$index)">Done\n' +
    '                          </button>\n' +
    '                          </span>\n' +
    '                        </div>\n' +
    '                        <br/>\n' +
    '                        <span\n' +
    '                            ng-if="bucket.nameEditable===false || !bucket.nameEditable">{{bucket.Name}}\n' +
    '                            <br/>\n' +
    '                        <i class="pull-righ glyphicon glyphicon-pencil"\n' +
    '                           ng-click="appCtrl.toggleNameEdit(bucket, $parent.$parent.$index)"></i></span>\n' +
    '                      </td>\n' +
    '                      <td>\n' +
    '                        <!-- ng-if creates an extra scope on angular. -->\n' +
    '                        <div ng-if="bucket.rulesEditable===true">\n' +
    '                          <select\n' +
    '                              class="form-control input-sm"\n' +
    '                              ng-model="bucket.rule1Type"\n' +
    '                              ng-options="rule as rule.Label for rule in appCtrl.bucketManagers[$parent.$parent.$index].rule1Options">\n' +
    '                          </select>\n' +
    '                          <input type="text" class="form-control input-sm"\n' +
    '                                 ng-model="bucket.rule1Value"\n' +
    '                                 ng-if="bucket.rule1Type.Value!==\'NONE\'"/><br/>\n' +
    '                          <select\n' +
    '                              class="form-control input-sm"\n' +
    '                              ng-model="bucket.rule2Type"\n' +
    '                              ng-options="rule as rule.Label for rule in appCtrl.bucketManagers[$parent.$parent.$index].rule2Options">\n' +
    '                          </select>\n' +
    '                          <input type="text" class="form-control input-sm"\n' +
    '                                 ng-model="bucket.rule2Value"\n' +
    '                                 ng-if="bucket.rule2Type.Value!==\'NONE\'"/><br/>\n' +
    '\n' +
    '                          <button class="btn btn-primary btn-sm"\n' +
    '                                  ng-click="appCtrl.toggleRuleEdit(bucket, $parent.$parent.$index)">\n' +
    '                            Done\n' +
    '                          </button>\n' +
    '                        </div>\n' +
    '                        <div\n' +
    '                            ng-if="bucket.rulesEditable==false || !bucket.rulesEditable">\n' +
    '                          {{bucket.rule1Type.Label}}&nbsp{{bucket.rule1Value}}<br/>\n' +
    '                          {{bucket.rule2Type.Label}}&nbsp{{bucket.rule2Value}}<br/>\n' +
    '                          <i class="pull-righ glyphicon glyphicon-pencil"\n' +
    '                             ng-click="appCtrl.toggleRuleEdit(bucket, $parent.$parent.$index)"></i></span>\n' +
    '                        </div>\n' +
    '                      </td>\n' +
    '                    </tr>\n' +
    '                    </tbody>\n' +
    '                  </table>\n' +
    '                  <div style="text-align: center">\n' +
    '                    <button class="btn btn-primary"\n' +
    '                            ng-click="appCtrl.addBucket($index)">Add Bucket\n' +
    '                    </button>\n' +
    '                    <button class="btn btn-primary"\n' +
    '                            ng-click="appCtrl.deleteBucket($index)"\n' +
    '                            ng-disabled="appCtrl.bucketManagers[$index].editableBuckets.length === 0">\n' +
    '                      Delete Bucket\n' +
    '                    </button>\n' +
    '                    <button class="btn btn-primary"\n' +
    '                            ng-click="appCtrl.bucketManagers[$parent.$index].stopEditing()">\n' +
    '                      Stop Editing\n' +
    '                    </button>\n' +
    '                  </div>\n' +
    '\n' +
    '                </div>\n' +
    '              </div>\n' +
    '            </div>\n' +
    '\n' +
    '\n' +
    '            <div class="row table-padding">\n' +
    '\n' +
    '\n' +
    '              <div class="col-sm-1">\n' +
    '                <button class="btn btn-danger"\n' +
    '                        ng-click="appCtrl.deleteBucketSet($index);"><span\n' +
    '                    class="glyphicon glyphicon-trash"></span></button>\n' +
    '              </div>\n' +
    '            </div>\n' +
    '            <hr>\n' +
    '          </div>\n' +
    '\n' +
    '          <div class="row table-padding">\n' +
    '            <div class="col-sm-1">\n' +
    '              <button class="btn btn-success"\n' +
    '                      ng-click="appCtrl.addBucketChartSet();"><span\n' +
    '                  class="glyphicon glyphicon-plus"></span></button>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '\n' +
    '        </div>\n' +
    '      </div>\n' +
    '\n' +
    '      <!-- Here is Waterfall! -->\n' +
    '      <div class="col-sm-12 no-padding" ng-show="appCtrl.selectedMenu.Command == \'WATERFALL\'">\n' +
    '        <div class="row">\n' +
    '          <div class="col-sm-3" align="center">\n' +
    '            <h4>{{appCtrl.selectedMenu.Command}}</h4>\n' +
    '          </div>\n' +
    '          <div class="col-sm-offset-3 col-sm-3">\n' +
    '            <h4>\n' +
    '              <input type="checkbox" ng-model="appCtrl.selectedMenu.Visible">Visible\n' +
    '            </h4>\n' +
    '          </div>\n' +
    '          <div class="col-sm-3">\n' +
    '            <h4>\n' +
    '              <input type="checkbox" ng-model="appCtrl.selectedMenu.UsePostProcessingOutputs">Use Post Processing\n' +
    '            </h4>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '\n' +
    '        <div class="col-sm-3">\n' +
    '          <div class="list-of-templates">\n' +
    '            <div class="list-group">\n' +
    '              <a href=""\n' +
    '                 id="waterfalltable{{$index}}"\n' +
    '                 class="list-group-item"\n' +
    '                 ng-repeat="table in appCtrl.potentialTables"\n' +
    '                 ng-click="appCtrl.insertParamsToWaterfallTables(table)"\n' +
    '                 ng-class="{active: table.CellLink === appCtrl.selectedPotentialTable.CellLink}"\n' +
    '                 scroll-if="table.CellLink === appCtrl.selectedPotentialTable.CellLink">\n' +
    '                {{table.CellLink}}\n' +
    '              </a>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div class="col-sm-9" ng-show="appCtrl.selectedPotentialTable">\n' +
    '          <!-- REST CalcEngine: inline HTML table (HtmlPreview) rendered in a div -->\n' +
    '          <div ng-if="appCtrl.selectedPotentialTable.HtmlPreview"\n' +
    '               ng-bind-html="appCtrl.selectedPotentialTable.HtmlPreview | tablePreviewHtml"\n' +
    '               style="width:100%; overflow:auto;"></div>\n' +
    '          <!-- Legacy SOAP: PNG preview -->\n' +
    '          <img\n' +
    '              ng-if="!appCtrl.selectedPotentialTable.HtmlPreview"\n' +
    '              src="{{appCtrl.server}}{{appCtrl.selectedPotentialTable.PreviewURL}}"\n' +
    '              alt="{{appCtrl.selectedPotentialTable.CellLink}}" width="100%">\n' +
    '        </div>\n' +
    '        <div class="col-sm-9"><br></div>\n' +
    '        <div ng-repeat="params in appCtrl.waterfall track by $index">\n' +
    '          <div class="col-sm-8">\n' +
    '            <div class="col-sm-12 col-sm-3" align="right">\n' +
    '              <h5>OutputKey</h5>\n' +
    '            </div>\n' +
    '            <div class="col-sm-12 col-sm-3">\n' +
    '              <input type="text" class="form form-control" ng-model="params.OutputKey">\n' +
    '            </div>\n' +
    '            <div class="col-sm-12 col-sm-3" align="right">\n' +
    '              <h5>name</h5>\n' +
    '            </div>\n' +
    '            <div class="col-sm-12 col-sm-3">\n' +
    '              <input type="text" class="form form-control" ng-model="params.name">\n' +
    '            </div>\n' +
    '          </div>\n' +
    '          <div class="col-sm-1"></div>\n' +
    '          <div class="col-sm-8">\n' +
    '            <div class="col-sm-12 col-sm-3" align="right">\n' +
    '              <h5>Units</h5>\n' +
    '            </div>\n' +
    '            <div class="col-sm-12 col-sm-3">\n' +
    '              <input type="text" class="form form-control" ng-model="params.Units">\n' +
    '            </div>\n' +
    '            <div class="col-sm-12 col-sm-3" align="right">\n' +
    '              <h5>yTitle</h5>\n' +
    '            </div>\n' +
    '            <div class="col-sm-12 col-sm-3">\n' +
    '              <input type="text" class="form form-control" ng-model="params.yTitle">\n' +
    '            </div>\n' +
    '          </div>\n' +
    '          <div class="col-sm-1">\n' +
    '            <button class="btn btn-danger" ng-click="appCtrl.deleteTableInWaterfall($index)">\n' +
    '              <span class="glyphicon glyphicon-trash"></span>\n' +
    '            </button>\n' +
    '          </div>\n' +
    '          <div class="col-sm-9"><br></div>\n' +
    '        </div>\n' +
    '        <div class="col-sm-offset-8 col-sm-1">\n' +
    '          <button class="btn btn-success" ng-click="appCtrl.addNewParamsToWaterfall()">\n' +
    '            <span class="glyphicon glyphicon-plus"></span>\n' +
    '          </button>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '\n' +
    '\n' +
    '    </div><!--Right side-->\n' +
    '\n' +
    '  </div>\n' +
    '\n' +
    '\n' +
    '  <div class="col-sm-12 text-center align-to-bottom">\n' +
    '    <a href="#/datastructure/{{appCtrl.selectedTemplate}}"\n' +
    '       class="btn btn-primary pull-left" role="button"><span\n' +
    '        class="glyphicon glyphicon-chevron-left"></span> Previous: Data\n' +
    '      Structure</a>\n' +
    '    <a href="#/portfoliostructure/{{appCtrl.selectedTemplate}}"\n' +
    '       class="btn btn-primary pull-right" role="button">Next:\n' +
    '      Portfolio Structure <span\n' +
    '          class="glyphicon glyphicon-chevron-right"></span></a>\n' +
    '    <button class="btn btn-danger" ng-disabled="appCtrl.isUnchanged()"\n' +
    '            data-toggle="modal"\n' +
    '            data-target="#commitMessageModal"><i\n' +
    '        class="fa fa-spinner fa-spin fa-lg" ng-show="!appCtrl.saveComplete"></i><span\n' +
    '        ng-show="appCtrl.saveComplete">save</span></button>\n' +
    '    <div class="col-sm-12 save-alert">\n' +
    '      <alert class="animated shake" ng-repeat="alert in appCtrl.saveAlerts"\n' +
    '             type="{{alert.type}}"\n' +
    '             close="appCtrl.closeAlert(appCtrl.saveAlerts,$index)"><i\n' +
    '          class="fa fa-exclamation-triangle fa-lg"></i>\n' +
    '        <b>Saving failed.</b> {{alert.msg}}\n' +
    '      </alert>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '\n' +
    '\n' +
    '  <!-- Delete Modal -->\n' +
    '  <div class="modal fade" id="deleteAppStructureModal" tabindex="-1"\n' +
    '       role="dialog"\n' +
    '       aria-labelledby="deleteAppStructureModalLabel" aria-hidden="true">\n' +
    '    <div class="modal-dialog">\n' +
    '      <div class="modal-content">\n' +
    '        <div class="modal-header">\n' +
    '          <button type="button" class="close" data-dismiss="modal"><span\n' +
    '              aria-hidden="true">&times;</span><span\n' +
    '              class="sr-only">Close</span></button>\n' +
    '          <h4 class="modal-title">Delete Menu Item</h4>\n' +
    '\n' +
    '        </div>\n' +
    '        <div class="modal-body">\n' +
    '          <h4 class="modal-title" id="deleteAppStructureModalLabel">Are you sure\n' +
    '            to delete <b>{{appCtrl.selectedMenu.Display}}</b>?\n' +
    '          </h4>\n' +
    '        </div>\n' +
    '        <div class="modal-footer">\n' +
    '          <button class="btn btn-primary"\n' +
    '                  ng-click="appCtrl.deleteAppStructure()">Delete\n' +
    '          </button>\n' +
    '          <button type="button" class="btn btn-default" data-dismiss="modal">\n' +
    '            Close\n' +
    '          </button>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '\n' +
    '  <!-- Edit Modal -->\n' +
    '  <div class="modal fade" id="editAppStructureModal" tabindex="-1" role="dialog"\n' +
    '       aria-labelledby="editAppStructureModalLabel" aria-hidden="true">\n' +
    '    <div class="modal-dialog">\n' +
    '      <div class="modal-content">\n' +
    '        <div class="modal-header">\n' +
    '          <button type="button" class="close" data-dismiss="modal"><span\n' +
    '              aria-hidden="true">&times;</span><span\n' +
    '              class="sr-only">Close</span></button>\n' +
    '          <h4 class="modal-title">Rename Menu Item</h4>\n' +
    '\n' +
    '        </div>\n' +
    '        <div class="modal-body">\n' +
    '          <h4>New Name:</h4>\n' +
    '          <input type="text" ng-model="appCtrl.selectedMenu.Display"\n' +
    '                 class="form form-control"/>\n' +
    '        </div>\n' +
    '        <div class="modal-footer">\n' +
    '          <button class="btn btn-primary" ng-click="appCtrl.rename()">Rename\n' +
    '          </button>\n' +
    '          <button type="button" class="btn btn-default" data-dismiss="modal">\n' +
    '            Close\n' +
    '          </button>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '\n' +
    '  <!-- New Modal -->\n' +
    '  <div class="modal fade" id="newAppStructureModal" tabindex="-1" role="dialog"\n' +
    '       aria-labelledby="newAppStructureModalLabel" aria-hidden="true">\n' +
    '    <div class="modal-dialog">\n' +
    '      <div class="modal-content">\n' +
    '        <div class="modal-header">\n' +
    '          <button type="button" class="close" data-dismiss="modal"><span\n' +
    '              aria-hidden="true">&times;</span><span\n' +
    '              class="sr-only">Close</span></button>\n' +
    '          <h4 class="modal-title">New Menu Item</h4>\n' +
    '\n' +
    '        </div>\n' +
    '        <div class="modal-body">\n' +
    '          <div class="container-fluid">\n' +
    '            <div class="row table-padding">\n' +
    '              <div class="col-sm-3 col-sm-offset-1 text-right">\n' +
    '                <h4>Name</h4>\n' +
    '              </div>\n' +
    '              <div class="col-sm-6">\n' +
    '                <input type="text" ng-model="display" class="form form-control"\n' +
    '                       id="new-display">\n' +
    '              </div>\n' +
    '            </div>\n' +
    '            <div class="row table-padding">\n' +
    '              <div class="col-sm-3 col-sm-offset-1 text-right">\n' +
    '                <h4>Command</h4>\n' +
    '              </div>\n' +
    '\n' +
    '              <!--for project app structure-->\n' +
    '              <div class="col-sm-6" ng-show="!appCtrl.isPlatform">\n' +
    '                <select ng-model="command" class="form form-control"\n' +
    '                        id="new-command-project">\n' +
    '                  <option value="INPUT_SCREEN">INPUT_SCREEN</option>\n' +
    '                  <option value="TABLE">TABLE</option>\n' +
    '                  <option value="TABLE_INPUT">TABLE_INPUT</option>\n' +
    '                  <option value="IMAGE">IMAGE</option>\n' +
    '                  <option value="TORNADODIST">TORNADODIST</option>\n' +
    '                  <option value="METALOG_DISPLAY">METALOG_DISPLAY</option>\n' +
    '                  <option value="WATERFALL">WATERFALL</option>\n' +
    '                </select>\n' +
    '              </div>\n' +
    '              <!--for platform app structure-->\n' +
    '              <div class="col-sm-6" ng-show="appCtrl.isPlatform">\n' +
    '                <select ng-model="command" class="form form-control"\n' +
    '                        id="new-command-platform">\n' +
    '                  <option value="INPUT_SCREEN">INPUT_SCREEN</option>\n' +
    '                  <option value="TABLE">TABLE</option>\n' +
    '                  <option value="TABLE_INPUT">TABLE_INPUT</option>\n' +
    '                  <option value="IMAGE">IMAGE</option>\n' +
    '                  <option value="TORNADODIST">TORNADODIST</option>\n' +
    '                  <option value="METALOG_DISPLAY">METALOG_DISPLAY</option>\n' +
    '                  <option value="COMPARE_VALUE">COMPARE_VALUE</option>\n' +
    '                  <option value="COMPARE_UNCERTAINTY">COMPARE_UNCERTAINTY\n' +
    '                  </option>\n' +
    '                  <option value="CFO_CHART">CFO_CHART</option>\n' +
    '                  <option value="INNOVATION_SCREEN">INNOVATION_SCREEN</option>\n' +
    '                  <option value="ADD_TABLES">ADD_TABLES</option>\n' +
    '                  <option value="SCATTER_PLOT">SCATTER_PLOT</option>\n' +
    '                  <option value="BUCKET_CHART">BUCKET_CHART</option>\n' +
    '                </select>\n' +
    '              </div>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div class="col-sm-12 save-alert text-center">\n' +
    '          <alert class="animated shake"\n' +
    '                 ng-repeat="alert in appCtrl.newAppStructureAlerts"\n' +
    '                 type="{{alert.type}}"\n' +
    '                 close="appCtrl.closeAlert(appCtrl.newAppStructureAlerts,$index)">\n' +
    '            <i class="fa fa-exclamation-triangle fa-lg"></i>\n' +
    '            {{alert.msg}}\n' +
    '          </alert>\n' +
    '        </div>\n' +
    '        <div class="modal-footer">\n' +
    '          <button class="btn btn-primary"\n' +
    '                  ng-click="appCtrl.addNewAppStructure(display,command)">Add\n' +
    '          </button>\n' +
    '          <!--<button class= "btn btn-warning" ng-click="uploads.cancel()">Cancel</button>-->\n' +
    '          <button type="button" class="btn btn-default" data-dismiss="modal">\n' +
    '            Close\n' +
    '          </button>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '\n' +
    '\n' +
    '  <!--<div class="modal fade" id="commitMessageModal" tabindex="-1" role="dialog"-->\n' +
    '       <!--aria-hidden="true">-->\n' +
    '    <!--<div class="modal-dialog">-->\n' +
    '      <!--<div class="modal-content">-->\n' +
    '        <!--<div class="modal-header">-->\n' +
    '          <!--<button type="button" class="close" data-dismiss="modal"><span-->\n' +
    '              <!--aria-hidden="true">&times;</span><span-->\n' +
    '              <!--class="sr-only">Close</span></button>-->\n' +
    '          <!--<h4 class="modal-title">Change Message</h4>-->\n' +
    '\n' +
    '        <!--</div>-->\n' +
    '        <!--<div class="modal-body">-->\n' +
    '          <!--<h4>You will see this message in the revisions page</h4>-->\n' +
    '          <!--<textarea type="text" ng-model="display" class="form form-control"-->\n' +
    '                    <!--id="commit-display"></textarea>-->\n' +
    '        <!--</div>-->\n' +
    '\n' +
    '        <!--<div class="modal-footer">-->\n' +
    '          <!--<button class="btn btn-primary"-->\n' +
    '                  <!--ng-click="appCtrl.addNewAppStructure(display,command)">Ok-->\n' +
    '          <!--</button>-->\n' +
    '          <!--&lt;!&ndash;<button class= "btn btn-warning" ng-click="uploads.cancel()">Cancel</button>&ndash;&gt;-->\n' +
    '          <!--<button type="button" class="btn btn-default" data-dismiss="modal">-->\n' +
    '            <!--Cancel-->\n' +
    '          <!--</button>-->\n' +
    '        <!--</div>-->\n' +
    '      <!--</div>-->\n' +
    '    <!--</div>-->\n' +
    '  <!--</div>-->\n' +
    '\n' +
    '\n' +
    '</div>\n' +
    '\n' +
    '<commit-message-modal save-function="appCtrl.saveWithCommit(commitMessage)"></commit-message-modal>\n' +
    '\n' +
    '<!--<script>-->\n' +
    '<!--$(function () {-->\n' +
    '<!--$("#app-structure-menu").sortable({-->\n' +
    '<!--change: function (event, ui) {-->\n' +
    '<!--// save-->\n' +
    '<!--var newOrderList = $(-->\n' +
    '<!--"#app-structure-menu").sortable("toArray");-->\n' +
    '\n' +
    '<!--console.log(newOrderList);-->\n' +
    '<!--}-->\n' +
    '<!--}-->\n' +
    '<!--);-->\n' +
    '<!--$("#app-structure-menu").disableSelection();-->\n' +
    '<!--});-->\n' +
    '<!--</script>-->');
}]);
