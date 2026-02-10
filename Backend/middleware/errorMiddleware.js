// @desc    Handle 404 errors (Route not found)
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error); // Passes error to the next middleware (errorHandler)
};

// @desc    General Error Handler (Catches all errors)
const errorHandler = (err, req, res, next) => {
  // If status code is 200 (OK) but there is an error, force it to 500 (Server Error)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode);

  res.json({
    message: err.message,
    // Only show stack trace in development mode for security
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };