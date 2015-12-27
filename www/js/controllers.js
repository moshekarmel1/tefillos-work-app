angular.module('tehillim.controllers', [])

.controller('AuthCtrl', ['$scope', '$state', 'auth', function($scope, $state, auth){
    $scope.user = {};

    $scope.register = function(){
        if(!$scope.user.username || $scope.user.username === '') {
            $scope.error = {
                class: 'warning',
                message: 'Please fill out a username...'
            };
            return;
        }
        if(!$scope.user.password || $scope.user.password === '') {
            $scope.error = {
                class: 'warning',
                message: 'Please fill out a password...'
            };
            return;
        }
        auth.register($scope.user).error(function(error){
            if(!error){
                $scope.error = {
                    class: 'danger',
                    message: 'This site does not work well with K9, sorry...'
                }
            }else{
                $scope.error = error;
                $scope.error.class = 'danger';
            }
        }).then(function(){
            $scope.error = {
                class: 'success',
                message: 'Success!'
            };
            window.history.back();
            //$state.go('home');
        });
    };

    $scope.logIn = function(){
        if(!$scope.user.username || $scope.user.username === '') {
            $scope.error = {
                class: 'warning',
                message: 'Please fill out a username...'
            };
            return;
        }
        if(!$scope.user.password || $scope.user.password === '') {
            $scope.error = {
                class: 'warning',
                message: 'Please fill out a password...'
            };
            return;
        }
        //the db stores everything lowercase anyway
        $scope.user.username = $scope.user.username.toLowerCase();
        auth.logIn($scope.user).error(function(error){
            if(!error){
                $scope.error = {
                    class: 'danger',
                    message: 'This site does not work well with K9, sorry...'
                }
            }else {
                $scope.error = error;
                $scope.error.class = 'danger';
            }
        }).then(function(){
            $scope.error = {
                class: 'success',
                message: 'Success!'
            };
            window.history.back();
            //$state.go('home');
        });
    };
}])

.controller('MainCtrl', ['$scope', 'events', 'auth', '$window', function($scope, events, auth, $window){
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.currentUser = auth.currentUser;
    $scope.events = events.events;

    $scope.listOfOptions = ['Finish Sefer Tehillim', 'Take Challah with a bracha'];

    $scope.order = 'event.created';

    $scope.setOrder = function (order) {
        $scope.order = order;
    };

    $scope.add = function(){
        $window.location.href = '/#/add';
    };
    
    $scope.addPost = function(){
        if(!$scope.title || $scope.title === '') {
            $scope.error = {
                class: 'warning',
                message: 'Please fill out a title...'
            };
            return;
        }
        if(!$scope.name || $scope.name === '') {
            $scope.error = {
                class: 'warning',
                message: 'Please enter a hebrew name...'
            };
            return;
        }
        var max;
        switch($scope.selectedItem) {
            case 'Finish Sefer Tehillim':
                max = 150;
                break;
            case 'Take Challah with a bracha':
                max = 40;
                break;
            default:
                max = 150;
                break;
        }
        events.create({
            title: $scope.title.trim(),
            name: $scope.name.trim(),
            max: max,
            description: $scope.description
        });
        $scope.title = '';
        $scope.name = '';
        $scope.description = '';
    };
}])

.controller('EventsCtrl', ['$scope', 'events', 'event', 'auth', function($scope, events, event, auth){
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.event = event;
    $scope.currentUser = auth.currentUser;
    $scope.actualCurrentUser = auth.currentUser();

    $scope.listOfOptions = ['Show all', 'Only show available', 'Lowest to Highest', 'Highest to Lowest'];

    $scope.order = 'name';

    $scope.hidden = false;

    $scope.selectedItemChanged = function(){
        switch($scope.selectedItem){
            case 'Only show available':
                $scope.hidden = true;
                break;
            case 'Show all':
                $scope.hidden = false;
                break;
            case 'Lowest to Highest':
                $scope.order = 'name';
                break;
            case 'Highest to Lowest':
                $scope.order = '-name';
                break;
            default:
                break;
        }
    };

    $scope.setOrder = function (order) {
        $scope.order = order;
    };

    $scope.kapitels = [];

    $scope.getKapitels = function(){
        var arr = [];
        for (var i = 1; i < $scope.event.max + 1; i++) {
            arr.push({
                name: i,
                isFlipped: false
            });
        }
        for (var j = 0; j < $scope.event.assignments.length; j++) {
            var current = $scope.event.assignments[j].kapitel - 1;
            if(arr[current]){
                arr[current].isFlipped = true;
                arr[current].takenBy = $scope.event.assignments[j].assignedTo;
            }
        }
        $scope.kapitels = arr;
        return arr;
    }();

    $scope.addAssignment = function(kapitel){
        if(!auth.isLoggedIn()) {
            $scope.error = {
                class: 'warning',
                message: 'You have to register or log in before you can make a selection...'
            };
            return;
        }
        events.addAssignment(event._id, {
            kapitel: kapitel.name,
            event: event._id,
            uniqueKey: event._id.toString() + kapitel.name.toString()
        }).success(function(data) {
            $scope.event.assignments.push(data.assignment);
            $scope.event = data.event;
            kapitel.isFlipped = true;
            kapitel.takenBy = data.assignment.assignedTo;
        });
    };

    $scope.deleteAssignment = function(kapitel){
        var assign;
        for (var i = 0; i < $scope.event.assignments.length; i++) {
            if($scope.event.assignments[i].kapitel === kapitel.name){
                assign = $scope.event.assignments[i];
                break;
            }
        }
        if(!assign) return;
        if(assign.assignedTo !== $scope.currentUser()){
            $scope.error = {
                class: 'warning',
                message: 'You can\'t delete assignments that aren\'t yours...'
            };
            return;
        }else{
            events.deleteAssignment(event._id, assign).success(function(data) {
                $scope.event = data;
                kapitel.isFlipped = false;
                kapitel.takenBy = null;
            });
        }
    };

    $scope.sendEmail = function(event) {
        var subject = (event.max === 150) ? escape("Can you help say some tehillim?") : escape("Are you making challah this week?");
        var link = "mailto:"
                 + "?subject=" + subject
                 + "&body=" + escape(window.location); 

        window.location.href = link;
     };
}])

.controller('NavCtrl', ['$scope', 'auth', function($scope, auth){
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.currentUser = auth.currentUser;
    $scope.logOut = auth.logOut;
}])


.controller('DashCtrl', function($scope) {})

.controller('ChatsCtrl', function($scope, Chats) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.chats = Chats.all();
  $scope.remove = function(chat) {
    Chats.remove(chat);
  };
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});
