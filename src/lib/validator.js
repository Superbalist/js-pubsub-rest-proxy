const config = require('../config')
const logger = require('./logger')
//  By default validation is always happy
let validate = () => {
    return Promise.resolve()
}
//  If a schema url is supplied then validation will occur
if (config.VALIDATION_ERROR_SCHEMA_URL) {
    let uris = {}
    let eventPubSub = require('@superbalist/js-event-pubsub')
    let request = require('request-promise-native')
    let JSONSchemaEventValidator = eventPubSub.validators.JSONSchemaEventValidator

    let Ajv = require('ajv')
    let ajv = new Ajv({
        extendRefs: true,
        loadSchema: async (uri) => {
            // Use previously requested successful URIs
            if (!uris[uri] || await uris[uri].catch(()=>{
                return 'Failed'
            }) == 'Failed') {
                // In memory cache
                uris[uri] = request({uri: uri, json: true})
            }
            return uris[uri]
        },
        allErrors: true
    })
    ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'))

    let validator = new JSONSchemaEventValidator(ajv)
    let SchemaEvent = eventPubSub.events.SchemaEvent
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
            super(...params)
            this.name = 'ValidationError'
            // Custom debugging information
            this.event = {
                schema: config.VALIDATION_ERROR_SCHEMA_URL,
                meta: validationResult.event.attributes.meta,
                event: validationResult.event.schema,
                errors: validationResult.errors
            }
        }
    }

    //  Override validation with ajv validation.
    validate = (message) => {
        if (!message.schema) {
            logger.error(`No schema: ${JSON.stringify(message.meta)}`)
            return Promise.reject(new ValidationError({
                event: {
                    attributes: {meta: message.meta}
                },
                errors: ['No schema Provided']
            }))
        }
        return validator.validate(new SchemaEvent(message.schema, message))
            .then((validationResult)=>{
                if (validationResult.passes) {
                    return message
                } else {
                    // Throw an error for validation so that it can be caught higher up.
                    throw new ValidationError(validationResult)
                }
            })
    }
}

module.exports = {
    validate
}
