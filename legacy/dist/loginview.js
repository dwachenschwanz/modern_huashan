var module;
try {
  module = angular.module('huashanApp');
} catch (e) {
  module = angular.module('huashanApp', []);
}

module.run(['$templateCache', function ($templateCache) {
  $templateCache.put('views/login.html',
    '<nav class="navbar navbar-inverse navbar-static-top" role="navigation">\n' +
    '    <div class="container-fluid">\n' +
    '        <!-- Brand and toggle get grouped for better mobile display -->\n' +
    '        <div class="navbar-header">\n' +
    '            <a class="navbar-brand" href="#">Huashan</a>\n' +
    '        </div>\n' +
    '\n' +
    '        <!-- Collect the nav links, forms, and other content for toggling -->\n' +
    '        <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">\n' +
    '            <ul class="nav navbar-nav">\n' +
    '                <li class="active"><a href="#">Home</a>\n' +
    '                </li>\n' +
    '                <li huashan-version>\n' +
    '                </li>\n' +
    '                <li><a href="#">Contact</a>\n' +
    '                </li>\n' +
    '            </ul>\n' +
    '            <ul class="nav navbar-nav navbar-right">\n' +
    '                <li>\n' +
    '                    <form name="loginForm"\n' +
    '                          class="navbar-form navbar-left form-signin">\n' +
    '                        <input ng-model="login.userName" class="form-control"\n' +
    '                               placeholder="User Name" required autofocus>\n' +
    '                        <input ng-model="login.password" type="password"\n' +
    '                               class="form-control" placeholder="Password"\n' +
    '                               required>\n' +
    '\n' +
    '                        <!--<button ng-click="login.test()" class="btn btn-primary"-->\n' +
    '                                <!--&gt;tttt-->\n' +
    '                        <!--</button>-->\n' +
    '                        <button ng-click="login.login()" class="btn btn-primary"\n' +
    '                                type="submit">Sign in\n' +
    '                        </button>\n' +
    '                    </form>\n' +
    '                </li>\n' +
    '            </ul>\n' +
    '        </div>\n' +
    '        <div>\n' +
    '            <!--<div class="col-sm-6"></div>-->\n' +
    '            <div class="navbar-form" style="color: #cc3333;"\n' +
    '                 ng-show="login.error !== undefined"><center>{{login.error}}</center></div>\n' +
    '        </div>\n' +
    '\n' +
    '        <!-- /.navbar-collapse -->\n' +
    '    </div>\n' +
    '\n' +
    '    <!-- /.container-fluid -->\n' +
    '</nav>\n' +
    '\n' +
    '<div class="jumbotron">\n' +
    '    <h1>The Huashan Wizard</h1>\n' +
    '    <p>This service lets you convert an Excel file into a web application in a\n' +
    '        few minutes! You can deploy this to your friends or clients without ever\n' +
    '        needing them to touch Excel. Don\'t believe us, try it.</p>\n' +
    '</div>\n' +
    '');
}]);
