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

const docClient = new AWS.DynamoDB.DocumentClient()

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
  var queryParams = event.queryStringParameters

  var username = pathParams.username
  var code = queryParams.code

  var validationErr = validate(code)
  if (validationErr) {
    return callbacker.makeCallback(null, lib.getResponse422(validationErr.message))
  }

  auth.getUser(username)
    .then(function (user) {
      if (!user) {
        callbacker.makeCallback(null, lib.getResponse401())
      } else if (user.verified) {
        callbacker.makeCallback(null, lib.getResponse422('User is already verified'))
      } else {
        return verifyUser(username, code)
          .then(function () {
            return updateUser(user)
          })
          .then(function (updatedUser) {
            callbacker.makeCallback(null, lib.getResponse(updatedUser))
          })
      }
    })
    .catch(function (err) {
      console.log(err, err.stack)
      callbacker.makeCallback(err)
    })
}

function validate (code) {
  if (!code) {
    return new Error('code is required')
  }
}

function verifyUser (username, code) {
  return new Promise(function (resolve, reject) {
    var cognitoUser = new AWS.CognitoIdentityServiceProvider.CognitoUser({
      Username: username,
      Pool: userPool
    })

    cognitoUser.confirmRegistration(code, true, function (err, result) {
      if (err) {
        console.log(err, err.stack)
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

function updateUser (user) {
  return new Promise(function (resolve, reject) {
    var params = {
      TableName: process.env.TABLE_USER,
      Key: {
        username: user.username
      },
      UpdateExpression: 'set verified = :verified',
      ExpressionAttributeValues: {
        ':verified': true
      },
      ReturnValues: 'ALL_NEW'
    }

    docClient.update(params, function (err, data) {
      if (err) {
        console.log(err)
        reject(err)
      } else {
        console.log('===== updateUser: ' + JSON.stringify(data))
        resolve(data.Attributes)
      }
    })
  })
}
