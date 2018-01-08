'use strict';
let express = require('express');
let promClient = require('prom-client');

promClient.collectDefaultMetrics({timeout: 30000});

let app = express();

app.get('/metrics', (req, res)=>{
    res.end(promClient.register.metrics());
});

module.exports = app;
