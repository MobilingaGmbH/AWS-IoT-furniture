lib = require('./index')

function Callbacker (callback, knex) {
  this.callback = callback
  this.knex = knex
}

Callbacker.prototype = {
  callback: null,

  makeCallback: function (error, message) {
    if (!this.callback) {
      throw new Error('Callback is not defined!')
    }

    if (this.knex) {
      this.knex.destroy()
    }

    if (error) {
      message = lib.getResponse500(error.message)
    }

    this.callback(null, message)
  }
}

module.exports = Callbacker
