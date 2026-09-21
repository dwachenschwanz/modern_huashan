/// <reference path="../lib/_all.ts"/>

class JsonController {
    //injector
    huashan: Huashan;
    session: Session;
    $location: ng.ILocationService;
    $cookies: ng.cookies.ICookiesService;
    $route: ng.route.IRouteService;
    $routeParams: ng.route.IRouteParamsService;
    $rootScope: ng.IRootScopeService;
    //binding
    selectedTemplate: string;
    undeleteAlerts: any;
    saveComplete: boolean;
    alerts: any;
    data: any;
    dataCopy: any;
    saveErrorMessage: string;
    isAdmin: any;

    constructor($route, $routeParams, $location, HUASHAN, Session, $cookies, $rootScope) {
        this.$rootScope = $rootScope;
        this.$route = $route;
        this.$routeParams = $routeParams;
        this.$location = $location;
        this.huashan = HUASHAN;
        this.session = Session;
        this.$cookies = $cookies;
        if (this.session.getCredentials() || this.$cookies.huashansession) {
            this.session.create(this.$cookies.huashansession);
        } else {
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
                } else {
                    that.data = angular.copy(that.dataCopy);
                }
            }

        });

        let infoGot = localStorage.getItem("INFO")
        let decodedString = atob(infoGot);
        let userInfo = JSON.parse(decodedString);
        this.isAdmin = userInfo.is_admin
    }

    getTemplateJsonFiles() {
        this.huashan.GetTemplateJsonFiles(this.session.getCredentials(), this.$routeParams.templateID)
            .then((response) => {
                this.selectedTemplate = this.$routeParams.templateID;
                var jsonFiles = response.result;
                this.setData(jsonFiles);
            });
    }

    setData(jsonFiles) {
        var data: TemplateJSON = {};
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
    }

    saveWithCommit(commitMessage = "Save Changes!") {
        console.log("Click save!", commitMessage);
        this.save(commitMessage);
        $('#commitMessageModal').modal('hide');
    }

    save(message) {
        this.alerts = [];
        if (!this.validateJSON()) {
            return;
        };
        this.saveComplete = false;
        this.saveErrorMessage = "";
        this.huashan.SaveTemplateJsonFiles(this.session.getCredentials(),
            this.data.name, {
                "data": this.createDataToSubmit(),
                "commitMessage": message
            }
        )
            .then((response) => {
                this.saveComplete = true;
                if (response.status === false) {
                    this.saveErrorMessage = response.msg;
                    this.addAlert(this.saveErrorMessage);
                } else {
                    this.dataCopy = angular.copy(this.data);
                }
            });
    }

    validateJSON() {
        for (var structure in this.data) {
            if (structure != "name" && structure != "hasPlatform" && !this.isJSON(structure, this.data[structure])) {
                return false;
            }
        }
        return true;
    }

    createDataToSubmit() {
        var dataToSubmit: TemplateJSON = {};
        dataToSubmit.name = this.data.name;
        dataToSubmit.hasPlatform = this.data.hasPlatform;
        dataToSubmit.dataStructure = JSON.parse(this.data.dataStructure);
        dataToSubmit.appStructure = JSON.parse(this.data.appStructure);
        dataToSubmit.portfolioStructure = JSON.parse(this.data.portfolioStructure);
        dataToSubmit.platformDataStructure = JSON.parse(this.data.platformDataStructure);
        dataToSubmit.platformAppStructure = JSON.parse(this.data.platformAppStructure);
        dataToSubmit.platformPortfolioStructure = JSON.parse(this.data.platformPortfolioStructure);
        return dataToSubmit;
    }

    closeJSON() {
        this.$location.path("selectTemplate");
    }

    addAlert(msg) {
        this.alerts.push({type: 'danger', msg: msg});
    }

    closeAlert(index) {
        this.alerts.splice(index, 1);
    }

    isUnchanged() {
        return angular.equals(this.data, this.dataCopy);
    }

    isJSON(structureName, jsonStr) {
        try {
            JSON.parse(jsonStr);
        } catch (e) {
            this.addAlert("Illegal JSON object in " + structureName + ". " + e.message + ".");
            return false;
        }
        return true;
    }

    platformExists() {
        return this.data !== undefined && this.data.platformDataStructure !== undefined && this.data.platformDataStructure.indexOf("Does not exist") === -1;
    }

    addPlatformStubs() {
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
            "MENU": [],
        });
        var tempAppStructure = JSON.parse(this.data.appStructure);
        tempAppStructure["Platform"] = true;
        this.data.appStructure = stringify(tempAppStructure);
    }

}

interface TemplateJSON {
    name: string;
    hasPlatform: boolean;
    dataStructure: {};
    appStructure: {};
    portfolioStructure: {};
    platformDataStructure: {};
    platformAppStructure: {};
    platformPortfolioStructure: {};
}

function stringify(jsonObject) {
    return JSON.stringify(jsonObject, undefined, 4);
}