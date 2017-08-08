'use strict';

const config = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  SENTRY_DSN: process.env.SENTRY_DSN,
  MAX_POST_SIZE: process.env.MAX_POST_SIZE || '10mb',
};

module.exports = config;
