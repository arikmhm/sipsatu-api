const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ success: true, message: 'SIPSATU API' });
});

const routes = require('./routes');
app.use('/api', routes);

const errorHandler = require('./middlewares/errorHandler');
app.use(errorHandler);

module.exports = app;
