class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error"; // determina si es error de cliente(4xx) o de servidor(5xx)
    this.isOperational = true; //indica si es un error operacional

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
