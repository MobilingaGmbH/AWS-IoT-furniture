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
      var authenticated = auth.checkPermission(currentUser, 'data-get-device')

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
  var paths = event.pathParameters
  var params = event.queryStringParameters

  var deviceId = paths.deviceId
  var from = parseInt(params.from)
  var to = parseInt(params.to)

  getData(deviceId, from, to)
    .then(function (data) {
      callbacker.makeCallback(null, lib.getResponse(data))
    })
    .catch(function (err) {
      console.log(err, err.stack)
      callbacker.makeCallback(err)
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
