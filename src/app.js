'use strict'

// get configuration
const {
    SENTRY_DSN,
    MAX_POST_SIZE
} = require('./config')

const express = require('express')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const Raven = require('raven')

//TODO Upgrade to sentry pls -- this is deprecated
if (SENTRY_DSN) {
    Raven.config(SENTRY_DSN)
        .install()
}

const prom = require('./lib/prometheus')
const logger = require('./lib/logger')
const queue = require('./lib/queue')
const ServiceError = require('./lib/ServiceError')

const app = express()

// app.use(morgan('dev'))
app.use(bodyParser.json({ limit: MAX_POST_SIZE }))
app.use(bodyParser.urlencoded({ extended: false }))

// why is this here? :shrug:
app.get('/', (req, res) => {
    // logger.info('ping')
    res.json({ ping: 'pong' })
})

// k8s health check endpoint
app.get('/healthz', (req, res) => res.json({ ping: 'pong' }) )

// handle incoming message post requests
app.post('/messages/:channel', (req, res) => {
    const end = prom.requestSummary.startTimer()
    const channel = req.params.channel
    const messages = req.body.messages

    // Early exit if the format is wrong
    if (!Array.isArray(messages)) throw new ServiceError('`messages` property is expected to be an array', 400)

    // Count this channel add
    prom.receiveCount.inc({ channel })
    queue.addPublishJob(channel, messages, end)
    res.json({ success: true })
})


// Anything requests that have not been dealt with by this point is 404
app.use((req, res, next) => next(new ServiceError('Not Found', 404)))

// Express Error Handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    // set locals, only providing error in development
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}

    // return a json error response
    let status = err.status || 500
    res.status(status)
    res.json({
        status,
        message: err.message
    })
})

// Graceful shutdown
let exitHandler = () => {
    logger.info('Shutdown Initiated.')
    app.server.close(async()=>{
        logger.info('Express server has shut down.')

        await Promise.all([queue.end()])
        logger.info('Queue is stopped.')

        return Promise.resolve()
    })
}

// Make sure we exit cleanly
process.on('SIGTERM', exitHandler)
process.on('SIGINT', exitHandler)

module.exports = app
