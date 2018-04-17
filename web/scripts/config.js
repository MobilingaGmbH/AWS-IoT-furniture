angular.module('config', [])
  .constant('config', {
    dev: {
      awsConfigRegion: 'eu-west-1',
      authBaseUrl: 'https://eiwen17ce8.execute-api.eu-west-1.amazonaws.com/prod/',
      auth: {
        facebook: {
          clientId: '603122136500203'
        },
        google: {
          clientId: '530785007303-et57b3m0s2fmtkhovr8605qpvbudn1k0.apps.googleusercontent.com'
        },
        stripe: {
          clientId: 'ca_4UJXRwA7hUJTi7VD9RReDhXfdsRb9cbX'
        },
        paypal: {
          clientId: 'ARVFKoFrdy3Eqq8UMR3myZOA5m8y-R3gSEgvekWDXy4uAJY_qAOQkmoQDFvJYM655mHaVNyTIbOouXFa',
          authorizationEndpoint: 'https://www.sandbox.paypal.com/webapps/auth/protocol/openidconnect/v1/authorize'
        },
        amazon: {
          clientId: 'amzn1.application-oa2-client.82ef881b18d54c9fabc0a78db71b15ed'
        }
      }
    }
  });
