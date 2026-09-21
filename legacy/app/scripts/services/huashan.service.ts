declare var TheUte: any;
declare var hex_md5: any;

//-----SERVER PATH 2 | There are two paths to be changed based on project's old structure, other is is in app.ts-----
var app = {
    // server: 'https://localhost',
    // endPoint: '/kirk',
    
    // server: 'http://localhost',
    // endPoint: '/kirk',

    server: 'https://qa.smartorg.com/kirk',
    endPoint: '',

    // server: 'http://127.0.0.1:5000',
    // endPoint: '',

    // server: 'http://192.168.52.137:5000',
    // endPoint: '',

    //Not for use right now, only put wizard-api in path in selectTemplateController, when needed
    // server: 'http://192.168.52.135:5000/wizard-api',
    // endPoint: '',

    
};

class HuashanSig {
    Auth(username, password) {
    }

    GetTemplates(credentials) {
    }

    GetAstroTemplates(credentials) {
    }

    GetArchivedAstroTemplates(credentials) {
    }

    FindAssociatedPortfolios(credentials, templateName) {
    }

    UpdateDataStructure(credentials, portfolioName, leaf, platform) {
    }

    SaveTemplateInfo(credentials, templateName, info) {
    }

    GetTemplateJsonFiles(credentials, templateName) {
    }

    GetIncludedDataStructureComponents(credentials, templateName, isPlatform: boolean) {
    }

    GetExcludedDataStructureComponents(credentials, templateName, isPlatform: boolean) {
    }

    SaveTemplateJsonFiles(credentials, data) {
    }

    SaveDataStructure(credentials, templateName, data, isPlatform: boolean) {
    }

    UploadFile(credentials, fileName, file) {
    }

    RenameTemplate(credentials, templateName, newTemplateName) {
    }

    DeleteTemplate(credentials, templateName) {
    }

    GetAppStructure(credentials, templateName, isPlatform: boolean) {
    }

    GetPotentialTables(credentials, templateName) {
    }

    GetCharts(credentials, templateName) {
    }

    SaveAppStructure(credentials, templateName, data, isPlatform: boolean) {
    }

    GetPortfolioStructure(credentials, templateName, isPlatform: boolean) {
    }

    ListDeletedTemplates(credentilas) {
    }

    UndeleteTemplate(credentials, templateName) {
    }

    SavePortfolioStructure(credentials, templateName, data, isPlatform: boolean) {
    }

    OgreMakeTemplate(credentials, templateName, modelName) {
    }

    GetRevisions(credentials, templateName) {
    }

    SyncTemplate(credentials, templateName) {
    }

    SwitchRevisionByCommitHash(credentials, templateName, data) {
    }

    CompareJsonFiles(credentials, templateName, data) {
    }
}

class Huashan extends HuashanSig {
    $http: any;

    constructor($http: any) {
        super();
        this.$http = $http;
        this.addCommandMethods();
    }

    getAllMethods() {
        var superClassObj = this.__proto__.__proto__;
        return Object.getOwnPropertyNames(superClassObj).filter((property) => {
            return typeof this[property] == 'function' && property !== 'constructor';
        });
    }

    addCommandMethods() {
        _.each(this.getAllMethods(), (method) => {
            this[method] = new CreateCommand(method, this.$http).makeSignature();
        })
    }
}


angular.module('huashanApp')
    .factory('HUASHAN', function ($http) {
        return new Huashan($http);
    });

angular.module('huashanApp')
    .service('SERVER', function () {
        return {'url': app.server}
    });


class CreateCommand {
    name: string;
    $http: any;

    constructor(name: string, $http: any) {
        this.name = name;
        this.$http = $http;
    }

    makeSignature() {
        return (credentials, templateName, data, isPlatform)
            => this.newInstance(this.name, this.$http, credentials, templateName, data, isPlatform).makePromise();
    }

    newInstance(strClass: string, arg1?: any, arg2?: any, arg3?: any) {
        var args = Array.prototype.slice.call(arguments, 1);
        var clsClass = window[strClass];

        function F() {
            return clsClass.apply(this, args);
        }

        F.prototype = clsClass.prototype;
        return new F();
    }
}

interface ServerCommand {
    name: string;

    url();

    commandName(): string;

    makePromise(): void;
}

class BasicCommand implements ServerCommand {
    name: string;
    kreds: string;
    urlBase: string;
    $http: any;

    constructor($http: any) {
        this.$http = $http;
        this.name = this.commandName();
        //The following line is for debug
        // this.urlBase = "http://127.0.0.1:5000/wizard/main?";

        //The following line is not for debug
        this.urlBase = app.server+app.endPoint+"/wizard/main?";
    }

