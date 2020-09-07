# Changelog

## 1.3.0 2020-09-15
* Badly formed channel messages result in `400` error
* When this service is shutting down, it won't be receiving any more messages
* When a message fails with `503`, the caller should retry

## 1.2.0 2018-12-21

* Fallback to rabbitmq if messages fail 3 times. 

## 1.1.1 2018-12-19

* Make prom stats show per channel

## 1.1.0 2018-12-13

* Added schema validation checking

## 1.0.3 2018-12-06

* Added more prometheus metrics

## 1.0.2 - 2018-11-22

* Moved to promises and update versions to use caching

## 1.0.1 - 2017-08-08

* Add new MAX_POST_SIZE config var and env var set to default of 10mb

## 1.0.0 - 2017-05-26

* Initial release
