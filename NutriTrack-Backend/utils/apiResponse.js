/**
 * Standard API response helpers.
 *
 * Shape (matches Phase 0.2 spec):
 *   success: { success: true,  data?: any }
 *   error:   { success: false, error: { code: string, message: string, details?: any } }
 *
 * New (v1) endpoints should use these helpers. Throwing an `ApiError` from a
 * controller (wrapped in `asyncHandler`) routes through the global error handler
 * and produces the same error shape automatically.
 */

/** Operational error carrying an HTTP status + machine-readable code. */
export class ApiError extends Error {
  constructor(statusCode, code, message, details = undefined) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }

  static badRequest(message, code = "BAD_REQUEST", details) {
    return new ApiError(400, code, message, details);
  }
  static unauthorized(message = "Authentication required", code = "UNAUTHORIZED") {
    return new ApiError(401, code, message);
  }
  static forbidden(message = "Access denied", code = "FORBIDDEN") {
    return new ApiError(403, code, message);
  }
  static notFound(message = "Resource not found", code = "NOT_FOUND") {
    return new ApiError(404, code, message);
  }
  static conflict(message, code = "CONFLICT") {
    return new ApiError(409, code, message);
  }
  static internal(message = "Internal server error", code = "INTERNAL_ERROR") {
    return new ApiError(500, code, message);
  }
}

/** Send a standardized success response. */
export const sendSuccess = (res, data = null, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/** Send a standardized error response. */
export const sendError = (res, statusCode, code, message, details = undefined) =>
  res.status(statusCode).json({
    success: false,
    error: { code, message, ...(details !== undefined ? { details } : {}) },
  });

/**
 * Wrap an async route handler so rejected promises propagate to Express's
 * error-handling middleware instead of crashing the process.
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
