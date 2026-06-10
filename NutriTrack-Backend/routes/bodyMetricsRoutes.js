import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import {
  logMetrics, getLatest, getHistory, updateLog, deleteLog,
  uploadPhoto, listPhotos, deletePhoto,
} from "../controllers/bodyMetricsController.js";

const router = Router();

// ── Multer (memory storage — buffer sent directly to Cloudinary) ──────────────
const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  },
});

// ── Body schemas ───────────────────────────────────────────────────────────────

const measurementsSchema = z.object({
  chest:      z.coerce.number().positive().optional(),
  waist:      z.coerce.number().positive().optional(),
  hips:       z.coerce.number().positive().optional(),
  bicepLeft:  z.coerce.number().positive().optional(),
  bicepRight: z.coerce.number().positive().optional(),
  thighLeft:  z.coerce.number().positive().optional(),
  thighRight: z.coerce.number().positive().optional(),
  unit:       z.enum(["cm", "in"]).optional(),
}).optional();

const metricsFields = z.object({
  date:               z.string().datetime().optional(),
  weight:             z.coerce.number().positive().optional(),
  weightUnit:         z.enum(["kg", "lbs"]).optional(),
  bodyFatPercentage:  z.coerce.number().min(0).max(100).optional(),
  measurements:       measurementsSchema,
  notes:              z.string().max(1000).optional(),
  source:             z.enum(["manual", "apple_health"]).optional(),
});

const logBodySchema = metricsFields.refine(
  (d) => d.weight != null || d.bodyFatPercentage != null || d.measurements != null,
  { message: "At least one of weight, bodyFatPercentage, or measurements is required" }
);

const updateBodySchema = metricsFields.partial();

// ── Query schemas ──────────────────────────────────────────────────────────────

const historyQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).transform((q) => {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const defaultStart = new Date(today);
  defaultStart.setUTCDate(defaultStart.getUTCDate() - 89);
  return {
    startDate: q.startDate ?? defaultStart.toISOString().slice(0, 10),
    endDate:   q.endDate   ?? todayStr,
  };
});

const photosQuerySchema = z.object({
  page:  z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  pose:  z.enum(["front", "side", "back", "custom"]).optional(),
}).transform((q) => ({ page: q.page ?? 1, limit: q.limit ?? 20, pose: q.pose }));

// ── Routes — fixed paths before parameterized ─────────────────────────────────

router.get("/latest",           authMiddleware,                                          getLatest);
router.get("/history",          authMiddleware, validate({ query: historyQuerySchema }), getHistory);
router.post("/log",             authMiddleware, validate({ body: logBodySchema }),       logMetrics);
router.put("/log/:id",          authMiddleware, validate({ body: updateBodySchema }),    updateLog);
router.delete("/log/:id",       authMiddleware,                                          deleteLog);

router.post("/photo",           authMiddleware, photoUpload.single("photo"),             uploadPhoto);
router.get("/photos",           authMiddleware, validate({ query: photosQuerySchema }),  listPhotos);
router.delete("/photo/:id",     authMiddleware,                                          deletePhoto);

export default router;
