#!/usr/bin/env node

let amqp = require('amqplib');

let connection = amqp.connect({
  username: 'pubsub',
  password: 'JX2a9fyBo8wytYnn',
  hostname: 'pubsub-rest-proxy-rabbitmq',
}).then(async (conn)=>{
  let channel = await conn.createChannel();
  let deal = (message) => {
    console.log(JSON.parse(message.content));
    channel.ack(message);
  };
  channel.consume('hello', deal);
  return conn;
}).catch((err)=>{
  console.log(err);
  process.exit(1);
});

let publish = (err, message) => {
  return connection.then(async (conn)=>{
    let channel = await conn.createChannel();
    channel.assertQueue('hello', {durable: false});
    return channel.sendToQueue('hello', Buffer.from(JSON.stringify({err, message})));
  });
};

module.exports = {
  publish,
};

publish('hello', 'hello');
publish('really', 'is it me');
