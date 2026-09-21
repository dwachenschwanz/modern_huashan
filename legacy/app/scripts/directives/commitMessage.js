angular.module('smartorg.wizard.commitMessage', []).directive('commitMessageModal', [function () { return ({
        template: "\n<div class=\"modal fade\" id=\"commitMessageModal\" tabindex=\"-1\" role=\"dialog\"\n     aria-hidden=\"true\">\n  <div class=\"modal-dialog\">\n    <div class=\"modal-content\">\n      <div class=\"modal-header\">\n        <button type=\"button\" class=\"close\" data-dismiss=\"modal\"><span\n            aria-hidden=\"true\">&times;</span><span\n            class=\"sr-only\">Close</span></button>\n        <h4 class=\"modal-title\">Change Message</h4>\n\n      </div>\n      <div class=\"modal-body\">\n        <h4>You will see this message in the revisions page</h4>\n        <textarea type=\"text\" ng-model=\"commitMessage\" class=\"form form-control\"\n                  id=\"commit-display\"></textarea>\n      </div>\n\n      <div class=\"modal-footer\">\n        <button class=\"btn btn-primary\"\n                ng-click=\"saveFunction({commitMessage: commitMessage})\">Ok\n        </button>\n        <!--<button class= \"btn btn-warning\" ng-click=\"uploads.cancel()\">Cancel</button>-->\n        <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">\n          Cancel\n        </button>\n      </div>\n    </div>\n  </div>\n</div>\n    ",
        restrict: 'E',
        scope: {
            saveFunction: '&'
        },
        link: function (scope) {
        }
    }); }]);
//# sourceMappingURL=commitMessage.js.map