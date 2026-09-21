/// <reference path="../lib/_all.ts"/>
var saveBolb = (function () {
    var a = document.createElement("a");
    a.style.cssText = "display: none !important";
    document.body.appendChild(a);
    return function (blob, fileName) {
        var url = window.URL.createObjectURL(blob.data);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    };
})();
var SelectTemplateController = /** @class */ (function () {
    function SelectTemplateController($location, HUASHAN, Session, $cookies, SERVER, $http) {
        this.$http = $http;
        this.$location = $location;
        this.huashan = HUASHAN;
        this.baseUrl = SERVER.url;
        this.uploadedAstroTemplate = { name: '', groups: [], creatorGroups: [], history: [] };
        this.allGroup = 'ALL';
        this.groups = [{ "_id": 1, groupname: this.allGroup }];
        this.userGroups = [];
        this.session = Session;
        this.$cookies = $cookies;
        this.myInterval = 3000;
        this.sort = { column: "name", descending: false };
        this.slides = [];
        if (this.session.getCredentials() || this.$cookies["huashansession"]) {
            this.session.create(this.$cookies["huashansession"]);
        }
        else {
            this.$location.path("/login");
        }
        this.addSlides();
        this.selectedTemplate = "Not Selected";
        this.loading = false;
        this.loadingTable = false;
        this.loadingDeleteList = false;
        this.ogre = false;
        this.ogreStage = "";
        this.selectedOgreModel = "";
        this.ogreBuildCompleted = false;
        this.templateName = "";
        this.portfolioNameList = [];
        this.selectedPortfolioName = "";
        this.revisionInfo = null;
        this.alertMsg = {};
        var infoGot = localStorage.getItem("INFO");
        var decodedString = atob(infoGot);
        this.userInfo = JSON.parse(decodedString);
        this.isAdmin = this.userInfo.is_admin;
        this.initRetrieval();
    }
    SelectTemplateController.prototype.initRetrieval = function () {
        this.getGroups();
    };
    SelectTemplateController.prototype.syncTemplate = function (tempalteID) {
        var _this = this;
        this.showMessage = null;
        this.showMessageContent = null;
        this.huashan.SyncTemplate(this.session.getCredentials(), tempalteID).then(function (response) {
            if (response.status) {
                _this.showMessage = "Success";
                _this.showMessageContent = "Template synced successfully!";
            }
            else {
                console.error(response);
                _this.showMessage = "Failure";
                _this.showMessageContent = "Template sync failed, please contact support!";
            }
        })["catch"](function (err) {
            console.error(err);
            _this.showMessage = "Failure";
            _this.showMessageContent = "Template sync failed, please contact support!";
        });
    };
    SelectTemplateController.prototype.getRevisionInfo = function (tempalteID, history) {
        var _this = this;
        this.huashan.GetRevisions(this.session.getCredentials(), tempalteID).then(function (response) {
            console.log(response);
            if (!response.status) {
                _this.revisionInfo = null;
            }
            if (response.status) {
                var temLog = response.result.split('\n').map(function (item) {
                    return JSON.parse(item);
                });
                var revisionInfoGot = temLog.find(function (t) {
                    return t.commitNum == history.guid;
                });
                if (revisionInfoGot == undefined && temLog.length > 0) {
                    revisionInfoGot = temLog[0];
                }
                _this.revisionInfo = revisionInfoGot;
            }
            else {
                _this.addAlert(_this.saveAlerts, 'danger', response.msg);
            }
        })["catch"](function (err) {
            console.error(err);
        });
    };
    SelectTemplateController.prototype.addSlides = function () {
        /*
         var newWidth = 600 + this.slides.length;
         this.slides.push({
         image: 'http://placekitten.com/' + newWidth + '/300',
         text: ['More', 'Extra', 'Lots of', 'Surplus'][this.slides.length % 4] + ' ' +
         ['Cats', 'Kittys', 'Felines', 'Cutes'][this.slides.length % 4]
         });*/
        this.slides = [
            {
                image: app.server + "/AstroTmp/tmpcharts/vimg_000101010000000000_17003.png",
                text: "image 1"
            },
            {
                image: app.server + "/AstroTmp/tmpcharts/vimg_000101010000000000_24009.png",
                text: "image 2"
            },
            {
                image: app.server + "/AstroTmp/tmpcharts/vimg_000101010000000000_1929.png",
                text: "image 3"
            },
            {
                image: app.server + "/AstroTmp/tmpcharts/vimg_000101010000000000_10586.png",
                text: "image 4"
            }
        ];
    };
    SelectTemplateController.prototype.findAssociatedPortfolios = function () {
        var _this = this;
        this.huashan.FindAssociatedPortfolios(this.session.credentials, this.selectedTemplate).then(function (response) {
            if (response.status) {
                _this.portfolioNameList = response.result;
            }
            else {
                alert("Some error happened: " + response.msg);
            }
        });
    };
    SelectTemplateController.prototype.initializeUpdateDataStructure = function () {
        this.updateDataStructure = {
            Leaf: true,
            Platform: false
        };
    };
    SelectTemplateController.prototype.selectPortfolioName = function (portfolioName) {
        this.selectedPortfolioName = portfolioName;
    };
    SelectTemplateController.prototype.resetPortfolioName = function (portfolioName) {
        this.selectedPortfolioName = "";
    };
    SelectTemplateController.prototype.runUpdateDataStructure = function () {
        var _this = this;
        this.runningUpdateDataStructure = "Running";
        if (this.portfolioNameList.length > 0) {
            this.huashan.UpdateDataStructure(this.session.credentials, TheUte().pack(this.selectedPortfolioName), this.updateDataStructure.Leaf, this.updateDataStructure.Platform).then(function (response) {
                if (response.status) {
                    console.log("Updated!!");
                    _this.runningUpdateDataStructure = "Success";
                }
                else {
                    alert("Some error happened: " + response.msg);
                    _this.runningUpdateDataStructure = "Failure";
                    _this.responseMsg = response.msg;
                }
            });
        }
    };
    SelectTemplateController.prototype.getTemplates = function () {
        var _this = this;
        this.templates = [];
        this.loadingTable = true;
        this.huashan.GetAstroTemplates(this.session.getCredentials()).then(function (response) {
            if (response.status) {
                _this.templates = response.result;
                var selectedTemplateJSONGot = localStorage.getItem('selectedTemplate');
                if (selectedTemplateJSONGot) {
                    var selectedTemplateGot_1 = JSON.parse(selectedTemplateJSONGot);
                    _this.selectedTemplate = selectedTemplateGot_1.name;
                    var updatedTemplate = response.result.find(function (r) { return r.name == selectedTemplateGot_1.name; });
                    if (updatedTemplate) {
                        _this.findAssociatedPortfolios();
                        _this.getRevisionInfo(selectedTemplateGot_1.name, updatedTemplate.history);
                    }
                    else {
                        _this.selectedTemplate = "Not Selected";
                        localStorage.removeItem('selectedTemplate');
                    }
                }
                else {
                    _this.selectedTemplate = "Not Selected";
                }
                _this.loadingTable = false;
            }
            else {
                // alert("Templates not found! Reasons: " + response.msg);
                _this.alertMsg.msg = "Templates not found! " + response.msg;
                $('#infoMsgAlert').fadeIn('fast').delay(3000).fadeOut('fast');
                _this.loadingTable = false;
            }
        });
    };
    SelectTemplateController.prototype.filterTemplatesByUserGroups = function (templates) {
        var _this = this;
        var filteredTemplates = templates;
        if (!this.isAdmin) {
            filteredTemplates = templates.filter(function (template) {
                // Check if any of the groups in the template have ids present in userGroups
                return template.groups.some(function (group) { return group.groupname == _this.allGroup || _this.userGroups.includes(group._id); }) ||
                    template.creatorGroups.some(function (groupId) { return _this.userGroups.includes(groupId); });
            });
        }
        return filteredTemplates;
    };
    SelectTemplateController.prototype.saveAstroTemplate = function () {
        var _this = this;
        var that = this;
        this.$http.post(this.baseUrl + '/domain/astro-templates', this.uploadedAstroTemplate, { "headers": { 'Authorization': 'jwttoken ' + localStorage.getItem("JWT-TOKEN") } })
            .then(function (response) {
            if (response.data.token) {
                localStorage.setItem("JWT-TOKEN", response.data.token);
            }
            $('#uploadModal').modal('hide');
            that.getTemplates();
            if (response.data.data.status == 1) {
                that.alertMsg.type = "info";
                that.alertMsg.msg = response.data.data.message;
                $('#infoMsgAlert').fadeIn('fast').delay(3000).fadeOut('fast');
            }
            else {
                $('#uploadSuccessAlert').fadeIn('fast').delay(2000).fadeOut('fast');
            }
        })["catch"](function (err) {
            console.error(err);
            _this.addAlert(_this.submitAlerts, 'danger', "Upload failed due to: " + (err.data ? err.data.message : err));
        });
    };
    SelectTemplateController.prototype.getGroupsForUser = function () {
        var that = this;
        var groupsGot = [];
        var user_id = this.userInfo.uid;
        console.log('User Info:' + user_id);
        if (this.groups) {
            this.groups.forEach(function (gp) {
                if (gp.groupname !== that.allGroup) {
                    if (gp.users.indexOf(user_id) > -1) {
                        groupsGot.push(gp._id);
                    }
                }
            });
        }
        this.uploadedAstroTemplate.creatorId = user_id;
        this.userGroups = groupsGot;
        this.getTemplates();
    };
    SelectTemplateController.prototype.getGroups = function () {
        var _this = this;
        this.$http.get(this.baseUrl + '/framework/admin/group/list', { "headers": { 'Authorization': 'jwttoken ' + localStorage.getItem("JWT-TOKEN") } }).then(function (response) {
            if (response.data.token) {
                localStorage.setItem("JWT-TOKEN", response.data.token);
            }
            var data = response.data.data ? response.data.data : [];
            for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
                var group = data_1[_i];
                _this.groups.push(group);
            }
            _this.getGroupsForUser();
        })["catch"](function (err) {
            console.error(err);
            _this.alertMsg.type = "danger";
            _this.alertMsg.msg = "(SESSION EXPIRED) Data retrieval failed due to: " + (err.data ? err.data.message : err);
            $('#errorMsgAlert').fadeIn('fast').delay(3000).fadeOut('fast');
            _this.$location.path("/login");
        });
    };
    SelectTemplateController.prototype.select = function (template) {
        this.portfolioNameList = [];
        var templateName = template.name;
        this.selectedTemplate = templateName;
        var templateStringify = JSON.stringify(template);
        localStorage.setItem("selectedTemplate", templateStringify);
        this.selected = template;
        this.newTemplateName = this.selectedTemplate;
        this.findAssociatedPortfolios();
        this.getRevisionInfo(template.name, template.history);
        // Close all edit box.
        this.editCreator = false;
        this.editDescription = false;
        this.editCreatorLink = false;
        this.editEmail = false;
        this.editVersion = false;
        this.editVersionLog = false;
        this.showVersionLog = false;
        //this.$apply(); May not be needed??
    };
    SelectTemplateController.prototype.listDeletedTemplates = function () {
        var _this = this;
        this.loadingDeleteList = true;
        this.deletedTemplates = [];
        this.huashan.GetArchivedAstroTemplates(this.session.getCredentials()).then(function (response) {
            if (response.status) {
                _this.deletedTemplates = _this.extractNamesOnly(response.result);
                _this.selectedDeletedTemplate = "Not Selected";
                _this.loadingDeleteList = false;
            }
            else {
                // alert("Deleted templates not found! Reasons: " + response.msg);
                // this.deletedTemplates=[]
                _this.alertMsg.msg = "Deleted templates not found! " + response.msg;
                $('#infoMsgAlert').fadeIn('fast').delay(3000).fadeOut('fast');
                _this.loadingDeleteList = false;
                _this.selectedDeletedTemplate = "Not Selected";
            }
        });
    };
    SelectTemplateController.prototype.extractNamesOnly = function (list) {
        var extracted = [];
        list.forEach(function (l) {
            extracted.push(l.name);
        });
        return extracted;
    };
    SelectTemplateController.prototype.selectDeleted = function (deleted) {
        this.selectedDeletedTemplate = deleted;
    };
    SelectTemplateController.prototype["delete"] = function () {
        var _this = this;
        this.loading = true;
        this.deleteAlerts = [];
        this.huashan.DeleteTemplate(this.session.getCredentials(), this.selectedTemplate).then(function (response) {
            console.log("In DeleteTemplate(): " + response.status);
            if (response.status) {
                _this.hideDeleteModal();
                _this.selectedTemplate = "Not Selected";
                localStorage.removeItem('selectedTemplate');
                _this.getTemplates();
                _this.loading = false;
            }
            else {
                _this.addAlert(_this.deleteAlerts, 'danger', response.msg);
                console.log(_this.deleteAlerts);
                _this.loading = false;
            }
        });
    };
    SelectTemplateController.prototype.hideDeleteModal = function () {
        $('#deleteModal').modal('hide');
    };
    SelectTemplateController.prototype.undelete = function () {
        var _this = this;
        this.loading = true;
        this.undeleteAlerts = [];
        this.huashan.UndeleteTemplate(this.session.getCredentials(), this.selectedDeletedTemplate).then(function (response) {
            if (response.status) {
                _this.getTemplates();
                _this.listDeletedTemplates();
                _this.selectedDeletedTemplate = "Not Selected";
                _this.loading = false;
            }
            else {
                _this.loading = false;
                _this.selectedDeletedTemplate = "Not Selected";
                _this.addAlert(_this.undeleteAlerts, 'danger', response.msg);
            }
        });
    };
    SelectTemplateController.prototype.downloadTemplate = function () {
        var _this = this;
        console.log(this.selectedTemplate);
        this.loading = true;
        var url = this.baseUrl + '/wizard/download/excel/' + this.selectedTemplate;
        //The following line is for wizard_api.py file mechanism (For servers)
        // var url = this.baseUrl+'/wizard-api/wizard/download/excel/' + this.selectedTemplate;
        this.$http.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'jwttoken ' + localStorage.getItem("JWT-TOKEN"),
                'Accept': 'application/vnd.ms-excel'
            }, responseType: 'blob'
        }).then(function (response) {
            _this.loading = false;
            saveBolb(response, _this.selectedTemplate);
            console.log(response);
        })["catch"](function (err) {
            _this.loading = false;
            console.error(err);
        });
        // window.location = this.baseUrl + '/fileUploader?' + this.session.getCredentials() + '=' + this.selectedTemplate;
    };
    SelectTemplateController.prototype.rename = function () {
        var _this = this;
        this.loading = true;
        this.renameAlerts = [];
        if (this.newTemplateName === "") {
            this.addAlert(this.renameAlerts, 'danger', "Template name cannot be blank.");
            return;
        }
        this.newTemplateName = this.replaceSpace(this.newTemplateName);
        this.huashan.RenameTemplate(this.session.getCredentials(), this.selectedTemplate, this.newTemplateName).then(function (response) {
            if (response.status) {
                _this.loading = false;
                $('#renameModal').modal('hide');
                _this.getTemplates();
            }
            else {
                _this.loading = false;
                _this.addAlert(_this.renameAlerts, 'danger', response.msg);
            }
        });
    };
    SelectTemplateController.prototype.templateNameFrom = function (fileName) {
        var indexOfDot = fileName.indexOf(".");
        return fileName.substr(0, indexOfDot);
    };
    SelectTemplateController.prototype.smartogrify = function () {
        var _this = this;
        this.submitAlerts = [];
        if (!this.checkFileExist()) {
            return;
        }
        var fileName = this.fileToUpload.name;
        if (!this.validateFileName(fileName)) {
            return;
        }
        this.templateName = this.templateNameFrom(fileName);
        var uploadData = new FormData();
        uploadData.append('file', this.fileToUpload, this.fileToUpload.name);
        var url = this.baseUrl + '/wizard-api/wizard/upload';
        return this.$http({
            method: 'POST',
            url: url,
            data: uploadData,
            headers: {
                'Authorization': 'jwttoken ' + localStorage.getItem("JWT-TOKEN"),
                'Content-Type': undefined
            },
            transformRequest: angular.identity
        }).then(function (response) {
            console.log(response);
            $('#uploadModal').modal('hide');
            _this.$http.post(_this.baseUrl + '/app/file', { fileName: fileName }).then(function (response) {
                console.log(response);
            })["catch"](function (err) {
                console.error(err);
            });
            _this.getTemplates();
            $('#pyOrgrigySuccessAlert').fadeIn('fast').delay(1000).fadeOut('fast');
        })["catch"](function (err) {
            console.error(err);
            _this.addAlert(_this.submitAlerts, 'danger', "Failed due to: " + err);
        });
    };
    SelectTemplateController.prototype.generateProductPortfolio = function (selectedOgreModel) {
        this.ogreStage = "GeneratingTemplate";
        this.selectedOgreModel = selectedOgreModel;
        this.ogreMakeTemplate();
    };
    SelectTemplateController.prototype.ogreMakeTemplate = function () {
        var _this = this;
        this.huashan.OgreMakeTemplate(this.session.getCredentials(), this.templateName, this.selectedOgreModel).then(function (response) {
            if (response.status) {
                _this.ogreBuildCompleted = true;
            }
            else {
                alert("Some error happened: " + response.msg);
            }
        });
    };
    SelectTemplateController.prototype.submit = function () {
        var _this = this;
        this.loading = true;
        this.submitAlerts = [];
        if (!this.checkFileExist()) {
            this.loading = false;
            return;
        }
        var fileName = this.fileToUpload.name;
        if (!this.validateFileName(fileName)) {
            this.loading = false;
            return;
        }
        // const uploadData = new FormData();
        // uploadData.append('file', this.fileToUpload, this.fileToUpload.name);
        var url = this.baseUrl + '/wizard/upload/' + fileName;
        //The following line is for wizard_api.py file mechanism (For servers)
        // var url = this.baseUrl+'/wizard-api/wizard/upload';
        return this.$http({
            method: 'POST',
            url: url,
            data: this.fileToUpload,
            headers: {
                'Authorization': 'jwttoken ' + localStorage.getItem("JWT-TOKEN"),
                'Content-Type': undefined
            },
            transformRequest: angular.identity
        }).then(function (response) {
            console.log(response);
            // this.saveAstroTemplate()
            // console.log(response);
            $('#uploadModal').modal('hide');
            _this.loading = false;
            _this.getTemplates();
            _this.fileToUpload = undefined;
            var fileInput = document.getElementById('FileToUploadID');
            fileInput.value = '';
            if (response.data && response.data.data && response.data.data.status == 1) {
                _this.alertMsg.type = "info";
                _this.alertMsg.msg = response.data.data.message;
                $('#infoMsgAlert').fadeIn('fast').delay(3000).fadeOut('fast');
            }
            else {
                $('#uploadSuccessAlert').fadeIn('fast').delay(2000).fadeOut('fast');
            }
        })["catch"](function (err) {
            _this.loading = false;
            console.error(err);
            _this.addAlert(_this.submitAlerts, 'danger', "Upload failed due to: " + (err.data ? err.data.message : err));
        });
    };
    SelectTemplateController.prototype.replaceSpace = function (fileName) {
        return fileName.replace(/\s+/g, "_");
    };
    SelectTemplateController.prototype.checkFileExist = function () {
        if (this.fileToUpload === undefined) {
            this.addAlert(this.submitAlerts, "danger", "Please select a file.");
            return false;
        }
        else {
            return true;
        }
    };
    SelectTemplateController.prototype.validateFileName = function (fileName) {
        if (fileName.slice(fileName.indexOf('.') + 1).indexOf('xls') === -1) {
            this.addAlert(this.submitAlerts, 'danger', "Only Excel files are accepted!");
            return false;
        }
        else if (fileName.indexOf(' ') !== -1) {
            this.addAlert(this.submitAlerts, 'danger', "No spaces allowed in file name.");
            return false;
        }
        else if (fileName.indexOf('_') !== -1) {
            this.addAlert(this.submitAlerts, 'danger', "No underscore allowed in file name.");
            return false;
        }
        else {
            this.uploadedAstroTemplate.name = fileName.split('.')[0];
            return true;
        }
    };
    SelectTemplateController.prototype.addAlert = function (alert, type, msg) {
        alert.push({ type: type, msg: msg });
    };
    SelectTemplateController.prototype.closeAlert = function (alert, index) {
        alert.splice(index, 1);
    };
    SelectTemplateController.prototype.createDataToSubmit = function () {
        var dataToSubmit = {};
        dataToSubmit.name = this.selectedTemplate;
        dataToSubmit.info = this.selected.info;
        return dataToSubmit;
    };
    SelectTemplateController.prototype.saveInfo = function () {
        this.huashan.SaveTemplateInfo(this.session.getCredentials(), this.selectedTemplate, this.createDataToSubmit()).then(function (response) {
            console.log(response);
        });
    };
    SelectTemplateController.prototype.toggleEditCreator = function (flag) {
        this.editCreator = flag;
        if (!flag) {
            this.saveInfo();
        }
    };
    SelectTemplateController.prototype.toggleEditDescription = function (flag) {
        this.editDescription = flag;
        if (!flag) {
            this.saveInfo();
        }
    };
    SelectTemplateController.prototype.toggleEditCreatorLink = function (flag) {
        this.editCreatorLink = flag;
        if (!flag) {
            this.saveInfo();
        }
    };
    SelectTemplateController.prototype.toggleEditEmail = function (flag) {
        this.editEmail = flag;
        if (!flag) {
            this.saveInfo();
        }
    };
    SelectTemplateController.prototype.toggleEditVersion = function (flag) {
        this.editVersion = flag;
        if (!flag) {
            this.saveInfo();
        }
    };
    SelectTemplateController.prototype.toggleReleaseVersion = function (flag) {
        if (!this.selected.info.VersionLogs) {
            this.selected.info.VersionLogs = [];
        }
        for (var i = 0; i < this.selected.info.VersionLogs.length; i++) {
            if (this.selected.info.VersionLogs[i].Version == this.selected.info.Version) {
                alert("Version number existed");
                return false;
            }
        }
        if (!confirm("Please confirm releasing version " + this.selected.info.Version)) {
            return false;
        }
        this.editVersion = flag;
        this.selected.info.VersionLogs.splice(0, 0, {
            "Version": this.selected.info.Version,
            "VersionLog": this.selected.info.VersionLog,
            "VersionTime": new Date().toString()
        });
        this.selected.info.VersionLog = "";
        this.saveInfo();
    };
    SelectTemplateController.prototype.toggleShowVersionLog = function (flag) {
        this.showVersionLog = flag;
    };
    return SelectTemplateController;
}());
//# sourceMappingURL=selectTemplateController.js.map