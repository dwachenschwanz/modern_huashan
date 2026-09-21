/// <reference path="../lib/_all.ts"/>
var LoginController = /** @class */ (function () {
    function LoginController($scope, $location, autoAuthService, HUASHAN, Session, $cookies, config, SERVER) {
        this.$scope = $scope;
        this.$location = $location;
        this.authService = autoAuthService;
        this.huashanService = HUASHAN;
        this.Session = Session;
        this.$cookies = $cookies;
        this.smartorg = config.smartorg;
        this.error = undefined;
        this.baseUrl = SERVER.url;
    }
    //Binding
    LoginController.prototype.login = function () {
        var that = this;
        localStorage.clear();
        this.smartorg.authenticate({
            'username': this.userName,
            'password': this.password
        }).then(function (userInfo) {
            localStorage.setItem("JWT-TOKEN", userInfo.token);
            var infoString = JSON.stringify(userInfo.data);
            var encodedInfo = btoa(infoString);
            localStorage.setItem("INFO", encodedInfo);
            if (userInfo.data.is_admin) {
                that.huashanService.Auth(that.userName, that.password)
                    .then(function (response) { return that.loginSuccessFn(response); });
            }
            else {
                that.huashanService.$http.get(that.baseUrl + '/framework/config').then(function (response) {
                    if (response.data.wizardUserAccess) {
                        that.huashanService.Auth(that.userName, that.password)
                            .then(function (response) { return that.loginSuccessFn(response); });
                    }
                    else {
                        var message = "Please Use Admin Username To Login";
                        that.$scope.$apply(that.error = message);
                        console.warn("Please login with admin username");
                    }
                })["catch"](function (err) {
                    var message = "Please Use Admin Username To Login";
                    that.$scope.$apply(that.error = message);
                    console.warn("Please login with admin username");
                });
            }
        })["catch"](function (err) {
            var message = "Username or password is not correct.";
            that.$scope.$apply(that.error = message);
            console.error(err);
        });
    };
    LoginController.prototype.loginSuccessFn = function (response) {
        if (response.status) {
            this.authService.startAutoAuth();
            this.Session.create(response.credentials);
            //if (!this.$cookies.huashansession) {
            this.$cookies.huashansession = this.Session.getCredentials();
            //}
            this.$location.path("/selectTemplate");
        }
        else {
            this.$location.path("/login");
            // this.error = "Login failed. You cannot proceed";
            var message = "Login Failed. You cannot proceed.";
            this.$scope.$apply(this.error = message);
            console.log("Login failed. You cannot proceed.");
        }
    };
    return LoginController;
}());
//# sourceMappingURL=loginController.js.map