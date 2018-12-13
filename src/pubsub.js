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

let logger = require('./logger');

let publish = async (channel, messages) => {
  let errors = [];
  let validMessages = [];
  let invalidMessages = [];
  // Map all messages to validate and publish each individually.
  await Promise.all(messages.map((message)=>{
    return validator.validate(message).then(()=>{
      validMessages.push(message);
      // If a message is valid then publish it.
      return connection.publish(channel, message);
    }).catch((error) => {
      if(error.name == 'ValidationError') {
        logger.warn('ValidationError: '+channel+' - '+error.event.errors);
        invalidMessages.push(error.event);
        // If it is not valid then publish the invalid event to a separate channel
        return connection.publish(config.VALIDATION_ERROR_CHANNEL, error.event);
      } else {
        // Throw an exception if it cannot publish or run validation.
        throw new Error(error);
      }
    }).catch((error) => {
      // Add messages with errors to the errors array.
      errors.push(message);
      logger.error(error);
      return error;
    });
  }));
  // Return an object with all messages. errors may contain valid and invalid
  // messages that were unable to be published.
  return {validMessages, invalidMessages, errors};
};

module.exports = {
  publish,
};
