#!/usr/bin/env node
const amqp = require('amqplib')
const logger = require('./logger')
const config = require('../config')

let open

// const getConnection = async()=>{
//      return await open.catch(()=>{})
// }

const rabbitController = {
    start() {
        if (open) return false // don't start it if it has already been started

        open = amqp.connect({
            username: config.RABBIT.USER,
            password: Buffer.from(config.RABBIT.PASSWORD, 'base64').toString(),
            hostname: config.RABBIT.HOST
        }).catch((err)=>{
            logger.error(`Could not start Rabbit: ${err.message}`)
        })
    },

    async stop(waitTime = 100) {
        if (!open) return Promise.resolve('Rabbit not started') // only stop if it has been started, but don't error out
        const connection = await open.catch((error)=>{
            logger.error(error.message)
        })
        if (!connection) return Promise.resolve('Could not fetch rabbit connection') // only stop if we have a connection, but don't error out if we dont
        logger.info(`Waiting ${waitTime}ms for rabbit to finish..`)
        setTimeout(()=>{
            connection.close()
            logger.info(`..Rabbit connection closed.`)
            return Promise.resolve()
        }, waitTime)
    },

    async publish(channel, errors) {
        if (!open) return Promise.reject() // bail early if it has not been started
        return open.then(async(connection) => {
            let amqpchannel = await connection.createChannel().catch((error)=>{
                logger.error(error.message)
            })
            return amqpchannel.sendToQueue(
                'failed_pubsub_publish',
                Buffer.from(JSON.stringify({channel, errors}))
            )
        })
    }
}


module.exports = rabbitController

