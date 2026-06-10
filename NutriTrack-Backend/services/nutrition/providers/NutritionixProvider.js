/**
 * NutritionixProvider — wraps the existing Nutritionix API keys as a deprecated
 * fallback. Used only when primary providers (USDA / OFacts / Edamam) fail.
 * Keys come from the same env vars used by the frontend (VITE_NUTRITIONIX_*).
 */

const APP_ID = process.env.VITE_NUTRITIONIX_APP_ID;
const APP_KEY = process.env.VITE_NUTRITIONIX_API_KEY;
const BASE_URL = "https://trackapi.nutritionix.com/v2";

function mapToUnified(food) {
  return {
    source: "nutritionix",
    sourceId: food.nix_item_id || food.tag_id || food.food_name,
    name: food.food_name,
    brand: food.brand_name || undefined,
    barcode: food.upc || undefined,
    servingSize: food.serving_qty ?? 1,
    servingUnit: food.serving_unit ?? "serving",
    nutrients: {
      calories: food.nf_calories ?? 0,
      protein: food.nf_protein ?? 0,
      carbs: food.nf_total_carbohydrate ?? 0,
      fat: food.nf_total_fat ?? 0,
      fiber: food.nf_dietary_fiber,
      sugar: food.nf_sugars,
      sodium: food.nf_sodium,
      cholesterol: food.nf_cholesterol,
      saturatedFat: food.nf_saturated_fat,
      potassium: food.nf_potassium,
    },
  };
}

export const NutritionixProvider = {
  available() {
    return !!(APP_ID && APP_KEY);
  },

  async search(query) {
    if (!this.available()) return [];
    try {
      const res = await fetch(`${BASE_URL}/search/instant`, {
        method: "POST",
        headers: {
          "x-app-id": APP_ID,
          "x-app-key": APP_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return [...(data.common || []), ...(data.branded || [])].map(mapToUnified);
    } catch {
      return [];
    }
  },

  async parse(text) {
    if (!this.available()) return [];
    try {
      const res = await fetch(`${BASE_URL}/natural/nutrients`, {
        method: "POST",
        headers: {
          "x-app-id": APP_ID,
          "x-app-key": APP_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: text }),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.foods || []).map(mapToUnified);
    } catch {
      return [];
    }
  },
};
