import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import {
  createTemplate, listTemplates, updateTemplate, deleteTemplate,
  createSession, updateSession, listSessions, getSession,
  getStats, getExerciseHistory,
} from "../controllers/workoutController.js";

const router = Router();

// ── Shared sub-schemas ─────────────────────────────────────────────────────────

const setSchema = z.object({
  setNumber:   z.coerce.number().int().min(1),
  weight:      z.coerce.number().min(0),
  weightUnit:  z.enum(["kg", "lbs"]).optional(),
  reps:        z.coerce.number().int().min(0),
  isWarmup:    z.boolean().optional(),
  isPR:        z.boolean().optional(),
  completedAt: z.string().datetime().optional(),
});

const sessionExerciseSchema = z.object({
  exerciseId:   z.string().min(1),
  exerciseName: z.string().min(1),
  sets:         z.array(setSchema).default([]),
  notes:        z.string().max(500).optional(),
});

const templateExerciseSchema = z.object({
  exerciseId:   z.string().min(1),
  targetSets:   z.coerce.number().int().min(1).max(20),
  targetReps:   z.string().min(1),
  targetWeight: z.coerce.number().optional(),
  restSeconds:  z.coerce.number().int().min(0).optional(),
  notes:        z.string().max(500).optional(),
  order:        z.coerce.number().int().min(0),
});

// ── Body schemas ───────────────────────────────────────────────────────────────

const templateBodySchema = z.object({
  name:              z.string().min(1).max(100).trim(),
  exercises:         z.array(templateExerciseSchema).default([]),
  estimatedDuration: z.coerce.number().int().min(1).optional(),
  tags:              z.array(z.string()).optional(),
});

const createSessionSchema = z.object({
  name:           z.string().min(1).max(100).trim(),
  templateId:     z.string().optional(),
  startedAt:      z.string().datetime().optional(),
  completedAt:    z.string().datetime().optional(),
  exercises:      z.array(sessionExerciseSchema).default([]),
  caloriesBurned: z.coerce.number().min(0).optional(),
  source:         z.enum(["manual", "apple_health"]).optional(),
});

const updateSessionSchema = z.object({
  name:           z.string().min(1).max(100).trim().optional(),
  completedAt:    z.string().datetime().optional(),
  exercises:      z.array(sessionExerciseSchema).optional(),
  caloriesBurned: z.coerce.number().min(0).optional(),
});

// ── Query schemas ──────────────────────────────────────────────────────────────

const listSessionsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page:      z.coerce.number().int().min(1).optional(),
  limit:     z.coerce.number().int().min(1).max(100).optional(),
}).transform((q) => ({
  startDate: q.startDate,
  endDate:   q.endDate,
  page:      q.page  ?? 1,
  limit:     q.limit ?? 20,
}));

const statsQuerySchema = z.object({
  period: z.coerce.number().int().min(1).max(365).optional(),
}).transform((q) => ({ period: q.period ?? 30 }));

// ── Routes ─────────────────────────────────────────────────────────────────────

// Templates
router.post("/templates",       authMiddleware, validate({ body: templateBodySchema }),                  createTemplate);
router.get("/templates",        authMiddleware,                                                           listTemplates);
router.put("/templates/:id",    authMiddleware, validate({ body: templateBodySchema.partial() }),         updateTemplate);
router.delete("/templates/:id", authMiddleware,                                                           deleteTemplate);

// Fixed-path routes before param routes
router.get("/stats",                        authMiddleware, validate({ query: statsQuerySchema }),        getStats);
router.get("/exercise-history/:exerciseId", authMiddleware,                                               getExerciseHistory);

// Sessions
router.post("/sessions",    authMiddleware, validate({ body: createSessionSchema }),          createSession);
router.get("/sessions",     authMiddleware, validate({ query: listSessionsQuerySchema }),     listSessions);
router.put("/sessions/:id", authMiddleware, validate({ body: updateSessionSchema }),          updateSession);
router.get("/sessions/:id", authMiddleware,                                                   getSession);

export default router;
