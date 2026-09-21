/// <reference path="../../../app/scripts/lib/vendorTypeDefinitions/jasmine.d.ts" />
/// <reference path="../../../app/scripts/lib/vendorTypeDefinitions/jquery.d.ts" />
/// <reference path="../../../app/scripts/lib/vendorTypeDefinitions/angular.d.ts" />
'use strict';
class MockSmartOrg extends SmartOrg {
    constructor(serverName, endPoint) {
        super("", "");
    }
    authenticate(username: string, password: string) {
        return {
            then: function(callBack:any) {
                callBack({data:{is_admin: true, uid: "fakeUID1234"}});
                return {
                    catch: function(callBack: any) {

                    }
                };
            }
        }
    }
}

describe('Controller: loginController', function () {

  // load the controller's module
  beforeEach(module('huashanApp'));

  var loginController,
    scope,
    injector,
    location,
    mockHUASHAN,
    q,
    deferred;

  // Initialize the controller and a mock scope
  beforeEach(inject(function($controller, $rootScope, $injector, $templateCache, $location, $q) {
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
    var autoAuthService = {startAutoAuth: () => {}};
    loginController = new LoginController(scope, location, autoAuthService, mockHUASHAN, Session, $cookies, config);
  }));
  it('User log in should work with correct information', function () {
     loginController.userName = "admin";
     loginController.password = "smart";
     loginController.login();
     mockHUASHAN.resolveDeferred({status: true, credentials: "abc"});
     scope.$root.$digest();
     var Session = injector.get("Session");
     expect(Session.getCredentials()).toBe("abc");
     expect(location.absUrl()).toBe("http://server/#/selectTemplate");
  });

  it('User log in should not work with wrong information', function () {
     loginController.userName = "admin";
     loginController.password = "foolish";
     loginController.login();
     mockHUASHAN.resolveDeferred({status: false, credentials: "abc"});
     expect(location.absUrl()).toBe("http://server/");
  });

});