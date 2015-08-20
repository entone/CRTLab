var CRTLab = angular.module('CRTLab', ['RegionService', 'http-auth-interceptor', 'SocketService', 'LoginService']);

CRTLab.controller('LabCtrl', ['$scope', '$http', '$q', 'Region', 'authService', 'Socket', 'Auth', function($scope, $http, $q, Region, authService, Socket, Auth){
    var address = "172.16.121.163"
    var api_url = "http://"+address;
    var socket_url = "ws://"+address+"/socket";
    var client_id = '55d1f9e7333e0a203120fb0a'
    $scope.user = {};
    $scope.team = [];
    $scope.region = Region;
    $scope.token = null;
    Auth.init({
        url: api_url+'/auth/authorize',
        response_type: 'token',
        client_id: client_id,
        redirect_uri: api_url,
        other_params: {scope: 'inoffice'}
    });

    Auth.get_token().then(function(token){
        $http.defaults.headers.common.Authorization = token;
        $scope.token = token;
        init();
    }, function(){
        login();
    });

    function login(){
        Auth.login().then(function(result){
            window.localStorage.setItem("token", result.token);
            $http.defaults.headers.common.Authorization = result.token;
            $scope.token = result.token;
            authService.loginConfirmed();
            init();
        }, function(error){
            console.log(error);
        });
    }

    function init(){
        var ws = Socket.init(socket_url, $scope.token, client_id);
        ws.$on('inoffice', function(data){
            for(i in $scope.team){
                if($scope.team[i]._id == data.user._id){
                    $scope.team[i] = data.user;
                }
            }
            var state = data.result ? "arrived" : "departed";
            cordova.plugins.notification.local.schedule({
                id: parseInt(data.user._id),
                title: data.user.name+' has '+state+'.',
                icon: "file://img/crt_logo.png",
            });
        });

        $scope.$on('region:state', function(event, result){
            Socket.emit('inoffice', {'result':result});
        });

        $scope.$on('event:auth-loginRequired', function(event, data){
            login();
        });

        $http.get(api_url+"/lab/me").then(function(response){
            $scope.user = response.data[0];
            Region.init({
                uuid:'B9407F30-F5F8-466E-AFF9-25556B57FE6D',
                id:'CRT Lab'
            });
        });

        $http.get(api_url+"/lab/team").then(function(response){
            $scope.team = response.data[0];
        });
    }
}]);
