import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { logSleep, getLatest, getHistory, updateLog, deleteLog, getAnalysis } from "../controllers/sleepController.js";

const router = Router();

const VALID_FACTORS = ["caffeine_late", "exercise", "screen_time", "stress", "alcohol"];

const logBodySchema = z.object({
  bedtime:  z.string().datetime({ message: "bedtime must be a valid ISO datetime" }),
  wakeTime: z.string().datetime({ message: "wakeTime must be a valid ISO datetime" }),
  quality:  z.coerce.number().int().min(1).max(5),
  notes:    z.string().max(1000).optional(),
  factors:  z.array(z.enum(VALID_FACTORS)).optional(),
  source:   z.enum(["manual", "apple_health"]).optional(),
});

const updateBodySchema = z.object({
  bedtime:  z.string().datetime().optional(),
  wakeTime: z.string().datetime().optional(),
  quality:  z.coerce.number().int().min(1).max(5).optional(),
  notes:    z.string().max(1000).optional(),
  factors:  z.array(z.enum(VALID_FACTORS)).optional(),
}).refine(
  (data) => !(!!data.bedtime ^ !!data.wakeTime),
  { message: "Provide both bedtime and wakeTime together, or neither" }
).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided for update" }
);

const historyQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "startDate must be YYYY-MM-DD").optional(),
  endDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "endDate must be YYYY-MM-DD").optional(),
  page:      z.coerce.number().int().min(1).optional(),
  limit:     z.coerce.number().int().min(1).max(100).optional(),
}).transform((q) => {
  const now = new Date();
  const defaultEnd = now.toISOString().split("T")[0];
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - 29);
  return {
    startDate: q.startDate ?? start.toISOString().split("T")[0],
    endDate:   q.endDate ?? defaultEnd,
    page:      q.page ?? 1,
    limit:     q.limit ?? 20,
  };
});

const analysisQuerySchema = z.object({
  period: z.coerce.number().int().min(1).max(365).optional(),
}).transform((q) => ({ period: q.period ?? 30 }));

// Order matters: fixed paths before /:id
router.post("/log",       authMiddleware, validate({ body: logBodySchema }),          logSleep);
router.get("/today",      authMiddleware,                                              getLatest);
router.get("/history",    authMiddleware, validate({ query: historyQuerySchema }),     getHistory);
router.get("/analysis",   authMiddleware, validate({ query: analysisQuerySchema }),    getAnalysis);
router.put("/log/:id",    authMiddleware, validate({ body: updateBodySchema }),        updateLog);
router.delete("/log/:id", authMiddleware,                                              deleteLog);

export default router;
