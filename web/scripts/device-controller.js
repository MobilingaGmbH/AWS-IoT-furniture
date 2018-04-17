/**
 * @class DeviceController
 * @classdesc
 * @ngInject
 */
function DeviceController($auth, $log, IdentityService, user, NgTableParams) {
  var ctl = this;
  
  ctl.test = 'testing';
  ctl.user = user;

  ctl.t = function (key) {
    var lang = localStorage.getItem('lang') || 'en';
    return polyglot.t(lang + '.device.' + key);
  };
  
  /**
   * Update user password.
   */
  ctl.getData = function() {
    var deviceId = '382f9e87-9db9-4939-9fac-13513e685549';
    var to = parseInt(new Date().getTime()/1000);
    var from = to - 3600;

    IdentityService.getDeviceData(deviceId, from, to)
      .then(function(resp) {
        console.log('===== resp: ' + JSON.stringify(resp));
        ctl.tableParams = new NgTableParams({
          sorting: {timestamp: 'desc'}
        }, {
          dataset: resp
        });
      });
  };

  ctl.getData();
}

angular.module('deviceController', ['commonConstants', 'ngTable'])
  .controller('DeviceController', DeviceController);
