/// <reference path="../lib/_all.ts"/>
/// <reference path="../lib/vendorTypeDefinitions/jquery.d.ts"/>
/// <reference path="../lib/vendorTypeDefinitions/angular-route.d.ts"/>
/// <reference path="../lib/vendorTypeDefinitions/bootstrap.d.ts"/>

class PortfolioStructureController {
    //injector
    $route: ng.route.IRouteService;
    $routeParams: ng.route.IRouteParamsService;
    huashan: Huashan;
    session: Session;
    $location: ng.ILocationService;
    $cookies: ng.cookies.ICookiesService;
    $rootScope: ng.IRootScopeService;
    //binding
    selectedTemplate: string;
    portfolioStructure: any;
    portfolioStructureCopy: any;
    selectedMenu: any;
    commands: any;
    saveComplete: boolean;
    tables: any;
    selectedTable: any;
    appStructure: any;
    potentialTables: any;
    selectedPotentialTable: any;
    server: any;
    minPrecision: number;
    maxPrecision: number;
    saveAlerts: any;
    inputs: any;
    outputs: any;
    tornadoOutputs: any;
    allOutputs: any;
    newPortfolioStructureAlerts: any;
    isPlatform: boolean;
    sortableOptions: any;
    bucketManagers: Array<BucketManager>;
    bucketManager: BucketManager;
    numBuckets: number;
    bucketLow: string;
    bucketHigh: string;
    numBucketsClone: number;
    isAdmin: any;


    constructor($route, $routeParams, $location, HUASHAN, Session, $cookies, $rootScope) {
        this.$rootScope = $rootScope;
        this.$route = $route;
        this.$routeParams = $routeParams;
        this.$location = $location;
        this.huashan = HUASHAN;
        this.session = Session;
        this.$cookies = $cookies;
        this.isPlatform = false;


        if ($route.current !== undefined) {
            this.isPlatform = $route.current.$$route.platform;
        }
        if (this.session.getCredentials() || this.$cookies.huashansession) {
            this.session.create(this.$cookies.huashansession);
        } else {
            this.$location.path("/login");
        }
        this.selectedTemplate = this.$routeParams.templateID;
        this.commands = ["COMPARE_VALUE", "COMPARE_UNCERTAINTY", "CFO_CHART", "ADD_TABLES", "INNOVATION_SCREEN", "BUCKET_CHART"];
        this.saveComplete = true;
        this.server = app.server;
        this.tables = [];
        var that = this;
        this.$rootScope.$on("$locationChangeStart", function (event, next, current) {
            if (current.indexOf("#/portfoliostructure/") != -1 && !that.isUnchanged()) {
                if (!confirm("You have unsaved changes in portfolio structure, continue navigating to " + next + " ?")) {
                    event.preventDefault();
                } else {
                    that.portfolioStructure = angular.copy(that.portfolioStructureCopy);
                }
            }
        });
        this.getPortfolioStructure();
        this.getPotentialTables();
        this.getAppStructure();
        var a = this;
        let infoGot = localStorage.getItem("INFO")
        let decodedString = atob(infoGot);
        let userInfo = JSON.parse(decodedString);
        this.isAdmin = userInfo.is_admin
    }

    getPortfolioStructure() {
        this.huashan.GetPortfolioStructure(this.session.getCredentials(), this.$routeParams.templateID, this.isPlatform)
            .then((response) => {
                this.portfolioStructure = response.result;
                this.portfolioStructureCopy = angular.copy(this.portfolioStructure);
                this.selectedMenu = this.portfolioStructure.MENU[0];
                this.selectMenu(this.selectedMenu);
                this.numBucketsClone = 0;
            });
    }

