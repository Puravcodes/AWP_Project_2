var app = angular.module('myApp', []);

app.controller('DataController', function($scope, $http) {
    $http.get('/profile')
        .then(function(response) {
            $scope.User = response.data;
        })
        .catch(function(error) {
            console.error('Error fetching data:', error);
        });
});
