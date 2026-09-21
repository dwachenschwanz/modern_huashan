angular.module('huashanApp')
    .directive('fileModel', ['$parse', function ($parse) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var fileModel = $parse(attrs.fileModel);
                var fileModelSetterFn = fileModel.assign;
                element.bind('change', function () {
                    scope.$apply(function () {
                        var elementSurroundingFileModelDiv = element[0];
                        var fileSelectedInElement = elementSurroundingFileModelDiv.files[0];
                        fileModelSetterFn(scope, fileSelectedInElement);
                    });
                });
            }
        };
    }]);
//# sourceMappingURL=fileModel.js.map