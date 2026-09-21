angular.module('rangal').directive("rangalImage", ["$location","mode",function($location,mode){
    var templateUrl = 'widgets/IMAGE/app/template/imageDirective.html';
    if (mode==='standalone') {
        templateUrl = 'template/imageDirective.html'
    }
	return{
		restrict:'A',
		scope:{
			imageUrlList: "=",
            urlBase: "="
		},
        // JDH: Could be?
        // templateUrl: (mode==='standalone') ? 'template/imageDirective.html' : 'widgets/image/app/template/imageDirective.html',
		templateUrl: templateUrl,
		link: function(scope, element, iAttrs, ctrl){
            scope.loaded = true;
            // JDH: There is only one image ever on the page?
            // This could probably be replaced with angular instead of jQuery
            $("#image").load(function() {
                $('#imageToBeZoomed').trigger('zoom.destroy');
                $("#imageToBeZoomed").zoom({'on': 'grab'});
                scope.loaded = true;
                scope.$apply();
            });
            if(scope.imageUrlList.length !== 0){
                scope.imageUrl = scope.urlBase+ scope.imageUrlList[0].filePath;
            }
            scope.$on('menuDataLoaded', function(event, args){
                scope.imageUrl = scope.urlBase+ args.Data.imageUrlList[0].filePath;
                scope.loaded = false;
            });

            // JDH: Remove unless needed
            console.log("image directive invoked");
			console.log(scope);
		}
	}
}])