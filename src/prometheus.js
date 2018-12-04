'use strict';
let express = require('express');
let client = require('prom-client');
let config = require('./config')
client.collectDefaultMetrics({timeout: 30000});

const receiveCount = new client.Counter({
  name: 'pubsub_rest_proxy_message_total',
  help: 'Count of all messages recieved by pubsub-rest-proxy',
});

const publishCount = new client.Counter({
  name: 'pubsub_rest_proxy_publish_total',
  help: 'Count of all messages published by pubsub-rest-proxy',
  labelNames: ['state'],
});

const requestSummary = new client.Summary({
  name: 'pubsub_rest_proxy_receive_to_publish_percentile',
  help: 'Percentiles of time between receive and publish',
  maxAgeSeconds: 600,
  ageBuckets: 5,
});

let app = express();

app.get('/metrics', (req, res) => {
    res.end(client.register.metrics());
});

if( config.PROMETHEUS_EXPORTER ) {
  console.log('Prometheus enabled on port: ' + config.PROMETHEUS_PORT);
  app.listen(config.PROMETHEUS_PORT || 5000);
}

module.exports = {
  receiveCount,
  publishCount,
  requestSummary,
};
