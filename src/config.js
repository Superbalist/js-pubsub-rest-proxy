'use strict'

const config = {
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    SENTRY_DSN: process.env.SENTRY_DSN,
    MAX_POST_SIZE: process.env.MAX_POST_SIZE || '10mb',
    PROMETHEUS_EXPORTER: process.env.PROMETHEUS_EXPORTER_ENABLED || false,
    PROMETHEUS_PORT: process.env.PROMETHEUS_EXPORTER_PORT || 5000,
    VALIDATION_ERROR_CHANNEL: process.env.VALIDATION_ERROR_CHANNEL || 'validation_error',
    VALIDATION_ERROR_SCHEMA_URL: process.env.VALIDATION_ERROR_SCHEMA_URL || false,
    PUBLISH_INVALID: process.env.PUBLISH_INVALID === 'false' ? false : true,
    RABBIT: {
        HOST: process.env.RABBITMQ_URL || 'pubsub-rest-proxy-rabbitmq',
        USER: process.env.RABBITMQ_USER || 'guest',
        PASSWORD: process.env.RABBITMQ_PASSWORD || 'Z3Vlc3Q='
    },
    FALLBACK: process.env.RABBITMQ_FALLBACK || false,
    QUEUE_CONCURRENCY: 3,
    QUEUE_RE_ADD_JOB_TIMEOUT: 2000, // how long to wait before re-adding an errored job
    QUEUE_RESTART_TIME: 100 // once a queue is done, it won't react to new jobs. This is how frequently it is checked and restarted
}

module.exports = config
