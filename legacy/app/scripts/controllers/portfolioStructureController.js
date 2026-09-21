/// <reference path="../lib/_all.ts"/>
/// <reference path="../lib/vendorTypeDefinitions/jquery.d.ts"/>
/// <reference path="../lib/vendorTypeDefinitions/angular-route.d.ts"/>
/// <reference path="../lib/vendorTypeDefinitions/bootstrap.d.ts"/>
var PortfolioStructureController = /** @class */ (function () {
    function PortfolioStructureController($route, $routeParams, $location, HUASHAN, Session, $cookies, $rootScope) {
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
        }
        else {
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
                }
                else {
                    that.portfolioStructure = angular.copy(that.portfolioStructureCopy);
                }
            }
        });
        this.getPortfolioStructure();
        this.getPotentialTables();
        this.getAppStructure();
        var a = this;
        var infoGot = localStorage.getItem("INFO");
        var decodedString = atob(infoGot);
        var userInfo = JSON.parse(decodedString);
        this.isAdmin = userInfo.is_admin;
    }
    PortfolioStructureController.prototype.getPortfolioStructure = function () {
        var _this = this;
        this.huashan.GetPortfolioStructure(this.session.getCredentials(), this.$routeParams.templateID, this.isPlatform)
            .then(function (response) {
            _this.portfolioStructure = response.result;
            _this.portfolioStructureCopy = angular.copy(_this.portfolioStructure);
            _this.selectedMenu = _this.portfolioStructure.MENU[0];
            _this.selectMenu(_this.selectedMenu);
            _this.numBucketsClone = 0;
        });
    };
    PortfolioStructureController.prototype.getAppStructure = function () {
        var _this = this;
        this.huashan.GetAppStructure(this.session.getCredentials(), this.$routeParams.templateID, this.isPlatform)
            .then(function (response) {
            _this.appStructure = response.result;
            _this.tornadoOutputs = _this.appStructure.PostProcessingOutputsForPortfolio;
            _this.getDataStructure(); //Ensure GetAppStructure already returned before getting data structure
            var tables = _.filter(_this.appStructure.MENU, function (menu) {
                return menu.Command === "TABLE";
            });
            _this.tables = _this.tables.concat(tables);
            console.log("tables ", _this.tables);
        });
        //when isPlatfrom, still need data from regular app structure
        if (this.isPlatform === true) {
            this.huashan.GetAppStructure(this.session.getCredentials(), this.$routeParams.templateID, false)
                .then(function (response) {
                var regularAppStructure = response.result;
                var tables = _.filter(regularAppStructure.MENU, function (menu) {
                    return menu.Command === "TABLE";
                });
                _this.tables = _this.tables.concat(tables);
                console.log("tables ", _this.tables);
            });
        }
    };
    PortfolioStructureController.prototype.getPotentialTables = function () {
        var _this = this;
        this.huashan.GetPotentialTables(this.session.getCredentials(), this.$routeParams.templateID)
            .then(function (response) {
            _this.potentialTables = response.result.PotentialTableOutputs;
            console.log("potential tables: ", _this.potentialTables);
        });
    };
    PortfolioStructureController.prototype.getDataStructure = function () {
        var _this = this;
        console.log("datastructure");
        this.huashan.GetIncludedDataStructureComponents(this.session.getCredentials(), this.$routeParams.templateID, this.isPlatform)
            .then(function (data) {
            _this.inputs = data.result.Inputs;
            _this.outputs = data.result.Outputs;
            _this.allOutputs = _this.outputs.concat(_this.tornadoOutputs);
        });
    };
    PortfolioStructureController.prototype.selectMenu = function (menu) {
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
            var sets = this.selectedMenu.Parameters.Sets;
            this.bucketManagers = [];
            for (var s in sets) {
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
                    metalogKeysBySource = item.Parameters.MetaLogKeys;
                }
            });
            var that = this;
            if (this.selectedMenu.Parameters.RollupKeys.length > 0) {
                this.selectedMenu.Parameters.RollupKeys.forEach(function (item) {
                    if (metalogKeysBySource.indexOf(item) == -1) {
                        that.selectedMenu.Parameters.RollupKeys =
                            that.remove(that.selectedMenu.Parameters.RollupKeys, item);
                    }
                });
            }
        }
    };
    PortfolioStructureController.prototype.createBucketManager = function (buckets) {
        return new BucketManager(buckets);
    };
    PortfolioStructureController.prototype.selectTable = function (table) {
        var that = this;
        this.selectedTable = table;
        this.selectedMenu.Parameters.Key = table.Parameters.OutputKey;
        this.selectedPotentialTable = _.find(this.potentialTables, function (table) {
            return table.CellLink === that.selectedTable.Parameters.CellLink;
        });
    };
    PortfolioStructureController.prototype.saveWithCommit = function (commitMessage) {
        if (commitMessage === void 0) { commitMessage = "Save Changes!"; }
        console.log("Click save!", commitMessage);
        this.save(commitMessage);
        $('#commitMessageModal').modal('hide');
    };
    PortfolioStructureController.prototype.save = function (message) {
        var _this = this;
        this.checkID();
        this.checkCFOChartInnovationScreen();
        this.saveAlerts = [];
        if (!this.checkScatterPlotName())
            return;
        if (!this.checkBucketChartNum())
            return;
        this.checkMinAndMax();
        this.saveComplete = false;
        this.huashan.SavePortfolioStructure(this.session.getCredentials(), this.$routeParams.templateID, {
            "data": this.portfolioStructure,
            "commitMessage": message
        }, this.isPlatform)
            .then(function (response) {
            console.log(response);
            _this.saveComplete = true;
            if (response.status) {
                _this.portfolioStructureCopy = angular.copy(_this.portfolioStructure);
            }
            else {
                _this.addAlert(_this.saveAlerts, 'danger', response.msg);
            }
        });
    };
    PortfolioStructureController.prototype.checkMinAndMax = function () {
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
    };
    PortfolioStructureController.prototype.checkScatterPlotName = function () {
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
            if (result === false)
                break;
        }
        return result;
    };
    PortfolioStructureController.prototype.checkBucketChartNum = function () {
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
            if (result === false)
                break;
        }
        return result;
    };
    PortfolioStructureController.prototype.checkID = function () {
        if (this.portfolioStructure.ID === undefined) {
            this.portfolioStructure.ID = this.$routeParams.templateID;
        }
    };
    PortfolioStructureController.prototype.changePrecisionOptions = function () {
        this.selectedMenu.Parameters.PrecisionOptions = [];
        if (this.minPrecision === null || this.maxPrecision === null || this.minPrecision > this.maxPrecision) {
            return;
        }
        for (var i = this.minPrecision; i <= this.maxPrecision; i++) {
            this.selectedMenu.Parameters.PrecisionOptions.push(i);
        }
    };
    PortfolioStructureController.prototype.getKeyFrom = function (axis) {
        if (axis === "" || axis === undefined) {
            return "";
        }
        var startIndex = axis.indexOf("'");
        var result = axis.slice(startIndex + 1);
        var endIndex = result.indexOf("'");
        return result.slice(0, endIndex);
    };
    PortfolioStructureController.prototype.getOutputUnitFromKey = function (key) {
        var output = _.find(this.outputs, function (output) {
            return output.Key === key;
        });
        if (output != undefined) {
            return output.Units;
        }
        return "";
    };
    PortfolioStructureController.prototype.getOutputDisplayFromKey = function (key) {
        var output = _.find(this.outputs, function (output) {
            return output.Key === key;
        });
        if (output != undefined) {
            return output.Display;
        }
        else {
            output = _.find(this.tornadoOutputs, function (output) {
                return output.Key === key;
            });
            return output.Title;
        }
    };
    PortfolioStructureController.prototype.getSourceFromAppStruMetalog = function () {
        var a = [];
        this.appStructure.MENU.forEach(function (item) {
            if (item.Command == "METALOG_DISPLAY") {
                a.push(item.ID);
            }
        });
        return a;
    };
    PortfolioStructureController.prototype.getPortfolioUncKeyFromMetalogBySource = function () {
        var key = [];
        var source = this.selectedMenu.Parameters.Source;
        this.appStructure.MENU.forEach(function (item) {
            if (item.Command == "METALOG_DISPLAY" && item.ID == source) {
                key = item.Parameters.MetaLogKeys;
            }
        });
        return key;
    };
    PortfolioStructureController.prototype.addToRollupKeys = function (key) {
        this.selectedMenu.Parameters.RollupKeys.push(key);
    };
    PortfolioStructureController.prototype.removeFromIncludedKeys = function (key) {
        var that = this;
        this.selectedMenu.Parameters.RollupKeys.forEach(function (item) {
            if (item == key) {
                that.selectedMenu.Parameters.RollupKeys =
                    that.remove(that.selectedMenu.Parameters.RollupKeys, key);
            }
        });
    };
    PortfolioStructureController.prototype.remove = function (array, element) {
        return array.filter(function (e) { return e !== element; });
    };
    PortfolioStructureController.prototype.findKey = function (arr) {
        return function (key) {
            return _.find(arr, function (element) {
                return element.Key === key;
            });
        };
    };
    PortfolioStructureController.prototype.buildOutputFromKey = function (key) {
        return "Outputs['" + key + "']";
    };
    PortfolioStructureController.prototype.addCompareValueItem = function () {
        var length = this.selectedMenu.Parameters.Keys.length;
        this.selectedMenu.Parameters.Keys[length] = "";
        this.selectedMenu.Parameters.Units[length] = "";
        this.selectedMenu.Parameters.Titles[length] = "";
    };
    PortfolioStructureController.prototype.addCFOChartItem = function () {
        var cfoChartItem = {
            AverageCost: "",
            xTitle: "",
            AverageValueMinusCost: "",
            yTitle: "",
            name: "CFOChart" + (this.selectedMenu.Parameters.Sets.length + 1).toString()
        };
        this.selectedMenu.Parameters.Sets.push(cfoChartItem);
    };
    PortfolioStructureController.prototype.deleteCFOChartItem = function (index) {
        this.selectedMenu.Parameters.Sets.splice(index, 1);
    };
    PortfolioStructureController.prototype.checkCFOChartInnovationScreen = function () {
        if (this.selectedMenu.Command == "INNOVATION_SCREEN" || this.selectedMenu.Command == "CFO_CHART") {
            for (var i = this.selectedMenu.Parameters.Sets.length - 1; i >= 0; i--) {
                if (this.selectedMenu.Parameters.Sets[i].xTitle == "" || this.selectedMenu.Parameters.Sets[i].yTitle == "") {
                    //this.deleteCFOChartItem(i);
                    this.selectedMenu.Parameters.Sets.splice(i, 1);
                }
            }
        }
    };
    //TODO: Call buildParams() and don't duplicate code
    PortfolioStructureController.prototype.addInnovationScreenItem = function () {
        var innovationscreenItem = {
            x: "",
            xTitle: "",
            y: "",
            yTitle: "",
            VerticalCutoff: null,
            name: "Innovation Screen" + (this.selectedMenu.Parameters.Sets.length + 1).toString()
        };
        this.selectedMenu.Parameters.Sets.push(innovationscreenItem);
    };
    PortfolioStructureController.prototype.deleteInnovationScreenItem = function (index) {
        this.selectedMenu.Parameters.Sets.splice(index, 1);
    };
    PortfolioStructureController.prototype.addScatterPlotItem = function () {
        var scatterPlotItem = {
            x: "",
            y: "",
            xTitle: "",
            yTitle: "",
            name: ""
        };
        this.selectedMenu.Parameters.Sets.push(scatterPlotItem);
    };
    PortfolioStructureController.prototype.deleteCompareValueItem = function (index) {
        this.selectedMenu.Parameters.Keys.splice(index, 1);
        this.selectedMenu.Parameters.Units.splice(index, 1);
        this.selectedMenu.Parameters.Titles.splice(index, 1);
    };
    PortfolioStructureController.prototype.deleteScatterPlotItem = function (index) {
        this.selectedMenu.Parameters.Sets.splice(index, 1);
    };
    PortfolioStructureController.prototype.openNew = function () {
        $('#new-display').val('');
        $('#new-command').val('');
        $('#newPortfolioStructureModal').on("shown.bs.modal", function () {
            $('#new-display').focus();
        });
    };
    PortfolioStructureController.prototype.addNewPortfolioStructure = function (display, command) {
        this.newPortfolioStructureAlerts = [];
        if (!this.checkDisplay(display)) {
            return;
        }
        if (!this.checkCommand(command)) {
            return;
        }
        var newPortfolioStructure = {};
        newPortfolioStructure.Command = command;
        newPortfolioStructure.Display = display;
        newPortfolioStructure.ID = new Common().makeActionIDfrom(display, this.portfolioStructure.MENU);
        newPortfolioStructure.Visible = true;
        var param = this.buildParams(command);
        newPortfolioStructure.Parameters = param;
        if (command === "COMPARE_UNCERTAINTY") {
            newPortfolioStructure.Context = { RequiredCommandInNodeTemplate: "TORNADO_DIST" };
        }
        this.portfolioStructure.MENU.push(newPortfolioStructure);
        this.selectMenu(newPortfolioStructure);
    };
    //Bucket Chart set num of buckets and view will change
    PortfolioStructureController.prototype.generateBuckets = function (setIndex) {
        this.numBucketsClone = this.numBuckets;
        var delta = (parseInt(this.bucketHigh) - parseInt(this.bucketLow)) / this.numBuckets;
        for (var i = 0; i < this.numBuckets; i++) {
            var lower = (parseInt(this.bucketLow) + (i * delta)).toFixed(2);
            var upper = (parseInt(this.bucketLow) + (i + 1) * delta).toFixed(2);
            console.log(i, this.bucketLow, lower, upper);
            this.selectedMenu.Parameters.Sets[setIndex].xBuckets.push({
                GE: lower,
                LT: upper,
                Name: lower + "-" + upper
            });
        }
        this.bucketManagers.push(new BucketManager(this.selectedMenu.Parameters.Sets[setIndex].xBuckets));
        this.bucketLow = "";
        this.bucketHigh = "";
        this.numBuckets = null;
    };
    PortfolioStructureController.prototype.toggleNameEdit = function (bucket, setIndex) {
        if (bucket.nameEditable === true) {
            this.selectedMenu.Parameters.Sets[setIndex].xBuckets = this.bucketManagers[setIndex].buckets();
        }
        bucket.nameEditable = !bucket.nameEditable;
    };
    PortfolioStructureController.prototype.toggleRuleEdit = function (bucket, setIndex) {
        if (bucket.rulesEditable === true) {
            this.selectedMenu.Parameters.Sets[setIndex].xBuckets = this.bucketManagers[setIndex].buckets();
        }
        bucket.rulesEditable = !bucket.rulesEditable;
    };
    PortfolioStructureController.prototype.addBucketChartSet = function () {
        this.selectedMenu.Parameters.Sets.push(this.emptyBucketSet());
        this.numBucketsClone = null;
        console.log("Added Bucket chart", this.selectedMenu.Parameters.Sets);
    };
    PortfolioStructureController.prototype.addBucket = function (setIndex) {
        var emptyBucket = {
            nameEditable: false,
            rulesEditable: false,
            rule1Type: "",
            rule2Type: "",
            rule1Value: null,
            rule2Value: null
        };
        this.bucketManagers[setIndex].editableBuckets.push(emptyBucket);
        this.selectedMenu.Parameters.Sets[setIndex].xBuckets = this.bucketManagers[setIndex].buckets();
    };
    PortfolioStructureController.prototype.deleteBucket = function (setIndex) {
        if (this.bucketManagers[setIndex].editableBuckets.length > 0) {
            this.bucketManagers[setIndex].editableBuckets.splice(this.bucketManagers[setIndex].editableBuckets.length - 1, 1);
        }
        else {
        }
        this.selectedMenu.Parameters.Sets[setIndex].xBuckets = this.bucketManagers[setIndex].buckets();
    };
    PortfolioStructureController.prototype.deleteBucketSet = function (setIndex) {
        this.selectedMenu.Parameters.Sets.splice(setIndex, 1);
        this.bucketManagers.splice(setIndex, 1);
        this.numBucketsClone = 0;
    };
    PortfolioStructureController.prototype.checkDisplay = function (display) {
        if (display === undefined) {
            this.addAlert(this.newPortfolioStructureAlerts, "danger", "please type in the name of the new portfolio structure!");
            return false;
        }
        else {
            return true;
        }
    };
    PortfolioStructureController.prototype.checkCommand = function (command) {
        if (command === undefined) {
            this.addAlert(this.newPortfolioStructureAlerts, "danger", "please choose a command of the new portfolio structure!");
            return false;
        }
        else {
            return true;
        }
    };
    PortfolioStructureController.prototype.emptyBucketSet = function () {
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
    };
    PortfolioStructureController.prototype.buildParams = function (command) {
        switch (command) {
            case "ADD_TABLES":
                var param = {};
                param.Key = this.tables[0].Parameters.OutputKey;
                param.NodeLookup = "Outputs";
                param.PnL = false;
                param.PrecisionOptions = [0, 1, 2];
                param.DefaultPrecision = 2;
                break;
            case "COMPARE_VALUE":
                var param = {};
                param.Keys = [];
                param.Units = [];
                param.Titles = [];
                param.NodeLookup = "Outputs";
                param.min = 0;
                param.max = 0;
                param.Total = false;
                break;
            case "COMPARE_UNCERTAINTY":
                var param = {};
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
                var param = {};
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
                var param = {};
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
                var param = {};
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
                var param = {};
                param.Sets = [];
                break;
            case "PORTFOLIO_UNCERTAINTY":
                var param = {
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
    };
    PortfolioStructureController.prototype.isUnchanged = function () {
        return angular.equals(this.portfolioStructure, this.portfolioStructureCopy);
    };
    PortfolioStructureController.prototype.addAlert = function (alert, type, msg) {
        alert.push({ type: type, msg: msg });
    };
    PortfolioStructureController.prototype.closeAlert = function (alert, index) {
        alert.splice(index, 1);
    };
    PortfolioStructureController.prototype.rename = function () {
        this.save();
        $('#editPortfolioStructureModal').modal('hide');
    };
    PortfolioStructureController.prototype.deletePortfolioStructure = function () {
        this.portfolioStructure.MENU.splice(this.portfolioStructure.MENU.indexOf(this.selectedMenu), 1);
        if (!this.isUnchanged()) {
            this.save("Delete " + this.selectedMenu.Display);
        }
        this.selectedMenu = this.portfolioStructure.MENU[0];
        $('#deletePortfolioStructureModal').modal('hide');
    };
    return PortfolioStructureController;
}());
var BucketManager = /** @class */ (function () {
    function BucketManager(buckets) {
        this.rule1Options = this.makeRule1Options();
        this.rule2Options = this.makeRule2Options();
        this.editableBuckets = this.editableBucketsFrom(buckets);
        this.editing = false;
    }
    BucketManager.prototype.editableBucketsFrom = function (buckets) {
        var _this = this;
        var answer = new Array();
        buckets.forEach(function (bucket) {
            var rule1Type = _this.rule1From(bucket);
            var rule2Type = _this.rule2From(bucket);
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
    };
    BucketManager.prototype.rule1From = function (bucket) {
        return bucket.GT ? this.rule1Options[1] : bucket.GE ? this.rule1Options[2] : this.rule1Options[0];
    };
    BucketManager.prototype.rule2From = function (bucket) {
        return bucket.LT ? this.rule2Options[1] : bucket.LE ? this.rule2Options[2] : this.rule2Options[0];
    };
    BucketManager.prototype.buckets = function () {
        var answer = new Array();
        this.editableBuckets.forEach(function (bucket) {
            var packet = {
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
    };
    BucketManager.prototype.makeRule1Options = function () {
        return [{ Label: "", Value: "NONE" }, {
                Label: ">",
                Value: "GT"
            }, { Label: ">=", Value: "GE" }];
    };
    BucketManager.prototype.makeRule2Options = function () {
        return [{ Label: "", Value: "NONE" }, {
                Label: "<",
                Value: "LT"
            }, { Label: "<=", Value: "LE" }];
    };
    BucketManager.prototype.makeEditable = function () {
        this.editing = true;
    };
    BucketManager.prototype.stopEditing = function () {
        this.editing = false;
    };
    return BucketManager;
}());
//# sourceMappingURL=portfolioStructureController.js.map