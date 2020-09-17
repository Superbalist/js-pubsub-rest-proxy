#!/usr/bin/env node
const amqp = require('amqplib')
const logger = require('./logger')
const config = require('../config')


function start() {

    let open = amqp.connect({
        username: config.RABBIT.USER,
        password: Buffer.from(config.RABBIT.PASSWORD, 'base64').toString(),
        hostname: config.RABBIT.HOST
    }).catch((err)=>{
        logger.error(`Could not start Rabbit: ${err.message}`)
    })

    let publish = (channel, errors) => {
        return open.then(async(connection) => {
            let amqpchannel = await connection.createChannel()
            return amqpchannel.sendToQueue(
                'failed_pubsub_publish',
                Buffer.from(JSON.stringify({channel, errors}))
            )
        })
    }

    process.on('SIGTERM', () => {
        setTimeout(()=>{
            open.then((conn)=>{
                conn && conn.close()
            })
        }, 5000)
    })

    process.on('SIGINT', () => {
        setTimeout(()=>{
            open.then((conn)=>{
                conn && conn.close()
            })
        }, 5000)
    })

    return publish
}


module.exports = start

