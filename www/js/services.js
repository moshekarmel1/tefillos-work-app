angular.module('tehillim.services', [])

.factory('auth', ['$http', '$window', function($http, $window){
    var prefix = 'http://www.tefillos.work';
    var auth = {};
    //save jwt token in local storage
    auth.saveToken = function (token){
        $window.localStorage['tehillim-token'] = token;
    };
    //get jwt token from local storage
    auth.getToken = function (){
        return $window.localStorage['tehillim-token'];
    }
    //is the user logged in?
    auth.isLoggedIn = function(){
        var token = auth.getToken();
        if(token){
            var payload = JSON.parse($window.atob(token.split('.')[1]));
            return payload.exp > Date.now() / 1000;
        } else {
            return false;
        }
    };
    //get current user
    auth.currentUser = function(){
        if(auth.isLoggedIn()){
            var token = auth.getToken();
            var payload = JSON.parse($window.atob(token.split('.')[1]));
            return payload.username;
        }
    };
    //register route
    auth.register = function(user){
        return $http.post(prefix + '/register', user).success(function(data){
            auth.saveToken(data.token);
        });
    };
    //login route
    auth.logIn = function(user){
        return $http.post(prefix + '/login', user).success(function(data){
            auth.saveToken(data.token);
        });
    };

    auth.logOut = function(){
        $window.localStorage.removeItem('tehillim-token');
    };

    return auth;
}])

.factory('events', ['$http', 'auth', '$window', function($http, auth, $window){
    var prefix = 'http://www.tefillos.work';
    var o = {
        events: []
    };

    o.getAll = function() {
        return $http.get(prefix + '/browse').success(function(data){
            angular.copy(data, o.events);
        });
    };

    o.create = function(event) {
        return $http.post(prefix + '/browse', event, {
            headers: {
                Authorization: 'Bearer ' + auth.getToken()
            }
        }).success(function(data){
            o.events.push(data);
            $window.location.href = '/#/browse/' + data._id;
        }).catch(function(err){
            console.error(err);
        });
    };

    o.update = function(id, event) {
        return $http.put(prefix + '/browse/' + id, event, {
            headers: {
                Authorization: 'Bearer ' + auth.getToken()
            }
        });
    };

    o.get = function(id) {
        return $http.get(prefix + '/browse/' + id).then(function(res){
            return res.data;
        });
    };

    o.addAssignment = function(id, assignment){
        return $http.post(prefix + '/browse/' + id + '/assignments', assignment, {
            headers: {
                Authorization: 'Bearer ' + auth.getToken()
            }
        });
    };

    o.deleteAssignment = function(id, assignment){
        return $http.delete(prefix + '/browse/' + id + '/assignments/' + assignment._id, {
            headers: {
                Authorization: 'Bearer ' + auth.getToken()
            }
        });
    };

    return o;
}]);