    commandName(): string {
        throw "Should not call this directly";
    }

    url() {
        return this.urlBase + "command=" + this.name + "&kreds=" + this.kreds;
    }

    makePromise() {
        var that = this;
        var promise = this.$http.get(this.url(), {"headers": {'Authorization': 'jwttoken ' + localStorage.getItem("JWT-TOKEN")}}).then(function (response) {
            if (response.token) {
                localStorage.setItem("JWT-TOKEN", response.token)
            }
            console.log(response)
            var answer = {
                msg: "",
                status: false,
                result: null,
                credentials: that.kreds
            };
            if (response.data.commands[0].name == "Alert") {
                answer.msg = TheUte().unravel(response.data.commands[0].parameters[0].value);
            } else if (response.data.commands[0].parameters[1].value === "1") {
                if (TheUte().unravel(response.data.commands[0].parameters[0].value).indexOf("[") == -1) {
                    answer.result = JSON.parse(JSON.stringify(TheUte().unravel(response.data.commands[0].parameters[0].value)));
                } else {
                    answer.result = JSON.parse(TheUte().unravel(response.data.commands[0].parameters[0].value));
                }

                answer.status = true;
            }
            return answer;
        });
        return promise;
    }
}

class Auth extends BasicCommand {
    constructor($http: any, username: string, password: string) {
        super($http);
        this.kreds = this.makeKreds(username, password);
    }

    commandName() {
        return "Auth";
    }

    makeKreds(username: string, password: string) {
        var kreds = [];
        kreds.push(username);
        kreds.push(hex_md5(password));
        return TheUte().pack(kreds.join("_"));
    }
}

class FindAssociatedPortfolios extends BasicCommand {
    templateName;

    constructor($http: any, kreds: string, templateName: string) {
        super($http);
        this.kreds = kreds;
        this.templateName = templateName;
    }

    commandName() {
        return "FindAssociatedPortfolios";
    }

    url() {
        return super.url() + "&templateName=" + this.templateName;
    }
}

class UpdateDataStructure extends BasicCommand {
    portfolioName: string;
    leaf: boolean;
    platform: boolean;

    constructor($http: any, kreds: string, portfolioName: string, leaf: boolean, platform: boolean) {
        super($http);
        this.kreds = kreds;
        this.portfolioName = portfolioName;
        this.leaf = leaf;
        this.platform = platform;
    }

    commandName() {
        return "UpdateDataStructure";
    }

    url() {
        return super.url() + "&portfolioName=" + this.portfolioName + "&runLeaf=" + this.leaf + "&runPlatform=" + this.platform;
    }
}


class GetTemplates extends BasicCommand {
    constructor($http: any, kreds: string) {
        super($http);
        this.kreds = kreds;
    }

    commandName() {
        return "GetTemplates";
    }
}
class GetAstroTemplates extends BasicCommand {
    constructor($http: any, kreds: string) {
        super($http);
        this.kreds = kreds;
    }

    commandName() {
        return "GetAstroTemplates";
    }
}
class GetArchivedAstroTemplates extends BasicCommand {
    constructor($http: any, kreds: string) {
        super($http);
        this.kreds = kreds;
    }

    commandName() {
        return "GetArchivedAstroTemplates";
    }
}

class OgreMakeTemplate extends BasicCommand {
    templateName: string;
    modelName: string;

    constructor($http: any, kreds: string, templateName: string, modelName: string) {
        super($http);
        this.kreds = kreds;
        this.templateName = templateName;
        this.modelName = modelName;
    }

    commandName() {
        return "MakeTemplate";
    }

    url() {
        return super.url() + "&templateName=" + this.templateName + "&modelName=" + this.modelName;
    }
}

class ListDeletedTemplates extends BasicCommand {
    constructor($http: any, kreds: string) {
        super($http);
        this.kreds = kreds;
    }

    commandName() {
        return "ListDeletedTemplates";
    }
}

class TemplateCommand extends BasicCommand {
    templateName: string;

    constructor($http: any, kreds: string, templateName: string) {
        super($http);
        this.kreds = kreds;
        this.templateName = templateName;
    }

    url() {
        return super.url() + "&templateName=" + this.templateName;
    }
}

class PlatformCommand extends TemplateCommand {
    isPlatform: boolean;

    constructor($http: any, kreds: string, templateName: string, isPlatform: boolean) {
        super($http, kreds, templateName);
        this.isPlatform = isPlatform;
    }

    url() {
        return super.url() + "&isPlatform=" + this.isPlatform;
    }
}


