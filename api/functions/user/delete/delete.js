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

module.exports.index = (event, context, callback) => {
  console.log('=================== event:', JSON.stringify(event))

  var callbacker = new Callbacker(callback)
  var auth = new Authenticator(event.requestContext)

  auth.getCurrentUser()
    .then(function (currentUser) {
      console.log('===== current user: ' + JSON.stringify(currentUser))
      var authenticated = auth.checkPermission(currentUser, 'user-me-delete')

      if (authenticated) {
        try {
          doApi(currentUser, event, callbacker)
        } catch (err) {
          console.log(err, err.stack)
          callbacker.makeCallback(err)
        }
      } else {
        callbacker.makeCallback(null, lib.getResponse403())
      }
    })
}

function doApi (currentUser, event, callbacker) {
  deleteUser(currentUser)
    .then(function () {
      deleteCognitoUser(currentUser)
        .then(function () {
          callbacker.makeCallback(null, lib.getResponse({deleted: true}))
        })
        .catch(function (err) {
          console.log(err, err.stack)
          callbacker.makeCallback(err)
        })
    })
    .catch(function (err) {
      console.log(err, err.stack)
      callbacker.makeCallback(err)
    })
}

function deleteUser (currentUser, callbacker) {
  return new Promise(function (resolve, reject) {
    var params = {
      TableName: process.env.TABLE_USER,
      Key: {
        username: currentUser.username
      }
    }

    docClient.delete(params, function (err, data) {
      if (err) {
        console.log(err, err.stack)
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

function deleteCognitoUser (currentUser, callbacker) {
  return new Promise(function (resolve, reject) {
    var cognito = new AWS.CognitoIdentityServiceProvider()
    var params = {
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: currentUser.username
    }

    cognito.adminDeleteUser(params, function (err, data) {
      if (err) {
        console.log(err, err.stack)
        reject(err)
      } else {
        resolve()
      }
    })
  })
}
