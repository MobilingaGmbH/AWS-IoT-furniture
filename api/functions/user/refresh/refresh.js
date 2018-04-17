'use strict'

const AWS = require('aws-sdk')
const Promise = require('bluebird')

require('amazon-cognito-identity-js')

const lib = require('../../../lib')

AWS.config.update({
  region: process.env.REGION
})

const Callbacker = lib.Callbacker
const Authenticator = lib.Authenticator

const cognitoProvider = new AWS.CognitoIdentityServiceProvider()

module.exports.index = (event, context, callback) => {
  console.log('=============== event:', JSON.stringify(event))

  var callbacker = new Callbacker(callback)
  var auth = new Authenticator(event.requestContext)

  try {
    doApi(event, callbacker, auth)
  } catch (err) {
    console.log(err, err.stack)
    callbacker.makeCallback(err)
  }
}

function doApi (event, callbacker, auth) {
  var body = JSON.parse(event.body)

  var validationErr = validate(body)
  if (validationErr) {
    return callbacker.makeCallback(null, lib.getResponse422(validationErr.message))
  }

  var refreshToken = body.refresh_token

  var params = {
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    ClientId: process.env.COGNITO_CLIENT_ID,
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    AuthParameters: {
      REFRESH_TOKEN: refreshToken
    }
  }

  cognitoProvider.adminInitiateAuth(params, function (err, result) {
    if (err) {
      console.log(err, err.stack)
      callbacker.makeCallback(null, lib.getResponse401(err.message))
    } else {
      var tokens = {
        access_token: result.AuthenticationResult.AccessToken,
        id_token: result.AuthenticationResult.IdToken
      }

      callbacker.makeCallback(null, lib.getResponse(tokens))
    }
  })
}

function validate (body) {
  if (!body.refresh_token) {
    return new Error('refresh_token is required')
  }
}
