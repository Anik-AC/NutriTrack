import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

import { connectDB } from "./config/db.js";
import { swaggerSpec } from "./config/swagger.js";
import { nutriRoutes, nutritionRoutes, authRoutes, profileRoutes, userRoutes, adminRoutes, coachRoutes, recipeRoutes, mealPlanRoutes, waterRoutes } from "./routes/index.js";
import { generalLimiter, authLimiter, bookingLimiter } from "./middleware/rateLimiter.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import { sendSuccess } from "./utils/apiResponse.js";

dotenv.config();

const PORT = process.env.PORT || process.env.VITE_PORT || 5000;

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['https://nutritrack.onixpace.com', 'http://localhost:5173'];

app.use(express.json());
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
  next();
});

// 🔹 API docs (Swagger UI + raw OpenAPI JSON)
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api/docs.json", (req, res) => res.json(swaggerSpec));

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Service health check
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Service is up
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiSuccess' }
 */
const health = (req, res) =>
  sendSuccess(res, { status: "ok", uptime: process.uptime(), env: process.env.NODE_ENV || "development" });
app.get("/api/health", health);
app.get("/api/v1/health", health);

/**
 * Mount each route group under BOTH the versioned `/api/v1/*` prefix (preferred
 * for new features) and the legacy `/api/*` alias (backward compatibility), each
 * behind its rate limiter. Specific sub-paths are mounted before the nutri routes
 * (which live at the `/api` root) so they take precedence.
 */
const mountGroup = (subPath, limiter, router) => {
  app.use(`/api/v1${subPath}`, limiter, router);
  app.use(`/api${subPath}`, limiter, router);
};

mountGroup("/auth", authLimiter, authRoutes);
mountGroup("/user", generalLimiter, profileRoutes);
mountGroup("/booking", bookingLimiter, userRoutes);
mountGroup("/admin", generalLimiter, adminRoutes);
mountGroup("/coach", generalLimiter, coachRoutes);
// v1-only nutrition abstraction layer (Phase 1)
app.use("/api/v1/nutrition", generalLimiter, nutritionRoutes);
// v1-only recipe book and meal planner (Phase 2)
app.use("/api/v1/recipes", generalLimiter, recipeRoutes);
app.use("/api/v1/meal-plan", generalLimiter, mealPlanRoutes);
// v1-only water intake tracker (Phase 3)
app.use("/api/v1/water", generalLimiter, waterRoutes);
// nutri routes live at the API root — mounted last so the groups above win.
mountGroup("", generalLimiter, nutriRoutes);

// 404 + global error handler (must be last).
app.use(notFoundHandler);
app.use(errorHandler);

connectDB();

// Local dev only — Vercel invokes the exported app directly
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
}

export default app;
