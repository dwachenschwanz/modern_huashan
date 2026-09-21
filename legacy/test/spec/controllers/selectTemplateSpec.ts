'use strict';

describe('Controller: SelectTemplateController', function () {
    // load the controller's module
    beforeEach(module('huashanApp'));
    var httpBackend;
    var myTemplateResponse;
    var flush;
    beforeEach(inject(function ($httpBackend) {
        httpBackend = $httpBackend;
        myTemplateResponse = {
            "commands": [{
                "name": "Data",
                "paramCount": "2",
                "parameters": [{
                    "name": "templateList",
                    "value": "W3siaW5mbyI6IHsiRGVzY3JpcHRpb24iOiAiVGhpcyBzaW1wbGUgdGVtcGxhdGUgaGVscHMgeW91%0AIGZvcmVjYXN0IHJldmVudWVzIGFuZCBtYXJnaW5zIGluIHRoZSBmdXR1cmUuIFlvdSBjYW4gcGlj%0AayBhIHN1aXRhYmxlIGZ1dHVyZSB0aW1lIGZyYW1lIChsaWtlIDUgeWVhcnMgb3V0KSBhbmQgcnVu%0AIGEgZm9yZWNhc3RpbmcgY29udmVyc2F0aW9uIHdpdGggeW91ciB0ZWFtIHVzaW5nIHRoaXMgc2lt%0AcGxlIHRlbXBsYXRlLiIsICJDcmVhdG9yIjogIlNtYXJ0T3JnLCBJbmMuIiwgIkltYWdlVVJMIjog%0AImh0dHBzOi8vcGJzLnR3aW1nLmNvbS9wcm9maWxlX2ltYWdlcy8yMTAzNzAxMTQ1L1NtYXJ0T3Jn%0AVHdpdHRlckljb24ucG5nIiwgIlRpdGxlIjogIlNhbGVzIEZvcmVjYXN0IiwgIkNyZWF0b3JMaW5r%0AIjogImh0dHA6Ly93d3cuc21hcnRvcmcuY29tIiwgIlR5cGUiOiAiRm9yZWNhc3QiLCAiRW1haWwi%0AOiAidGVtcGxhdGVzQHNtYXJ0b3JnLmNvbSJ9LCAiaGFzUGxhdGZvcm0iOiBmYWxzZSwgIm5hbWUi%0AOiAic2FsZXNGb3JlY2FzdCJ9LCB7ImluZm8iOiB7fSwgImhhc1BsYXRmb3JtIjogdHJ1ZSwgIm5h%0AbWUiOiAiZHJ1Z3BsYXRmb3JtIn0sIHsiaW5mbyI6IHsiRGVzY3JpcHRpb24iOiAiVGhpcyB0ZW1w%0AbGF0ZSBhbGxvd3MgeW91IHRvIHZhbHVhdGUgYW4gYWNxdWlzaXRpb24gb3Bwb3J0dW5pdHkuIEl0%0AIGhhcyB0d28gY29tcG9uZW50cyAtIGFuIGFjcXVpc2l0aW9uIGFuZCBhbiBpbm5vdmF0aW9uIHBp%0AZWNlLiBUaGUgYWNxdWlzaXRpb24gcGFydCBpbmNvcnBvcmF0ZXMgdW5jZXJ0YWludHkgYXJvdW5k%0AIHN1Y2Nlc3NmdWwgYWNxdWlzaXRpb24gYW5kIGludGVncmF0aW9uLCB3aGlsZSB0aGUgaW5ub3Zh%0AdGlvbiBwYXJ0IGluY29ycG9yYXRlcyB1bmNlcnRhaW50eSBhcm91bmQgYmVpbmcgYWJsZSB0byBp%0Abm5vdmF0ZSBvbiB0b3Agb2YgdGhlIGFjcXVpc2l0aW9uLiBUaGlzIHRlbXBsYXRlIGluY29ycG9y%0AYXRlcyBhc3R1dGUgdGhpbmtpbmcgYW5kIHdpbGwgaGVscCBhbnlvbmUgbG9va2luZyBhdCBhY3F1%0AaXNpdGlvbnMgYXNrIHRoZSByaWdodCBxdWVzdGlvbnMgYW5kIGJ1aWxkIGEgY3JlZGlibGUgY2Fz%0AZS4iLCAiQ3JlYXRvciI6ICJTbWFydE9yZywgSW5jLiIsICJJbWFnZVVSTCI6ICJodHRwczovL3Bi%0Acy50d2ltZy5jb20vcHJvZmlsZV9pbWFnZXMvMjEwMzcwMTE0NS9TbWFydE9yZ1R3aXR0ZXJJY29u%0ALnBuZyIsICJUaXRsZSI6ICJBY3F1c2l0aW9uIiwgIkNyZWF0b3JMaW5rIjogImh0dHA6Ly93d3cu%0Ac21hcnRvcmcuY29tIiwgIlR5cGUiOiAiTSZBIiwgIkVtYWlsIjogInRlbXBsYXRlc0BzbWFydG9y%0AZy5jb20ifSwgImhhc1BsYXRmb3JtIjogZmFsc2UsICJuYW1lIjogImFjcXVpc2l0aW9uIn1d%0A"
                }, {"name": "status", "value": "1"}]
            }], "context": {}
        };
        httpBackend.when('GET', 'https://localhost/kirk/wizard/main?command=GetTemplates&kreds=fakeCredentials'
        ).respond(myTemplateResponse);
        httpBackend.expect('GET', 'https://localhost/kirk/wizard/main?command=GetTemplates&kreds=fakeCredentials');
        flush = httpBackend.flush;
    }));
    var scope, injector, location, mockHUASHAN, q, deferred;
    var selectTemplateController;

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
        var Session = $injector.get("Session");
        Session.create("fakeCredentials");

        var $cookies = $injector.get("$cookies");
        $cookies.huashansession = "fakeCredentials";
        var cookies = {huashansession: 'abc'};
        var fakeSession = {
            getCredentials: function () {
                return true;
            }, create: function (cookie) {
                return true;
            }
        };
        // selectTemplateController = new SelectTemplateController(location, mockHUASHAN, fakeSession, cookies);

        selectTemplateController = $controller('SelectTemplateController', {$scope: scope});
        flush();
    }));
    it('should get template list from server correctly', function () {
        selectTemplateController.getTemplates();
        mockHUASHAN.resolveDeferred({
            result: ['template1', 'template2'],
            status: true
        });
        scope.$root.$digest();
        expect(selectTemplateController.templates).toEqual([{
            info: {
                Description: 'This simple template helps you forecast revenues and margins in the future.' +
                ' You can pick a suitable future time frame (like 5 years out) and run a ' +
                'forecasting conversation with your team using this simple template.',
                Creator: 'SmartOrg, Inc.',
                ImageURL: 'https://pbs.twimg.com/profile_images/2103701145/SmartOrgTwitterIcon.png',
                Title: 'Sales Forecast',
                CreatorLink: 'http://www.smartorg.com',
                Type: 'Forecast',
                Email: 'templates@smartorg.com'
            }, hasPlatform: false, name: 'salesForecast'
        },
            {info: {}, hasPlatform: true, name: 'drugplatform'},
            {
                info: {
                    Description: 'This template allows you to valuate an acquisition opportunity. ' +
                    'It has two components - an acquisition and an innovation piece. ' +
                    'The acquisition part incorporates uncertainty around successful ' +
                    'acquisition and integration, while the innovation part incorporates' +
                    ' uncertainty around being able to innovate on top of the acquisition.' +
                    ' This template incorporates astute thinking and will help anyone looking at ' +
                    'acquisitions ask the right questions and build a credible case.',
                    Creator: 'SmartOrg, Inc.',
                    ImageURL: 'https://pbs.twimg.com/profile_' +
                    'images/2103701145/SmartOrgTwitterIcon.png',
                    Title: 'Acqusition',
                    CreatorLink: 'http://www.smartorg.com',
                    Type: 'M&A',
                    Email: 'templates@smartorg.com'
                },
                hasPlatform: false, name: 'acquisition'
            }]);
    });

    it('when select one template, data should be assigned properly', function () {
        selectTemplateController.select({name: "templateA"});
        expect(selectTemplateController.selectedTemplate).toBe("templateA");
        expect(selectTemplateController.newTemplateName).toBe("templateA");
        expect(selectTemplateController.selected).toEqual({name: "templateA"});
    });
    describe("template deletion", function () {
        beforeEach(function () {
            spyOn(selectTemplateController, 'delete');
            selectTemplateController.select({name: "templateA"});
            selectTemplateController.delete();
        });
        it("should have deleted template", function () {
            expect(selectTemplateController.delete).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=selectTemplateSpec.js.map
