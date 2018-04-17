angular.module('cognito-helper', [
  'ngMessages',
  'ui.router',
  'satellizer',
  'commonConstants',
  'config',
  'identityService',
  'password-directives',
  'auth-controllers',
  'profileController',
  'deviceController',
  'ngTable'])
.config(function($stateProvider, $urlRouterProvider, $authProvider, config,
    IdentityServiceProvider) {

  var cfg = config.dev;
  
  console.log('start app.config', cfg);

  AWS.config.region = cfg.awsConfigRegion;
  
  // used by both IdentityService and $auth
  var authBaseUrl = cfg.authBaseUrl;
  
  IdentityServiceProvider.setBaseUrl(authBaseUrl);
  IdentityServiceProvider.setLoginState('public.login');
  IdentityServiceProvider.setAuthenticatedState('auth.profile');
  
  $urlRouterProvider.otherwise('/login');
  
  $stateProvider
  /*
   * Public
   */
  .state('public', {
    abstract: true,
    templateUrl: '../partials/navbar.html',
  })
  .state('public.login', {
    url: '/login',
    templateUrl: '../partials/login.html',
    controller: 'LoginController',
  })
  .state('public.signup', {
    url: '/signup',
    templateUrl: '../partials/signup.html',
    controller: 'SignupController',
  })
  .state('public.verify', {
    url: '/verify',
    templateUrl: '../partials/verify.html',
    controller: 'VerifyController',
  })
  .state('public.forgot', {
    url: '/forgot',
    templateUrl: '../partials/forgot.html',
    controller: 'ForgotController as ctl',
  })
  .state('public.reset', {
    url: '/reset',
    templateUrl: '../partials/reset.html',
    controller: 'ResetController',
  })
  /*
  .state('public.reset', {
    url: '/reset/{email}/{reset}',
    controller: 'ResetController',
  })
  */
  .state('public.logout', {
    url: '/logout',
    template: null,
    controller: 'LogoutController'
  })

  /*
   * Authenticated
   */
  .state('auth', {
    abstract: true,
    url: '/auth',
    templateUrl: '../partials/navbar.html',
    resolve: {
      authenticated: function(IdentityService) {
        console.log('===== resolve authenticated');
        return IdentityService.checkAuthenticated();
      },
      /*
      credentials: function(authenticated, IdentityService) {
        console.log('===== resolve credentials');
        return IdentityService.getCredentials();
      },
      */
      user: function(authenticated, IdentityService) {
        console.log('===== resolve user');
        return IdentityService.getUser();
      },
    }
  })
  .state('auth.profile', {
    url: '/profile',
    templateUrl: '../partials/profile.html',
    controller: 'ProfileController as ctl',
  })
  .state('auth.device', {
    url: '/device',
    templateUrl: '../partials/device.html',
    controller: 'DeviceController as ctl',
  })
  ; // $stateProvider
  

  /*
   * Satellizer
   */
  $authProvider.baseUrl = authBaseUrl;
  $authProvider.loginUrl = '/user/login';
  $authProvider.signupUrl = '/user/signup';
  $authProvider.tokenName = 'id_token'

  /*
  $authProvider.httpInterceptor = function() { return true; },
  $authProvider.tokenRoot = null;
  $authProvider.baseUrl = '/';
  $authProvider.loginUrl = '/auth/login';
  $authProvider.signupUrl = '/auth/signup';
  $authProvider.unlinkUrl = '/auth/unlink/';
  $authProvider.tokenName = 'token';
  $authProvider.tokenPrefix = 'satellizer';
  $authProvider.tokenHeader = 'Authorization';
  $authProvider.tokenType = 'Bearer';
  $authProvider.storageType = 'localStorage';
  */

  // this allows to set Access-Control-Allow-Headers=* on the server side
  $authProvider.withCredentials = false;
  
  console.log('finished app config');

}) // .config

;