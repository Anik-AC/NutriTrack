import { ZodError } from "zod";
import { sendError } from "../utils/apiResponse.js";

/**
 * Request validation middleware factory using Zod.
 *
 * Usage:
 *   import { z } from "zod";
 *   router.post("/login", validate({ body: z.object({ email: z.string().email(), password: z.string().min(6) }) }), login);
 *
 * Validates (and coerces) `req.body`, `req.params`, and `req.query` against the
 * supplied Zod schemas. On failure responds with the standard error shape and a
 * `VALIDATION_ERROR` code; on success replaces each part with the parsed value.
 */
export const validate =
  ({ body, params, query } = {}) =>
  (req, res, next) => {
    try {
      if (body) req.body = body.parse(req.body);
      if (params) req.params = params.parse(req.params);
      if (query) {
        // req.query can be a read-only getter on some Express versions; assign defensively.
        const parsedQuery = query.parse(req.query);
        try {
          req.query = parsedQuery;
        } catch {
          req.validatedQuery = parsedQuery;
        }
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        }));
        return sendError(res, 400, "VALIDATION_ERROR", "Request validation failed", details);
      }
      next(err);
    }
  };
