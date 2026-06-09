import { ZodError } from "zod";
import { ApiError, sendError } from "../utils/apiResponse.js";

/** 404 handler — mount AFTER all routes. */
export const notFoundHandler = (req, res) =>
  sendError(res, 404, "NOT_FOUND", `Route not found: ${req.method} ${req.originalUrl}`);

/**
 * Global error handler — mount LAST (after the 404 handler).
 * Normalizes every error into the standard `{ success:false, error:{ code, message } }`
 * shape so all unhandled/thrown errors are consistent across endpoints.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  // Operational errors thrown by controllers.
  if (err instanceof ApiError) {
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }

  // Zod errors that reached here without being caught by validate().
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
    return sendError(res, 400, "VALIDATION_ERROR", "Request validation failed", details);
  }

  // Mongoose validation / cast errors.
  if (err?.name === "ValidationError") {
    return sendError(res, 400, "VALIDATION_ERROR", err.message);
  }
  if (err?.name === "CastError") {
    return sendError(res, 400, "INVALID_ID", `Invalid value for "${err.path}"`);
  }
  // Mongo duplicate key.
  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return sendError(res, 409, "DUPLICATE_KEY", `Duplicate value for "${field}"`);
  }
  // JWT errors.
  if (err?.name === "JsonWebTokenError" || err?.name === "TokenExpiredError") {
    return sendError(res, 401, "INVALID_TOKEN", "Invalid or expired token");
  }

  console.error("❌ Unhandled error:", err);
  const message =
    process.env.NODE_ENV === "production" ? "Internal server error" : err?.message || "Internal server error";
  return sendError(res, err?.statusCode || 500, "INTERNAL_ERROR", message);
};
