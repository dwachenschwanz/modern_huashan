namespace wizard.mocks {
    export class EncodedTemplatePiece {
        template: MockTemplate;
        constructor(template:MockTemplate) {
            this.template = template;
        }
        encodedDataStructure(): string {
            return this.encode(this.template.dataStructure());
        }
        encodedAppStructure(): string {
            return this.encode(this.template.appStructure());
        }
        encodedPotentialTables(): string {
            return this.encode(this.template.potentialTables());
        }
        encodedPotentialCharts(): string {
            return this.encode(this.template.potentialCharts());
        }
        encode(structure:{}) {
           return encodeURIComponent(
                    btoa(
                    JSON.stringify(
                        structure
                    )
                )
            );
        }
    }
    export abstract class MockTemplate {
        abstract appStructure():{};
        abstract dataStructure():{};
        abstract potentialTables(): {};
        abstract potentialCharts(): {};
    }

    export class AccountDevTemplate extends MockTemplate {
        appStructure() {
            return {
                "PostProcessingOutputsForPortfolio": [{
                    "SendBack": "Tree!F11",
                    "Key": "value_given_success",
                    "Reference": "TornadoDistOutputs[0].Mean",
                    "Title": "Mean of Net-Present Value"
                }, {
                    "SendBack": "Tree!F8",
                    "Key": "High_Calculations_npv",
                    "Reference": "TornadoDistOutputs[0].Summary[2]",
                    "Title": "High of Net-Present Value"
                }, {
                    "SendBack": "Tree!F9",
                    "Key": "Med_Calculations_npv",
                    "Reference": "TornadoDistOutputs[0].Summary[1]",
                    "Title": "Med of Net-Present Value"
                }, {
                    "SendBack": "Tree!F10",
                    "Key": "Low_Calculations_npv",
                    "Reference": "TornadoDistOutputs[0].Summary[0]",
                    "Title": "Low of Net-Present Value"
                }],
                "Platform": false,
                "ID": "accountDev",
                "MENU": [{
                    "Command": "INPUT_SCREEN",
                    "UsePostProcessingOutputs": false,
                    "Display": "Development Success",
                    "Parameters": {"InputKeys": ["Inputs_pValueProp", "Inputs_pProductize", "Inputs_pScale"]},
                    "ID": "devSuccess",
                    "Visible": true
                }, {
                    "Command": "INPUT_SCREEN",
                    "UsePostProcessingOutputs": false,
                    "Display": "Cost & Schedule",
                    "Parameters": {"InputKeys": ["Inputs_baseYear", "Inputs_timeToStartPhase1", "Inputs_annualCostOfPhase1", "Inputs_durationPhase1", "Inputs_annualCostOfPhase2", "Inputs_durationPhase2", "Inputs_annualCostOfPhase3", "Inputs_durationPhase3"]},
                    "ID": "cost&Schedule"
                }, {
                    "Command": "INPUT_SCREEN",
                    "UsePostProcessingOutputs": false,
                    "Display": "Market Data",
                    "Parameters": {"InputKeys": ["Inputs_marketStartYear", "Inputs_tam", "Inputs_penetration", "Inputs_unitsPerAccount"]},
                    "ID": "marketData"
                }, {
                    "Command": "INPUT_SCREEN",
                    "UsePostProcessingOutputs": false,
                    "Display": "Launch Data",
                    "Parameters": {"InputKeys": ["Inputs_rampDuration", "Inputs_peakMarketShare", "Inputs_peakMarketDuration"]},
                    "ID": "launchData"
                }, {
                    "Command": "INPUT_SCREEN",
                    "UsePostProcessingOutputs": false,
                    "Display": "Economics",
                    "Parameters": {"InputKeys": ["Inputs_costPerUnit", "Inputs_salePricePerUnit", "Inputs_annualCapitalCosts", "Inputs_sgAndA", "Inputs_oneTimeCapex"]},
                    "ID": "economics"
                }, {
                    "Command": "INPUT_SCREEN",
                    "UsePostProcessingOutputs": false,
                    "Display": "Other Information",
                    "Parameters": {"InputKeys": ["Inputs_shortTermGrowthRate", "Inputs_shortTermGrowthDuration", "Inputs_longTermGrowthRate", "taxRate", "discountRate"]},
                    "ID": "otherInformation"
                }, {
                    "Command": "IMAGE",
                    "UsePostProcessingOutputs": false,
                    "Display": "Development Plan",
                    "Parameters": {
                        "CellLink": "Development Plan!devPlan",
                        "Type": "RANGE",
                        "OutputKey": "devPlan"
                    },
                    "ID": "devPlan"
                }, {
                    "Command": "IMAGE",
                    "UsePostProcessingOutputs": false,
                    "Display": "Base Case Calculations",
                    "Parameters": {
                        "CellLink": "Calculations!calculations",
                        "Type": "RANGE",
                        "OutputKey": "calculations"
                    },
                    "ID": "baseCaseCalculations"
                }, {
                    "Command": "IMAGE",
                    "UsePostProcessingOutputs": false,
                    "Display": "Financial Statement",
                    "Parameters": {
                        "CellLink": "Calculations!financialStatement",
                        "Type": "RANGE",
                        "OutputKey": "financialStatement"
                    },
                    "ID": "financialStatement"
                }, {
                    "Command": "TABLE",
                    "UsePostProcessingOutputs": false,
                    "Display": "Base Case P&L",
                    "Parameters": {
                        "CellLink": "Calculations!pAndL",
                        "OutputKey": "pAndL"
                    },
                    "ID": "pAndL"
                }, {
                    "Command": "TABLE",
                    "UsePostProcessingOutputs": false,
                    "Display": "Expected P&L",
                    "Parameters": {
                        "CellLink": "ExpectedPandL!expectedPandL",
                        "OutputKey": "expectedPAndL"
                    },
                    "ID": "expectedPandL"
                }, {
                    "Command": "IMAGE",
                    "UsePostProcessingOutputs": false,
                    "Display": "Cash Flow",
                    "Parameters": {
                        "CellLink": "Calculations!Chart 8",
                        "Type": "CHART",
                        "OutputKey": "CashFlow"
                    },
                    "ID": "cashFlow"
                }, {
                    "Command": "TORNADODIST",
                    "UsePostProcessingOutputs": false,
                    "Display": "Tornado",
                    "Parameters": {
                        "ValueMetricKeys": ["npvGivenOverallSuccess"],
                        "ChartTitle": "Tornado of Net-Present Value",
                        "Depth": 3,
                        "CombinedUncertaintyLabel": "Combined Uncertainty Range",
                        "Weights": {"High": 0.25, "Med": 0.5, "Low": 0.25}
                    },
                    "ID": "tornado"
                }, {
                    "Command": "IMAGE",
                    "UsePostProcessingOutputs": false,
                    "Display": "Waterfall",
                    "Parameters": {
                        "CellLink": "Waterfall!Chart 2",
                        "Type": "CHART",
                        "OutputKey": "Chart 2"
                    },
                    "ID": "waterfall"
                }, {
                    "Command": "IMAGE",
                    "UsePostProcessingOutputs": true,
                    "Display": "Summary Tree",
                    "Parameters": {
                        "CellLink": "Tree!tree",
                        "Type": "RANGE",
                        "OutputKey": "summaryTree"
                    },
                    "ID": "summaryTree"
                }]
            };
        }
        dataStructure():{} {
            return {
                "Outputs": [{
                    "UsePostProcessingOutputs": false,
                    "CellLink": "Calculations!npv",
                    "Key": "npvGivenOverallSuccess",
                    "Units": "Millions of dollars",
                    "CellLinkAbbr": "Calculations!npv",
                    "Display": "Value given Overall Success"
                }, {
                    "UsePostProcessingOutputs": true,
                    "CellLink": "Tree!expectedValue",
                    "Key": "avgValue",
                    "Units": "Millions of dollars",
                    "CellLinkAbbr": "Tree!expected",
                    "Display": "Expected Value"
                }, {
                    "UsePostProcessingOutputs": false,
                    "CellLink": "Tree!expectedProjectCost",
                    "Key": "avgCost",
                    "Units": "Millions of dollars",
                    "CellLinkAbbr": "Tree!expected",
                    "Display": "Expected Project Cost"
                }, {
                    "UsePostProcessingOutputs": false,
                    "CellLink": "Tree!pOverallSuccess",
                    "Key": "pOverallSuccess",
                    "Units": "probability",
                    "CellLinkAbbr": "Tree!pOverall",
                    "Display": "Probability of Overall Success"
                }, {
                    "UsePostProcessingOutputs": false,
                    "CellLink": "Tree!pValueProp",
                    "Key": "pPhase1",
                    "Units": "probability",
                    "CellLinkAbbr": "Tree!pValueP",
                    "Display": "Probability of Value Proposition Phase Succeeding"
                }, {
                    "UsePostProcessingOutputs": false,
                    "CellLink": "Tree!pProductize",
                    "Key": "pPhase2",
                    "Units": "probability",
                    "CellLinkAbbr": "Tree!pProduc",
                    "Display": "Probability of Productize Phase Succeeding"
                }, {
                    "UsePostProcessingOutputs": false,
                    "CellLink": "Tree!pScale",
                    "Key": "pPhase3",
                    "Units": "probability",
                    "CellLinkAbbr": "Tree!pScale",
                    "Display": "Probability of Scale Phase Succeeding"
                }],
                "Description": "",
                "ID": "accountDev",
                "ExcelFile": "accountDev_template.xls",
                "Inputs": [{
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
                }, {
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
                }, {
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
                }, {
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
                }, {
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
                }, {
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
                }, {
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
                }, {
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
                }, {
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
                }, {
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
                }, {
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
                }, {
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
                }, {
                    "Description": "Number of accounts that are addressable",
                    "Val": [1000, 5000, 10000],
                    "Constraint": "integer",
                    "CellLink": "Inputs!tam",
                    "Key": "Inputs_tam",
                    "Inherited": false,
                    "Units": "accounts",
                    "CellLinkAbbr": "Inputs!tam",
                    "Type": "DISTRIBUTION",
                    "Display": "Total Addressable Market"
                }, {
                    "Description": "The fraction of TAM that can be penetrated by an offering of this kind",
                    "Val": [0.05, 0.1, 0.15],
                    "Constraint": "double",
                    "CellLink": "Inputs!penetration",
                    "Key": "Inputs_penetration",
                    "Inherited": false,
                    "Units": "fraction",
                    "CellLinkAbbr": "Inputs!penetration",
                    "Type": "DISTRIBUTION",
                    "Display": "Market Penetration"
                }, {
                    "Description": "Each account will involve units of product sold",
                    "Val": [1, 2, 5],
                    "Constraint": "double",
                    "CellLink": "Inputs!unitsPerAccount",
                    "Key": "Inputs_unitsPerAccount",
                    "Inherited": false,
                    "Units": "millions of units per account",
                    "CellLinkAbbr": "Inputs!unitsPerAc...",
                    "Type": "DISTRIBUTION",
                    "Display": "Units per account"
                }, {
                    "Description": "How long does it take for market share to touch its peak value",
                    "Val": [2, 3, 4],
                    "Constraint": "integer",
                    "CellLink": "Inputs!rampDuration",
                    "Key": "Inputs_rampDuration",
                    "Inherited": false,
                    "Units": "years",
                    "CellLinkAbbr": "Inputs!rampDuration",
                    "Type": "DISTRIBUTION",
                    "Display": "Ramp-Up Duration"
                }, {
                    "Description": "The market share at peak",
                    "Val": [0.1, 0.2, 0.3],
                    "Constraint": "double",
                    "CellLink": "Inputs!peakMarketShare",
                    "Key": "Inputs_peakMarketShare",
                    "Inherited": false,
                    "Units": "fraction",
                    "CellLinkAbbr": "Inputs!peakMarket...",
                    "Type": "DISTRIBUTION",
                    "Display": "Peak Market Share"
                }, {
                    "Description": "The number of years that the peak market share lasts",
                    "Val": [5, 8, 10],
                    "Constraint": "integer",
                    "CellLink": "Inputs!peakMarketDuration",
                    "Key": "Inputs_peakMarketDuration",
                    "Inherited": false,
                    "Units": "years",
                    "CellLinkAbbr": "Inputs!peakMarket...",
                    "Type": "DISTRIBUTION",
                    "Display": "Peak Market Duration"
                }, {
                    "Description": "The cost of each unit produced",
                    "Val": [0.1, 0.2, 0.3],
                    "Constraint": "double",
                    "CellLink": "Inputs!costPerUnit",
                    "Key": "Inputs_costPerUnit",
                    "Inherited": false,
                    "Units": "dollars",
                    "CellLinkAbbr": "Inputs!costPerUnit",
                    "Type": "DISTRIBUTION",
                    "Display": "Cost Per Unit"
                }, {
                    "Description": "The sale price charged per unit of product",
                    "Val": [0.4, 0.8, 1],
                    "Constraint": "double",
                    "CellLink": "Inputs!salePricePerUnit",
                    "Key": "Inputs_salePricePerUnit",
                    "Inherited": false,
                    "Units": "dollars",
                    "CellLinkAbbr": "Inputs!salePriceP...",
                    "Type": "DISTRIBUTION",
                    "Display": "Sale Price Per Unit"
                }, {
                    "Description": "This is the cost to service each account",
                    "Val": [0.5, 1, 1.5],
                    "Constraint": "double",
                    "CellLink": "Inputs!annualCapitalCosts",
                    "Key": "Inputs_annualCapitalCosts",
                    "Inherited": false,
                    "Units": "million dollars per account",
                    "CellLinkAbbr": "Inputs!annualCapi...",
                    "Type": "DISTRIBUTION",
                    "Display": "Annual Capital Costs"
                }, {
                    "Description": "This is the SG&A allocated as a percentage of calculated annual revenues",
                    "Val": [0.05, 0.1, 0.15],
                    "Constraint": "double",
                    "CellLink": "Inputs!sgAndA",
                    "Key": "Inputs_sgAndA",
                    "Inherited": false,
                    "Units": "fraction of annual revenue",
                    "CellLinkAbbr": "Inputs!sgAndA",
                    "Type": "DISTRIBUTION",
                    "Display": "Annual SG&A"
                }, {
                    "Description": "This is the capex incurred once for every new addition of a million units",
                    "Val": [0.5, 1, 1.5],
                    "Constraint": "double",
                    "CellLink": "Inputs!oneTimeCapex",
                    "Key": "Inputs_oneTimeCapex",
                    "Inherited": false,
                    "Units": "million dollars per million units",
                    "CellLinkAbbr": "Inputs!oneTimeCapex",
                    "Type": "DISTRIBUTION",
                    "Display": "One-time Capex"
                }, {
                    "Description": "Growth rate of units/account in the short-term",
                    "Val": [0.08, 0.1, 0.12],
                    "Constraint": "double",
                    "CellLink": "Inputs!shortTermGrowthRate",
                    "Key": "Inputs_shortTermGrowthRate",
                    "Inherited": false,
                    "Units": "fraction",
                    "CellLinkAbbr": "Inputs!shortTermG...",
                    "Type": "DISTRIBUTION",
                    "Display": "Market Short-Term Growth Rate"
                }, {
                    "Description": "How long does short-term growth of units/account last?",
                    "Val": [2, 3, 4],
                    "Constraint": "integer",
                    "CellLink": "Inputs!shortTermGrowthDuration",
                    "Key": "Inputs_shortTermGrowthDuration",
                    "Inherited": false,
                    "Units": "years",
                    "CellLinkAbbr": "Inputs!shortTermG...",
                    "Type": "DISTRIBUTION",
                    "Display": "Market Short-Term Growth Duration"
                }, {
                    "Description": "Growth rate of units/account in the long-term",
                    "Val": [0.03, 0.04, 0.05],
                    "Constraint": "double",
                    "CellLink": "Inputs!longTermGrowthRate",
                    "Key": "Inputs_longTermGrowthRate",
                    "Inherited": false,
                    "Units": "fraction",
                    "CellLinkAbbr": "Inputs!longTermGr...",
                    "Type": "DISTRIBUTION",
                    "Display": "Market Long-term Growth Rate"
                }, {
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
                }, {
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
                }]
            };
        }
        potentialTables():{} {
            return {
                "PotentialTableOutputs": [{
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
                }]
            };
        }
        potentialCharts():{} {
            return {
                "Charts": [{
                    "ChartName": "Calculations!Chart 1",
                    "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_29147.png"
                }, {
                    "ChartName": "Calculations!Chart 8",
                    "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_54094.png"
                }, {
                    "ChartName": "Waterfall!Chart 2",
                    "PreviewURL": "/AstroTmp/tmpcharts/vimg_000101010000000000_91514.png"
                }]
            };
        }

    }
    export class AccountDevTemplateWithNoMenu extends AccountDevTemplate {
        appStructure() {
            return {
                "PostProcessingOutputsForPortfolio": [{
                    "SendBack": "Tree!F11",
                    "Key": "value_given_success",
                    "Reference": "TornadoDistOutputs[0].Mean",
                    "Title": "Mean of Net-Present Value"
                }, {
                    "SendBack": "Tree!F8",
                    "Key": "High_Calculations_npv",
                    "Reference": "TornadoDistOutputs[0].Summary[2]",
                    "Title": "High of Net-Present Value"
                }, {
                    "SendBack": "Tree!F9",
                    "Key": "Med_Calculations_npv",
                    "Reference": "TornadoDistOutputs[0].Summary[1]",
                    "Title": "Med of Net-Present Value"
                }, {
                    "SendBack": "Tree!F10",
                    "Key": "Low_Calculations_npv",
                    "Reference": "TornadoDistOutputs[0].Summary[0]",
                    "Title": "Low of Net-Present Value"
                }],
                "Platform": false,
                "ID": "accountDev",
                "MENU": []
            };
        }
    }
}
