'use strict'

const AWS = require('aws-sdk')
const Promise = require('bluebird')

AWS.config.update({
  region: process.env.REGION
})

const lib = require('../../../lib')

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
      var authenticated = auth.checkPermission(currentUser, 'data-get-me')

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
  var params = event.queryStringParameters
  var from = parseInt(params.from)
  var to = parseInt(params.to)

  getDevices(currentUser)
    .then(function (devices) {
      return Promise.map(devices, function (device) {
        return getData(device.device_id, from, to)
      })
    })
    .then(function (data) {
      callbacker.makeCallback(null, lib.getResponse(data))
    })
    .catch(function (err) {
      console.log(err, err.stack)
      callbacker.makeCallback(err)
    })
}

function getDevices (currentUser) {
  return new Promise(function (resolve, reject) {
    var ddbParams = {
      TableName: process.env.TABLE_DEVICE,
      IndexName: 'username-device_id-index',
      KeyConditionExpression: 'username = :username',
      ExpressionAttributeValues: {
        ':username': currentUser.username
      }
    }

    docClient.query(ddbParams, function (err, data) {
      if (err) {
        console.log(err, err.stack)
        reject(err)
      } else {
        console.log('===== getDevices: ' + JSON.stringify(data.Items))
        resolve(data.Items)
      }
    })
  })
}

function getData (deviceId, from, to) {
  return new Promise(function (resolve, reject) {
    var ddbParams = {
      TableName: process.env.TABLE_DEVICE_DATA,
      Limit: process.env.QUERY_LIMIT,
      KeyConditionExpression: 'device_id = :device_id and (#timestamp between :from and :to)',
      ExpressionAttributeNames: {
        '#timestamp': 'timestamp'
      },
      ExpressionAttributeValues: {
        ':device_id': deviceId,
        ':from': from,
        ':to': to
      }
    }

    docClient.query(ddbParams, function (err, data) {
      if (err) {
        console.log(err, err.stack)
        reject(err)
      } else {
        console.log('===== getData: ' + data.Items.length)
        resolve(data.Items)
      }
    })
  })
}
