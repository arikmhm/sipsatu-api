const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.json({ success: true, message: 'SIPSATU API' });
});

module.exports = app;
