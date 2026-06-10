/**
 * @openapi
 * tags:
 *   - name: Recipes
 *     description: Personal recipe book
 */

import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import {
  createRecipe,
  listRecipes,
  getRecipe,
  updateRecipe,
  deleteRecipe,
  logRecipe,
  importFromUrl,
  importFromImage,
  importFromYoutube,
} from "../controllers/recipeController.js";

const router = Router();

// ── Zod schemas ────────────────────────────────────────────────────────────────

const ingredientSchema = z.object({
  name: z.string().min(1),
  foodItemId: z.string().optional(),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  notes: z.string().optional(),
});

const nutrientsSchema = z
  .object({
    calories: z.number().optional(),
    protein: z.number().optional(),
    carbs: z.number().optional(),
    fat: z.number().optional(),
    fiber: z.number().optional(),
    sugar: z.number().optional(),
    sodium: z.number().optional(),
    cholesterol: z.number().optional(),
    saturatedFat: z.number().optional(),
    potassium: z.number().optional(),
    vitaminA: z.number().optional(),
    vitaminC: z.number().optional(),
    vitaminD: z.number().optional(),
    calcium: z.number().optional(),
    iron: z.number().optional(),
  })
  .optional();

const recipeBodySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  servings: z.number().int().min(1),
  prepTime: z.number().int().min(0).optional(),
  cookTime: z.number().int().min(0).optional(),
  ingredients: z.array(ingredientSchema).optional().default([]),
  instructions: z.array(z.string()).optional().default([]),
  nutrientsPerServing: nutrientsSchema,
  coverImage: z.string().url().optional(),
  isFavorite: z.boolean().optional().default(false),
  rating: z.number().min(1).max(5).optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  tags: z.string().optional(),
  search: z.string().optional(),
});

const idParamSchema = z.object({
  id: z.string().min(1),
});

const logSchema = z.object({
  servings: z.number().positive(),
  eatenWhen: z.enum(["breakfast", "AM snack", "lunch", "PM snack", "dinner"]),
  eatenDate: z.string().optional(),
});

const importUrlSchema = z.object({
  url: z.string().url(),
});

const importYoutubeSchema = z.object({
  url: z.string().url(),
});

// ── Routes ─────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/v1/recipes:
 *   post:
 *     summary: Create a recipe
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, servings]
 *             properties:
 *               title: { type: string }
 *               servings: { type: integer, minimum: 1 }
 *               ingredients: { type: array }
 *               instructions: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Recipe created
 *       400:
 *         description: Validation error
 */
router.post("/", authMiddleware, validate({ body: recipeBodySchema }), createRecipe);

/**
 * @openapi
 * /api/v1/recipes:
 *   get:
 *     summary: List user's recipes
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: tags
 *         schema: { type: string }
 *         description: Comma-separated tag filter
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated recipe list
 */
router.get("/", authMiddleware, validate({ query: listQuerySchema }), listRecipes);

/**
 * @openapi
 * /api/v1/recipes/import/url:
 *   post:
 *     summary: Import recipe from a URL (schema.org/Recipe JSON-LD)
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 */
router.post("/import/url", authMiddleware, validate({ body: importUrlSchema }), importFromUrl);

/**
 * @openapi
 * /api/v1/recipes/import/image:
 *   post:
 *     summary: Import recipe from an image (requires Phase 8 AI — returns 501 until then)
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 */
router.post("/import/image", authMiddleware, importFromImage);

/**
 * @openapi
 * /api/v1/recipes/import/youtube:
 *   post:
 *     summary: Import recipe from a YouTube URL (requires Phase 8 AI — returns 501 until then)
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 */
router.post("/import/youtube", authMiddleware, validate({ body: importYoutubeSchema }), importFromYoutube);

/**
 * @openapi
 * /api/v1/recipes/{id}:
 *   get:
 *     summary: Get recipe by ID
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *   put:
 *     summary: Update a recipe
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 *   delete:
 *     summary: Delete a recipe
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 */
router.get("/:id", authMiddleware, validate({ params: idParamSchema }), getRecipe);
router.put("/:id", authMiddleware, validate({ params: idParamSchema, body: recipeBodySchema.partial() }), updateRecipe);
router.delete("/:id", authMiddleware, validate({ params: idParamSchema }), deleteRecipe);

/**
 * @openapi
 * /api/v1/recipes/{id}/log:
 *   post:
 *     summary: Log a recipe as a meal entry
 *     tags: [Recipes]
 *     security: [{ bearerAuth: [] }]
 */
router.post("/:id/log", authMiddleware, validate({ params: idParamSchema, body: logSchema }), logRecipe);

export default router;
