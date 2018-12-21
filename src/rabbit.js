#!/usr/bin/env node
let amqp = require('amqplib');
let config = require('./config');

let connection = amqp.connect({
  username: config.RABBIT.USER,
  password: Buffer.from(config.RABBIT.PASSWORD, 'base64').toString(),
  hostname: config.RABBIT.HOST,
}).catch((err)=>{
  console.log(err);
});

let publish = (channel, errors) => {
  return connection.then(async (conn)=>{
    let amqpchannel = await conn.createChannel();
    return amqpchannel.sendToQueue(
      'failed_pubsub_publish',
      Buffer.from(JSON.stringify({channel, errors}))
    );
  });
};

process.on('SIGTERM', () => {
  setTimeout(()=>{
    connection.then((conn)=>{
      conn.close();
    });
  }, 5000);
});

process.on('SIGINT', () => {
  setTimeout(()=>{
    connection.then((conn)=>{
      conn.close();
    });
  }, 5000);
});


module.exports = {
  publish,
};


