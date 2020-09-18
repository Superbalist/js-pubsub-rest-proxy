const queueFactory = require('queue')
const logger = require('./logger')
const pubsub = require('./pubsub')
const prom = require('./prometheus')
const rabbitController = require('./rabbit')
const {
    FALLBACK,
    QUEUE_CONCURRENCY,
    QUEUE_RE_ADD_JOB_TIMEOUT,
    QUEUE_RESTART_TIME
} = require('../config')



// Configure a new queue
const q = queueFactory({ concurrency: QUEUE_CONCURRENCY })

// This queue may run dry and stop running
// queue.timer = setInterval(() => queue.running || queue.start(), )


const createPublishJob = (channel, messages, end, retries = 0) => (() => pubsub.publish(channel, messages)
    .then((result) => {
        let errors = result.errors
        if (errors.length > 0) {
            prom.publishCount.inc({ state: 'failed', channel })
            if (FALLBACK && retries >= 2) {
                end()
                return rabbitController.publish(channel, errors)
            }
            q.push(createPublishJob(channel, errors.map((error) => error.message), end, retries++))
        } else {
            prom.publishCount.inc({ state: 'success', channel })
            end()
        }
    })
    .catch((error) => {
    //This means the call failed alltogether, automatically goes back on queue
        logger.error(error)
        setTimeout(() => q.push(createPublishJob(channel, messages, end)), QUEUE_RE_ADD_JOB_TIMEOUT)
    })
)


const queue = {
    addPublishJob(channel, messages, end, retries = 0) {
        q.push(createPublishJob(channel, messages, end, retries))
    },
    autoRestart(interval) {
        q._restart_timer = setInterval(() => q.running || q.start(), interval)
    },
    end() {
        return new Promise((resolve)=>{
            q.on('success', ()=>{
                logger.info(`${q.length} jobs remaining on the queue.`)
            })

            // when the queue is cleared, delete restart_timer and resolve a promise
            q.on('end', ()=>{
                logger.info(`Queue empty.`)
                q._restart_timer && clearInterval(q._restart_timer)
                logger.info(`Queue restart timer stopped. Queue is stopped.`)
                resolve()
            })
        })
    }
}

queue.autoRestart(QUEUE_RESTART_TIME)


module.exports = queue