    getAppStructure() {
        this.huashan.GetAppStructure(this.session.getCredentials(), this.$routeParams.templateID, this.isPlatform)
            .then((response) => {
                this.appStructure = response.result;
                this.tornadoOutputs = this.appStructure.PostProcessingOutputsForPortfolio;
                this.getDataStructure();//Ensure GetAppStructure already returned before getting data structure
                var tables = _.filter(this.appStructure.MENU, function (menu) {
                    return menu.Command === "TABLE";
                });
                this.tables = this.tables.concat(tables);
                console.log("tables ", this.tables);
            });
        //when isPlatfrom, still need data from regular app structure
        if (this.isPlatform === true) {
            this.huashan.GetAppStructure(this.session.getCredentials(), this.$routeParams.templateID, false)
                .then((response) => {
                    var regularAppStructure = response.result;
                    var tables = _.filter(regularAppStructure.MENU, function (menu) {
                        return menu.Command === "TABLE";
                    });
                    this.tables = this.tables.concat(tables);
                    console.log("tables ", this.tables);
                });
        }
    }

    getPotentialTables() {
        this.huashan.GetPotentialTables(this.session.getCredentials(), this.$routeParams.templateID)
            .then((response) => {
                this.potentialTables = response.result.PotentialTableOutputs;
                console.log("potential tables: ", this.potentialTables);
            });
    }

    getDataStructure() {
        console.log("datastructure");
        this.huashan.GetIncludedDataStructureComponents(this.session.getCredentials(), this.$routeParams.templateID, this.isPlatform)
            .then((data) => {
                this.inputs = data.result.Inputs;
                this.outputs = data.result.Outputs;
                this.allOutputs = this.outputs.concat(this.tornadoOutputs);
            });
    }

    selectMenu(menu) {
        this.selectedMenu = menu;
        console.log(this.selectedMenu);
        var that = this;
        if (this.selectedMenu.Command === "ADD_TABLES") {
            this.selectedTable = _.find(this.tables, function (table) {
                return table.Parameters.OutputKey === that.selectedMenu.Parameters.Key;
            });
            this.selectedPotentialTable = _.find(this.potentialTables, function (table) {
                return table.CellLink === that.selectedTable.Parameters.CellLink;
            });
            this.minPrecision = (this.selectedMenu.Parameters.PrecisionOptions === undefined || this.selectedMenu.Parameters.PrecisionOptions.length === 0) ? null : this.selectedMenu.Parameters.PrecisionOptions[0];
            this.maxPrecision = (this.selectedMenu.Parameters.PrecisionOptions === undefined || this.selectedMenu.Parameters.PrecisionOptions.length === 0) ? null : this.selectedMenu.Parameters.PrecisionOptions[this.selectedMenu.Parameters.PrecisionOptions.length - 1];
            console.log(this.minPrecision, this.maxPrecision);
        }
        if (this.selectedMenu.Command === "BUCKET_CHART") {
            //this.numBuckets = this.selectedMenu.Parameters.Sets;
            this.bucketLow = "";
            this.bucketHigh = "";
            this.numBuckets = "";
            let sets = this.selectedMenu.Parameters.Sets;
            this.bucketManagers = [];
            for (let s in sets) {
                this.bucketManagers.push(new BucketManager(sets[s].xBuckets));
            }
        }
        if (this.selectedMenu.Command === "PORTFOLIO_UNCERTAINTY") {
            //check if every key in RollupKeys is in MetalogKeys by source
            //if not remove it
            var source = this.selectedMenu.Parameters.Source;
            var metalogKeysBySource = [];
            this.appStructure.MENU.forEach(function (item) {
                if (item.Command == "METALOG_DISPLAY" && item.ID == source) {
                    metalogKeysBySource = item.Parameters.MetaLogKeys
                }
            });
            var that = this;
            if (this.selectedMenu.Parameters.RollupKeys.length > 0) {
                this.selectedMenu.Parameters.RollupKeys.forEach(function (item) {
                    if (metalogKeysBySource.indexOf(item) == -1) {
                        that.selectedMenu.Parameters.RollupKeys =
                            that.remove(that.selectedMenu.Parameters.RollupKeys, item);
                    }
                })
            }
        }
    }


    createBucketManager(buckets) {
        return new BucketManager(buckets);
    }

    selectTable(table) {
        var that = this;
        this.selectedTable = table;
        this.selectedMenu.Parameters.Key = table.Parameters.OutputKey;
        this.selectedPotentialTable = _.find(this.potentialTables, function (table) {
            return table.CellLink === that.selectedTable.Parameters.CellLink;
        });

    }

    saveWithCommit(commitMessage = "Save Changes!") {
        console.log("Click save!", commitMessage);
        this.save(commitMessage);
        $('#commitMessageModal').modal('hide');
    }

