import express from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import {
  searchFoods,
  lookupBarcode,
  parseNaturalLanguage,
  getFoodById,
} from "../controllers/nutritionController.js";

const router = express.Router();

/**
 * @openapi
 * /v1/nutrition/search:
 *   get:
 *     summary: Search for foods across providers
 *     description: >
 *       Queries USDA FoodData Central first. If fewer than 3 results are returned,
 *       also queries Open Food Facts. All results are cached in MongoDB (30-day TTL).
 *     tags: [Nutrition]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string, minLength: 1 }
 *         description: Food name or keyword to search
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, minimum: 1, maximum: 50 }
 *     responses:
 *       200:
 *         description: List of matching foods
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         results: { type: array }
 *                         count: { type: integer }
 *                         page: { type: integer }
 *       400:
 *         description: Missing or invalid query parameter
 */
router.get(
  "/search",
  authMiddleware,
  validate({
    query: z.object({
      q: z.string().min(1),
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(50).default(20),
    }),
  }),
  searchFoods
);

/**
 * @openapi
 * /v1/nutrition/barcode/{code}:
 *   get:
 *     summary: Look up a food by barcode (UPC/EAN)
 *     description: >
 *       Checks the MongoDB cache first. If not found, queries Open Food Facts
 *       (primary) then falls back to USDA branded foods database.
 *     tags: [Nutrition]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema: { type: string }
 *         description: UPC-12 or EAN-13 barcode
 *     responses:
 *       200:
 *         description: Food item for this barcode
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiSuccess' }
 *       404:
 *         description: Barcode not found in any provider
 */
router.get(
  "/barcode/:code",
  authMiddleware,
  validate({ params: z.object({ code: z.string().min(1) }) }),
  lookupBarcode
);

/**
 * @openapi
 * /v1/nutrition/parse:
 *   post:
 *     summary: Parse natural language food description into structured nutrition data
 *     description: >
 *       Sends the text to Edamam Food Database API. Falls back to Nutritionix
 *       (deprecated) when Edamam is not configured. Supports comma or newline-separated
 *       multi-ingredient text.
 *     tags: [Nutrition]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *                 example: "2 eggs, 1 slice whole wheat toast"
 *     responses:
 *       200:
 *         description: Parsed food items with nutrition data
 *       404:
 *         description: No foods could be identified from the given text
 */
router.post(
  "/parse",
  authMiddleware,
  validate({ body: z.object({ text: z.string().min(1) }) }),
  parseNaturalLanguage
);

/**
 * @openapi
 * /v1/nutrition/food/{id}:
 *   get:
 *     summary: Retrieve a cached food item by its cache ID
 *     description: >
 *       Returns a food item from the MongoDB nutrition cache by its _id. The ID is
 *       returned in the `_id` field of every search/barcode/parse response.
 *     tags: [Nutrition]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId from the nutrition cache
 *     responses:
 *       200:
 *         description: Food item
 *       404:
 *         description: Item not found in cache (may have expired after 30 days)
 */
router.get(
  "/food/:id",
  authMiddleware,
  validate({ params: z.object({ id: z.string().min(1) }) }),
  getFoodById
);

export default router;
