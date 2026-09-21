/// <reference path="../../../app/scripts/lib/vendorTypeDefinitions/jasmine.d.ts" />
/// <reference path="../../../app/scripts/lib/vendorTypeDefinitions/jquery.d.ts" />
/// <reference path="../../../app/scripts/lib/vendorTypeDefinitions/angular.d.ts" />
/// <reference path="../../../app/scripts/lib/vendorTypeDefinitions/angular.d.ts" />
/// <reference path="../../../app/bower_components/smart-jasmine-matcher/src/smartJasmineMatcher.ts" />
/// <reference path="../../../test/spec/mockData/mockDataPool.ts" />

'use strict';

describe('Controller: appStructureController (HTTP Mocking)', function () {
    beforeEach(function () {
        jasmine.addMatchers(smartorg.test.matchers.smartMatcher);
    });
    // load the controller's module
    beforeEach(module('huashanApp'));
    var appStructureController: AppStructureController,
        scope,
        injector,
        location, flush, controller, httpBackend, templates;

    beforeEach(inject(function ($httpBackend) {
        httpBackend = $httpBackend;
        var appStructure = {
            "commands": [{
                "name": "Data",
                "paramCount": "2",
                "parameters": [{
                    "name": "appStructureFor",
                    "value": new wizard.mocks.EncodedTemplatePiece(new wizard.mocks.AccountDevTemplate()).encodedAppStructure()
                }, {"name": "status", "value": "1"}]
            }], "context": {}
        };
        httpBackend.when('GET', 'https://localhost/kirk/wizard/main?command=GetAppStructure&kreds=fakeCredentials&templateName=accountDev&isPlatform=false'
        ).respond(appStructure);
        var potentialTables = {
            "commands": [{
                "name": "Data",
                "paramCount": "2",
                "parameters": [{
                    "name": "potentialTables",
                    "value": new wizard.mocks.EncodedTemplatePiece(new wizard.mocks.AccountDevTemplate()).encodedPotentialTables()
                }, {"name": "status", "value": "1"}]
            }], "context": {}
        };
        httpBackend.when('GET', 'https://localhost/kirk/wizard/main?command=GetPotentialTables&kreds=fakeCredentials&templateName=accountDev'
        ).respond(potentialTables);
        var potentialCharts = {
            "commands": [{
                "name": "Data",
                "paramCount": "2",
                "parameters": [{
                    "name": "charts",
                    "value": new wizard.mocks.EncodedTemplatePiece(new wizard.mocks.AccountDevTemplate()).encodedPotentialCharts()
                }, {"name": "status", "value": "1"}]
            }], "context": {}
        };
        httpBackend.when('GET', 'https://localhost/kirk/wizard/main?command=GetCharts&kreds=fakeCredentials&templateName=accountDev'
        ).respond(potentialCharts);
        var dataStructure = {
            "commands": [{
                "name": "Data",
                "paramCount": "2",
                "parameters": [{
                    "name": "dataStructureFor",
                    "value": new wizard.mocks.EncodedTemplatePiece(new wizard.mocks.AccountDevTemplate()).encodedDataStructure()
                }, {"name": "status", "value": "1"}]
            }], "context": {}
        };
        httpBackend.when('GET', 'https://localhost/kirk/wizard/main?command=GetDataStructure&kreds=fakeCredentials&templateName=accountDev&isPlatform=false'
        ).respond(dataStructure);
        flush = httpBackend.flush;
    }));

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, $rootScope, $injector, $routeParams, $templateCache, $location, $q) {
        scope = $rootScope.$new();
        var huashan = $injector.get('HUASHAN');
        console.log(huashan);
        var Session = $injector.get("Session");
        Session.create("fakeCredentials");
        var $cookies = $injector.get("$cookies");
        $cookies.huashansession = "fakeCredentials";
        controller = $controller;
        httpBackend.expect('GET', 'https://localhost/kirk/wizard/main?command=GetAppStructure&kreds=fakeCredentials&templateName=accountDev&isPlatform=false');
        httpBackend.expect('GET', 'https://localhost/kirk/wizard/main?command=GetPotentialTables&kreds=fakeCredentials&templateName=accountDev');
        httpBackend.expect('GET', 'https://localhost/kirk/wizard/main?command=GetCharts&kreds=fakeCredentials&templateName=accountDev');
        httpBackend.expect('GET', 'https://localhost/kirk/wizard/main?command=GetDataStructure&kreds=fakeCredentials&templateName=accountDev&isPlatform=false');
        $routeParams.templateID = "accountDev";
        $location.path('/appstructure/accountDev');
        $rootScope.$digest();
        appStructureController = controller('AppStructureController', {
            $scope: scope,
            $routeParams: {templateID: "accountDev"}
        });
        flush();
        expect(appStructureController).not.toBe(undefined);

    }));
    it("should initialize saveComplete correctly", function () {
        expect(appStructureController.saveComplete).toBe(true);
    });

    it("sets image types correctly", function () {
        var expected = ["RANGE", "CHART"];
        expect(appStructureController.imageTypes).toEqual(expected);
    });

    it("should set sendBackElements correctly", function () {
        var elements = [{value: "Mean", display: "Mean"}, {
            value: "Summary[0]",
            display: "Low"
        }, {
            value: "Summary[1]",
            display: "Med"
        }, {value: "Summary[2]", display: "High"}];
        expect(appStructureController.sendBackElements).toEqual(elements);
    });

    it("should get appStructure correctly", function () {
        var appStructure = appStructureController.appStructure;
        expect(appStructure).not.toBe(undefined);
        expect(appStructure.ID).toBe("accountDev");
    });

    it("should set a copy of appStructure properly", function () {
        var appStructure = appStructureController.appStructure;
        expect(appStructureController.appStructureCopy).toEqual(appStructure);
    });

    it("should add PostProcessingOutputsForPortfolio to appStructure", function () {
        var postProcessing = [
            {
                "SendBack": "Tree!F11",
                "Key": "value_given_success",
                "Reference": "TornadoDistOutputs[0].Mean",
                "Title": "Mean of Net-Present Value"
            },
            {
                "SendBack": "Tree!F8",
                "Key": "High_Calculations_npv",
                "Reference": "TornadoDistOutputs[0].Summary[2]",
                "Title": "High of Net-Present Value"
            },
            {
                "SendBack": "Tree!F9",
                "Key": "Med_Calculations_npv",
                "Reference": "TornadoDistOutputs[0].Summary[1]",
                "Title": "Med of Net-Present Value"
            },
            {
                "SendBack": "Tree!F10",
                "Key": "Low_Calculations_npv",
                "Reference": "TornadoDistOutputs[0].Summary[0]",
                "Title": "Low of Net-Present Value"
            }
        ];
        expect(appStructureController.appStructure.PostProcessingOutputsForPortfolio).not.toBe(undefined);
        expect(appStructureController.appStructure.PostProcessingOutputsForPortfolio).toEqual(postProcessing);
        expect(appStructureController.postProcessing).toEqual(postProcessing);
    });

    it("appstructure should have menu items", function () {
        //TODO: confirm the context with Somik
        var menu = appStructureController.appStructure.MENU;
        expect(menu.length).toBe(15);
        // var expected = [
        //     {
        //         "Command": "INPUT_SCREEN",
        //         "UsePostProcessingOutputs": false,
        //         "Display": "Development Success",
        //         "Parameters": {
        //             "InputKeys": [
        //                 "Inputs_pValueProp",
        //                 "Inputs_pProductize",
        //                 "Inputs_pScale"
        //             ]
        //         },
        //         "ID": "devSuccess",
        //         "Visible": true
        //     },
        //     {
        //         "Command": "INPUT_SCREEN",
        //         "UsePostProcessingOutputs": false,
        //         "Display": "Cost & Schedule",
        //         "Parameters": {
        //             "InputKeys": [
        //                 "Inputs_baseYear",
        //                 "Inputs_timeToStartPhase1",
        //                 "Inputs_annualCostOfPhase1",
        //                 "Inputs_durationPhase1",
        //                 "Inputs_annualCostOfPhase2",
        //                 "Inputs_durationPhase2",
        //                 "Inputs_annualCostOfPhase3",
        //                 "Inputs_durationPhase3"
        //             ]
        //         },
        //         "ID": "cost&Schedule"
        //     },
        //     {
        //         "Command": "INPUT_SCREEN",
        //         "UsePostProcessingOutputs": false,
        //         "Display": "Market Data",
        //         "Parameters": {
        //             "InputKeys": [
        //                 "Inputs_marketStartYear",
        //                 "Inputs_tam",
        //                 "Inputs_penetration",
        //                 "Inputs_unitsPerAccount"
        //             ]
        //         },
        //         "ID": "marketData"
        //     },
        //     {
        //         "Command": "INPUT_SCREEN",
        //         "UsePostProcessingOutputs": false,
        //         "Display": "Launch Data",
        //         "Parameters": {
        //             "InputKeys": [
        //                 "Inputs_rampDuration",
        //                 "Inputs_peakMarketShare",
        //                 "Inputs_peakMarketDuration"
        //             ]
        //         },
        //         "ID": "launchData"
        //     },
        //     {
        //         "Command": "INPUT_SCREEN",
        //         "UsePostProcessingOutputs": false,
        //         "Display": "Economics",
        //         "Parameters": {
        //             "InputKeys": [
        //                 "Inputs_costPerUnit",
        //                 "Inputs_salePricePerUnit",
        //                 "Inputs_annualCapitalCosts",
        //                 "Inputs_sgAndA",
        //                 "Inputs_oneTimeCapex"
        //             ]
        //         },
        //         "ID": "economics"
        //     },
        //     {
        //         "Command": "INPUT_SCREEN",
        //         "UsePostProcessingOutputs": false,
        //         "Display": "Other Information",
        //         "Parameters": {
        //             "InputKeys": [
        //                 "Inputs_shortTermGrowthRate",
        //                 "Inputs_shortTermGrowthDuration",
        //                 "Inputs_longTermGrowthRate",
        //                 "taxRate",
        //                 "discountRate"
        //             ]
        //         },
        //         "ID": "otherInformation"
        //     },
        //     {
        //         "Command": "IMAGE",
        //         "UsePostProcessingOutputs": false,
        //         "Display": "Development Plan",
        //         "Parameters": {
        //             "CellLink": "Development Plan!devPlan",
        //             "Type": "RANGE",
        //             "OutputKey": "devPlan"
        //         },
        //         "ID": "devPlan"
        //     },
        //     {
        //         "Command": "IMAGE",
        //         "UsePostProcessingOutputs": false,
        //         "Display": "Base Case Calculations",
        //         "Parameters": {
        //             "CellLink": "Calculations!calculations",
        //             "Type": "RANGE",
        //             "OutputKey": "calculations"
        //         },
        //         "ID": "baseCaseCalculations"
        //     },
        //     {
        //         "Command": "IMAGE",
        //         "UsePostProcessingOutputs": false,
        //         "Display": "Financial Statement",
        //         "Parameters": {
        //             "CellLink": "Calculations!financialStatement",
        //             "Type": "RANGE",
        //             "OutputKey": "financialStatement"
        //         },
        //         "ID": "financialStatement"
        //     },
        //     {
        //         "Command": "TABLE",
        //         "UsePostProcessingOutputs": false,
        //         "Display": "Base Case P&L",
        //         "Parameters": {
        //             "CellLink": "Calculations!pAndL",
        //             "OutputKey": "pAndL"
        //         },
        //         "ID": "pAndL"
        //     },
        //     {
        //         "Command": "TABLE",
        //         "UsePostProcessingOutputs": false,
        //         "Display": "Expected P&L",
        //         "Parameters": {
        //             "CellLink": "ExpectedPandL!expectedPandL",
        //             "OutputKey": "expectedPAndL"
        //         },
        //         "ID": "expectedPandL"
        //     },
        //     {
        //         "Command": "IMAGE",
        //         "UsePostProcessingOutputs": false,
        //         "Display": "Cash Flow",
        //         "Parameters": {
        //             "CellLink": "Calculations!Chart 8",
        //             "Type": "CHART",
        //             "OutputKey": "CashFlow"
        //         },
        //         "ID": "cashFlow"
        //     },
        //     {
        //         "Command": "TORNADODIST",
        //         "UsePostProcessingOutputs": false,
        //         "Display": "Tornado",
        //         "Parameters": {
        //             "ValueMetricKeys": [
        //                 "npvGivenOverallSuccess"
        //             ],
        //             "ChartTitle": "Tornado of Net-Present Value",
        //             "Depth": 3,
        //             "CombinedUncertaintyLabel": "Combined Uncertainty Range",
        //             "Weights": {
        //                 "High": 0.25,
        //                 "Med": 0.5,
        //                 "Low": 0.25
        //             }
        //         },
        //         "ID": "tornado"
        //     },
        //     {
        //         "Command": "IMAGE",
        //         "UsePostProcessingOutputs": false,
        //         "Display": "Waterfall",
        //         "Parameters": {
        //             "CellLink": "Waterfall!Chart 2",
        //             "Type": "CHART",
        //             "OutputKey": "Chart 2"
        //         },
        //         "ID": "waterfall"
        //     },
        //     {
        //         "Command": "IMAGE",
        //         "UsePostProcessingOutputs": true,
        //         "Display": "Summary Tree",
        //         "Parameters": {
        //             "CellLink": "Tree!tree",
        //             "Type": "RANGE",
        //             "OutputKey": "summaryTree"
        //         },
        //         "ID": "summaryTree"
        //     }
        // ];
        // expect(menu).toEqual(expected);
        var expectedMenu = new wizard.mocks.AccountDevTemplate().appStructure()["MENU"];
        expect(menu).toEqual(expectedMenu);
    });

    it("should select the first menu item on load", function () {
        var firstMenuItem = {
            "Command": "INPUT_SCREEN",
            "UsePostProcessingOutputs": false,
            "Display": "Development Success",
            "Parameters": {
                "InputKeys": [
                    "Inputs_pValueProp",
                    "Inputs_pProductize",
                    "Inputs_pScale"
                ]
            },
            "ID": "devSuccess",
            "Visible": true
        };
        expect(appStructureController.selectedMenu).toEqual(firstMenuItem);
    });

    it("should get charts properly", function () {
        var charts = [{
            "ChartName": "Calculations!Chart 1",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_29147.png"
        }, {
            "ChartName": "Calculations!Chart 8",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_54094.png"
        }, {
            "ChartName": "Waterfall!Chart 2",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_91514.png"
        }];
        expect(appStructureController.charts).toEqual(charts);
    });

    it("should get potential table outputs properly", function () {
        var potentialTables = [{
            "Table": [[0, 12, 37, 62, 87, 100, 100, 100, 100, 100, 100, 100, 50, 0, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!accountsAcquired",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_21824.png"
        }, {
            "Table": [[0, 0, 37, 62, 87, 100, 100, 100, 100, 100, 100, 100, 50, 0, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!annualCapital",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_55741.png"
        }, {
            "Table": [[0, 27, 90, 166, 242, 287, 299, 311, 323, 336, 350, 364, 189, 0, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!annualRevenues",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_45019.png"
        }, {
            "Table": [[0, 4, 13, 24, 36, 43, 44, 46, 48, 50, 52, 54, 28, 0, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!annualSGandA",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_34298.png"
        }, {
            "Table": [[2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!annualUnitsPerAccount",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_23576.png"
        }, {
            "Table": [[500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!availableMarketAccounts",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_12854.png"
        }, {
            "Table": [["Example Calculation in a Mature Year, 2020", "", ""], ["", "", ""], ["Market Size Assessed", 5000, "accounts"], ["Penetration", 0, ""], ["Available Market Accounts", 500, "accounts"], ["Market Share", 0, ""], ["Accounts Acquired", 100, "accounts"], ["Units Acquired", 323.87, "million units"], ["Unit Revenues", 323.87, "million dollars"], ["Unit Costs", 64.77, "million dollars"], ["Operating Profit", 259.1, "million dollars"], ["Annual Capital Costs", 100, "million dollars"], ["Annual SG&A", 48.58, "million dollars"], ["One time Capex Costs in 2020", 12.46, "million dollars"], ["Net Profit Before Taxes", 98.06, "million dollars"], ["Taxes", 34.32, "million dollars"], ["Net Profit in 2020", 63.74, "million dollars"]],
            "CellLink": "Calculations!calculations",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_2132.png"
        }, {
            "Table": [[0, 27, 63, 75, 75, 45, 11, 11, 12, 12, 13, 14, 0, 0, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!capex",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_14606.png"
        }, {
            "Table": [[2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032]],
            "CellLink": "Tree!costYear",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_48523.png"
        }, {
            "Table": [["", "", "", "", "", "", ""], ["", "Phase", "Description", "Investment ($M)", "Duration in years", "Probability of Success", ""], ["", 1, "Demonstrate Value Proposition", 0, 0, 0, ""], ["", 2, "Productize", 0, 0, 0, ""], ["", 3, "Scale", 0, 0, 0, ""], ["", "", "", "", "", "", ""], ["", "", "", "Total Potential Investment ($M)", "Total Duration ", "Overall probability of success", ""], ["", "", "", 1, 1, 0, ""], ["", "", "", "", "", "", ""], ["", "", "", "", "Mean Investment ($M)", "", ""], ["", "", "", "", 0, "", ""], ["", "", "", "", "", "", ""]],
            "CellLink": "'Development Plan'!devPlan",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_37801.png"
        }, {
            "Table": [["", 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, "", "", "", "", "", "", "", ""], ["Revenues", 0.0, 5.78, 19.06, 34.94, 50.87, 60.46, 62.88, 65.4, 68.01, 70.73, 73.56, 76.51, 39.78, 0.0, "", "", "", "", "", "", "", ""], ["Operating Costs", 0.0, 7.8, 27.83, 41.23, 52.11, 51.76, 45.43, 46.4, 47.42, 48.48, 49.58, 50.72, 24.42, 0.0, "", "", "", "", "", "", "", ""], ["Development Costs", 0.19, 0.08, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, "", "", "", "", "", "", "", ""], ["Net Profit Before Taxes", -0.19, -2.1, -8.77, -6.3, -1.24, 8.71, 17.45, 18.99, 20.59, 22.26, 23.99, 25.79, 15.36, 0.0, "", "", "", "", "", "", "", ""], ["Taxes", -0.07, -0.73, -3.07, -2.2, -0.43, 3.05, 6.11, 6.65, 7.21, 7.79, 8.4, 9.03, 5.38, 0.0, "", "", "", "", "", "", "", ""], ["Cash Flow", -0.12, -1.36, -5.7, -4.09, -0.81, 5.66, 11.35, 12.35, 13.39, 14.47, 15.59, 16.76, 9.98, 0.0, "", "", "", "", "", "", "", ""]],
            "CellLink": "ExpectedPandL!expectedPandL",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_84192.png"
        }, {
            "Table": [["", "", 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, "", "", "", "", "", "", ""], ["Market Growth Rate", "fraction", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "", "", "", "", "", "", ""], ["Units/Account", "million units/account", 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, "", "", "", "", "", "", ""], ["Market Size", "accounts/year", 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, "", "", "", "", "", "", ""], ["Available Market Accounts", "accounts/year", 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, "", "", "", "", "", "", ""], ["Market Share", "fraction", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "", "", "", "", "", "", ""], ["Accounts Acquired", "accounts/year", 0, 12, 37, 62, 87, 100, 100, 100, 100, 100, 100, 100, 50, 0, "", "", "", "", "", "", ""], ["Units Acquired", "million units/year", 0, 27, 90, 166, 242, 287, 299, 311, 323, 336, 350, 364, 189, 0, "", "", "", "", "", "", ""], ["Unit Revenues", "million dollars/year", 0, 27, 90, 166, 242, 287, 299, 311, 323, 336, 350, 364, 189, 0, "", "", "", "", "", "", ""], ["Unit Costs", "million dollars/year", 0, 5, 18, 33, 48, 57, 59, 62, 64, 67, 70, 72, 37, 0, "", "", "", "", "", "", ""], ["Annual Capital Costs", "million dollars/year", 0, 0, 37, 62, 87, 100, 100, 100, 100, 100, 100, 100, 50, 0, "", "", "", "", "", "", ""], ["Annual SG&A", "million dollars/year", 0, 4, 13, 24, 36, 43, 44, 46, 48, 50, 52, 54, 28, 0, "", "", "", "", "", "", ""], ["One time Capex Costs", "million dollars/year", 0, 27, 63, 75, 75, 45, 11, 11, 12, 12, 13, 14, 0, 0, "", "", "", "", "", "", ""], ["Development Costs", "million dollars/year", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "", "", "", "", "", "", ""], ["Net Profit Before Taxes", "million dollars/year", 0, -9, -41, -29, -5, 41, 83, 90, 98, 105, 114, 122, 73, 0, "", "", "", "", "", "", ""], ["Taxes", "million dollars/year", 0, -3, -14, -10, -2, 14, 29, 31, 34, 37, 39, 42, 25, 0, "", "", "", "", "", "", ""], ["Net Profit", "million dollars/year", 0, -6, -27, -19, -3, 26, 54, 58, 63, 68, 74, 79, 47, 0, "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["NPV", "million dollars", 147, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!financialStatement",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_168.png"
        }, {
            "Table": [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!marketGrowthRate",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_16145.png"
        }, {
            "Table": [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!marketShare",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_5423.png"
        }, {
            "Table": [[5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!marketSize",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_94701.png"
        }, {
            "Table": [[0, -6, -27, -19, -3, 26, 54, 58, 63, 68, 74, 79, 47, 0, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!netProfit",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_39340.png"
        }, {
            "Table": [[0, -9, -41, -29, -5, 41, 83, 90, 98, 105, 114, 122, 73, 0, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!netProfitBeforeTaxes",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_73257.png"
        }, {
            "Table": [["", 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, "", "", "", "", "", "", "", "", ""], ["Revenues", 0.0, 5.78, 19.06, 34.94, 50.87, 60.46, 62.88, 65.4, 68.01, 70.73, 73.56, 76.51, 39.78, 0.0, "", "", "", "", "", "", "", "", ""], ["Operating Costs", 0.0, 7.8, 27.83, 41.23, 52.11, 51.76, 45.43, 46.4, 47.42, 48.48, 49.58, 50.72, 24.42, 0.0, "", "", "", "", "", "", "", "", ""], ["Development Costs", 0.19, 0.08, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, "", "", "", "", "", "", "", "", ""], ["Net Profit Before Taxes", -0.19, -2.1, -8.77, -6.3, -1.24, 8.71, 17.45, 18.99, 20.59, 22.26, 23.99, 25.79, 15.36, 0.0, "", "", "", "", "", "", "", "", ""], ["Taxes", -0.07, -0.73, -3.07, -2.2, -0.43, 3.05, 6.11, 6.65, 7.21, 7.79, 8.4, 9.03, 5.38, 0.0, "", "", "", "", "", "", "", "", ""], ["Cash Flow", -0.12, -1.36, -5.7, -4.09, -0.81, 5.66, 11.35, 12.35, 13.39, 14.47, 15.59, 16.76, 9.98, 0.0, "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]],
            "CellLink": "ExpectedPandL!ExpectedPandL!pAndL",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_30370.png"
        }, {
            "Table": [["", 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, "", "", "", "", "", "", "", "", ""], ["Revenues", 0.0, 27.5, 90.75, 166.38, 242.24, 287.92, 299.44, 311.42, 323.87, 336.83, 350.3, 364.31, 189.44, 0.0, "", "", "", "", "", "", "", "", ""], ["Operating Costs", 0.0, 37.12, 132.51, 196.36, 248.15, 246.45, 216.32, 220.97, 225.81, 230.84, 236.08, 241.52, 116.3, 0.0, "", "", "", "", "", "", "", "", ""], ["Development Costs", 0.25, 0.25, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, "", "", "", "", "", "", "", "", ""], ["Net Profit Before Taxes", -0.25, -9.88, -41.76, -29.98, -5.91, 41.47, 83.12, 90.44, 98.06, 105.98, 114.22, 122.79, 73.14, 0.0, "", "", "", "", "", "", "", "", ""], ["Taxes", -0.09, -3.46, -14.62, -10.49, -2.07, 14.51, 29.09, 31.66, 34.32, 37.09, 39.98, 42.98, 25.6, 0.0, "", "", "", "", "", "", "", "", ""], ["Cash Flow", -0.16, -6.42, -27.15, -19.49, -3.84, 26.96, 54.03, 58.79, 63.74, 68.89, 74.24, 79.81, 47.54, 0.0, "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["NPV", 147.64, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]],
            "CellLink": "PandL!pAndL",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_80264.png"
        }, {
            "Table": [[0, -3, -14, -10, -2, 14, 29, 31, 34, 37, 39, 42, 25, 0, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!taxes",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_96241.png"
        }, {
            "Table": [[0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
            "CellLink": "Calculations!timeprofile",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_30158.png"
        }, {
            "Table": [["", "Expected Project Value", "", "", -0.09, "million dollars", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "Project Cost Given Dev Success", "", "", 0.28, "million dollars", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "Expected Project Cost", "", "", 0.15, "million dollars", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "Probability of Dev Success", "", "", 0.21, "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "Value Given Success", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "High", 0.0, "million dollars", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "Medium", 0.0, "million dollars", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "Low", 0.0, "million dollars", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "Expected", 0.0, "million dollars", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "Investment Productivity", "", "", -0.61, "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "Commercial ", "", "Project", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "Contribution", "", "Cost", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "High", 0.0, "=", 0.28, "-", 0.28, "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", 0.21, "Med", 0.0, "=", 0.28, "-", 0.28, "", "", "", "", "", "", "", ""], ["", "", "", "", "Succeed", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "Go", "", "Low", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", 0.0, "=", 0.28, "-", 0.28, "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", 0.79, "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "Fail", "", -0.12, "=", 0.0, "-", 0.12, "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "No Go", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", 0, "=", 0.0, "-", 0.0, "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "NPV of Value Prop Phase", "", "", 0.06, "million dollars", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "NPV of Productize Phase", "", "", 0.09, "million dollars", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "NPV of Scale Phase", "", "", 0.13, "million dollars", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "Expected Project Cost", "", "", 0.15, "million dollars", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "NPV of Cost", "", "", 0.28, "million dollars", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "Expected Cost of Failure", "", "", -0.09, "million dollars", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029], ["Phase 1", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ["Phase 2", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ["Phase 3", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ["Total Cost", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ["NPV of Cost", "", 0.28, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["NPV of Phase1", "", 0.06, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["NPV of Phase 2", "", 0.09, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["NPV of Phsae 3", "", 0.13, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["NPV Cost if Fail", "", 0.12, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["startphase1", 2012, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["startphase2", 2012, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["startphase3", 2013, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]],
            "CellLink": "Tree!tree",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_76548.png"
        }, {
            "Table": [[0, 5, 18, 33, 48, 57, 59, 62, 64, 67, 70, 72, 37, 0, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!unitCosts",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_40667.png"
        }, {
            "Table": [[0, 27, 90, 166, 242, 287, 299, 311, 323, 336, 350, 364, 189, 0, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!unitsAcquired",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_29946.png"
        }, {
            "Table": [[2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!year",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_87058.png"
        }];
        expect(appStructureController.potentialTables.length).toBe(25);
        expect(appStructureController.potentialTables).toEqual(potentialTables);
    });

    describe("when initialized", function () {
        var accountDevDS = new wizard.mocks.AccountDevTemplate().dataStructure();
        var inputs = accountDevDS["Inputs"];
        var outputs = accountDevDS["Outputs"];
        it("should get the datastructure correctly", function () {
            var tableInputs = [];
            var tornadoOutputs = [{
                UsePostProcessingOutputs: true,
                CellLink: 'Tree!expectedValue',
                Key: 'avgValue',
                Units: 'Millions of dollars',
                CellLinkAbbr: 'Tree!expected',
                Display: 'Expected Value'
            }];

            expect(appStructureController.inputs).toEqual(inputs);
            expect(appStructureController.outputs).toEqual(outputs);
            expect(appStructureController.allDataStructureComponents).toEqual(inputs + outputs);
            expect(appStructureController.tableInputs).toEqual([]);
            expect(appStructureController.tornadoOutputs).toEqual(tornadoOutputs);
        });
        describe("even when empty", function () {
            beforeEach(inject(function ($controller, $rootScope, $injector, $routeParams, $templateCache, $location, $q) {
                var appStructure = {
                    "commands": [{
                        "name": "Data",
                        "paramCount": "2",
                        "parameters": [{
                            "name": "appStructureFor",
                            "value": new wizard.mocks.EncodedTemplatePiece(new wizard.mocks.AccountDevTemplateWithNoMenu()).encodedAppStructure()
                        }, {"name": "status", "value": "1"}]
                    }], "context": {}
                };
                httpBackend.when('GET', 'https://localhost/kirk/wizard/main?command=GetAppStructure&kreds=fakeCredentials&templateName=accountDev&isPlatform=false'
                ).respond(appStructure);
                scope = $rootScope.$new();
                var huashan = $injector.get('HUASHAN');
                console.log(huashan);
                var Session = $injector.get("Session");
                Session.create("fakeCredentials");
                var $cookies = $injector.get("$cookies");
                $cookies.huashansession = "fakeCredentials";
                controller = $controller;
                httpBackend.expect('GET', 'https://localhost/kirk/wizard/main?command=GetAppStructure&kreds=fakeCredentials&templateName=accountDev&isPlatform=false');
                httpBackend.expect('GET', 'https://localhost/kirk/wizard/main?command=GetPotentialTables&kreds=fakeCredentials&templateName=accountDev');
                httpBackend.expect('GET', 'https://localhost/kirk/wizard/main?command=GetCharts&kreds=fakeCredentials&templateName=accountDev');
                httpBackend.expect('GET', 'https://localhost/kirk/wizard/main?command=GetDataStructure&kreds=fakeCredentials&templateName=accountDev&isPlatform=false');
                $routeParams.templateID = "accountDev";
                $location.path('/appstructure/accountDev');
                $rootScope.$digest();
                appStructureController = controller('AppStructureController', {
                    $scope: scope,
                    $routeParams: {templateID: "accountDev"}
                });
                flush();
                expect(appStructureController).not.toBe(undefined);

            }));
        });
        it("even when menu is empty, should get the datastructure correctly", function () {
            expect(appStructureController).not.toBe(undefined);
            var tableInputs = [];
            var tornadoOutputs = [{
                UsePostProcessingOutputs: true,
                CellLink: 'Tree!expectedValue',
                Key: 'avgValue',
                Units: 'Millions of dollars',
                CellLinkAbbr: 'Tree!expected',
                Display: 'Expected Value'
            }];
            expect(appStructureController.inputs).toEqual(inputs);
            expect(appStructureController.outputs).toEqual(outputs);
            expect(appStructureController.allDataStructureComponents).toEqual(inputs + outputs);
            expect(appStructureController.tableInputs).toEqual([]);
            expect(appStructureController.tornadoOutputs).toEqual(tornadoOutputs);
        });

    });

    it("should get excluded inputs properly", function () {
        expect(appStructureController.excludedInputs).toEqual([]);
    });

    it("when select a menu item, should assign corresponding variables properly", function () {
        var menu = {
            "Command": "IMAGE",
            "UsePostProcessingOutputs": false,
            "Display": "Waterfall",
            "Parameters": {
                "CellLink": "Waterfall!Chart 2",
                "Type": "CHART",
                "OutputKey": "Chart 2"
            },
            "ID": "waterfall"
        };
        appStructureController.selectMenu(menu);
        var selectedImageChart = {
            "ChartName": "Waterfall!Chart 2",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_91514.png"
        };
        expect(appStructureController.selectedImageChart).toEqual(selectedImageChart);

        menu = {
            "Command": "TABLE",
            "UsePostProcessingOutputs": false,
            "Display": "Expected P&L",
            "Parameters": {
                "CellLink": "ExpectedPandL!expectedPandL",
                "OutputKey": "expectedPAndL"
            },
            "ID": "expectedPandL"
        };
        appStructureController.selectMenu(menu);
        var selectedTable = {
            "Table": [
                ["", 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, "", "", "", "", "", "", "", ""],
                ["Revenues", 0.0, 5.78, 19.06, 34.94, 50.87, 60.46, 62.88, 65.4, 68.01, 70.73, 73.56, 76.51, 39.78, 0.0, "", "", "", "", "", "", "", ""],
                ["Operating Costs", 0.0, 7.8, 27.83, 41.23, 52.11, 51.76, 45.43, 46.4, 47.42, 48.48, 49.58, 50.72, 24.42, 0.0, "", "", "", "", "", "", "", ""],
                ["Development Costs", 0.19, 0.08, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, "", "", "", "", "", "", "", ""],
                ["Net Profit Before Taxes", -0.19, -2.1, -8.77, -6.3, -1.24, 8.71, 17.45, 18.99, 20.59, 22.26, 23.99, 25.79, 15.36, 0.0, "", "", "", "", "", "", "", ""],
                ["Taxes", -0.07, -0.73, -3.07, -2.2, -0.43, 3.05, 6.11, 6.65, 7.21, 7.79, 8.4, 9.03, 5.38, 0.0, "", "", "", "", "", "", "", ""],
                ["Cash Flow", -0.12, -1.36, -5.7, -4.09, -0.81, 5.66, 11.35, 12.35, 13.39, 14.47, 15.59, 16.76, 9.98, 0.0, "", "", "", "", "", "", "", ""]],
            "CellLink": "ExpectedPandL!expectedPandL",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_84192.png"
        };
        expect(appStructureController.selectedPotentialTable).toEqual(selectedTable);

        var menu = {
            "Command": "IMAGE",
            "UsePostProcessingOutputs": false,
            "Display": "Financial Statement",
            "Parameters": {
                "CellLink": "Calculations!financialStatement",
                "Type": "RANGE",
                "OutputKey": "financialStatement"
            },
            "ID": "financialStatement"
        };
        appStructureController.selectMenu(menu);
        var selectedImageTable = {
            "Table": [
                ["", "", 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, "", "", "", "", "", "", ""],
                ["Market Growth Rate", "fraction", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "", "", "", "", "", "", ""],
                ["Units/Account", "million units/account", 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, "", "", "", "", "", "", ""],
                ["Market Size", "accounts/year", 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, "", "", "", "", "", "", ""],
                ["Available Market Accounts", "accounts/year", 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, "", "", "", "", "", "", ""],
                ["Market Share", "fraction", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "", "", "", "", "", "", ""],
                ["Accounts Acquired", "accounts/year", 0, 12, 37, 62, 87, 100, 100, 100, 100, 100, 100, 100, 50, 0, "", "", "", "", "", "", ""],
                ["Units Acquired", "million units/year", 0, 27, 90, 166, 242, 287, 299, 311, 323, 336, 350, 364, 189, 0, "", "", "", "", "", "", ""],
                ["Unit Revenues", "million dollars/year", 0, 27, 90, 166, 242, 287, 299, 311, 323, 336, 350, 364, 189, 0, "", "", "", "", "", "", ""],
                ["Unit Costs", "million dollars/year", 0, 5, 18, 33, 48, 57, 59, 62, 64, 67, 70, 72, 37, 0, "", "", "", "", "", "", ""],
                ["Annual Capital Costs", "million dollars/year", 0, 0, 37, 62, 87, 100, 100, 100, 100, 100, 100, 100, 50, 0, "", "", "", "", "", "", ""],
                ["Annual SG&A", "million dollars/year", 0, 4, 13, 24, 36, 43, 44, 46, 48, 50, 52, 54, 28, 0, "", "", "", "", "", "", ""],
                ["One time Capex Costs", "million dollars/year", 0, 27, 63, 75, 75, 45, 11, 11, 12, 12, 13, 14, 0, 0, "", "", "", "", "", "", ""],
                ["Development Costs", "million dollars/year", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "", "", "", "", "", "", ""],
                ["Net Profit Before Taxes", "million dollars/year", 0, -9, -41, -29, -5, 41, 83, 90, 98, 105, 114, 122, 73, 0, "", "", "", "", "", "", ""],
                ["Taxes", "million dollars/year", 0, -3, -14, -10, -2, 14, 29, 31, 34, 37, 39, 42, 25, 0, "", "", "", "", "", "", ""],
                ["Net Profit", "million dollars/year", 0, -6, -27, -19, -3, 26, 54, 58, 63, 68, 74, 79, 47, 0, "", "", "", "", "", "", ""],
                ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
                ["NPV", "million dollars", 147, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]
            ],
            "CellLink": "Calculations!financialStatement",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_168.png"
        };
        expect(appStructureController.selectedImageTable).toEqual(selectedImageTable);
    });

    it("when select a table for an ADD_TABLES in platform app structure, should assign parameters of selected menu properly", function () {
        var menu = {
            "Command": "ADD_TABLES",
            "ID": "addPNL",
            "Parameters": {
                "NodeLookup": "Outputs",
                "Pnl": true,
                "Key": "expectedPAndL"
            },
            "Display": "Expected P&L"
        };
        appStructureController.selectMenu(menu);
        var table = {
            "Command": "TABLE",
            "UsePostProcessingOutputs": false,
            "Display": "Expected P&L",
            "Parameters": {
                "CellLink": "ExpectedPandL!expectedPandL",
                "OutputKey": "expectedPAndL",
            },
            "ID": "expectedPandL"
        }

        appStructureController.selectTable(table);
        expect(appStructureController.selectedTable).toEqual(table);
        expect(appStructureController.selectedMenu.Parameters.NodeLookup).toBe("Outputs");
        expect(appStructureController.selectedMenu.Parameters.Pnl).toBe(true);
        expect(appStructureController.selectedMenu.Parameters.Key).toBe("expectedPAndL");
        expect(appStructureController.selectedMenu.ID).toBe("addPNL");
    });

    it("when select a image table, should assign parameters of selected menu properly", function () {
        var imageTable = {
            "Table": [
                ["", "", 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, "", "", "", "", "", "", ""],
                ["Market Growth Rate", "fraction", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "", "", "", "", "", "", ""],
                ["Units/Account", "million units/account", 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, "", "", "", "", "", "", ""],
                ["Market Size", "accounts/year", 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, "", "", "", "", "", "", ""],
                ["Available Market Accounts", "accounts/year", 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, "", "", "", "", "", "", ""],
                ["Market Share", "fraction", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "", "", "", "", "", "", ""],
                ["Accounts Acquired", "accounts/year", 0, 12, 37, 62, 87, 100, 100, 100, 100, 100, 100, 100, 50, 0, "", "", "", "", "", "", ""],
                ["Units Acquired", "million units/year", 0, 27, 90, 166, 242, 287, 299, 311, 323, 336, 350, 364, 189, 0, "", "", "", "", "", "", ""],
                ["Unit Revenues", "million dollars/year", 0, 27, 90, 166, 242, 287, 299, 311, 323, 336, 350, 364, 189, 0, "", "", "", "", "", "", ""],
                ["Unit Costs", "million dollars/year", 0, 5, 18, 33, 48, 57, 59, 62, 64, 67, 70, 72, 37, 0, "", "", "", "", "", "", ""],
                ["Annual Capital Costs", "million dollars/year", 0, 0, 37, 62, 87, 100, 100, 100, 100, 100, 100, 100, 50, 0, "", "", "", "", "", "", ""],
                ["Annual SG&A", "million dollars/year", 0, 4, 13, 24, 36, 43, 44, 46, 48, 50, 52, 54, 28, 0, "", "", "", "", "", "", ""],
                ["One time Capex Costs", "million dollars/year", 0, 27, 63, 75, 75, 45, 11, 11, 12, 12, 13, 14, 0, 0, "", "", "", "", "", "", ""],
                ["Development Costs", "million dollars/year", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "", "", "", "", "", "", ""],
                ["Net Profit Before Taxes", "million dollars/year", 0, -9, -41, -29, -5, 41, 83, 90, 98, 105, 114, 122, 73, 0, "", "", "", "", "", "", ""],
                ["Taxes", "million dollars/year", 0, -3, -14, -10, -2, 14, 29, 31, 34, 37, 39, 42, 25, 0, "", "", "", "", "", "", ""],
                ["Net Profit", "million dollars/year", 0, -6, -27, -19, -3, 26, 54, 58, 63, 68, 74, 79, 47, 0, "", "", "", "", "", "", ""],
                ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
                ["NPV", "million dollars", 147, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]
            ],
            "CellLink": "Calculations!financialStatement",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_168.png"
        };
        appStructureController.selectImageTable(imageTable);
        expect(appStructureController.selectedImageTable).toEqual(imageTable);
        expect(appStructureController.selectedMenu.Parameters.CellLink).toBe("Calculations!financialStatement");
        expect(appStructureController.selectedMenu.Parameters.OutputKey).toBe("financialStatement");
        expect(appStructureController.selectedMenu.ID).toBe("financialStatementCalculations");
    });

    it("when select an image table with quotes in cell link, should assign parameters of selected menu properly", function () {
        var imageTable = {
            "Table": [
                ["", "", 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, "", "", "", "", "", "", ""],
                ["Market Growth Rate", "fraction", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "", "", "", "", "", "", ""],
                ["Units/Account", "million units/account", 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, "", "", "", "", "", "", ""],
                ["Market Size", "accounts/year", 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, "", "", "", "", "", "", ""],
                ["Available Market Accounts", "accounts/year", 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, "", "", "", "", "", "", ""],
                ["Market Share", "fraction", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "", "", "", "", "", "", ""],
                ["Accounts Acquired", "accounts/year", 0, 12, 37, 62, 87, 100, 100, 100, 100, 100, 100, 100, 50, 0, "", "", "", "", "", "", ""],
                ["Units Acquired", "million units/year", 0, 27, 90, 166, 242, 287, 299, 311, 323, 336, 350, 364, 189, 0, "", "", "", "", "", "", ""],
                ["Unit Revenues", "million dollars/year", 0, 27, 90, 166, 242, 287, 299, 311, 323, 336, 350, 364, 189, 0, "", "", "", "", "", "", ""],
                ["Unit Costs", "million dollars/year", 0, 5, 18, 33, 48, 57, 59, 62, 64, 67, 70, 72, 37, 0, "", "", "", "", "", "", ""],
                ["Annual Capital Costs", "million dollars/year", 0, 0, 37, 62, 87, 100, 100, 100, 100, 100, 100, 100, 50, 0, "", "", "", "", "", "", ""],
                ["Annual SG&A", "million dollars/year", 0, 4, 13, 24, 36, 43, 44, 46, 48, 50, 52, 54, 28, 0, "", "", "", "", "", "", ""],
                ["One time Capex Costs", "million dollars/year", 0, 27, 63, 75, 75, 45, 11, 11, 12, 12, 13, 14, 0, 0, "", "", "", "", "", "", ""],
                ["Development Costs", "million dollars/year", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "", "", "", "", "", "", ""],
                ["Net Profit Before Taxes", "million dollars/year", 0, -9, -41, -29, -5, 41, 83, 90, 98, 105, 114, 122, 73, 0, "", "", "", "", "", "", ""],
                ["Taxes", "million dollars/year", 0, -3, -14, -10, -2, 14, 29, 31, 34, 37, 39, 42, 25, 0, "", "", "", "", "", "", ""],
                ["Net Profit", "million dollars/year", 0, -6, -27, -19, -3, 26, 54, 58, 63, 68, 74, 79, 47, 0, "", "", "", "", "", "", ""],
                ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
                ["NPV", "million dollars", 147, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]
            ],
            "CellLink": "'Fantastic Application'!calculations",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_168.png"
        };
        appStructureController.selectImageTable(imageTable);
        expect(appStructureController.selectedImageTable).toEqual(imageTable);
        expect(appStructureController.selectedMenu.Parameters.CellLink).toBe("'Fantastic Application'!calculations");
        expect(appStructureController.selectedMenu.Parameters.OutputKey).toBe("calculations");
        expect(appStructureController.selectedMenu.ID).toBe("calculationsFantastic Application");
    });

    it("when select a image chart, should assign parameters of selected menu properly", function () {
        var imageChart = {
            "ChartName": "Waterfall!Chart 2",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_91514.png"
        };
        appStructureController.selectImageChart(imageChart);
        expect(appStructureController.selectedImageChart).toEqual(imageChart);
        expect(appStructureController.selectedMenu.Parameters.CellLink).toBe("Waterfall!Chart 2");
        expect(appStructureController.selectedMenu.Parameters.OutputKey).toBe("Chart 2");
        expect(appStructureController.selectedMenu.ID).toBe("Chart 2Waterfall");
    });

    it("when selecting an image, should assign parameters of selected menu properly", function () {
        var imageChart = {
            "ChartName": "'Fantastic Application'!calculations",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_91514.png"
        };
        appStructureController.selectImageChart(imageChart);
        expect(appStructureController.selectedImageChart).toEqual(imageChart);
        expect(appStructureController.selectedMenu.Parameters.CellLink).toBe("'Fantastic Application'!calculations");
        expect(appStructureController.selectedMenu.Parameters.OutputKey).toBe("calculations");
        expect(appStructureController.selectedMenu.ID).toBe("calculationsFantastic Application");
    });

    it("should check whether tornado weights sum up to 1", function () {
        var result = appStructureController.checkTornadoWeights();
        expect(result).toBe(true);
        appStructureController.appStructure.MENU[12].Parameters.Weights.High = 0;
        result = appStructureController.checkTornadoWeights();
        expect(result).toBe(false);

    });

    describe("make ID from name", function () {
        it("regular sheet name", function () {
            var actual = appStructureController.makeIDfrom("ABC!Ghi");
            expect(actual).toEqual("GhiABC");
        })
        it("double quoted sheet name", function () {
            var actual = appStructureController.makeIDfrom("'ABC DEF'!Ghi");
            expect(actual).toEqual("GhiABC DEF");
        })

        //TODO: need figure out a way do not affect others when saveWithoutBlank
        // it("should not make same ID with IDs in appStructure.MENU", function () {
        //     // this test is to cover Generates same ID bug, pivotal#142413891
        //     appStructureController.makeNewAppStructureAndAddIt("EEEE", "TABLE");
        //     var table = {
        //         "Table": [["", 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038, 2039, 2040], ["Market Size", 420, 462, 508.2, 559.02, 581.3808, 604.636032, 628.82147328, 653.9743322112, 680.133305499648, 707.338637719634, 735.632183228419, 765.057470557556, 795.659769379859, 827.486160155053, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ["Available Penetrated Market", 42, 46.2, 50.82, 55.902, 58.13808, 60.4636032, 62.882147328, 65.39743322112, 68.0133305499648, 70.7338637719634, 73.5632183228419, 76.5057470557556, 79.5659769379859, 82.7486160155053, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ["Market Share", 0, 0, 0, 0.0139953348883705, 0.0279906697767411, 0.0419860046651116, 0.042, 0.042, 0.042, 0.042, 0.042, 0.042, 0.042, 0.042, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ["Revenues", 0, 0, 0, 3.72555814728424, 7.74916094635122, 12.0886910763079, 12.5764294656, 13.079486644224, 13.602666109993, 14.1467727543927, 14.7126436645684, 15.3011494111511, 15.9131953875972, 16.5497232031011, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ["Costs", 0, 0, 0, 2.60789070309897, 5.42441266244585, 8.46208375341553, 8.80350062592, 9.1556406509568, 9.52186627699507, 9.90274092807488, 10.2988505651979, 10.7108045878058, 11.139236771318, 11.5848062421707, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ["Annual SG&A", 0, 0, 0, 0.558833722092636, 1.16237414195268, 1.81330366144618, 1.88646441984, 1.9619229966336, 2.04039991649894, 2.1220159131589, 2.20689654968526, 2.29517241167267, 2.38697930813958, 2.48245848046516, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ["Launch Costs", 0, 0, 1.05, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ["Net Profit Before Taxes", -0.021, -0.0315, -1.1025, 0.558833722092636, 1.16237414195268, 1.81330366144619, 1.88646441984, 1.9619229966336, 2.04039991649894, 2.1220159131589, 2.20689654968526, 2.29517241167267, 2.38697930813958, 2.48245848046516, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ["Taxes", 0, 0, 0, 0.195591802732423, 0.406830949683439, 0.634656281506165, 0.660262546944, 0.686673048821761, 0.71413997077463, 0.742705569605616, 0.772413792389841, 0.803310344085434, 0.835442757848852, 0.868860468162806, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ["Net Profit", -0.021, -0.0315, -1.1025, 0.363241919360213, 0.755543192269244, 1.17864737994002, 1.226201872896, 1.27524994781184, 1.32625994572431, 1.37931034355329, 1.43448275729542, 1.49186206758724, 1.55153655029073, 1.61359801230235, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
        //         "CellLink": "PnL!expectedPNL",
        //         "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_1611765806.png",
        //         "$$hashKey": "3GY"
        //     }
        //     appStructureController.selectPotentialTable(table);
        //     appStructureController.saveWithoutBlank();
        //     var newID = appStructureController.makeIDfrom("PnL!expectedPNL");
        //     var newID2 = appStructureController.makeIDfrom("PnL!expectedPNL");
        //     expect(newID != newID2).toEqual(true);
        // })

    });

    it("should find an input element with a key", function () {
        var inputs = [
            {
                "Description": "probability assessment",
                "Val": "0.6",
                "Constraint": "double",
                "CellLink": "Inputs!pValueProp",
                "Key": "Inputs_pValueProp",
                "Inherited": false,
                "Units": "fraction",
                "CellLinkAbbr": "Inputs!pValueProp",
                "Type": "SCALAR",
                "Display": "Probability of Value Proposition Phase Succeeding"
            },
            {
                "Description": "probability assessment",
                "Val": "0.5",
                "Constraint": "double",
                "CellLink": "Inputs!pProductize",
                "Key": "Inputs_pProductize",
                "Inherited": false,
                "Units": "fraction",
                "CellLinkAbbr": "Inputs!pProductize",
                "Type": "SCALAR",
                "Display": "Probability of Productize Phase Succeeding"
            },
            {
                "Description": "probability assessment",
                "Val": "0.7",
                "Constraint": "double",
                "CellLink": "Inputs!pScale",
                "Key": "Inputs_pScale",
                "Inherited": false,
                "Units": "fraction",
                "CellLinkAbbr": "Inputs!pScale",
                "Type": "SCALAR",
                "Display": "Probability of Scale Phase Succeeding"
            },
            {
                "Description": "Year of project start",
                "Val": "2013",
                "Constraint": "double",
                "CellLink": "Inputs!baseYear",
                "Key": "Inputs_baseYear",
                "Inherited": false,
                "Units": "year",
                "CellLinkAbbr": "Inputs!baseYear",
                "Type": "SCALAR",
                "Display": "Base Year"
            },
            {
                "Description": "How much time from base year does it take to start the first phase",
                "Val": "0",
                "Constraint": "double",
                "CellLink": "Inputs!timeToStartPhase1",
                "Key": "Inputs_timeToStartPhase1",
                "Inherited": false,
                "Units": "years",
                "CellLinkAbbr": "Inputs!timeToStar...",
                "Type": "SCALAR",
                "Display": "Time to Start Value Proposition Phase"
            },
            {
                "Description": "What is the annualized cost of the Phase 1? This will be multiplied by the duration of Phase 1.",
                "Val": "0.2",
                "Constraint": "double",
                "CellLink": "Inputs!annCostPhase1",
                "Key": "Inputs_annualCostOfPhase1",
                "Inherited": false,
                "Units": "millions of dollars",
                "CellLinkAbbr": "Inputs!annualCost...",
                "Type": "SCALAR",
                "Display": "Annual Cost of Value Proposition Phase"
            },
            {
                "Description": "How long does Phase 1 last?",
                "Val": "0.5",
                "Constraint": "double",
                "CellLink": "Inputs!durationPhase1",
                "Key": "Inputs_durationPhase1",
                "Inherited": false,
                "Units": "years",
                "CellLinkAbbr": "Inputs!durationPh...",
                "Type": "SCALAR",
                "Display": "Duration of Value Proposition Phase"
            },
            {
                "Description": "What is the annualized cost of the Phase 1? This will be multiplied by the duration of Phase 2.",
                "Val": "0.3",
                "Constraint": "double",
                "CellLink": "Inputs!annCostPhase2",
                "Key": "Inputs_annualCostOfPhase2",
                "Inherited": false,
                "Units": "millions of dollars",
                "CellLinkAbbr": "Inputs!annualCost...",
                "Type": "SCALAR",
                "Display": "Annual Cost of Productize Phase"
            },
            {
                "Description": "How long does Phase 2 last?",
                "Val": "0.5",
                "Constraint": "double",
                "CellLink": "Inputs!durationPhase2",
                "Key": "Inputs_durationPhase2",
                "Inherited": false,
                "Units": "years",
                "CellLinkAbbr": "Inputs!durationPh...",
                "Type": "SCALAR",
                "Display": "Duration of Productize Phase"
            },
            {
                "Description": "What is the annualized cost of the Phase 1? This will be multiplied by the duration of Phase 3.",
                "Val": "0.5",
                "Constraint": "double",
                "CellLink": "Inputs!annCostPhase3",
                "Key": "Inputs_annualCostOfPhase3",
                "Inherited": false,
                "Units": "millions of dollars",
                "CellLinkAbbr": "Inputs!annualCost...",
                "Type": "SCALAR",
                "Display": "Annual Cost of Scale Phase"
            },
            {
                "Description": "How long does Phase 3 last?",
                "Val": "0.5",
                "Constraint": "double",
                "CellLink": "Inputs!durationPhase3",
                "Key": "Inputs_durationPhase3",
                "Inherited": false,
                "Units": "years",
                "CellLinkAbbr": "Inputs!durationPh...",
                "Type": "SCALAR",
                "Display": "Duration of Scale Phase"
            },
            {
                "Description": "Year in which market analysis begins",
                "Val": "2013",
                "Constraint": "year",
                "CellLink": "Inputs!marketStartYear",
                "Key": "Inputs_marketStartYear",
                "Inherited": false,
                "Units": "Year",
                "CellLinkAbbr": "Inputs!marketStar...",
                "Type": "SCALAR",
                "Display": "Market Start Year"
            },
            {
                "Description": "Number of accounts that are addressable",
                "Val": [
                    1000,
                    5000,
                    10000
                ],
                "Constraint": "integer",
                "CellLink": "Inputs!tam",
                "Key": "Inputs_tam",
                "Inherited": false,
                "Units": "accounts",
                "CellLinkAbbr": "Inputs!tam",
                "Type": "DISTRIBUTION",
                "Display": "Total Addressable Market"
            },
            {
                "Description": "The fraction of TAM that can be penetrated by an offering of this kind",
                "Val": [
                    0.05,
                    0.1,
                    0.15
                ],
                "Constraint": "double",
                "CellLink": "Inputs!penetration",
                "Key": "Inputs_penetration",
                "Inherited": false,
                "Units": "fraction",
                "CellLinkAbbr": "Inputs!penetration",
                "Type": "DISTRIBUTION",
                "Display": "Market Penetration"
            },
            {
                "Description": "Each account will involve units of product sold",
                "Val": [
                    1,
                    2,
                    5
                ],
                "Constraint": "double",
                "CellLink": "Inputs!unitsPerAccount",
                "Key": "Inputs_unitsPerAccount",
                "Inherited": false,
                "Units": "millions of units per account",
                "CellLinkAbbr": "Inputs!unitsPerAc...",
                "Type": "DISTRIBUTION",
                "Display": "Units per account"
            },
            {
                "Description": "How long does it take for market share to touch its peak value",
                "Val": [
                    2,
                    3,
                    4
                ],
                "Constraint": "integer",
                "CellLink": "Inputs!rampDuration",
                "Key": "Inputs_rampDuration",
                "Inherited": false,
                "Units": "years",
                "CellLinkAbbr": "Inputs!rampDuration",
                "Type": "DISTRIBUTION",
                "Display": "Ramp-Up Duration"
            },
            {
                "Description": "The market share at peak",
                "Val": [
                    0.1,
                    0.2,
                    0.3
                ],
                "Constraint": "double",
                "CellLink": "Inputs!peakMarketShare",
                "Key": "Inputs_peakMarketShare",
                "Inherited": false,
                "Units": "fraction",
                "CellLinkAbbr": "Inputs!peakMarket...",
                "Type": "DISTRIBUTION",
                "Display": "Peak Market Share"
            },
            {
                "Description": "The number of years that the peak market share lasts",
                "Val": [
                    5,
                    8,
                    10
                ],
                "Constraint": "integer",
                "CellLink": "Inputs!peakMarketDuration",
                "Key": "Inputs_peakMarketDuration",
                "Inherited": false,
                "Units": "years",
                "CellLinkAbbr": "Inputs!peakMarket...",
                "Type": "DISTRIBUTION",
                "Display": "Peak Market Duration"
            },
            {
                "Description": "The cost of each unit produced",
                "Val": [
                    0.1,
                    0.2,
                    0.3
                ],
                "Constraint": "double",
                "CellLink": "Inputs!costPerUnit",
                "Key": "Inputs_costPerUnit",
                "Inherited": false,
                "Units": "dollars",
                "CellLinkAbbr": "Inputs!costPerUnit",
                "Type": "DISTRIBUTION",
                "Display": "Cost Per Unit"
            },
            {
                "Description": "The sale price charged per unit of product",
                "Val": [
                    0.4,
                    0.8,
                    1
                ],
                "Constraint": "double",
                "CellLink": "Inputs!salePricePerUnit",
                "Key": "Inputs_salePricePerUnit",
                "Inherited": false,
                "Units": "dollars",
                "CellLinkAbbr": "Inputs!salePriceP...",
                "Type": "DISTRIBUTION",
                "Display": "Sale Price Per Unit"
            },
            {
                "Description": "This is the cost to service each account",
                "Val": [
                    0.5,
                    1,
                    1.5
                ],
                "Constraint": "double",
                "CellLink": "Inputs!annualCapitalCosts",
                "Key": "Inputs_annualCapitalCosts",
                "Inherited": false,
                "Units": "million dollars per account",
                "CellLinkAbbr": "Inputs!annualCapi...",
                "Type": "DISTRIBUTION",
                "Display": "Annual Capital Costs"
            },
            {
                "Description": "This is the SG&A allocated as a percentage of calculated annual revenues",
                "Val": [
                    0.05,
                    0.1,
                    0.15
                ],
                "Constraint": "double",
                "CellLink": "Inputs!sgAndA",
                "Key": "Inputs_sgAndA",
                "Inherited": false,
                "Units": "fraction of annual revenue",
                "CellLinkAbbr": "Inputs!sgAndA",
                "Type": "DISTRIBUTION",
                "Display": "Annual SG&A"
            },
            {
                "Description": "This is the capex incurred once for every new addition of a million units",
                "Val": [
                    0.5,
                    1,
                    1.5
                ],
                "Constraint": "double",
                "CellLink": "Inputs!oneTimeCapex",
                "Key": "Inputs_oneTimeCapex",
                "Inherited": false,
                "Units": "million dollars per million units",
                "CellLinkAbbr": "Inputs!oneTimeCapex",
                "Type": "DISTRIBUTION",
                "Display": "One-time Capex"
            },
            {
                "Description": "Growth rate of units/account in the short-term",
                "Val": [
                    0.08,
                    0.1,
                    0.12
                ],
                "Constraint": "double",
                "CellLink": "Inputs!shortTermGrowthRate",
                "Key": "Inputs_shortTermGrowthRate",
                "Inherited": false,
                "Units": "fraction",
                "CellLinkAbbr": "Inputs!shortTermG...",
                "Type": "DISTRIBUTION",
                "Display": "Market Short-Term Growth Rate"
            },
            {
                "Description": "How long does short-term growth of units/account last?",
                "Val": [
                    2,
                    3,
                    4
                ],
                "Constraint": "integer",
                "CellLink": "Inputs!shortTermGrowthDuration",
                "Key": "Inputs_shortTermGrowthDuration",
                "Inherited": false,
                "Units": "years",
                "CellLinkAbbr": "Inputs!shortTermG...",
                "Type": "DISTRIBUTION",
                "Display": "Market Short-Term Growth Duration"
            },
            {
                "Description": "Growth rate of units/account in the long-term",
                "Val": [
                    0.03,
                    0.04,
                    0.05
                ],
                "Constraint": "double",
                "CellLink": "Inputs!longTermGrowthRate",
                "Key": "Inputs_longTermGrowthRate",
                "Inherited": false,
                "Units": "fraction",
                "CellLinkAbbr": "Inputs!longTermGr...",
                "Type": "DISTRIBUTION",
                "Display": "Market Long-term Growth Rate"
            },
            {
                "Description": "Tax Rate",
                "Val": "0.35",
                "Constraint": "double",
                "CellLink": "Inputs!taxRate",
                "Key": "taxRate",
                "Inherited": true,
                "Units": "fraction",
                "CellLinkAbbr": "Inputs!taxRate",
                "Type": "SCALAR",
                "Display": "Tax Rate"
            },
            {
                "Description": "Discount Rate",
                "Val": "0.1",
                "Constraint": "double",
                "CellLink": "Inputs!discountRate",
                "Key": "discountRate",
                "Inherited": true,
                "Units": "fraction",
                "CellLinkAbbr": "Inputs!discountRate",
                "Type": "SCALAR",
                "Display": "Discount Rate"
            }
        ];
        var elementToFind = {
            "Description": "Discount Rate",
            "Val": "0.1",
            "Constraint": "double",
            "CellLink": "Inputs!discountRate",
            "Key": "discountRate",
            "Inherited": true,
            "Units": "fraction",
            "CellLinkAbbr": "Inputs!discountRate",
            "Type": "SCALAR",
            "Display": "Discount Rate"
        };
        var ele = appStructureController.findKey(inputs)("discountRate");
        expect(ele).toEqual(elementToFind);
    });

    it("should find a table with a cell link", function () {
        var potentialTables = [{
            "Table": [[0, 12, 37, 62, 87, 100, 100, 100, 100, 100, 100, 100, 50, 0, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!accountsAcquired",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_21824.png"
        }, {
            "Table": [[0, 0, 37, 62, 87, 100, 100, 100, 100, 100, 100, 100, 50, 0, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!annualCapital",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_55741.png"
        }, {
            "Table": [[0, 27, 90, 166, 242, 287, 299, 311, 323, 336, 350, 364, 189, 0, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!annualRevenues",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_45019.png"
        }, {
            "Table": [[0, 4, 13, 24, 36, 43, 44, 46, 48, 50, 52, 54, 28, 0, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!annualSGandA",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_34298.png"
        }, {
            "Table": [[2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!annualUnitsPerAccount",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_23576.png"
        }, {
            "Table": [[500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!availableMarketAccounts",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_12854.png"
        }, {
            "Table": [["Example Calculation in a Mature Year, 2020", "", ""], ["", "", ""], ["Market Size Assessed", 5000, "accounts"], ["Penetration", 0, ""], ["Available Market Accounts", 500, "accounts"], ["Market Share", 0, ""], ["Accounts Acquired", 100, "accounts"], ["Units Acquired", 323.87, "million units"], ["Unit Revenues", 323.87, "million dollars"], ["Unit Costs", 64.77, "million dollars"], ["Operating Profit", 259.1, "million dollars"], ["Annual Capital Costs", 100, "million dollars"], ["Annual SG&A", 48.58, "million dollars"], ["One time Capex Costs in 2020", 12.46, "million dollars"], ["Net Profit Before Taxes", 98.06, "million dollars"], ["Taxes", 34.32, "million dollars"], ["Net Profit in 2020", 63.74, "million dollars"]],
            "CellLink": "Calculations!calculations",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_2132.png"
        }, {
            "Table": [[0, 27, 63, 75, 75, 45, 11, 11, 12, 12, 13, 14, 0, 0, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!capex",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_14606.png"
        }, {
            "Table": [[2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032]],
            "CellLink": "Tree!costYear",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_48523.png"
        }, {
            "Table": [["", "", "", "", "", "", ""], ["", "Phase", "Description", "Investment ($M)", "Duration in years", "Probability of Success", ""], ["", 1, "Demonstrate Value Proposition", 0, 0, 0, ""], ["", 2, "Productize", 0, 0, 0, ""], ["", 3, "Scale", 0, 0, 0, ""], ["", "", "", "", "", "", ""], ["", "", "", "Total Potential Investment ($M)", "Total Duration ", "Overall probability of success", ""], ["", "", "", 1, 1, 0, ""], ["", "", "", "", "", "", ""], ["", "", "", "", "Mean Investment ($M)", "", ""], ["", "", "", "", 0, "", ""], ["", "", "", "", "", "", ""]],
            "CellLink": "'Development Plan'!devPlan",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_37801.png"
        }, {
            "Table": [["", 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, "", "", "", "", "", "", "", ""], ["Revenues", 0.0, 5.78, 19.06, 34.94, 50.87, 60.46, 62.88, 65.4, 68.01, 70.73, 73.56, 76.51, 39.78, 0.0, "", "", "", "", "", "", "", ""], ["Operating Costs", 0.0, 7.8, 27.83, 41.23, 52.11, 51.76, 45.43, 46.4, 47.42, 48.48, 49.58, 50.72, 24.42, 0.0, "", "", "", "", "", "", "", ""], ["Development Costs", 0.19, 0.08, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, "", "", "", "", "", "", "", ""], ["Net Profit Before Taxes", -0.19, -2.1, -8.77, -6.3, -1.24, 8.71, 17.45, 18.99, 20.59, 22.26, 23.99, 25.79, 15.36, 0.0, "", "", "", "", "", "", "", ""], ["Taxes", -0.07, -0.73, -3.07, -2.2, -0.43, 3.05, 6.11, 6.65, 7.21, 7.79, 8.4, 9.03, 5.38, 0.0, "", "", "", "", "", "", "", ""], ["Cash Flow", -0.12, -1.36, -5.7, -4.09, -0.81, 5.66, 11.35, 12.35, 13.39, 14.47, 15.59, 16.76, 9.98, 0.0, "", "", "", "", "", "", "", ""]],
            "CellLink": "ExpectedPandL!expectedPandL",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_84192.png"
        }, {
            "Table": [["", "", 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, "", "", "", "", "", "", ""], ["Market Growth Rate", "fraction", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "", "", "", "", "", "", ""], ["Units/Account", "million units/account", 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, "", "", "", "", "", "", ""], ["Market Size", "accounts/year", 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, "", "", "", "", "", "", ""], ["Available Market Accounts", "accounts/year", 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, "", "", "", "", "", "", ""], ["Market Share", "fraction", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "", "", "", "", "", "", ""], ["Accounts Acquired", "accounts/year", 0, 12, 37, 62, 87, 100, 100, 100, 100, 100, 100, 100, 50, 0, "", "", "", "", "", "", ""], ["Units Acquired", "million units/year", 0, 27, 90, 166, 242, 287, 299, 311, 323, 336, 350, 364, 189, 0, "", "", "", "", "", "", ""], ["Unit Revenues", "million dollars/year", 0, 27, 90, 166, 242, 287, 299, 311, 323, 336, 350, 364, 189, 0, "", "", "", "", "", "", ""], ["Unit Costs", "million dollars/year", 0, 5, 18, 33, 48, 57, 59, 62, 64, 67, 70, 72, 37, 0, "", "", "", "", "", "", ""], ["Annual Capital Costs", "million dollars/year", 0, 0, 37, 62, 87, 100, 100, 100, 100, 100, 100, 100, 50, 0, "", "", "", "", "", "", ""], ["Annual SG&A", "million dollars/year", 0, 4, 13, 24, 36, 43, 44, 46, 48, 50, 52, 54, 28, 0, "", "", "", "", "", "", ""], ["One time Capex Costs", "million dollars/year", 0, 27, 63, 75, 75, 45, 11, 11, 12, 12, 13, 14, 0, 0, "", "", "", "", "", "", ""], ["Development Costs", "million dollars/year", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "", "", "", "", "", "", ""], ["Net Profit Before Taxes", "million dollars/year", 0, -9, -41, -29, -5, 41, 83, 90, 98, 105, 114, 122, 73, 0, "", "", "", "", "", "", ""], ["Taxes", "million dollars/year", 0, -3, -14, -10, -2, 14, 29, 31, 34, 37, 39, 42, 25, 0, "", "", "", "", "", "", ""], ["Net Profit", "million dollars/year", 0, -6, -27, -19, -3, 26, 54, 58, 63, 68, 74, 79, 47, 0, "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["NPV", "million dollars", 147, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!financialStatement",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_168.png"
        }, {
            "Table": [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!marketGrowthRate",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_16145.png"
        }, {
            "Table": [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!marketShare",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_5423.png"
        }, {
            "Table": [[5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!marketSize",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_94701.png"
        }, {
            "Table": [[0, -6, -27, -19, -3, 26, 54, 58, 63, 68, 74, 79, 47, 0, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!netProfit",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_39340.png"
        }, {
            "Table": [[0, -9, -41, -29, -5, 41, 83, 90, 98, 105, 114, 122, 73, 0, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!netProfitBeforeTaxes",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_73257.png"
        }, {
            "Table": [["", 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, "", "", "", "", "", "", "", "", ""], ["Revenues", 0.0, 5.78, 19.06, 34.94, 50.87, 60.46, 62.88, 65.4, 68.01, 70.73, 73.56, 76.51, 39.78, 0.0, "", "", "", "", "", "", "", "", ""], ["Operating Costs", 0.0, 7.8, 27.83, 41.23, 52.11, 51.76, 45.43, 46.4, 47.42, 48.48, 49.58, 50.72, 24.42, 0.0, "", "", "", "", "", "", "", "", ""], ["Development Costs", 0.19, 0.08, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, "", "", "", "", "", "", "", "", ""], ["Net Profit Before Taxes", -0.19, -2.1, -8.77, -6.3, -1.24, 8.71, 17.45, 18.99, 20.59, 22.26, 23.99, 25.79, 15.36, 0.0, "", "", "", "", "", "", "", "", ""], ["Taxes", -0.07, -0.73, -3.07, -2.2, -0.43, 3.05, 6.11, 6.65, 7.21, 7.79, 8.4, 9.03, 5.38, 0.0, "", "", "", "", "", "", "", "", ""], ["Cash Flow", -0.12, -1.36, -5.7, -4.09, -0.81, 5.66, 11.35, 12.35, 13.39, 14.47, 15.59, 16.76, 9.98, 0.0, "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]],
            "CellLink": "ExpectedPandL!ExpectedPandL!pAndL",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_30370.png"
        }, {
            "Table": [["", 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, "", "", "", "", "", "", "", "", ""], ["Revenues", 0.0, 27.5, 90.75, 166.38, 242.24, 287.92, 299.44, 311.42, 323.87, 336.83, 350.3, 364.31, 189.44, 0.0, "", "", "", "", "", "", "", "", ""], ["Operating Costs", 0.0, 37.12, 132.51, 196.36, 248.15, 246.45, 216.32, 220.97, 225.81, 230.84, 236.08, 241.52, 116.3, 0.0, "", "", "", "", "", "", "", "", ""], ["Development Costs", 0.25, 0.25, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, "", "", "", "", "", "", "", "", ""], ["Net Profit Before Taxes", -0.25, -9.88, -41.76, -29.98, -5.91, 41.47, 83.12, 90.44, 98.06, 105.98, 114.22, 122.79, 73.14, 0.0, "", "", "", "", "", "", "", "", ""], ["Taxes", -0.09, -3.46, -14.62, -10.49, -2.07, 14.51, 29.09, 31.66, 34.32, 37.09, 39.98, 42.98, 25.6, 0.0, "", "", "", "", "", "", "", "", ""], ["Cash Flow", -0.16, -6.42, -27.15, -19.49, -3.84, 26.96, 54.03, 58.79, 63.74, 68.89, 74.24, 79.81, 47.54, 0.0, "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["NPV", 147.64, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]],
            "CellLink": "PandL!pAndL",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_80264.png"
        }, {
            "Table": [[0, -3, -14, -10, -2, 14, 29, 31, 34, 37, 39, 42, 25, 0, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!taxes",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_96241.png"
        }, {
            "Table": [[0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
            "CellLink": "Calculations!timeprofile",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_30158.png"
        }, {
            "Table": [["", "Expected Project Value", "", "", -0.09, "million dollars", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "Project Cost Given Dev Success", "", "", 0.28, "million dollars", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "Expected Project Cost", "", "", 0.15, "million dollars", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "Probability of Dev Success", "", "", 0.21, "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "Value Given Success", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "High", 0.0, "million dollars", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "Medium", 0.0, "million dollars", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "Low", 0.0, "million dollars", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "Expected", 0.0, "million dollars", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "Investment Productivity", "", "", -0.61, "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "Commercial ", "", "Project", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "Contribution", "", "Cost", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "High", 0.0, "=", 0.28, "-", 0.28, "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", 0.21, "Med", 0.0, "=", 0.28, "-", 0.28, "", "", "", "", "", "", "", ""], ["", "", "", "", "Succeed", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "Go", "", "Low", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", 0.0, "=", 0.28, "-", 0.28, "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", 0.79, "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "Fail", "", -0.12, "=", 0.0, "-", 0.12, "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "No Go", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", 0, "=", 0.0, "-", 0.0, "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "NPV of Value Prop Phase", "", "", 0.06, "million dollars", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "NPV of Productize Phase", "", "", 0.09, "million dollars", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "NPV of Scale Phase", "", "", 0.13, "million dollars", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "Expected Project Cost", "", "", 0.15, "million dollars", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "NPV of Cost", "", "", 0.28, "million dollars", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "Expected Cost of Failure", "", "", -0.09, "million dollars", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029], ["Phase 1", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ["Phase 2", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ["Phase 3", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ["Total Cost", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ["NPV of Cost", "", 0.28, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["NPV of Phase1", "", 0.06, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["NPV of Phase 2", "", 0.09, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["NPV of Phsae 3", "", 0.13, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["NPV Cost if Fail", "", 0.12, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["startphase1", 2012, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["startphase2", 2012, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], ["startphase3", 2013, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]],
            "CellLink": "Tree!tree",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_76548.png"
        }, {
            "Table": [[0, 5, 18, 33, 48, 57, 59, 62, 64, 67, 70, 72, 37, 0, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!unitCosts",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_40667.png"
        }, {
            "Table": [[0, 27, 90, 166, 242, 287, 299, 311, 323, 336, 350, 364, 189, 0, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!unitsAcquired",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_29946.png"
        }, {
            "Table": [[2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!year",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_87058.png"
        }];
        var elementToFind = appStructureController.findCellLink("Calculations!accountsAcquired");
        expect(elementToFind).toEqual({
            "Table": [[0, 12, 37, 62, 87, 100, 100, 100, 100, 100, 100, 100, 50, 0, "", "", "", "", "", "", ""]],
            "CellLink": "Calculations!accountsAcquired",
            "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_21824.png"
        });
    });

    it("should add an output to tornado diagram properly", function () {
        appStructureController.selectedMenu = appStructureController.appStructure.MENU[12];
        appStructureController.selectedMenu.Parameters.ValueMetricKeys = [];
        var output = {
            UsePostProcessingOutputs: true,
            CellLink: 'Tree!expectedValue',
            Key: 'avgValue',
            Units: 'Millions of dollars',
            CellLinkAbbr: 'Tree!expected',
            Display: 'Expected Value'
        };
        appStructureController.addToTornado(output);
        expect(appStructureController.selectedMenu.Parameters.ValueMetricKeys.indexOf('avgValue')).not.toBe(-1);
    });

    it("should remove and output from tornado diagram properly", function () {
        appStructureController.selectedMenu = appStructureController.appStructure.MENU[12];
        appStructureController.removeFromTornado('avgValue');
        expect(appStructureController.selectedMenu.Parameters.ValueMetricKeys.indexOf('avgValue')).toBe(-1);
    });

    it("should check if changes have been made to appstructure", function () {
        var result = appStructureController.isUnchanged();
        expect(result).toBeTruthy();
        appStructureController.appStructure.ID = "acquisition";
        result = appStructureController.isUnchanged();
        expect(result).toBeFalsy();
    });

    it("should add a sendback properly", function () {
        var newSendBack = {
            "SendBack": "",
            "Reference": "TornadoDistOutputs[0].mean",
            "Key": "mean_xxxx",
            "Title": "mean of xxxx"
        };
        appStructureController.addSendBack();
        expect(appStructureController.postProcessing.length).toBe(5);
        expect(appStructureController.postProcessing[4]).toEqual(newSendBack);
    });

    it("should delete a sendback properly", function () {
        var sendBackToDelete = {
            "SendBack": "Tree!F11",
            "Key": "value_given_success",
            "Reference": "TornadoDistOutputs[0].Mean",
            "Title": "Mean of Net-Present Value"
        };
        appStructureController.deleteSendBack(sendBackToDelete);
        expect(appStructureController.postProcessing.indexOf(sendBackToDelete)).toBe(-1);
    });

    it("should select and unselect an output to tornado diagram properly", function () {
        var menu = {
            "Command": "TORNADODIST",
            "UsePostProcessingOutputs": false,
            "Display": "Tornado",
            "Parameters": {
                "ValueMetricKeys": [
                    "npvGivenOverallSuccess"
                ],
                "MetaLogKeys": [
                    "Calculations_npv",
                    "revenueM",
                    "netProfitatMaturity"
                ],
                "ChartTitle": "Tornado of Net-Present Value",
                "Depth": 3,
                "CombinedUncertaintyLabel": "Combined Uncertainty Range",
                "Weights": {
                    "High": 0.25,
                    "Med": 0.5,
                    "Low": 0.25
                }
            },
            "ID": "tornado"
        };
        appStructureController.selectMenu(menu);
        appStructureController.selectTornado("npvGivenOverallSuccess");
        expect(appStructureController.tornado.Parameters.ValueMetricKeys.indexOf("npvGivenOverallSuccess")).toBe(-1);
        appStructureController.selectTornado("avgValue");
        expect(appStructureController.tornado.Parameters.ValueMetricKeys.indexOf("avgValue")).not.toBe(-1);
    });

    it("should exclude an input properly", function () {
        appStructureController.selectedMenu = {
            "Command": "INPUT_SCREEN",
            "UsePostProcessingOutputs": false,
            "Display": "Development Success",
            "Parameters": {
                "InputKeys": [
                    "Inputs_pValueProp",
                    "Inputs_pProductize",
                    "Inputs_pScale"
                ]
            }
        };
        appStructureController.excludeInput("Inputs_pValueProp");
        expect(appStructureController.selectedMenu.Parameters.InputKeys).toEqual(["Inputs_pProductize", "Inputs_pScale"]);
        var excludedInput = {
            "Description": "probability assessment",
            "Val": "0.6",
            "Constraint": "double",
            "CellLink": "Inputs!pValueProp",
            "Key": "Inputs_pValueProp",
            "Inherited": false,
            "Units": "fraction",
            "CellLinkAbbr": "Inputs!pValueProp",
            "Type": "SCALAR",
            "Display": "Probability of Value Proposition Phase Succeeding"
        };
        expect(appStructureController.excludedInputs[0]).toEqual(excludedInput);
    });

    it("should include an input properly", function () {
        var input = {
            "Description": "probability assessment",
            "Val": "0.6",
            "Constraint": "double",
            "CellLink": "Inputs!pValueProp",
            "Key": "Inputs_pValueProp",
            "Inherited": false,
            "Units": "fraction",
            "CellLinkAbbr": "Inputs!pValueProp",
            "Type": "SCALAR",
            "Display": "Probability of Value Proposition Phase Succeeding"
        };
        var menu = {
            "Command": "INPUT_SCREEN",
            "UsePostProcessingOutputs": false,
            "Display": "Development Success",
            "Parameters": {
                "InputKeys": [
                    "Inputs_pValueProp",
                    "Inputs_pProductize",
                    "Inputs_pScale"
                ]
            },
            "ID": "devSuccess"
        };
        appStructureController.selectMenu(menu);
        appStructureController.excludeInput(input);

        appStructureController.includeInput(input);
        expect(appStructureController.excludedInputs.length).toBe(0);
        expect(appStructureController.selectedMenu.Parameters.InputKeys.indexOf("Inputs_pValueProp")).not.toBe(-1);
    });

    describe("add app structure item", function () {
        it("should add a new app structure item properly", function () {
            appStructureController.makeNewAppStructureAndAddIt("myInput", "INPUT_SCREEN");
            var newInputScreen = {
                "Command": "INPUT_SCREEN",
                "Display": "myInput",
                "ID": "myInput",
                "UsePostProcessingOutputs": false,
                "Visible": true,
                "Parameters": {
                    "InputKeys": []
                }
            };
            expect(appStructureController.appStructure.MENU[15]).toEqual(newInputScreen);
            appStructureController.makeNewAppStructureAndAddIt("my Table", "TABLE");
            var newTable = {
                "Command": "TABLE",
                "Display": "my Table",
                "ID": "myTable",
                "UsePostProcessingOutputs": false,
                "Visible": true,
                "Parameters": {
                    "CellLink": "",
                    "OutputKey": "",
                    "Pnl": true
                }
            };
            expect(appStructureController.appStructure.MENU[16]).toEqual(newTable);

            appStructureController.makeNewAppStructureAndAddIt("myImage", "IMAGE");
            var newImage = {
                "Command": "IMAGE",
                "Display": "myImage",
                "ID": "myImage",
                "UsePostProcessingOutputs": false,
                "Visible": true,
                "Parameters": {
                    "CellLink": "",
                    "OutputKey": "",
                    "Type": "RANGE",
                    "FitToScreen": true
                }
            };
            expect(appStructureController.appStructure.MENU[17]).toEqual(newImage);

            appStructureController.makeNewAppStructureAndAddIt("myTableInput", "TABLE_INPUT");
            var newTableInput = {
                "Command": "TABLE_INPUT",
                "Display": "myTableInput",
                "ID": "myTableInput",
                "UsePostProcessingOutputs": false,
                "Visible": true,
                "Parameters": {
                    "InputKey": ""
                }
            };
            expect(appStructureController.appStructure.MENU[18]).toEqual(newTableInput);
        });
        it("should not generate duplicate IDs", function () {
            appStructureController.makeNewAppStructureAndAddIt("myInput", "INPUT_SCREEN");
            expect(appStructureController.appStructure.MENU[15].ID).toEqual("myInput");
            appStructureController.makeNewAppStructureAndAddIt("myInput", "IMAGE");
            expect(appStructureController.appStructure.MENU[16].ID).toEqual("myInput0");
            appStructureController.makeNewAppStructureAndAddIt("myInput", "INPUT_SCREEN");
            expect(appStructureController.appStructure.MENU[17].ID).toEqual("myInput00");
        });
        describe("TornadoDist:", function () {
            beforeEach(function () {
                appStructureController.appStructure.MENU.splice(12, 1); // Remove TornadoDist first so we can add it
                appStructureController.makeNewAppStructureAndAddIt("myTornado", "TORNADODIST");
            });
            it("should set command correctly", function () {
                expect(appStructureController.appStructure.MENU[14].Command).toEqual("TORNADODIST");
            });
            it("should set display correctly", function () {
                expect(appStructureController.appStructure.MENU[14].Display).toEqual("myTornado");
            });
            it("should not add a second Tornado if one already exists", function () {
                appStructureController.makeNewAppStructureAndAddIt("myTornado2", "TORNADODIST");
                expect(appStructureController.appStructure.MENU[15]).toBeUndefined();
            });
            describe("parameters:", function () {
                it("should set Weights correctly", function () {
                    expect(appStructureController.appStructure.MENU[14].Parameters.Weights).toEqual({
                        High: 0.25,
                        Low: 0.25,
                        Med: 0.5
                    });
                });
            });

            describe("Post Processing", function () {
                it("should not be blank value of SendBack in postprocessing", function () {
                    if (appStructureController.postProcessing.length == 0) {
                        expect(1).toEqual(1);
                    }
                    else
                        var a = "";
                    appStructureController.saveWithoutBlank();
                    var allSendBack = appStructureController.postProcessing.map(function (item) {
                        return item.SendBack;
                    });
                    expect(allSendBack.indexOf(a)).toEqual(-1);
                });
            });

        });


    });


    it("should check whether user has entered a menu display", function () {
        var display = undefined;
        expect(appStructureController.checkDisplay(display)).toBeFalsy();
        display = "myInput";
        expect(appStructureController.checkDisplay(display)).toBeTruthy();
    });

    it("should check whether user has selected  a command type", function () {
        var command = undefined;
        expect(appStructureController.checkCommand(command)).toBeFalsy();
        command = "INPUT_SCREEN";
        expect(appStructureController.checkCommand(command)).toBeTruthy();
    });

    it("should check whether there's only one tornado menu item", function () {
        expect(appStructureController.checkUniqueTornado()).toBeFalsy();
        appStructureController.appStructure.MENU.splice(12, 1);
        expect(appStructureController.checkUniqueTornado()).toBeTruthy();
    });

    it("should ensure that tornado depth is numeric", function () {
        var menu = {
            "Command": "TORNADODIST",
            "UsePostProcessingOutputs": false,
            "Display": "Tornado",
            "Parameters": {
                "ValueMetricKeys": [
                    "npvGivenOverallSuccess"
                ],
                "ChartTitle": "Tornado of Net-Present Value",
                "Depth": "2",
                "CombinedUncertaintyLabel": "Combined Uncertainty Range",
                "Weights": {
                    "High": 0.25,
                    "Med": 0.5,
                    "Low": 0.25
                }
            },
            "ID": "tornado"
        };
        appStructureController.selectMenu(menu);
        appStructureController.ensureTornadoDepthIsNumeric();
        expect(appStructureController.tornado.Parameters.Depth).toEqual(2);
    });

    describe("metalog display", function () {
        it("should add FailureBranch to Metalog if command doesn't have FailureBranch", function () {
            // var menu1 = {
            //     "UsePostProcessingOutputs": false,
            //     "precisionOptions": [0, 1, 3],
            //     "Parameters": {
            //         "MetaLogKeys": ["Calculations_npv"],
            //         "FailureBranch": {
            //             "Stages": [{
            //                 "NodeLookup": "Outputs",
            //                 "ProbabilityKey": "pFailPhase1",
            //                 "SubtractionValueKey": "costFailurePhase1",
            //                 "$$hashKey": "0A3"
            //             }, {
            //                 "NodeLookup": "Outputs",
            //                 "ProbabilityKey": "pFailPhase2",
            //                 "SubtractionValueKey": "costFailurePhase2",
            //                 "$$hashKey": "0A4"
            //             }, {
            //                 "NodeLookup": "Outputs",
            //                 "ProbabilityKey": "pFailPhase3",
            //                 "SubtractionValueKey": "costFailurePhase3",
            //                 "$$hashKey": "0A5"
            //             }], "SubtractCostGivenSuccess": true
            //         },
            //         "FittedPointExplanation": "For each stage in development, two points " +
            //         "define a vertical line representing the Development Cost lost if there " +
            //         "is failure at that stage. The height of the line is the Probability " +
            //         "of Failure at that stage. The remaining Fitted Points come from the " +
            //         "Success Curve, adjusted by the Probability of Overall Development " +
            //         "Success.If the number of points are less than 27, that's because " +
            //         "the points with the same value are combined."
            //     },
            //     "ID": "metalog",
            //     "Visible": true,
            //     "Command": "METALOG_DISPLAY",
            //     "Display": "Commit Curve"
            // }

            var menu = {
                "UsePostProcessingOutputs": false,
                "precisionOptions": [0, 1, 3],
                "Parameters": {
                    "MetaLogKeys": ["Calculations_npv", "revenueM"],
                    "FittedPointExplanation": "The Fitted Points come from combining" +
                    " the top 3 factors in the Tornado. These factors are put into a " +
                    "tree that has 3 levels for each factor with High, Medium, and Low " +
                    "values for the factor and 0.25, 0.5 and 0.25 probabilities, " +
                    "respectively. The High, Medium, and Low values come from the " +
                    "ranges for each factor in the Tornado. This results in 27 endpoints" +
                    " in the tree that are sorted to produce the fitted points.If the " +
                    "number of points are less than 27, that's because the points with " +
                    "the same value are combined."
                },
                "ID": "success",
                "Visible": true,
                "Command": "METALOG_DISPLAY",
                "Display": "Success Curve"
            }

            var expectedParameters = {
                "FailureBranch": {
                    Stages: [{
                        NodeLookup: "Outputs",
                        ProbabilityKey: "",
                        SubtractionValueKey: ""
                    }],
                    SubtractCostGivenSuccess: true
                },
                "MetaLogKeys": ["Calculations_npv", "revenueM"],
                "FittedPointExplanation": "The Fitted Points come from combining" +
                " the top 3 factors in the Tornado. These factors are put into a " +
                "tree that has 3 levels for each factor with High, Medium, and Low " +
                "values for the factor and 0.25, 0.5 and 0.25 probabilities, " +
                "respectively. The High, Medium, and Low values come from the " +
                "ranges for each factor in the Tornado. This results in 27 endpoints" +
                " in the tree that are sorted to produce the fitted points.If the " +
                "number of points are less than 27, that's because the points with " +
                "the same value are combined."
            }

            appStructureController.selectMenu(menu);
            appStructureController.addFailurebranch();
            expect(appStructureController.selectedMenu.Parameters).toEqual(expectedParameters);
        });
        it("should add one more stage to FailureBranch if command has FailureBranch", function () {
            var menu = {
                "UsePostProcessingOutputs": false,
                "precisionOptions": [0, 1, 3],
                "Parameters": {
                    "MetaLogKeys": ["Calculations_npv"],
                    "FailureBranch": {
                        "Stages": [{
                            "NodeLookup": "Outputs",
                            "ProbabilityKey": "pFailPhase1",
                            "SubtractionValueKey": "costFailurePhase1",
                        }, {
                            "NodeLookup": "Outputs",
                            "ProbabilityKey": "pFailPhase2",
                            "SubtractionValueKey": "costFailurePhase2",
                        }, {
                            "NodeLookup": "Outputs",
                            "ProbabilityKey": "pFailPhase3",
                            "SubtractionValueKey": "costFailurePhase3",
                        }],
                        "SubtractCostGivenSuccess": true
                    },
                    "FittedPointExplanation": "For each stage in development, two points " +
                    "define a vertical line representing the Development Cost lost if there " +
                    "is failure at that stage. The height of the line is the Probability " +
                    "of Failure at that stage. The remaining Fitted Points come from the " +
                    "Success Curve, adjusted by the Probability of Overall Development " +
                    "Success.If the number of points are less than 27, that's because " +
                    "the points with the same value are combined."
                },
                "ID": "metalog",
                "Visible": true,
                "Command": "METALOG_DISPLAY",
                "Display": "Commit Curve"
            }

            var expectedParameters = {
                "MetaLogKeys": ["Calculations_npv"],
                "FailureBranch": {
                    "Stages": [{
                        "NodeLookup": "Outputs",
                        "ProbabilityKey": "pFailPhase1",
                        "SubtractionValueKey": "costFailurePhase1",
                    }, {
                        "NodeLookup": "Outputs",
                        "ProbabilityKey": "pFailPhase2",
                        "SubtractionValueKey": "costFailurePhase2",
                    }, {
                        "NodeLookup": "Outputs",
                        "ProbabilityKey": "pFailPhase3",
                        "SubtractionValueKey": "costFailurePhase3",
                    },
                        {
                            "NodeLookup": "Outputs",
                            "ProbabilityKey": "",
                            "SubtractionValueKey": "",
                        }],
                    "SubtractCostGivenSuccess": true
                },
                "FittedPointExplanation": "For each stage in development, two points " +
                "define a vertical line representing the Development Cost lost if there " +
                "is failure at that stage. The height of the line is the Probability " +
                "of Failure at that stage. The remaining Fitted Points come from the " +
                "Success Curve, adjusted by the Probability of Overall Development " +
                "Success.If the number of points are less than 27, that's because " +
                "the points with the same value are combined."
            }

            appStructureController.selectMenu(menu);
            appStructureController.addFailurebranch();
            expect(appStructureController.selectedMenu.Parameters).toEqual(expectedParameters);

        });
        it("should delete one stage from Failurebranch Stages", function () {
            var menu = {
                "UsePostProcessingOutputs": false,
                "precisionOptions": [0, 1, 3],
                "Parameters": {
                    "MetaLogKeys": ["Calculations_npv"],
                    "FailureBranch": {
                        "Stages": [{
                            "NodeLookup": "Outputs",
                            "ProbabilityKey": "pFailPhase1",
                            "SubtractionValueKey": "costFailurePhase1",
                        }, {
                            "NodeLookup": "Outputs",
                            "ProbabilityKey": "pFailPhase2",
                            "SubtractionValueKey": "costFailurePhase2",
                        }, {
                            "NodeLookup": "Outputs",
                            "ProbabilityKey": "pFailPhase3",
                            "SubtractionValueKey": "costFailurePhase3",
                        }],
                        "SubtractCostGivenSuccess": true
                    },
                    "FittedPointExplanation": "For each stage in development, two points " +
                    "define a vertical line representing the Development Cost lost if there " +
                    "is failure at that stage. The height of the line is the Probability " +
                    "of Failure at that stage. The remaining Fitted Points come from the " +
                    "Success Curve, adjusted by the Probability of Overall Development " +
                    "Success.If the number of points are less than 27, that's because " +
                    "the points with the same value are combined."
                },
                "ID": "metalog",
                "Visible": true,
                "Command": "METALOG_DISPLAY",
                "Display": "Commit Curve"
            }

            var expectedParameters = {

                "MetaLogKeys": ["Calculations_npv"],
                "FailureBranch": {
                    "Stages": [{
                        "NodeLookup": "Outputs",
                        "ProbabilityKey": "pFailPhase1",
                        "SubtractionValueKey": "costFailurePhase1",
                    }, {
                        "NodeLookup": "Outputs",
                        "ProbabilityKey": "pFailPhase2",
                        "SubtractionValueKey": "costFailurePhase2",
                    }],
                    "SubtractCostGivenSuccess": true
                },
                "FittedPointExplanation": "For each stage in development, two points " +
                "define a vertical line representing the Development Cost lost if there " +
                "is failure at that stage. The height of the line is the Probability " +
                "of Failure at that stage. The remaining Fitted Points come from the " +
                "Success Curve, adjusted by the Probability of Overall Development " +
                "Success.If the number of points are less than 27, that's because " +
                "the points with the same value are combined."

            }
            appStructureController.selectMenu(menu);
            appStructureController.deleteFailurebranchStage(2);
            expect(appStructureController.selectedMenu.Parameters).toEqual(expectedParameters);

        });
        it("should delete the only one stage and delete Failurebranch from FailureBranch Parameters", function () {
            var menu = {
                "UsePostProcessingOutputs": false,
                "precisionOptions": [0, 1, 3],
                "Parameters": {
                    "MetaLogKeys": ["Calculations_npv"],
                    "FailureBranch": {
                        "Stages": [{
                            "NodeLookup": "Outputs",
                            "ProbabilityKey": "pFailPhase1",
                            "SubtractionValueKey": "costFailurePhase1",
                        }],
                        "SubtractCostGivenSuccess": true
                    },
                    "FittedPointExplanation": "For each stage in development, two points " +
                    "define a vertical line representing the Development Cost lost if there " +
                    "is failure at that stage. The height of the line is the Probability " +
                    "of Failure at that stage. The remaining Fitted Points come from the " +
                    "Success Curve, adjusted by the Probability of Overall Development " +
                    "Success.If the number of points are less than 27, that's because " +
                    "the points with the same value are combined."
                },
                "ID": "metalog",
                "Visible": true,
                "Command": "METALOG_DISPLAY",
                "Display": "Commit Curve"
            }

            var expectedParameters = {

                "MetaLogKeys": ["Calculations_npv"],
                "FittedPointExplanation": "For each stage in development, two points " +
                "define a vertical line representing the Development Cost lost if there " +
                "is failure at that stage. The height of the line is the Probability " +
                "of Failure at that stage. The remaining Fitted Points come from the " +
                "Success Curve, adjusted by the Probability of Overall Development " +
                "Success.If the number of points are less than 27, that's because " +
                "the points with the same value are combined."

            }
            appStructureController.selectMenu(menu);
            appStructureController.deleteFailurebranchStage(0);
            expect(appStructureController.selectedMenu.Parameters).toEqual(expectedParameters);
        });

    });
});