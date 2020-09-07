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

let rabbit=config.FALLBACK ? require('./rabbit') : undefined

let prom = require('./prometheus');
let logger = require('./logger');
let pubsub = require('./pubsub');
let queue = require('./queue');
let ServiceError=require('./lib/ServiceError')
let canAcceptMessages=true

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
  if(canAcceptMessages){
    res.json({ping: 'pong'});
  }else{
    next(new ServiceError('This service is shutting down', 503))
  }
});

app.post('/messages/:channel', (req, res, next) => {
  let end = prom.requestSummary.startTimer();
  let channel = req.params.channel;
  let messages = req.body.messages;

  // Early exit if the format is wrong
  if(!Array.isArray(messages)) throw new ServiceError('`messages` property is expected to be an array',400)

  // Count this channel add
  prom.receiveCount.inc({channel});

  if(canAcceptMessages){
    queue.push(publishJob(channel, messages, end));
  }else{
    next(new ServiceError('This service is shutting down', 503))
  }
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
function publishJob(channel, messages, end, retries=0) {
  return function(cb) {
    pubsub.publish(channel, messages).then((result)=>{
      let errors = result.errors;
      if(errors.length > 0) {
        prom.publishCount.inc({state: 'failed', channel});
        if(config.FALLBACK && retries >= 2) {
          end();
          return rabbit.publish(channel, errors);
        }
        retries++;
        queue.push(publishJob(channel, errors.map((error) => error.message), end, retries));
      } else {
        prom.publishCount.inc({state: 'success', channel});
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
  canAcceptMessages=false
  logger.info('Preparing to shutdown application');

  logger.info('Stopping queue timer');
  clearInterval(queue.timer);

  logger.info('Closing express server socket');
  // When the HTTP server closes we want to empty the job queue.
  app.server.close(emptyQueue);
};


/**
 * Run the queue and exit if it is empty
 */
function emptyQueue() {
  if(queue.length > 0) {
    logger.info('Processing remaining jobs on queue');
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
