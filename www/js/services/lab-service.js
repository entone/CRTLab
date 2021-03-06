var LabService = angular.module('LabService', ['SocketService']);

LabService.service('Lab', ['$http', 'Socket', '$q', function ($http, Socket, $q){
    this.users = [];
    var self = this;
    this.me = {};
    this.power_usage = [{values:[], key:'test'}];
    this.weather_data = [{values:[], key:'test'}];
    this.energy_usage = [{values:[], key:'test'}];
    this.init = function(){
        var d = $q.defer();
        $http.get(api_url+"/lab/me").then(function(response){
            self.me = response.data[0];
            d.resolve(self.me);
        }).then(function(){
            $http.get(api_url+"/lab/team").then(function(response){
                angular.copy(response.data[0], self.users);
            });
        });

        Socket.ws.$on('presence', function(data){
            console.log("presence: ", data.user);
            console.log("measurement: ", data.measurement);
            console.log("fields: ", data.fields);
            for(i in self.users){
                if(self.users[i]._id == data.user._id){
                    self.users[i] = data.user;
                }
            }
            if(data.user._id == self.me._id){
                self.me = data.user;
            }
            var state = data.user.in_office ? "arrived" : "departed";
            cordova.plugins.notification.local.schedule({
                id: parseInt(data.user._id),
                title: data.user.name+' has '+state+'.',
                icon: "file://img/crt_logo.png",
            });
        });
        return d.promise;
    };

    this.get_power_usage = function(){
        $http.get(api_url+"/lab/ups").then(function(resp){
            self.power_usage.splice(0,self.power_usage.length)
            for(var i in resp.data[0]){
                var a = {values:resp.data[0][i], key:i};
                self.power_usage.push(a);
            }
            console.log(self.power_usage);
        });
        return self.power_usage;
    };

    this.get_weather_data = function(){
        $http.get(api_url+"/lab/weather").then(function(resp){
            self.weather_data.splice(0,self.weather_data.length)
            for(var i in resp.data[0]){
                var a = {values:resp.data[0][i], key:i};
                self.weather_data.push(a);
            }
            console.log(self.weather_data);
        });
        return self.weather_data;
    };

    this.get_energy_usage = function(){
        $http.get(api_url+"/lab/energy").then(function(resp){
            self.energy_usage.splice(0,self.energy_usage.length)
            for(var i in resp.data[0]){
                var a = {values:resp.data[0][i], key:i};
                self.energy_usage.push(a);
            }
            console.log(self.energy_usage);
        });
        return self.energy_usage;
    };
}]);
