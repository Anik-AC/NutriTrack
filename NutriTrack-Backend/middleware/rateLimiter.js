import rateLimit from "express-rate-limit";
import { sendError } from "../utils/apiResponse.js";

// Disable limits in the test environment so Supertest suites aren't throttled.
const isTest = process.env.NODE_ENV === "test";

const handler = (req, res) =>
  sendError(res, 429, "RATE_LIMITED", "Too many requests, please try again later.");

const baseOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skip: () => isTest,
};

/** General limiter for the bulk of the API (per route group). */
export const generalLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300,
});

/** Stricter limiter for auth endpoints (brute-force protection). */
export const authLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 30,
});

/** Limiter for write-heavy / sensitive booking + payment actions. */
export const bookingLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 100,
});
