/// <reference path="../lib/_all.ts"/>

class DataStructureController {
    //injector
    $route: ng.route.IRouteService;
    $routeParams: ng.route.IRouteParamsService;
    $timeout: ng.ITimeoutService;
    huashan: Huashan;
    session: Session;
    $location: ng.ILocationService;
    $cookies: ng.cookies.ICookiesService;
    $rootScope: ng.IRootScopeService;
    $sce: ng.ISCEService;
    //binding
    selectedTemplate: string;
    saveComplete: boolean;
    alerts: any;
    data: any;
    includedComponents: any;
    includedComponentsCopy: any;
    excludedComponents: any;
    saveErrorMessage: string;
    isPlatform: boolean;
    smartorg: any;
    potentialTableInputs: any
    includedPotentialTableInputs: any;
    excludedPotentialTableInputs: any;
    potentialTableListsBuilt: boolean;
    server: any;
    imageURL: any;
    htmlPreview: any;
    currentPreview: any;
    selectedCelllink: string;
    selected: any;
    showLoading: boolean;
    isAdmin: any;

    constructor($route, $routeParams, $location, HUASHAN, Session, $cookies, $rootScope, config, $scope, $timeout, $sce) {
        this.$rootScope = $rootScope;
        this.$route = $route;
        this.$routeParams = $routeParams;
        this.$location = $location;
        this.$timeout = $timeout;
        this.$sce = $sce;
        this.huashan = HUASHAN;
        this.session = Session;
        this.$cookies = $cookies;
        this.server = app.server;
        if (this.session.getCredentials() || this.$cookies.huashansession) {
            this.session.create(this.$cookies.huashansession);
        } else {
            this.$location.path("/login");
        }
        this.selectedTemplate = this.$routeParams.templateID;
        this.saveComplete = true;
        this.alerts = [];
        this.isPlatform = $route.current.$$route.platform;
        this.includedPotentialTableInputs = [];
        this.smartorg = config.smartorg;
        this.showLoading = true;
        this.getIncludedDataStructureComponents();
        this.getExcludedDataStructureComponents();
        this.currentPreview = {};
        this.selectedCelllink = "Not Selected";
        var that = this;
        this.$rootScope.$on("$locationChangeStart", function (event, next, current) {
            if (current.indexOf("#/datastructure/") != -1 && !that.isUnchanged()) {
                if (!confirm("You have unsaved changes in data structure, continue navigating to " + next + " ?")) {
                    event.preventDefault();
                } else {
                    that.includedComponents = angular.copy(that.includedComponentsCopy);
                }
            }
        });
        let infoGot = localStorage.getItem("INFO")
        let decodedString = atob(infoGot);
        let userInfo = JSON.parse(decodedString);
        this.isAdmin = userInfo.is_admin
    }

    getIncludedDataStructureComponents() {
        this.huashan.GetIncludedDataStructureComponents(this.session.getCredentials(), this.$routeParams.templateID, this.isPlatform)
            .then((data) => {
                this.data = data;
                this.includedComponents = data.result;
                this.includedComponentsCopy = angular.copy(this.includedComponents);
                this.getPotentialTableInputs();
            });
    }

    getExcludedDataStructureComponents() {
        this.huashan.GetExcludedDataStructureComponents(this.session.getCredentials(), this.$routeParams.templateID, this.isPlatform)
            .then((data) => {
                this.showLoading = false;
                this.excludedComponents = data.result.Excluded;
                // The potential-table lists need BOTH included + excluded components.
                // These two calls and fetchPotentialTableInputs resolve in any order,
                // so coordinate via buildPotentialTableLists rather than assuming order.
                this.buildPotentialTableLists();
            });
    }

    /**
     * Get the potentialTableInputs
     * */
    getPotentialTableInputs() {
        let that = this;
        this.smartorg.wizard.fetchPotentialTableInputs(
            this.$routeParams.templateID).then(function (ptInputs) {
            that.potentialTableInputs = (ptInputs.data && ptInputs.data.PotentialTableInputs) || [];
            that.buildPotentialTableLists();
        }).catch()
    }

    /**
     * Build the included/excluded potential-table-input lists once all three
     * prerequisites have loaded: includedComponents, excludedComponents and
     * potentialTableInputs. Whichever async resolves last triggers the build.
     * Guarded so it runs exactly once (getExcludedPotentialTableInputs mutates
     * potentialTableInputs in place, so it must not run twice).
     */
    buildPotentialTableLists() {
        if (this.potentialTableListsBuilt) {
            return;
        }
        if (!this.includedComponents || !this.excludedComponents || !this.potentialTableInputs) {
            return;
        }
        this.potentialTableListsBuilt = true;
        this.includedPotentialTableInputs = [];
        this.getExcludedPotentialTableInputs(this.potentialTableInputs, this.includedPotentialTableInputs);
    }

