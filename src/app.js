'use strict';

let config = require('./config');
let express = require('express');
let morgan = require('morgan');
let bodyParser = require('body-parser');
let Raven = require('raven');
if (config.SENTRY_DSN) {
  Raven.config(config.SENTRY_DSN)
    .install();
}

let prom = require('./prometheus');

let logger = require('./logger');
let pubsub = require('./pubsub');
let queue = require('./queue');

// this flag indicates whether or not we'll accept messages on the POST end-point
// when a SIGTERM is received, we set this flag to false and throw back a 503

// bootstrap app
let app = express();
app.use(morgan('dev'));
app.use(bodyParser.json({ limit: config.MAX_POST_SIZE }));
app.use(bodyParser.urlencoded({extended: false}));

// register routes
app.get('/', (req, res, next) => {
  res.json({ping: 'pong'});
});

app.get('/healthz', (req, res, next) => {
  res.json({ping: 'pong'});
});

app.post('/messages/:channel', (req, res, next) => {
  prom.receiveCount.inc();
  let end = prom.requestSummary.startTimer();
  let channel = req.params.channel;
  let messages = req.body.messages || [];
  queue.push(publishJob(channel, messages, end));
  res.json({success: true});
});


  /**
   * Return a job
   *
   * @param {String} channel
   * @param {[Object]} messages
   * @param {Function} end
   * @param {Integer} retries
   *
   * @return {Function}
   */
function publishJob(channel, messages, end) {
  return function(cb) {
    pubsub.publish(channel, messages).then((result)=>{
      let errors = result.errors;
      if(errors.length > 0) {
        prom.publishCount.inc({state: 'failed'});
        queue.push(publishJob(channel, errors, end));
      } else {
        prom.publishCount.inc({state: 'success'});
        end();
      }
      cb();
    }).catch((error) => {
      cb(error);
    });
  };
}

// bind middleware
app.use((req, res, next) => {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // return a json error response
  let status = err.status || 500;
  res.status(status);
  res.json({
    status: status,
    message: err.message,
  });
});

let onExitHandler = () => {
  logger.info('Preparing to shutdown application');

  logger.info('Stopping queue timer');
  clearInterval(queue.timer);

  logger.info('Processing remaining jobs on queue');
  logger.info('Closing express server socket');
  // When the HTTP server closes we want to empty the job queue.
  app.server.close(emptyQueue);
};


/**
 * Run the queue and exit if it is empty
 */
function emptyQueue() {
  if(queue.length == 0) {
    process.exit(0);
  } else {
    queue.start(emptyQueue);
  }
}

process.on('SIGTERM', () => {
  onExitHandler();
});

process.on('SIGINT', () => {
  onExitHandler();
});

module.exports = app;
