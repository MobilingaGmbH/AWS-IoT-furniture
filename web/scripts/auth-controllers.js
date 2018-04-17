/**
 * @class LoginController
 * @classdesc
 * @ngInject
 */
function LoginController($scope, $state, $auth, emailRegex, IdentityService) {
  $scope.t = function (key) {
    var lang = localStorage.getItem('lang') || 'en';
    return polyglot.t(lang + '.login.' + key);
  };

  $scope.emailRegex = emailRegex;

  $scope.data = {};
  
  $scope.login = function() {
    console.log('================= login: ' + ($scope.email || $scope.data.email));
    $auth.login(
        {
          email: $scope.email || $scope.data.email, 
          password: $scope.password  || $scope.data.password
        }
    )
    .then(function(resp) {
      $state.go(IdentityService.authenticatedState);
      localStorage.setItem(IdentityService.localCredentialsKey, JSON.stringify(resp.data));
      // console.log('===== login resp: ' + JSON.stringify(resp));
      toastr.success('You have successfully logged in');
    })
    .catch(function(err) {
      toastr.error(err.data.error || err.data.message || err.data.errorMessage, 'cannot login');
    });
  };
  
  $scope.authenticate = function(provider) {
    $auth.authenticate(provider, null)
    .then(function() {
      toastr.success('You have successfully authenticated');
      $state.go(IdentityService.authenticatedState);
    })
    .catch(function(err) {
      toastr.error(err.data.error || err.data.message || err.data.errorMessage, 'cannot authenticate');
    });
  };
}

/**
 * @class LogoutController
 * @classdesc
 * @ngInject
 */
function LogoutController($scope, $state, $auth, IdentityService) {
  IdentityService.logout();
  
  $auth.logout()
  .then(function() {
    toastr.success('You have been logged out');
  });
}

/**
 * @class SignupController
 * @classdesc
 * @ngInject
 */
function SignupController($scope, $state, $log, $auth, 
    emailRegex, IdentityService) {
  $scope.emailRegex = emailRegex;

  $scope.t = function (key) {
    var lang = localStorage.getItem('lang') || 'en';
    return polyglot.t(lang + '.signup.' + key);
  };

  $scope.signup = function() {
    $auth.signup(
        {
          username: $scope.name,
          email: $scope.email,
          password: $scope.password
        })
        .then(function(data) {
          // automatically login on signup
          // $auth.setToken(data.data.token);

          toastr.success('You have successfully signed up');

          // $state.go(IdentityService.authenticatedState);
          $state.go(IdentityService.loginState);
        })
        .catch(function(err) {
          toastr.error(err.data.error || err.data.message || err.data.errorMessage, 'cannot signup');
        });
  };
  
  $scope.authenticate = function(provider) {
    $auth.authenticate(provider, null)
    .then(function() {
      toastr.success('You have successfully signed up');
      $state.go(IdentityService.authenticatedState);
    })
    .catch(function(err) {
      toastr.error(err.data.error || err.data.message || err.data.errorMessage, 'cannot authenticate');
    });
  };
}

/**
 * @class ForgotController
 * @classdesc
 * @ngInject
 */
function ForgotController($scope, $log, emailRegex, IdentityService) {
  $scope.emailRegex = emailRegex;

  $scope.t = function (key) {
    var lang = localStorage.getItem('lang') || 'en';
    return polyglot.t(lang + '.forgot.' + key);
  };

  $scope.forgot = function() {
    IdentityService.forgotPassword($scope.username)
    .then(
        function() {
          toastr.success('Sent email with password reset');
        },
        function(err) {
          toastr.error(err.error, 'cannot reset password');
        }
    );
  };
}

/**
 * @class ResetController
 * @classdesc
 * @ngInject
 */
function ResetController($scope, $log, IdentityService) {
  $scope.t = function (key) {
    var lang = localStorage.getItem('lang') || 'en';
    return polyglot.t(lang + '.reset.' + key);
  };

  $scope.reset = function() {
    console.log('===== ResetController, username: ' + $scope.username + ', password: ' + $scope.password + ', code: ' + $scope.code);

    IdentityService.resetPassword($scope.username, $scope.password, $scope.code)
    .then(
        function() {
          toastr.success('Password has been reset');
        },
        function(err) {
          toastr.error(err.error, 'cannot reset password');
        }
    );
  };
}

/**
 * @class VerifyController
 * @classdesc
 * @ngInject
 */
function VerifyController($scope, $log, IdentityService) {
  $scope.t = function (key) {
    var lang = localStorage.getItem('lang') || 'en';
    return polyglot.t(lang + '.verify.' + key);
  };

  $scope.verify = function() {
    console.log('===== VerifyController, username: ' + $scope.username + ', code: ' + $scope.code);

    IdentityService.verify($scope.username, $scope.code)
    .then(
        function() {
          toastr.success('Account has been verified');
        },
        function(err) {
          toastr.error(err.error, 'cannot verify account');
        }
    );
  };
}

/**
 * @class NavbarController
 * @classdesc
 * @ngInject
 */
function NavbarController($scope, $auth) {
  $scope.t = function (key) {
    var lang = localStorage.getItem('lang') || 'en';
    return polyglot.t(lang + '.navbar.' + key);
  };

  $scope.isAuthenticated = function() {
    return $auth.isAuthenticated();
  };
}

angular.module('auth-controllers', ['identityService','commonConstants'])
.controller('LoginController', LoginController)
.controller('LogoutController', LogoutController)
.controller('SignupController', SignupController)
.controller('ForgotController', ForgotController)
.controller('ResetController', ResetController)
.controller('VerifyController', VerifyController)
.controller('NavbarController', NavbarController)
;