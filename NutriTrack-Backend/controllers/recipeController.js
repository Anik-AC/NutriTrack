import { z } from "zod";
import { recipeModel, trackingModel } from "../models/index.js";
import { NutritionCache } from "../services/nutrition/NutritionCache.js";
import { asyncHandler, ApiError, sendSuccess } from "../utils/apiResponse.js";

// ── helpers ────────────────────────────────────────────────────────────────────

function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday = 0 offset
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function calcNutrientsPerServing(ingredients, servings) {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  for (const ing of ingredients) {
    if (!ing.foodItemId) continue;
    const cached = await NutritionCache.getById(ing.foodItemId);
    if (!cached) continue;
    const factor = (ing.quantity || 1) / (cached.servingSize || 100);
    totals.calories += (cached.nutrients.calories || 0) * factor;
    totals.protein += (cached.nutrients.protein || 0) * factor;
    totals.carbs += (cached.nutrients.carbs || 0) * factor;
    totals.fat += (cached.nutrients.fat || 0) * factor;
    totals.fiber += (cached.nutrients.fiber || 0) * factor;
  }
  const perServing = {};
  for (const [k, v] of Object.entries(totals)) {
    perServing[k] = Math.round((v / servings) * 10) / 10;
  }
  return perServing;
}

const GROCERY_CATEGORIES = {
  Produce: ["tomato", "lettuce", "spinach", "broccoli", "carrot", "pepper", "onion", "garlic", "apple", "banana", "orange", "lemon", "lime", "berry", "avocado", "cucumber", "zucchini", "potato", "mushroom", "celery", "kale", "cabbage", "herb", "cilantro", "parsley"],
  Protein: ["chicken", "beef", "pork", "turkey", "fish", "salmon", "tuna", "shrimp", "tofu", "tempeh", "steak", "ground meat", "lamb", "egg"],
  Dairy: ["milk", "cheese", "yogurt", "butter", "cream", "cheddar", "mozzarella", "parmesan", "cottage"],
  Pantry: ["rice", "pasta", "flour", "sugar", "oil", "vinegar", "sauce", "salt", "pepper", "spice", "oat", "bread", "cereal", "bean", "lentil", "chickpea", "broth", "stock", "honey", "syrup", "baking", "canned", "coconut", "nut", "seed", "quinoa"],
  Frozen: ["frozen"],
};

function categorizeIngredient(name) {
  const lower = name.toLowerCase();
  for (const [cat, keywords] of Object.entries(GROCERY_CATEGORIES)) {
    if (keywords.some((k) => lower.includes(k))) return cat;
  }
  return "Other";
}

// Parses schema.org/Recipe JSON-LD embedded in a webpage
function parseSchemaRecipe(html, sourceUrl) {
  const scriptTagRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptTagRe.exec(html)) !== null) {
    let data;
    try { data = JSON.parse(match[1]); } catch { continue; }
    const schemas = Array.isArray(data) ? data : [data];
    const recipe = schemas.find((s) => {
      const t = s?.["@type"];
      return t === "Recipe" || (Array.isArray(t) && t.includes("Recipe"));
    });
    if (!recipe) continue;

    const ingredients = (recipe.recipeIngredient || []).map((raw) => ({
      name: raw,
      quantity: 1,
      unit: "unit",
    }));

    const instructions = (recipe.recipeInstructions || []).map((step) =>
      typeof step === "string" ? step : step?.text || ""
    );

    return {
      title: recipe.name || "Imported Recipe",
      description: recipe.description || "",
      servings: parseInt(recipe.recipeYield) || 1,
      prepTime: parseDuration(recipe.prepTime),
      cookTime: parseDuration(recipe.cookTime),
      ingredients,
      instructions,
      tags: recipe.recipeCategory ? [recipe.recipeCategory] : [],
      coverImage: recipe.image?.url || (typeof recipe.image === "string" ? recipe.image : undefined),
      source: "url_import",
      sourceUrl,
    };
  }
  return null;
}

function parseDuration(iso) {
  if (!iso) return undefined;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return undefined;
  return (parseInt(m[1] || 0) * 60) + parseInt(m[2] || 0);
}

// ── CRUD ───────────────────────────────────────────────────────────────────────

export const createRecipe = asyncHandler(async (req, res) => {
  const body = req.body;
  const userId = req.user.id;

  let nutrientsPerServing = body.nutrientsPerServing;
  if (!nutrientsPerServing && body.ingredients?.some((i) => i.foodItemId)) {
    nutrientsPerServing = await calcNutrientsPerServing(body.ingredients, body.servings);
  }

  const recipe = await recipeModel.create({ ...body, userId, nutrientsPerServing });
  return sendSuccess(res, recipe, 201);
});

