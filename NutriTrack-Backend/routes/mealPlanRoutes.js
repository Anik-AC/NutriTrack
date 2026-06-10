/**
 * @openapi
 * tags:
 *   - name: MealPlan
 *     description: Weekly meal planner and grocery list
 */

import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import {
  upsertMealPlan,
  getCurrentMealPlan,
  getMealPlanByWeek,
  deleteMealPlan,
  generateGroceryList,
} from "../controllers/mealPlanController.js";

const router = Router();

// ── Zod schemas ────────────────────────────────────────────────────────────────

const mealEntrySchema = z.object({
  type: z.enum(["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner", "evening_snack"]),
  recipeId: z.string().optional(),
  servings: z.number().positive().default(1),
});

const dayPlanSchema = z.object({
  date: z.string().refine((s) => !isNaN(Date.parse(s)), { message: "Invalid date" }),
  meals: z.array(mealEntrySchema).default([]),
  targetCalories: z.number().optional(),
  targetProtein: z.number().optional(),
  targetCarbs: z.number().optional(),
  targetFat: z.number().optional(),
});

const upsertSchema = z.object({
  weekStart: z.string().refine((s) => !isNaN(Date.parse(s)), { message: "Invalid weekStart date" }),
  days: z.array(dayPlanSchema).max(7),
});

const idParamSchema = z.object({ id: z.string().min(1) });
const weekParamSchema = z.object({ weekStart: z.string().min(1) });

// ── Routes ─────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/v1/meal-plan:
 *   post:
 *     summary: Create or update the week's meal plan
 *     tags: [MealPlan]
 *     security: [{ bearerAuth: [] }]
 *   get:
 *     summary: Get the current week's meal plan
 *     tags: [MealPlan]
 *     security: [{ bearerAuth: [] }]
 */
router.post("/", authMiddleware, validate({ body: upsertSchema }), upsertMealPlan);
router.get("/", authMiddleware, getCurrentMealPlan);

/**
 * @openapi
 * /api/v1/meal-plan/grocery-list:
 *   get:
 *     summary: Generate grocery list from current week's meal plan
 *     tags: [MealPlan]
 *     security: [{ bearerAuth: [] }]
 */
router.get("/grocery-list", authMiddleware, generateGroceryList);

/**
 * @openapi
 * /api/v1/meal-plan/week/{weekStart}:
 *   get:
 *     summary: Get meal plan for a specific week
 *     tags: [MealPlan]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: weekStart
 *         required: true
 *         schema: { type: string, format: date }
 */
router.get("/week/:weekStart", authMiddleware, validate({ params: weekParamSchema }), getMealPlanByWeek);

/**
 * @openapi
 * /api/v1/meal-plan/{id}:
 *   delete:
 *     summary: Delete a meal plan
 *     tags: [MealPlan]
 *     security: [{ bearerAuth: [] }]
 */
router.delete("/:id", authMiddleware, validate({ params: idParamSchema }), deleteMealPlan);

export default router;