    /**
     * Get the excluded potentialTableInput
     * @input pTIS: potentialTableInputs
     * @return {any} The excludedPotentialTableInputs
     * */
    getExcludedPotentialTableInputs(pTIs, includedPotentialTableInputs) {
        //check right list in Input
        //key will be a problem with:&& Object.keys(ptItem).length === Object.keys(item).length
        this.includedComponents.Inputs.forEach(
            function (item) {
                pTIs.forEach(function (ptItem, index) {
                    if (ptItem.CellLink === item.CellLink) {
                        includedPotentialTableInputs.push(ptItem);
                        pTIs.splice(index, 1);
                    }
                });
            }
        );
        //check left list in Input
        this.excludedComponents.Inputs.forEach(
            function (item) {
                pTIs.forEach(function (ptItem, index) {
                    if (ptItem.CellLink === item.CellLink) {
                        includedPotentialTableInputs.push(ptItem);
                        pTIs.splice(index, 1);
                    }
                });
            }
        );

        this.excludedPotentialTableInputs = this.potentialTableInputs;
    }

    /**
     * include potentailTableInput when click plus icon
     * @param {any} The input
     */
    includePotentialTableInput(ptInput) {
        //ptInput.Type = "TABLE";
        this.verifyKey(ptInput);
        let standardptInput = {
            Description: "",
            Val: [],
            Constraint: "double",
            CellLink: ptInput.CellLink,
            Key: ptInput.Key,
            Inherited: false,
            Units: "",
            Type: "TABLE",
            Display: ""
        }
        this.includedPotentialTableInputs.push(ptInput);
        this.includedComponents.Inputs.push(standardptInput);
        var index = this.potentialTableInputs.indexOf(ptInput);
        this.potentialTableInputs.splice(index, 1);

        if (this.includedPotentialTableInputs.length > 0) {
            this.select(this.includedPotentialTableInputs[this.includedPotentialTableInputs.length - 1]);
            this.setPreview(this.includedPotentialTableInputs[this.includedPotentialTableInputs.length - 1]);
        } else {
            this.select(this.includedPotentialTableInputs[0]);
            this.setPreview(this.includedPotentialTableInputs[0]);
        }
    }

    /**
     * exclude potentailTableInput when click minus icon
     * @param {any} The input
     */
    excludePotentialTableInput(ptInput) {
        // var index = this.includedComponents.Inputs.indexOf(ptInput);
        var index = 0;
        for (var i = 0; i < this.includedComponents.Inputs.length; i++) {
            if (this.includedComponents.Inputs[i].CellLink === ptInput.CellLink) {
                index = i;
                break;
            } else {
                index = -1;
            }
        }
        if (index > -1) {
            this.includedComponents.Inputs.splice(index, 1);
        }
        var indexOfExcluded = 0;
        for (var i = 0; i < this.excludedComponents.Inputs.length; i++) {
            if (this.excludedComponents.Inputs[i].CellLink === ptInput.CellLink) {
                indexOfExcluded = i;
                break;
            } else {
                indexOfExcluded = -1;
            }
        }
        if (indexOfExcluded > -1) {
            this.excludedComponents.Inputs.splice(indexOfExcluded, 1);
        }
        var indexOfIncludedPTI = this.includedPotentialTableInputs.indexOf(ptInput);
        this.includedPotentialTableInputs.splice(indexOfIncludedPTI, 1);
        this.excludedPotentialTableInputs.push(ptInput);
        if (this.includedPotentialTableInputs.length > 0) {
            this.select(this.includedPotentialTableInputs[this.includedPotentialTableInputs.length - 1]);
            this.setPreview(this.includedPotentialTableInputs[this.includedPotentialTableInputs.length - 1]);
        } else {
            this.setPreview(null);
        }
    }

    select(ptInput) {
        var celllinkName = ptInput.CellLink;
        this.selectedCelllink = celllinkName;
        let that = this;
        this.includedPotentialTableInputs.forEach(function (item) {
            if (item.CellLink === that.selectedCelllink) {
                that.selected = item;
                that.setPreview(item);
                that.$timeout();
            }
        })
    }

     selectedChooseFrom(ptInput) {
        var celllinkName = ptInput.CellLink;
        this.selectedCelllink = celllinkName;
        this.selected = ptInput;
        this.setPreview(ptInput);
    }

    getIndexOfptinputFromInput(index){
        return this.includedComponents.Inputs.map(function(e){return e.CellLink}).indexOf(this.includedPotentialTableInputs[index].CellLink)
    }

    showImage(index) {
        this.setPreview(this.includedPotentialTableInputs[index]);
    }

    showImageTest(ptInput) {
        this.setPreview(ptInput);
    }

    hideImage(index) {
        this.setPreview(null);
    }

