/**
 * EdamamProvider — Edamam Food Database API (https://developer.edamam.com/).
 * Free tier available. Requires app_id + app_key.
 * TODO: register at https://developer.edamam.com/ (Food Database API) and set
 *       NUTRITION_EDAMAM_APP_ID and NUTRITION_EDAMAM_APP_KEY in .env
 *
 * Used for: natural language parsing (POST /nutrition/parse).
 */

const APP_ID = process.env.NUTRITION_EDAMAM_APP_ID;
const APP_KEY = process.env.NUTRITION_EDAMAM_APP_KEY;
const BASE_URL = "https://api.edamam.com/api/food-database/v2";

// Edamam nutrient keys (per 100g in the `nutrients` field)
const NK = {
  calories: "ENERC_KCAL",
  protein: "PROCNT",
  carbs: "CHOCDF",
  fat: "FAT",
  fiber: "FIBTG",
  sugar: "SUGAR",
  sodium: "NA",
  cholesterol: "CHOLE",
  saturatedFat: "FASAT",
  potassium: "K",
  vitaminA: "VITA_RAE",
  vitaminC: "VITC",
  vitaminD: "VITD",
  calcium: "CA",
  iron: "FE",
};

function mapToUnified(food, measure) {
  const n = food.nutrients || {};
  // Edamam nutrients are per 100g; scale to serving weight
  const servingWeight = measure?.weight ?? 100;
  const scale = servingWeight / 100;

  return {
    source: "edamam",
    sourceId: food.foodId,
    name: food.label,
    brand: food.brand || undefined,
    servingSize: servingWeight,
    servingUnit: measure?.label ?? "g",
    nutrients: {
      calories: (n[NK.calories] ?? 0) * scale,
      protein: (n[NK.protein] ?? 0) * scale,
      carbs: (n[NK.carbs] ?? 0) * scale,
      fat: (n[NK.fat] ?? 0) * scale,
      fiber: n[NK.fiber] != null ? n[NK.fiber] * scale : undefined,
      sugar: n[NK.sugar] != null ? n[NK.sugar] * scale : undefined,
      sodium: n[NK.sodium] != null ? n[NK.sodium] * scale : undefined,
      cholesterol: n[NK.cholesterol] != null ? n[NK.cholesterol] * scale : undefined,
      saturatedFat: n[NK.saturatedFat] != null ? n[NK.saturatedFat] * scale : undefined,
      potassium: n[NK.potassium] != null ? n[NK.potassium] * scale : undefined,
      vitaminA: n[NK.vitaminA] != null ? n[NK.vitaminA] * scale : undefined,
      vitaminC: n[NK.vitaminC] != null ? n[NK.vitaminC] * scale : undefined,
      vitaminD: n[NK.vitaminD] != null ? n[NK.vitaminD] * scale : undefined,
      calcium: n[NK.calcium] != null ? n[NK.calcium] * scale : undefined,
      iron: n[NK.iron] != null ? n[NK.iron] * scale : undefined,
    },
  };
}

export const EdamamProvider = {
  available() {
    if (!APP_ID || !APP_KEY) {
      console.warn(
        "[EdamamProvider] NUTRITION_EDAMAM_APP_ID / NUTRITION_EDAMAM_APP_KEY not set — provider disabled. " +
        "TODO: register at https://developer.edamam.com/ and set keys in .env"
      );
      return false;
    }
    return true;
  },

  async parse(text) {
    if (!this.available()) return [];
    try {
      const lines = text
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const results = [];
      for (const ingr of lines) {
        const url =
          `${BASE_URL}/parser?app_id=${APP_ID}&app_key=${APP_KEY}` +
          `&ingr=${encodeURIComponent(ingr)}&nutrition-type=logging`;
        const res = await fetch(url);
        if (!res.ok) continue;
        const data = await res.json();

        if (data.parsed && data.parsed.length > 0) {
          const p = data.parsed[0];
          results.push(mapToUnified(p.food, p.measure));
        } else if (data.hints && data.hints.length > 0) {
          const h = data.hints[0];
          results.push(mapToUnified(h.food, h.measures?.[0]));
        }
      }
      return results;
    } catch {
      return [];
    }
  },

  async search(query, pageSize = 20) {
    if (!this.available()) return [];
    try {
      const url =
        `${BASE_URL}/parser?app_id=${APP_ID}&app_key=${APP_KEY}` +
        `&ingr=${encodeURIComponent(query)}&nutrition-type=logging`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.hints || [])
        .slice(0, pageSize)
        .map((h) => mapToUnified(h.food, h.measures?.[0]));
    } catch {
      return [];
    }
  },
};
