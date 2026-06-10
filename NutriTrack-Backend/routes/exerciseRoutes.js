import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { searchExercises, getExerciseById } from "../controllers/exerciseController.js";

const router = Router();

const MUSCLE_GROUPS = ["chest","back","legs","shoulders","arms","core","cardio","other"];
const EQUIPMENT     = ["barbell","dumbbell","machine","bodyweight","cable","band","other"];

const searchQuerySchema = z.object({
  q:           z.string().min(1).max(100).optional(),
  muscleGroup: z.enum(MUSCLE_GROUPS).optional(),
  equipment:   z.enum(EQUIPMENT).optional(),
  limit:       z.coerce.number().int().min(1).max(50).optional(),
});

// /search must come before /:id to avoid being treated as an id
router.get("/search", authMiddleware, validate({ query: searchQuerySchema }), searchExercises);
router.get("/:id",    authMiddleware, getExerciseById);

export default router;
