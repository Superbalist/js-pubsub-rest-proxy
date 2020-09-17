'use strict'

let LocalPubSubAdapter = require('@superbalist/js-pubsub').LocalPubSubAdapter
let eventPubSub = require('@superbalist/js-event-pubsub')
let EventManager = eventPubSub.EventManager
let SimpleEventMessageTranslator = eventPubSub.translators.SimpleEventMessageTranslator
let SimpleEvent = eventPubSub.events.SimpleEvent

// create a new event manager
let adapter = new LocalPubSubAdapter()
let translator = new SimpleEventMessageTranslator()
let manager = new EventManager(adapter, translator)

// listen for an event
manager.listen('events', 'user.created', (event) => {
    console.log(event)
})

// listen for all events on the channel
manager.listen('events', '*', (event) => {
    console.log(event)
})

// dispatch an event
let event = new SimpleEvent('user.created', {
    user: {
        id: 1456,
        first_name: 'Joe',
        last_name: 'Soap',
        email: 'joe.soap@example.org'
    }
})
manager.dispatch('events', event)



// let pubsub = require('./pubsub');
// let connection = pubsub.connection();

// let channel = process.argv[2] || 'test';

// let count = 0;

// console.log(`Listening for all messages on channel "${channel}"`);
// connection.subscribe(channel, (message) => {
//   console.log(count++);
//   console.log(message);
//   console.log(typeof(message));
// });
