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
  var userData = JSON.parse(event.body)
  var username = userData.username
  var email = userData.email
  var password = userData.password

  if (!username || !email || !password) {
    return callbacker.makeCallback(null, lib.getResponse422('Username/Email/Password are required'))
  }

  auth.getUser(username)
    .then(function (user) {
      if (user) {
        callbacker.makeCallback(null, lib.getResponse422('User has already signed up'))
      } else {
        return createCognitoUser(username, email, password)
          .then(function () {
            return saveUser(username, email, userData)
          })
          .then(function (newUser) {
            callbacker.makeCallback(null, lib.getResponse(newUser))
          })
      }
    })
    .catch(function (err) {
      console.log(err, err.stack)
      callbacker.makeCallback(err)
    })
}

function createCognitoUser (username, email, password) {
  return new Promise(function (resolve, reject) {
    var attributeList = []

    var dataEmail = {
      Name: 'email',
      Value: email
    }

    var attributeEmail = new AWS.CognitoIdentityServiceProvider.CognitoUserAttribute(dataEmail)
    attributeList.push(attributeEmail)

    userPool.signUp(username, password, attributeList, null, function (err, result) {
      if (err) {
        console.log(err, err.stack)
        reject(err)
      } else {
        console.log('===== signup: ' + JSON.stringify(result))
        resolve()
      }
    })
  })
}

function saveUser (username, email, userData) {
  return new Promise(function (resolve, reject) {
    var user = {
      username: username,
      email: email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      verified: false,
      created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
      timestamp: moment().unix()
    }

    var params = {
      TableName: process.env.TABLE_USER,
      Item: user
    }

    docClient.put(params, function (err, data) {
      if (err) {
        console.log(err)
        reject(err)
      } else {
        resolve(user)
      }
    })
  })
}
