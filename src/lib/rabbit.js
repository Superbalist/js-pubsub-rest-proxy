#!/usr/bin/env node
const amqp = require('amqplib')
const logger = require('./logger')
const {RABBIT} = require('../config')

let open

// const getConnection = async()=>{
//      return await open.catch(()=>{})
// }

const rabbitController = {
    /**
     * Start the rabbit connection
     */
    start() {
        if (open) return false // don't start it if it has already been started

        open = amqp.connect({
            username: RABBIT.USER,
            password: Buffer.from(RABBIT.PASSWORD, 'base64').toString(),
            hostname: RABBIT.HOST
        }).then((connection)=>{
            logger.info(`Connected to RabbitMQ at ${RABBIT.HOST}`)
            return connection
        }).catch((err)=>{
            logger.error(`Could not start Rabbit at ${RABBIT.HOST}: ${err.message}`)
        })
    },

    /**
     * Close the rabbit connection
     * A short delay allows rabbit to finish what it is doing before closing the connection.
     *
     * @param {Number} waitTime Time to wait before closing rabbit connection
     */
    async stop(waitTime = 100) {
        if (!open) return Promise.resolve('Rabbit not started') // only stop if it has been started, but don't error out

        const connection = await open //already caught in start
        if (!connection) return Promise.resolve('Could not fetch rabbit connection') // only stop if we have a connection, but don't error out if we dont
        logger.info(`Waiting ${waitTime}ms for rabbit to finish..`)
        setTimeout(()=>{
            connection.close()
            logger.info(`..Rabbit connection closed.`)
            return Promise.resolve()
        }, waitTime)
    },

    /**
     * Publish a list of errors to a channel
     * @param {String} channel
     * @param {Array[Object]} errors an array of errors
     */
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

