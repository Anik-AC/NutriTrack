import { NutritionService } from "../services/nutrition/NutritionService.js";
import { asyncHandler, ApiError, sendSuccess } from "../utils/apiResponse.js";

export const searchFoods = asyncHandler(async (req, res) => {
  // req.validatedQuery is set by validate() when req.query is read-only
  const q = (req.validatedQuery || req.query).q;
  const page = Number((req.validatedQuery || req.query).page) || 1;
  const limit = Number((req.validatedQuery || req.query).limit) || 20;

  if (!q || !q.trim()) throw ApiError.badRequest("Query parameter 'q' is required");

  const results = await NutritionService.search(q.trim(), page, Math.min(limit, 50));
  sendSuccess(res, { results, count: results.length, page });
});

export const lookupBarcode = asyncHandler(async (req, res) => {
  const { code } = req.params;
  const item = await NutritionService.barcode(code);
  if (!item) throw ApiError.notFound("No food found for this barcode", "BARCODE_NOT_FOUND");
  sendSuccess(res, item);
});

export const parseNaturalLanguage = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) throw ApiError.badRequest("Field 'text' is required");

  const results = await NutritionService.parse(text.trim());
  if (results.length === 0) {
    throw ApiError.notFound(
      "No foods could be parsed from the given text",
      "PARSE_NO_RESULTS"
    );
  }
  sendSuccess(res, { results, count: results.length });
});

export const getFoodById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await NutritionService.getFood(id);
  if (!item) throw ApiError.notFound("Food item not found in cache", "FOOD_NOT_FOUND");
  sendSuccess(res, item);
});
