angular.module('huashanApp')
    .directive('scrollIf', function () {
    return function (scope, element, attrs) {
        scope.$watch(attrs.scrollIf, function (value) {
            if (value) {
                // Scroll to ad.
                var pos = $(element).position().top + $(element).parent().parent().scrollTop();
                $(element).parent().parent().animate({
                    scrollTop: pos
                }, 300);
            }
        });
    };
});
//# sourceMappingURL=scrollIf.js.map