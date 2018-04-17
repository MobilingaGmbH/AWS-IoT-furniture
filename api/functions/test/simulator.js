'use strict'

const AWS = require('aws-sdk')
const Promise = require('bluebird')
const moment = require('moment')

AWS.config.update({region: process.env.REGION})

const iotData = new AWS.IotData({endpoint: process.env.IOT_ENDPOINT})
const DEVICES = [{
  device_id: '382f9e87-9db9-4939-9fac-13513e685549'
}, {
  device_id: 'ce47c4e7-9946-451d-a658-2e7535907018'
}]

module.exports.index = (event, context, callback) => {
  console.log('=============== event:', JSON.stringify(event))

  Promise
    .map(DEVICES, function (device) {
      return publishData(device)
    })
    .then(function (results) {
      console.log('===== results: ' + JSON.stringify(results))
      callback(null, 'OK')
    })
    .catch(function (err) {
      console.log(err, err.stack)
      callback(err)
    })
}

function publishData (device) {
  return new Promise(function (resolve, reject) {
    var data = {
      device_id: device.device_id,
      timestamp: moment().unix(),
      time: moment().format('YYYY-MM-DD HH:mm:ss'),
      roomTemp: randomInt(-10, 50),
      humidity: randomInt(40, 60),
      speed: randomInt(0, 100),
      brightness: randomInt(0, 100),
      signalStrength: randomInt(0, 100)
    }

    var params = {
      topic: 'demoTopic',
      payload: JSON.stringify(data),
      qos: 0
    }

    iotData.publish(params, function (err, data) {
      if (err) {
        console.log(err, err.stack)
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

function randomInt (low, high) {
  return Math.floor(Math.random() * (high - low + 1) + low)
}
