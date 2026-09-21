/// <reference path="../lib/_all.ts"/>

class AppStructureController {
    //injector
    $route: ng.route.IRouteService;
    $routeParams: ng.route.IRouteParamsService;
    huashan: Huashan;
    session: Session;
    $location: ng.ILocationService;
    $cookies: ng.cookies.ICookiesService;
    $rootScope: ng.IRootScopeService;
    $timeout: ng.ITimeoutService;
    imageChartInstance: any;
    //binding
    selectedTemplate: string;
    appStructure: any;
    appStructureCopy: any; //for saving purpose.
    selectedMenu: any;
    potentialTables: any;
    tables: any;
    selectedTable: any;
    selectedPotentialTable: any;
    minPrecision: number;
    maxPrecision: number;
    selectedChart: any;
    charts: any;
    show: boolean;
    server: any;
    types: any;
    selectedType: string;
    saveAlerts: any;
    saveComplete: boolean;
    imageTypes: any;
    inputs: any;
    outputs: any;
    tornado: any;
    postProcessing: any;
    sendBackElements: any;
    allDataStructureComponents: any;
    tornadoOutputs: any;
    tableInputs: any;
    newAppStructureAlerts: any;
    selectedImageTable: any;
    selectedImageChart: any;
    excludedInputs: any;
    isPlatform: boolean;
    tornadoValueMetricKeys: any;
    tornadoMetaLogKeys: any;
    allOutputs: any;
    bucketManagers: Array<BucketManager>;
    bucketManager: BucketManager;
    numBuckets: number;
    bucketLow: string;
    bucketHigh: string;
    numBucketsClone: number;
    // metalogHelpIcon: boolean;
    // failurebranchFlag: boolean;
    waterfall: any;
    isAdmin: any;

    constructor($route, $routeParams, $location, HUASHAN, Session, $cookies, $rootScope, $timeout) {
        this.$rootScope = $rootScope;
        this.$route = $route;
        this.$routeParams = $routeParams;
        this.$location = $location;
        this.huashan = HUASHAN;
        this.session = Session;
        this.$cookies = $cookies;
        this.$timeout = $timeout;
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
        this.show = false;
        this.server = app.server;
        this.saveAlerts = [];
        this.saveComplete = true;
        this.imageTypes = ["RANGE", "CHART"];
        this.sendBackElements = [{value: "Mean", display: "Mean"}, {
            value: "Summary[0]",
            display: "Low"
        }, {value: "Summary[1]", display: "Med"}, {
            value: "Summary[2]",
            display: "High"
        }]
        this.newAppStructureAlerts = [];
        this.excludedInputs = [];
        var that = this;
        //watch the url and giving alerts if user did not save changes
        this.$rootScope.$on("$locationChangeStart", function (event, next, current) {
            if (current.indexOf("#/appstructure/") != -1 && !that.isUnchanged()) {
                if (!confirm("You have unsaved changes in app structure, continue navigating to " + next + " ?")) {
                    event.preventDefault();
                } else {
                    that.appStructure = angular.copy(that.appStructureCopy);
                }
            }
        });
        this.getAppStructure();
        this.getPotentialTables();
        this.getCharts();
        this.tornadoValueMetricKeys = [];
        this.tornadoMetaLogKeys = [];
        let infoGot = localStorage.getItem("INFO")
        let decodedString = atob(infoGot);
        let userInfo = JSON.parse(decodedString);
        this.isAdmin = userInfo.is_admin
        // this.metalogHelpIcon = false;
        // this.failurebranchFlag = false;
    }

    saveWithCommit(commitMessage = "Save Changes!") {
        console.log("Click save!", commitMessage);
        this.saveWithoutBlank(commitMessage);
        $('#commitMessageModal').modal('hide');
    }

    getAppStructure() {
        this.huashan.GetAppStructure(this.session.getCredentials(), this.$routeParams.templateID, this.isPlatform)
            .then((response) => {
                this.appStructure = response.result;
                this.tornadoValueMetricKeys = this.gettornadoValueMetricKeys();
                this.tornadoMetaLogKeys = this.gettornadoMetaLogKeys();
                if (this.appStructure.PostProcessingOutputsForPortfolio === undefined) {
                    this.appStructure.PostProcessingOutputsForPortfolio = [];
                }
                this.postProcessing = this.appStructure.PostProcessingOutputsForPortfolio;
                //TODO: test cases to catch error
                if (this.appStructure.MENU.length > 0) {
                    this.selectMenu(this.appStructure.MENU[0]);
                }
                this.appStructureCopy = angular.copy(this.appStructure);

                //call getDataStructure() inside the callback function of getAppStructure() because the callback function of getDataStructure() uses the configured variables in the callback of getAppStructure()
                //This makes sure that all needed variables are well configured.
                this.getDataStructure();
            });
        //platform app structure needs information in product app structure
        this.huashan.GetAppStructure(this.session.getCredentials(), this.$routeParams.templateID, false)
            .then((response) => {
                var regularAppStructure = response.result;
                this.tables = _.filter(regularAppStructure.MENU, function (menu) {
                    return menu.Command === "TABLE";
                });
                console.log("tables ", this.tables);
            });

    }

