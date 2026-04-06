const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ success: true, message: 'SIPSATU API' });
});

// TODO: register routes di /api

const errorHandler = require('./middlewares/errorHandler');
app.use(errorHandler);

module.exports = app;
