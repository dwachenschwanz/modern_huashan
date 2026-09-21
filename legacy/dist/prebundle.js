var saveBolb = function() {
    var a = document.createElement("a");
    a.style.cssText = "display: none !important";
    document.body.appendChild(a);
    return function(blob, fileName) {
        var url = window.URL.createObjectURL(blob.data);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    };
}();

var AdminController = function() {
    function AdminController($location, HUASHAN, Session, $cookies, SERVER, $http) {
        var _this = this;
        this.selectedFilterCount = function() {
            return this.selectedfilterGroups.length;
        };
        this.filterBySelectedGroups = function(template) {
            if (_this.selectedfilterGroups.length === 0) {
                return true;
            } else {
                return _this.selectedfilterGroups.some(function(groupName) {
                    return template.groups.some(function(group) {
                        return group.groupname === groupName;
                    });
                });
            }
        };
        this.$http = $http;
        this.$location = $location;
        this.huashan = HUASHAN;
        this.baseUrl = SERVER.url;
        this.allGroup = "ALL";
        this.administrators = "administrators";
        this.activeTab = "allTemplates";
        this.groups = [ {
            _id: 1,
            groupname: this.allGroup
        } ];
        this.sort = {
            column: "name",
            descending: false
        };
        this.resetSelectedFilter();
        this.session = Session;
        this.$cookies = $cookies;
        this.myInterval = 3e3;
        this.slides = [];
        if (this.session.getCredentials() || this.$cookies["huashansession"]) {
            this.session.create(this.$cookies["huashansession"]);
        } else {
            this.$location.path("/login");
        }
        this.selectedTemplate = "Not Selected";
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
    AdminController.prototype.changeSorting = function(column) {
        var sort = this.sort;
        if (sort.column === column) {
            sort.descending = !sort.descending;
        } else {
            sort.column = column;
            sort.descending = false;
        }
    };
    AdminController.prototype.getTemplates = function() {
        var _this = this;
        this.huashan.GetTemplates(this.session.getCredentials()).then(function(response) {
            if (response.status) {
                _this.templates = response.result;
                _this.selectedTemplate = "Not Selected";
            } else {
                alert("Templates not found! Reasons: " + response.msg);
            }
        });
    };
    AdminController.prototype.getAstroTemplates = function() {
        var _this = this;
        this.loadingTable = true;
        this.huashan.GetAstroTemplates(this.session.getCredentials()).then(function(response) {
            if (response.status) {
                _this.astroTemplates = response.result;
                _this.loadingTable = false;
            } else {
                _this.alertMsg.msg = "Templates not found";
                $("#infoMsgAlert").fadeIn("fast").delay(3e3).fadeOut("fast");
                _this.loadingTable = false;
            }
        });
    };
    AdminController.prototype.getArchivedAstroTemplates = function() {
        var _this = this;
        this.archivedAstroTemplates = [];
        this.loadingTable = true;
        this.huashan.GetArchivedAstroTemplates(this.session.getCredentials()).then(function(response) {
            if (response.status) {
                console.log(response.result);
                _this.archivedAstroTemplates = response.result;
                _this.loadingTable = false;
            } else {
                _this.alertMsg.msg = "Archived templates not found";
                $("#infoMsgAlert").fadeIn("fast").delay(3e3).fadeOut("fast");
                _this.loadingTable = false;
            }
        });
    };
    AdminController.prototype.getGroups = function() {
        var _this = this;
        this.$http.get(this.baseUrl + "/framework/admin/group/list", {
            headers: {
                Authorization: "jwttoken " + localStorage.getItem("JWT-TOKEN")
            }
        }).then(function(response) {
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
        })["catch"](function(err) {
            console.error(err);
            _this.alertMsg.type = "danger";
            _this.alertMsg.msg = "(SESSION EXPIRED) Data retrieval failed due to: " + (err.data ? err.data.message : err);
            $("#errorMsgAlert").fadeIn("fast").delay(3e3).fadeOut("fast");
            _this.$location.path("/login");
        });
    };
    AdminController.prototype.selectTemplate = function(template) {
        this.selectedTemplate = angular.copy(template);
        this.prepareGroupsForSorting();
        this.showEditModal = true;
    };
    AdminController.prototype.deleteTemplate = function(template) {
        this.selectedTemplate = angular.copy(template);
        this.showDeleteModal = true;
    };
    AdminController.prototype.unarchiveTemplate = function(template) {
        this.selectedTemplate = angular.copy(template);
        this.showUnarchiveModal = true;
    };
    AdminController.prototype.editAstroTemplate = function() {
        var _this = this;
        var that = this;
        this.loading = true;
        this.$http.put(this.baseUrl + "/domain/astro-templates", this.selectedTemplate, {
            headers: {
                Authorization: "jwttoken " + localStorage.getItem("JWT-TOKEN")
            }
        }).then(function(response) {
            if (response.data.token) {
                localStorage.setItem("JWT-TOKEN", response.data.token);
            }
            if (response.data.data.status == 0) {
                that.alertMsg.msg = response.data.data.message;
                $("#successMsgAlert").fadeIn("fast").delay(2e3).fadeOut("fast");
            } else {
                that.alertMsg.msg = response.data.data.message;
                $("#infoMsgAlert").fadeIn("fast").delay(3e3).fadeOut("fast");
            }
            that.closeEditModal();
            that.astroTemplates = [];
            that.getAstroTemplates();
            that.loading = false;
        })["catch"](function(err) {
            console.error(err);
            _this.alertMsg.msg = "Template Update failed due to: " + (err.data ? err.data.message : err);
            $("#errorMsgAlert").fadeIn("fast").delay(3e3).fadeOut("fast");
            _this.loading = false;
        });
    };
    AdminController.prototype.deleteAstroTemplate = function() {
        var _this = this;
        var that = this;
        this.loading = true;
        this.huashan.DeleteTemplate(this.session.getCredentials(), this.selectedTemplate["name"]).then(function(response) {
            if (response.status) {
                that.alertMsg.msg = response.result;
                $("#successMsgAlert").fadeIn("fast").delay(2e3).fadeOut("fast");
                that.closeDeleteModal();
                that.astroTemplates = [];
                that.getAstroTemplates();
                that.loading = false;
            } else {
                _this.alertMsg.msg = "Template archive failed due to: " + response.msg;
                $("#errorMsgAlert").fadeIn("fast").delay(3e3).fadeOut("fast");
                _this.loading = false;
            }
        });
    };
    AdminController.prototype.unarchiveAstroTemplate = function() {
        var _this = this;
        var that = this;
        this.loading = true;
        this.huashan.UndeleteTemplate(this.session.getCredentials(), this.selectedTemplate["name"]).then(function(response) {
            if (response.status) {
                that.alertMsg.msg = response.result;
                $("#successMsgAlert").fadeIn("fast").delay(2e3).fadeOut("fast");
                that.closeUnarchiveModal();
                that.astroTemplates = [];
                that.switchTab("allTemplates");
                that.archivedAstroTemplates = [];
                that.getAstroTemplates();
                that.loading = false;
            } else {
                _this.alertMsg.msg = "Template unarchive failed due to: " + response.msg;
                $("#errorMsgAlert").fadeIn("fast").delay(3e3).fadeOut("fast");
                _this.loading = false;
            }
        });
    };
    AdminController.prototype.closeEditModal = function() {
        this.showEditModal = false;
    };
    AdminController.prototype.closeDeleteModal = function() {
        this.showDeleteModal = false;
    };
    AdminController.prototype.closeUnarchiveModal = function() {
        this.showUnarchiveModal = false;
    };
    AdminController.prototype.selectDeleted = function(deleted) {
        this.selectedDeletedTemplate = deleted;
    };
    AdminController.prototype["delete"] = function() {
        var _this = this;
        this.deleteAlerts = [];
        this.huashan.DeleteTemplate(this.session.getCredentials(), this.selectedTemplate).then(function(response) {
            console.log("In DeleteTemplate(): " + response.status);
            if (response.status) {
                _this.hideDeleteModal();
                _this.getTemplates();
            } else {
                _this.addAlert(_this.deleteAlerts, "danger", response.msg);
                console.log(_this.deleteAlerts);
            }
        });
    };
    AdminController.prototype.isGroupSelected = function(group) {
        return this.selectedTemplate.groups.some(function(selectedGroup) {
            return selectedGroup._id === group._id || group.groupname === "administrators";
        });
    };
    AdminController.prototype.groupComparator = function(group) {
        return this.isGroupSelected(group) ? 0 : 1;
    };
    AdminController.prototype.prepareGroupsForSorting = function() {
        var that = this;
        this.groups.forEach(function(group) {
            group.sortOrder = that.isGroupSelected(group) ? 0 : 1;
        });
    };
    AdminController.prototype.toggleGroupSelection = function(group) {
        var index = this.selectedTemplate.groups.findIndex(function(selectedGroup) {
            return selectedGroup._id === group._id;
        });
        if (index === -1) {
            this.selectedTemplate.groups.push({
                _id: group._id,
                groupname: group.groupname
            });
        } else {
            this.selectedTemplate.groups.splice(index, 1);
        }
        this.prepareGroupsForSorting();
    };
    AdminController.prototype.switchTab = function(tab) {
        this.activeTab = tab;
        this.searchText = "";
        this.resetFilter();
        if (tab == "archive") {
            this.getArchivedAstroTemplates();
            this.sort = {
                column: "name",
                descending: false
            };
        }
    };
    AdminController.prototype.resetSelectedFilter = function() {
        this.selectedfilterGroups = [];
    };
    AdminController.prototype.resetFilter = function() {
        this.filterGroups = angular.copy(this.groups);
        this.resetSelectedFilter();
    };
    AdminController.prototype.hideDeleteModal = function() {
        $("#deleteModal").modal("hide");
    };
    AdminController.prototype.addAlert = function(alert, type, msg) {
        alert.push({
            type: type,
            msg: msg
        });
    };
    AdminController.prototype.closeAlert = function(alert, index) {
        alert.splice(index, 1);
    };
    AdminController.prototype.toggleDropdown = function() {
        this.showFilterDropdown = !this.showFilterDropdown;
    };
    AdminController.prototype.applyFilter = function() {
        var that = this;
        this.resetSelectedFilter();
        this.filterGroups.forEach(function(group) {
            if (group.checked) {
                that.selectedfilterGroups.push(group.groupname);
            }
        });
    };
    return AdminController;
}();

var AppStructureController = function() {
    function AppStructureController($route, $routeParams, $location, HUASHAN, Session, $cookies, $rootScope, $timeout) {
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
        this.imageTypes = [ "RANGE", "CHART" ];
        this.sendBackElements = [ {
            value: "Mean",
            display: "Mean"
        }, {
            value: "Summary[0]",
            display: "Low"
        }, {
            value: "Summary[1]",
            display: "Med"
        }, {
            value: "Summary[2]",
            display: "High"
        } ];
        this.newAppStructureAlerts = [];
        this.excludedInputs = [];
        var that = this;
        this.$rootScope.$on("$locationChangeStart", function(event, next, current) {
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
        var infoGot = localStorage.getItem("INFO");
        var decodedString = atob(infoGot);
        var userInfo = JSON.parse(decodedString);
        this.isAdmin = userInfo.is_admin;
    }
    AppStructureController.prototype.saveWithCommit = function(commitMessage) {
        if (commitMessage === void 0) {
            commitMessage = "Save Changes!";
        }
        console.log("Click save!", commitMessage);
        this.saveWithoutBlank(commitMessage);
        $("#commitMessageModal").modal("hide");
    };
    AppStructureController.prototype.getAppStructure = function() {
        var _this = this;
        this.huashan.GetAppStructure(this.session.getCredentials(), this.$routeParams.templateID, this.isPlatform).then(function(response) {
            _this.appStructure = response.result;
            _this.tornadoValueMetricKeys = _this.gettornadoValueMetricKeys();
            _this.tornadoMetaLogKeys = _this.gettornadoMetaLogKeys();
            if (_this.appStructure.PostProcessingOutputsForPortfolio === undefined) {
                _this.appStructure.PostProcessingOutputsForPortfolio = [];
            }
            _this.postProcessing = _this.appStructure.PostProcessingOutputsForPortfolio;
            if (_this.appStructure.MENU.length > 0) {
                _this.selectMenu(_this.appStructure.MENU[0]);
            }
            _this.appStructureCopy = angular.copy(_this.appStructure);
            _this.getDataStructure();
        });
        this.huashan.GetAppStructure(this.session.getCredentials(), this.$routeParams.templateID, false).then(function(response) {
            var regularAppStructure = response.result;
            _this.tables = _.filter(regularAppStructure.MENU, function(menu) {
                return menu.Command === "TABLE";
            });
            console.log("tables ", _this.tables);
        });
    };
    AppStructureController.prototype.getPotentialTables = function() {
        var _this = this;
        this.huashan.GetPotentialTables(this.session.getCredentials(), this.$routeParams.templateID).then(function(response) {
            _this.potentialTables = response.result.PotentialTableOutputs;
        });
    };
    AppStructureController.prototype.getCharts = function() {
        var _this = this;
        this.huashan.GetCharts(this.session.getCredentials(), this.$routeParams.templateID).then(function(response) {
            _this.charts = response.result.Charts;
        });
    };
    AppStructureController.prototype.getDataStructure = function() {
        var _this = this;
        this.huashan.GetIncludedDataStructureComponents(this.session.getCredentials(), this.$routeParams.templateID, this.isPlatform).then(function(data) {
            _this.inputs = data.result.Inputs;
            _this.getExcludedInputs();
            _this.outputs = data.result.Outputs;
            _this.allDataStructureComponents = _this.inputs.concat(_this.outputs);
            _this.tableInputs = _.filter(_this.inputs, function(input) {
                return input.Type === "TABLE";
            });
            _this.tornadoOutputs = _.filter(_this.outputs, function(output) {
                return output.UsePostProcessingOutputs === true;
            });
            _this.allOutputs = _this.outputs.concat(_this.tornadoOutputs);
        });
    };
    AppStructureController.prototype.getExcludedInputs = function() {
        var that = this;
        var inputScreens = _.filter(this.appStructure.MENU, function(menu) {
            return menu.Command === "INPUT_SCREEN";
        });
        var includedInputKeys = [];
        _.each(inputScreens, function(inputScreen) {
            _.each(inputScreen.Parameters.InputKeys, function(inputKey) {
                includedInputKeys.push(inputKey);
            });
        });
        _.each(this.inputs, function(input) {
            if (includedInputKeys.indexOf(input.Key) === -1) {
                that.excludedInputs.push(that.findKey(that.inputs)(input.Key));
            }
        });
    };
    AppStructureController.prototype.selectMenu = function(menu) {
        this.selectedMenu = menu;
        var that = this;
        if (this.imageChartInstance) {
            this.imageChartInstance.destroy();
            this.imageChartInstance = null;
        }
        if (this.selectedMenu.Command === "TABLE") {
            this.selectedPotentialTable = _.find(this.potentialTables, function(table) {
                return table.CellLink === that.selectedMenu.Parameters.CellLink;
            });
        } else if (this.selectedMenu.Command == "IMAGE" && this.selectedMenu.Parameters.Type === "RANGE") {
            this.selectedImageTable = _.find(this.potentialTables, function(table) {
                return table.CellLink === that.selectedMenu.Parameters.CellLink;
            });
        } else if (this.selectedMenu.Command === "IMAGE" && this.selectedMenu.Parameters.Type === "CHART") {
            this.selectedImageChart = _.find(this.charts, function(chart) {
                return chart.ChartName === that.selectedMenu.Parameters.CellLink;
            });
            this.renderSelectedImageChart();
        } else if (this.selectedMenu.Command === "TORNADODIST") {
            this.tornado = this.selectedMenu;
        } else if (this.selectedMenu.Command === "ADD_TABLES") {
            this.selectedTable = _.find(this.tables, function(table) {
                return table.Parameters.OutputKey === that.selectedMenu.Parameters.Key;
            });
            this.selectedPotentialTable = _.find(this.potentialTables, function(table) {
                return table.CellLink === that.selectedTable.Parameters.CellLink;
            });
            this.minPrecision = this.selectedMenu.Parameters.PrecisionOptions === undefined || this.selectedMenu.Parameters.PrecisionOptions.length === 0 ? null : this.selectedMenu.Parameters.PrecisionOptions[0];
            this.maxPrecision = this.selectedMenu.Parameters.PrecisionOptions === undefined || this.selectedMenu.Parameters.PrecisionOptions.length === 0 ? null : this.selectedMenu.Parameters.PrecisionOptions[this.selectedMenu.Parameters.PrecisionOptions.length - 1];
        } else if (this.selectedMenu.Command === "WATERFALL") {
            this.waterfall = this.selectedMenu.Parameters.Sets;
            var index_1 = this.waterfall.length - 1;
            this.selectedPotentialTable = _.find(this.potentialTables, function(table) {
                return table.CellLink === that.waterfall[index_1].CellLink;
            });
        }
        if (this.selectedMenu.Visible === undefined) {
            this.selectedMenu.Visible = true;
        }
        if (this.selectedMenu.Command === "BUCKET_CHART") {
            this.bucketLow = "";
            this.bucketHigh = "";
            this.numBuckets = "";
            var sets = this.selectedMenu.Parameters.Sets;
            this.bucketManagers = [];
            for (var s in sets) {
                this.bucketManagers.push(new BucketManager(sets[s].xBuckets));
            }
        }
    };
    AppStructureController.prototype.changePrecisionOptions = function() {
        this.selectedMenu.Parameters.PrecisionOptions = [];
        for (var i = this.minPrecision; i <= this.maxPrecision; i++) {
            this.selectedMenu.Parameters.PrecisionOptions.push(i);
        }
    };
    AppStructureController.prototype.scrollToActive = function(listName, idPre, index) {
        var scrollTo = "#" + idPre + index;
        var scrollPosition = $(scrollTo).position().top;
        $(listName).scrollTop(scrollPosition);
    };
    AppStructureController.prototype.selectTable = function(table) {
        var that = this;
        this.selectedTable = table;
        this.selectedMenu.Parameters.Key = table.Parameters.OutputKey;
        this.selectedPotentialTable = _.find(this.potentialTables, function(table) {
            return table.CellLink === that.selectedTable.Parameters.CellLink;
        });
    };
    AppStructureController.prototype.makeIDfrom = function(name) {
        var id = name.slice(name.indexOf("!") + 1) + name.slice(0, name.indexOf("!"));
        id = id.replace(/'/g, "");
        if (new Common().isActionIDduplicate(id, this.appStructure.MENU)) {
            var currentdate = new Date();
            var second = currentdate.getSeconds();
            return id = id + second;
        } else {
            return id;
        }
    };
    AppStructureController.prototype.selectPotentialTable = function(table) {
        this.selectedPotentialTable = table;
        this.selectedMenu.Parameters.CellLink = table.CellLink;
        this.selectedMenu.Parameters.OutputKey = table.CellLink.slice(table.CellLink.indexOf("!") + 1);
        this.selectedMenu.ID = this.makeIDfrom(table.CellLink);
    };
    AppStructureController.prototype.selectImageTable = function(table) {
        this.selectedImageTable = table;
        this.selectedMenu.Parameters.CellLink = table.CellLink;
        this.selectedMenu.Parameters.OutputKey = table.CellLink.slice(table.CellLink.indexOf("!") + 1);
        this.selectedMenu.ID = this.makeIDfrom(table.CellLink);
    };
    AppStructureController.prototype.selectImageChart = function(chart) {
        this.selectedImageChart = chart;
        this.selectedMenu.Parameters.CellLink = chart.ChartName;
        this.selectedMenu.Parameters.OutputKey = chart.ChartName.slice(chart.ChartName.indexOf("!") + 1);
        this.selectedMenu.ID = this.makeIDfrom(chart.ChartName);
        this.renderSelectedImageChart();
    };
    AppStructureController.prototype.renderSelectedImageChart = function() {
        var self = this;
        this.$timeout(function() {
            var el = document.getElementById("appstructure-image-chart");
            if (!el) return;
            if (self.selectedImageChart && self.selectedImageChart.Chart) {
                self.renderCalcEngineChart(el, self.selectedImageChart.Chart);
            } else if (self.imageChartInstance) {
                self.imageChartInstance.destroy();
                self.imageChartInstance = null;
            }
        }, 0);
    };
    AppStructureController.prototype.mapHighchartsType = function(chartType) {
        var t = (chartType || "").toString().toLowerCase();
        if (t.indexOf("bar") !== -1) return "bar";
        if (t.indexOf("line") !== -1) return "line";
        if (t.indexOf("area") !== -1) return "area";
        if (t.indexOf("pie") !== -1 || t.indexOf("doughnut") !== -1) return "pie";
        if (t.indexOf("scatter") !== -1 || t.indexOf("xy") !== -1) return "scatter";
        return "column";
    };
    AppStructureController.prototype.renderCalcEngineChart = function(containerEl, metadata) {
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
        var categories = seriesList.length && seriesList[0].resolvedData && seriesList[0].resolvedData.xValues ? seriesList[0].resolvedData.xValues : [];
        var axes = _.isArray(metadata.axes) ? metadata.axes : [];
        var categoryAxis = null, valueAxis = null;
        _.each(axes, function(a) {
            var at = (a && a.axisType || "").toString().toLowerCase();
            if (at === "category" && !categoryAxis) categoryAxis = a;
            if (at === "value" && !valueAxis) valueAxis = a;
        });
        var self = this;
        var highchartsSeries = _.map(seriesList, function(s) {
            s = s || {};
            var data = s.resolvedData && s.resolvedData.values ? s.resolvedData.values : [];
            var seriesObj = {
                name: s.name || "",
                type: self.mapHighchartsType(s.chartType || metadata.chartType),
                data: data
            };
            var hex = s.markerForegroundColor && s.markerForegroundColor.hex;
            if (hex) seriesObj.color = hex;
            return seriesObj;
        });
        var legendPosition = (metadata.legend && metadata.legend.position || "bottom").toString().toLowerCase();
        var yMin = valueAxis && !(valueAxis.minimumScale === 0 && valueAxis.maximumScale === 0) ? valueAxis.minimumScale : undefined;
        var yMax = valueAxis && !(valueAxis.minimumScale === 0 && valueAxis.maximumScale === 0) ? valueAxis.maximumScale : undefined;
        var chartOptions = {
            chart: {
                type: baseType,
                renderTo: containerEl,
                backgroundColor: "transparent",
                reflow: true
            },
            title: {
                text: metadata.hasTitle ? metadata.title || "" : ""
            },
            credits: {
                enabled: false
            },
            legend: {
                enabled: metadata.hasLegend !== false && highchartsSeries.length > 0,
                verticalAlign: legendPosition === "top" ? "top" : "bottom"
            },
            xAxis: {
                categories: categories,
                title: {
                    text: categoryAxis && categoryAxis.title || ""
                }
            },
            yAxis: {
                title: {
                    text: valueAxis && valueAxis.title || ""
                },
                min: yMin,
                max: yMax
            },
            series: highchartsSeries,
            exporting: {
                enabled: false
            }
        };
        this.imageChartInstance = new Highcharts.Chart(chartOptions);
    };
    AppStructureController.prototype.checkTornadoWeights = function() {
        var tornados = _.filter(this.appStructure.MENU, function(menu) {
            return menu.Command == "TORNADODIST";
        });
        var result = true;
        _.each(tornados, function(tornado) {
            var weights = tornado.Parameters.Weights;
            if (weights.High + weights.Med + weights.Low != 1) {
                result = false;
            }
        });
        if (!result) {
            this.addAlert(this.saveAlerts, "danger", "Weights in tornado do not add up to 1.");
        }
        return result;
    };
    AppStructureController.prototype.ensureTornadoDepthIsNumeric = function() {
        if (this.tornado) {
            this.tornado.Parameters.Depth = parseInt(this.tornado.Parameters.Depth);
        }
    };
    AppStructureController.prototype.save = function(message) {
        var _this = this;
        this.saveAlerts = [];
        if (!this.checkTornadoWeights()) {
            return;
        }
        this.ensureTornadoDepthIsNumeric();
        this.saveComplete = false;
        this.huashan.SaveAppStructure(this.session.getCredentials(), this.$routeParams.templateID, {
            data: this.appStructure,
            commitMessage: message
        }, this.isPlatform).then(function(response) {
            _this.saveComplete = true;
            if (response.status) {
                _this.appStructureCopy = angular.copy(_this.appStructure);
            } else {
                _this.addAlert(_this.saveAlerts, "danger", response.msg);
            }
        });
    };
    AppStructureController.prototype.findKey = function(arr) {
        return function(key) {
            return _.find(arr, function(element) {
                return element.Key === key;
            });
        };
    };
    AppStructureController.prototype.findCellLink = function(cellLink) {
        return _.find(this.potentialTables, function(table) {
            return table.CellLink === cellLink;
        });
    };
    AppStructureController.prototype.addToTornado = function(output) {
        this.selectedMenu.Parameters.ValueMetricKeys.push(output.Key);
    };
    AppStructureController.prototype.removeFromTornado = function(key) {
        this.selectedMenu.Parameters.ValueMetricKeys.splice(this.selectedMenu.Parameters.ValueMetricKeys.indexOf(key), 1);
    };
    AppStructureController.prototype.isUnchanged = function() {
        return angular.equals(this.appStructure, this.appStructureCopy);
    };
    AppStructureController.prototype.addAlert = function(alert, type, msg) {
        alert.push({
            type: type,
            msg: msg
        });
    };
    AppStructureController.prototype.closeAlert = function(alert, index) {
        alert.splice(index, 1);
    };
    AppStructureController.prototype.selectSendBackTornado = function(sendback, index) {
        var key = this.selectedMenu.Parameters.ValueMetricKeys[index];
        console.log("key" + key);
        var outputCellLink = this.findKey(this.outputs)(key).CellLink;
        console.log("cellLink" + outputCellLink);
        sendback.Reference = sendback.Reference.substr(0, 19) + index + sendback.Reference.substr(20);
        var sendTo = _.find(this.sendBackElements, function(ele) {
            return ele.value === sendback.Reference.substr(22);
        });
        if (sendTo != undefined) {
            sendback.Key = sendTo.display + "_" + outputCellLink.replace("!", "_");
        } else {
            sendback.Key = "Mean_" + outputCellLink.replace("!", "_");
        }
        sendback.Title = sendback.Title.slice(0, sendback.Title.indexOf("of") + 3) + outputCellLink.replace("!", "_");
    };
    AppStructureController.prototype.selectSendBackTo = function(sendback, sendTo) {
        sendback.Reference = sendback.Reference.substr(0, 22) + sendTo;
        var sendToDisplay = _.find(this.sendBackElements, function(ele) {
            return ele.value === sendTo;
        }).display;
        sendback.Key = sendToDisplay + sendback.Key.slice(sendback.Key.indexOf("_"));
        sendback.Title = sendToDisplay + sendback.Title.slice(sendback.Title.indexOf(" "));
    };
    AppStructureController.prototype.addSendBack = function() {
        var sendBack = {};
        sendBack.SendBack = "";
        sendBack.Reference = "TornadoDistOutputs[0].mean";
        sendBack.Key = "mean_xxxx";
        sendBack.Title = "mean of xxxx";
        this.postProcessing.push(sendBack);
    };
    AppStructureController.prototype.saveWithoutBlank = function(message) {
        var indexs = this.getIndexofallblank(this.postProcessing);
        this.postProcessing.splice(indexs[0], this.postProcessing.length - indexs[0]);
        this.save(message);
    };
    AppStructureController.prototype.getIndexofallblank = function(postprocessing) {
        var allSendBack = postprocessing.map(function(item) {
            return item.SendBack;
        });
        var indexs = [];
        for (var i = 0; i < allSendBack.length; i++) {
            if (allSendBack[i] === "") indexs.push(i);
        }
        return indexs;
    };
    AppStructureController.prototype.deleteSendBack = function(sendback) {
        this.postProcessing.splice(this.postProcessing.indexOf(sendback), 1);
    };
    AppStructureController.prototype.selectTornado = function(key) {
        if (this.tornado.Parameters.ValueMetricKeys.indexOf(key) > -1) {
            this.tornado.Parameters.ValueMetricKeys.splice(this.tornado.Parameters.ValueMetricKeys.indexOf(key), 1);
            if (this.tornado.Parameters.MetaLogKeys.indexOf(key) > -1) {
                this.tornado.Parameters.MetaLogKeys.splice(this.tornado.Parameters.MetaLogKeys.indexOf(key), 1);
            }
        } else {
            this.tornado.Parameters.ValueMetricKeys.push(key);
        }
    };
    AppStructureController.prototype.selectMetalog = function(key) {
        if (this.tornado.Parameters.MetaLogKeys.indexOf(key) > -1) {
            this.tornado.Parameters.MetaLogKeys.splice(this.tornado.Parameters.MetaLogKeys.indexOf(key), 1);
        } else {
            this.tornado.Parameters.MetaLogKeys.push(key);
        }
    };
    AppStructureController.prototype.selectWithinMetalog = function(key) {
        if (this.selectedMenu.Parameters.MetaLogKeys.indexOf(key) > -1) {
            this.selectedMenu.Parameters.MetaLogKeys.splice(this.selectedMenu.Parameters.MetaLogKeys.indexOf(key), 1);
            var count = 0;
            for (var i = 0; i < this.appStructure.MENU.length; i++) {
                if (this.appStructure.MENU[i].Command === "METALOG_DISPLAY" && this.appStructure.MENU[i].Parameters.MetaLogKeys.indexOf(key) > -1) {
                    count++;
                }
            }
            if (count === 0) {
                this.appStructure.MENU.forEach(function(arrayItem) {
                    if (arrayItem.Command === "TORNADODIST") {
                        if (arrayItem.Parameters.MetaLogKeys.indexOf(key) > -1) {
                            arrayItem.Parameters.MetaLogKeys.splice(arrayItem.Parameters.MetaLogKeys.indexOf(key), 1);
                        }
                    }
                });
            }
        } else {
            this.selectedMenu.Parameters.MetaLogKeys.push(key);
            this.appStructure.MENU.forEach(function(arrayItem) {
                if (arrayItem.Command === "TORNADODIST") {
                    if (arrayItem.Parameters.MetaLogKeys.indexOf(key) === -1) {
                        arrayItem.Parameters.MetaLogKeys.push(key);
                    }
                }
            });
        }
    };
    AppStructureController.prototype.excludeInput = function(key) {
        this.selectedMenu.Parameters.InputKeys.splice(this.selectedMenu.Parameters.InputKeys.indexOf(key), 1);
        if (this.excludedInputs.indexOf(this.findKey(this.inputs)(key)) === -1) {
            this.excludedInputs.push(this.findKey(this.inputs)(key));
        }
    };
    AppStructureController.prototype.includeInput = function(input) {
        this.excludedInputs.splice(this.excludedInputs.indexOf(input), 1);
        this.selectedMenu.Parameters.InputKeys.push(input.Key);
    };
    AppStructureController.prototype.selectTableInput = function(key) {
        this.selectedMenu.Parameters.InputKey = key;
    };
    AppStructureController.prototype.deleteAppStructure = function() {
        this.appStructure.MENU.splice(this.appStructure.MENU.indexOf(this.selectedMenu), 1);
        if (this.selectedMenu.Command === "TORNADODIST" && _.find(this.appStructure.MENU, function(menu) {
            return menu.Command == "TORNADODIST";
        }) === undefined) {
            this.appStructure.PostProcessingOutputsForPortfolio = [];
            this.postProcessing = this.appStructure.PostProcessingOutputsForPortfolio;
            this.tornado = {};
        }
        if (this.selectedMenu.Command === "METALOG_DISPLAY") {
            var toRemove_1 = new Set(this.selectedMenu.Parameters.MetaLogKeys);
            for (var _i = 0, _a = this.appStructure.MENU; _i < _a.length; _i++) {
                var item = _a[_i];
                if (item.Command == "METALOG_DISPLAY") {
                    for (var _b = 0, _c = item.Parameters.MetaLogKeys; _b < _c.length; _b++) {
                        var key = _c[_b];
                        toRemove_1["delete"](key);
                    }
                    if (toRemove_1.size == 0) break;
                }
            }
            if (toRemove_1.size > 0) {
                this.appStructure.MENU.forEach(function(arrayItem) {
                    if (arrayItem.Command === "TORNADODIST") {
                        arrayItem.Parameters.MetaLogKeys = arrayItem.Parameters.MetaLogKeys.filter(function(k) {
                            return !toRemove_1.has(k);
                        });
                    }
                });
            }
        }
        if (!this.isUnchanged()) {
            this.save("Delete " + this.selectedMenu.Display);
        }
        this.selectedMenu = this.appStructure.MENU[0];
        $("#deleteAppStructureModal").modal("hide");
    };
    AppStructureController.prototype.addCompareValueItem = function() {
        var length = this.selectedMenu.Parameters.Keys.length;
        this.selectedMenu.Parameters.Keys[length] = "";
        this.selectedMenu.Parameters.Units[length] = "";
        this.selectedMenu.Parameters.Titles[length] = "";
    };
    AppStructureController.prototype.deleteCompareValueItem = function(index) {
        this.selectedMenu.Parameters.Keys.splice(index, 1);
        this.selectedMenu.Parameters.Units.splice(index, 1);
        this.selectedMenu.Parameters.Titles.splice(index, 1);
    };
    AppStructureController.prototype.addMetalogDisplayItem = function() {
        var length = this.selectedMenu.Parameters.MetaLogKeys.length;
        this.selectedMenu.Parameters.MetaLogKeys[length] = "";
    };
    AppStructureController.prototype.deleteMetalogDisplayItem = function(index) {
        this.selectedMenu.Parameters.MetaLogKeys.splice(index, 1);
    };
    AppStructureController.prototype.addFailurebranch = function() {
        if (!this.selectedMenu.Parameters.FailureBranch) {
            var failurebranch = {
                Stages: [ {
                    NodeLookup: "Outputs",
                    ProbabilityKey: "",
                    SubtractionValueKey: ""
                } ],
                SubtractCostGivenSuccess: true
            };
            this.selectedMenu.Parameters["FailureBranch"] = failurebranch;
        } else {
            var stage = {
                NodeLookup: "Outputs",
                ProbabilityKey: "",
                SubtractionValueKey: ""
            };
            this.selectedMenu.Parameters.FailureBranch.Stages.push(stage);
        }
    };
    AppStructureController.prototype.deleteFailurebranchStage = function(index) {
        if (this.selectedMenu.Parameters.FailureBranch.Stages.length > 1) {
            this.selectedMenu.Parameters.FailureBranch.Stages.splice(index, 1);
        } else {
            this.selectedMenu.Parameters.FailureBranch.Stages.splice(index, 1);
            delete this.selectedMenu.Parameters["FailureBranch"];
        }
    };
    AppStructureController.prototype.addNewAppStructure = function(display, command) {
        this.makeNewAppStructureAndAddIt(display, command);
        $("#newAppStructureModal").modal("hide");
    };
    AppStructureController.prototype.makeNewAppStructureAndAddIt = function(display, command) {
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
        var newAppStructure = {};
        newAppStructure.Command = command;
        newAppStructure.Display = display;
        newAppStructure.ID = new Common().makeActionIDfrom(display, this.appStructure.MENU);
        newAppStructure.UsePostProcessingOutputs = false;
        newAppStructure.Visible = true;
        var param = this.buildParams(command);
        newAppStructure.Parameters = param;
        this.appStructure.MENU.push(newAppStructure);
        this.selectMenu(newAppStructure);
    };
    AppStructureController.prototype.addMetalogkeystoTornado = function() {
        this.appStructure.MENU.forEach(function(arrayItem) {
            if (arrayItem.Command === "TORNADODIST" && !arrayItem.Parameters.MetaLogKeys) {
                arrayItem.Parameters.MetaLogKeys = [];
            }
        });
    };
    AppStructureController.prototype.gettornadoValueMetricKeys = function() {
        var temp = [];
        this.appStructure.MENU.forEach(function(arrayItem) {
            if (arrayItem.Command === "TORNADODIST") {
                temp = arrayItem.Parameters.ValueMetricKeys;
            }
        });
        return temp;
    };
    AppStructureController.prototype.gettornadoMetaLogKeys = function() {
        var temp = [];
        this.appStructure.MENU.forEach(function(arrayItem) {
            if (arrayItem.Command === "TORNADODIST") {
                temp = arrayItem.Parameters.MetaLogKeys;
            }
        });
        return temp;
    };
    AppStructureController.prototype.getOutputDisplayFromKey = function(key) {
        var output = _.find(this.outputs, function(output) {
            return output.Key === key;
        });
        if (output != undefined) {
            return output.Display;
        } else {
            output = _.find(this.tornadoOutputs, function(output) {
                return output.Key === key;
            });
            return output.Title;
        }
    };
    AppStructureController.prototype.getKeyFrom = function(axis) {
        if (axis === "" || axis === undefined) {
            return "";
        }
        var startIndex = axis.indexOf("'");
        var result = axis.slice(startIndex + 1);
        var endIndex = result.indexOf("'");
        return result.slice(0, endIndex);
    };
    AppStructureController.prototype.buildOutputFromKey = function(key) {
        return "Outputs['" + key + "']";
    };
    AppStructureController.prototype.deleteCFOChartItem = function(index) {
        this.selectedMenu.Parameters.Sets.splice(index, 1);
    };
    AppStructureController.prototype.addCFOChartItem = function() {
        var cfoChartItem = {
            AverageCost: "",
            xTitle: "",
            AverageValueMinusCost: "",
            yTitle: "",
            name: "CFOChart" + (this.selectedMenu.Parameters.Sets.length + 1).toString()
        };
        this.selectedMenu.Parameters.Sets.push(cfoChartItem);
    };
    AppStructureController.prototype.addInnovationScreenItem = function() {
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
    AppStructureController.prototype.deleteInnovationScreenItem = function(index) {
        this.selectedMenu.Parameters.Sets.splice(index, 1);
    };
    AppStructureController.prototype.deleteScatterPlotItem = function(index) {
        this.selectedMenu.Parameters.Sets.splice(index, 1);
    };
    AppStructureController.prototype.addScatterPlotItem = function() {
        var scatterPlotItem = {
            x: "",
            y: "",
            xTitle: "",
            yTitle: "",
            name: ""
        };
        this.selectedMenu.Parameters.Sets.push(scatterPlotItem);
    };
    AppStructureController.prototype.generateBuckets = function(setIndex) {
        this.numBucketsClone = this.numBuckets;
        var delta = (parseInt(this.bucketHigh) - parseInt(this.bucketLow)) / this.numBuckets;
        for (var i = 0; i < this.numBuckets; i++) {
            var lower = (parseInt(this.bucketLow) + i * delta).toFixed(2);
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
    AppStructureController.prototype.toggleNameEdit = function(bucket, setIndex) {
        if (bucket.nameEditable === true) {
            this.selectedMenu.Parameters.Sets[setIndex].xBuckets = this.bucketManagers[setIndex].buckets();
        }
        bucket.nameEditable = !bucket.nameEditable;
    };
    AppStructureController.prototype.toggleRuleEdit = function(bucket, setIndex) {
        if (bucket.rulesEditable === true) {
            this.selectedMenu.Parameters.Sets[setIndex].xBuckets = this.bucketManagers[setIndex].buckets();
        }
        bucket.rulesEditable = !bucket.rulesEditable;
    };
    AppStructureController.prototype.addBucketChartSet = function() {
        this.selectedMenu.Parameters.Sets.push(this.emptyBucketSet());
        this.numBucketsClone = null;
        console.log("Added Bucket chart", this.selectedMenu.Parameters.Sets);
    };
    AppStructureController.prototype.addBucket = function(setIndex) {
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
    AppStructureController.prototype.deleteBucket = function(setIndex) {
        if (this.bucketManagers[setIndex].editableBuckets.length > 0) {
            this.bucketManagers[setIndex].editableBuckets.splice(this.bucketManagers[setIndex].editableBuckets.length - 1, 1);
        } else {}
        this.selectedMenu.Parameters.Sets[setIndex].xBuckets = this.bucketManagers[setIndex].buckets();
    };
    AppStructureController.prototype.deleteBucketSet = function(setIndex) {
        this.selectedMenu.Parameters.Sets.splice(setIndex, 1);
        this.bucketManagers.splice(setIndex, 1);
        this.numBucketsClone = 0;
    };
    AppStructureController.prototype.emptyBucketSet = function() {
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
    AppStructureController.prototype.checkDisplay = function(display) {
        if (display === undefined) {
            this.addAlert(this.newAppStructureAlerts, "danger", "please type in the name of the new app structure!");
            return false;
        } else {
            return true;
        }
    };
    AppStructureController.prototype.checkCommand = function(command) {
        if (command === undefined) {
            this.addAlert(this.newAppStructureAlerts, "danger", "please choose a command of the new app structure!");
            return false;
        } else {
            return true;
        }
    };
    AppStructureController.prototype.checkUniqueTornado = function() {
        var tornado = _.find(this.appStructure.MENU, function(menu) {
            return menu.Command == "TORNADODIST";
        });
        if (tornado != undefined) {
            this.addAlert(this.newAppStructureAlerts, "danger", "You already have a tornado in app structure.");
            return false;
        } else {
            return true;
        }
    };
    AppStructureController.prototype.buildParams = function(command) {
        switch (command) {
          case "INPUT_SCREEN":
            var param = {};
            param.InputKeys = [];
            break;

          case "IMAGE":
            var param = {};
            param.CellLink = "";
            param.OutputKey = "";
            param.Type = "RANGE";
            param.FitToScreen = true;
            break;

          case "TABLE":
            var param = {};
            param.CellLink = "";
            param.OutputKey = "";
            param.Pnl = true;
            break;

          case "TABLE_INPUT":
            var param = {};
            param.InputKey = "";
            break;

          case "TORNADODIST":
            var param = {};
            param.ChartTitle = "";
            param.CombinedUncertaintyLabel = "";
            param.Depth = 2;
            param.ValueMetricKeys = [];
            param.Weights = {
                High: .25,
                Med: .5,
                Low: .25
            };
            break;

          case "ADD_TABLES":
            var param = {};
            param.Key = this.tables[0].Parameters.OutputKey;
            param.NodeLookup = "Outputs";
            param.PnL = false;
            param.PrecisionOptions = [ 0, 1, 2 ];
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

          case "METALOG_DISPLAY":
            var param = {};
            param.MetaLogKeys = [];
            this.addMetalogkeystoTornado();
            break;

          case "COMPARE_UNCERTAINTY":
            var param = {};
            param.Keys = [ "Key", "Summary", "Mean", "Display", "Units" ];
            param.NodeLookup = "TornadoDistOutputs";
            break;

          case "CFO_CHART":
            var param = {};
            param.Sets = [ {
                AverageCost: "",
                xTitle: "",
                AverageValueMinusCost: "",
                yTitle: "",
                name: "CFOChart1"
            } ];
            break;

          case "INNOVATION_SCREEN":
            var param = {};
            param.Sets = [ {
                x: "",
                xTitle: "",
                y: "",
                yTitle: "",
                VerticalCutoff: null,
                name: "Innovation Screen1"
            } ];
            break;

          case "SCATTER_PLOT":
            var param = {};
            param.Sets = [ {
                x: "",
                y: "",
                xTitle: "",
                yTitle: ""
            } ];
            param.SameScale = false;
            param.Min = null;
            param.Max = null;
            break;

          case "BUCKET_CHART":
            var param = {};
            param.Sets = [];
            break;

          case "WATERFALL":
            var param = {};
            param.Sets = [ {
                CellLink: "",
                Units: "",
                OutputKey: "",
                name: "",
                yTitle: ""
            } ];
            break;

          default:
            var param = {};
        }
        return param;
    };
    AppStructureController.prototype.openNew = function() {
        $("#new-display").val("");
        $("#new-command-project").val("");
        $("#new-command-platform").val("");
        $("#newAppStructureModal").on("shown.bs.modal", function() {
            $("#new-display").focus();
        });
    };
    AppStructureController.prototype.rename = function() {
        this.save();
        $("#editAppStructureModal").modal("hide");
    };
    AppStructureController.prototype.insertParamsToWaterfallTables = function(table) {
        var index = this.waterfall.length - 1;
        this.waterfall[index].CellLink = table.CellLink;
        this.waterfall[index].OutputKey = table.CellLink.slice(table.CellLink.indexOf("!") + 1);
        this.selectedPotentialTable = table;
        this.selectedMenu.Parameters.CellLink = this.waterfall[0].CellLink;
        this.selectedMenu.Parameters.OutputKey = this.waterfall[0].OutputKey;
    };
    AppStructureController.prototype.addNewParamsToWaterfall = function() {
        this.selectedPotentialTable = undefined;
        var param_set = {
            CellLink: "",
            Units: "",
            OutputKey: "",
            name: "",
            yTitle: ""
        };
        this.waterfall.push(param_set);
    };
    AppStructureController.prototype.deleteTableInWaterfall = function(index) {
        if (this.waterfall.length == 1) {
            this.selectedPotentialTable = undefined;
        } else if (this.waterfall.length == index + 1) {
            var cell_link_1 = this.waterfall[index - 1].CellLink;
            this.selectedPotentialTable = _.find(this.potentialTables, function(table) {
                return table.CellLink === cell_link_1;
            });
        }
        this.waterfall.splice(index, 1);
    };
    return AppStructureController;
}();

var BucketManager = function() {
    function BucketManager(buckets) {
        this.rule1Options = this.makeRule1Options();
        this.rule2Options = this.makeRule2Options();
        this.editableBuckets = this.editableBucketsFrom(buckets);
        this.editing = false;
    }
    BucketManager.prototype.editableBucketsFrom = function(buckets) {
        var _this = this;
        var answer = new Array();
        buckets.forEach(function(bucket) {
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
    BucketManager.prototype.rule1From = function(bucket) {
        return bucket.GT ? this.rule1Options[1] : bucket.GE ? this.rule1Options[2] : this.rule1Options[0];
    };
    BucketManager.prototype.rule2From = function(bucket) {
        return bucket.LT ? this.rule2Options[1] : bucket.LE ? this.rule2Options[2] : this.rule2Options[0];
    };
    BucketManager.prototype.buckets = function() {
        var answer = new Array();
        this.editableBuckets.forEach(function(bucket) {
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
    BucketManager.prototype.makeRule1Options = function() {
        return [ {
            Label: "",
            Value: "NONE"
        }, {
            Label: ">",
            Value: "GT"
        }, {
            Label: ">=",
            Value: "GE"
        } ];
    };
    BucketManager.prototype.makeRule2Options = function() {
        return [ {
            Label: "",
            Value: "NONE"
        }, {
            Label: "<",
            Value: "LT"
        }, {
            Label: "<=",
            Value: "LE"
        } ];
    };
    BucketManager.prototype.makeEditable = function() {
        this.editing = true;
    };
    BucketManager.prototype.stopEditing = function() {
        this.editing = false;
    };
    return BucketManager;
}();

var smartorg;

(function(smartorg) {
    var wizard;
    (function(wizard) {
        var ArrayFunctions = function() {
            function ArrayFunctions() {}
            ArrayFunctions.moveItem = function(array, index, step) {
                this.swap(array, index, index + step);
            };
            ArrayFunctions.moveItemLeftByOne = function(array, index) {
                if (index > 0 && index < array.length) {
                    ArrayFunctions.moveItem(array, index, -1);
                    return true;
                } else {
                    return false;
                }
            };
            ArrayFunctions.moveItemRightByOne = function(array, index) {
                if (index < array.length - 1 && index > -1) {
                    ArrayFunctions.moveItem(array, index, 1);
                    return true;
                } else {
                    return false;
                }
            };
            ArrayFunctions.swap = function(array, index1, index2) {
                var temp;
                if (array && array.length > 1 && index1 >= 0 && index1 < array.length && index2 >= 0 && index2 < array.length) {
                    temp = array[index1];
                    array[index1] = array[index2];
                    array[index2] = temp;
                    return true;
                } else {
                    return false;
                }
            };
            return ArrayFunctions;
        }();
        wizard.ArrayFunctions = ArrayFunctions;
    })(wizard = smartorg.wizard || (smartorg.wizard = {}));
})(smartorg || (smartorg = {}));

var DataStructureController = function() {
    function DataStructureController($route, $routeParams, $location, HUASHAN, Session, $cookies, $rootScope, config, $scope, $timeout, $sce) {
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
        this.$rootScope.$on("$locationChangeStart", function(event, next, current) {
            if (current.indexOf("#/datastructure/") != -1 && !that.isUnchanged()) {
                if (!confirm("You have unsaved changes in data structure, continue navigating to " + next + " ?")) {
                    event.preventDefault();
                } else {
                    that.includedComponents = angular.copy(that.includedComponentsCopy);
                }
            }
        });
        var infoGot = localStorage.getItem("INFO");
        var decodedString = atob(infoGot);
        var userInfo = JSON.parse(decodedString);
        this.isAdmin = userInfo.is_admin;
    }
    DataStructureController.prototype.getIncludedDataStructureComponents = function() {
        var _this = this;
        this.huashan.GetIncludedDataStructureComponents(this.session.getCredentials(), this.$routeParams.templateID, this.isPlatform).then(function(data) {
            _this.data = data;
            _this.includedComponents = data.result;
            _this.includedComponentsCopy = angular.copy(_this.includedComponents);
            _this.getPotentialTableInputs();
        });
    };
    DataStructureController.prototype.getExcludedDataStructureComponents = function() {
        var _this = this;
        this.huashan.GetExcludedDataStructureComponents(this.session.getCredentials(), this.$routeParams.templateID, this.isPlatform).then(function(data) {
            _this.showLoading = false;
            _this.excludedComponents = data.result.Excluded;
            _this.buildPotentialTableLists();
        });
    };
    DataStructureController.prototype.getPotentialTableInputs = function() {
        var that = this;
        this.smartorg.wizard.fetchPotentialTableInputs(this.$routeParams.templateID).then(function(ptInputs) {
            that.potentialTableInputs = ptInputs.data && ptInputs.data.PotentialTableInputs || [];
            that.buildPotentialTableLists();
        })["catch"]();
    };
    DataStructureController.prototype.buildPotentialTableLists = function() {
        if (this.potentialTableListsBuilt) {
            return;
        }
        if (!this.includedComponents || !this.excludedComponents || !this.potentialTableInputs) {
            return;
        }
        this.potentialTableListsBuilt = true;
        this.includedPotentialTableInputs = [];
        this.getExcludedPotentialTableInputs(this.potentialTableInputs, this.includedPotentialTableInputs);
    };
    DataStructureController.prototype.getExcludedPotentialTableInputs = function(pTIs, includedPotentialTableInputs) {
        this.includedComponents.Inputs.forEach(function(item) {
            pTIs.forEach(function(ptItem, index) {
                if (ptItem.CellLink === item.CellLink) {
                    includedPotentialTableInputs.push(ptItem);
                    pTIs.splice(index, 1);
                }
            });
        });
        this.excludedComponents.Inputs.forEach(function(item) {
            pTIs.forEach(function(ptItem, index) {
                if (ptItem.CellLink === item.CellLink) {
                    includedPotentialTableInputs.push(ptItem);
                    pTIs.splice(index, 1);
                }
            });
        });
        this.excludedPotentialTableInputs = this.potentialTableInputs;
    };
    DataStructureController.prototype.includePotentialTableInput = function(ptInput) {
        this.verifyKey(ptInput);
        var standardptInput = {
            Description: "",
            Val: [],
            Constraint: "double",
            CellLink: ptInput.CellLink,
            Key: ptInput.Key,
            Inherited: false,
            Units: "",
            Type: "TABLE",
            Display: ""
        };
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
    };
    DataStructureController.prototype.excludePotentialTableInput = function(ptInput) {
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
    };
    DataStructureController.prototype.select = function(ptInput) {
        var celllinkName = ptInput.CellLink;
        this.selectedCelllink = celllinkName;
        var that = this;
        this.includedPotentialTableInputs.forEach(function(item) {
            if (item.CellLink === that.selectedCelllink) {
                that.selected = item;
                that.setPreview(item);
                that.$timeout();
            }
        });
    };
    DataStructureController.prototype.selectedChooseFrom = function(ptInput) {
        var celllinkName = ptInput.CellLink;
        this.selectedCelllink = celllinkName;
        this.selected = ptInput;
        this.setPreview(ptInput);
    };
    DataStructureController.prototype.getIndexOfptinputFromInput = function(index) {
        return this.includedComponents.Inputs.map(function(e) {
            return e.CellLink;
        }).indexOf(this.includedPotentialTableInputs[index].CellLink);
    };
    DataStructureController.prototype.showImage = function(index) {
        this.setPreview(this.includedPotentialTableInputs[index]);
    };
    DataStructureController.prototype.showImageTest = function(ptInput) {
        this.setPreview(ptInput);
    };
    DataStructureController.prototype.hideImage = function(index) {
        this.setPreview(null);
    };
    DataStructureController.prototype.setPreview = function(ptInput) {
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
    };
    DataStructureController.prototype.setCurrentPreview = function(input) {
        this.currentPreview = input;
    };
    DataStructureController.prototype.includeInput = function(input) {
        this.verifyKey(input);
        this.includedComponents.Inputs.push(input);
        var index = this.excludedComponents.Inputs.indexOf(input);
        this.excludedComponents.Inputs.splice(index, 1);
    };
    DataStructureController.prototype.verifyKey = function(element) {
        if (element.Key == undefined) {
            element.Key = element.CellLink.substring(element.CellLink.indexOf("!") + 1);
        }
    };
    DataStructureController.prototype.excludeInput = function(input) {
        this.excludedComponents.Inputs.push(input);
        var index = this.includedComponents.Inputs.indexOf(input);
        this.includedComponents.Inputs.splice(index, 1);
    };
    DataStructureController.prototype.includeOutput = function(output) {
        this.verifyKey(output);
        this.includedComponents.Outputs.push(output);
        var index = this.excludedComponents.Outputs.indexOf(output);
        this.excludedComponents.Outputs.splice(index, 1);
    };
    DataStructureController.prototype.excludeOutput = function(output) {
        this.excludedComponents.Outputs.push(output);
        var index = this.includedComponents.Outputs.indexOf(output);
        this.includedComponents.Outputs.splice(index, 1);
    };
    DataStructureController.prototype.saveWithCommit = function(commitMessage) {
        if (commitMessage === void 0) {
            commitMessage = "Save Changes!";
        }
        console.log("Click save!", commitMessage);
        this.save(commitMessage);
        $("#commitMessageModal").modal("hide");
    };
    DataStructureController.prototype.save = function(message) {
        var _this = this;
        this.saveComplete = false;
        this.alerts = [];
        this.saveErrorMessage = "";
        this.huashan.SaveDataStructure(this.session.getCredentials(), this.$routeParams.templateID, {
            data: this.createDataToSubmit(),
            commitMessage: message
        }, this.isPlatform).then(function(response) {
            _this.saveComplete = true;
            if (response.status === false) {
                _this.saveErrorMessage = response.msg;
                _this.addAlert(_this.saveErrorMessage);
            } else {
                _this.includedComponentsCopy = angular.copy(_this.includedComponents);
            }
        });
    };
    DataStructureController.prototype.initDataEdit = function(val) {
        if (!val || typeof val === "object") {
            val = "Jan 1990";
        }
        var temp = val.split(" ");
        return {
            month: temp[0],
            year: temp[1]
        };
    };
    DataStructureController.prototype.updateFormat = function(val, month, year) {
        if (!val) {
            val = "Jan 1990";
        }
        var temp = val.split(" ");
        if (!month) {
            month = temp[0];
        }
        if (!year) {
            year = temp[1];
        }
        val = month + " " + year;
        return val;
    };
    DataStructureController.prototype.addAlert = function(msg) {
        this.alerts.push({
            type: "danger",
            msg: msg
        });
    };
    DataStructureController.prototype.closeAlert = function(index) {
        this.alerts.splice(index, 1);
    };
    DataStructureController.prototype.createDataToSubmit = function() {
        var dataToSubmit = {};
        dataToSubmit.ID = this.data.result.ID;
        dataToSubmit.Description = this.data.result.Description;
        dataToSubmit.ExcelFile = this.data.result.ExcelFile;
        dataToSubmit.Inputs = this.includedComponents.Inputs;
        dataToSubmit.Outputs = this.includedComponents.Outputs;
        return dataToSubmit;
    };
    DataStructureController.prototype.isUnchanged = function() {
        return angular.equals(this.includedComponents, this.includedComponentsCopy);
    };
    DataStructureController.prototype.changeType = function(input) {
        switch (input.Type) {
          case "TABLE":
            input.Val = "";
            break;

          case "DISTRIBUTION":
            input.Val = [ 0, 0, 0 ];
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
    };
    return DataStructureController;
}();

var JsonController = function() {
    function JsonController($route, $routeParams, $location, HUASHAN, Session, $cookies, $rootScope) {
        this.$rootScope = $rootScope;
        this.$route = $route;
        this.$routeParams = $routeParams;
        this.$location = $location;
        this.huashan = HUASHAN;
        this.session = Session;
        this.$cookies = $cookies;
        if (this.session.getCredentials() || this.$cookies.huashansession) {
            this.session.create(this.$cookies.huashansession);
        } else {
            this.$location.path("/login");
        }
        this.saveComplete = true;
        this.alerts = [];
        this.getTemplateJsonFiles();
        var that = this;
        this.$rootScope.$on("$locationChangeStart", function(event, next, current) {
            if (current.indexOf("#/json/") != -1 && !that.isUnchanged()) {
                if (!confirm("You have unsaved changes in json, continue navigating to " + next + " ?")) {
                    event.preventDefault();
                } else {
                    that.data = angular.copy(that.dataCopy);
                }
            }
        });
        var infoGot = localStorage.getItem("INFO");
        var decodedString = atob(infoGot);
        var userInfo = JSON.parse(decodedString);
        this.isAdmin = userInfo.is_admin;
    }
    JsonController.prototype.getTemplateJsonFiles = function() {
        var _this = this;
        this.huashan.GetTemplateJsonFiles(this.session.getCredentials(), this.$routeParams.templateID).then(function(response) {
            _this.selectedTemplate = _this.$routeParams.templateID;
            var jsonFiles = response.result;
            _this.setData(jsonFiles);
        });
    };
    JsonController.prototype.setData = function(jsonFiles) {
        var data = {};
        data.name = this.selectedTemplate;
        data.hasPlatform = jsonFiles.appStructure.Platform;
        data.dataStructure = stringify(jsonFiles.dataStructure);
        data.appStructure = stringify(jsonFiles.appStructure);
        data.portfolioStructure = stringify(jsonFiles.portfolioStructure);
        data.platformDataStructure = stringify(jsonFiles.platformDataStructure);
        data.platformAppStructure = stringify(jsonFiles.platformAppStructure);
        data.platformPortfolioStructure = stringify(jsonFiles.platformPortfolioStructure);
        this.data = data;
        this.dataCopy = angular.copy(this.data);
    };
    JsonController.prototype.saveWithCommit = function(commitMessage) {
        if (commitMessage === void 0) {
            commitMessage = "Save Changes!";
        }
        console.log("Click save!", commitMessage);
        this.save(commitMessage);
        $("#commitMessageModal").modal("hide");
    };
    JsonController.prototype.save = function(message) {
        var _this = this;
        this.alerts = [];
        if (!this.validateJSON()) {
            return;
        }
        this.saveComplete = false;
        this.saveErrorMessage = "";
        this.huashan.SaveTemplateJsonFiles(this.session.getCredentials(), this.data.name, {
            data: this.createDataToSubmit(),
            commitMessage: message
        }).then(function(response) {
            _this.saveComplete = true;
            if (response.status === false) {
                _this.saveErrorMessage = response.msg;
                _this.addAlert(_this.saveErrorMessage);
            } else {
                _this.dataCopy = angular.copy(_this.data);
            }
        });
    };
    JsonController.prototype.validateJSON = function() {
        for (var structure in this.data) {
            if (structure != "name" && structure != "hasPlatform" && !this.isJSON(structure, this.data[structure])) {
                return false;
            }
        }
        return true;
    };
    JsonController.prototype.createDataToSubmit = function() {
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
    JsonController.prototype.closeJSON = function() {
        this.$location.path("selectTemplate");
    };
    JsonController.prototype.addAlert = function(msg) {
        this.alerts.push({
            type: "danger",
            msg: msg
        });
    };
    JsonController.prototype.closeAlert = function(index) {
        this.alerts.splice(index, 1);
    };
    JsonController.prototype.isUnchanged = function() {
        return angular.equals(this.data, this.dataCopy);
    };
    JsonController.prototype.isJSON = function(structureName, jsonStr) {
        try {
            JSON.parse(jsonStr);
        } catch (e) {
            this.addAlert("Illegal JSON object in " + structureName + ". " + e.message + ".");
            return false;
        }
        return true;
    };
    JsonController.prototype.platformExists = function() {
        return this.data !== undefined && this.data.platformDataStructure !== undefined && this.data.platformDataStructure.indexOf("Does not exist") === -1;
    };
    JsonController.prototype.addPlatformStubs = function() {
        var excelFileExtention = JSON.parse(this.data.dataStructure).ExcelFile.split(".").pop();
        this.data.platformDataStructure = stringify({
            Outputs: [],
            Inputs: [],
            ID: this.data.name,
            ExcelFile: this.data.name + "_template." + excelFileExtention,
            Description: ""
        });
        this.data.platformAppStructure = stringify({
            ID: this.data.name,
            MENU: [],
            PostProcessingOutputsForPortfolio: []
        });
        this.data.platformPortfolioStructure = stringify({
            MENU: []
        });
        var tempAppStructure = JSON.parse(this.data.appStructure);
        tempAppStructure["Platform"] = true;
        this.data.appStructure = stringify(tempAppStructure);
    };
    return JsonController;
}();

function stringify(jsonObject) {
    return JSON.stringify(jsonObject, undefined, 4);
}

var LoginController = function() {
    function LoginController($scope, $location, autoAuthService, HUASHAN, Session, $cookies, config, SERVER) {
        this.$scope = $scope;
        this.$location = $location;
        this.authService = autoAuthService;
        this.huashanService = HUASHAN;
        this.Session = Session;
        this.$cookies = $cookies;
        this.smartorg = config.smartorg;
        this.error = undefined;
        this.baseUrl = SERVER.url;
    }
    LoginController.prototype.login = function() {
        var that = this;
        localStorage.clear();
        this.smartorg.authenticate({
            username: this.userName,
            password: this.password
        }).then(function(userInfo) {
            localStorage.setItem("JWT-TOKEN", userInfo.token);
            var infoString = JSON.stringify(userInfo.data);
            var encodedInfo = btoa(infoString);
            localStorage.setItem("INFO", encodedInfo);
            if (userInfo.data.is_admin) {
                that.huashanService.Auth(that.userName, that.password).then(function(response) {
                    return that.loginSuccessFn(response);
                });
            } else {
                that.huashanService.$http.get(that.baseUrl + "/framework/config").then(function(response) {
                    if (response.data.wizardUserAccess) {
                        that.huashanService.Auth(that.userName, that.password).then(function(response) {
                            return that.loginSuccessFn(response);
                        });
                    } else {
                        var message = "Please Use Admin Username To Login";
                        that.$scope.$apply(that.error = message);
                        console.warn("Please login with admin username");
                    }
                })["catch"](function(err) {
                    var message = "Please Use Admin Username To Login";
                    that.$scope.$apply(that.error = message);
                    console.warn("Please login with admin username");
                });
            }
        })["catch"](function(err) {
            var message = "Username or password is not correct.";
            that.$scope.$apply(that.error = message);
            console.error(err);
        });
    };
    LoginController.prototype.loginSuccessFn = function(response) {
        if (response.status) {
            this.authService.startAutoAuth();
            this.Session.create(response.credentials);
            this.$cookies.huashansession = this.Session.getCredentials();
            this.$location.path("/selectTemplate");
        } else {
            this.$location.path("/login");
            var message = "Login Failed. You cannot proceed.";
            this.$scope.$apply(this.error = message);
            console.log("Login failed. You cannot proceed.");
        }
    };
    return LoginController;
}();

var PortfolioStructureController = function() {
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
        } else {
            this.$location.path("/login");
        }
        this.selectedTemplate = this.$routeParams.templateID;
        this.commands = [ "COMPARE_VALUE", "COMPARE_UNCERTAINTY", "CFO_CHART", "ADD_TABLES", "INNOVATION_SCREEN", "BUCKET_CHART" ];
        this.saveComplete = true;
        this.server = app.server;
        this.tables = [];
        var that = this;
        this.$rootScope.$on("$locationChangeStart", function(event, next, current) {
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
        var infoGot = localStorage.getItem("INFO");
        var decodedString = atob(infoGot);
        var userInfo = JSON.parse(decodedString);
        this.isAdmin = userInfo.is_admin;
    }
    PortfolioStructureController.prototype.getPortfolioStructure = function() {
        var _this = this;
        this.huashan.GetPortfolioStructure(this.session.getCredentials(), this.$routeParams.templateID, this.isPlatform).then(function(response) {
            _this.portfolioStructure = response.result;
            _this.portfolioStructureCopy = angular.copy(_this.portfolioStructure);
            _this.selectedMenu = _this.portfolioStructure.MENU[0];
            _this.selectMenu(_this.selectedMenu);
            _this.numBucketsClone = 0;
        });
    };
    PortfolioStructureController.prototype.getAppStructure = function() {
        var _this = this;
        this.huashan.GetAppStructure(this.session.getCredentials(), this.$routeParams.templateID, this.isPlatform).then(function(response) {
            _this.appStructure = response.result;
            _this.tornadoOutputs = _this.appStructure.PostProcessingOutputsForPortfolio;
            _this.getDataStructure();
            var tables = _.filter(_this.appStructure.MENU, function(menu) {
                return menu.Command === "TABLE";
            });
            _this.tables = _this.tables.concat(tables);
            console.log("tables ", _this.tables);
        });
        if (this.isPlatform === true) {
            this.huashan.GetAppStructure(this.session.getCredentials(), this.$routeParams.templateID, false).then(function(response) {
                var regularAppStructure = response.result;
                var tables = _.filter(regularAppStructure.MENU, function(menu) {
                    return menu.Command === "TABLE";
                });
                _this.tables = _this.tables.concat(tables);
                console.log("tables ", _this.tables);
            });
        }
    };
    PortfolioStructureController.prototype.getPotentialTables = function() {
        var _this = this;
        this.huashan.GetPotentialTables(this.session.getCredentials(), this.$routeParams.templateID).then(function(response) {
            _this.potentialTables = response.result.PotentialTableOutputs;
            console.log("potential tables: ", _this.potentialTables);
        });
    };
    PortfolioStructureController.prototype.getDataStructure = function() {
        var _this = this;
        console.log("datastructure");
        this.huashan.GetIncludedDataStructureComponents(this.session.getCredentials(), this.$routeParams.templateID, this.isPlatform).then(function(data) {
            _this.inputs = data.result.Inputs;
            _this.outputs = data.result.Outputs;
            _this.allOutputs = _this.outputs.concat(_this.tornadoOutputs);
        });
    };
    PortfolioStructureController.prototype.selectMenu = function(menu) {
        this.selectedMenu = menu;
        console.log(this.selectedMenu);
        var that = this;
        if (this.selectedMenu.Command === "ADD_TABLES") {
            this.selectedTable = _.find(this.tables, function(table) {
                return table.Parameters.OutputKey === that.selectedMenu.Parameters.Key;
            });
            this.selectedPotentialTable = _.find(this.potentialTables, function(table) {
                return table.CellLink === that.selectedTable.Parameters.CellLink;
            });
            this.minPrecision = this.selectedMenu.Parameters.PrecisionOptions === undefined || this.selectedMenu.Parameters.PrecisionOptions.length === 0 ? null : this.selectedMenu.Parameters.PrecisionOptions[0];
            this.maxPrecision = this.selectedMenu.Parameters.PrecisionOptions === undefined || this.selectedMenu.Parameters.PrecisionOptions.length === 0 ? null : this.selectedMenu.Parameters.PrecisionOptions[this.selectedMenu.Parameters.PrecisionOptions.length - 1];
            console.log(this.minPrecision, this.maxPrecision);
        }
        if (this.selectedMenu.Command === "BUCKET_CHART") {
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
            var source = this.selectedMenu.Parameters.Source;
            var metalogKeysBySource = [];
            this.appStructure.MENU.forEach(function(item) {
                if (item.Command == "METALOG_DISPLAY" && item.ID == source) {
                    metalogKeysBySource = item.Parameters.MetaLogKeys;
                }
            });
            var that = this;
            if (this.selectedMenu.Parameters.RollupKeys.length > 0) {
                this.selectedMenu.Parameters.RollupKeys.forEach(function(item) {
                    if (metalogKeysBySource.indexOf(item) == -1) {
                        that.selectedMenu.Parameters.RollupKeys = that.remove(that.selectedMenu.Parameters.RollupKeys, item);
                    }
                });
            }
        }
    };
    PortfolioStructureController.prototype.createBucketManager = function(buckets) {
        return new BucketManager(buckets);
    };
    PortfolioStructureController.prototype.selectTable = function(table) {
        var that = this;
        this.selectedTable = table;
        this.selectedMenu.Parameters.Key = table.Parameters.OutputKey;
        this.selectedPotentialTable = _.find(this.potentialTables, function(table) {
            return table.CellLink === that.selectedTable.Parameters.CellLink;
        });
    };
    PortfolioStructureController.prototype.saveWithCommit = function(commitMessage) {
        if (commitMessage === void 0) {
            commitMessage = "Save Changes!";
        }
        console.log("Click save!", commitMessage);
        this.save(commitMessage);
        $("#commitMessageModal").modal("hide");
    };
    PortfolioStructureController.prototype.save = function(message) {
        var _this = this;
        this.checkID();
        this.checkCFOChartInnovationScreen();
        this.saveAlerts = [];
        if (!this.checkScatterPlotName()) return;
        if (!this.checkBucketChartNum()) return;
        this.checkMinAndMax();
        this.saveComplete = false;
        this.huashan.SavePortfolioStructure(this.session.getCredentials(), this.$routeParams.templateID, {
            data: this.portfolioStructure,
            commitMessage: message
        }, this.isPlatform).then(function(response) {
            console.log(response);
            _this.saveComplete = true;
            if (response.status) {
                _this.portfolioStructureCopy = angular.copy(_this.portfolioStructure);
            } else {
                _this.addAlert(_this.saveAlerts, "danger", response.msg);
            }
        });
    };
    PortfolioStructureController.prototype.checkMinAndMax = function() {
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
    PortfolioStructureController.prototype.checkScatterPlotName = function() {
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
    };
    PortfolioStructureController.prototype.checkBucketChartNum = function() {
        var result = true;
        for (var i = 0; i < this.portfolioStructure.MENU.length; i++) {
            if (this.portfolioStructure.MENU[i].Command === "BUCKET_CHART" && this.portfolioStructure.MENU[i].Parameters.Sets.length > 1) {
                for (var j = 0; j < this.portfolioStructure.MENU[i].Parameters.Sets.length; j++) {
                    if (this.portfolioStructure.MENU[i].Parameters.Sets[j].xBuckets.length === 0 || this.numBucketsClone === undefined || this.numBucketsClone === null) {
                        this.addAlert(this.saveAlerts, "danger", "Buckets can not be empty!");
                        result = false;
                        break;
                    }
                }
            }
            if (result === false) break;
        }
        return result;
    };
    PortfolioStructureController.prototype.checkID = function() {
        if (this.portfolioStructure.ID === undefined) {
            this.portfolioStructure.ID = this.$routeParams.templateID;
        }
    };
    PortfolioStructureController.prototype.changePrecisionOptions = function() {
        this.selectedMenu.Parameters.PrecisionOptions = [];
        if (this.minPrecision === null || this.maxPrecision === null || this.minPrecision > this.maxPrecision) {
            return;
        }
        for (var i = this.minPrecision; i <= this.maxPrecision; i++) {
            this.selectedMenu.Parameters.PrecisionOptions.push(i);
        }
    };
    PortfolioStructureController.prototype.getKeyFrom = function(axis) {
        if (axis === "" || axis === undefined) {
            return "";
        }
        var startIndex = axis.indexOf("'");
        var result = axis.slice(startIndex + 1);
        var endIndex = result.indexOf("'");
        return result.slice(0, endIndex);
    };
    PortfolioStructureController.prototype.getOutputUnitFromKey = function(key) {
        var output = _.find(this.outputs, function(output) {
            return output.Key === key;
        });
        if (output != undefined) {
            return output.Units;
        }
        return "";
    };
    PortfolioStructureController.prototype.getOutputDisplayFromKey = function(key) {
        var output = _.find(this.outputs, function(output) {
            return output.Key === key;
        });
        if (output != undefined) {
            return output.Display;
        } else {
            output = _.find(this.tornadoOutputs, function(output) {
                return output.Key === key;
            });
            return output.Title;
        }
    };
    PortfolioStructureController.prototype.getSourceFromAppStruMetalog = function() {
        var a = [];
        this.appStructure.MENU.forEach(function(item) {
            if (item.Command == "METALOG_DISPLAY") {
                a.push(item.ID);
            }
        });
        return a;
    };
    PortfolioStructureController.prototype.getPortfolioUncKeyFromMetalogBySource = function() {
        var key = [];
        var source = this.selectedMenu.Parameters.Source;
        this.appStructure.MENU.forEach(function(item) {
            if (item.Command == "METALOG_DISPLAY" && item.ID == source) {
                key = item.Parameters.MetaLogKeys;
            }
        });
        return key;
    };
    PortfolioStructureController.prototype.addToRollupKeys = function(key) {
        this.selectedMenu.Parameters.RollupKeys.push(key);
    };
    PortfolioStructureController.prototype.removeFromIncludedKeys = function(key) {
        var that = this;
        this.selectedMenu.Parameters.RollupKeys.forEach(function(item) {
            if (item == key) {
                that.selectedMenu.Parameters.RollupKeys = that.remove(that.selectedMenu.Parameters.RollupKeys, key);
            }
        });
    };
    PortfolioStructureController.prototype.remove = function(array, element) {
        return array.filter(function(e) {
            return e !== element;
        });
    };
    PortfolioStructureController.prototype.findKey = function(arr) {
        return function(key) {
            return _.find(arr, function(element) {
                return element.Key === key;
            });
        };
    };
    PortfolioStructureController.prototype.buildOutputFromKey = function(key) {
        return "Outputs['" + key + "']";
    };
    PortfolioStructureController.prototype.addCompareValueItem = function() {
        var length = this.selectedMenu.Parameters.Keys.length;
        this.selectedMenu.Parameters.Keys[length] = "";
        this.selectedMenu.Parameters.Units[length] = "";
        this.selectedMenu.Parameters.Titles[length] = "";
    };
    PortfolioStructureController.prototype.addCFOChartItem = function() {
        var cfoChartItem = {
            AverageCost: "",
            xTitle: "",
            AverageValueMinusCost: "",
            yTitle: "",
            name: "CFOChart" + (this.selectedMenu.Parameters.Sets.length + 1).toString()
        };
        this.selectedMenu.Parameters.Sets.push(cfoChartItem);
    };
    PortfolioStructureController.prototype.deleteCFOChartItem = function(index) {
        this.selectedMenu.Parameters.Sets.splice(index, 1);
    };
    PortfolioStructureController.prototype.checkCFOChartInnovationScreen = function() {
        if (this.selectedMenu.Command == "INNOVATION_SCREEN" || this.selectedMenu.Command == "CFO_CHART") {
            for (var i = this.selectedMenu.Parameters.Sets.length - 1; i >= 0; i--) {
                if (this.selectedMenu.Parameters.Sets[i].xTitle == "" || this.selectedMenu.Parameters.Sets[i].yTitle == "") {
                    this.selectedMenu.Parameters.Sets.splice(i, 1);
                }
            }
        }
    };
    PortfolioStructureController.prototype.addInnovationScreenItem = function() {
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
    PortfolioStructureController.prototype.deleteInnovationScreenItem = function(index) {
        this.selectedMenu.Parameters.Sets.splice(index, 1);
    };
    PortfolioStructureController.prototype.addScatterPlotItem = function() {
        var scatterPlotItem = {
            x: "",
            y: "",
            xTitle: "",
            yTitle: "",
            name: ""
        };
        this.selectedMenu.Parameters.Sets.push(scatterPlotItem);
    };
    PortfolioStructureController.prototype.deleteCompareValueItem = function(index) {
        this.selectedMenu.Parameters.Keys.splice(index, 1);
        this.selectedMenu.Parameters.Units.splice(index, 1);
        this.selectedMenu.Parameters.Titles.splice(index, 1);
    };
    PortfolioStructureController.prototype.deleteScatterPlotItem = function(index) {
        this.selectedMenu.Parameters.Sets.splice(index, 1);
    };
    PortfolioStructureController.prototype.openNew = function() {
        $("#new-display").val("");
        $("#new-command").val("");
        $("#newPortfolioStructureModal").on("shown.bs.modal", function() {
            $("#new-display").focus();
        });
    };
    PortfolioStructureController.prototype.addNewPortfolioStructure = function(display, command) {
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
            newPortfolioStructure.Context = {
                RequiredCommandInNodeTemplate: "TORNADO_DIST"
            };
        }
        this.portfolioStructure.MENU.push(newPortfolioStructure);
        this.selectMenu(newPortfolioStructure);
    };
    PortfolioStructureController.prototype.generateBuckets = function(setIndex) {
        this.numBucketsClone = this.numBuckets;
        var delta = (parseInt(this.bucketHigh) - parseInt(this.bucketLow)) / this.numBuckets;
        for (var i = 0; i < this.numBuckets; i++) {
            var lower = (parseInt(this.bucketLow) + i * delta).toFixed(2);
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
    PortfolioStructureController.prototype.toggleNameEdit = function(bucket, setIndex) {
        if (bucket.nameEditable === true) {
            this.selectedMenu.Parameters.Sets[setIndex].xBuckets = this.bucketManagers[setIndex].buckets();
        }
        bucket.nameEditable = !bucket.nameEditable;
    };
    PortfolioStructureController.prototype.toggleRuleEdit = function(bucket, setIndex) {
        if (bucket.rulesEditable === true) {
            this.selectedMenu.Parameters.Sets[setIndex].xBuckets = this.bucketManagers[setIndex].buckets();
        }
        bucket.rulesEditable = !bucket.rulesEditable;
    };
    PortfolioStructureController.prototype.addBucketChartSet = function() {
        this.selectedMenu.Parameters.Sets.push(this.emptyBucketSet());
        this.numBucketsClone = null;
        console.log("Added Bucket chart", this.selectedMenu.Parameters.Sets);
    };
    PortfolioStructureController.prototype.addBucket = function(setIndex) {
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
    PortfolioStructureController.prototype.deleteBucket = function(setIndex) {
        if (this.bucketManagers[setIndex].editableBuckets.length > 0) {
            this.bucketManagers[setIndex].editableBuckets.splice(this.bucketManagers[setIndex].editableBuckets.length - 1, 1);
        } else {}
        this.selectedMenu.Parameters.Sets[setIndex].xBuckets = this.bucketManagers[setIndex].buckets();
    };
    PortfolioStructureController.prototype.deleteBucketSet = function(setIndex) {
        this.selectedMenu.Parameters.Sets.splice(setIndex, 1);
        this.bucketManagers.splice(setIndex, 1);
        this.numBucketsClone = 0;
    };
    PortfolioStructureController.prototype.checkDisplay = function(display) {
        if (display === undefined) {
            this.addAlert(this.newPortfolioStructureAlerts, "danger", "please type in the name of the new portfolio structure!");
            return false;
        } else {
            return true;
        }
    };
    PortfolioStructureController.prototype.checkCommand = function(command) {
        if (command === undefined) {
            this.addAlert(this.newPortfolioStructureAlerts, "danger", "please choose a command of the new portfolio structure!");
            return false;
        } else {
            return true;
        }
    };
    PortfolioStructureController.prototype.emptyBucketSet = function() {
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
    PortfolioStructureController.prototype.buildParams = function(command) {
        switch (command) {
          case "ADD_TABLES":
            var param = {};
            param.Key = this.tables[0].Parameters.OutputKey;
            param.NodeLookup = "Outputs";
            param.PnL = false;
            param.PrecisionOptions = [ 0, 1, 2 ];
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
            param.Keys = [ "Key", "Summary", "Mean", "Display", "Units" ];
            param.NodeLookup = "TornadoDistOutputs";
            break;

          case "INNOVATION_SCREEN":
            var param = {};
            param.Sets = [ {
                x: "",
                xTitle: "",
                y: "",
                yTitle: "",
                VerticalCutoff: null,
                name: "Innovation Screen1"
            } ];
            break;

          case "CFO_CHART":
            var param = {};
            param.Sets = [ {
                AverageCost: "",
                xTitle: "",
                AverageValueMinusCost: "",
                yTitle: "",
                name: "CFOChart1"
            } ];
            break;

          case "SCATTER_PLOT":
            var param = {};
            param.Sets = [ {
                x: "",
                y: "",
                xTitle: "",
                yTitle: ""
            } ];
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
    PortfolioStructureController.prototype.isUnchanged = function() {
        return angular.equals(this.portfolioStructure, this.portfolioStructureCopy);
    };
    PortfolioStructureController.prototype.addAlert = function(alert, type, msg) {
        alert.push({
            type: type,
            msg: msg
        });
    };
    PortfolioStructureController.prototype.closeAlert = function(alert, index) {
        alert.splice(index, 1);
    };
    PortfolioStructureController.prototype.rename = function() {
        this.save();
        $("#editPortfolioStructureModal").modal("hide");
    };
    PortfolioStructureController.prototype.deletePortfolioStructure = function() {
        this.portfolioStructure.MENU.splice(this.portfolioStructure.MENU.indexOf(this.selectedMenu), 1);
        if (!this.isUnchanged()) {
            this.save("Delete " + this.selectedMenu.Display);
        }
        this.selectedMenu = this.portfolioStructure.MENU[0];
        $("#deletePortfolioStructureModal").modal("hide");
    };
    return PortfolioStructureController;
}();

var BucketManager = function() {
    function BucketManager(buckets) {
        this.rule1Options = this.makeRule1Options();
        this.rule2Options = this.makeRule2Options();
        this.editableBuckets = this.editableBucketsFrom(buckets);
        this.editing = false;
    }
    BucketManager.prototype.editableBucketsFrom = function(buckets) {
        var _this = this;
        var answer = new Array();
        buckets.forEach(function(bucket) {
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
    BucketManager.prototype.rule1From = function(bucket) {
        return bucket.GT ? this.rule1Options[1] : bucket.GE ? this.rule1Options[2] : this.rule1Options[0];
    };
    BucketManager.prototype.rule2From = function(bucket) {
        return bucket.LT ? this.rule2Options[1] : bucket.LE ? this.rule2Options[2] : this.rule2Options[0];
    };
    BucketManager.prototype.buckets = function() {
        var answer = new Array();
        this.editableBuckets.forEach(function(bucket) {
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
    BucketManager.prototype.makeRule1Options = function() {
        return [ {
            Label: "",
            Value: "NONE"
        }, {
            Label: ">",
            Value: "GT"
        }, {
            Label: ">=",
            Value: "GE"
        } ];
    };
    BucketManager.prototype.makeRule2Options = function() {
        return [ {
            Label: "",
            Value: "NONE"
        }, {
            Label: "<",
            Value: "LT"
        }, {
            Label: "<=",
            Value: "LE"
        } ];
    };
    BucketManager.prototype.makeEditable = function() {
        this.editing = true;
    };
    BucketManager.prototype.stopEditing = function() {
        this.editing = false;
    };
    return BucketManager;
}();

var RevisionsController = function() {
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
        this.getTemplateData();
        this.jsonCompareResult = null;
        if (this.session.getCredentials() || this.$cookies["huashansession"]) {
            this.session.create(this.$cookies["huashansession"]);
        } else {
            this.$location.path("/login");
        }
        var infoGot = localStorage.getItem("INFO");
        var decodedString = atob(infoGot);
        var userInfo = JSON.parse(decodedString);
        this.isAdmin = userInfo.is_admin;
    }
    RevisionsController.prototype.getTemplateData = function() {
        var _this = this;
        this.$http.get(this.baseUrl + "/domain/astro-templates/" + this.$routeParams.templateID, {
            headers: {
                Authorization: "jwttoken " + localStorage.getItem("JWT-TOKEN")
            }
        }).then(function(response) {
            if (response.data.token) {
                localStorage.setItem("JWT-TOKEN", response.data.token);
            }
            if (response.data.data.status == 1) {
                _this.templateGot = response.data.data.template;
                _this.getRevisions();
            } else {
                _this.addAlert(response.data.data.message);
            }
            var data = response.data.data ? response.data.data : [];
        })["catch"](function(err) {
            console.error(err);
            _this.addAlert(err);
        });
    };
    RevisionsController.prototype.getRevisions = function() {
        var _this = this;
        this.huashan.GetRevisions(this.session.getCredentials(), this.$routeParams.templateID).then(function(response) {
            console.log(response);
            if (response.status) {
                var temLog = response.result.split("\n").map(function(item) {
                    return JSON.parse(item);
                });
                _this.re = {
                    revisionLogs: temLog
                };
                if (_this.re.revisionLogs) {
                    var revisionInfoGot = _this.re.revisionLogs.find(function(t) {
                        return t.commitNum == _this.templateGot.history.guid;
                    });
                    if (revisionInfoGot == undefined && _this.re.revisionLogs.length > 0) {
                        revisionInfoGot = _this.re.revisionLogs[0];
                    }
                    _this.selectedRevision = revisionInfoGot;
                    _this.getTemplateJsonFiles();
                }
                _this.appStructureCopy = angular.copy(_this.appStructure);
            } else {
                _this.addAlert(_this.saveAlerts, "danger", response.msg);
            }
        })["catch"](function(err) {
            console.error(err);
        });
    };
    RevisionsController.prototype.selectRevision = function(commitNumber, revision) {
        console.log(commitNumber);
        this.selectedRevision = revision;
        this.switchRevisionByCommitHash(commitNumber);
    };
    RevisionsController.prototype.switchRevisionByCommitHash = function(commitHash) {
        var _this = this;
        var c = this.session.getCredentials();
        var t = this.$routeParams.templateID;
        var data = {
            commitHash: commitHash
        };
        this.huashan.SwitchRevisionByCommitHash(c, t, data).then(function(response) {
            _this.selectedTemplate = _this.$routeParams.templateID;
            var result = response.result;
            _this.getTemplateJsonFiles();
            _this.$timeout();
        })["catch"](function(response) {
            console.error(response);
        });
    };
    RevisionsController.prototype.getTemplateJsonFiles = function() {
        var _this = this;
        this.huashan.GetTemplateJsonFiles(this.session.getCredentials(), this.$routeParams.templateID).then(function(response) {
            _this.selectedTemplate = _this.$routeParams.templateID;
            var jsonFiles = response.result;
            _this.setData(jsonFiles);
        });
    };
    RevisionsController.prototype.setData = function(jsonFiles) {
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
    RevisionsController.prototype.platformExists = function() {
        return this.jsonData !== undefined && this.jsonData.platformDataStructure !== undefined && this.jsonData.platformDataStructure.indexOf("Does not exist") === -1;
    };
    RevisionsController.prototype.saveTemplateJsonFiles = function() {
        var _this = this;
        this.huashan.SaveTemplateJsonFiles(this.session.getCredentials(), this.data.name, {
            data: this.createDataToSubmit(),
            commitMessage: "Switch Revision"
        }).then(function(response) {
            _this.saveComplete = true;
            if (response.status === false) {
                _this.saveErrorMessage = response.msg;
                _this.addAlert(_this.saveErrorMessage);
            } else {
                _this.dataCopy = angular.copy(_this.data);
            }
        });
    };
    RevisionsController.prototype.createDataToSubmit = function() {
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
    RevisionsController.prototype.downloadTemplate = function() {
        console.log("From revision: " + this.selectedTemplate);
        window.location = this.baseUrl + "/fileUploader?" + this.session.getCredentials() + "=" + this.selectedTemplate;
    };
    RevisionsController.prototype.clickItem = function(event, commitNum, revision) {
        this.jsonCompareResult = null;
        if (event.metaKey || event.ctrlKey || event.shiftKey) {
            this.selectedRevisionCompare = revision;
        } else {
            var confirmRevisionChange = confirm("Are you sure to switch to different revision of the template? (You can revert back anytime)");
            if (confirmRevisionChange) {
                this.selectedRevisionCompare = null;
                this.selectRevision(commitNum, revision);
            }
        }
    };
    RevisionsController.prototype.compareJsonFiles = function(selectedRevision, selectedRevisionCompare) {
        var _this = this;
        var c = this.session.getCredentials();
        var t = this.$routeParams.templateID;
        var data = {
            selectedRevision: selectedRevision,
            selectedRevisionCompare: selectedRevisionCompare
        };
        this.huashan.CompareJsonFiles(c, t, data).then(function(response) {
            var temp = response.result.split("\n").map(function(item) {
                return JSON.parse(item);
            });
            _this.jsonCompareResult = temp[0];
        })["catch"](function(response) {
            console.error(response);
        });
    };
    RevisionsController.prototype.getDisplayNameBy = function(fileName) {
        var displayNames = {
            appStructure: "App Structure",
            dataStructure: "Data Structure",
            portfolio: "Portfolio Structure",
            platformAppStructure: "Platform App Structure",
            platformDataStructure: "Platform Data Structure",
            platformPortfolio: "Platform Portfolio Structure"
        };
        if (fileName) {
            var key = fileName.split("_")[1].split(".")[0];
            if (key in displayNames) {
                return displayNames[key];
            } else {
                return "no match name!";
            }
        } else {
            return "fileName is not exit.";
        }
    };
    RevisionsController.prototype.addAlert = function(msg) {
        this.alerts.push({
            type: "danger",
            msg: msg
        });
    };
    return RevisionsController;
}();

function stringify(jsonObject) {
    return JSON.stringify(jsonObject, undefined, 2);
}

var saveBolb = function() {
    var a = document.createElement("a");
    a.style.cssText = "display: none !important";
    document.body.appendChild(a);
    return function(blob, fileName) {
        var url = window.URL.createObjectURL(blob.data);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    };
}();

var SelectTemplateController = function() {
    function SelectTemplateController($location, HUASHAN, Session, $cookies, SERVER, $http) {
        this.$http = $http;
        this.$location = $location;
        this.huashan = HUASHAN;
        this.baseUrl = SERVER.url;
        this.uploadedAstroTemplate = {
            name: "",
            groups: [],
            creatorGroups: [],
            history: []
        };
        this.allGroup = "ALL";
        this.groups = [ {
            _id: 1,
            groupname: this.allGroup
        } ];
        this.userGroups = [];
        this.session = Session;
        this.$cookies = $cookies;
        this.myInterval = 3e3;
        this.sort = {
            column: "name",
            descending: false
        };
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
        var infoGot = localStorage.getItem("INFO");
        var decodedString = atob(infoGot);
        this.userInfo = JSON.parse(decodedString);
        this.isAdmin = this.userInfo.is_admin;
        this.initRetrieval();
    }
    SelectTemplateController.prototype.initRetrieval = function() {
        this.getGroups();
    };
    SelectTemplateController.prototype.syncTemplate = function(tempalteID) {
        var _this = this;
        this.showMessage = null;
        this.showMessageContent = null;
        this.huashan.SyncTemplate(this.session.getCredentials(), tempalteID).then(function(response) {
            if (response.status) {
                _this.showMessage = "Success";
                _this.showMessageContent = "Template synced successfully!";
            } else {
                console.error(response);
                _this.showMessage = "Failure";
                _this.showMessageContent = "Template sync failed, please contact support!";
            }
        })["catch"](function(err) {
            console.error(err);
            _this.showMessage = "Failure";
            _this.showMessageContent = "Template sync failed, please contact support!";
        });
    };
    SelectTemplateController.prototype.getRevisionInfo = function(tempalteID, history) {
        var _this = this;
        this.huashan.GetRevisions(this.session.getCredentials(), tempalteID).then(function(response) {
            console.log(response);
            if (!response.status) {
                _this.revisionInfo = null;
            }
            if (response.status) {
                var temLog = response.result.split("\n").map(function(item) {
                    return JSON.parse(item);
                });
                var revisionInfoGot = temLog.find(function(t) {
                    return t.commitNum == history.guid;
                });
                if (revisionInfoGot == undefined && temLog.length > 0) {
                    revisionInfoGot = temLog[0];
                }
                _this.revisionInfo = revisionInfoGot;
            } else {
                _this.addAlert(_this.saveAlerts, "danger", response.msg);
            }
        })["catch"](function(err) {
            console.error(err);
        });
    };
    SelectTemplateController.prototype.addSlides = function() {
        this.slides = [ {
            image: app.server + "/AstroTmp/tmpcharts/vimg_000101010000000000_17003.png",
            text: "image 1"
        }, {
            image: app.server + "/AstroTmp/tmpcharts/vimg_000101010000000000_24009.png",
            text: "image 2"
        }, {
            image: app.server + "/AstroTmp/tmpcharts/vimg_000101010000000000_1929.png",
            text: "image 3"
        }, {
            image: app.server + "/AstroTmp/tmpcharts/vimg_000101010000000000_10586.png",
            text: "image 4"
        } ];
    };
    SelectTemplateController.prototype.findAssociatedPortfolios = function() {
        var _this = this;
        this.huashan.FindAssociatedPortfolios(this.session.credentials, this.selectedTemplate).then(function(response) {
            if (response.status) {
                _this.portfolioNameList = response.result;
            } else {
                alert("Some error happened: " + response.msg);
            }
        });
    };
    SelectTemplateController.prototype.initializeUpdateDataStructure = function() {
        this.updateDataStructure = {
            Leaf: true,
            Platform: false
        };
    };
    SelectTemplateController.prototype.selectPortfolioName = function(portfolioName) {
        this.selectedPortfolioName = portfolioName;
    };
    SelectTemplateController.prototype.resetPortfolioName = function(portfolioName) {
        this.selectedPortfolioName = "";
    };
    SelectTemplateController.prototype.runUpdateDataStructure = function() {
        var _this = this;
        this.runningUpdateDataStructure = "Running";
        if (this.portfolioNameList.length > 0) {
            this.huashan.UpdateDataStructure(this.session.credentials, TheUte().pack(this.selectedPortfolioName), this.updateDataStructure.Leaf, this.updateDataStructure.Platform).then(function(response) {
                if (response.status) {
                    console.log("Updated!!");
                    _this.runningUpdateDataStructure = "Success";
                } else {
                    alert("Some error happened: " + response.msg);
                    _this.runningUpdateDataStructure = "Failure";
                    _this.responseMsg = response.msg;
                }
            });
        }
    };
    SelectTemplateController.prototype.getTemplates = function() {
        var _this = this;
        this.templates = [];
        this.loadingTable = true;
        this.huashan.GetAstroTemplates(this.session.getCredentials()).then(function(response) {
            if (response.status) {
                _this.templates = response.result;
                var selectedTemplateJSONGot = localStorage.getItem("selectedTemplate");
                if (selectedTemplateJSONGot) {
                    var selectedTemplateGot_1 = JSON.parse(selectedTemplateJSONGot);
                    _this.selectedTemplate = selectedTemplateGot_1.name;
                    var updatedTemplate = response.result.find(function(r) {
                        return r.name == selectedTemplateGot_1.name;
                    });
                    if (updatedTemplate) {
                        _this.findAssociatedPortfolios();
                        _this.getRevisionInfo(selectedTemplateGot_1.name, updatedTemplate.history);
                    } else {
                        _this.selectedTemplate = "Not Selected";
                        localStorage.removeItem("selectedTemplate");
                    }
                } else {
                    _this.selectedTemplate = "Not Selected";
                }
                _this.loadingTable = false;
            } else {
                _this.alertMsg.msg = "Templates not found! " + response.msg;
                $("#infoMsgAlert").fadeIn("fast").delay(3e3).fadeOut("fast");
                _this.loadingTable = false;
            }
        });
    };
    SelectTemplateController.prototype.filterTemplatesByUserGroups = function(templates) {
        var _this = this;
        var filteredTemplates = templates;
        if (!this.isAdmin) {
            filteredTemplates = templates.filter(function(template) {
                return template.groups.some(function(group) {
                    return group.groupname == _this.allGroup || _this.userGroups.includes(group._id);
                }) || template.creatorGroups.some(function(groupId) {
                    return _this.userGroups.includes(groupId);
                });
            });
        }
        return filteredTemplates;
    };
    SelectTemplateController.prototype.saveAstroTemplate = function() {
        var _this = this;
        var that = this;
        this.$http.post(this.baseUrl + "/domain/astro-templates", this.uploadedAstroTemplate, {
            headers: {
                Authorization: "jwttoken " + localStorage.getItem("JWT-TOKEN")
            }
        }).then(function(response) {
            if (response.data.token) {
                localStorage.setItem("JWT-TOKEN", response.data.token);
            }
            $("#uploadModal").modal("hide");
            that.getTemplates();
            if (response.data.data.status == 1) {
                that.alertMsg.type = "info";
                that.alertMsg.msg = response.data.data.message;
                $("#infoMsgAlert").fadeIn("fast").delay(3e3).fadeOut("fast");
            } else {
                $("#uploadSuccessAlert").fadeIn("fast").delay(2e3).fadeOut("fast");
            }
        })["catch"](function(err) {
            console.error(err);
            _this.addAlert(_this.submitAlerts, "danger", "Upload failed due to: " + (err.data ? err.data.message : err));
        });
    };
    SelectTemplateController.prototype.getGroupsForUser = function() {
        var that = this;
        var groupsGot = [];
        var user_id = this.userInfo.uid;
        console.log("User Info:" + user_id);
        if (this.groups) {
            this.groups.forEach(function(gp) {
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
    SelectTemplateController.prototype.getGroups = function() {
        var _this = this;
        this.$http.get(this.baseUrl + "/framework/admin/group/list", {
            headers: {
                Authorization: "jwttoken " + localStorage.getItem("JWT-TOKEN")
            }
        }).then(function(response) {
            if (response.data.token) {
                localStorage.setItem("JWT-TOKEN", response.data.token);
            }
            var data = response.data.data ? response.data.data : [];
            for (var _i = 0, data_1 = data; _i < data_1.length; _i++) {
                var group = data_1[_i];
                _this.groups.push(group);
            }
            _this.getGroupsForUser();
        })["catch"](function(err) {
            console.error(err);
            _this.alertMsg.type = "danger";
            _this.alertMsg.msg = "(SESSION EXPIRED) Data retrieval failed due to: " + (err.data ? err.data.message : err);
            $("#errorMsgAlert").fadeIn("fast").delay(3e3).fadeOut("fast");
            _this.$location.path("/login");
        });
    };
    SelectTemplateController.prototype.select = function(template) {
        this.portfolioNameList = [];
        var templateName = template.name;
        this.selectedTemplate = templateName;
        var templateStringify = JSON.stringify(template);
        localStorage.setItem("selectedTemplate", templateStringify);
        this.selected = template;
        this.newTemplateName = this.selectedTemplate;
        this.findAssociatedPortfolios();
        this.getRevisionInfo(template.name, template.history);
        this.editCreator = false;
        this.editDescription = false;
        this.editCreatorLink = false;
        this.editEmail = false;
        this.editVersion = false;
        this.editVersionLog = false;
        this.showVersionLog = false;
    };
    SelectTemplateController.prototype.listDeletedTemplates = function() {
        var _this = this;
        this.loadingDeleteList = true;
        this.deletedTemplates = [];
        this.huashan.GetArchivedAstroTemplates(this.session.getCredentials()).then(function(response) {
            if (response.status) {
                _this.deletedTemplates = _this.extractNamesOnly(response.result);
                _this.selectedDeletedTemplate = "Not Selected";
                _this.loadingDeleteList = false;
            } else {
                _this.alertMsg.msg = "Deleted templates not found! " + response.msg;
                $("#infoMsgAlert").fadeIn("fast").delay(3e3).fadeOut("fast");
                _this.loadingDeleteList = false;
                _this.selectedDeletedTemplate = "Not Selected";
            }
        });
    };
    SelectTemplateController.prototype.extractNamesOnly = function(list) {
        var extracted = [];
        list.forEach(function(l) {
            extracted.push(l.name);
        });
        return extracted;
    };
    SelectTemplateController.prototype.selectDeleted = function(deleted) {
        this.selectedDeletedTemplate = deleted;
    };
    SelectTemplateController.prototype["delete"] = function() {
        var _this = this;
        this.loading = true;
        this.deleteAlerts = [];
        this.huashan.DeleteTemplate(this.session.getCredentials(), this.selectedTemplate).then(function(response) {
            console.log("In DeleteTemplate(): " + response.status);
            if (response.status) {
                _this.hideDeleteModal();
                _this.selectedTemplate = "Not Selected";
                localStorage.removeItem("selectedTemplate");
                _this.getTemplates();
                _this.loading = false;
            } else {
                _this.addAlert(_this.deleteAlerts, "danger", response.msg);
                console.log(_this.deleteAlerts);
                _this.loading = false;
            }
        });
    };
    SelectTemplateController.prototype.hideDeleteModal = function() {
        $("#deleteModal").modal("hide");
    };
    SelectTemplateController.prototype.undelete = function() {
        var _this = this;
        this.loading = true;
        this.undeleteAlerts = [];
        this.huashan.UndeleteTemplate(this.session.getCredentials(), this.selectedDeletedTemplate).then(function(response) {
            if (response.status) {
                _this.getTemplates();
                _this.listDeletedTemplates();
                _this.selectedDeletedTemplate = "Not Selected";
                _this.loading = false;
            } else {
                _this.loading = false;
                _this.selectedDeletedTemplate = "Not Selected";
                _this.addAlert(_this.undeleteAlerts, "danger", response.msg);
            }
        });
    };
    SelectTemplateController.prototype.downloadTemplate = function() {
        var _this = this;
        console.log(this.selectedTemplate);
        this.loading = true;
        var url = this.baseUrl + "/wizard/download/excel/" + this.selectedTemplate;
        this.$http.get(url, {
            headers: {
                "Content-Type": "application/json",
                Authorization: "jwttoken " + localStorage.getItem("JWT-TOKEN"),
                Accept: "application/vnd.ms-excel"
            },
            responseType: "blob"
        }).then(function(response) {
            _this.loading = false;
            saveBolb(response, _this.selectedTemplate);
            console.log(response);
        })["catch"](function(err) {
            _this.loading = false;
            console.error(err);
        });
    };
    SelectTemplateController.prototype.rename = function() {
        var _this = this;
        this.loading = true;
        this.renameAlerts = [];
        if (this.newTemplateName === "") {
            this.addAlert(this.renameAlerts, "danger", "Template name cannot be blank.");
            return;
        }
        this.newTemplateName = this.replaceSpace(this.newTemplateName);
        this.huashan.RenameTemplate(this.session.getCredentials(), this.selectedTemplate, this.newTemplateName).then(function(response) {
            if (response.status) {
                _this.loading = false;
                $("#renameModal").modal("hide");
                _this.getTemplates();
            } else {
                _this.loading = false;
                _this.addAlert(_this.renameAlerts, "danger", response.msg);
            }
        });
    };
    SelectTemplateController.prototype.templateNameFrom = function(fileName) {
        var indexOfDot = fileName.indexOf(".");
        return fileName.substr(0, indexOfDot);
    };
    SelectTemplateController.prototype.smartogrify = function() {
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
        uploadData.append("file", this.fileToUpload, this.fileToUpload.name);
        var url = this.baseUrl + "/wizard-api/wizard/upload";
        return this.$http({
            method: "POST",
            url: url,
            data: uploadData,
            headers: {
                Authorization: "jwttoken " + localStorage.getItem("JWT-TOKEN"),
                "Content-Type": undefined
            },
            transformRequest: angular.identity
        }).then(function(response) {
            console.log(response);
            $("#uploadModal").modal("hide");
            _this.$http.post(_this.baseUrl + "/app/file", {
                fileName: fileName
            }).then(function(response) {
                console.log(response);
            })["catch"](function(err) {
                console.error(err);
            });
            _this.getTemplates();
            $("#pyOrgrigySuccessAlert").fadeIn("fast").delay(1e3).fadeOut("fast");
        })["catch"](function(err) {
            console.error(err);
            _this.addAlert(_this.submitAlerts, "danger", "Failed due to: " + err);
        });
    };
    SelectTemplateController.prototype.generateProductPortfolio = function(selectedOgreModel) {
        this.ogreStage = "GeneratingTemplate";
        this.selectedOgreModel = selectedOgreModel;
        this.ogreMakeTemplate();
    };
    SelectTemplateController.prototype.ogreMakeTemplate = function() {
        var _this = this;
        this.huashan.OgreMakeTemplate(this.session.getCredentials(), this.templateName, this.selectedOgreModel).then(function(response) {
            if (response.status) {
                _this.ogreBuildCompleted = true;
            } else {
                alert("Some error happened: " + response.msg);
            }
        });
    };
    SelectTemplateController.prototype.submit = function() {
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
        var url = this.baseUrl + "/wizard/upload/" + fileName;
        return this.$http({
            method: "POST",
            url: url,
            data: this.fileToUpload,
            headers: {
                Authorization: "jwttoken " + localStorage.getItem("JWT-TOKEN"),
                "Content-Type": undefined
            },
            transformRequest: angular.identity
        }).then(function(response) {
            console.log(response);
            $("#uploadModal").modal("hide");
            _this.loading = false;
            _this.getTemplates();
            _this.fileToUpload = undefined;
            var fileInput = document.getElementById("FileToUploadID");
            fileInput.value = "";
            if (response.data && response.data.data && response.data.data.status == 1) {
                _this.alertMsg.type = "info";
                _this.alertMsg.msg = response.data.data.message;
                $("#infoMsgAlert").fadeIn("fast").delay(3e3).fadeOut("fast");
            } else {
                $("#uploadSuccessAlert").fadeIn("fast").delay(2e3).fadeOut("fast");
            }
        })["catch"](function(err) {
            _this.loading = false;
            console.error(err);
            _this.addAlert(_this.submitAlerts, "danger", "Upload failed due to: " + (err.data ? err.data.message : err));
        });
    };
    SelectTemplateController.prototype.replaceSpace = function(fileName) {
        return fileName.replace(/\s+/g, "_");
    };
    SelectTemplateController.prototype.checkFileExist = function() {
        if (this.fileToUpload === undefined) {
            this.addAlert(this.submitAlerts, "danger", "Please select a file.");
            return false;
        } else {
            return true;
        }
    };
    SelectTemplateController.prototype.validateFileName = function(fileName) {
        if (fileName.slice(fileName.indexOf(".") + 1).indexOf("xls") === -1) {
            this.addAlert(this.submitAlerts, "danger", "Only Excel files are accepted!");
            return false;
        } else if (fileName.indexOf(" ") !== -1) {
            this.addAlert(this.submitAlerts, "danger", "No spaces allowed in file name.");
            return false;
        } else if (fileName.indexOf("_") !== -1) {
            this.addAlert(this.submitAlerts, "danger", "No underscore allowed in file name.");
            return false;
        } else {
            this.uploadedAstroTemplate.name = fileName.split(".")[0];
            return true;
        }
    };
    SelectTemplateController.prototype.addAlert = function(alert, type, msg) {
        alert.push({
            type: type,
            msg: msg
        });
    };
    SelectTemplateController.prototype.closeAlert = function(alert, index) {
        alert.splice(index, 1);
    };
    SelectTemplateController.prototype.createDataToSubmit = function() {
        var dataToSubmit = {};
        dataToSubmit.name = this.selectedTemplate;
        dataToSubmit.info = this.selected.info;
        return dataToSubmit;
    };
    SelectTemplateController.prototype.saveInfo = function() {
        this.huashan.SaveTemplateInfo(this.session.getCredentials(), this.selectedTemplate, this.createDataToSubmit()).then(function(response) {
            console.log(response);
        });
    };
    SelectTemplateController.prototype.toggleEditCreator = function(flag) {
        this.editCreator = flag;
        if (!flag) {
            this.saveInfo();
        }
    };
    SelectTemplateController.prototype.toggleEditDescription = function(flag) {
        this.editDescription = flag;
        if (!flag) {
            this.saveInfo();
        }
    };
    SelectTemplateController.prototype.toggleEditCreatorLink = function(flag) {
        this.editCreatorLink = flag;
        if (!flag) {
            this.saveInfo();
        }
    };
    SelectTemplateController.prototype.toggleEditEmail = function(flag) {
        this.editEmail = flag;
        if (!flag) {
            this.saveInfo();
        }
    };
    SelectTemplateController.prototype.toggleEditVersion = function(flag) {
        this.editVersion = flag;
        if (!flag) {
            this.saveInfo();
        }
    };
    SelectTemplateController.prototype.toggleReleaseVersion = function(flag) {
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
            Version: this.selected.info.Version,
            VersionLog: this.selected.info.VersionLog,
            VersionTime: new Date().toString()
        });
        this.selected.info.VersionLog = "";
        this.saveInfo();
    };
    SelectTemplateController.prototype.toggleShowVersionLog = function(flag) {
        this.showVersionLog = flag;
    };
    return SelectTemplateController;
}();