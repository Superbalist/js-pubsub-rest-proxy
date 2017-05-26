let q = require('queue');
let logger = require('./logger');

let queue = q();

// handle queue events
queue.on('error', function(err, job) {
  logger.error(err);
  setTimeout(() => {
    queue.push(job);
  }, 2000);
});

queue.timer = setInterval(() => {
  queue.start();
}, 300);

module.exports = queue;
