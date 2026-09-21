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
var AdminController = /** @class */ (function () {
    function AdminController($location, HUASHAN, Session, $cookies, SERVER, $http) {
        var _this = this;
        this.selectedFilterCount = function () {
            return this.selectedfilterGroups.length;
        };
        this.filterBySelectedGroups = function (template) {
            if (_this.selectedfilterGroups.length === 0) {
                return true; // Show all templates if no groups are selected
            }
            else {
                // Check if any of the selected groups are in the template's groups
                return _this.selectedfilterGroups.some(function (groupName) {
                    return template.groups.some(function (group) {
                        return group.groupname === groupName;
                    });
                });
            }
        };
        this.$http = $http;
        this.$location = $location;
        this.huashan = HUASHAN;
        this.baseUrl = SERVER.url;
        this.allGroup = 'ALL';
        this.administrators = 'administrators';
        this.activeTab = 'allTemplates';
        this.groups = [{ "_id": 1, groupname: this.allGroup }];
        this.sort = { column: "name", descending: false };
        this.resetSelectedFilter();
        this.session = Session;
        this.$cookies = $cookies;
        this.myInterval = 3000;
        this.slides = [];
        if (this.session.getCredentials() || this.$cookies["huashansession"]) {
            this.session.create(this.$cookies["huashansession"]);
        }
        else {
            this.$location.path("/login");
        }
        this.selectedTemplate = "Not Selected";
        // this.getTemplates();
        this.getGroups();
        this.ogre = false;
        this.loading = false;
        this.loadingTable = true;
        this.showEditModal = false;
        this.showDeleteModal = false;
        this.showUnarchiveModal = false;
        this.showFilterDropdown = false;
        this.ogreStage = "";
        this.selectedOgreModel = "";
        this.ogreBuildCompleted = false;
        this.templateName = "";
        this.portfolioNameList = [];
        this.selectedPortfolioName = "";
        this.searchText = "";
        this.revisionInfo = null;
        this.alertMsg = {};
        var infoGot = localStorage.getItem("INFO");
        var decodedString = atob(infoGot);
        var userInfo = JSON.parse(decodedString);
        if (!userInfo.is_admin) {
            this.$location.path("/selectTemplate");
        }
    }
    AdminController.prototype.changeSorting = function (column) {
        var sort = this.sort;
        if (sort.column === column) {
            sort.descending = !sort.descending;
        }
        else {
            sort.column = column;
            sort.descending = false;
        }
    };
    AdminController.prototype.getTemplates = function () {
        var _this = this;
        this.huashan.GetTemplates(this.session.getCredentials()).then(function (response) {
            if (response.status) {
                _this.templates = response.result;
                _this.selectedTemplate = "Not Selected";
            }
            else {
                alert("Templates not found! Reasons: " + response.msg);
            }
        });
    };
    AdminController.prototype.getAstroTemplates = function () {
        var _this = this;
        this.loadingTable = true;
        this.huashan.GetAstroTemplates(this.session.getCredentials()).then(function (response) {
            if (response.status) {
                _this.astroTemplates = response.result;
                _this.loadingTable = false;
            }
            else {
                _this.alertMsg.msg = "Templates not found";
                $('#infoMsgAlert').fadeIn('fast').delay(3000).fadeOut('fast');
                _this.loadingTable = false;
            }
        });
    };
    AdminController.prototype.getArchivedAstroTemplates = function () {
        var _this = this;
        this.archivedAstroTemplates = [];
        this.loadingTable = true;
        this.huashan.GetArchivedAstroTemplates(this.session.getCredentials()).then(function (response) {
            if (response.status) {
                console.log(response.result);
                _this.archivedAstroTemplates = response.result;
                _this.loadingTable = false;
            }
            else {
                _this.alertMsg.msg = "Archived templates not found";
                $('#infoMsgAlert').fadeIn('fast').delay(3000).fadeOut('fast');
                _this.loadingTable = false;
            }
        });
    };
    AdminController.prototype.getGroups = function () {
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
            _this.filterGroups = angular.copy(_this.groups);
            _this.getAstroTemplates();
        })["catch"](function (err) {
            console.error(err);
            _this.alertMsg.type = "danger";
            _this.alertMsg.msg = "(SESSION EXPIRED) Data retrieval failed due to: " + (err.data ? err.data.message : err);
            $('#errorMsgAlert').fadeIn('fast').delay(3000).fadeOut('fast');
            _this.$location.path("/login");
        });
    };
    AdminController.prototype.selectTemplate = function (template) {
        this.selectedTemplate = angular.copy(template);
        this.prepareGroupsForSorting();
        this.showEditModal = true;
    };
    AdminController.prototype.deleteTemplate = function (template) {
        this.selectedTemplate = angular.copy(template);
        this.showDeleteModal = true;
    };
    AdminController.prototype.unarchiveTemplate = function (template) {
        this.selectedTemplate = angular.copy(template);
        this.showUnarchiveModal = true;
    };
    AdminController.prototype.editAstroTemplate = function () {
        var _this = this;
        var that = this;
        this.loading = true;
        this.$http.put(this.baseUrl + '/domain/astro-templates', this.selectedTemplate, { "headers": { 'Authorization': 'jwttoken ' + localStorage.getItem("JWT-TOKEN") } })
            .then(function (response) {
            if (response.data.token) {
                localStorage.setItem("JWT-TOKEN", response.data.token);
            }
            if (response.data.data.status == 0) {
                that.alertMsg.msg = response.data.data.message;
                $('#successMsgAlert').fadeIn('fast').delay(2000).fadeOut('fast');
            }
            else {
                that.alertMsg.msg = response.data.data.message;
                $('#infoMsgAlert').fadeIn('fast').delay(3000).fadeOut('fast');
            }
            that.closeEditModal();
            that.astroTemplates = [];
            that.getAstroTemplates();
            that.loading = false;
        })["catch"](function (err) {
            console.error(err);
            _this.alertMsg.msg = "Template Update failed due to: " + (err.data ? err.data.message : err);
            $('#errorMsgAlert').fadeIn('fast').delay(3000).fadeOut('fast');
            _this.loading = false;
        });
    };
    AdminController.prototype.deleteAstroTemplate = function () {
        var _this = this;
        var that = this;
        this.loading = true;
        this.huashan.DeleteTemplate(this.session.getCredentials(), this.selectedTemplate['name']).then(function (response) {
            if (response.status) {
                that.alertMsg.msg = response.result;
                $('#successMsgAlert').fadeIn('fast').delay(2000).fadeOut('fast');
                that.closeDeleteModal();
                that.astroTemplates = [];
                that.getAstroTemplates();
                that.loading = false;
            }
            else {
                _this.alertMsg.msg = "Template archive failed due to: " + response.msg;
                $('#errorMsgAlert').fadeIn('fast').delay(3000).fadeOut('fast');
                _this.loading = false;
            }
        });
    };
    AdminController.prototype.unarchiveAstroTemplate = function () {
        var _this = this;
        var that = this;
        this.loading = true;
        this.huashan.UndeleteTemplate(this.session.getCredentials(), this.selectedTemplate['name']).then(function (response) {
            if (response.status) {
                that.alertMsg.msg = response.result;
                ;
                $('#successMsgAlert').fadeIn('fast').delay(2000).fadeOut('fast');
                that.closeUnarchiveModal();
                that.astroTemplates = [];
                that.switchTab('allTemplates');
                that.archivedAstroTemplates = [];
                that.getAstroTemplates();
                that.loading = false;
            }
            else {
                _this.alertMsg.msg = "Template unarchive failed due to: " + response.msg;
                $('#errorMsgAlert').fadeIn('fast').delay(3000).fadeOut('fast');
                _this.loading = false;
            }
        });
    };
    AdminController.prototype.closeEditModal = function () {
        this.showEditModal = false;
    };
    AdminController.prototype.closeDeleteModal = function () {
        this.showDeleteModal = false;
    };
    AdminController.prototype.closeUnarchiveModal = function () {
        this.showUnarchiveModal = false;
    };
    AdminController.prototype.selectDeleted = function (deleted) {
        this.selectedDeletedTemplate = deleted;
    };
    AdminController.prototype["delete"] = function () {
        var _this = this;
        this.deleteAlerts = [];
        this.huashan.DeleteTemplate(this.session.getCredentials(), this.selectedTemplate).then(function (response) {
            console.log("In DeleteTemplate(): " + response.status);
            if (response.status) {
                _this.hideDeleteModal();
                _this.getTemplates();
            }
            else {
                _this.addAlert(_this.deleteAlerts, 'danger', response.msg);
                console.log(_this.deleteAlerts);
            }
        });
    };
    AdminController.prototype.isGroupSelected = function (group) {
        return this.selectedTemplate.groups.some(function (selectedGroup) {
            return selectedGroup._id === group._id || group.groupname === "administrators";
        });
    };
    AdminController.prototype.groupComparator = function (group) {
        return this.isGroupSelected(group) ? 0 : 1;
    };
    ;
    AdminController.prototype.prepareGroupsForSorting = function () {
        var that = this;
        this.groups.forEach(function (group) {
            group.sortOrder = that.isGroupSelected(group) ? 0 : 1;
        });
    };
    ;
    AdminController.prototype.toggleGroupSelection = function (group) {
        var index = this.selectedTemplate.groups.findIndex(function (selectedGroup) { return selectedGroup._id === group._id; });
        if (index === -1) {
            // If the group is not already selected, add it to the selectedTemplate
            this.selectedTemplate.groups.push({ _id: group._id, groupname: group.groupname });
        }
        else {
            // If the group is already selected, remove it from the selectedTemplate
            this.selectedTemplate.groups.splice(index, 1);
        }
        this.prepareGroupsForSorting();
    };
    AdminController.prototype.switchTab = function (tab) {
        this.activeTab = tab;
        this.searchText = "";
        this.resetFilter();
        if (tab == 'archive') {
            this.getArchivedAstroTemplates();
            this.sort = { column: "name", descending: false };
        }
    };
    ;
    AdminController.prototype.resetSelectedFilter = function () {
        this.selectedfilterGroups = [];
    };
    AdminController.prototype.resetFilter = function () {
        this.filterGroups = angular.copy(this.groups);
        this.resetSelectedFilter();
    };
    AdminController.prototype.hideDeleteModal = function () {
        $('#deleteModal').modal('hide');
    };
    AdminController.prototype.addAlert = function (alert, type, msg) {
        alert.push({ type: type, msg: msg });
    };
    AdminController.prototype.closeAlert = function (alert, index) {
        alert.splice(index, 1);
    };
    AdminController.prototype.toggleDropdown = function () {
        this.showFilterDropdown = !this.showFilterDropdown;
    };
    ;
    AdminController.prototype.applyFilter = function () {
        var that = this;
        this.resetSelectedFilter();
        this.filterGroups.forEach(function (group) {
            if (group.checked) {
                that.selectedfilterGroups.push(group.groupname);
            }
        });
    };
    return AdminController;
}());
//# sourceMappingURL=adminController.js.map