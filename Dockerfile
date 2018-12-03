FROM node:7.9.0
MAINTAINER Superbalist <tech+docker@superbalist.com>

RUN mkdir -p /usr/src/js-pubsub-rest-proxy
WORKDIR /usr/src/js-pubsub-rest-proxy

COPY package.json /usr/src/js-pubsub-rest-proxy/
RUN yarn install

COPY src /usr/src/js-pubsub-rest-proxy/src/

EXPOSE 3000
CMD ["node", "./src/bin/www"]
