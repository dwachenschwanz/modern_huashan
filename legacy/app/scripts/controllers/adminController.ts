/// <reference path="../lib/_all.ts"/>

const saveBolb = (() => {
    const a = document.createElement("a");
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

class AdminController {
    //injector
    huashan: Huashan;
    session: Session;
    $http: ng.IHttpService;
    $location: ng.ILocationService;
    $cookies: ng.cookies.ICookiesService;
    //binding
    myInterval: number;
    slides: any;
    selectedTemplate: any;
    templates: any;
    selected: any;
    newTemplateName: string;
    deletedTemplates: any;
    selectedDeletedTemplate: any;
    deleteAlerts: any;
    renameAlerts: any;
    submitAlerts: any;
    fileToUpload: any;
    undeleteAlerts: any;
    ogre: boolean;
    showEditModal: boolean;
    showDeleteModal: boolean;
    showUnarchiveModal: boolean;
    loading: boolean;
    loadingTable: boolean;
    ogreStage: string;
    selectedOgreModel: string;
    ogreBuildCompleted: boolean;
    templateName: string;
    baseUrl: string;
    groups: any;
    filterGroups: any;
    selectedfilterGroups: any;
    astroTemplates: any;
    archivedAstroTemplates: any;
    editCreator: boolean;
    editDescription: boolean;
    editCreatorLink: boolean;
    editEmail: boolean;
    editVersion: boolean;
    editVersionLog: boolean;
    showVersionLog: boolean;
    portfolioNameList: any;
    updateDataStructure: any;
    selectedPortfolioName: string;
    runningUpdateDataStructure: string;
    responseMsg: string;
    allGroup: string;
    searchText: string;
    activeTab: string;
    revisionInfo: object;
    alertMsg: any;
    showFilterDropdown: boolean;
    sort: any;
    isAdmin: boolean;
    administrators: string;

    constructor($location, HUASHAN, Session, $cookies, SERVER, $http) {
        this.$http = $http;
        this.$location = $location;
        this.huashan = HUASHAN;
        this.baseUrl = SERVER.url;
        this.allGroup = 'ALL'
        this.administrators = 'administrators'
        this.activeTab = 'allTemplates'
        this.groups = [{ "_id": 1, groupname: this.allGroup }]
        this.sort = { column: "name", descending: false }
        this.resetSelectedFilter()
        this.session = Session;
        this.$cookies = $cookies;
        this.myInterval = 3000;
        this.slides = [];
        if (this.session.getCredentials() || this.$cookies["huashansession"]) {
            this.session.create(this.$cookies["huashansession"]);
        } else {
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
        let infoGot = localStorage.getItem("INFO")
        let decodedString = atob(infoGot);
        let userInfo = JSON.parse(decodedString);
        if(!userInfo.is_admin){
            this.$location.path("/selectTemplate");
        }

    }

    changeSorting(column) {
        var sort = this.sort;

        if (sort.column === column) {
            sort.descending = !sort.descending;
        } else {
            sort.column = column;
            sort.descending = false;
        }
    }

    getTemplates() {
        this.huashan.GetTemplates(this.session.getCredentials()).then((response) => {
            if (response.status) {
                this.templates = response.result;
                this.selectedTemplate = "Not Selected";
            } else {
                alert("Templates not found! Reasons: " + response.msg);
            }
        });
    }

    getAstroTemplates() {
        this.loadingTable = true;
        this.huashan.GetAstroTemplates(this.session.getCredentials()).then((response) => {
            if (response.status) {
                this.astroTemplates = response.result;
                this.loadingTable = false;
            } else {
                this.alertMsg.msg = "Templates not found";
                $('#infoMsgAlert').fadeIn('fast').delay(3000).fadeOut('fast');
                this.loadingTable = false;
            }
        });
    }
    getArchivedAstroTemplates() {
        this.archivedAstroTemplates = [];
        this.loadingTable = true;
        this.huashan.GetArchivedAstroTemplates(this.session.getCredentials()).then((response) => {
            if (response.status) {
                console.log(response.result)
                this.archivedAstroTemplates = response.result;
                this.loadingTable = false;
            } else {
                this.alertMsg.msg = "Archived templates not found";
                $('#infoMsgAlert').fadeIn('fast').delay(3000).fadeOut('fast');
                this.loadingTable = false;
            }
        });
    }


    getGroups() {
        this.$http.get(this.baseUrl + '/framework/admin/group/list',
            { "headers": { 'Authorization': 'jwttoken ' + localStorage.getItem("JWT-TOKEN") } }
        ).then((response: any) => {
            if (response.data.token) {
                localStorage.setItem("JWT-TOKEN", response.data.token)
            }
            let data = response.data.data ? response.data.data : []
            for (let group of data) {
                this.groups.push(group)
            }
            this.filterGroups = angular.copy(this.groups);
            this.getAstroTemplates()

        }).catch((err) => {
            console.error(err);
            this.alertMsg.type = "danger"
            this.alertMsg.msg = "(SESSION EXPIRED) Data retrieval failed due to: " + (err.data ? err.data.message : err);
            $('#errorMsgAlert').fadeIn('fast').delay(3000).fadeOut('fast');
            this.$location.path("/login");
        });
    }

    selectTemplate(template: any) {
        this.selectedTemplate = angular.copy(template);
        this.prepareGroupsForSorting()
        this.showEditModal = true;
    }

    deleteTemplate(template: any) {
        this.selectedTemplate = angular.copy(template);
        this.showDeleteModal = true;
    }

    unarchiveTemplate(template: any) {
        this.selectedTemplate = angular.copy(template);
        this.showUnarchiveModal = true;
    }


    editAstroTemplate() {
        let that = this;
        this.loading = true;
        this.$http.put(this.baseUrl + '/domain/astro-templates', this.selectedTemplate,
            { "headers": { 'Authorization': 'jwttoken ' + localStorage.getItem("JWT-TOKEN") } })
            .then(function (response) {
                if (response.data.token) {
                    localStorage.setItem("JWT-TOKEN", response.data.token)
                }
                if (response.data.data.status == 0) {
                    that.alertMsg.msg = response.data.data.message;
                    $('#successMsgAlert').fadeIn('fast').delay(2000).fadeOut('fast');
                }
                else {
                    that.alertMsg.msg = response.data.data.message;
                    $('#infoMsgAlert').fadeIn('fast').delay(3000).fadeOut('fast');
                }
                that.closeEditModal()
                that.astroTemplates = []
                that.getAstroTemplates()
                that.loading = false;

            }).catch((err) => {
                console.error(err);
                this.alertMsg.msg = "Template Update failed due to: " + (err.data ? err.data.message : err);
                $('#errorMsgAlert').fadeIn('fast').delay(3000).fadeOut('fast');
                this.loading = false;

            });
    }
    deleteAstroTemplate() {
        let that = this;
        this.loading = true;
        this.huashan.DeleteTemplate(this.session.getCredentials(),
            this.selectedTemplate['name']).then((response) => {
                if (response.status) {
                    that.alertMsg.msg = response.result;
                    $('#successMsgAlert').fadeIn('fast').delay(2000).fadeOut('fast');
                    that.closeDeleteModal()
                    that.astroTemplates = []
                    that.getAstroTemplates()
                    that.loading = false;
                } else {
                    this.alertMsg.msg = "Template archive failed due to: " + response.msg;
                    $('#errorMsgAlert').fadeIn('fast').delay(3000).fadeOut('fast');
                    this.loading = false;
                }
            });
    }
    unarchiveAstroTemplate() {
        let that = this;
        this.loading = true;

        this.huashan.UndeleteTemplate(this.session.getCredentials(), this.selectedTemplate['name']).then((response) => {
            if (response.status) {
                that.alertMsg.msg = response.result;;
                $('#successMsgAlert').fadeIn('fast').delay(2000).fadeOut('fast');
                that.closeUnarchiveModal()
                that.astroTemplates = []
                that.switchTab('allTemplates')
                that.archivedAstroTemplates = []
                that.getAstroTemplates()
                that.loading = false;
            } else {
                this.alertMsg.msg = "Template unarchive failed due to: " + response.msg;
                $('#errorMsgAlert').fadeIn('fast').delay(3000).fadeOut('fast');
                this.loading = false;
            }
        });
    }

    closeEditModal() {
        this.showEditModal = false;
    }

    closeDeleteModal() {
        this.showDeleteModal = false;
    }
    closeUnarchiveModal() {
        this.showUnarchiveModal = false;
    }

    selectDeleted(deleted) {
        this.selectedDeletedTemplate = deleted;
    }


    delete() {
        this.deleteAlerts = [];
        this.huashan.DeleteTemplate(this.session.getCredentials(),
            this.selectedTemplate).then((response) => {
                console.log("In DeleteTemplate(): " + response.status);
                if (response.status) {
                    this.hideDeleteModal();
                    this.getTemplates();
                } else {
                    this.addAlert(this.deleteAlerts, 'danger', response.msg);
                    console.log(this.deleteAlerts);
                }
            });
    }

    isGroupSelected(group) {
        return this.selectedTemplate.groups.some(selectedGroup => {
            return selectedGroup._id === group._id || group.groupname === "administrators";
        });
    }
    groupComparator(group) {
        return this.isGroupSelected(group) ? 0 : 1;
    };
    prepareGroupsForSorting() {
        let that = this
        this.groups.forEach(function (group) {
            group.sortOrder = that.isGroupSelected(group) ? 0 : 1;
        });
    };

    toggleGroupSelection(group) {
        var index = this.selectedTemplate.groups.findIndex(selectedGroup => selectedGroup._id === group._id);
        if (index === -1) {
            // If the group is not already selected, add it to the selectedTemplate
            this.selectedTemplate.groups.push({ _id: group._id, groupname: group.groupname });
        } else {
            // If the group is already selected, remove it from the selectedTemplate
            this.selectedTemplate.groups.splice(index, 1);
        }
        this.prepareGroupsForSorting()
    }

    switchTab(tab) {
        this.activeTab = tab;
        this.searchText = "";
        this.resetFilter()
        if (tab == 'archive') {
            this.getArchivedAstroTemplates()
            this.sort = { column: "name", descending: false }

        }
    };

    resetSelectedFilter() {
        this.selectedfilterGroups = []
    }

    resetFilter() {
        this.filterGroups = angular.copy(this.groups)
        this.resetSelectedFilter()
    }

    hideDeleteModal() {
        $('#deleteModal').modal('hide');
    }



    addAlert(alert, type, msg) {
        alert.push({ type: type, msg: msg });
    }

    closeAlert(alert, index) {
        alert.splice(index, 1);
    }


    toggleDropdown() {
        this.showFilterDropdown = !this.showFilterDropdown;
    };

    applyFilter() {
        let that = this;
        this.resetSelectedFilter()
        this.filterGroups.forEach(function (group) {
            if (group.checked) {
                that.selectedfilterGroups.push(group.groupname);
            }
        });

    }

    selectedFilterCount = function () {
        return this.selectedfilterGroups.length;
    };


    filterBySelectedGroups = (template) => {
        if (this.selectedfilterGroups.length === 0) {
            return true; // Show all templates if no groups are selected
        } else {
            // Check if any of the selected groups are in the template's groups
            return this.selectedfilterGroups.some(function (groupName) {
                return template.groups.some(function (group) {
                    return group.groupname === groupName;
                });
            });
        }
    };
}