    save(message) {
        this.checkID();
        this.checkCFOChartInnovationScreen();
        this.saveAlerts = [];
        if (!this.checkScatterPlotName()) return;
        if (!this.checkBucketChartNum()) return;
        this.checkMinAndMax();
        this.saveComplete = false;
        this.huashan.SavePortfolioStructure(this.session.getCredentials(),
            this.$routeParams.templateID,
            {
                "data": this.portfolioStructure,
                "commitMessage": message
            },
            this.isPlatform)
            .then((response) => {
                console.log(response);
                this.saveComplete = true;
                if (response.status) {
                    this.portfolioStructureCopy = angular.copy(this.portfolioStructure);
                } else {
                    this.addAlert(this.saveAlerts, 'danger', response.msg);
                }
            });
    }

    checkMinAndMax() {
        for (var i in this.portfolioStructure.MENU) {
            if (this.portfolioStructure.MENU[i].Parameters.Min === null) {
                delete this.portfolioStructure.MENU[i].Parameters.Min;
            }
            if (this.portfolioStructure.MENU[i].Parameters.Max === null) {
                delete this.portfolioStructure.MENU[i].Parameters.Max;
            }
            if (this.portfolioStructure.MENU[i].Parameters.PrecisionOptions !== undefined && this.portfolioStructure.MENU[i].Parameters.PrecisionOptions.length === 0) {
                delete this.portfolioStructure.MENU[i].Parameters.DefaultPrecision;
            }
        }
    }

    checkScatterPlotName() {
        var result = true;
        for (var i = 0; i < this.portfolioStructure.MENU.length; i++) {
            if (this.portfolioStructure.MENU[i].Command === "SCATTER_PLOT" && this.portfolioStructure.MENU[i].Parameters.Sets.length > 1) {
                for (var j = 0; j < this.portfolioStructure.MENU[i].Parameters.Sets.length; j++) {
                    if (this.portfolioStructure.MENU[i].Parameters.Sets[j].name === "" || this.portfolioStructure.MENU[i].Parameters.Sets[j].name === undefined) {
                        this.addAlert(this.saveAlerts, "danger", "SCATTER_PLOT must have names!");
                        result = false;
                        break;
                    }
                }
            }
            if (result === false) break;
        }
        return result;
    }

    checkBucketChartNum() {
        var result = true;
        for (var i = 0; i < this.portfolioStructure.MENU.length; i++) {
            if (this.portfolioStructure.MENU[i].Command === "BUCKET_CHART"
                && this.portfolioStructure.MENU[i].Parameters.Sets.length > 1) {
                for (var j = 0; j < this.portfolioStructure.MENU[i].Parameters.Sets.length; j++) {
                    if (this.portfolioStructure.MENU[i].Parameters.Sets[j].xBuckets.length === 0
                        || this.numBucketsClone === undefined
                        || this.numBucketsClone === null) {
                        this.addAlert(this.saveAlerts, "danger", "Buckets can not be empty!");
                        result = false;
                        break;
                    }
                }
            }
            if (result === false) break;
        }
        return result;
    }

    checkID() {
        if (this.portfolioStructure.ID === undefined) {
            this.portfolioStructure.ID = this.$routeParams.templateID;
        }
    }

    changePrecisionOptions() {
        this.selectedMenu.Parameters.PrecisionOptions = [];
        if (this.minPrecision === null || this.maxPrecision === null || this.minPrecision > this.maxPrecision) {
            return;
        }
        for (var i = this.minPrecision; i <= this.maxPrecision; i++) {
            this.selectedMenu.Parameters.PrecisionOptions.push(i);
        }
    }

    getKeyFrom(axis) {
        if (axis === "" || axis === undefined) {
            return "";
        }
        var startIndex = axis.indexOf("'");
        var result = axis.slice(startIndex + 1);
        var endIndex = result.indexOf("'");
        return result.slice(0, endIndex);
    }


    getOutputUnitFromKey(key) {
        var output = _.find(this.outputs, function (output) {
            return output.Key === key;
        })
        if (output != undefined) {
            return output.Units;
        }
        return "";

    }

