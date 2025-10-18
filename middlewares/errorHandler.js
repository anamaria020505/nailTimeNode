const logger = require("../loggers/logger.js");

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500; //si no tiene status code, se le asigna 500
  err.status = err.status || "error"; //si no tiene status, se le asigna error

  logger.error(
    `Error: ${err.statusCode} - ${req.method} ${req.path} - ${err.status} - ${err.message} - IP: ${req.ip}`
  );

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};

module.exports = errorHandler;
