'use strict';

const config = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  SENTRY_DSN: process.env.SENTRY_DSN,
  MAX_POST_SIZE: process.env.MAX_POST_SIZE || '10mb',
  PROMETHEUS_EXPORTER: process.env.PROMETHEUS_EXPORTER_ENABLED || false,
  PROMETHEUS_PORT: process.env.PROMETHEUS_PORT || 5000,
};

module.exports = config;