    getOutputDisplayFromKey(key) {
        var output = _.find(this.outputs, function (output) {
            return output.Key === key;
        })
        if (output != undefined) {
            return output.Display;
        } else {
            output = _.find(this.tornadoOutputs, function (output) {
                return output.Key === key;
            })
            return output.Title;
        }
    }

    getSourceFromAppStruMetalog() {
        var a = [];
        this.appStructure.MENU.forEach(function (item) {
            if (item.Command == "METALOG_DISPLAY") {
                a.push(item.ID)
            }
        });
        return a
    }

    getPortfolioUncKeyFromMetalogBySource() {
        var key = [];
        var source = this.selectedMenu.Parameters.Source;
        this.appStructure.MENU.forEach(function (item) {
            if (item.Command == "METALOG_DISPLAY" && item.ID == source) {
                key = item.Parameters.MetaLogKeys;
            }
        });
        return key
    }

    addToRollupKeys(key) {
        this.selectedMenu.Parameters.RollupKeys.push(key);
    }

    removeFromIncludedKeys(key) {
        var that = this;
        this.selectedMenu.Parameters.RollupKeys.forEach(function (item) {
            if (item == key) {
                that.selectedMenu.Parameters.RollupKeys =
                    that.remove(that.selectedMenu.Parameters.RollupKeys, key);
            }
        });
    }

    remove(array, element) {
        return array.filter(e => e !== element);
    }

    findKey(arr) {
        return function (key) {
            return _.find(arr, function (element) {
                return element.Key === key;
            });
        }
    }

    buildOutputFromKey(key) {
        return "Outputs['" + key + "']";
    }

    addCompareValueItem() {
        var length = this.selectedMenu.Parameters.Keys.length;
        this.selectedMenu.Parameters.Keys[length] = "";
        this.selectedMenu.Parameters.Units[length] = "";
        this.selectedMenu.Parameters.Titles[length] = "";
    }

    addCFOChartItem() {
        var cfoChartItem = {
            AverageCost: "",
            xTitle: "",
            AverageValueMinusCost: "",
            yTitle: "",
            name: "CFOChart" + (this.selectedMenu.Parameters.Sets.length + 1).toString()
        };
        this.selectedMenu.Parameters.Sets.push(cfoChartItem);
    }

    deleteCFOChartItem(index) {
        this.selectedMenu.Parameters.Sets.splice(index, 1);
    }

    checkCFOChartInnovationScreen() {
        if (this.selectedMenu.Command == "INNOVATION_SCREEN" || this.selectedMenu.Command == "CFO_CHART") {
            for (var i = this.selectedMenu.Parameters.Sets.length - 1; i >= 0; i--) {
                if (this.selectedMenu.Parameters.Sets[i].xTitle == "" || this.selectedMenu.Parameters.Sets[i].yTitle == "") {
                    //this.deleteCFOChartItem(i);
                    this.selectedMenu.Parameters.Sets.splice(i, 1);
                }
            }
        }
    }

    //TODO: Call buildParams() and don't duplicate code
    addInnovationScreenItem() {
        var innovationscreenItem = {
            x: "",
            xTitle: "",
            y: "",
            yTitle: "",
            VerticalCutoff: null,
            name: "Innovation Screen" + (this.selectedMenu.Parameters.Sets.length + 1).toString()
        };
        this.selectedMenu.Parameters.Sets.push(innovationscreenItem);
    }

    deleteInnovationScreenItem(index) {
        this.selectedMenu.Parameters.Sets.splice(index, 1);
    }


    addScatterPlotItem() {
        var scatterPlotItem = {
            x: "",
            y: "",
            xTitle: "",
            yTitle: "",
            name: ""
        }
        this.selectedMenu.Parameters.Sets.push(scatterPlotItem);
    }

    deleteCompareValueItem(index) {
        this.selectedMenu.Parameters.Keys.splice(index, 1);
        this.selectedMenu.Parameters.Units.splice(index, 1);
        this.selectedMenu.Parameters.Titles.splice(index, 1);
    }


    deleteScatterPlotItem(index) {
        this.selectedMenu.Parameters.Sets.splice(index, 1);
    }

