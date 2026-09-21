angular.module('huashanApp')
    .service('Session', function () {
    return new Session();
});
var Session = /** @class */ (function () {
    function Session() {
    }
    Session.prototype.create = function (credentials) {
        this.credentials = credentials;
    };
    Session.prototype.destroy = function () {
        this.credentials = null;
    };
    Session.prototype.getCredentials = function () {
        return this.credentials;
    };
    return Session;
}());
//# sourceMappingURL=huashan.authentication.js.map