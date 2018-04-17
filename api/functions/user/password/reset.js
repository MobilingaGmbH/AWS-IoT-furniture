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

const userPool = new AWS.CognitoIdentityServiceProvider.CognitoUserPool({
  UserPoolId: process.env.COGNITO_USER_POOL_ID,
  ClientId: process.env.COGNITO_CLIENT_ID
})

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
  var pathParams = event.pathParameters
  var username = pathParams.username

  var body = JSON.parse(event.body)
  var code = body.code
  var password = body.password

  if (!code || !password) {
    return callbacker.makeCallback(null, lib.getResponse422('code/password are required'))
  }

  auth.getUser(username)
    .then(function (user) {
      if (!user) {
        callbacker.makeCallback(null, lib.getResponse404())
      } else {
        resetPassword(username, code, password)
          .then(function () {
            callbacker.makeCallback(null, lib.getResponse({reset: true}))
          })
      }
    })
    .catch(function (err) {
      console.log(err, err.stack)
      callbacker.makeCallback(err)
    })
}

function resetPassword (username, code, password) {
  return new Promise(function (resolve, reject) {
    var cognitoUser = new AWS.CognitoIdentityServiceProvider.CognitoUser({
      Username: username,
      Pool: userPool
    })

    cognitoUser.confirmPassword(code, password, {
      onSuccess: function (result) {
        console.log('===== confirmPassword result: ' + JSON.stringify(result))
        resolve()
      },

      onFailure: function (err) {
        console.log('===== confirmPassword err')
        console.log(err, err.stack)
        reject(err)
      }
    })
  })
}
