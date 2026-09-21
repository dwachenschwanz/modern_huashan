var module;
try {
  module = angular.module('huashanApp');
} catch (e) {
  module = angular.module('huashanApp', []);
}

module.run(['$templateCache', function ($templateCache) {
  $templateCache.put('views/portfolioStructure.html',
    '<nav class="navbar navbar-inverse navbar-static-top" role="navigation"\n' +
    '    style="margin-bottom: 10px;">\n' +
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
    '        <li><a ng-if="port.isAdmin" href="#/admin">Admin</a></li>\n' +
    '        <li><a href="#/selectTemplate">Select Template</a></li>\n' +
    '        <li ng-hide="port.selectedTemplate === \'Not Selected\'"><a\n' +
    '            href="#/json/{{port.selectedTemplate}}">JSON</a></li>\n' +
    '        <li class="dropdown"\n' +
    '            ng-hide="port.selectedTemplate === \'Not Selected\'">\n' +
    '          <a href="" class="dropdown-toggle" data-toggle="dropdown">Data\n' +
    '            Structure <span class="caret"></span></a>\n' +
    '          <ul class="dropdown-menu" role="menu">\n' +
    '            <li><a href="#/datastructure/{{port.selectedTemplate}}">Project\n' +
    '              Data Structure</a></li>\n' +
    '            <!-- <li><a href="#/platformDataStructure/{{port.selectedTemplate}}">Platform\n' +
    '              Data Structure</a></li> -->\n' +
    '          </ul>\n' +
    '        </li>\n' +
    '        <li class="dropdown"\n' +
    '            ng-hide="port.selectedTemplate === \'Not Selected\'">\n' +
    '          <a href="" class="dropdown-toggle" data-toggle="dropdown">App\n' +
    '            Structure <span class="caret"></span></a>\n' +
    '          <ul class="dropdown-menu" role="menu">\n' +
    '            <li><a href="#/appstructure/{{port.selectedTemplate}}">Project App\n' +
    '              Structure</a></li>\n' +
    '            <!-- <li><a href="#/platformAppStructure/{{port.selectedTemplate}}">Platform\n' +
    '              App Structure</a></li> -->\n' +
    '          </ul>\n' +
    '        </li>\n' +
    '        <li class="dropdown active"\n' +
    '            ng-hide="port.selectedTemplate === \'Not Selected\'">\n' +
    '          <a href="" class="dropdown-toggle" data-toggle="dropdown">Portfolio\n' +
    '            Structure <span class="caret"></span></a>\n' +
    '          <ul class="dropdown-menu" role="menu">\n' +
    '            <li><a href="#/portfoliostructure/{{port.selectedTemplate}}">Project\n' +
    '              Portfolio Structure</a></li>\n' +
    '            <!-- <li><a\n' +
    '                href="#/platformPortfolioStructure/{{port.selectedTemplate}}">Platform\n' +
    '              Portfolio Structure</a></li> -->\n' +
    '          </ul>\n' +
    '        </li>\n' +
    '        <li>\n' +
    '          <a href="#/revisions/{{port.selectedTemplate}}">Revisions</a>\n' +
    '        </li>\n' +
    '      </ul>\n' +
    '      <ul class="nav navbar-nav navbar-right">\n' +
    '        <li class="active"><a href=""><b>{{port.selectedTemplate}}</b></a></li>\n' +
    '      </ul>\n' +
    '    </div><!-- /.navbar-collapse -->\n' +
    '  </div><!-- /.container-fluid -->\n' +
    '</nav>\n' +
    '\n' +
    '<div class="select-template"\n' +
    '    class="container col-sm-12 animated fadeIn"\n' +
    '    style="height: calc(100% - 100px)">\n' +
    '\n' +
    '  <!--Left side: list of templates to choose from-->\n' +
    '  <div class="choose-from" style="height: calc(100% - 260px)">\n' +
    '\n' +
    '    <div class="select-template-title">\n' +
    '      <h4 ng-show="!port.isPlatform">Portfolio Structure</h4>\n' +
    '      <h4 ng-show="port.isPlatform">Platform Portfolio Structure</h4>\n' +
    '    </div>\n' +
    '    <div class="select-template-title">\n' +
    '      <input type="text" class="form-control" placeholder="Search"\n' +
    '          ng-model="searchMenu.Display">\n' +
    '    </div>\n' +
    '    <div class="panel panel-primary" style="height: 100%">\n' +
    '\n' +
    '\n' +
    '      <!-- List group -->\n' +
    '      <div class="list-of-templates height-for-list" style="height: 100%">\n' +
    '\n' +
    '        <div ui-sortable\n' +
    '            ng-model="port.portfolioStructure.MENU"\n' +
    '            class="list-group"\n' +
    '            id="app-structure-menu">\n' +
    '          <a href=""\n' +
    '              class="list-group-item\n' +
    '                    cursor-move"\n' +
    '              ng-repeat="menu in port.portfolioStructure.MENU|filter:searchMenu:strict track by $index"\n' +
    '              ng-click="port.selectMenu(menu)"\n' +
    '              ng-class="{active: port.selectedMenu == menu}">\n' +
    '            <table>\n' +
    '              <tr>\n' +
    '                <td class="appStructList no-wrap">{{menu.Display}}</td>\n' +
    '                <td class="appStructList" style="width:60px">\n' +
    '                  <span data-toggle="modal"\n' +
    '                      data-target="#deletePortfolioStructureModal"\n' +
    '                      ng-show="port.selectedMenu === menu"\n' +
    '                      ng-click="$(\'#deletePortfolioStructureModal\').modal(\'show\')"\n' +
    '                      class="inline-icon pull-right glyphicon glyphicon-trash"\n' +
    '                      tooltip="Delete"\n' +
    '                      tooltip-trigger="mouseenter"\n' +
    '                      tooltip-popup-delay="500"></span>\n' +
    '                  <span data-toggle="modal"\n' +
    '                      data-target="#editPortfolioStructureModal"\n' +
    '                      ng-show="port.selectedMenu === menu"\n' +
    '                      ng-click="$(\'#editPortfolioStructureModal\').modal(\'show\')"\n' +
    '                      class="inline-icon pull-right glyphicon glyphicon-pencil"\n' +
    '                      tooltip="Rename"\n' +
    '                      tooltip-trigger="mouseenter"\n' +
    '                      tooltip-popup-delay="500"></span></td>\n' +
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
    '          id="new-button"\n' +
    '          data-toggle="modal"\n' +
    '          ng-click="port.openNew()"\n' +
    '          data-target="#newPortfolioStructureModal"\n' +
    '          tooltip="New"\n' +
    '          tooltip-trigger="mouseenter"\n' +
    '          tooltip-popup-delay="500">\n' +
    '        <span class="glyphicon glyphicon-plus"></span>\n' +
    '      </button>\n' +
    '    </div>\n' +
    '\n' +
    '  </div><!--Left side-->\n' +
    '\n' +
    '  <!--Right Side: selected template and JSON-->\n' +
    '  <div id="selected-template">\n' +
    '    <div class="select-template-title">\n' +
    '      <div class="col-sm-12">\n' +
    '        <h4 ng-show="!port.show">\n' +
    '          {{port.selectedMenu.Display}}\n' +
    '        </h4>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '    <div class="selected-inputs"\n' +
    '        style="background-color: #eee; overflow: scroll">\n' +
    '      <div class="col-sm-12" ng-show="port.selectedMenu.Command == \'ADD_TABLES\'">\n' +
    '        <div class="col-sm-12">\n' +
    '          <div class="col-sm-6">\n' +
    '            <h4>{{port.selectedMenu.Command}}</h4>\n' +
    '          </div>\n' +
    '          <div class="col-sm-6">\n' +
    '            <h4>\n' +
    '              <input type="checkbox" ng-model="port.selectedMenu.Visible">Visible\n' +
    '            </h4>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div class="col-sm-4">\n' +
    '          <div class="list-group">\n' +
    '            <a id="table{{$index}}"\n' +
    '                class="list-group-item"\n' +
    '                ng-repeat="table in port.tables"\n' +
    '                ng-class="{active: port.selectedTable === table}"\n' +
    '                ng-click="port.selectTable(table)"\n' +
    '                scroll-if="table.CellLink === port.selectedTable.CellLink">\n' +
    '              {{table.Display}}\n' +
    '            </a>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '\n' +
    '        <div class="col-sm-8">\n' +
    '          <!-- REST CalcEngine: inline HTML table (HtmlPreview) rendered in a div -->\n' +
    '          <div ng-if="port.selectedPotentialTable.HtmlPreview"\n' +
    '               ng-bind-html="port.selectedPotentialTable.HtmlPreview | tablePreviewHtml"\n' +
    '               style="width:100%; overflow:auto;"></div>\n' +
    '          <!-- Legacy SOAP: PNG preview -->\n' +
    '          <img ng-if="!port.selectedPotentialTable.HtmlPreview"\n' +
    '               src="{{port.server}}{{port.selectedPotentialTable.PreviewURL}}"\n' +
    '              alt="{{port.selectedPotentialTable.CellLink}}" width="100%">\n' +
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
    '                  ng-model="port.selectedMenu.Parameters.Pnl">\n' +
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
    '                  class="form form-control"\n' +
    '                  ng-model="appCtrl.minPrecision"\n' +
    '                  ng-change="appCtrl.changePrecisionOptions()"\n' +
    '                  min="0">\n' +
    '            </div>\n' +
    '          </div>\n' +
    '\n' +
    '          <div class="row table-padding col-sm-4">\n' +
    '            <div class="col-sm-6 text-right" style="padding-top: 2%">\n' +
    '              <b>Max</b>\n' +
    '            </div>\n' +
    '            <div class="col-sm-6">\n' +
    '              <input type="number"\n' +
    '                  class="form form-control"\n' +
    '                  ng-model="appCtrl.maxPrecision"\n' +
    '                  ng-change="appCtrl.changePrecisionOptions()"\n' +
    '                  min="0">\n' +
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
    '                  ng-model="appCtrl.selectedMenu.Parameters.DefaultPrecision"\n' +
    '                  ng-options="option for option in appCtrl.selectedMenu.Parameters.PrecisionOptions">\n' +
    '              </select>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '\n' +
    '        <!--<div class="col-sm-12">-->\n' +
    '        <!--<div class="row table-padding col-sm-4">-->\n' +
    '        <!--<div class="col-sm-6 text-right">-->\n' +
    '        <!--<b>Special Rules</b>-->\n' +
    '        <!--</div>-->\n' +
    '        <!--<div class="col-sm-6">-->\n' +
    '        <!--<select class="btn btn-default form-control">-->\n' +
    '        <!--<option value="1">None</option>-->\n' +
    '        <!--<option value="2">Ignore</option>-->\n' +
    '        <!--<option value="3">IRR</option>-->\n' +
    '        <!--<option value="4">MVSto Range</option>-->\n' +
    '        <!--<option value="5">Year</option>-->\n' +
    '        <!--<option value="6">Tooltip</option>-->\n' +
    '        <!--</select>-->\n' +
    '        <!--</div>-->\n' +
    '        <!--</div>-->\n' +
    '        <!--</div>-->\n' +
    '\n' +
    '        <!--special rules dropdown-->\n' +
    '        <div class="row table-padding"\n' +
    '            ng-repeat="key in port.selectedMenu.Parameters.Keys track by $index">\n' +
    '          <div class="col-sm-3">\n' +
    '            <select class="form form-control"\n' +
    '                ng-options="output.Key as port.getOutputDisplayFromKey(output.Key) for output in port.allOutputs"\n' +
    '                ng-model="port.selectedMenu.Parameters.Keys[$index]"\n' +
    '                ng-change="port.selectedMenu.Parameters.Units[$index] = port.getOutputUnitFromKey(port.selectedMenu.Parameters.Keys[$index]);\n' +
    '                    port.selectedMenu.Parameters.Titles[$index] = port.getOutputDisplayFromKey(port.selectedMenu.Parameters.Keys[$index]);">\n' +
    '            </select>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div class="col-sm-12">\n' +
    '          <div class="row table-padding col-sm-4">\n' +
    '            <div class="col-sm-6 text-right">\n' +
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
    '\n' +
    '      </div>\n' +
    '\n' +
    '      <div class="col-sm-12" ng-show="port.selectedMenu.Command == \'COMPARE_VALUE\'">\n' +
    '        <div class="col-sm-6">\n' +
    '          <h4>{{port.selectedMenu.Command}}</h4>\n' +
    '        </div>\n' +
    '        <div class="col-sm-6">\n' +
    '          <h4>\n' +
    '            <input type="checkbox" ng-model="port.selectedMenu.Visible">Visible\n' +
    '          </h4>\n' +
    '        </div>\n' +
    '        <div class="row table-padding">\n' +
    '          <div class="col-sm-2">\n' +
    '            <b>Total</b>\n' +
    '          </div>\n' +
    '          <div class="col-sm-3">\n' +
    '            <input type="checkbox"\n' +
    '                ng-model="port.selectedMenu.Parameters.Total">\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div class="row table-padding">\n' +
    '          <div class="col-sm-2">\n' +
    '            <b>Min</b>\n' +
    '          </div>\n' +
    '          <div class="col-sm-3">\n' +
    '            <input type="number" class="form form-control"\n' +
    '                ng-model="port.selectedMenu.Parameters.Min">\n' +
    '          </div>\n' +
    '          <div class="col-sm-2">\n' +
    '            <b>Max</b>\n' +
    '          </div>\n' +
    '          <div class="col-sm-3">\n' +
    '            <input type="number" class="form form-control"\n' +
    '                ng-model="port.selectedMenu.Parameters.Max">\n' +
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
    '            ng-repeat="key in port.selectedMenu.Parameters.Keys track by $index">\n' +
    '          <div class="col-sm-3">\n' +
    '            <select class="form form-control"\n' +
    '                ng-options="output.Key as port.getOutputDisplayFromKey(output.Key) for output in port.allOutputs"\n' +
    '                ng-model="port.selectedMenu.Parameters.Keys[$index]"\n' +
    '                ng-change="port.selectedMenu.Parameters.Units[$index] = port.getOutputUnitFromKey(port.selectedMenu.Parameters.Keys[$index]);\n' +
    '                    port.selectedMenu.Parameters.Titles[$index] = port.getOutputDisplayFromKey(port.selectedMenu.Parameters.Keys[$index]);">\n' +
    '            </select>\n' +
    '          </div>\n' +
    '          <div class="col-sm-3">\n' +
    '            <input type="text" class="form form-control"\n' +
    '                ng-model="port.selectedMenu.Parameters.Units[$index]">\n' +
    '          </div>\n' +
    '          <div class="col-sm-3">\n' +
    '            <input type="text" class="form form-control"\n' +
    '                ng-model="port.selectedMenu.Parameters.Titles[$index]">\n' +
    '          </div>\n' +
    '          <div class="col-sm-1">\n' +
    '            <button class="btn btn-danger"\n' +
    '                ng-click="port.deleteCompareValueItem($index);"><span\n' +
    '                class="glyphicon glyphicon-trash"></span></button>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div class="row table-padding">\n' +
    '          <div class="col-sm-1">\n' +
    '            <button class="btn btn-success"\n' +
    '                ng-click="port.addCompareValueItem();"><span\n' +
    '                class="glyphicon glyphicon-plus"></span></button>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '\n' +
    '      <div class="col-sm-12" ng-show="port.selectedMenu.Command == \'COMPARE_UNCERTAINTY\'">\n' +
    '        <div class="col-sm-6">\n' +
    '          <h4>{{port.selectedMenu.Command}}</h4>\n' +
    '          <div>\n' +
    '            <h4>There\'s nothing to customize in this menu item</h4>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div class="col-sm-6">\n' +
    '          <h4>\n' +
    '            <input type="checkbox" ng-model="port.selectedMenu.Visible">Visible\n' +
    '          </h4>\n' +
    '        </div>\n' +
    '        <!--<div>-->\n' +
    '        <!--<h4>There\'s nothing to customize in this menu item</h4>-->\n' +
    '        <!--</div>-->\n' +
    '      </div>\n' +
    '\n' +
    '      <div class="col-sm-12" ng-show="port.selectedMenu.Command == \'INNOVATION_SCREEN\'">\n' +
    '        <div class="col-sm-12">\n' +
    '          <div class="col-sm-6">\n' +
    '            <h4>{{port.selectedMenu.Command}}</h4>\n' +
    '          </div>\n' +
    '          <div class="col-sm-6">\n' +
    '            <h4>\n' +
    '              <input type="checkbox" ng-model="port.selectedMenu.Visible">Visible\n' +
    '            </h4>\n' +
    '          </div>\n' +
    '          <div ng-repeat="set in port.selectedMenu.Parameters.Sets">\n' +
    '            <div class="row table-padding">\n' +
    '              <div class="col-sm-2">\n' +
    '                <b>X Axis</b>\n' +
    '              </div>\n' +
    '              <div class="col-sm-3">\n' +
    '                <select\n' +
    '                    ng-options="output.Key as port.getOutputDisplayFromKey(output.Key) for output in port.allOutputs"\n' +
    '                    class="form form-control"\n' +
    '                    ng-init="xKey = port.getKeyFrom(set.x);"\n' +
    '                    ng-model="xKey"\n' +
    '                    ng-change="set.x = port.buildOutputFromKey(xKey);\n' +
    '                    set.xTitle = port.getOutputDisplayFromKey(xKey);"></select>\n' +
    '              </div>\n' +
    '              <div class="col-sm-2">\n' +
    '                <b>X Title</b>\n' +
    '              </div>\n' +
    '              <div class="col-sm-3">\n' +
    '                <input type="text" class="form form-control"\n' +
    '                    ng-model="set.xTitle">\n' +
    '              </div>\n' +
    '            </div>\n' +
    '            <div class="row table-padding">\n' +
    '              <div class="col-sm-2">\n' +
    '                <b>Y Axis</b>\n' +
    '              </div>\n' +
    '              <div class="col-sm-3">\n' +
    '                <select\n' +
    '                    ng-options="output.Key as port.getOutputDisplayFromKey(output.Key) for output in port.allOutputs"\n' +
    '                    class="form form-control"\n' +
    '                    ng-init="yKey = port.getKeyFrom(set.y);"\n' +
    '                    ng-model="yKey"\n' +
    '                    ng-change="set.y = port.buildOutputFromKey(yKey);set.yTitle = port.getOutputDisplayFromKey(yKey);"></select>\n' +
    '              </div>\n' +
    '              <div class="col-sm-2">\n' +
    '                <b>Y Title</b>\n' +
    '              </div>\n' +
    '              <div class="col-sm-3">\n' +
    '                <input type="text" class="form form-control"\n' +
    '                    ng-model="set.yTitle">\n' +
    '              </div>\n' +
    '            </div>\n' +
    '            <div class="row table-padding">\n' +
    '              <div class="col-sm-2">\n' +
    '                <b>Vertical Cut-off</b>\n' +
    '              </div>\n' +
    '              <div class="col-sm-3">\n' +
    '                <input type="number" class="form form-control"\n' +
    '                    ng-model="set.VerticalCutoff">\n' +
    '              </div>\n' +
    '\n' +
    '              <div class="col-sm-2">\n' +
    '                <b>Name</b>\n' +
    '              </div>\n' +
    '              <div class="col-sm-3">\n' +
    '                <input type="text" class="form form-control"\n' +
    '                    ng-model="set.name">\n' +
    '              </div>\n' +
    '\n' +
    '              <div class="col-sm-1">\n' +
    '                <button class="btn btn-danger"\n' +
    '                    ng-click="port.deleteInnovationScreenItem($index);"><span\n' +
    '                    class="glyphicon glyphicon-trash"></span></button>\n' +
    '              </div>\n' +
    '            </div>\n' +
    '\n' +
    '          </div><!-- end of ng-repeat -->\n' +
    '          <div class="row table-padding">\n' +
    '            <div class="col-sm-1">\n' +
    '              <button class="btn btn-success"\n' +
    '                  ng-click="port.addInnovationScreenItem();"><span\n' +
    '                  class="glyphicon glyphicon-plus"></span></button>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '\n' +
    '      <div class="col-sm-12" ng-show="port.selectedMenu.Command == \'SCATTER_PLOT\'">\n' +
    '        <div class="col-sm-12">\n' +
    '          <div class="col-sm-6">\n' +
    '            <h4>{{port.selectedMenu.Command}}</h4>\n' +
    '          </div>\n' +
    '          <div class="col-sm-6">\n' +
    '            <h4>\n' +
    '              <input type="checkbox" ng-model="port.selectedMenu.Visible">Visible\n' +
    '            </h4>\n' +
    '          </div>\n' +
    '          <div class="row table-padding">\n' +
    '            <div class="col-sm-2">\n' +
    '              <b>Use Same Scale</b>\n' +
    '            </div>\n' +
    '            <div class="col-sm-3">\n' +
    '              <input type="checkbox"\n' +
    '                  ng-model="port.selectedMenu.Parameters.SameScale">\n' +
    '            </div>\n' +
    '          </div>\n' +
    '          <div class="row table-padding">\n' +
    '            <div class="col-sm-2">\n' +
    '              <b>Min</b>\n' +
    '            </div>\n' +
    '            <div class="col-sm-3">\n' +
    '              <input type="number" class="form form-control"\n' +
    '                  ng-model="port.selectedMenu.Parameters.Min">\n' +
    '            </div>\n' +
    '            <div class="col-sm-2">\n' +
    '              <b>Max</b>\n' +
    '            </div>\n' +
    '            <div class="col-sm-3">\n' +
    '              <input type="number" class="form form-control"\n' +
    '                  ng-model="port.selectedMenu.Parameters.Max">\n' +
    '            </div>\n' +
    '          </div>\n' +
    '\n' +
    '          <div ng-repeat="set in port.selectedMenu.Parameters.Sets">\n' +
    '            <div class="row table-padding">\n' +
    '              <div class="col-sm-2"><h3>Series {{$index + 1}}</h3></div>\n' +
    '            </div>\n' +
    '            <div class="row table-padding">\n' +
    '              <div class="col-sm-2"><b>Name</b></div>\n' +
    '              <div class="col-sm-3"\n' +
    '                  ng-class="{\'has-error\': (set.name === undefined || set.name === \'\') && port.selectedMenu.Parameters.Sets.length > 1}">\n' +
    '                <input type="text" class="form form-control"\n' +
    '                    ng-model="set.name">\n' +
    '              </div>\n' +
    '            </div>\n' +
    '            <div class="row table-padding">\n' +
    '              <div class="col-sm-2">\n' +
    '                <b>X Axis</b>\n' +
    '              </div>\n' +
    '              <div class="col-sm-3">\n' +
    '                <select\n' +
    '                    ng-options="output.Key as port.getOutputDisplayFromKey(output.Key) for output in port.allOutputs"\n' +
    '                    class="form form-control"\n' +
    '                    ng-init="xKey = port.getKeyFrom(set.x);"\n' +
    '                    ng-model="xKey"\n' +
    '                    ng-change="set.x = port.buildOutputFromKey(xKey);set.xTitle = port.getOutputDisplayFromKey(xKey);"></select>\n' +
    '              </div>\n' +
    '\n' +
    '              <div class="col-sm-2">\n' +
    '                <b>X Title</b>\n' +
    '              </div>\n' +
    '              <div class="col-sm-3">\n' +
    '                <input type="text" class="form form-control"\n' +
    '                    ng-model="set.xTitle">\n' +
    '              </div>\n' +
    '            </div>\n' +
    '            <div class="row table-padding">\n' +
    '              <div class="col-sm-2">\n' +
    '                <b>Y Axis</b>\n' +
    '              </div>\n' +
    '              <div class="col-sm-3">\n' +
    '                <select\n' +
    '                    ng-options="output.Key as port.getOutputDisplayFromKey(output.Key) for output in port.allOutputs"\n' +
    '                    class="form form-control"\n' +
    '                    ng-init="yKey = port.getKeyFrom(set.y);"\n' +
    '                    ng-model="yKey"\n' +
    '                    ng-change="set.y = port.buildOutputFromKey(yKey);set.yTitle = port.getOutputDisplayFromKey(yKey);"></select>\n' +
    '              </div>\n' +
    '              <div class="col-sm-2">\n' +
    '                <b>Y Title</b>\n' +
    '              </div>\n' +
    '              <div class="col-sm-3">\n' +
    '                <input type="text" class="form form-control"\n' +
    '                    ng-model="set.yTitle">\n' +
    '              </div>\n' +
    '              <div class="col-sm-2">\n' +
    '                <button class="btn btn-danger"\n' +
    '                    ng-click="port.deleteScatterPlotItem($index);"><span\n' +
    '                    class="glyphicon glyphicon-trash"></span></button>\n' +
    '              </div>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '          <div class="col-sm-2">\n' +
    '            <button class="btn btn-success"\n' +
    '                ng-click="port.addScatterPlotItem();"><span\n' +
    '                class="glyphicon glyphicon-plus"></span></button>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '\n' +
    '      <div class="col-sm-12" ng-show="port.selectedMenu.Command == \'CFO_CHART\'">\n' +
    '        <div class="col-sm-12">\n' +
    '          <div class="col-sm-6">\n' +
    '            <h4>{{port.selectedMenu.Command}}</h4>\n' +
    '          </div>\n' +
    '          <div class="col-sm-6">\n' +
    '            <h4>\n' +
    '              <input type="checkbox" ng-model="port.selectedMenu.Visible">Visible\n' +
    '            </h4>\n' +
    '          </div>\n' +
    '\n' +
    '          <div ng-repeat="set in port.selectedMenu.Parameters.Sets">\n' +
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
    '                    ng-options="output.Key as port.getOutputDisplayFromKey(output.Key) for output in port.allOutputs"\n' +
    '                    class="form form-control"\n' +
    '                    ng-init="xKey = port.getKeyFrom(set.AverageCost);"\n' +
    '                    ng-model="xKey"\n' +
    '                    ng-change="set.AverageCost = port.buildOutputFromKey(xKey);\n' +
    '                                set.xTitle = port.getOutputDisplayFromKey(xKey);"></select>\n' +
    '              </div>\n' +
    '\n' +
    '              <div class="col-sm-3">\n' +
    '                <input type="text" class="form form-control"\n' +
    '                    ng-model="set.xTitle">\n' +
    '              </div>\n' +
    '              <div class="col-sm-3">\n' +
    '                <input type="text" class="form form-control"\n' +
    '                    ng-model="set.name">\n' +
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
    '                    ng-options="output.Key as port.getOutputDisplayFromKey(output.Key) for output in port.allOutputs"\n' +
    '                    class="form form-control"\n' +
    '                    ng-init="yKey = port.getKeyFrom(set.AverageValueMinusCost);"\n' +
    '                    ng-model="yKey"\n' +
    '                    ng-change="set.AverageValueMinusCost = port.buildOutputFromKey(yKey);set.yTitle = port.getOutputDisplayFromKey(yKey);"></select>\n' +
    '              </div>\n' +
    '              <div class="col-sm-3">\n' +
    '                <input type="text" class="form form-control"\n' +
    '                    ng-model="set.yTitle">\n' +
    '              </div>\n' +
    '              <div class="col-sm-1">\n' +
    '                <button class="btn btn-danger"\n' +
    '                    ng-click="port.deleteCFOChartItem($index);"><span\n' +
    '                    class="glyphicon glyphicon-trash"></span></button>\n' +
    '              </div>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '\n' +
    '          <div class="row table-padding">\n' +
    '            <div class="col-sm-1">\n' +
    '              <button class="btn btn-success"\n' +
    '                  ng-click="port.addCFOChartItem();"><span\n' +
    '                  class="glyphicon glyphicon-plus"></span></button>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '\n' +
    '      <div class="col-sm-12" ng-show="port.selectedMenu.Command == \'BUCKET_CHART\'">\n' +
    '        <div class="col-sm-12">\n' +
    '          <div class="col-sm-6">\n' +
    '            <h4>{{port.selectedMenu.Command}}</h4>\n' +
    '          </div>\n' +
    '          <div class="col-sm-6">\n' +
    '            <h4>\n' +
    '              <input type="checkbox" ng-model="port.selectedMenu.Visible">Visible\n' +
    '            </h4>\n' +
    '          </div>\n' +
    '\n' +
    '          <!--Below had ng-repeat, may need ng-repeat later-->\n' +
    '          <!--class="panel"-->\n' +
    '          <div ng-repeat="s in port.selectedMenu.Parameters.Sets track by $index">\n' +
    '            <div>\n' +
    '              <div class="row table-padding">\n' +
    '                <div class="col-sm-2"\n' +
    '                ng-class="{\'has-error\': (s.Title === undefined || s.Title === \'\') && port.selectedMenu.Parameters.Sets.length > 1}">\n' +
    '                  <b>Title</b>\n' +
    '                </div>\n' +
    '                <div class="col-sm-3">\n' +
    '                  <input type="text" class="form form-control"\n' +
    '                      ng-model="s.Title">\n' +
    '                </div>\n' +
    '                <div class="col-sm-2">\n' +
    '                  <b>Counts</b>\n' +
    '                </div>\n' +
    '                <div class="col-sm-3">\n' +
    '                  <select type="text" class="form form-control"\n' +
    '                      ng-model="s.Counts"\n' +
    '                      ng-options="o.v as o.v for o in [{v:false}, {v:true}]">\n' +
    '                  </select>\n' +
    '                </div>\n' +
    '              </div>\n' +
    '              <div class="row table-padding">\n' +
    '                <div class="col-sm-2">\n' +
    '                  <b>X Axis</b>\n' +
    '                </div>\n' +
    '                <div class="col-sm-3">\n' +
    '                  <select type="text" class="form form-control"\n' +
    '                      ng-model="s.Key"\n' +
    '                      ng-options="output.Key as port.getOutputDisplayFromKey(output.Key) for output in port.allOutputs">\n' +
    '                  </select>\n' +
    '                </div>\n' +
    '                <div class="col-sm-2">\n' +
    '                  <b>X Label</b>\n' +
    '                </div>\n' +
    '                <div class="col-sm-3">\n' +
    '                  <input type="text" class="form form-control"\n' +
    '                      ng-model="s.xTitle">\n' +
    '                </div>\n' +
    '              </div>\n' +
    '              <div class="row table-padding">\n' +
    '                <div class="col-sm-2">\n' +
    '                  <b>Y Label</b>\n' +
    '                </div>\n' +
    '                <div class="col-sm-3">\n' +
    '                  <input type="text" class="form form-control"\n' +
    '                      ng-model="s.yTitle">\n' +
    '                </div>\n' +
    '              </div>\n' +
    '\n' +
    '              <!--&& port.bucketManagers[$index].indicator-->\n' +
    '              <div class="row">&nbsp;</div>\n' +
    '              <div class="row table-padding well"\n' +
    '                  ng-if="s.xBuckets.length===0 && !port.bucketManagers[$index] ">\n' +
    '                <div class="col-sm-2">\n' +
    '                  Buckets<br/>\n' +
    '                  <input type="number" min="1" class="form form-control"\n' +
    '                      ng-init="s.xBuckets.length"\n' +
    '                      ng-model="port.numBuckets">\n' +
    '                </div>\n' +
    '                <div class="col-sm-2">Low<br/><input type="text"\n' +
    '                    class="form-control"\n' +
    '                    ng-model="port.bucketLow">\n' +
    '                </div>\n' +
    '                <div class="col-sm-2">High<br/><input type="text"\n' +
    '                    class="form-control"\n' +
    '                    ng-model="port.bucketHigh">\n' +
    '                </div>\n' +
    '                <div class="col-sm-1">\n' +
    '                  <br/>\n' +
    '                  <button class="btn btn-primary"\n' +
    '                      ng-click="port.generateBuckets($index);">Generate Buckets\n' +
    '                  </button>\n' +
    '                </div>\n' +
    '              </div>\n' +
    '\n' +
    '              <div class="row table-padding"\n' +
    '                  ng-if="port.bucketManagers[$index].editing===false">\n' +
    '                <div class="col-md-9">\n' +
    '                  <b>Buckets: <span\n' +
    '                    ng-repeat="bucket in port.bucketManagers[$index].editableBuckets track by $index">{{bucket.Name}}<span\n' +
    '                    ng-show="$index < port.bucketManagers[$parent.$index].editableBuckets.length-1">,</span>\n' +
    '                   </span> <i class="pull-righ glyphicon glyphicon-pencil"\n' +
    '                    ng-click="port.bucketManagers[$index].makeEditable()"></i></b>\n' +
    '                </div>\n' +
    '              </div>\n' +
    '              <div class="row table-padding"\n' +
    '                  ng-if="port.bucketManagers[$index].editing===true">\n' +
    '                <div class="col-md-3"></div>\n' +
    '                <div class="col-md-6">\n' +
    '                  <table\n' +
    '                      class="table table-bordered table-striped table-condensed">\n' +
    '                    <thead>\n' +
    '                    <th>Bucket Label</th>\n' +
    '                    <th>Bucket Rule</th>\n' +
    '                    </thead>\n' +
    '                    <tbody>\n' +
    '                    <tr ng-repeat="bucket in port.bucketManagers[$index].editableBuckets track by $index">\n' +
    '\n' +
    '                      <td>\n' +
    '                        <div ng-if="bucket.nameEditable === true">\n' +
    '                          <input class="form-control input-sm" type="text"\n' +
    '                              ng-model="bucket.Name"\n' +
    '                              ng-if="bucket.nameEditable === true"/>\n' +
    '                          <span>\n' +
    '                            <button class="btn btn-primary btn-sm"\n' +
    '                                style="margin-top: 15px;"\n' +
    '                                ng-click="port.toggleNameEdit(bucket, $parent.$parent.$index)">Done\n' +
    '                          </button>\n' +
    '                          </span>\n' +
    '                        </div>\n' +
    '                        <br/>\n' +
    '                          <span\n' +
    '                              ng-if="bucket.nameEditable===false || !bucket.nameEditable">{{bucket.Name}}\n' +
    '                            <br/>\n' +
    '                        <i class="pull-righ glyphicon glyphicon-pencil"\n' +
    '                            ng-click="port.toggleNameEdit(bucket, $parent.$parent.$index)"></i></span>\n' +
    '                      </td>\n' +
    '                      <td>\n' +
    '                        <!-- ng-if creates an extra scope on angular. -->\n' +
    '                        <div ng-if="bucket.rulesEditable===true">\n' +
    '                          <select\n' +
    '                              class="form-control input-sm"\n' +
    '                              ng-model="bucket.rule1Type"\n' +
    '                              ng-options="rule as rule.Label for rule in port.bucketManagers[$parent.$parent.$index].rule1Options">\n' +
    '                          </select>\n' +
    '                          <input type="text" class="form-control input-sm"\n' +
    '                              ng-model="bucket.rule1Value"\n' +
    '                              ng-if="bucket.rule1Type.Value!==\'NONE\'"/><br/>\n' +
    '                          <select\n' +
    '                              class="form-control input-sm"\n' +
    '                              ng-model="bucket.rule2Type"\n' +
    '                              ng-options="rule as rule.Label for rule in port.bucketManagers[$parent.$parent.$index].rule2Options">\n' +
    '                          </select>\n' +
    '                          <input type="text" class="form-control input-sm"\n' +
    '                              ng-model="bucket.rule2Value"\n' +
    '                              ng-if="bucket.rule2Type.Value!==\'NONE\'"/><br/>\n' +
    '\n' +
    '                          <button class="btn btn-primary btn-sm"\n' +
    '                              ng-click="port.toggleRuleEdit(bucket, $parent.$parent.$index)">\n' +
    '                            Done\n' +
    '                          </button>\n' +
    '                        </div>\n' +
    '                        <div\n' +
    '                            ng-if="bucket.rulesEditable==false || !bucket.rulesEditable">\n' +
    '                          {{bucket.rule1Type.Label}}&nbsp{{bucket.rule1Value}}<br/>\n' +
    '                          {{bucket.rule2Type.Label}}&nbsp{{bucket.rule2Value}}<br/>\n' +
    '                          <i class="pull-righ glyphicon glyphicon-pencil"\n' +
    '                              ng-click="port.toggleRuleEdit(bucket, $parent.$parent.$index)"></i></span>\n' +
    '                        </div>\n' +
    '                      </td>\n' +
    '                    </tr>\n' +
    '                    </tbody>\n' +
    '                  </table>\n' +
    '                  <div style="text-align: center">\n' +
    '                    <button class="btn btn-primary"\n' +
    '                        ng-click="port.addBucket($index)">Add Bucket\n' +
    '                    </button>\n' +
    '                    <button class="btn btn-primary"\n' +
    '                        ng-click="port.deleteBucket($index)"\n' +
    '                        ng-disabled="port.bucketManagers[$index].editableBuckets.length === 0">Delete Bucket\n' +
    '                    </button>\n' +
    '                    <button class="btn btn-primary"\n' +
    '                        ng-click="port.bucketManagers[$parent.$index].stopEditing()">\n' +
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
    '                    ng-click="port.deleteBucketSet($index);"><span\n' +
    '                    class="glyphicon glyphicon-trash"></span></button>\n' +
    '              </div>\n' +
    '            </div>\n' +
    '            <hr>\n' +
    '          </div>\n' +
    '\n' +
    '          <div class="row table-padding">\n' +
    '            <div class="col-sm-1">\n' +
    '              <button class="btn btn-success"\n' +
    '                  ng-click="port.addBucketChartSet();"><span\n' +
    '                  class="glyphicon glyphicon-plus"></span></button>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '\n' +
    '        </div>\n' +
    '      </div>\n' +
    '\n' +
    '      <div class="col-sm-12"\n' +
    '           ng-show="port.selectedMenu.Command == \'PORTFOLIO_UNCERTAINTY\'">\n' +
    '        <div class="col-sm-12">\n' +
    '          <div class="col-sm-6">\n' +
    '            <h4>{{port.selectedMenu.Command}}</h4>\n' +
    '          </div>\n' +
    '          <div class="col-sm-6">\n' +
    '            <h4>\n' +
    '              <input type="checkbox" ng-model="port.selectedMenu.Visible">Visible\n' +
    '            </h4>\n' +
    '          </div>\n' +
    '          <div class="row table-padding col-sm-12">\n' +
    '            <div class="col-sm-2">\n' +
    '              <b>Type</b>\n' +
    '            </div>\n' +
    '            <div class="col-sm-3">\n' +
    '              <select class="form form-control"\n' +
    '                      ng-model="port.selectedMenu.Parameters.MVSType">\n' +
    '                <option value="">--select type--</option>\n' +
    '                <option value="MVSFromFittedPoints">MVSFromFittedPoints</option>\n' +
    '              </select>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '          <div class="row table-padding col-sm-12">\n' +
    '            <div class="col-sm-2">\n' +
    '              <b>Source</b>\n' +
    '            </div>\n' +
    '            <div class="col-sm-3">\n' +
    '              <select class="form form-control"\n' +
    '                      ng-model="port.selectedMenu.Parameters.Source"\n' +
    '                      ng-options="x for x in port.getSourceFromAppStruMetalog()">\n' +
    '                <option value="">--select source--</option>\n' +
    '              </select>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '          <div class="row table-padding col-sm-12">\n' +
    '            <div class="col-sm-2">\n' +
    '              <b>Representation</b>\n' +
    '            </div>\n' +
    '            <div class="col-sm-3">\n' +
    '              <select class="form form-control"\n' +
    '                      ng-model="port.selectedMenu.Parameters.Representation">\n' +
    '                <option value="">--slect representation--</option>\n' +
    '                <option value="Curve">Curve</option>\n' +
    '              </select>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '          <div class="row table-padding col-sm-12">\n' +
    '            <div class="col-sm-2">\n' +
    '              <b>Explanation</b>\n' +
    '            </div>\n' +
    '            <div class="col-sm-6">\n' +
    '              <textarea class="form-control" rows="4"\n' +
    '                        ng-model="port.selectedMenu.Parameters.PortfolioUncExplanation"></textarea>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '          <div class="row table-padding col-sm-12">\n' +
    '            <div class="col-sm-6">\n' +
    '              <h4>Included Keys</h4>\n' +
    '            </div>\n' +
    '            <div class="col-sm-6">\n' +
    '              <h4>Excluded Keys</h4>\n' +
    '            </div>\n' +
    '            <div class="col-sm-6" style="overflow: auto;">\n' +
    '              <div class="list-of-templates">\n' +
    '                <ul class="list-group">\n' +
    '                  <li class="list-group-item"\n' +
    '                      ng-repeat="key in port.selectedMenu.Parameters.RollupKeys">\n' +
    '                    <div class="no-wrap">\n' +
    '                      <a class="text-danger">\n' +
    '                        <i class="fa fa-minus-square fa-lg"\n' +
    '                           ng-click="port.removeFromIncludedKeys(key)"></i>\n' +
    '                      </a>\n' +
    '                      {{port.findKey(port.outputs)(key).Display}}\n' +
    '                    </div>\n' +
    '                  </li>\n' +
    '                </ul>\n' +
    '              </div>\n' +
    '            </div>\n' +
    '            <div class="col-sm-6" style="overflow: auto;">\n' +
    '              <div class="list-of-templates">\n' +
    '                <ul class="list-group">\n' +
    '                  <li class="list-group-item"\n' +
    '                      ng-repeat="key in port.getPortfolioUncKeyFromMetalogBySource()"\n' +
    '                      ng-show="port.selectedMenu.Parameters.RollupKeys.indexOf(key)===-1">\n' +
    '                    <div class="no-wrap">\n' +
    '                      <a href="" class="text-success">\n' +
    '                        <i class="fa fa-plus-square fa-lg"\n' +
    '                           ng-click="port.addToRollupKeys(key)"></i>\n' +
    '                      </a>\n' +
    '                      {{port.findKey(port.outputs)(key).Display}}\n' +
    '                    </div>\n' +
    '                  </li>\n' +
    '                </ul>\n' +
    '              </div>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '\n' +
    '    </div><!--Right side-->\n' +
    '  </div>\n' +
    '\n' +
    '\n' +
    '  <div class="col-sm-12 text-center align-to-bottom">\n' +
    '    <a href="#/appstructure/{{port.selectedTemplate}}"\n' +
    '        class="btn btn-primary pull-left" role="button"><span\n' +
    '        class="glyphicon glyphicon-chevron-left"></span> Previous: App\n' +
    '      Structure</a>\n' +
    '    <!--<a href="#/portfoliostructure/{{port.selectedTemplate}}" class="btn btn-primary pull-right" role="button">Next: Portfolio Structure <span class="glyphicon glyphicon-chevron-right"></span></a>-->\n' +
    '    <button class="btn btn-danger"\n' +
    '            data-toggle="modal"\n' +
    '            data-target="#commitMessageModal"\n' +
    '            ng-disabled="port.isUnchanged()"><i\n' +
    '        class="fa fa-spinner fa-spin fa-lg"\n' +
    '        ng-show="!port.saveComplete"></i><span\n' +
    '        ng-show="port.saveComplete">save</span>\n' +
    '    </button>\n' +
    '    <div class="col-sm-12 save-alert">\n' +
    '      <alert class="animated shake" ng-repeat="alert in port.saveAlerts"\n' +
    '          type="{{alert.type}}"\n' +
    '          close="port.closeAlert(port.saveAlerts,$index)"><i\n' +
    '          class="fa fa-exclamation-triangle fa-lg"></i> <b>Saving\n' +
    '        failed.</b> {{alert.msg}}\n' +
    '      </alert>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '\n' +
    '\n' +
    '  <!-- Delete Modal -->\n' +
    '  <div class="modal fade" id="deletePortfolioStructureModal" tabindex="-1"\n' +
    '      role="dialog"\n' +
    '      aria-labelledby="deletePortfolioStructureModalLabel" aria-hidden="true">\n' +
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
    '          <h4 class="modal-title" id="deletePortfolioStructureModalLabel">Are\n' +
    '            you sure to delete <b>{{port.selectedMenu.Display}}</b>?\n' +
    '          </h4>\n' +
    '        </div>\n' +
    '        <div class="modal-footer">\n' +
    '          <button class="btn btn-primary"\n' +
    '              ng-click="port.deletePortfolioStructure()">Delete\n' +
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
    '  <div class="modal fade" id="editPortfolioStructureModal" tabindex="-1"\n' +
    '      role="dialog"\n' +
    '      aria-labelledby="editPortfolioStructureModalLabel" aria-hidden="true">\n' +
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
    '          <input type="text" ng-model="port.selectedMenu.Display"\n' +
    '              class="form form-control"/>\n' +
    '        </div>\n' +
    '        <div class="modal-footer">\n' +
    '          <button class="btn btn-primary" ng-click="port.rename()">Rename\n' +
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
    '  <div class="modal fade" id="newPortfolioStructureModal" tabindex="-1"\n' +
    '      role="dialog"\n' +
    '      aria-labelledby="newPortfolioStructureModalLabel" aria-hidden="true">\n' +
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
    '                    id="new-display">\n' +
    '              </div>\n' +
    '            </div>\n' +
    '            <div class="row table-padding">\n' +
    '              <div class="col-sm-3 col-sm-offset-1 text-right">\n' +
    '                <h4>Command</h4>\n' +
    '              </div>\n' +
    '              <div class="col-sm-6">\n' +
    '                <select ng-model="command" class="form form-control"\n' +
    '                    id="new-command">\n' +
    '                  <option value="COMPARE_VALUE">COMPARE_VALUE</option>\n' +
    '                  <option value="COMPARE_UNCERTAINTY">COMPARE_UNCERTAINTY\n' +
    '                  </option>\n' +
    '                  <option value="CFO_CHART">CFO_CHART</option>\n' +
    '                  <option value="INNOVATION_SCREEN">INNOVATION_SCREEN</option>\n' +
    '                  <option value="ADD_TABLES">ADD_TABLES</option>\n' +
    '                  <option value="SCATTER_PLOT">SCATTER_PLOT</option>\n' +
    '                  <option value="BUCKET_CHART">BUCKET_CHART</option>\n' +
    '                  <option value="PORTFOLIO_UNCERTAINTY">PORTFOLIO_UNCERTAINTY\n' +
    '                  </option>\n' +
    '                </select>\n' +
    '              </div>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div class="col-sm-12 save-alert text-center">\n' +
    '          <alert class="animated shake"\n' +
    '              ng-repeat="alert in port.newPortfolioStructureAlerts"\n' +
    '              type="{{alert.type}}"\n' +
    '              close="port.closeAlert(port.newPortfolioStructureAlerts,$index)">\n' +
    '            <i class="fa fa-exclamation-triangle fa-lg"></i>\n' +
    '            {{alert.msg}}\n' +
    '          </alert>\n' +
    '        </div>\n' +
    '        <div class="modal-footer">\n' +
    '          <button class="btn btn-primary"\n' +
    '              ng-click="port.addNewPortfolioStructure(display,command)"\n' +
    '              data-dismiss="modal">\n' +
    '            Add\n' +
    '          </button>\n' +
    '          <!--<button class= "btn btn-warning" ng-click="uploads.cancel()">Cancel</button>-->\n' +
    '          <button type="button" class="btn btn-default" data-dismiss="modal">\n' +
    '            Close\n' +
    '          </button>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </div></div>\n' +
    '\n' +
    '<commit-message-modal save-function="port.saveWithCommit(commitMessage)"></commit-message-modal>');
}]);
