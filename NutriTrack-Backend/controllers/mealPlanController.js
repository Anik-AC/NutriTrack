import { mealPlanModel, recipeModel } from "../models/index.js";
import { asyncHandler, ApiError, sendSuccess } from "../utils/apiResponse.js";

// ── helpers ────────────────────────────────────────────────────────────────────

function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
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

function buildGroceryCategories(ingredients) {
  const groups = {};
  for (const item of ingredients) {
    const cat = categorizeIngredient(item.name);
    if (!groups[cat]) groups[cat] = { name: cat, items: [] };
    groups[cat].items.push({
      name: item.name,
      quantity: Math.round(item.quantity * 100) / 100,
      unit: item.unit,
      checked: false,
    });
  }
  return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
}

// ── controllers ────────────────────────────────────────────────────────────────

export const upsertMealPlan = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { weekStart, days } = req.body;

  const plan = await mealPlanModel.findOneAndUpdate(
    { userId, weekStart: new Date(weekStart) },
    { $set: { days } },
    { new: true, upsert: true, runValidators: true }
  );

  return sendSuccess(res, plan, 200);
});

export const getCurrentMealPlan = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const weekStart = getWeekStart();
  const plan = await mealPlanModel.findOne({ userId, weekStart });
  if (!plan) throw ApiError.notFound("No meal plan for current week", "MEAL_PLAN_NOT_FOUND");
  return sendSuccess(res, plan);
});

export const getMealPlanByWeek = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const weekStart = new Date(req.params.weekStart);
  if (isNaN(weekStart.getTime())) throw ApiError.badRequest("Invalid weekStart date");
  const plan = await mealPlanModel.findOne({ userId, weekStart });
  if (!plan) throw ApiError.notFound("No meal plan found for that week", "MEAL_PLAN_NOT_FOUND");
  return sendSuccess(res, plan);
});

export const deleteMealPlan = asyncHandler(async (req, res) => {
  const plan = await mealPlanModel.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!plan) throw ApiError.notFound("Meal plan not found", "MEAL_PLAN_NOT_FOUND");
  return sendSuccess(res, { id: req.params.id });
});

export const generateGroceryList = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const weekStart = getWeekStart();
  const plan = await mealPlanModel.findOne({ userId, weekStart });
  if (!plan) throw ApiError.notFound("No meal plan for current week", "MEAL_PLAN_NOT_FOUND");

  // Collect each recipeId with total servings planned
  const recipeServings = {};
  for (const day of plan.days) {
    for (const meal of day.meals) {
      if (meal.recipeId) {
        const id = meal.recipeId.toString();
        recipeServings[id] = (recipeServings[id] || 0) + meal.servings;
      }
    }
  }

  const recipeIds = Object.keys(recipeServings);
  if (recipeIds.length === 0) {
    return sendSuccess(res, { weekStart, categories: [] });
  }

  const recipes = await recipeModel.find({ _id: { $in: recipeIds }, userId });

  // Aggregate ingredients scaled by portion
  const ingredientMap = {};
  for (const recipe of recipes) {
    const multiplier = recipeServings[recipe._id.toString()] / recipe.servings;
    for (const ing of recipe.ingredients) {
      const key = `${ing.name.toLowerCase()}__${ing.unit.toLowerCase()}`;
      if (!ingredientMap[key]) {
        ingredientMap[key] = { name: ing.name, quantity: 0, unit: ing.unit };
      }
      ingredientMap[key].quantity += ing.quantity * multiplier;
    }
  }

  const categories = buildGroceryCategories(Object.values(ingredientMap));
  return sendSuccess(res, { weekStart, categories });
});
