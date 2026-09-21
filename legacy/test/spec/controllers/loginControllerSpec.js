/// <reference path="../../../app/scripts/lib/vendorTypeDefinitions/jasmine.d.ts" />
/// <reference path="../../../app/scripts/lib/vendorTypeDefinitions/jquery.d.ts" />
/// <reference path="../../../app/scripts/lib/vendorTypeDefinitions/angular.d.ts" />
'use strict';
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var MockSmartOrg = /** @class */ (function (_super) {
    __extends(MockSmartOrg, _super);
    function MockSmartOrg(serverName, endPoint) {
        return _super.call(this, "", "") || this;
    }
    MockSmartOrg.prototype.authenticate = function (username, password) {
        return {
            then: function (callBack) {
                callBack({ data: { is_admin: true, uid: "fakeUID1234" } });
                return {
                    "catch": function (callBack) {
                    }
                };
            }
        };
    };
    return MockSmartOrg;
}(SmartOrg));
describe('Controller: loginController', function () {
    // load the controller's module
    beforeEach(module('huashanApp'));
    var loginController, scope, injector, location, mockHUASHAN, q, deferred;
    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, $rootScope, $injector, $templateCache, $location, $q) {
        q = $q;
        deferred = q.defer();
        mockHUASHAN = new MockHUASHAN(deferred);
        injector = $injector;
        var Session = injector.get("Session");
        location = $location;
        injector = $injector;
        var $cookies = injector.get("$cookies");
        scope = $rootScope.$new();
        var config = {
            smartorg: new MockSmartOrg('https://localhost', 'kirk')
        };
        var autoAuthService = { startAutoAuth: function () { } };
        loginController = new LoginController(scope, location, autoAuthService, mockHUASHAN, Session, $cookies, config);
    }));
    it('User log in should work with correct information', function () {
        loginController.userName = "admin";
        loginController.password = "smart";
        loginController.login();
        mockHUASHAN.resolveDeferred({ status: true, credentials: "abc" });
        scope.$root.$digest();
        var Session = injector.get("Session");
        expect(Session.getCredentials()).toBe("abc");
        expect(location.absUrl()).toBe("http://server/#/selectTemplate");
    });
    it('User log in should not work with wrong information', function () {
        loginController.userName = "admin";
        loginController.password = "foolish";
        loginController.login();
        mockHUASHAN.resolveDeferred({ status: false, credentials: "abc" });
        expect(location.absUrl()).toBe("http://server/");
    });
});
//# sourceMappingURL=loginControllerSpec.js.map