var Application = angular.module('application', ['ngRoute', 'ngMagnify']);

Application.config(function($routeProvider, $locationProvider) {

	$routeProvider
		.when('/example', {
			controller: 'ExampleController',
			templateUrl: 'views/example.tpl.html',
			reloadOnSearch: false
		})
		.when('/tvi', {
			controller: 'TviController',

		})
		.when('/temporal', {
			controller: 'temporalController',
			templateUrl: 'views/temporal.tpl.html',
			reloadOnSearch: false
		})
		.otherwise({
			redirectTo: '/login',
			controller: 'LoginController',
			templateUrl:'views/login.tpl.html'
		});

}).run(function($http) {
	
	$http.defaults.headers.post['Content-Type'] = 'application/json';
	$http.defaults.headers.put['Content-Type'] = 'application/json';
	delete $http.defaults.headers.common['X-Requested-With'];

});