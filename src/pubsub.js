'use strict';

let pubSubManager = require('@superbalist/js-pubsub-manager');
let PubSubManager = pubSubManager.PubSubManager;
let ConnectionFactory = pubSubManager.PubSubConnectionFactory;

// create pubsub manager
let connectionFactory = new ConnectionFactory();
let manager = new PubSubManager(connectionFactory, pubSubManager.config);
let connection = manager.connection();
let config = require('./config');
let validator = require('./validator');

let publish = async (channel, messages) => {
  let errors = [];
  let validMessages = [];
  let invalidMessages = [];
  await Promise.all(messages.map((message)=>{
    return validator.validate(message).then(()=>{
      validMessages.push(message);
      return connection.publish(channel, message);
    }).catch((error) => {
      if(error.name == 'ValidationError') {
        invalidMessages.push(error.event);
        return connection.publish(config.VALIDATION_ERROR_CHANNEL, error.event);
      } else {
        errors.push(message);
        return new Error(error);
      }
    });
  }));

  return {validMessages, invalidMessages, errors};
};

module.exports = {
  publish,
};