    /**
     * Set the table-input preview for a potential table input.
     *
     * REST CalcEngine returns `HtmlPreview` (a full inline HTML document) instead of the
     * legacy `PreviewURL` (a server-generated PNG URL). WI-3: render it inline in a <div>
     * (not an iframe) so it participates in the page layout. We keep the raw HtmlPreview
     * string here; the view pipes it through the `tablePreviewHtml` filter, which strips it
     * to the <body> inner HTML (dropping <head><style> so it can't leak into the CMS page)
     * and trusts it (inline cell styles survive). The legacy PNG path still uses `imageURL`.
     * Exactly one of `htmlPreview` / `imageURL` is set at a time.
     */
    setPreview(ptInput) {
        if (ptInput && ptInput.HtmlPreview) {
            this.htmlPreview = ptInput.HtmlPreview;
            this.imageURL = "";
        } else if (ptInput && ptInput.PreviewURL) {
            this.imageURL = this.server + ptInput.PreviewURL;
            this.htmlPreview = null;
        } else {
            this.imageURL = "";
            this.htmlPreview = null;
        }
    }

    setCurrentPreview(input) {
        this.currentPreview = input;
    }

    includeInput(input) {
        this.verifyKey(input);
        this.includedComponents.Inputs.push(input);
        var index = this.excludedComponents.Inputs.indexOf(input);
        this.excludedComponents.Inputs.splice(index, 1);
    }

    verifyKey(element) {
        if (element.Key == undefined) {
            element.Key = element.CellLink.substring(element.CellLink.indexOf("!") + 1);
        }
    }

    excludeInput(input) {
        this.excludedComponents.Inputs.push(input);
        var index = this.includedComponents.Inputs.indexOf(input);
        this.includedComponents.Inputs.splice(index, 1);
    }

    includeOutput(output) {
        this.verifyKey(output);
        this.includedComponents.Outputs.push(output);
        var index = this.excludedComponents.Outputs.indexOf(output);
        this.excludedComponents.Outputs.splice(index, 1);
    }

    excludeOutput(output) {
        this.excludedComponents.Outputs.push(output);
        var index = this.includedComponents.Outputs.indexOf(output);
        this.includedComponents.Outputs.splice(index, 1);
    }

    saveWithCommit (commitMessage = "Save Changes!") {
        console.log("Click save!", commitMessage);
        this.save(commitMessage);
        $('#commitMessageModal').modal('hide');
    }

    save(message) {
        this.saveComplete = false;
        this.alerts = [];
        this.saveErrorMessage = "";
        this.huashan.SaveDataStructure(this.session.getCredentials(),
            this.$routeParams.templateID,
            {"data": this.createDataToSubmit(),
                    "commitMessage": message},
            this.isPlatform)
            .then((response) => {
                this.saveComplete = true;
                if (response.status === false) {
                    this.saveErrorMessage = response.msg;
                    this.addAlert(this.saveErrorMessage);
                } else {
                    this.includedComponentsCopy = angular.copy(this.includedComponents);
                }
            });
    }

    initDataEdit(val) {
        if (!val || typeof val === 'object') {
            val = "Jan 1990";
        }
        let temp = val.split(' ');

        return {
            'month': temp[0],
            'year': temp[1]
        }
    }

    updateFormat(val, month, year) {
        if (!val) {
            val = "Jan 1990";
        }

        let temp = val.split(' ');

        if (!month) {
            month = temp[0];
        }

        if (!year) {
            year = temp[1];
        }

        val = month + " " + year;
        return val;
    }

    addAlert(msg) {
        this.alerts.push({type: 'danger', msg: msg});
    }

    closeAlert(index) {
        this.alerts.splice(index, 1);
    }

    createDataToSubmit() {
        var dataToSubmit: DataStructureElements = {};
        dataToSubmit.ID = this.data.result.ID;
        dataToSubmit.Description = this.data.result.Description;
        dataToSubmit.ExcelFile = this.data.result.ExcelFile;
        dataToSubmit.Inputs = this.includedComponents.Inputs;
        dataToSubmit.Outputs = this.includedComponents.Outputs;
        return dataToSubmit;
    }

    isUnchanged() {
        return angular.equals(this.includedComponents, this.includedComponentsCopy);
    }

    changeType(input) {
        switch (input.Type) {
            case "TABLE":
                input.Val = "";
                break;
            case "DISTRIBUTION":
                input.Val = [0, 0, 0];
                break;
            case "SCALAR":
                input.Val = 0;
                break;
            case "DATE":
                input.Val = "";
                break;
            default:
                input.Val = "Invalid Type";
        }
    }
}

interface DataStructureElements {
    ID: string;
    Description: string;
    ExcelFile: string;
    Inputs: string;
    Outputs: string;
}