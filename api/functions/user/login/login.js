'use strict'

const AWS = require('aws-sdk')
const Promise = require('bluebird')

require('amazon-cognito-identity-js')

const lib = require('../../../lib')

AWS.config.update({
  region: process.env.REGION
})

const Callbacker = lib.Callbacker

const userPool = new AWS.CognitoIdentityServiceProvider.CognitoUserPool({
  UserPoolId: process.env.COGNITO_USER_POOL_ID,
  ClientId: process.env.COGNITO_CLIENT_ID
})

module.exports.index = (event, context, callback) => {
  console.log('=============== event:', JSON.stringify(event))
  var callbacker = new Callbacker(callback)

  try {
    var body = JSON.parse(event.body)

    var validationErr = validate(body)
    if (validationErr) {
      return callbacker.makeCallback(null, lib.getResponse422(validationErr.message))
    }

    var username = body.username || body.email
    var password = body.password

    login(username, password)
      .then(function (resp) {
        callbacker.makeCallback(null, lib.getResponse(resp))
      })
      .catch(function (err) {
        console.log(err, err.stack)
        callbacker.makeCallback(null, lib.getResponse401())
      })
  } catch (err) {
    console.log(err, err.stack)
    callbacker.makeCallback(err)
  }
}

function validate (body) {
  var username = body.username || body.email
  var password = body.password

  if (!username || !password) {
    return new Error('username/email and password are required')
  }
}

function login (username, password) {
  return new Promise(function (resolve, reject) {
    var authenticationDetails = new AWS.CognitoIdentityServiceProvider.AuthenticationDetails({
      Username: username,
      Password: password
    })

    var cognitoUser = new AWS.CognitoIdentityServiceProvider.CognitoUser({
      Username: username,
      Pool: userPool
    })

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: function (result) {
        console.log('===== authenticateUser result: ' + JSON.stringify(result))
        var resp = {
          refresh_token: result.refreshToken.token,
          access_token: result.accessToken.jwtToken,
          id_token: result.idToken.jwtToken
        }

        resolve(resp)
      },

      onFailure: function (err) {
        console.log(err, err.stack)
        reject(err)
      }
    })
  })
}
