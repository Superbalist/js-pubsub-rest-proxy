'use strict'

const winston = require('winston')
const {LOG_LEVEL} = require('../config')

const logger = winston.createLogger({
    transports: [
        new (winston.transports.Console)({timestamp: true})
    ]
})
logger.level = LOG_LEVEL

module.exports = logger
