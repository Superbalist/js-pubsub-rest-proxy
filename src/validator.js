let eventPubSub = require('@superbalist/js-event-pubsub');
let Ajv = require('ajv');
let request = require('request-promise-native');
let JSONSchemaEventValidator = eventPubSub.validators.JSONSchemaEventValidator;
const config = require('./config');
let ajv = new Ajv({
  extendRefs: true,
  loadSchema: (uri) => {
    return request({uri: uri, json: true});
  },
  allErrors: true,
});
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));

let validator = new JSONSchemaEventValidator(ajv);
let SchemaEvent = eventPubSub.events.SchemaEvent;

/**
 * ValidationError Class
 */
class ValidationError extends Error {
  /**
   * Construct a ValidationError
   *
   * @param {ValidationResult} validationResult
   */
  constructor(validationResult, ...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params);
    this.name = 'ValidationError';
    // Custom debugging information
    this.event = {
      'schema': config.VALIDATION_ERROR_SCHEMA_URL,
      'meta': validationResult.event.attributes.meta,
      'event': validationResult.event.schema,
      'errors': validationResult.errors,
    };
  }
}

let validate = (message) => {
  return validator.validate(new SchemaEvent(message.schema, message))
  .then((validationResult)=>{
    if(validationResult.passes) {
      return message;
    } else {
      throw new ValidationError(validationResult);
    }
  });
};

module.exports = {
  validate,
};
