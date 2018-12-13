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

The service is available as a docker image OR an npm package.

```bash
npm install @superbalist/js-pubsub-rest-proxy
```

## Environment Variables

When you start the `js-pubsub-rest-proxy` image, you can adjust the configuration of the instance by passing one or more environment variables on the docker run command line.

| Env Var                        | Default   | Description                                                        |
|--------------------------------|-----------|--------------------------------------------------------------------|
| PORT                           | 3000      | The port the web server will listen on                             |
| LOG_LEVEL                      | info      | The log level (silly, debug, verbose, info, warn, error)           |
| SENTRY_DSN                     | null      |                                                                    |
| MAX_POST_SIZE                  | 10mb      | The max post size for request payloads                             |
| PUBSUB_CONNECTION              | redis     | The pub/sub connection to use (/dev/null, local, redis, gcloud)    |
| REDIS_HOST                     | localhost |                                                                    |
| REDIS_PORT                     | 6379      |                                                                    |
| GOOGLE_CLOUD_PROJECT_ID        | null      |                                                                    |
| GOOGLE_APPLICATION_CREDENTIALS | null      | The full path to the file containing the Google Cloud credentials  |
| GOOGLE_CLOUD_CLIENT_IDENTIFIER | null      | The client identifier used when talking to Google Cloud            |
| VALIDATION_ERROR_SCHEMA_URL    | false     | The url for invalid event schema below. Enables validation
|
| VALIDATION_ERROR_CHANNEL       | validation_error | The channel to publish validation errors to
|

## Running

1. Start a container using the Redis Pub/Sub adapter
```bash
$ docker run \
  -d \
  --rm \
  --name js-pubsub-rest-proxy \
  -e PUBSUB_CONNECTION='redis' \
  -e REDIS_HOST='127.0.0.1' \
  -e REDIS_PORT='6379' \
  superbalist/js-pubsub-rest-proxy
```

2. Start a container using the Google Cloud Pub/Sub adapter
```bash
$ docker run \
  -d \
  --rm \
  --name js-pubsub-rest-proxy \
  -e PUBSUB_CONNECTION='gcloud' \
  -e GOOGLE_CLOUD_PROJECT_ID='your-project-id-here' \
  -e GOOGLE_APPLICATION_CREDENTIALS='/etc/gcloud_credentials.json' \
  superbalist/js-pubsub-rest-proxy
```

## Validation Error Schema
```
"properties": {
  "schema": {
      "type": "string",
      "format": "uri"
  },
  "meta": {
      "type": "object"
  },
  "event": {
      "type": "object"
  },
  "errors": {
      "type": "array"
  }
}
```