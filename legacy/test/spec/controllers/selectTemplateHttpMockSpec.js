'use strict';
describe('Controller: selectTemplateController (HTTP Mocking)', function () {
    // load the controller's module
    beforeEach(module('huashanApp'));
    var selectTemplateController, scope, injector, location, flush, controller, httpBackend, templates, myTemplateResponse;
    beforeEach(inject(function ($httpBackend) {
        httpBackend = $httpBackend;
        myTemplateResponse = { "commands": [{ "name": "Data", "paramCount": "2", "parameters": [{ "name": "templateList", "value": "W3siaW5mbyI6IHsiRGVzY3JpcHRpb24iOiAiVGhpcyBzaW1wbGUgdGVtcGxhdGUgaGVscHMgeW91%0AIGZvcmVjYXN0IHJldmVudWVzIGFuZCBtYXJnaW5zIGluIHRoZSBmdXR1cmUuIFlvdSBjYW4gcGlj%0AayBhIHN1aXRhYmxlIGZ1dHVyZSB0aW1lIGZyYW1lIChsaWtlIDUgeWVhcnMgb3V0KSBhbmQgcnVu%0AIGEgZm9yZWNhc3RpbmcgY29udmVyc2F0aW9uIHdpdGggeW91ciB0ZWFtIHVzaW5nIHRoaXMgc2lt%0AcGxlIHRlbXBsYXRlLiIsICJDcmVhdG9yIjogIlNtYXJ0T3JnLCBJbmMuIiwgIkltYWdlVVJMIjog%0AImh0dHBzOi8vcGJzLnR3aW1nLmNvbS9wcm9maWxlX2ltYWdlcy8yMTAzNzAxMTQ1L1NtYXJ0T3Jn%0AVHdpdHRlckljb24ucG5nIiwgIlRpdGxlIjogIlNhbGVzIEZvcmVjYXN0IiwgIkNyZWF0b3JMaW5r%0AIjogImh0dHA6Ly93d3cuc21hcnRvcmcuY29tIiwgIlR5cGUiOiAiRm9yZWNhc3QiLCAiRW1haWwi%0AOiAidGVtcGxhdGVzQHNtYXJ0b3JnLmNvbSJ9LCAiaGFzUGxhdGZvcm0iOiBmYWxzZSwgIm5hbWUi%0AOiAic2FsZXNGb3JlY2FzdCJ9LCB7ImluZm8iOiB7fSwgImhhc1BsYXRmb3JtIjogdHJ1ZSwgIm5h%0AbWUiOiAiZHJ1Z3BsYXRmb3JtIn0sIHsiaW5mbyI6IHsiRGVzY3JpcHRpb24iOiAiVGhpcyB0ZW1w%0AbGF0ZSBhbGxvd3MgeW91IHRvIHZhbHVhdGUgYW4gYWNxdWlzaXRpb24gb3Bwb3J0dW5pdHkuIEl0%0AIGhhcyB0d28gY29tcG9uZW50cyAtIGFuIGFjcXVpc2l0aW9uIGFuZCBhbiBpbm5vdmF0aW9uIHBp%0AZWNlLiBUaGUgYWNxdWlzaXRpb24gcGFydCBpbmNvcnBvcmF0ZXMgdW5jZXJ0YWludHkgYXJvdW5k%0AIHN1Y2Nlc3NmdWwgYWNxdWlzaXRpb24gYW5kIGludGVncmF0aW9uLCB3aGlsZSB0aGUgaW5ub3Zh%0AdGlvbiBwYXJ0IGluY29ycG9yYXRlcyB1bmNlcnRhaW50eSBhcm91bmQgYmVpbmcgYWJsZSB0byBp%0Abm5vdmF0ZSBvbiB0b3Agb2YgdGhlIGFjcXVpc2l0aW9uLiBUaGlzIHRlbXBsYXRlIGluY29ycG9y%0AYXRlcyBhc3R1dGUgdGhpbmtpbmcgYW5kIHdpbGwgaGVscCBhbnlvbmUgbG9va2luZyBhdCBhY3F1%0AaXNpdGlvbnMgYXNrIHRoZSByaWdodCBxdWVzdGlvbnMgYW5kIGJ1aWxkIGEgY3JlZGlibGUgY2Fz%0AZS4iLCAiQ3JlYXRvciI6ICJTbWFydE9yZywgSW5jLiIsICJJbWFnZVVSTCI6ICJodHRwczovL3Bi%0Acy50d2ltZy5jb20vcHJvZmlsZV9pbWFnZXMvMjEwMzcwMTE0NS9TbWFydE9yZ1R3aXR0ZXJJY29u%0ALnBuZyIsICJUaXRsZSI6ICJBY3F1c2l0aW9uIiwgIkNyZWF0b3JMaW5rIjogImh0dHA6Ly93d3cu%0Ac21hcnRvcmcuY29tIiwgIlR5cGUiOiAiTSZBIiwgIkVtYWlsIjogInRlbXBsYXRlc0BzbWFydG9y%0AZy5jb20ifSwgImhhc1BsYXRmb3JtIjogZmFsc2UsICJuYW1lIjogImFjcXVpc2l0aW9uIn1d%0A" }, { "name": "status", "value": "1" }] }], "context": {} };
        httpBackend.when('GET', 'https://localhost/kirk/wizard/main?command=GetTemplates&kreds=fakeCredentials').respond(templateResponse());
        flush = httpBackend.flush;
    }));
    function templateResponse() {
        return myTemplateResponse;
    }
    function deleteTemplateResponse() {
        return { "commands": [{ "name": "Data", "paramCount": "2", "parameters": [{ "name": "result", "value": "U3VjY2Vzc2Z1bGx5IGRlbGV0ZWQgdGVtcGxhdGUgYWNxdWlzaXRpb24uIFlvdSBjYW4gdW5kZWxl%0AdGUgYnkgaXNzdWluZyBVbmRlbGV0ZSBjb21tYW5kLg%3D%3D%0A" }, { "name": "status", "value": "1" }] }], "context": {} };
    }
    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, $rootScope, $injector, $templateCache, $location, $q) {
        scope = $rootScope.$new();
        var huashan = $injector.get('HUASHAN');
        console.log(huashan);
        var Session = $injector.get("Session");
        Session.create("fakeCredentials");
        var $cookies = $injector.get("$cookies");
        $cookies.huashansession = "fakeCredentials";
        controller = $controller;
        httpBackend.expect('GET', 'https://localhost/kirk/wizard/main?command=GetTemplates&kreds=fakeCredentials');
        selectTemplateController = controller('SelectTemplateController', { $scope: scope });
        selectTemplateController.hideDeleteModal = function () {
            console.log("SLURRRP");
        };
        flush();
        expect(selectTemplateController).not.toBe(undefined);
        templates = selectTemplateController.templates;
    }));
    it('templates should not be undefined', function () {
        expect(templates).not.toBe(undefined);
    });
    it('should not select any template', function () {
        expect(selectTemplateController.selectedTemplate).toBe("Not Selected");
    });
    it('should get back three templates', function () {
        expect(templates.length).toBe(3);
    });
    it('template names should match', function () {
        var templateNames = ["salesForecast", "drugplatform", "acquisition"];
        for (var i = 0; i < templates.length; i++) {
            expect(templates[i].name).toBe(templateNames[i]);
        }
    });
    it("some templates should have information", function () {
        var salesForecast = templates[0];
        var info = salesForecast.info;
        expect(info.Type).toBe("Forecast");
        expect(info.Email).toBe("templates@smartorg.com");
        expect(info.Creator).toBe("SmartOrg, Inc.");
        expect(info.ImageURL).toBe("https://pbs.twimg.com/profile_images/2103701145/SmartOrgTwitterIcon.png");
        expect(info.CreatorLink).toBe("http://www.smartorg.com");
        expect(info.Title).toBe("Sales Forecast");
        expect(info.Description).toBe("This simple template helps you forecast revenues and margins in the future. You can pick a suitable future time frame (like 5 years out) and run a forecasting conversation with your team using this simple template.");
    });
    it("should have the platform tag", function () {
        var expected = [false, true, false];
        for (var i = 0; i < templates.length; i++) {
            expect(templates[i].hasPlatform).toBe(expected[i]);
        }
    });
    it("should select a template properly", function () {
        selectTemplateController.select(templates[0]);
        expect(selectTemplateController.selectedTemplate).toBe("salesForecast");
        expect(selectTemplateController.selected).toBe(templates[0]);
        expect(selectTemplateController.newTemplateName).toBe("salesForecast");
    });
    it("should add alerts properly", function () {
        var alert = [];
        selectTemplateController.addAlert(alert, 'danger', "Error");
        expect(alert).toEqual([{ type: 'danger', msg: "Error" }]);
    });
    it("should close alerts properly", function () {
        var alert = [{ type: 'danger', msg: "Error" }];
        selectTemplateController.closeAlert(alert, 0);
        expect(alert).toEqual([]);
    });
    it("should validate the file name when uploading", function () {
        selectTemplateController.submitAlerts = [];
        selectTemplateController.validateFileName("myTemplate.xlsx");
        expect(selectTemplateController.submitAlerts).toEqual([]);
        selectTemplateController.submitAlerts = [];
        selectTemplateController.validateFileName("myTemplate.xlsm");
        expect(selectTemplateController.submitAlerts).toEqual([]);
        selectTemplateController.submitAlerts = [];
        selectTemplateController.validateFileName("my template.xls");
        expect(selectTemplateController.submitAlerts).toEqual([{ type: 'danger', msg: "No spaces allowed in file name." }]);
        selectTemplateController.submitAlerts = [];
        selectTemplateController.validateFileName("myTemplate.xls");
        expect(selectTemplateController.submitAlerts).toEqual([]);
        selectTemplateController.validateFileName("my_template.xls");
        expect(selectTemplateController.submitAlerts).toEqual([{ type: 'danger', msg: "No underscore allowed in file name." }]);
    });
    it("should delete templates properly", function () {
        selectTemplateController.selectedTemplate = "acquisition";
        httpBackend.when('GET', 'https://localhost/kirk/wizard/main?command=DeleteTemplate&kreds=fakeCredentials&templateName=acquisition').respond(deleteTemplateResponse());
        myTemplateResponse = { "commands": [{ "name": "Data", "paramCount": "2", "parameters": [{ "name": "templateList", "value": "W3siaW5mbyI6IHsiRGVzY3JpcHRpb24iOiAiVGhpcyBzaW1wbGUgdGVtcGxhdGUgaGVscHMgeW91%0AIGZvcmVjYXN0IHJldmVudWVzIGFuZCBtYXJnaW5zIGluIHRoZSBmdXR1cmUuIFlvdSBjYW4gcGlj%0AayBhIHN1aXRhYmxlIGZ1dHVyZSB0aW1lIGZyYW1lIChsaWtlIDUgeWVhcnMgb3V0KSBhbmQgcnVu%0AIGEgZm9yZWNhc3RpbmcgY29udmVyc2F0aW9uIHdpdGggeW91ciB0ZWFtIHVzaW5nIHRoaXMgc2lt%0AcGxlIHRlbXBsYXRlLiIsICJDcmVhdG9yIjogIlNtYXJ0T3JnLCBJbmMuIiwgIkltYWdlVVJMIjog%0AImh0dHBzOi8vcGJzLnR3aW1nLmNvbS9wcm9maWxlX2ltYWdlcy8yMTAzNzAxMTQ1L1NtYXJ0T3Jn%0AVHdpdHRlckljb24ucG5nIiwgIlRpdGxlIjogIlNhbGVzIEZvcmVjYXN0IiwgIkNyZWF0b3JMaW5r%0AIjogImh0dHA6Ly93d3cuc21hcnRvcmcuY29tIiwgIlR5cGUiOiAiRm9yZWNhc3QiLCAiRW1haWwi%0AOiAidGVtcGxhdGVzQHNtYXJ0b3JnLmNvbSJ9LCAiaGFzUGxhdGZvcm0iOiBmYWxzZSwgIm5hbWUi%0AOiAic2FsZXNGb3JlY2FzdCJ9LCB7ImluZm8iOiB7fSwgImhhc1BsYXRmb3JtIjogdHJ1ZSwgIm5h%0AbWUiOiAiZHJ1Z3BsYXRmb3JtIn1d%0A" }, { "name": "status", "value": "1" }] }], "context": {} };
        //myTemplateResponse = {"commands":[{"name":"Data","paramCount":"2","parameters":[{"name":"templateList","value":"Ha ha"},{"name":"status","value":"1"}]}],"context":{}};
        //httpBackend.when('GET', 'https://localhost/kirk/wizard/main?command=GetTemplates&kreds=fakeCredentials'
        //    ).respond(myTemplateResponse);
        //httpBackend.expect('GET','https://localhost/kirk/wizard/main?command=DeleteTemplate&kreds=fakeCredentials&templateName=acquisition');
        //httpBackend.expect('GET','https://localhost/kirk/wizard/main?command=GetTemplates&kreds=fakeCredentials');
        selectTemplateController["delete"]();
        flush();
        //expect(selectTemplateController.templates.length).toBe(2);
    });
    it("should replace spaces in a file name", function () {
        var newFileName = selectTemplateController.replaceSpace("file name");
        expect(newFileName).toEqual("file_name");
    });
    it("should be able to check if the file-to-upload exist and give an alert if it doesn't", function () {
        selectTemplateController.submitAlerts = [];
        var exist = selectTemplateController.checkFileExist();
        expect(exist).toBe(false);
        expect(selectTemplateController.submitAlerts.length).toBe(1);
        expect(selectTemplateController.submitAlerts).toEqual([{ type: 'danger', msg: "Please select a file." }]);
        selectTemplateController.submitAlerts = [];
        selectTemplateController.fileToUpload = { name: 'fileName' };
        exist = selectTemplateController.checkFileExist();
        expect(exist).toBe(true);
        expect(selectTemplateController.submitAlerts.length).toBe(0);
    });
    it("should select a deleted template properly", function () {
        selectTemplateController.selectDeleted('acquisition');
        expect(selectTemplateController.selectedDeletedTemplate).toBe('acquisition');
    });
});
//# sourceMappingURL=selectTemplateHttpMockSpec.js.map