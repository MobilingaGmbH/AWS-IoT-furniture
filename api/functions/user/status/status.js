'use strict'

const lib = require('../../../lib')
const models = require('../../../models')

const Callbacker = lib.Callbacker

module.exports.index = (event, context, callback) => {
  console.log('=================== event:', JSON.stringify(event))

  var knex = lib.init()
  var callbacker = new Callbacker(callback, knex)

  try {
    doApi(event, callbacker)
  } catch (err) {
    console.log(err, err.stack)
    callbacker.makeCallback(err)
  }
}

function doApi (event, callbacker) {
  var paths = event.pathParameters
  var idValue = decodeURIComponent(paths.user_id)

  var params = event.queryStringParameters
  var idType = (params ? params.id_type : null)
  idType = idType || 'Id'

  models.User
    .query()
    .where(idType, idValue)
    .first()
    .then(function (user) {
      var response
      if (!user) {
        response = {status: 'not_created'}
      } else if (!user.SignupAt) {
        response = {status: 'created', user: user}
      } else if (!user.Verified) {
        response = {status: 'signed_up', user: user}
      } else {
        response = {status: 'verified', user: user}
      }

      callbacker.makeCallback(null, lib.getResponse(response))
    })
    .catch(function (err) {
      console.log(err, err.stack)
      callbacker.makeCallback(err)
    })
}
