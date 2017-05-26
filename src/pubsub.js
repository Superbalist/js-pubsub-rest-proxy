'use strict';

let pubSubManager = require('@superbalist/js-pubsub-manager');
let PubSubManager = pubSubManager.PubSubManager;
let ConnectionFactory = pubSubManager.PubSubConnectionFactory;

// create pubsub manager
let connectionFactory = new ConnectionFactory();
let manager = new PubSubManager(connectionFactory, pubSubManager.config);

module.exports = manager;
