const express = require('express');

const app = express();
app.use('/api', require('./api'));

module.exports = app;