    getPotentialTables() {
        this.huashan.GetPotentialTables(this.session.getCredentials(), this.$routeParams.templateID)
            .then((response) => {
                this.potentialTables = response.result.PotentialTableOutputs;
                // console.log(this.potentialTables);
            });
    }

    getCharts() {
        this.huashan.GetCharts(this.session.getCredentials(), this.$routeParams.templateID)
            .then((response) => {
                this.charts = response.result.Charts;
            });
    }

    getDataStructure() {
        this.huashan.GetIncludedDataStructureComponents(this.session.getCredentials(), this.$routeParams.templateID, this.isPlatform)
            .then((data) => {
                this.inputs = data.result.Inputs;
                this.getExcludedInputs();
                this.outputs = data.result.Outputs;
                this.allDataStructureComponents = this.inputs.concat(this.outputs);
                this.tableInputs = _.filter(this.inputs, function (input) {
                    return input.Type === "TABLE";
                });
                this.tornadoOutputs = _.filter(this.outputs, function (output) {
                    return output.UsePostProcessingOutputs === true;
                });
                this.allOutputs = this.outputs.concat(this.tornadoOutputs);
            });
    }

    getExcludedInputs() {
        var that = this;
        var inputScreens = _.filter(this.appStructure.MENU, function (menu) {
            return menu.Command === "INPUT_SCREEN";
        });
        var includedInputKeys = [];
        _.each(inputScreens, function (inputScreen) {
            _.each(inputScreen.Parameters.InputKeys, function (inputKey) {
                includedInputKeys.push(inputKey);
            })
        });
        _.each(this.inputs, function (input) {
            if (includedInputKeys.indexOf(input.Key) === -1) {
                that.excludedInputs.push(that.findKey(that.inputs)(input.Key));
            }
        });
    }

