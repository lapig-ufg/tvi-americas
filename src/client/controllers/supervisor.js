'use strict';

Application.controller('SuperController', function($rootScope, $scope, $location, $window, requester, util) {

	requester._get('login/user', function(result) {
		if(!result.name) {
			$location.path('login');
		} else {
			$scope.name = result.name;
			$scope.campaign = result.campaign;
			$scope.senha = result.senha;
			init();
		}
	});

	var dataAdjustment = function(data){
		var obj = []
		for(var i = 0; i < 5; i++){
			obj.push({names: data.userName[i], landUse: data.landUse[i], counter:data.counter[i]})
		}
		console.log(data);
		$scope.obj = obj;			
		$scope.data = data;			
		requestSupportInfo()
	}

	$scope.logoff = function(){
		requester._get('login/logoff', function(result){

		})
	}

	$scope.submit = function(longitude, latitude){
		requester._get(longitude+"/"+latitude, function(data){
			dataAdjustment(data);
		});
	}

	var requestSupportInfo = function() {
		if($scope.data) {
			var params = {
				region: $scope.data.biome,
				regionType:'biome',
				city:$scope.data.countyCode,
				lang:"pt-br"
			};

			requester._get("spatial/query", params, function(pastagem) {
				util._suport(pastagem, function(suportData){
					$scope.suportData = suportData;				
				});
			});		
		}
	}

	var init = function() {

		requester._get('points/get-point', function(data) {
			dataAdjustment(data);			
		});
	}	

});