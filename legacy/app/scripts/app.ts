/// <reference path="lib/vendorTypeDefinitions/angular.d.ts" />
/// <reference path="../lib/smartorg/smartorg.d.ts"/>
'use strict';


//-----SERVER PATH 1 | There are two paths to be changed based on project's old structure, other is is in hushan.service.ts----
// const DOMAIN = 'https://localhost';
// const ENDPOINT = 'kirk';

// const DOMAIN = 'http://127.0.0.1:5000';
// const ENDPOINT = '';

const DOMAIN = 'https://qa.smartorg.com';
const ENDPOINT = 'kirk';

// const DOMAIN = 'http://localhost:5000';
// const ENDPOINT = '';

//OUTSIDE VM (Change IP on each boot)
// const DOMAIN = 'http://192.168.52.137:5000';
// const ENDPOINT = '';



/**
 * @ngdoc overview
 * @name huashanApp
 * @description
 * # huashanApp
 *
 * Main module of the application.
 */
angular.module('huashanApp', [
    'ngRoute',
    'ngCookies',
    'ui.bootstrap',
    'ui.bootstrap.tpls',
    'ui.sortable',
    'smartorg.wizard.commitMessage',
])
    .constant('mode', 'huashan')
    .constant("config", {
        "smartorg": new SmartOrg(DOMAIN, ENDPOINT)
    })
    .config(function ($routeProvider) {
        $routeProvider
            .when('/selectTemplate', {
                controller: 'SelectTemplateController as select',
                templateUrl: 'views/selectTemplate.html',
                action: 'selectTemplate'
            })
            .when('/admin', {
                controller: 'AdminController as admin',
                templateUrl: 'views/admin.html',
                action: 'admin'
            })
            .when('/login', {
                controller: 'LoginController as login',
                templateUrl: 'views/login.html',
                action: 'login'
            })
            .when('/datastructure/:templateID', {
                controller: 'DataStructureController as data',
                templateUrl: 'views/datastructure.html',
                action: 'dataStructure',
                platform: false
            })
            .when('/platformDataStructure/:templateID', {
                controller: 'DataStructureController as data',
                templateUrl: 'views/datastructure.html',
                action: 'dataStructure',
                platform: true
            })
            .when('/appstructure/:templateID', {
                controller: 'AppStructureController as appCtrl',
                templateUrl: 'views/appstructure.html',
                action: 'appStructure',
                platform: false
            })
            .when('/platformAppStructure/:templateID', {
                controller: 'AppStructureController as appCtrl',
                templateUrl: 'views/appstructure.html',
                action: 'appStructure',
                platform: true
            })
            .when('/portfoliostructure/:templateID', {
                controller: 'PortfolioStructureController as port',
                templateUrl: 'views/portfolioStructure.html',
                action: 'portfolioStructure',
                platform: false
            })
            .when('/platformPortfolioStructure/:templateID', {
                controller: 'PortfolioStructureController as port',
                templateUrl: 'views/portfolioStructure.html',
                action: 'portfolioStructure',
                platform: true
            })
            .when('/json/:templateID', {
                controller: 'JsonController as json',
                templateUrl: 'views/json.html',
                action: 'editJSON'
            })
            .when('/revisions/:templateID', {
                controller: 'RevisionsController as ctrl',
                templateUrl: 'views/revisions.html',
                action: 'revisions'
            })
            .otherwise({
                redirectTo: '/login'
            });
    })
    .service('autoAuthService', ($http, $location) => {
        var autoAuthInterval;
        var isLogin = false;
        const TOKEN_KEY = 'JWT-TOKEN';
        const RENEW_TIMEOUT = 30 * 60 * 1000;

        window.onbeforeunload = function () {
            clearInterval(autoAuthInterval)
        };

        function autoAuth() {
            console.log('Auto auth!');
            $http({
                method: 'POST',
                url: `${DOMAIN}/${ENDPOINT}/framework/login/b`,
                headers: {
                    'Authorization': 'jwttoken ' + localStorage.getItem(TOKEN_KEY),
                    'Content-Type': undefined
                },
                transformRequest: angular.identity
            }).then((response) => {
                console.log('Auto auth success!', response);
                if (response.data && response.data.token) {
                    localStorage.setItem(TOKEN_KEY, response.data.token);
                } else {
                    throw 'No token found!';
                }
            }).catch((err) => {
                console.error(err);
                if (isLogin) {
                    isLogin = false;
                    alert('Your session has timed out! Please login again!');
                    $location.path("/login");
                }
            });
        }

        function startAutoAuth() {
            isLogin = true;
            if (typeof autoAuthInterval === 'undefined') {
                autoAuthInterval = setInterval(autoAuth, RENEW_TIMEOUT);
            }
        }

        //startAutoAuth();

        return {
            startAutoAuth: () => {
                //startAutoAuth();
            },
        }
    }).filter('customDateFormat', function() {
        return function(input) {
            if (!input) return '';
    
            // Parse the date string
            var date = new Date(input);
    
            // Extract the parts of the date
            var month = date.getMonth() + 1; // getMonth() returns 0-11, so we add 1
            var day = date.getDate();
            var year = date.getFullYear();
    
            // Format parts to mm/dd/yyyy
            return (month < 10 ? '0' : '') + month + '/' +
                   (day < 10 ? '0' : '') + day + '/' + year;
        };
    })
    // REST CalcEngine returns table previews as a full inline HTML document
    // (`HtmlPreview`: <!DOCTYPE html>…<head><style>…</head><body><table>…). Rendering the
    // whole document via ng-bind-html would leak its <head><style> (body margin/background)
    // into the CMS page. This filter strips it to the <body> inner HTML — every cell/border
    // style is inline on the elements, so the table renders identically — and returns it as a
    // trusted value (styles must survive, so trustAsHtml, NOT ngSanitize which drops style=).
    // Memoised by input string so the same trusted reference is returned each digest
    // (a fresh trustAsHtml every digest would trigger an infinite-digest loop under ng-bind-html).
    .filter('tablePreviewHtml', ['$sce', function ($sce) {
        var cache = {};
        return function (html) {
            if (!html || typeof html !== 'string') return '';
            if (!cache.hasOwnProperty(html)) {
                var m = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html) || /<body[^>]*>([\s\S]*)/i.exec(html);
                var inner = m ? m[1].trim() : html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
                cache[html] = $sce.trustAsHtml(inner);
            }
            return cache[html];
        };
    }]);
