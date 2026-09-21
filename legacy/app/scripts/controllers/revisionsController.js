var RevisionsController = /** @class */ (function () {
    function RevisionsController($route, $routeParams, $location, HUASHAN, Session, $cookies, SERVER, $timeout, $http) {
        this.$location = $location;
        this.huashan = HUASHAN;
        this.$http = $http;
        this.baseUrl = SERVER.url;
        this.session = Session;
        this.$cookies = $cookies;
        this.$routeParams = $routeParams;
        this.$timeout = $timeout;
        this.selectedTemplate = this.$routeParams.templateID;
        this.templateGot = {};
        this.baseUrl = SERVER.url;
        this.compareClick = false;
        // this.getRevisions();
        this.getTemplateData();
        this.jsonCompareResult = null;
        if (this.session.getCredentials() || this.$cookies["huashansession"]) {
            this.session.create(this.$cookies["huashansession"]);
        }
        else {
            this.$location.path("/login");
        }
        var infoGot = localStorage.getItem("INFO");
        var decodedString = atob(infoGot);
        var userInfo = JSON.parse(decodedString);
        this.isAdmin = userInfo.is_admin;
    }
    RevisionsController.prototype.getTemplateData = function () {
        var _this = this;
        this.$http.get(this.baseUrl + '/domain/astro-templates/' + this.$routeParams.templateID, { "headers": { 'Authorization': 'jwttoken ' + localStorage.getItem("JWT-TOKEN") } }).then(function (response) {
            if (response.data.token) {
                localStorage.setItem("JWT-TOKEN", response.data.token);
            }
            if (response.data.data.status == 1) {
                _this.templateGot = response.data.data.template;
                _this.getRevisions();
            }
            else {
                _this.addAlert(response.data.data.message);
            }
            var data = response.data.data ? response.data.data : [];
        })["catch"](function (err) {
            console.error(err);
            _this.addAlert(err);
        });
    };
    RevisionsController.prototype.getRevisions = function () {
        var _this = this;
        this.huashan.GetRevisions(this.session.getCredentials(), this.$routeParams.templateID).then(function (response) {
            console.log(response);
            if (response.status) {
                var temLog = response.result.split('\n').map(function (item) {
                    return JSON.parse(item);
                });
                _this.re = { "revisionLogs": temLog };
                if (_this.re.revisionLogs) {
                    var revisionInfoGot = _this.re.revisionLogs.find(function (t) {
                        return t.commitNum == _this.templateGot.history.guid;
                    });
                    if (revisionInfoGot == undefined && _this.re.revisionLogs.length > 0) {
                        revisionInfoGot = _this.re.revisionLogs[0];
                    }
                    _this.selectedRevision = revisionInfoGot;
                    _this.getTemplateJsonFiles();
                    // this.switchRevisionByCommitHash(revisionInfoGot.commitNum)
                }
                _this.appStructureCopy = angular.copy(_this.appStructure);
            }
            else {
                _this.addAlert(_this.saveAlerts, 'danger', response.msg);
            }
        })["catch"](function (err) {
            console.error(err);
        });
    };
    RevisionsController.prototype.selectRevision = function (commitNumber, revision) {
        console.log(commitNumber);
        this.selectedRevision = revision;
        this.switchRevisionByCommitHash(commitNumber);
        // this.saveTemplateJsonFiles();
    };
    RevisionsController.prototype.switchRevisionByCommitHash = function (commitHash) {
        var _this = this;
        var c = this.session.getCredentials();
        var t = this.$routeParams.templateID;
        var data = {
            "commitHash": commitHash
        };
        this.huashan.SwitchRevisionByCommitHash(c, t, data).then(function (response) {
            _this.selectedTemplate = _this.$routeParams.templateID;
            var result = response.result;
            _this.getTemplateJsonFiles();
            _this.$timeout();
        })["catch"](function (response) {
            console.error(response);
        });
    };
    RevisionsController.prototype.getTemplateJsonFiles = function () {
        var _this = this;
        this.huashan.GetTemplateJsonFiles(this.session.getCredentials(), this.$routeParams.templateID)
            .then(function (response) {
            _this.selectedTemplate = _this.$routeParams.templateID;
            var jsonFiles = response.result;
            _this.setData(jsonFiles);
        });
    };
    RevisionsController.prototype.setData = function (jsonFiles) {
        var data = {};
        this.jsonData = {};
        data.name = this.selectedTemplate;
        data.hasPlatform = jsonFiles.appStructure.Platform;
        data.dataStructure = stringify(jsonFiles.dataStructure);
        data.appStructure = stringify(jsonFiles.appStructure);
        data.portfolioStructure = stringify(jsonFiles.portfolioStructure);
        data.platformDataStructure = stringify(jsonFiles.platformDataStructure);
        data.platformAppStructure = stringify(jsonFiles.platformAppStructure);
        data.platformPortfolioStructure = stringify(jsonFiles.platformPortfolioStructure);
        this.data = data;
        this.jsonData = data;
    };
    RevisionsController.prototype.platformExists = function () {
        return this.jsonData !== undefined && this.jsonData.platformDataStructure !== undefined && this.jsonData.platformDataStructure.indexOf("Does not exist") === -1;
    };
    RevisionsController.prototype.saveTemplateJsonFiles = function () {
        var _this = this;
        this.huashan.SaveTemplateJsonFiles(this.session.getCredentials(), this.data.name, {
            "data": this.createDataToSubmit(),
            "commitMessage": "Switch Revision"
        }).then(function (response) {
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
    RevisionsController.prototype.createDataToSubmit = function () {
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
    RevisionsController.prototype.downloadTemplate = function () {
        console.log("From revision: " + this.selectedTemplate);
        window.location = this.baseUrl + '/fileUploader?' + this.session.getCredentials() + '=' + this.selectedTemplate;
    };
    RevisionsController.prototype.clickItem = function (event, commitNum, revision) {
        this.jsonCompareResult = null;
        if (event.metaKey || event.ctrlKey || event.shiftKey) {
            // click with control, no other selected
            //click with control, has other selected
            this.selectedRevisionCompare = revision;
        }
        else {
            var confirmRevisionChange = confirm("Are you sure to switch to different revision of the template? (You can revert back anytime)");
            if (confirmRevisionChange) {
                this.selectedRevisionCompare = null;
                this.selectRevision(commitNum, revision);
            }
        }
    };
    RevisionsController.prototype.compareJsonFiles = function (selectedRevision, selectedRevisionCompare) {
        var _this = this;
        // var a = selectedRevision;
        // var b = selectedRevisionCompare;
        // console.log("a:+++++++")
        // console.log(a);
        // console.log("b:+++++++")
        // console.log(b);
        //call backend to compare json files
        var c = this.session.getCredentials();
        var t = this.$routeParams.templateID;
        var data = {
            "selectedRevision": selectedRevision,
            "selectedRevisionCompare": selectedRevisionCompare
        };
        this.huashan.CompareJsonFiles(c, t, data).then(function (response) {
            var temp = response.result.split('\n').map(function (item) {
                return JSON.parse(item);
            });
            _this.jsonCompareResult = temp[0];
        })["catch"](function (response) {
            console.error(response);
        });
    };
    RevisionsController.prototype.getDisplayNameBy = function (fileName) {
        var displayNames = {
            "appStructure": "App Structure",
            "dataStructure": "Data Structure",
            "portfolio": "Portfolio Structure",
            "platformAppStructure": "Platform App Structure",
            "platformDataStructure": "Platform Data Structure",
            "platformPortfolio": "Platform Portfolio Structure"
        };
        if (fileName) {
            var key = fileName.split("_")[1].split(".")[0];
            if (key in displayNames) {
                return displayNames[key];
            }
            else {
                return "no match name!";
            }
        }
        else {
            return "fileName is not exit.";
        }
    };
    RevisionsController.prototype.addAlert = function (msg) {
        this.alerts.push({ type: 'danger', msg: msg });
    };
    return RevisionsController;
}());
function stringify(jsonObject) {
    return JSON.stringify(jsonObject, undefined, 2);
}
//# sourceMappingURL=revisionsController.js.map