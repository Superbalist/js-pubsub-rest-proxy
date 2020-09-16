let queueFactory = require('queue');
let logger = require('../logger');
let {
  QUEUE_CONCURRENCY,
  QUEUE_RE_ADD_JOB_TIMEOUT,
  QUEUE_RESTART_TIME
} = require('../config')

// Configure a new queue
let queue = queueFactory({ concurrency: QUEUE_CONCURRENCY })

//TODO: This has moved - now using promises in queues, so re-adding is in a catch
// // On Error, re-add job to the queue
// // TODO: this seems indiscriminate and we should probably be more careful about which jobs should be requeued
// queue.on('error', function(err, job) {
//   logger.error(err);
//   setTimeout(() => queue.push(job), QUEUE_RE_ADD_JOB_TIMEOUT);
// })

// This queue may run dry and stop running
queue.timer = setInterval(() => queue.running || queue.start(), QUEUE_RESTART_TIME);

module.exports = queue;
