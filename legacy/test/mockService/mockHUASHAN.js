var MockHUASHAN = function (_deferred) {
    this.deferred = _deferred;
    this.resolveDeferred = function (data) {
        this.deferred.resolve(data);
    };
    this.Auth = function (username, password) {
        return this.deferred.promise;
    };
    this.GetTemplates = function (credentials) {
        return this.deferred.promise;
    };
    this.GetIncludedDataStructureComponents = function (credentials, templateName) {
        return this.deferred.promise;
    };
    this.GetTemplateJsonFiles = function (credentials, templateName) {
        return this.deferred.promise;
    };
    this.GetExcludedDataStructureComponents = function (credentials, templateName) {
        return this.deferred.promise;
    };
    this.DeleteTemplate = function (credentials, templateName) {
        return this.deferred.promise;
    };
    this.GetAppStructure = function (credentials, templateName) {
        return this.deferred.promise;
    };
    this.GetPotentialTables = function (credentials, templateName) {
        return this.deferred.promise;
    };
    this.GetCharts = function (credentials, templateName) {
        return this.deferred.promise;
    };
    this.GetPortfolioStructure = function (credentials, templateName) {
        return this.deferred.promise;
    };
};
//# sourceMappingURL=mockHUASHAN.js.map