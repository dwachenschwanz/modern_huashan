var module;

try {
    module = angular.module("huashanApp");
} catch (e) {
    module = angular.module("huashanApp", []);
}

module.run([ "$templateCache", function($templateCache) {
    $templateCache.put("widget/version/app/template/version.html", '<a ng-click="open()" href="#">About</a>\n' + "\n" + '<script type="text/ng-template" id="versionContent.html">\n' + '    <div class="modal-header">\n' + '        <h3 class="modal-title">About Huashan</h3>\n' + "    </div>\n" + '    <div class="modal-body">\n' + '        <div ng-repeat="version in versions">\n' + "            <h3>{{version.versionNo}}</h3>\n" + "            <ul>\n" + '                <li ng-repeat="change in version.ChangeLog">\n' + "                    {{change}}\n" + "                </li>\n" + "            </ul>\n" + "        </div>\n" + "    </div>\n" + '    <div class="modal-footer">\n' + '        <button class="btn btn-primary" ng-click="close()">Close</button>\n' + "    </div>\n" + "</script>");
} ]);