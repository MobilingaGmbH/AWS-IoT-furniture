'use strict'

const AWS = require('aws-sdk')
const Promise = require('bluebird')
const moment = require('moment')

require('amazon-cognito-identity-js')

const lib = require('../../../lib')

AWS.config.update({
  region: process.env.REGION
})

const Callbacker = lib.Callbacker
const Authenticator = lib.Authenticator

const docClient = new AWS.DynamoDB.DocumentClient()

module.exports.index = (event, context, callback) => {
  console.log('=============== event:', JSON.stringify(event))

  var callbacker = new Callbacker(callback)
  var auth = new Authenticator(event.requestContext)

  auth.getCurrentUser()
    .then(function (currentUser) {
      console.log('===== current user: ' + JSON.stringify(currentUser))
      var authenticated = auth.checkPermission(currentUser, 'user-me-update')

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
  var userData = JSON.parse(event.body)
  console.log('===== userData: ' + JSON.stringify(userData))

  if (Object.keys(userData).length === 0) {
    return callbacker.makeCallback(null, lib.getResponse422('At least one attribute is required'))
  }

  var password = userData.password
  var newPassword = userData.new_password
  var accessToken = userData.access_token

  var permittedAttributes = ['first_name', 'last_name']

  Object.keys(userData).forEach(function (key) {
    if (permittedAttributes.indexOf(key) === -1) {
      delete userData[key]
    }
  })
  console.log('===== filtered userData: ' + JSON.stringify(userData))

  updateUser(currentUser, userData)
    .then(function (updatedUser) {
      if (!password || !newPassword || !accessToken) {
        callbacker.makeCallback(null, lib.getResponse(updatedUser))
      } else {
        changePassword(password, newPassword, accessToken)
          .then(function () {
            callbacker.makeCallback(null, lib.getResponse(updatedUser))
          })
          .catch(function (err) {
            console.log(err, err.stack)
            callbacker.makeCallback(err)
          })
      }
    })
    .catch(function (err) {
      console.log(err, err.stack)
      callbacker.makeCallback(err)
    })
}

function updateUser (currentUser, userData) {
  return new Promise(function (resolve, reject) {
    var now = moment().format('YYYY-MM-DD HH:mm:ss')
    var expressions = ['updated_at = :updated_at']
    var values = {':updated_at': now}

    Object.keys(userData).forEach(function (key) {
      values[':' + key] = userData[key]
      expressions.push(key + ' = :' + key)
    })

    var updateExpression = 'set ' + expressions.join(', ')
    var params = {
      TableName: process.env.TABLE_USER,
      Key: {
        username: currentUser.username
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW'
    }
    console.log('===== updateUser params: ' + JSON.stringify(params))

    docClient.update(params, function (err, data) {
      if (err) {
        console.log(err, err.stack)
        reject(err)
      } else {
        resolve(data.Attributes)
      }
    })
  })
}

function changePassword (password, newPassword, accessToken) {
  return new Promise(function (resolve, reject) {
    var cognito = new AWS.CognitoIdentityServiceProvider()
    var params = {
      PreviousPassword: password,
      ProposedPassword: newPassword,
      AccessToken: accessToken
    }

    cognito.changePassword(params, function (err, result) {
      if (err) {
        console.log(err, err.stack)
        reject(err)
      } else {
        resolve()
      }
    })
  })
}
