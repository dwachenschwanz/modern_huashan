angular.module('huashanApp')
    .directive('buttonsRadio', function () {
    return {
        restrict: 'E',
        scope: { model: '=', options: '=' },
        controller: function ($scope) {
            $scope.activate = function (option) {
                $scope.model = option;
            };
        },
        template: "<button type='button' style = 'width:50%' class='btn btn-default' " +
            "ng-class='{active: option === model}'" +
            "ng-repeat='option in options' " +
            "ng-click='activate(option)'><b>{{option}}</b> " +
            "</button>"
    };
});
//# sourceMappingURL=buttonsRadio.js.map