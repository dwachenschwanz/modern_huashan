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

class SelectTemplateController {
    //injector
    huashan: Huashan;
    session: Session;
    $http: ng.IHttpService;
    $location: ng.ILocationService;
    $cookies: ng.cookies.ICookiesService;
    //binding
    myInterval: number;
    slides: any;
    selectedTemplate: string;
    templates: any;
    uploadedAstroTemplate: any;
    userGroups: any;
    isAdmin: any;
    userInfo: any;
    selected: any;
    newTemplateName: string;
    deletedTemplates: any;
    selectedDeletedTemplate: any;
    deleteAlerts: any;
    renameAlerts: any;
    submitAlerts: any;
    loading: boolean;
    loadingTable: boolean;
    loadingDeleteList: boolean;
    fileToUpload: any;
    undeleteAlerts: any;
    ogre: boolean;
    ogreStage: string;
    selectedOgreModel: string;
    ogreBuildCompleted: boolean;
    templateName: string;
    baseUrl: string;
    groups: any;
    astroTemplate: any;
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
    revisionInfo: object;
    alertMsg: any;
    sort: any;

    constructor($location, HUASHAN, Session, $cookies, SERVER, $http) {
        this.$http = $http;
        this.$location = $location;
        this.huashan = HUASHAN;
        this.baseUrl = SERVER.url;
        this.uploadedAstroTemplate = { name: '', groups: [], creatorGroups: [], history: [] };
        this.allGroup = 'ALL'
        this.groups = [{ "_id": 1, groupname: this.allGroup }]
        this.userGroups = [];
        this.session = Session;
        this.$cookies = $cookies;
        this.myInterval = 3000;
        this.sort = { column: "name", descending: false }
        this.slides = [];
        if (this.session.getCredentials() || this.$cookies["huashansession"]) {
            this.session.create(this.$cookies["huashansession"]);
        } else {
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
        let infoGot = localStorage.getItem("INFO")
        let decodedString = atob(infoGot);
        this.userInfo = JSON.parse(decodedString);
        this.isAdmin = this.userInfo.is_admin;
        this.initRetrieval()
    }

    initRetrieval() {
        this.getGroups();
    }

    syncTemplate(tempalteID) {
        this.showMessage = null;
        this.showMessageContent = null;
        this.huashan.SyncTemplate(
            this.session.getCredentials(), tempalteID
        ).then((response) => {
            if (response.status) {
                this.showMessage = "Success";
                this.showMessageContent = "Template synced successfully!"
            } else {
                console.error(response);
                this.showMessage = "Failure";
                this.showMessageContent = "Template sync failed, please contact support!"
            }
        }).catch((err) => {
            console.error(err);
            this.showMessage = "Failure";
            this.showMessageContent = "Template sync failed, please contact support!"
        })
    }

    getRevisionInfo(tempalteID, history) {
        this.huashan.GetRevisions(
            this.session.getCredentials(),
            tempalteID
        ).then((response) => {
            console.log(response);
            if (!response.status) {
                this.revisionInfo = null;
            }
            if (response.status) {
                let temLog = response.result.split('\n').map(function (item) {
                    return JSON.parse(item)
                });
                let revisionInfoGot = temLog.find(t => {
                    return t.commitNum == history.guid;
                })
                if (revisionInfoGot == undefined && temLog.length > 0) {
                    revisionInfoGot = temLog[0]
                }
                this.revisionInfo = revisionInfoGot;
            } else {
                this.addAlert(this.saveAlerts, 'danger', response.msg);
            }
        }).catch((err) => {
            console.error(err);
        });

    }

    addSlides() {
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
    }

    findAssociatedPortfolios() {
        this.huashan.FindAssociatedPortfolios(this.session.credentials, this.selectedTemplate).then((response) => {
            if (response.status) {
                this.portfolioNameList = response.result

            } else {
                alert("Some error happened: " + response.msg);
            }
        });
    }

    initializeUpdateDataStructure() {
        this.updateDataStructure = {
            Leaf: true,
            Platform: false
        };
    }

    selectPortfolioName(portfolioName) {
        this.selectedPortfolioName = portfolioName;
    }

    resetPortfolioName(portfolioName) {
        this.selectedPortfolioName = "";
    }

    runUpdateDataStructure() {
        this.runningUpdateDataStructure = "Running";
        if (this.portfolioNameList.length > 0) {
            this.huashan.UpdateDataStructure(this.session.credentials, TheUte().pack(this.selectedPortfolioName),
                this.updateDataStructure.Leaf, this.updateDataStructure.Platform).then((response) => {
                    if (response.status) {
                        console.log("Updated!!");
                        this.runningUpdateDataStructure = "Success"
                    } else {
                        alert("Some error happened: " + response.msg);
                        this.runningUpdateDataStructure = "Failure"
                        this.responseMsg = response.msg
                    }
                });
        }

    }


    getTemplates() {
        this.templates = [];
        this.loadingTable = true;
        this.huashan.GetAstroTemplates(this.session.getCredentials()).then((response) => {
            if (response.status) {
                this.templates = response.result
                let selectedTemplateJSONGot = localStorage.getItem('selectedTemplate');
                if (selectedTemplateJSONGot) {
                    let selectedTemplateGot = JSON.parse(selectedTemplateJSONGot)
                    this.selectedTemplate = selectedTemplateGot.name;
                    let updatedTemplate = response.result.find(r => r.name == selectedTemplateGot.name)
                    if (updatedTemplate) {
                        this.findAssociatedPortfolios()
                        this.getRevisionInfo(selectedTemplateGot.name, updatedTemplate.history)
                    }
                    else {
                        this.selectedTemplate = "Not Selected";
                        localStorage.removeItem('selectedTemplate');
                    }
                } else {
                    this.selectedTemplate = "Not Selected";
                }
                this.loadingTable = false;
            } else {
                // alert("Templates not found! Reasons: " + response.msg);
                this.alertMsg.msg = "Templates not found! " + response.msg;
                $('#infoMsgAlert').fadeIn('fast').delay(3000).fadeOut('fast');
                this.loadingTable = false;
            }
        });
    }

    filterTemplatesByUserGroups(templates) {
        let filteredTemplates = templates;
        if (!this.isAdmin) {
            filteredTemplates = templates.filter(template => {
                // Check if any of the groups in the template have ids present in userGroups
                return template.groups.some(group => group.groupname == this.allGroup || this.userGroups.includes(group._id)) ||
                    template.creatorGroups.some(groupId => this.userGroups.includes(groupId));
            });
        }
        return filteredTemplates;
    }

    saveAstroTemplate() {
        let that = this;
        this.$http.post(this.baseUrl + '/domain/astro-templates', this.uploadedAstroTemplate,
            { "headers": { 'Authorization': 'jwttoken ' + localStorage.getItem("JWT-TOKEN") } })
            .then(function (response) {
                if (response.data.token) {
                    localStorage.setItem("JWT-TOKEN", response.data.token)
                }
                $('#uploadModal').modal('hide');
                that.getTemplates();
                if (response.data.data.status == 1) {
                    that.alertMsg.type = "info"
                    that.alertMsg.msg = response.data.data.message;
                    $('#infoMsgAlert').fadeIn('fast').delay(3000).fadeOut('fast');
                }
                else {
                    $('#uploadSuccessAlert').fadeIn('fast').delay(2000).fadeOut('fast');
                }
            }).catch((err) => {
                console.error(err);
                this.addAlert(this.submitAlerts, 'danger', "Upload failed due to: " + (err.data ? err.data.message : err));
            });
    }

    getGroupsForUser() {
        let that = this;
        let groupsGot: Array<any> = [];
        let user_id = this.userInfo.uid;
        console.log('User Info:' + user_id)
        if (this.groups) {
            this.groups.forEach((gp: any) => {
                if (gp.groupname !== that.allGroup) {
                    if (gp.users.indexOf(user_id) > -1) {
                        groupsGot.push(gp._id);
                    }
                }
            }
            );
        }
        this.uploadedAstroTemplate.creatorId = user_id
        this.userGroups = groupsGot;
        this.getTemplates();

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
            this.getGroupsForUser()
        }).catch((err) => {
            console.error(err);
            this.alertMsg.type = "danger"
            this.alertMsg.msg = "(SESSION EXPIRED) Data retrieval failed due to: " + (err.data ? err.data.message : err);
            $('#errorMsgAlert').fadeIn('fast').delay(3000).fadeOut('fast');
            this.$location.path("/login");
        });
    }

    select(template) {
        this.portfolioNameList = [];
        var templateName = template.name;
        this.selectedTemplate = templateName;
        let templateStringify = JSON.stringify(template);
        localStorage.setItem("selectedTemplate", templateStringify)
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
    }

    listDeletedTemplates() {
        this.loadingDeleteList = true;
        this.deletedTemplates= []
        this.huashan.GetArchivedAstroTemplates(this.session.getCredentials()).then((response) => {
            if (response.status) {
                this.deletedTemplates = this.extractNamesOnly(response.result);
                this.selectedDeletedTemplate = "Not Selected";
                this.loadingDeleteList = false;
            } else {
                // alert("Deleted templates not found! Reasons: " + response.msg);
                // this.deletedTemplates=[]
                this.alertMsg.msg = "Deleted templates not found! " + response.msg;
                $('#infoMsgAlert').fadeIn('fast').delay(3000).fadeOut('fast');
                this.loadingDeleteList = false;
                this.selectedDeletedTemplate = "Not Selected";


            }
        });
    }

    extractNamesOnly(list) {
        let extracted = [];
        list.forEach((l) => {
            extracted.push(l.name)
        })
        return extracted;
    }
    selectDeleted(deleted) {
        this.selectedDeletedTemplate = deleted;
    }

    delete() {
        this.loading = true;
        this.deleteAlerts = [];
        this.huashan.DeleteTemplate(this.session.getCredentials(),
            this.selectedTemplate).then((response) => {
                console.log("In DeleteTemplate(): " + response.status);
                if (response.status) {
                    this.hideDeleteModal();
                    this.selectedTemplate = "Not Selected";
                    localStorage.removeItem('selectedTemplate');
                    this.getTemplates();
                    this.loading = false;
                } else {
                    this.addAlert(this.deleteAlerts, 'danger', response.msg);
                    console.log(this.deleteAlerts);
                    this.loading = false;
                }
            });
    }

    hideDeleteModal() {
        $('#deleteModal').modal('hide');
    }

    undelete() {
        this.loading = true;
        this.undeleteAlerts = [];
        this.huashan.UndeleteTemplate(this.session.getCredentials(), this.selectedDeletedTemplate).then((response) => {
            if (response.status) {
                this.getTemplates();
                this.listDeletedTemplates();
                this.selectedDeletedTemplate = "Not Selected";
                this.loading = false;
            } else {
                this.loading = false;
                this.selectedDeletedTemplate = "Not Selected";
                this.addAlert(this.undeleteAlerts, 'danger', response.msg);
            }
        });
    }


    downloadTemplate() {
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
            }, responseType: 'blob' as 'json'
        }).then((response) => {
            this.loading = false;
            saveBolb(response, this.selectedTemplate);
            console.log(response);
        }).catch((err) => {
            this.loading = false;
            console.error(err);
        });
        // window.location = this.baseUrl + '/fileUploader?' + this.session.getCredentials() + '=' + this.selectedTemplate;
    }

    rename() {
        this.loading = true;
        this.renameAlerts = [];
        if (this.newTemplateName === "") {
            this.addAlert(this.renameAlerts, 'danger', "Template name cannot be blank.");
            return;
        }
        this.newTemplateName = this.replaceSpace(this.newTemplateName);
        this.huashan.RenameTemplate(this.session.getCredentials(), this.selectedTemplate, this.newTemplateName).then((response) => {
            if (response.status) {
                this.loading = false;
                $('#renameModal').modal('hide');
                this.getTemplates();
            } else {
                this.loading = false;
                this.addAlert(this.renameAlerts, 'danger', response.msg);
            }
        });
    }

    templateNameFrom(fileName: string) {
        var indexOfDot = fileName.indexOf(".");
        return fileName.substr(0, indexOfDot);
    }

    smartogrify() {
        this.submitAlerts = [];
        if (!this.checkFileExist()) {
            return;
        }
        var fileName = this.fileToUpload.name;
        if (!this.validateFileName(fileName)) {
            return;
        }
        this.templateName = this.templateNameFrom(fileName);

        const uploadData = new FormData();
        uploadData.append('file', this.fileToUpload, this.fileToUpload.name)
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
        }).then((response) => {
            console.log(response);
            $('#uploadModal').modal('hide');
            this.$http.post(this.baseUrl + '/app/file', { fileName }).then((response) => {
                console.log(response);
            }).catch((err) => {
                console.error(err);
            });
            this.getTemplates();
            $('#pyOrgrigySuccessAlert').fadeIn('fast').delay(1000).fadeOut('fast');
        }).catch((err) => {
            console.error(err);
            this.addAlert(this.submitAlerts, 'danger', "Failed due to: " + err);
        });

    }

    generateProductPortfolio(selectedOgreModel) {
        this.ogreStage = "GeneratingTemplate";
        this.selectedOgreModel = selectedOgreModel;
        this.ogreMakeTemplate();
    }

    ogreMakeTemplate() {
        this.huashan.OgreMakeTemplate(this.session.getCredentials(), this.templateName, this.selectedOgreModel).then((response) => {
            if (response.status) {
                this.ogreBuildCompleted = true;
            } else {
                alert("Some error happened: " + response.msg);
            }
        });
    }

    submit() {
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
        var url = this.baseUrl + '/wizard/upload/'+fileName;

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
        }).then((response) => {
            console.log(response);
            // this.saveAstroTemplate()
            // console.log(response);
            $('#uploadModal').modal('hide');
            this.loading = false;
            this.getTemplates();
            this.fileToUpload= undefined
            var fileInput = document.getElementById('FileToUploadID');
            fileInput.value = ''; 
            if (response.data && response.data.data && response.data.data.status == 1) {
                this.alertMsg.type = "info"
                this.alertMsg.msg = response.data.data.message;
                $('#infoMsgAlert').fadeIn('fast').delay(3000).fadeOut('fast');
            }
            else {
                $('#uploadSuccessAlert').fadeIn('fast').delay(2000).fadeOut('fast');
            }
        }).catch((err) => {
            this.loading = false;
            console.error(err);
            this.addAlert(this.submitAlerts, 'danger', "Upload failed due to: " + (err.data ? err.data.message : err));
        });
    }

    replaceSpace(fileName) {
        return fileName.replace(/\s+/g, "_");
    }

    checkFileExist() {
        if (this.fileToUpload === undefined) {
            this.addAlert(this.submitAlerts, "danger", "Please select a file.");
            return false;
        } else {
            return true;
        }
    }

    validateFileName(fileName) {
        if (fileName.slice(fileName.indexOf('.') + 1).indexOf('xls') === -1) {
            this.addAlert(this.submitAlerts, 'danger', "Only Excel files are accepted!");
            return false;
        } else if (fileName.indexOf(' ') !== -1) {
            this.addAlert(this.submitAlerts, 'danger', "No spaces allowed in file name.");
            return false;
        } else if (fileName.indexOf('_') !== -1) {
            this.addAlert(this.submitAlerts, 'danger', "No underscore allowed in file name.");
            return false;
        } else {
            this.uploadedAstroTemplate.name = fileName.split('.')[0];
            return true;
        }
    }

    addAlert(alert, type, msg) {
        alert.push({ type: type, msg: msg });
    }

    closeAlert(alert, index) {
        alert.splice(index, 1);
    }

    createDataToSubmit() {
        var dataToSubmit: TemplateJSON = {};
        dataToSubmit.name = this.selectedTemplate;
        dataToSubmit.info = this.selected.info;
        return dataToSubmit;
    }

    saveInfo() {
        this.huashan.SaveTemplateInfo(
            this.session.getCredentials(),
            this.selectedTemplate,
            this.createDataToSubmit()).then((response) => {
                console.log(response);
            });
    }

    toggleEditCreator(flag) {
        this.editCreator = flag;
        if (!flag) {
            this.saveInfo();
        }
    }

    toggleEditDescription(flag) {
        this.editDescription = flag;
        if (!flag) {
            this.saveInfo();
        }
    }

    toggleEditCreatorLink(flag) {
        this.editCreatorLink = flag;
        if (!flag) {
            this.saveInfo();
        }
    }

    toggleEditEmail(flag) {
        this.editEmail = flag;
        if (!flag) {
            this.saveInfo();
        }
    }

    toggleEditVersion(flag) {
        this.editVersion = flag;
        if (!flag) {
            this.saveInfo();
        }
    }

    toggleReleaseVersion(flag) {
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
    }

    toggleShowVersionLog(flag) {
        this.showVersionLog = flag;
    }
}
