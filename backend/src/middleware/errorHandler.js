export class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;
  const response = {
    error: {
      message: statusCode >= 500 ? "Internal server error" : error.message
    }
  };

  if (error.details) {
    response.error.details = error.details;
  }

  if (process.env.NODE_ENV !== "production" && statusCode >= 500) {
    response.error.debug = error.message;
  }

  res.status(statusCode).json(response);
}
