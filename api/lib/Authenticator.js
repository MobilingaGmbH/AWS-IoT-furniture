const AWS = require('aws-sdk')
const Promise = require('bluebird')

AWS.config.update({
  region: process.env.REGION
})

const docClient = new AWS.DynamoDB.DocumentClient()

function Authenticator (requestContext) {
  this.requestContext = requestContext
}

Authenticator.prototype = {
  requestContext: null,

  getUser: function (username) {
    return getUser(username)
  },

  getCurrentUser: function () {
    var username = this.requestContext.authorizer.claims['cognito:username']
    return getUser(username)
  },

  checkPermission: function (user, api) {
    var array = api.split('-')
    var resource = array[0]
    var method = array.slice(1).join('-')

    if (resource === 'user') {
      return checkPermission_User(user, method)
    } else if (resource === 'data') {
      return checkPermission_Data(user, method)
    } else if (resource === 'device') {
      return checkPermission_Device(user, method)
    }
  }
}

function checkPermission_User (user, method) {
  return true
}

function checkPermission_Data (user, method) {
  return true
}

function checkPermission_Device (user, method) {
  return true
}

function getUser (username) {
  return new Promise(function (resolve, reject) {
    var params = {
      TableName: process.env.TABLE_USER,
      KeyConditionExpression: 'username = :username',
      ExpressionAttributeValues: {
        ':username': username
      }
    }

    docClient.query(params, function (err, data) {
      if (err) {
        console.log(err, err.stack)
        reject(err)
      } else {
        console.log('===== getUser: ' + JSON.stringify(data.Items))
        resolve(data.Items[0])
      }
    })
  })
}

module.exports = Authenticator
