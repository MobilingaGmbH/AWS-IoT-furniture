'use strict'

const AWS = require('aws-sdk')
const Promise = require('bluebird')
const moment = require('moment')

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

  try {
    var body = JSON.parse(event.body)

    var validationErr = validate(body)
    if (validationErr) {
      return callbacker.makeCallback(null, lib.getResponse422(validationErr.message))
    }

    auth.getCurrentUser()
      .then(function (currentUser) {
        console.log('===== current user: ' + JSON.stringify(currentUser))
        var authenticated = auth.checkPermission(currentUser, 'device-create')

        if (authenticated) {
          try {
            doApi(currentUser, event, callbacker, body)
          } catch (err) {
            console.log(err, err.stack)
            callbacker.makeCallback(err)
          }
        } else {
          callbacker.makeCallback(null, lib.getResponse403())
        }
      })
  } catch (err) {
    console.log(err, err.stack)
    callbacker.makeCallback(err)
  }
}
function validate (body) {
  var deviceId = body.device_id

  if (!deviceId) {
    return new Error('device_id is required')
  }
}

function doApi (currentUser, event, callbacker, body) {
  saveDevice(body.device_id, currentUser.username)
    .then(function (data) {
      callbacker.makeCallback(null, lib.getResponse(data))
    })
    .catch(function (err) {
      console.log(err, err.stack)
      callbacker.makeCallback(err)
    })
}

function saveDevice (deviceId, username) {
  return new Promise(function (resolve, reject) {
    var device = {
      device_id: deviceId,
      username: username,
      created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
      timestamp: moment().unix()
    }

    var params = {
      TableName: process.env.TABLE_DEVICE,
      Item: device
    }

    docClient.put(params, function (err, data) {
      if (err) {
        console.log(err)
        reject(err)
      } else {
        resolve(device)
      }
    })
  })
}

