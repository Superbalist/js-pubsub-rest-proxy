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
let connection = pubsub.connection();
let queue = require('./queue');

// this flag indicates whether or not we'll accept messages on the POST end-point
// when a SIGTERM is received, we set this flag to false and throw back a 503
let isRunning = true;

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
  prom.recieveCount.inc();
  let end = prom.requestSummary.startTimer();
  if (!isRunning) {
    let error = new Error('Service Unavailable');
    error.status = 503;
    next(error);
  } else {
    let channel = req.params.channel;
    let messages = req.body.messages || [];
    if(messages.length > 0) {
      queue.push((cb) => {
        connection.publishBatch(channel, messages).then(()=>{
          prom.publishCount.inc({state: 'success'});
          cb();
          end();
        }).catch((err) => {
          prom.publishCount.inc({state: 'failed'});
          cb(err);
          end();
        });
      });
    } else {
      prom.publishCount.inc({state: 'empty'});
      end();
    }

    res.json({success: true});
  }
});

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
  isRunning = false;

  logger.info('Stopping queue timer');
  clearInterval(queue.timer);

  logger.info('Processing remaining jobs on queue');
  queue.start(() => {
    logger.info('Closing express server socket');
    app.server.close(() => {
      process.exit(0);
    });
  });
};

process.on('SIGTERM', () => {
  onExitHandler();
});

process.on('SIGINT', () => {
  onExitHandler();
});

module.exports = app;
