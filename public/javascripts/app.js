app = angular.module('polls', ['ngRoute', 'pollServices']);
app.config(['$routeProvider', function($routeProvider){
	$routeProvider
	.when('/polls', {
		templateUrl: 'partials/list', 
		controller: 'PollListCtrl'
	})
	.when('/poll/:pollId', {
		templateUrl: 'partials/item',
		controller: 'PollItemCtrl'
	})
	.when('/new',{
		templateUrl: 'partials/new', 
		controller: 'PollNewCtrl'
	})
	.otherwise({redirectTo: '/polls'})
}]);