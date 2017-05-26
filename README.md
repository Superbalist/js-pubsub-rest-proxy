# js-pubsub-rest-proxy

An HTTP server which acts as a gateway for publishing messages via a [js-pubsub](https://github.com/Superbalist/js-pubsub) adapter.

[![Author](http://img.shields.io/badge/author-@superbalist-blue.svg?style=flat-square)](https://twitter.com/superbalist)
[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](LICENSE)
[![NPM Version](https://img.shields.io/npm/v/@superbalist/js-pubsub-rest-proxy.svg)](https://www.npmjs.com/package/@superbalist/js-pubsub-rest-proxy)
[![NPM Downloads](https://img.shields.io/npm/dt/@superbalist/js-pubsub-rest-proxy.svg)](https://www.npmjs.com/package/@superbalist/js-pubsub-rest-proxy)

This service wraps the [js-pubsub-manager](https://github.com/Superbalist/js-pubsub-manager) library which bundles support
for the following adapters:
* Local
* /dev/null
* Redis
* Google Cloud

It exposes a `/messages/(channel)` end-point where messages can be POSTed to.

eg:
```
POST /messages/test HTTP/1.1
Content-Type: application/json

{
	"messages": [
		"Hello World",
		{
			"another": "message"
		}
	]
}
```

This is an async end-point which queues messages for background publishing.

The [js-pubsub-http](https://github.com/Superbalist/js-pubsub-http) adapter is a client-side implementation for publishing
messages via this service.

## Installation

```bash
npm install @superbalist/js-pubsub-rest-proxy
```

## Environment Variables

| Env Var                        | Default   | Description                                                        |
|--------------------------------|-----------|--------------------------------------------------------------------|
| PORT                           | 3000      | The port the web server will listen on                             |
| LOG_LEVEL                      | info      | The log level (silly | debug | verbose | info | warn | error)      |
| SENTRY_DSN                     | null      |                                                                    |
| PUBSUB_CONNECTION              | redis     | The pub/sub connection to use (/dev/null | local | redis | gcloud) |
| REDIS_HOST                     | localhost |                                                                    |
| REDIS_PORT                     | 6379      |                                                                    |
| GOOGLE_CLOUD_PROJECT_ID        | null      |                                                                    |
| GOOGLE_APPLICATION_CREDENTIALS | null      | The full path to the file containing the Google Cloud credentials  |