    openNew() {
        $('#new-display').val('');
        $('#new-command').val('');
        $('#newPortfolioStructureModal').on("shown.bs.modal", function () {
            $('#new-display').focus();

        });
    }

    addNewPortfolioStructure(display, command) {
        this.newPortfolioStructureAlerts = [];
        if (!this.checkDisplay(display)) {
            return;
        }
        if (!this.checkCommand(command)) {
            return;
        }
        var newPortfolioStructure: PortfolioStructureElement = {};
        newPortfolioStructure.Command = command;
        newPortfolioStructure.Display = display;
        newPortfolioStructure.ID = new Common().makeActionIDfrom(display, this.portfolioStructure.MENU);
        newPortfolioStructure.Visible = true;
        var param = this.buildParams(command);
        newPortfolioStructure.Parameters = param;
        if (command === "COMPARE_UNCERTAINTY") {
            newPortfolioStructure.Context = {RequiredCommandInNodeTemplate: "TORNADO_DIST"};
        }
        this.portfolioStructure.MENU.push(newPortfolioStructure);
        this.selectMenu(newPortfolioStructure);
    }


    //Bucket Chart set num of buckets and view will change
    generateBuckets(setIndex: number) {
        this.numBucketsClone = this.numBuckets;
        var delta = (parseInt(this.bucketHigh) - parseInt(this.bucketLow)) / this.numBuckets;
        for (var i = 0; i < this.numBuckets; i++) {
            var lower = (parseInt(this.bucketLow) + (i * delta)).toFixed(2);
            var upper = (parseInt(this.bucketLow) + (i + 1) * delta).toFixed(2);
            console.log(i, this.bucketLow, lower, upper);
            this.selectedMenu.Parameters.Sets[setIndex].xBuckets.push(
                {
                    GE: lower,
                    LT: upper,
                    Name: lower + "-" + upper
                }
            )
        }
        this.bucketManagers.push(new BucketManager(this.selectedMenu.Parameters.Sets[setIndex].xBuckets));
        this.bucketLow = "";
        this.bucketHigh = "";
        this.numBuckets = null;

    }

    toggleNameEdit(bucket: EditableBucket, setIndex: number) {
        if (bucket.nameEditable === true) {
            this.selectedMenu.Parameters.Sets[setIndex].xBuckets = this.bucketManagers[setIndex].buckets();
        }
        bucket.nameEditable = !bucket.nameEditable;
    }

    toggleRuleEdit(bucket: EditableBucket, setIndex: number) {
        if (bucket.rulesEditable === true) {
            this.selectedMenu.Parameters.Sets[setIndex].xBuckets = this.bucketManagers[setIndex].buckets();
        }
        bucket.rulesEditable = !bucket.rulesEditable;
    }

    addBucketChartSet() {
        this.selectedMenu.Parameters.Sets.push(this.emptyBucketSet());
        this.numBucketsClone = null;
        console.log("Added Bucket chart", this.selectedMenu.Parameters.Sets);
    }

    addBucket(setIndex: number) {
        var emptyBucket = {
            nameEditable: false,
            rulesEditable: false,
            rule1Type: "",
            rule2Type: "",
            rule1Value: null,
            rule2Value: null,
        };
        this.bucketManagers[setIndex].editableBuckets.push(emptyBucket);
        this.selectedMenu.Parameters.Sets[setIndex].xBuckets = this.bucketManagers[setIndex].buckets();
    }

    deleteBucket(setIndex: number) {
        if (this.bucketManagers[setIndex].editableBuckets.length > 0) {
            this.bucketManagers[setIndex].editableBuckets.splice(this.bucketManagers[setIndex].editableBuckets.length - 1, 1);
        } else {

        }

        this.selectedMenu.Parameters.Sets[setIndex].xBuckets = this.bucketManagers[setIndex].buckets();
    }

    deleteBucketSet(setIndex: number) {
        this.selectedMenu.Parameters.Sets.splice(setIndex, 1);
        this.bucketManagers.splice(setIndex, 1);
        this.numBucketsClone = 0;

    }

    private checkDisplay(display) {
        if (display === undefined) {
            this.addAlert(this.newPortfolioStructureAlerts, "danger", "please type in the name of the new portfolio structure!");
            return false;
        } else {
            return true;
        }
    }

