angular.module('huashanApp').directive("huashanVersion", ["$modal","mode", 'Version',function($modal,mode, Version){
    var templateUrl = 'widget/version/app/template/version.html';
    if (mode==='standalone') {
        templateUrl = 'template/version.html'
    }
	return{
		restrict:'A',
        templateUrl: templateUrl,
		link: function(scope){
            scope.open = function (size) {
                var modalInstance = $modal.open({
                  templateUrl: 'versionContent.html',
                  controller: 'versionModalInstanceCtrl',
                  size: size,
                  resolve: {
                    versions: function () {
                      return Version.getVersion();
                    }
                  }
            });

          };
		}
	}
}]);

angular.module('huashanApp').controller('versionModalInstanceCtrl', function ($scope, $modalInstance, versions) {
  $scope.versions = versions;
  $scope.close = function(){
    $modalInstance.close();
  };
});