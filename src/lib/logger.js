'use strict'

let winston = require('winston')
let config = require('../config')

let logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({timestamp: true})
    ]
})
logger.level = config.LOG_LEVEL

module.exports = logger
