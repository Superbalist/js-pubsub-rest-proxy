'use strict';

let pubsub = require('./pubsub');
let connection = pubsub.connection();

let channel = process.argv[2] || 'test';

let count = 0;

console.log(`Listening for all messages on channel "${channel}"`);
connection.subscribe(channel, (message) => {
  console.log(count++);
  console.log(message);
  console.log(typeof(message));
});
