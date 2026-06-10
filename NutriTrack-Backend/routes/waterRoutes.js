import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { logWater, getToday, getHistory, setGoal, deleteLog } from "../controllers/waterController.js";

const router = Router();

// ── Zod schemas ────────────────────────────────────────────────────────────────

const logBodySchema = z.object({
  amount:   z.coerce.number().int().min(1, "amount must be at least 1 ml").max(10000, "amount cannot exceed 10,000 ml"),
  loggedAt: z.string().datetime({ message: "loggedAt must be a valid ISO datetime" }).optional(),
  source:   z.enum(["manual", "quick_add", "apple_health"]).optional(),
});

const historyQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "startDate must be YYYY-MM-DD").optional(),
  endDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "endDate must be YYYY-MM-DD").optional(),
}).transform((q) => {
  const now = new Date();
  const defaultEnd = now.toISOString().split("T")[0];
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
  const defaultStart = sevenDaysAgo.toISOString().split("T")[0];
  return {
    startDate: q.startDate ?? defaultStart,
    endDate:   q.endDate ?? defaultEnd,
  };
});

const goalBodySchema = z.object({
  dailyGoalMl: z.coerce.number().int().min(500, "goal must be at least 500 ml").max(10000, "goal cannot exceed 10,000 ml"),
});

// ── Routes ─────────────────────────────────────────────────────────────────────

router.post("/log",        authMiddleware, validate({ body: logBodySchema }),     logWater);
router.get("/today",       authMiddleware,                                         getToday);
router.get("/history",     authMiddleware, validate({ query: historyQuerySchema }), getHistory);
router.put("/goal",        authMiddleware, validate({ body: goalBodySchema }),      setGoal);
router.delete("/log/:id",  authMiddleware,                                         deleteLog);

export default router;
