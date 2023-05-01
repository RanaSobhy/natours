const AppError = require('../utils/appError');

const handleDBCastError = (error) => {
  const message = `Invalid ${error.path}: ${error.value}`;

  return new AppError(message, 400);
};

const handleDBduplicateFields = (error) => {
  const value = error.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  const message = `duplicate field value: ${value}`;

  return new AppError(message, 400);
};

const handleDBValidationError = (error) => {
  const errors = Object.values(error.errors).map((el) => el.message);
  const message = `Invalid input Data. ${errors.join('. ')}`;

  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again', 401);

const sendErrorDev = (error, req, res) => {
  if (!error.isOperational) console.error('ERROR 🚨', error);

  if (req.originalUrl.startsWith('/api')) {
    res.status(error.statusCode).json({
      status: error.status,
      error: error,
      message: error.message,
      stack: error.stack,
    });
  } else {
    res
      .status(error.statusCode)
      .render('error', { title: 'Something went wrong', msg: error.message });
  }
};

const sendErrorProd = (error, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (error.isOperational) {
      res.status(error.statusCode).json({
        status: error.status,
        message: error.message,
      });
    } else {
      console.error('ERROR 🚨', error);
      res
        .status(500)
        .json({ status: 'error', message: 'Something went wrong' });
    }
  } else {
    if (!error.isOperational) console.error('ERROR 🚨', error);
    res.status(error.statusCode).render('error', {
      title: 'Something went wrong',
      msg: error.isOperational ? error.message : 'Please try again later',
    });
  }
};

module.exports = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  if (process.env.NODE_ENV.trim() === 'development') {
    sendErrorDev(error, req, res);
  } else if (process.env.NODE_ENV.trim() === 'production') {
    let err = { ...error };

    err.name = error.name;
    err.errmsg = error.errmsg;
    err.message = error.message;

    if (err.name === 'CastError') err = handleDBCastError(err);
    if (err.code === 11000) err = handleDBduplicateFields(err);
    if (err.name === 'ValidationError') err = handleDBValidationError(err);

    if (err.name === 'JsonWebTokenError') err = handleJWTError(err);
    if (err.name === 'TokenExpiredError') err = handleJWTExpiredError(err);

    sendErrorProd(err, req, res);
  }
};