    private checkCommand(command) {
        if (command === undefined) {
            this.addAlert(this.newPortfolioStructureAlerts, "danger", "please choose a command of the new portfolio structure!");
            return false;
        } else {
            return true;
        }
    }

    private emptyBucketSet() {
        return {
            Title: "",
            xTitle: "",
            NodeLookup: "Outputs",
            xBuckets: [],
            Addable: "false",
            Key: "",
            bucketChartType: "percentage",
            Counts: false,
            yTitle: "Percentage",
            numOfBucket: null
        };

    }

    private buildParams(command: any) {
        switch (command) {
            case "ADD_TABLES":
                var param: AddTables = {};
                param.Key = this.tables[0].Parameters.OutputKey;
                param.NodeLookup = "Outputs";
                param.PnL = false;
                param.PrecisionOptions = [0, 1, 2];
                param.DefaultPrecision = 2;
                break;
            case "COMPARE_VALUE":
                var param: CompareValue = {};
                param.Keys = [];
                param.Units = [];
                param.Titles = [];
                param.NodeLookup = "Outputs";
                param.min = 0;
                param.max = 0;
                param.Total = false;
                break;
            case "COMPARE_UNCERTAINTY":
                var param: CompareUncertainty = {};
                param.Keys = [
                    "Key",
                    "Summary",
                    "Mean",
                    "Display",
                    "Units"
                ];
                param.NodeLookup = "TornadoDistOutputs";
                break;
            case "INNOVATION_SCREEN":
                var param: InnovationScreen = {};
                param.Sets = [{
                    x: "",
                    xTitle: "",
                    y: "",
                    yTitle: "",
                    VerticalCutoff: null,
                    name: "Innovation Screen1"
                }];
                break;
            case "CFO_CHART":
                var param: CFOChart = {};
                param.Sets = [{
                    AverageCost: "",
                    xTitle: "",
                    AverageValueMinusCost: "",
                    yTitle: "",
                    name: "CFOChart1"
                }];
                // param.AverageCost = [];
                // param.XTitle = [];
                // param.AverageValueMinusCost = [];
                // param.YTitle = [];
                // param.Name = [];
                break;
            case "SCATTER_PLOT":
                var param: ScatterPlot = {};
                param.Sets = [{
                    x: "",
                    y: "",
                    xTitle: "",
                    yTitle: ""
                }];
                param.SameScale = false;
                param.Min = null;
                param.Max = null;
                break;
            case "BUCKET_CHART":
                var param: BucketChart = {};
                param.Sets = [];
                break;
            case "PORTFOLIO_UNCERTAINTY":
                var param: PortfolioUncertainty = {
                    Source: "",
                    MVSType: "",
                    RollupKeys: [],
                    PortfolioUncExplanation: "",
                    Representation: ""
                };
                break;
            default:
                var param = {};
        }
        return param;
    }

    isUnchanged() {
        return angular.equals(this.portfolioStructure, this.portfolioStructureCopy);
    }

    addAlert(alert, type, msg) {
        alert.push({type: type, msg: msg});
    }

    closeAlert(alert, index) {
        alert.splice(index, 1);
    }

    rename() {
        this.save();
        $('#editPortfolioStructureModal').modal('hide');
    }

    deletePortfolioStructure() {
        this.portfolioStructure.MENU.splice(this.portfolioStructure.MENU.indexOf(this.selectedMenu), 1);
        if (!this.isUnchanged()) {
            this.save("Delete " + this.selectedMenu.Display);
        }
        this.selectedMenu = this.portfolioStructure.MENU[0];
        $('#deletePortfolioStructureModal').modal('hide');
    }

}

interface PortfolioStructureElement {
    Command: string
    Display: string
    ID: string
    Parameters: any
    Visible: boolean
}

interface AddTables {
    Key: string
    NodeLookup: string
    PnL: boolean
    PrecisionOptions: Array<number>
    DefaultPrecision: number
    SpecialRules: Array<string>
}

interface CompareValue {
    Keys: Array<string>
    Units: Array<string>
    Titles: Array<string>
    NodeLookup: string
    Total: boolean
    min: number
    max: number
}

interface CompareUncertainty {
    Keys: Array<string>
    NodeLookup: string
}

