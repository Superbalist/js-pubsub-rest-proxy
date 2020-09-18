'use strict'

const client = require('prom-client')
const express = require('express')
const logger = require('./logger')
const {PROMETHEUS_PORT, PROMETHEUS_EXPORTER} = require('../config')

client.collectDefaultMetrics({timeout: 30000})

const receiveCount = new client.Counter({
    name: 'pubsub_rest_proxy_receive_total',
    help: 'Count of all messages recieved by pubsub-rest-proxy',
    labelNames: ['channel']
})

const publishCount = new client.Counter({
    name: 'pubsub_rest_proxy_publish_total',
    help: 'Count of all messages published by pubsub-rest-proxy',
    labelNames: ['state', 'channel']
})

const requestSummary = new client.Summary({
    name: 'pubsub_rest_proxy_receive_to_publish_percentile',
    help: 'Percentiles of time between receive and publish',
    maxAgeSeconds: 600,
    ageBuckets: 5
})

const messageCount = new client.Counter({
    name: 'pubsub_rest_proxy_message_total',
    help: 'Count of all individual messages published by pubsub-rest-proxy',
    labelNames: ['state']
})

let app = express()

app.get('/metrics', (req, res) => {
    res.end(client.register.metrics())
})

if ( PROMETHEUS_EXPORTER ) {
    logger.info('Prometheus enabled on port: ' + PROMETHEUS_PORT)
    app.listen(PROMETHEUS_PORT || 5000)
}

module.exports = {
    messageCount,
    publishCount,
    receiveCount,
    requestSummary
}
