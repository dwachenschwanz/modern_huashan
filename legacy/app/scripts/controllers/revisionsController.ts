class RevisionsController {

    re: any;
    $http: ng.IHttpService;
    selectedRevision: any;
    selectedRevisionCompare: any;
    selectedTemplate: string;
    jsonData: any;
    session: Session;
    $routeParams: ng.route.IRouteParamsService;
    data: any;
    saveComplete: boolean;
    saveErrorMessage: string;
    alerts: any;
    dataCopy: any;
    isAdmin: any;
    baseUrl: string;
    jsonCompareResult: any;
    templateGot: any;

    constructor($route, $routeParams, $location, HUASHAN, Session, $cookies, SERVER, $timeout, $http) {
        this.$location = $location;
        this.huashan = HUASHAN;
        this.$http=$http;
        this.baseUrl = SERVER.url;
        this.session = Session;
        this.$cookies = $cookies;
        this.$routeParams = $routeParams;
        this.$timeout = $timeout;
        this.selectedTemplate = this.$routeParams.templateID;
        this.templateGot= {}
        this.baseUrl = SERVER.url;
        this.compareClick = false;
        // this.getRevisions();
        this.getTemplateData()
        this.jsonCompareResult = null;
        if (this.session.getCredentials() || this.$cookies["huashansession"]) {
            this.session.create(this.$cookies["huashansession"]);
        } else {
            this.$location.path("/login");
        }

        let infoGot = localStorage.getItem("INFO")
        let decodedString = atob(infoGot);
        let userInfo = JSON.parse(decodedString);
        this.isAdmin = userInfo.is_admin;
    }

    getTemplateData() {
        this.$http.get(this.baseUrl + '/domain/astro-templates/'+this.$routeParams.templateID,
            { "headers": { 'Authorization': 'jwttoken ' + localStorage.getItem("JWT-TOKEN") } }
        ).then((response: any) => {
            if (response.data.token) {
                localStorage.setItem("JWT-TOKEN", response.data.token)
            }
            if (response.data.data.status == 1) {
                this.templateGot= response.data.data.template;
                this.getRevisions()
            }
            else {
                this.addAlert(response.data.data.message);
            }
            let data = response.data.data ? response.data.data : []

        }).catch((err) => {
            console.error(err);
            this.addAlert(err);
        });

    }

    getRevisions() {
        this.huashan.GetRevisions(
            this.session.getCredentials(),
            this.$routeParams.templateID
        ).then((response) => {
            console.log(response);
            if (response.status) {
                let temLog = response.result.split('\n').map(function (item) {
                    return JSON.parse(item)
                });
                this.re = {"revisionLogs": temLog};
                if (this.re.revisionLogs) {
                    let revisionInfoGot= this.re.revisionLogs.find(t=>{
                        return t.commitNum == this.templateGot.history.guid;
                    })
                    if(revisionInfoGot == undefined && this.re.revisionLogs.length>0){
                        revisionInfoGot = this.re.revisionLogs[0]
                    }
                    this.selectedRevision = revisionInfoGot;
                    this.getTemplateJsonFiles();
                    // this.switchRevisionByCommitHash(revisionInfoGot.commitNum)
                }
                this.appStructureCopy = angular.copy(this.appStructure);
            } else {
                this.addAlert(this.saveAlerts, 'danger', response.msg);
            }
        }).catch((err) => {
            console.error(err);
        });
    }

    selectRevision(commitNumber, revision) {
        console.log(commitNumber);
        this.selectedRevision = revision;
        this.switchRevisionByCommitHash(commitNumber);
        // this.saveTemplateJsonFiles();
    }

    switchRevisionByCommitHash(commitHash: any) {
        const c = this.session.getCredentials();
        const t = this.$routeParams.templateID;
        const data = {
            "commitHash": commitHash
        };
        this.huashan.SwitchRevisionByCommitHash(c, t, data).then((response) => {
            this.selectedTemplate = this.$routeParams.templateID;
            var result = response.result;
            this.getTemplateJsonFiles();
            this.$timeout();
        }).catch((response) => {
            console.error(response)
        });
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
    }

    platformExists() {
        return this.jsonData !== undefined && this.jsonData.platformDataStructure !== undefined && this.jsonData.platformDataStructure.indexOf("Does not exist") === -1;
    }

    saveTemplateJsonFiles() {
        this.huashan.SaveTemplateJsonFiles(this.session.getCredentials(),
            this.data.name,
            {
                "data": this.createDataToSubmit(),
                "commitMessage": "Switch Revision"
            }).then((response) => {
            this.saveComplete = true;
            if (response.status === false) {
                this.saveErrorMessage = response.msg;
                this.addAlert(this.saveErrorMessage);
            } else {
                this.dataCopy = angular.copy(this.data);
            }
        })
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

    downloadTemplate() {
        console.log("From revision: " + this.selectedTemplate)
        window.location = this.baseUrl + '/fileUploader?' + this.session.getCredentials() + '=' + this.selectedTemplate;
    }

    clickItem(event, commitNum, revision) {
        this.jsonCompareResult = null;
        if (event.metaKey || event.ctrlKey || event.shiftKey) {
            // click with control, no other selected
            //click with control, has other selected
            this.selectedRevisionCompare = revision;
        } else {
            var confirmRevisionChange = confirm("Are you sure to switch to different revision of the template? (You can revert back anytime)")
            if (confirmRevisionChange) {
                this.selectedRevisionCompare = null;
                this.selectRevision(commitNum, revision);
            }
        }
    }

    compareJsonFiles(selectedRevision, selectedRevisionCompare) {
        // var a = selectedRevision;
        // var b = selectedRevisionCompare;
        // console.log("a:+++++++")
        // console.log(a);
        // console.log("b:+++++++")
        // console.log(b);
        //call backend to compare json files
        const c = this.session.getCredentials();
        const t = this.$routeParams.templateID;
        const data = {
            "selectedRevision": selectedRevision,
            "selectedRevisionCompare": selectedRevisionCompare
        };
        this.huashan.CompareJsonFiles(c, t, data).then((response) => {
            var temp = response.result.split('\n').map(function (item) {
                return JSON.parse(item)
            });
            this.jsonCompareResult = temp[0];
        }).catch((response) => {
            console.error(response)
        })
    }

    getDisplayNameBy(fileName: any) {
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
                    return displayNames[key]
                } else {
                    return "no match name!"
                }
        } else {
            return "fileName is not exit."
        }

    }

    addAlert(msg) {
        this.alerts.push({type: 'danger', msg: msg});
    }
}

function stringify(jsonObject) {
    return JSON.stringify(jsonObject, undefined, 2);
}