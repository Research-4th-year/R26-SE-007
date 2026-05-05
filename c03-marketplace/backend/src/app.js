const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { errorConverter, errorHandler } = require('./middlewares/error.middleware');
const ragRoutes = require('./routes/rag.routes');
const millerRoutes = require('./routes/miller.routes');

const app = express();

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// v1 api routes
app.use('/api/rag', ragRoutes);
app.use("/api/millers", millerRoutes);




// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  res.status(404).send({ message: 'Not found' });
});

app.use(errorConverter);
app.use(errorHandler);

module.exports = app;