class GetIncludedDataStructureComponents extends PlatformCommand {

    commandName() {
        return "GetDataStructure";
    }
}

class GetAppStructure extends PlatformCommand {

    commandName() {
        return "GetAppStructure";
    }
}

class GetPortfolioStructure extends PlatformCommand {

    commandName() {
        return "GetPortfolioStructure";
    }
}

class GetTemplateJsonFiles extends TemplateCommand {
    commandName() {
        return "GetTemplateJsonFiles";
    }
}

class GetExcludedDataStructureComponents extends PlatformCommand {
    commandName() {
        return "GetExcludedDataStructureComponents";
    }
}

class GetPotentialTables extends TemplateCommand {
    commandName() {
        return "GetPotentialTables";
    }
}

class GetCharts extends TemplateCommand {
    commandName() {
        return "GetCharts";
    }
}

class TemplatePostCommand extends PlatformCommand {
    data: any;

    constructor($http: any, kreds: string, templateName: string, data: any, isPlatform: boolean) {
        super($http, kreds, templateName, isPlatform);
        this.data = data;
    }

    makePromise() {
        var that = this;
        var promise = this.$http.post(this.url(), this.data, {"headers": {'Authorization': 'jwttoken ' + localStorage.getItem("JWT-TOKEN")}}).then(function (response) {
            if (response.token) {
                localStorage.setItem("JWT-TOKEN", response.token)
            }
            var answer = {
                msg: "",
                status: false,
                result: null,
                credentials: that.kreds
            };
            if (response.data.commands[0].name === "Alert") {
                answer.msg = TheUte().unravel(response.data.commands[0].parameters[0].value);
            } else if (response.data.commands[0].parameters[1].value === "1") {
                answer.result = JSON.parse(JSON.stringify(TheUte().unravel(response.data.commands[0].parameters[0].value)));
                answer.status = true;
            }
            return answer;
        }).catch((ex) => {
            throw ex
        });
        return promise;
    }
}

class SwitchRevisionByCommitHash extends TemplatePostCommand {
    commandName() {
        return "SwitchRevisionByCommitHash";
    }
}

class CompareJsonFiles extends TemplatePostCommand {
    commandName() {
        return "CompareJsonFiles";
    }
}

class SaveTemplateInfo extends TemplatePostCommand {
    commandName() {
        return "SaveTemplateInfo";
    }
}

class SaveTemplateJsonFiles extends TemplatePostCommand {
    commandName() {
        return "SaveTemplateJSON";
    }
}

class SaveDataStructure extends TemplatePostCommand {
    commandName() {
        return "SaveDataStructure";
    }
}

class SaveAppStructure extends TemplatePostCommand {
    commandName() {
        return "SaveAppStructure";
    }
}

class SavePortfolioStructure extends TemplatePostCommand {
    commandName() {
        return "SavePortfolioStructure";
    }
}

class UploadFile extends BasicCommand {
    credentials: string;
    fileName: string;
    fileData: any;

    constructor($http: any, credentials: string, fileName: string, formData: any) {
        super($http);
        this.credentials = credentials;
        this.fileName = fileName;
        this.fileData = formData;
    }

    commandName() {
        return "";
    }

    url() {
        return app.server + "/fileD";
    }

    upload(file) {
        var fileName = this.fileName;
        var formData = new FormData();
        formData.append('kreds', this.credentials);
        formData.append('file', file);
        return this.makePromise(formData);
    }

    makePromise() {
        var that = this;
        var formData = new FormData();
        formData.append('kreds', this.credentials);
        formData.append('file', this.fileData);
        var urlToPost = app.server + '/fileD'
        return this.$http({
            method: 'POST',
            url: urlToPost,
            data: formData,
            headers: {
                'Content-Type': undefined
            },
            transformRequest: angular.identity
        });

    }
}

class DeleteTemplate extends TemplateCommand {

    commandName() {
        return "DeleteTemplate";
    }
}

class UndeleteTemplate extends TemplateCommand {

    commandName() {
        return "UndeleteTemplate";
    }
}

class RenameTemplate extends TemplateCommand {
    newTemplateName: string;

    constructor($http: any, kreds: string, templateName: string, newTemplateName: string) {
        super($http, kreds, templateName);
        this.newTemplateName = newTemplateName;
    }

    commandName() {
        return "RenameTemplate";
    }

    url() {
        return super.url() + "&newTemplateName=" + this.newTemplateName;
    }
}

class GetRevisions extends TemplateCommand {
    commandName() {
        return "GetRevisions";
    }
}

class SyncTemplate extends TemplateCommand {
    commandName() {
        return "SyncTemplate";
    }
}