export const listRecipes = asyncHandler(async (req, res) => {
  const query = req.validatedQuery ?? req.query;
  const { page, limit, tags, search } = query;
  const filter = { userId: req.user.id };
  if (tags) filter.tags = { $in: tags.split(",").map((t) => t.trim()) };
  if (search) filter.title = { $regex: search, $options: "i" };

  const skip = (page - 1) * limit;
  const [recipes, total] = await Promise.all([
    recipeModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    recipeModel.countDocuments(filter),
  ]);

  return sendSuccess(res, { recipes, total, page, limit, pages: Math.ceil(total / limit) });
});

export const getRecipe = asyncHandler(async (req, res) => {
  const recipe = await recipeModel.findOne({ _id: req.params.id, userId: req.user.id });
  if (!recipe) throw ApiError.notFound("Recipe not found", "RECIPE_NOT_FOUND");
  return sendSuccess(res, recipe);
});

export const updateRecipe = asyncHandler(async (req, res) => {
  const body = req.body;
  if (body.ingredients && body.servings && !body.nutrientsPerServing) {
    if (body.ingredients.some((i) => i.foodItemId)) {
      body.nutrientsPerServing = await calcNutrientsPerServing(body.ingredients, body.servings);
    }
  }

  const recipe = await recipeModel.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    body,
    { new: true, runValidators: true }
  );
  if (!recipe) throw ApiError.notFound("Recipe not found", "RECIPE_NOT_FOUND");
  return sendSuccess(res, recipe);
});

export const deleteRecipe = asyncHandler(async (req, res) => {
  const recipe = await recipeModel.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!recipe) throw ApiError.notFound("Recipe not found", "RECIPE_NOT_FOUND");
  return sendSuccess(res, { id: req.params.id }, 200);
});

// ── Log recipe as a meal ───────────────────────────────────────────────────────

export const logRecipe = asyncHandler(async (req, res) => {
  const recipe = await recipeModel.findOne({ _id: req.params.id, userId: req.user.id });
  if (!recipe) throw ApiError.notFound("Recipe not found", "RECIPE_NOT_FOUND");

  const { servings, eatenWhen, eatenDate } = req.body;
  const factor = servings / recipe.servings;
  const n = recipe.nutrientsPerServing || {};

  await trackingModel.create({
    userId: req.user.id,
    foodName: recipe.title,
    details: {
      calories: Math.round((n.calories || 0) * factor * recipe.servings),
      protein: Math.round((n.protein || 0) * factor * recipe.servings * 10) / 10,
      carbohydrates: Math.round((n.carbs || 0) * factor * recipe.servings * 10) / 10,
      fat: Math.round((n.fat || 0) * factor * recipe.servings * 10) / 10,
      fiber: n.fiber ? Math.round((n.fiber || 0) * factor * recipe.servings * 10) / 10 : undefined,
    },
    quantity: 1,
    servingUnit: `${servings} serving${servings !== 1 ? "s" : ""}`,
    eatenWhen,
    eatenDate: eatenDate ?? new Date().toLocaleDateString("en-CA"),
    source: "custom",
    sourceId: recipe._id.toString(),
  });

  return sendSuccess(res, { logged: true, recipe: recipe.title, servings });
});

// ── Import: URL ────────────────────────────────────────────────────────────────

export const importFromUrl = asyncHandler(async (req, res) => {
  const { url } = req.body;
  let html;
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "NutriTrack/1.0 (recipe-importer)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    html = await response.text();
  } catch (err) {
    throw new ApiError(502, "FETCH_FAILED", `Could not fetch URL: ${err.message}`);
  }

  const recipe = parseSchemaRecipe(html, url);
  if (!recipe) {
    throw new ApiError(422, "NO_RECIPE_SCHEMA", "No schema.org/Recipe data found at this URL. Try importing manually.");
  }

  return sendSuccess(res, recipe);
});

// ── Import: Image (Phase 8 stub) ───────────────────────────────────────────────

export const importFromImage = asyncHandler(async (_req, res) => {
  throw new ApiError(501, "NOT_IMPLEMENTED", "Image import requires the AI service (Phase 8). Coming soon.");
});

// ── Import: YouTube (Phase 8 stub) ────────────────────────────────────────────

export const importFromYoutube = asyncHandler(async (_req, res) => {
  throw new ApiError(501, "NOT_IMPLEMENTED", "YouTube import requires the AI service (Phase 8). Coming soon.");
});
