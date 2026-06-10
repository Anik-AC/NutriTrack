import { USDAProvider } from "./providers/USDAProvider.js";
import { OpenFoodFactsProvider } from "./providers/OpenFoodFactsProvider.js";
import { EdamamProvider } from "./providers/EdamamProvider.js";
import { NutritionixProvider } from "./providers/NutritionixProvider.js";
import { NutritionCache } from "./NutritionCache.js";

function deduplicateBySourceId(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.source}:${item.sourceId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const NutritionService = {
  /**
   * Search for foods. USDA is the primary source; Open Food Facts is queried as
   * a supplemental source when USDA returns fewer than 3 results.
   * Falls back to Nutritionix (deprecated) only when both fail.
   */
  async search(query, page = 1, limit = 20) {
    let results = [];

    const usdaResults = await USDAProvider.search(query, limit);
    results.push(...usdaResults);

    if (usdaResults.length < 3) {
      const offResults = await OpenFoodFactsProvider.search(query, limit);
      results.push(...offResults);
    }

    if (results.length === 0 && NutritionixProvider.available()) {
      console.warn("[NutritionService] DEPRECATED: using Nutritionix fallback for search");
      const nixResults = await NutritionixProvider.search(query);
      results.push(...nixResults);
    }

    results = deduplicateBySourceId(results);

    // Cache new items in the background — don't block the response
    NutritionCache.setMany(results).catch(() => {});

    const start = (page - 1) * limit;
    return results.slice(start, start + limit);
  },

  /**
   * Barcode lookup. Checks the cache first, then Open Food Facts (primary),
   * then USDA branded foods as fallback.
   */
  async barcode(code) {
    const cached = await NutritionCache.getByBarcode(code);
    if (cached) return cached;

    let item = await OpenFoodFactsProvider.barcode(code);
    if (!item) item = await USDAProvider.barcode(code);

    if (item) await NutritionCache.set(item);
    return item;
  },

  /**
   * Natural language food parsing. Edamam is primary; falls back to Nutritionix
   * (deprecated) when Edamam is not configured.
   */
  async parse(text) {
    let results = await EdamamProvider.parse(text);

    if (results.length === 0 && NutritionixProvider.available()) {
      console.warn("[NutritionService] DEPRECATED: using Nutritionix fallback for parse");
      results = await NutritionixProvider.parse(text);
    }

    NutritionCache.setMany(results).catch(() => {});
    return results;
  },

  /**
   * Retrieve a cached food item by its MongoDB _id (returned by search/barcode/parse).
   */
  async getFood(id) {
    return NutritionCache.getById(id);
  },
};
