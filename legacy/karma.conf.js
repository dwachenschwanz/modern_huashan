// Karma configuration
// Generated on Mon Feb 06 2017 15:43:32 GMT-0800 (PST)

module.exports = function (config) {
    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine'],

        // list of files / patterns to load in the browser
        files: [
            "app/bower_components/smart-jasmine-matcher/src/smartJasmineMatcher.js",
            "app/lib/smartorg/smartorg.js",
            "app/bower_components/angular/angular.js",
            "app/bower_components/angular-route/angular-route.js",
            "app/bower_components/angular-cookies/angular-cookies.js",
            "app/bower_components/angular-mocks/angular-mocks.js",
            "app/bower_components/underscore/underscore.js",
            "app/bower_components/jquery/dist/jquery.js",
            "app/bower_components/angular-ui-sortable/sortable.js",
            'app/bower_components/angular-animate/angular-animate.min.js',
            "app/scripts/lib/core/md5-min.js",
            "app/scripts/lib/core/PageUtils.js",
            "app/scripts/directives/commitMessage.js",
            "app/scripts/app.js",
            "app/scripts/lib/smartorg/smartorg.js",
            "app/scripts/services/huashan.authentication.js",
            "app/scripts/services/huashan.service.js",
            "app/bower_components/angular-ui-bootstrap-bower/ui-bootstrap-tpls.js",
            "app/scripts/logic/common.js",
            "app/scripts/controllers/loginController.js",
            "app/scripts/controllers/selectTemplateController.js",
            "app/scripts/controllers/appStructureController.js",
            "app/scripts/controllers/portfolioStructureController.js",
            "app/scripts/controllers/revisionsController.js",
            "test/spec/mockData/*.js",
            "test/mockService/*.js",
            "test/spec/controllers/*.js"

        ],

        // list of files to exclude
        exclude: [],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {},

        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['progress'],

        // web server port
        port: 9876,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_ERROR,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['PhantomJS'],

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: Infinity
    })
}