    selectMenu(menu) {
        this.selectedMenu = menu;
        // console.log(this.selectedMenu);
        var that = this;
        // Tear down any previous chart preview; the IMAGE/CHART branch re-renders below.
        if (this.imageChartInstance) {
            this.imageChartInstance.destroy();
            this.imageChartInstance = null;
        }
        if (this.selectedMenu.Command === "TABLE") {
            this.selectedPotentialTable = _.find(this.potentialTables, function (table) {
                return table.CellLink === that.selectedMenu.Parameters.CellLink;
            });
        } else if (this.selectedMenu.Command == "IMAGE" && this.selectedMenu.Parameters.Type === "RANGE") {
            this.selectedImageTable = _.find(this.potentialTables, function (table) {
                return table.CellLink === that.selectedMenu.Parameters.CellLink;
            });
        } else if (this.selectedMenu.Command === "IMAGE" && this.selectedMenu.Parameters.Type === "CHART") {
            this.selectedImageChart = _.find(this.charts, function (chart) {
                return chart.ChartName === that.selectedMenu.Parameters.CellLink;
            });
            this.renderSelectedImageChart();
        } else if (this.selectedMenu.Command === "TORNADODIST") {
            this.tornado = this.selectedMenu;
        } else if (this.selectedMenu.Command === "ADD_TABLES") {
            this.selectedTable = _.find(this.tables, function (table) {
                return table.Parameters.OutputKey === that.selectedMenu.Parameters.Key;
            });
            this.selectedPotentialTable = _.find(this.potentialTables, function (table) {
                return table.CellLink === that.selectedTable.Parameters.CellLink;
            });
            this.minPrecision = (this.selectedMenu.Parameters.PrecisionOptions === undefined || this.selectedMenu.Parameters.PrecisionOptions.length === 0) ? null : this.selectedMenu.Parameters.PrecisionOptions[0];
            this.maxPrecision = (this.selectedMenu.Parameters.PrecisionOptions === undefined || this.selectedMenu.Parameters.PrecisionOptions.length === 0) ? null : this.selectedMenu.Parameters.PrecisionOptions[this.selectedMenu.Parameters.PrecisionOptions.length - 1];
        } else if (this.selectedMenu.Command === "WATERFALL") {
            this.waterfall = this.selectedMenu.Parameters.Sets;
            let index = this.waterfall.length - 1;
            this.selectedPotentialTable = _.find(this.potentialTables, function (table) {
                return table.CellLink === that.waterfall[index].CellLink;
            });
        }
        if (this.selectedMenu.Visible === undefined) {
            this.selectedMenu.Visible = true;
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

    }

    changePrecisionOptions() {
        this.selectedMenu.Parameters.PrecisionOptions = [];
        for (var i = this.minPrecision; i <= this.maxPrecision; i++) {
            this.selectedMenu.Parameters.PrecisionOptions.push(i);
        }
    }

    scrollToActive(listName, idPre, index) {
        var scrollTo = '#' + idPre + index;
        var scrollPosition = $(scrollTo).position().top;
        $(listName).scrollTop(scrollPosition);


    }

    selectTable(table) {
        var that = this;
        this.selectedTable = table;
        this.selectedMenu.Parameters.Key = table.Parameters.OutputKey;
        this.selectedPotentialTable = _.find(this.potentialTables, function (table) {
            return table.CellLink === that.selectedTable.Parameters.CellLink;
        });

    }

    makeIDfrom(name) {
        var id = name.slice(name.indexOf("!") + 1) + name.slice(0, name.indexOf("!"));
        id = id.replace(/'/g, "");
        if (new Common().isActionIDduplicate(id, this.appStructure.MENU)) {
            var currentdate = new Date();
            var second = currentdate.getSeconds();
            return id = id + second;
        } else {
            return id
        }
    }

    selectPotentialTable(table) {
        this.selectedPotentialTable = table;
        this.selectedMenu.Parameters.CellLink = table.CellLink;
        this.selectedMenu.Parameters.OutputKey = table.CellLink.slice(table.CellLink.indexOf("!") + 1);
        this.selectedMenu.ID = this.makeIDfrom(table.CellLink);
    }

    selectImageTable(table) {
        this.selectedImageTable = table;
        this.selectedMenu.Parameters.CellLink = table.CellLink;
        this.selectedMenu.Parameters.OutputKey = table.CellLink.slice(table.CellLink.indexOf("!") + 1);
        this.selectedMenu.ID = this.makeIDfrom(table.CellLink);
    }

    selectImageChart(chart) {
        this.selectedImageChart = chart;
        this.selectedMenu.Parameters.CellLink = chart.ChartName;
        this.selectedMenu.Parameters.OutputKey = chart.ChartName.slice(chart.ChartName.indexOf("!") + 1);
        this.selectedMenu.ID = this.makeIDfrom(chart.ChartName);
        this.renderSelectedImageChart();
    }

    /**
     * Render the currently selected IMAGE/CHART preview. REST CalcEngine returns chart JSON
     * under `Chart` (no server PNG); we draw it with Highcharts client-side, mirroring the
     * Rakaposhi workbench renderer. Deferred via $timeout so the ng-if container exists.
     */
    renderSelectedImageChart() {
        var self = this;
        this.$timeout(function () {
            var el = document.getElementById("appstructure-image-chart");
            if (!el) return;
            if (self.selectedImageChart && self.selectedImageChart.Chart) {
                self.renderCalcEngineChart(el, self.selectedImageChart.Chart);
            } else if (self.imageChartInstance) {
                self.imageChartInstance.destroy();
                self.imageChartInstance = null;
            }
        }, 0);
    }

    /**
     * Map a SpreadsheetGear chart type to a Highcharts series/chart type.
     */
    mapHighchartsType(chartType) {
        var t = (chartType || "").toString().toLowerCase();
        if (t.indexOf("bar") !== -1) return "bar";
        if (t.indexOf("line") !== -1) return "line";
        if (t.indexOf("area") !== -1) return "area";
        if (t.indexOf("pie") !== -1 || t.indexOf("doughnut") !== -1) return "pie";
        if (t.indexOf("scatter") !== -1 || t.indexOf("xy") !== -1) return "scatter";
        // ColumnClustered / ColumnStacked / Column / Combination / default
        return "column";
    }

    /**
     * Build a Highcharts chart from a CalcEngine chart definition (chartType, axes,
     * legend, series[].resolvedData). Ported from Rakaposhi image.component so both apps
     * render the identical chart JSON the same way. Combination/waterfall charts render as
     * their underlying series (a known fidelity limitation shared with the workbench).
     */
    renderCalcEngineChart(containerEl, metadata) {
        var Highcharts = window["Highcharts"];
        if (!containerEl || !metadata || !Highcharts) {
            return;
        }
        if (this.imageChartInstance) {
            this.imageChartInstance.destroy();
            this.imageChartInstance = null;
        }
        var baseType = this.mapHighchartsType(metadata.chartType);
        var seriesList = _.isArray(metadata.series) ? metadata.series : [];
        var categories = (seriesList.length && seriesList[0].resolvedData && seriesList[0].resolvedData.xValues)
            ? seriesList[0].resolvedData.xValues : [];

        var axes = _.isArray(metadata.axes) ? metadata.axes : [];
        var categoryAxis = null, valueAxis = null;
        _.each(axes, function (a) {
            var at = ((a && a.axisType) || "").toString().toLowerCase();
            if (at === "category" && !categoryAxis) categoryAxis = a;
            if (at === "value" && !valueAxis) valueAxis = a;
        });

        var self = this;
        var highchartsSeries = _.map(seriesList, function (s) {
            s = s || {};
            var data = (s.resolvedData && s.resolvedData.values) ? s.resolvedData.values : [];
            var seriesObj: any = {
                name: s.name || "",
                type: self.mapHighchartsType(s.chartType || metadata.chartType),
                data: data
            };
            var hex = s.markerForegroundColor && s.markerForegroundColor.hex;
            if (hex) seriesObj.color = hex;
            return seriesObj;
        });

        var legendPosition = ((metadata.legend && metadata.legend.position) || "bottom").toString().toLowerCase();

        // Excel encodes "auto" scale as 0/0 — leave those undefined so Highcharts auto-ranges.
        var yMin = (valueAxis && !(valueAxis.minimumScale === 0 && valueAxis.maximumScale === 0)) ? valueAxis.minimumScale : undefined;
        var yMax = (valueAxis && !(valueAxis.minimumScale === 0 && valueAxis.maximumScale === 0)) ? valueAxis.maximumScale : undefined;

        var chartOptions = {
            chart: { type: baseType, renderTo: containerEl, backgroundColor: "transparent", reflow: true },
            title: { text: metadata.hasTitle ? (metadata.title || "") : "" },
            credits: { enabled: false },
            legend: {
                enabled: metadata.hasLegend !== false && highchartsSeries.length > 0,
                verticalAlign: legendPosition === "top" ? "top" : "bottom"
            },
            xAxis: { categories: categories, title: { text: (categoryAxis && categoryAxis.title) || "" } },
            yAxis: { title: { text: (valueAxis && valueAxis.title) || "" }, min: yMin, max: yMax },
            series: highchartsSeries,
            // Exporting module isn't bundled in the CMS — keep the preview lightweight.
            exporting: { enabled: false }
        };

        this.imageChartInstance = new Highcharts.Chart(chartOptions);
    }

    checkTornadoWeights() {
        var tornados = _.filter(this.appStructure.MENU, function (menu) {
            return menu.Command == "TORNADODIST";
        });
        var result = true;
        _.each(tornados, function (tornado) {
            var weights = tornado.Parameters.Weights;
            if (weights.High + weights.Med + weights.Low != 1) {
                result = false;
            }
        });
        if (!result) {
            this.addAlert(this.saveAlerts, "danger", "Weights in tornado do not add up to 1.");
        }
        return result;
    }

    ensureTornadoDepthIsNumeric() {
        if (this.tornado) {
            this.tornado.Parameters.Depth = parseInt(this.tornado.Parameters.Depth);
        }
    }

    save(message) {
        this.saveAlerts = [];
        if (!this.checkTornadoWeights()) {
            return;
        }
        this.ensureTornadoDepthIsNumeric();
        this.saveComplete = false;
        this.huashan.SaveAppStructure(
            this.session.getCredentials(),
            this.$routeParams.templateID,
            {
                "data": this.appStructure,
                "commitMessage": message
            },
            this.isPlatform).then((response) => {
            this.saveComplete = true;
            if (response.status) {
                this.appStructureCopy = angular.copy(this.appStructure);
            } else {
                this.addAlert(this.saveAlerts, 'danger', response.msg);
            }
        });
    }

    findKey(arr) {
        return function (key) {
            return _.find(arr, function (element) {
                return element.Key === key;
            });
        }
    }

    findCellLink(cellLink) {
        return _.find(this.potentialTables, function (table) {
            return table.CellLink === cellLink;
        })
    }

    addToTornado(output) {
        this.selectedMenu.Parameters.ValueMetricKeys.push(output.Key);
    }

    removeFromTornado(key) {
        this.selectedMenu.Parameters.ValueMetricKeys.splice(this.selectedMenu.Parameters.ValueMetricKeys.indexOf(key), 1);
    }

    isUnchanged() {
        return angular.equals(this.appStructure, this.appStructureCopy);
    }

    addAlert(alert, type, msg) {
        alert.push({type: type, msg: msg});
    }

    closeAlert(alert, index) {
        alert.splice(index, 1);
    }

    selectSendBackTornado(sendback, index) {
        var key = this.selectedMenu.Parameters.ValueMetricKeys[index];
        console.log("key" + key);
        var outputCellLink = this.findKey(this.outputs)(key).CellLink;
        console.log("cellLink" + outputCellLink);
        sendback.Reference = sendback.Reference.substr(0, 19) + index + sendback.Reference.substr(20);
        var sendTo = _.find(this.sendBackElements, function (ele) {
            return ele.value === sendback.Reference.substr(22);
        });
        if (sendTo != undefined) {
            sendback.Key = sendTo.display + "_" + outputCellLink.replace("!", "_");
        } else {
            sendback.Key = "Mean_" + outputCellLink.replace("!", "_");
        }
        sendback.Title = sendback.Title.slice(0, sendback.Title.indexOf("of") + 3) + outputCellLink.replace("!", "_");
    }

    selectSendBackTo(sendback, sendTo) {
        sendback.Reference = sendback.Reference.substr(0, 22) + sendTo;
        var sendToDisplay = _.find(this.sendBackElements, function (ele) {
            return ele.value === sendTo;
        }).display;
        sendback.Key = sendToDisplay + sendback.Key.slice(sendback.Key.indexOf('_'));
        sendback.Title = sendToDisplay + sendback.Title.slice(sendback.Title.indexOf(" "));
    }

    addSendBack() {
        var sendBack = {};
        sendBack.SendBack = "";
        sendBack.Reference = "TornadoDistOutputs[0].mean";
        sendBack.Key = "mean_xxxx";
        sendBack.Title = "mean of xxxx";
        this.postProcessing.push(sendBack);
    }

    //save and remove SendBack if there is blank in BackTo
    saveWithoutBlank(message: any) {
        var indexs = this.getIndexofallblank(this.postProcessing);
        this.postProcessing.splice(indexs[0], this.postProcessing.length - indexs[0]);
        this.save(message);
    }

    getIndexofallblank(postprocessing) {
        var allSendBack = postprocessing.map(function (item) {
            return item.SendBack;
        });
        var indexs = [];
        for (var i = 0; i < allSendBack.length; i++) {
            if (allSendBack[i] === "") indexs.push(i);
        }
        return indexs;
    }


    deleteSendBack(sendback) {
        this.postProcessing.splice(this.postProcessing.indexOf(sendback), 1);
    }

    selectTornado(key) {
        if (this.tornado.Parameters.ValueMetricKeys.indexOf(key) > -1) {
            this.tornado.Parameters.ValueMetricKeys.splice(
                this.tornado.Parameters.ValueMetricKeys.indexOf(key), 1);
            if (this.tornado.Parameters.MetaLogKeys.indexOf(key) > -1) {
                this.tornado.Parameters.MetaLogKeys.splice(
                    this.tornado.Parameters.MetaLogKeys.indexOf(key), 1);
            }
        } else {
            this.tornado.Parameters.ValueMetricKeys.push(key);
        }
    }

    /*
     para: key in MetaLogKeys or ValueMetricKeys
     this function will remove the selected key in MetaLogKeys or add selected key
     to MetaLogKeys
     */
    selectMetalog(key) {
        if (this.tornado.Parameters.MetaLogKeys.indexOf(key) > -1) {
            this.tornado.Parameters.MetaLogKeys.splice(
                this.tornado.Parameters.MetaLogKeys.indexOf(key), 1);
        } else {
            this.tornado.Parameters.MetaLogKeys.push(key);
        }
    }

    selectWithinMetalog(key) {
        if (this.selectedMenu.Parameters.MetaLogKeys.indexOf(key) > -1) {
            this.selectedMenu.Parameters.MetaLogKeys.splice(
                this.selectedMenu.Parameters.MetaLogKeys.indexOf(key), 1);

            //delete key from MetaLogKeys in tornado, need go through all commands
            //in appStructure.MENU, count the times the key is used, if the count
            //is 0, delete it, because the key has been deleted in selected Metalog
            var count = 0;
            for (var i = 0; i < this.appStructure.MENU.length; i++) {
                if (this.appStructure.MENU[i].Command === "METALOG_DISPLAY"
                    && this.appStructure.MENU[i].Parameters.MetaLogKeys.indexOf(key) > -1) {
                    count++;
                }
            }
            if (count === 0) {
                this.appStructure.MENU.forEach(function (arrayItem) {
                    if (arrayItem.Command === "TORNADODIST") {
                        if (arrayItem.Parameters.MetaLogKeys.indexOf(key) > -1) {
                            arrayItem.Parameters.MetaLogKeys.splice(
                                arrayItem.Parameters.MetaLogKeys.indexOf(key), 1);
                        }
                    }
                });
            }
        } else {
            this.selectedMenu.Parameters.MetaLogKeys.push(key);
            this.appStructure.MENU.forEach(function (arrayItem) {
                if (arrayItem.Command === "TORNADODIST") {
                    if (arrayItem.Parameters.MetaLogKeys.indexOf(key) === -1) {
                        arrayItem.Parameters.MetaLogKeys.push(key);
                    }
                }
            });
        }
    }

    excludeInput(key) {
        this.selectedMenu.Parameters.InputKeys.splice(this.selectedMenu.Parameters.InputKeys.indexOf(key), 1);
        if (this.excludedInputs.indexOf(this.findKey(this.inputs)(key)) === -1) {
            this.excludedInputs.push(this.findKey(this.inputs)(key));
        }
    }

    includeInput(input) {
        this.excludedInputs.splice(this.excludedInputs.indexOf(input), 1);
        this.selectedMenu.Parameters.InputKeys.push(input.Key);
    }

    selectTableInput(key) {
        this.selectedMenu.Parameters.InputKey = key;
    }

    deleteAppStructure() {
        this.appStructure.MENU.splice(this.appStructure.MENU.indexOf(this.selectedMenu), 1);
        if (this.selectedMenu.Command === "TORNADODIST" &&
            _.find(this.appStructure.MENU, function (menu) {
                return menu.Command == "TORNADODIST";
            }) === undefined) {
            this.appStructure.PostProcessingOutputsForPortfolio = [];
            this.postProcessing = this.appStructure.PostProcessingOutputsForPortfolio;
            this.tornado = {};
        }
        //remove MetaLogKeys when we delete Metalog in Appstructure
        if (this.selectedMenu.Command === "METALOG_DISPLAY") {
            // this.appStructure.MENU.forEach(function (arrayItem) {
            //     if (arrayItem.Command === "TORNADODIST") {
            //         delete arrayItem.Parameters.MetaLogKeys;
            //     }
            // });
            const toRemove = new Set(this.selectedMenu.Parameters.MetaLogKeys);
            for (const item of this.appStructure.MENU) {
                if (item.Command == "METALOG_DISPLAY") {
                    for (const key of item.Parameters.MetaLogKeys)
                        toRemove.delete(key);
                    if (toRemove.size == 0)
                        break;
                }
            }
            if (toRemove.size > 0) {
                this.appStructure.MENU.forEach(function (arrayItem) {
                    if (arrayItem.Command === "TORNADODIST") {
                        arrayItem.Parameters.MetaLogKeys = arrayItem.Parameters.MetaLogKeys.filter(k => !toRemove.has(k));
                    }
                })
            }
        }
        if (!this.isUnchanged()) {
            this.save("Delete " + this.selectedMenu.Display);
        }
        this.selectedMenu = this.appStructure.MENU[0];
        $('#deleteAppStructureModal').modal('hide');
    }

    addCompareValueItem() {
        var length = this.selectedMenu.Parameters.Keys.length;
        this.selectedMenu.Parameters.Keys[length] = "";
        this.selectedMenu.Parameters.Units[length] = "";
        this.selectedMenu.Parameters.Titles[length] = "";
    }

    deleteCompareValueItem(index) {
        this.selectedMenu.Parameters.Keys.splice(index, 1);
        this.selectedMenu.Parameters.Units.splice(index, 1);
        this.selectedMenu.Parameters.Titles.splice(index, 1);
    }

    addMetalogDisplayItem() {
        var length = this.selectedMenu.Parameters.MetaLogKeys.length;
        this.selectedMenu.Parameters.MetaLogKeys[length] = "";
    }

    deleteMetalogDisplayItem(index) {
        this.selectedMenu.Parameters.MetaLogKeys.splice(index, 1);
    }

    addFailurebranch() {
        //check if this metalog has failurebranch or not, if not, add failurebranch object,
        //if has, add one more set in stage array
        // this.failurebranchFlag = true;
        if (!this.selectedMenu.Parameters.FailureBranch) {
            var failurebranch: FailureBranch = {
                Stages: [{
                    NodeLookup: "Outputs",
                    ProbabilityKey: "",
                    SubtractionValueKey: ""
                }],
                SubtractCostGivenSuccess: true
            }
            this.selectedMenu.Parameters["FailureBranch"] = failurebranch;
        } else {
            var stage: Stage = {
                NodeLookup: "Outputs",
                ProbabilityKey: "",
                SubtractionValueKey: ""
            }
            this.selectedMenu.Parameters.FailureBranch.Stages.push(stage);
        }
    }

    deleteFailurebranchStage(index) {
        //remove one stage from Stages in FailureBranch, if there is no Stage in
        //Failurebranch Stages, remove Failurebranch from Parameter
        if (this.selectedMenu.Parameters.FailureBranch.Stages.length > 1) {
            this.selectedMenu.Parameters.FailureBranch.Stages.splice(index, 1);
        } else {
            this.selectedMenu.Parameters.FailureBranch.Stages.splice(index, 1);
            // this.failurebranchFlag = false;
            delete this.selectedMenu.Parameters["FailureBranch"];
        }
    }

    addNewAppStructure(display, command) {
        this.makeNewAppStructureAndAddIt(display, command);
        $('#newAppStructureModal').modal('hide'); // REPLACE -- NOT GOOD PRACTICE TO PUT IN JQUERY HARD CODINGS LIKE THIS
    }

    makeNewAppStructureAndAddIt(display, command) {
        this.newAppStructureAlerts = [];
        if (!this.checkDisplay(display)) {
            return;
        }
        if (!this.checkCommand(command)) {
            return;
        }
        if (command === "TORNADODIST" && !this.checkUniqueTornado()) {
            return;
        }
        var newAppStructure: AppStructureElement = {};
        newAppStructure.Command = command;
        newAppStructure.Display = display;
        newAppStructure.ID = new Common().makeActionIDfrom(display, this.appStructure.MENU);
        newAppStructure.UsePostProcessingOutputs = false;
        newAppStructure.Visible = true;
        // newAppStructure.FitToScreen;
        var param = this.buildParams(command);
        newAppStructure.Parameters = param;
        this.appStructure.MENU.push(newAppStructure);
        this.selectMenu(newAppStructure);
    }

    //add MetaLogKeys to tornado when we first time create a metalog command in
    //appstructure
    addMetalogkeystoTornado() {
        this.appStructure.MENU.forEach(function (arrayItem) {
            if (arrayItem.Command === "TORNADODIST" && !arrayItem.Parameters.MetaLogKeys) {
                arrayItem.Parameters.MetaLogKeys = [];
            }
        });
    }

    gettornadoValueMetricKeys() {
        var temp = [];
        this.appStructure.MENU.forEach(function (arrayItem) {
            if (arrayItem.Command === "TORNADODIST") {
                temp = arrayItem.Parameters.ValueMetricKeys;
            }
        });
        return temp;
    }

    gettornadoMetaLogKeys() {
        var temp = [];
        this.appStructure.MENU.forEach(function (arrayItem) {
            if (arrayItem.Command === "TORNADODIST") {
                temp = arrayItem.Parameters.MetaLogKeys;
            }
        });
        return temp;
    }

    //get output from key, this function is for enable all portfolio project
    //structure actions in platform app structure
    getOutputDisplayFromKey(key) {
        var output = _.find(this.outputs, function (output) {
            return output.Key === key;
        });
        if (output != undefined) {
            return output.Display;
        } else {
            output = _.find(this.tornadoOutputs, function (output) {
                return output.Key === key;
            });
            return output.Title;
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

    buildOutputFromKey(key) {
        return "Outputs['" + key + "']";
    }

    deleteCFOChartItem(index) {
        this.selectedMenu.Parameters.Sets.splice(index, 1);
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

    deleteScatterPlotItem(index) {
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

    private checkDisplay(display) {
        if (display === undefined) {
            this.addAlert(this.newAppStructureAlerts, "danger", "please type in the name of the new app structure!");
            return false;
        } else {
            return true;
        }
    }

    private checkCommand(command) {
        if (command === undefined) {
            this.addAlert(this.newAppStructureAlerts, "danger", "please choose a command of the new app structure!");
            return false;
        } else {
            return true;
        }
    }

    private checkUniqueTornado() {
        var tornado = _.find(this.appStructure.MENU, function (menu) {
            return menu.Command == "TORNADODIST";
        });
        if (tornado != undefined) {
            this.addAlert(this.newAppStructureAlerts, "danger", "You already have a tornado in app structure.");
            return false;
        } else {
            return true;
        }
    }

    private buildParams(command) {
        switch (command) {
            case "INPUT_SCREEN":
                var param: InputScreen = {};
                param.InputKeys = [];
                break;
            case "IMAGE":
                var param: Image = {};
                param.CellLink = "";
                param.OutputKey = "";
                param.Type = "RANGE";
                param.FitToScreen = true;
                break;
            case "TABLE":
                var param: Table = {};
                param.CellLink = "";
                param.OutputKey = "";
                param.Pnl = true;
                break;
            case "TABLE_INPUT":
                var param: TableInput = {};
                param.InputKey = "";
                break;
            case "TORNADODIST":
                var param: Tornado = {};
                param.ChartTitle = "";
                param.CombinedUncertaintyLabel = "";
                param.Depth = 2;
                param.ValueMetricKeys = [];
                param.Weights = {High: 0.25, Med: 0.5, Low: 0.25};
                break;
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
            case "METALOG_DISPLAY":
                var param: MetalogDisplay = {};
                param.MetaLogKeys = [];
                this.addMetalogkeystoTornado();
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
            case "CFO_CHART":
                var param: CFOChart = {};
                param.Sets = [{
                    AverageCost: "",
                    xTitle: "",
                    AverageValueMinusCost: "",
                    yTitle: "",
                    name: "CFOChart1"
                }];
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
            case "WATERFALL":
                var param: WaterfallParam = {};
                param.Sets = [{
                    CellLink: "",
                    Units: "",
                    OutputKey: "",
                    name: "",
                    yTitle: "",
                }];
                break;
            default:
                var param = {};
        }
        return param;

    }

    openNew() {
        $('#new-display').val('');
        $('#new-command-project').val('');
        $('#new-command-platform').val('');
        $('#newAppStructureModal').on("shown.bs.modal", function () {
            $('#new-display').focus();

        });
    }

    rename() {
        this.save();
        $('#editAppStructureModal').modal('hide');
    }

    insertParamsToWaterfallTables(table) {
        let index = this.waterfall.length - 1;
        this.waterfall[index].CellLink = table.CellLink;
        this.waterfall[index].OutputKey = table.CellLink.slice(table.CellLink.indexOf("!") + 1);
        this.selectedPotentialTable = table;
        this.selectedMenu.Parameters.CellLink = this.waterfall[0].CellLink;
        this.selectedMenu.Parameters.OutputKey = this.waterfall[0].OutputKey;
    }

    addNewParamsToWaterfall(){
        this.selectedPotentialTable = undefined;
        let param_set = {
            CellLink: "",
            Units: "",
            OutputKey: "",
            name: "",
            yTitle: "",
        };
        this.waterfall.push(param_set);
    }

    deleteTableInWaterfall(index) {
        if (this.waterfall.length == 1) {
            this.selectedPotentialTable = undefined;
        }
        else if (this.waterfall.length == (index + 1)) {
            let cell_link = this.waterfall[index-1].CellLink;
            this.selectedPotentialTable = _.find(this.potentialTables, function (table) {
                return table.CellLink === cell_link;
            });
        }
        this.waterfall.splice(index,1);
    }
}

interface AppStructureElement {
    Command: string
    Display: string
    ID: string
    Parameters: any
    UsePostProcessingOutputs: boolean
    Visible: boolean
}

interface InputScreen {
    InputKeys: Array<string>
}

interface Image {
    CellLink: string
    OutputKey: string
    Type: string
    FitToScreen: boolean
}

interface Table {
    CellLink: string
    OutputKey: string
}

interface TableInput {
    InputKey: string
}

interface Tornado {
    ChartTitle: string
    CombinedUncertaintyLabel: string
    Depth: number
    ValueMetricKeys: Array<string>
    Weights: { High: number; Low: number; Med: number; }
}

interface AddTables {
    Key: string
    NodeLookup: string
    PnL: boolean
    PrecisionOptions: Array<number>
    DefaultPrecision: number
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

interface MetalogDisplay {
    MetaLogKeys: Array<string>
    FailureBranch: FailureBranch
}

interface FailureBranch {
    Stages: Array<Stage>
    SubtractCostGivenSuccess: boolean
}

interface Stage {
    NodeLookup: string,
    ProbabilityKey: any,
    SubtractionValueKey: any
}

//below are copied interfaces and class from portfolioStructureController.ts
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

interface WaterfallParam {
    Sets: Array<{
        Units: string;
        OutputKey: string;
        name: string;
        yTitle: string;
    }>;
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