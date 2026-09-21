angular.module('rangal').controller("imageStandaloneCtrl", function($scope) {
    $scope.imageUrlList = [{filePath:'AstroTmp/tmpcharts/vimg_000101010000000000_12716.png'}];
    $scope.urlBase = "http://astro-dev.smartorg.com/"
    $scope.threeColumes = true;
    $scope.loaded = true;
})