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
      var authenticated = auth.checkPermission(currentUser, 'data-get-me-latest')

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
  getDevices(currentUser)
    .then(function (devices) {
      return Promise.map(devices, function (device) {
        return getData(device.device_id)
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
      TableName: process.env.TABLE_DEVICE_DATA_LATEST,
      KeyConditionExpression: 'device_id = :device_id',
      ExpressionAttributeValues: {
        ':device_id': deviceId
      }
    }

    docClient.query(ddbParams, function (err, data) {
      if (err) {
        console.log(err, err.stack)
        reject(err)
      } else {
        console.log('===== getLatestData: ' + JSON.stringify(data.Items[0]))
        resolve(data.Items[0])
      }
    })
  })
}
