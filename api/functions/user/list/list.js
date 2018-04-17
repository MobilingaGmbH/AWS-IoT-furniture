'use strict'

const lib = require('../../../lib')
const models = require('../../../models')

const Callbacker = lib.Callbacker
const Authenticator = lib.Authenticator

module.exports.index = (event, context, callback) => {
  console.log('=================== event:', JSON.stringify(event))

  var knex = lib.init()
  var callbacker = new Callbacker(callback, knex)
  var auth = new Authenticator(event.requestContext, models)

  new Promise(function (resolve, reject) {
    return auth.getCurrentUser(resolve, reject)
  })
  .then(function (currentUser) {
    console.log('====================== current user: ' + JSON.stringify(currentUser))
    var authenticated = auth.checkPermission(currentUser, 'user-list')

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
  var orgId = (params ? params.org_id : null)
  var branchId = (params ? params.branch_id : null)

  if (currentUser.Role === models.User.Role.SUPER_ADMIN ||
    (currentUser.Role === models.User.Role.ORG_ADMIN && currentUser.OrgId === orgId) ||
    (currentUser.Role === models.User.Role.BRANCH_ADMIN && currentUser.BranchId === branchId)) {
    var promise = models
      .User.query()
      .leftJoin('Org', 'User.OrgId', 'Org.Id')
      .leftJoin('Branch', 'User.BranchId', 'Branch.Id')
      .select('User.*', 'Org.Name as OrgName', 'Branch.Name as BranchName')

    if (orgId) {
      promise = promise.where('User.OrgId', orgId)
      if (branchId) {
        promise = promise.andWhere('User.BranchId', branchId)
      }
    } else if (branchId) {
      promise = promise.where('User.BranchId', branchId)
    }

    console.log('============================ sql: ' + promise.toSql())
    promise
      .then(function (users) {
        console.log('============================ users: ' + JSON.stringify(users))
        callbacker.makeCallback(null, lib.getResponse(users))
      })
      .catch(function (err) {
        console.log(err, err.stack)
        callbacker.makeCallback(err)
      })
  } else {
    callbacker.makeCallback(null, lib.getResponse403())
  }
}
