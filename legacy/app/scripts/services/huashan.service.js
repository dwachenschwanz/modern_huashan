var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
//-----SERVER PATH 2 | There are two paths to be changed based on project's old structure, other is is in app.ts-----
var app = {
    // server: 'https://localhost',
    // endPoint: '/kirk',
    server: 'https://qa.smartorg.com/kirk',
    endPoint: '',
};
var HuashanSig = /** @class */ (function () {
    function HuashanSig() {
    }
    HuashanSig.prototype.Auth = function (username, password) {
    };
    HuashanSig.prototype.GetTemplates = function (credentials) {
    };
    HuashanSig.prototype.GetAstroTemplates = function (credentials) {
    };
    HuashanSig.prototype.GetArchivedAstroTemplates = function (credentials) {
    };
    HuashanSig.prototype.FindAssociatedPortfolios = function (credentials, templateName) {
    };
    HuashanSig.prototype.UpdateDataStructure = function (credentials, portfolioName, leaf, platform) {
    };
    HuashanSig.prototype.SaveTemplateInfo = function (credentials, templateName, info) {
    };
    HuashanSig.prototype.GetTemplateJsonFiles = function (credentials, templateName) {
    };
    HuashanSig.prototype.GetIncludedDataStructureComponents = function (credentials, templateName, isPlatform) {
    };
    HuashanSig.prototype.GetExcludedDataStructureComponents = function (credentials, templateName, isPlatform) {
    };
    HuashanSig.prototype.SaveTemplateJsonFiles = function (credentials, data) {
    };
    HuashanSig.prototype.SaveDataStructure = function (credentials, templateName, data, isPlatform) {
    };
    HuashanSig.prototype.UploadFile = function (credentials, fileName, file) {
    };
    HuashanSig.prototype.RenameTemplate = function (credentials, templateName, newTemplateName) {
    };
    HuashanSig.prototype.DeleteTemplate = function (credentials, templateName) {
    };
    HuashanSig.prototype.GetAppStructure = function (credentials, templateName, isPlatform) {
    };
    HuashanSig.prototype.GetPotentialTables = function (credentials, templateName) {
    };
    HuashanSig.prototype.GetCharts = function (credentials, templateName) {
    };
    HuashanSig.prototype.SaveAppStructure = function (credentials, templateName, data, isPlatform) {
    };
    HuashanSig.prototype.GetPortfolioStructure = function (credentials, templateName, isPlatform) {
    };
    HuashanSig.prototype.ListDeletedTemplates = function (credentilas) {
    };
    HuashanSig.prototype.UndeleteTemplate = function (credentials, templateName) {
    };
    HuashanSig.prototype.SavePortfolioStructure = function (credentials, templateName, data, isPlatform) {
    };
    HuashanSig.prototype.OgreMakeTemplate = function (credentials, templateName, modelName) {
    };
    HuashanSig.prototype.GetRevisions = function (credentials, templateName) {
    };
    HuashanSig.prototype.SyncTemplate = function (credentials, templateName) {
    };
    HuashanSig.prototype.SwitchRevisionByCommitHash = function (credentials, templateName, data) {
    };
    HuashanSig.prototype.CompareJsonFiles = function (credentials, templateName, data) {
    };
    return HuashanSig;
}());
var Huashan = /** @class */ (function (_super) {
    __extends(Huashan, _super);
    function Huashan($http) {
        var _this = _super.call(this) || this;
        _this.$http = $http;
        _this.addCommandMethods();
        return _this;
    }
    Huashan.prototype.getAllMethods = function () {
        var _this = this;
        var superClassObj = this.__proto__.__proto__;
        return Object.getOwnPropertyNames(superClassObj).filter(function (property) {
            return typeof _this[property] == 'function' && property !== 'constructor';
        });
    };
    Huashan.prototype.addCommandMethods = function () {
        var _this = this;
        _.each(this.getAllMethods(), function (method) {
            _this[method] = new CreateCommand(method, _this.$http).makeSignature();
        });
    };
    return Huashan;
}(HuashanSig));
angular.module('huashanApp')
    .factory('HUASHAN', function ($http) {
    return new Huashan($http);
});
angular.module('huashanApp')
    .service('SERVER', function () {
    return { 'url': app.server };
});
var CreateCommand = /** @class */ (function () {
    function CreateCommand(name, $http) {
        this.name = name;
        this.$http = $http;
    }
    CreateCommand.prototype.makeSignature = function () {
        var _this = this;
        return function (credentials, templateName, data, isPlatform) { return _this.newInstance(_this.name, _this.$http, credentials, templateName, data, isPlatform).makePromise(); };
    };
    CreateCommand.prototype.newInstance = function (strClass, arg1, arg2, arg3) {
        var args = Array.prototype.slice.call(arguments, 1);
        var clsClass = window[strClass];
        function F() {
            return clsClass.apply(this, args);
        }
        F.prototype = clsClass.prototype;
        return new F();
    };
    return CreateCommand;
}());
var BasicCommand = /** @class */ (function () {
    function BasicCommand($http) {
        this.$http = $http;
        this.name = this.commandName();
        //The following line is for debug
        // this.urlBase = "http://127.0.0.1:5000/wizard/main?";
        //The following line is not for debug
        this.urlBase = app.server + app.endPoint + "/wizard/main?";
    }
    BasicCommand.prototype.commandName = function () {
        throw "Should not call this directly";
    };
    BasicCommand.prototype.url = function () {
        return this.urlBase + "command=" + this.name + "&kreds=" + this.kreds;
    };
    BasicCommand.prototype.makePromise = function () {
        var that = this;
        var promise = this.$http.get(this.url(), { "headers": { 'Authorization': 'jwttoken ' + localStorage.getItem("JWT-TOKEN") } }).then(function (response) {
            if (response.token) {
                localStorage.setItem("JWT-TOKEN", response.token);
            }
            console.log(response);
            var answer = {
                msg: "",
                status: false,
                result: null,
                credentials: that.kreds
            };
            if (response.data.commands[0].name == "Alert") {
                answer.msg = TheUte().unravel(response.data.commands[0].parameters[0].value);
            }
            else if (response.data.commands[0].parameters[1].value === "1") {
                if (TheUte().unravel(response.data.commands[0].parameters[0].value).indexOf("[") == -1) {
                    answer.result = JSON.parse(JSON.stringify(TheUte().unravel(response.data.commands[0].parameters[0].value)));
                }
                else {
                    answer.result = JSON.parse(TheUte().unravel(response.data.commands[0].parameters[0].value));
                }
                answer.status = true;
            }
            return answer;
        });
        return promise;
    };
    return BasicCommand;
}());
var Auth = /** @class */ (function (_super) {
    __extends(Auth, _super);
    function Auth($http, username, password) {
        var _this = _super.call(this, $http) || this;
        _this.kreds = _this.makeKreds(username, password);
        return _this;
    }
    Auth.prototype.commandName = function () {
        return "Auth";
    };
    Auth.prototype.makeKreds = function (username, password) {
        var kreds = [];
        kreds.push(username);
        kreds.push(hex_md5(password));
        return TheUte().pack(kreds.join("_"));
    };
    return Auth;
}(BasicCommand));
var FindAssociatedPortfolios = /** @class */ (function (_super) {
    __extends(FindAssociatedPortfolios, _super);
    function FindAssociatedPortfolios($http, kreds, templateName) {
        var _this = _super.call(this, $http) || this;
        _this.kreds = kreds;
        _this.templateName = templateName;
        return _this;
    }
    FindAssociatedPortfolios.prototype.commandName = function () {
        return "FindAssociatedPortfolios";
    };
    FindAssociatedPortfolios.prototype.url = function () {
        return _super.prototype.url.call(this) + "&templateName=" + this.templateName;
    };
    return FindAssociatedPortfolios;
}(BasicCommand));
var UpdateDataStructure = /** @class */ (function (_super) {
    __extends(UpdateDataStructure, _super);
    function UpdateDataStructure($http, kreds, portfolioName, leaf, platform) {
        var _this = _super.call(this, $http) || this;
        _this.kreds = kreds;
        _this.portfolioName = portfolioName;
        _this.leaf = leaf;
        _this.platform = platform;
        return _this;
    }
    UpdateDataStructure.prototype.commandName = function () {
        return "UpdateDataStructure";
    };
    UpdateDataStructure.prototype.url = function () {
        return _super.prototype.url.call(this) + "&portfolioName=" + this.portfolioName + "&runLeaf=" + this.leaf + "&runPlatform=" + this.platform;
    };
    return UpdateDataStructure;
}(BasicCommand));
var GetTemplates = /** @class */ (function (_super) {
    __extends(GetTemplates, _super);
    function GetTemplates($http, kreds) {
        var _this = _super.call(this, $http) || this;
        _this.kreds = kreds;
        return _this;
    }
    GetTemplates.prototype.commandName = function () {
        return "GetTemplates";
    };
    return GetTemplates;
}(BasicCommand));
var GetAstroTemplates = /** @class */ (function (_super) {
    __extends(GetAstroTemplates, _super);
    function GetAstroTemplates($http, kreds) {
        var _this = _super.call(this, $http) || this;
        _this.kreds = kreds;
        return _this;
    }
    GetAstroTemplates.prototype.commandName = function () {
        return "GetAstroTemplates";
    };
    return GetAstroTemplates;
}(BasicCommand));
var GetArchivedAstroTemplates = /** @class */ (function (_super) {
    __extends(GetArchivedAstroTemplates, _super);
    function GetArchivedAstroTemplates($http, kreds) {
        var _this = _super.call(this, $http) || this;
        _this.kreds = kreds;
        return _this;
    }
    GetArchivedAstroTemplates.prototype.commandName = function () {
        return "GetArchivedAstroTemplates";
    };
    return GetArchivedAstroTemplates;
}(BasicCommand));
var OgreMakeTemplate = /** @class */ (function (_super) {
    __extends(OgreMakeTemplate, _super);
    function OgreMakeTemplate($http, kreds, templateName, modelName) {
        var _this = _super.call(this, $http) || this;
        _this.kreds = kreds;
        _this.templateName = templateName;
        _this.modelName = modelName;
        return _this;
    }
    OgreMakeTemplate.prototype.commandName = function () {
        return "MakeTemplate";
    };
    OgreMakeTemplate.prototype.url = function () {
        return _super.prototype.url.call(this) + "&templateName=" + this.templateName + "&modelName=" + this.modelName;
    };
    return OgreMakeTemplate;
}(BasicCommand));
var ListDeletedTemplates = /** @class */ (function (_super) {
    __extends(ListDeletedTemplates, _super);
    function ListDeletedTemplates($http, kreds) {
        var _this = _super.call(this, $http) || this;
        _this.kreds = kreds;
        return _this;
    }
    ListDeletedTemplates.prototype.commandName = function () {
        return "ListDeletedTemplates";
    };
    return ListDeletedTemplates;
}(BasicCommand));
var TemplateCommand = /** @class */ (function (_super) {
    __extends(TemplateCommand, _super);
    function TemplateCommand($http, kreds, templateName) {
        var _this = _super.call(this, $http) || this;
        _this.kreds = kreds;
        _this.templateName = templateName;
        return _this;
    }
    TemplateCommand.prototype.url = function () {
        return _super.prototype.url.call(this) + "&templateName=" + this.templateName;
    };
    return TemplateCommand;
}(BasicCommand));
var PlatformCommand = /** @class */ (function (_super) {
    __extends(PlatformCommand, _super);
    function PlatformCommand($http, kreds, templateName, isPlatform) {
        var _this = _super.call(this, $http, kreds, templateName) || this;
        _this.isPlatform = isPlatform;
        return _this;
    }
    PlatformCommand.prototype.url = function () {
        return _super.prototype.url.call(this) + "&isPlatform=" + this.isPlatform;
    };
    return PlatformCommand;
}(TemplateCommand));
var GetIncludedDataStructureComponents = /** @class */ (function (_super) {
    __extends(GetIncludedDataStructureComponents, _super);
    function GetIncludedDataStructureComponents() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GetIncludedDataStructureComponents.prototype.commandName = function () {
        return "GetDataStructure";
    };
    return GetIncludedDataStructureComponents;
}(PlatformCommand));
var GetAppStructure = /** @class */ (function (_super) {
    __extends(GetAppStructure, _super);
    function GetAppStructure() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GetAppStructure.prototype.commandName = function () {
        return "GetAppStructure";
    };
    return GetAppStructure;
}(PlatformCommand));
var GetPortfolioStructure = /** @class */ (function (_super) {
    __extends(GetPortfolioStructure, _super);
    function GetPortfolioStructure() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GetPortfolioStructure.prototype.commandName = function () {
        return "GetPortfolioStructure";
    };
    return GetPortfolioStructure;
}(PlatformCommand));
var GetTemplateJsonFiles = /** @class */ (function (_super) {
    __extends(GetTemplateJsonFiles, _super);
    function GetTemplateJsonFiles() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GetTemplateJsonFiles.prototype.commandName = function () {
        return "GetTemplateJsonFiles";
    };
    return GetTemplateJsonFiles;
}(TemplateCommand));
var GetExcludedDataStructureComponents = /** @class */ (function (_super) {
    __extends(GetExcludedDataStructureComponents, _super);
    function GetExcludedDataStructureComponents() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GetExcludedDataStructureComponents.prototype.commandName = function () {
        return "GetExcludedDataStructureComponents";
    };
    return GetExcludedDataStructureComponents;
}(PlatformCommand));
var GetPotentialTables = /** @class */ (function (_super) {
    __extends(GetPotentialTables, _super);
    function GetPotentialTables() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GetPotentialTables.prototype.commandName = function () {
        return "GetPotentialTables";
    };
    return GetPotentialTables;
}(TemplateCommand));
var GetCharts = /** @class */ (function (_super) {
    __extends(GetCharts, _super);
    function GetCharts() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GetCharts.prototype.commandName = function () {
        return "GetCharts";
    };
    return GetCharts;
}(TemplateCommand));
var TemplatePostCommand = /** @class */ (function (_super) {
    __extends(TemplatePostCommand, _super);
    function TemplatePostCommand($http, kreds, templateName, data, isPlatform) {
        var _this = _super.call(this, $http, kreds, templateName, isPlatform) || this;
        _this.data = data;
        return _this;
    }
    TemplatePostCommand.prototype.makePromise = function () {
        var that = this;
        var promise = this.$http.post(this.url(), this.data, { "headers": { 'Authorization': 'jwttoken ' + localStorage.getItem("JWT-TOKEN") } }).then(function (response) {
            if (response.token) {
                localStorage.setItem("JWT-TOKEN", response.token);
            }
            var answer = {
                msg: "",
                status: false,
                result: null,
                credentials: that.kreds
            };
            if (response.data.commands[0].name === "Alert") {
                answer.msg = TheUte().unravel(response.data.commands[0].parameters[0].value);
            }
            else if (response.data.commands[0].parameters[1].value === "1") {
                answer.result = JSON.parse(JSON.stringify(TheUte().unravel(response.data.commands[0].parameters[0].value)));
                answer.status = true;
            }
            return answer;
        })["catch"](function (ex) {
            throw ex;
        });
        return promise;
    };
    return TemplatePostCommand;
}(PlatformCommand));
var SwitchRevisionByCommitHash = /** @class */ (function (_super) {
    __extends(SwitchRevisionByCommitHash, _super);
    function SwitchRevisionByCommitHash() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SwitchRevisionByCommitHash.prototype.commandName = function () {
        return "SwitchRevisionByCommitHash";
    };
    return SwitchRevisionByCommitHash;
}(TemplatePostCommand));
var CompareJsonFiles = /** @class */ (function (_super) {
    __extends(CompareJsonFiles, _super);
    function CompareJsonFiles() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    CompareJsonFiles.prototype.commandName = function () {
        return "CompareJsonFiles";
    };
    return CompareJsonFiles;
}(TemplatePostCommand));
var SaveTemplateInfo = /** @class */ (function (_super) {
    __extends(SaveTemplateInfo, _super);
    function SaveTemplateInfo() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SaveTemplateInfo.prototype.commandName = function () {
        return "SaveTemplateInfo";
    };
    return SaveTemplateInfo;
}(TemplatePostCommand));
var SaveTemplateJsonFiles = /** @class */ (function (_super) {
    __extends(SaveTemplateJsonFiles, _super);
    function SaveTemplateJsonFiles() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SaveTemplateJsonFiles.prototype.commandName = function () {
        return "SaveTemplateJSON";
    };
    return SaveTemplateJsonFiles;
}(TemplatePostCommand));
var SaveDataStructure = /** @class */ (function (_super) {
    __extends(SaveDataStructure, _super);
    function SaveDataStructure() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SaveDataStructure.prototype.commandName = function () {
        return "SaveDataStructure";
    };
    return SaveDataStructure;
}(TemplatePostCommand));
var SaveAppStructure = /** @class */ (function (_super) {
    __extends(SaveAppStructure, _super);
    function SaveAppStructure() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SaveAppStructure.prototype.commandName = function () {
        return "SaveAppStructure";
    };
    return SaveAppStructure;
}(TemplatePostCommand));
var SavePortfolioStructure = /** @class */ (function (_super) {
    __extends(SavePortfolioStructure, _super);
    function SavePortfolioStructure() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SavePortfolioStructure.prototype.commandName = function () {
        return "SavePortfolioStructure";
    };
    return SavePortfolioStructure;
}(TemplatePostCommand));
var UploadFile = /** @class */ (function (_super) {
    __extends(UploadFile, _super);
    function UploadFile($http, credentials, fileName, formData) {
        var _this = _super.call(this, $http) || this;
        _this.credentials = credentials;
        _this.fileName = fileName;
        _this.fileData = formData;
        return _this;
    }
    UploadFile.prototype.commandName = function () {
        return "";
    };
    UploadFile.prototype.url = function () {
        return app.server + "/fileD";
    };
    UploadFile.prototype.upload = function (file) {
        var fileName = this.fileName;
        var formData = new FormData();
        formData.append('kreds', this.credentials);
        formData.append('file', file);
        return this.makePromise(formData);
    };
    UploadFile.prototype.makePromise = function () {
        var that = this;
        var formData = new FormData();
        formData.append('kreds', this.credentials);
        formData.append('file', this.fileData);
        var urlToPost = app.server + '/fileD';
        return this.$http({
            method: 'POST',
            url: urlToPost,
            data: formData,
            headers: {
                'Content-Type': undefined
            },
            transformRequest: angular.identity
        });
    };
    return UploadFile;
}(BasicCommand));
var DeleteTemplate = /** @class */ (function (_super) {
    __extends(DeleteTemplate, _super);
    function DeleteTemplate() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DeleteTemplate.prototype.commandName = function () {
        return "DeleteTemplate";
    };
    return DeleteTemplate;
}(TemplateCommand));
var UndeleteTemplate = /** @class */ (function (_super) {
    __extends(UndeleteTemplate, _super);
    function UndeleteTemplate() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    UndeleteTemplate.prototype.commandName = function () {
        return "UndeleteTemplate";
    };
    return UndeleteTemplate;
}(TemplateCommand));
var RenameTemplate = /** @class */ (function (_super) {
    __extends(RenameTemplate, _super);
    function RenameTemplate($http, kreds, templateName, newTemplateName) {
        var _this = _super.call(this, $http, kreds, templateName) || this;
        _this.newTemplateName = newTemplateName;
        return _this;
    }
    RenameTemplate.prototype.commandName = function () {
        return "RenameTemplate";
    };
    RenameTemplate.prototype.url = function () {
        return _super.prototype.url.call(this) + "&newTemplateName=" + this.newTemplateName;
    };
    return RenameTemplate;
}(TemplateCommand));
var GetRevisions = /** @class */ (function (_super) {
    __extends(GetRevisions, _super);
    function GetRevisions() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GetRevisions.prototype.commandName = function () {
        return "GetRevisions";
    };
    return GetRevisions;
}(TemplateCommand));
var SyncTemplate = /** @class */ (function (_super) {
    __extends(SyncTemplate, _super);
    function SyncTemplate() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SyncTemplate.prototype.commandName = function () {
        return "SyncTemplate";
    };
    return SyncTemplate;
}(TemplateCommand));
//# sourceMappingURL=huashan.service.js.map