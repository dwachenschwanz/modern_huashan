/// <reference path="../lib/_all.ts"/>
var JsonController = /** @class */ (function () {
    function JsonController($route, $routeParams, $location, HUASHAN, Session, $cookies, $rootScope) {
        this.$rootScope = $rootScope;
        this.$route = $route;
        this.$routeParams = $routeParams;
        this.$location = $location;
        this.huashan = HUASHAN;
        this.session = Session;
        this.$cookies = $cookies;
        if (this.session.getCredentials() || this.$cookies.huashansession) {
            this.session.create(this.$cookies.huashansession);
        }
        else {
            this.$location.path("/login");
        }
        this.saveComplete = true;
        this.alerts = [];
        this.getTemplateJsonFiles();
        var that = this;
        this.$rootScope.$on("$locationChangeStart", function (event, next, current) {
            if (current.indexOf("#/json/") != -1 && !that.isUnchanged()) {
                if (!confirm("You have unsaved changes in json, continue navigating to " + next + " ?")) {
                    event.preventDefault();
                }
                else {
                    that.data = angular.copy(that.dataCopy);
                }
            }
        });
        var infoGot = localStorage.getItem("INFO");
        var decodedString = atob(infoGot);
        var userInfo = JSON.parse(decodedString);
        this.isAdmin = userInfo.is_admin;
    }
    JsonController.prototype.getTemplateJsonFiles = function () {
        var _this = this;
        this.huashan.GetTemplateJsonFiles(this.session.getCredentials(), this.$routeParams.templateID)
            .then(function (response) {
            _this.selectedTemplate = _this.$routeParams.templateID;
            var jsonFiles = response.result;
            _this.setData(jsonFiles);
        });
    };
    JsonController.prototype.setData = function (jsonFiles) {
        var data = {};
        data.name = this.selectedTemplate;
        data.hasPlatform = jsonFiles.appStructure.Platform;
        data.dataStructure = stringify(jsonFiles.dataStructure);
        data.appStructure = stringify(jsonFiles.appStructure);
        data.portfolioStructure = stringify(jsonFiles.portfolioStructure);
        data.platformDataStructure = stringify(jsonFiles.platformDataStructure);
        data.platformAppStructure = stringify(jsonFiles.platformAppStructure);
        data.platformPortfolioStructure = stringify(jsonFiles.platformPortfolioStructure);
        this.data = data;
        this.dataCopy = angular.copy(this.data);
    };
    JsonController.prototype.saveWithCommit = function (commitMessage) {
        if (commitMessage === void 0) { commitMessage = "Save Changes!"; }
        console.log("Click save!", commitMessage);
        this.save(commitMessage);
        $('#commitMessageModal').modal('hide');
    };
    JsonController.prototype.save = function (message) {
        var _this = this;
        this.alerts = [];
        if (!this.validateJSON()) {
            return;
        }
        ;
        this.saveComplete = false;
        this.saveErrorMessage = "";
        this.huashan.SaveTemplateJsonFiles(this.session.getCredentials(), this.data.name, {
            "data": this.createDataToSubmit(),
            "commitMessage": message
        })
            .then(function (response) {
            _this.saveComplete = true;
            if (response.status === false) {
                _this.saveErrorMessage = response.msg;
                _this.addAlert(_this.saveErrorMessage);
            }
            else {
                _this.dataCopy = angular.copy(_this.data);
            }
        });
    };
    JsonController.prototype.validateJSON = function () {
        for (var structure in this.data) {
            if (structure != "name" && structure != "hasPlatform" && !this.isJSON(structure, this.data[structure])) {
                return false;
            }
        }
        return true;
    };
    JsonController.prototype.createDataToSubmit = function () {
        var dataToSubmit = {};
        dataToSubmit.name = this.data.name;
        dataToSubmit.hasPlatform = this.data.hasPlatform;
        dataToSubmit.dataStructure = JSON.parse(this.data.dataStructure);
        dataToSubmit.appStructure = JSON.parse(this.data.appStructure);
        dataToSubmit.portfolioStructure = JSON.parse(this.data.portfolioStructure);
        dataToSubmit.platformDataStructure = JSON.parse(this.data.platformDataStructure);
        dataToSubmit.platformAppStructure = JSON.parse(this.data.platformAppStructure);
        dataToSubmit.platformPortfolioStructure = JSON.parse(this.data.platformPortfolioStructure);
        return dataToSubmit;
    };
    JsonController.prototype.closeJSON = function () {
        this.$location.path("selectTemplate");
    };
    JsonController.prototype.addAlert = function (msg) {
        this.alerts.push({ type: 'danger', msg: msg });
    };
    JsonController.prototype.closeAlert = function (index) {
        this.alerts.splice(index, 1);
    };
    JsonController.prototype.isUnchanged = function () {
        return angular.equals(this.data, this.dataCopy);
    };
    JsonController.prototype.isJSON = function (structureName, jsonStr) {
        try {
            JSON.parse(jsonStr);
        }
        catch (e) {
            this.addAlert("Illegal JSON object in " + structureName + ". " + e.message + ".");
            return false;
        }
        return true;
    };
    JsonController.prototype.platformExists = function () {
        return this.data !== undefined && this.data.platformDataStructure !== undefined && this.data.platformDataStructure.indexOf("Does not exist") === -1;
    };
    JsonController.prototype.addPlatformStubs = function () {
        var excelFileExtention = JSON.parse(this.data.dataStructure).ExcelFile.split('.').pop();
        this.data.platformDataStructure = stringify({
            "Outputs": [],
            "Inputs": [],
            "ID": this.data.name,
            "ExcelFile": this.data.name + "_template." + excelFileExtention,
            "Description": ""
        });
        this.data.platformAppStructure = stringify({
            "ID": this.data.name,
            "MENU": [],
            "PostProcessingOutputsForPortfolio": []
        });
        this.data.platformPortfolioStructure = stringify({
            "MENU": []
        });
        var tempAppStructure = JSON.parse(this.data.appStructure);
        tempAppStructure["Platform"] = true;
        this.data.appStructure = stringify(tempAppStructure);
    };
    return JsonController;
}());
function stringify(jsonObject) {
    return JSON.stringify(jsonObject, undefined, 4);
}
//# sourceMappingURL=jsonController.js.map