interface InnovationScreen {
    Sets: Array<{
        x: string;
        xTitle: string;
        y: string;
        yTitle: string;
        VerticalCutoff: number;
        name: string
    }>
}

interface CFOChart {
    Sets: Array<{
        AverageCost: string;
        xTitle: string;
        name: string;
        AverageValueMinusCost: string;
        yTitle: string
    }>
}

interface ScatterPlot {
    SameScale: boolean
    Min: number
    Max: number
    Sets: Array<{ x: string; y: string; xTitle: string; yTitle: string; name: string; }>
}

interface PortfolioUncertainty {
    Source: any
    MVSType: any
    RollupKeys: Array<any>
    PortfolioUncExplanation: any
    Representation: any
}

interface BucketChart {

    Sets: Array<{
        Title: string;
        xTitle: string;
        NodeLookup: string;
        xBuckets: Array<Bucket>;
        Addable: boolean;
        Key: string;
        bucketChartType: string;
        Counts: boolean;
        yTitle: string;
    }>
}

interface Bucket {
    LT?: number;
    LE?: number;
    GT?: number;
    GE?: number;
    Name: string;
}

interface EditableBucket extends Bucket {
    nameEditable: boolean;
    rulesEditable: boolean;
    rule1Type: string;
    rule2Type: string;
    rule1Value: number;
    rule2Value: number;
}

class BucketManager {
    editableBuckets: Array<EditableBucket>;
    rule1Options: Array<RuleOption>;
    rule2Options: Array<RuleOption>;
    editing: boolean;
    indicator: boolean;

    constructor(buckets: Array<Bucket>) {
        this.rule1Options = this.makeRule1Options();
        this.rule2Options = this.makeRule2Options();
        this.editableBuckets = this.editableBucketsFrom(buckets);
        this.editing = false;
    }

    editableBucketsFrom(buckets: Array<Bucket>): Array<EditableBucket> {
        var answer = new Array<EditableBucket>();
        buckets.forEach((bucket: Bucket) => {
            var rule1Type = this.rule1From(bucket);
            var rule2Type = this.rule2From(bucket);
            var rule1Value = bucket[rule1Type.Value];
            var rule2Value = bucket[rule2Type.Value];
            answer.push({
                Name: bucket.Name,
                nameEditable: false,
                rulesEditable: false,
                rule1Type: rule1Type,
                rule1Value: rule1Value,
                rule2Type: rule2Type,
                rule2Value: rule2Value
            });
        });
        return answer;
    }

    rule1From(bucket: Bucket): RuleOption {
        return bucket.GT ? this.rule1Options[1] : bucket.GE ? this.rule1Options[2] : this.rule1Options[0];
    }

    rule2From(bucket: Bucket): RuleOption {
        return bucket.LT ? this.rule2Options[1] : bucket.LE ? this.rule2Options[2] : this.rule2Options[0];
    }

    buckets(): Array<Bucket> {
        var answer = new Array<Bucket>();
        this.editableBuckets.forEach((bucket: EditableBucket) => {
            var packet: Bucket = {
                Name: bucket.Name
            };
            switch (bucket.rule1Type.Value) {
                case "GT":
                    packet.GT = bucket.rule1Value;
                    break;
                case "GE":
                    packet.GE = bucket.rule1Value;
                    break;
            }
            switch (bucket.rule2Type.Value) {
                case "LT":
                    packet.LT = bucket.rule2Value;
                    break;
                case "LE":
                    packet.LE = bucket.rule2Value;
                    break;
            }
            answer.push(packet);
        });
        return answer;
    }

    makeRule1Options(): Array<RuleOption> {
        return [{Label: "", Value: "NONE"}, {
            Label: ">",
            Value: "GT"
        }, {Label: ">=", Value: "GE"}];
    }

    makeRule2Options(): Array<RuleOption> {
        return [{Label: "", Value: "NONE"}, {
            Label: "<",
            Value: "LT"
        }, {Label: "<=", Value: "LE"}];
    }

    makeEditable() {
        this.editing = true;
    }

    stopEditing() {
        this.editing = false;
    }

}

interface RuleOption {
    Label: string;
    Value: string;
}