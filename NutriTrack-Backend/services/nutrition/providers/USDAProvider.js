/**
 * USDAProvider — USDA FoodData Central (https://fdc.nal.usda.gov/).
 * Free API key from https://api.data.gov/signup/ (env: NUTRITION_USDA_API_KEY).
 * TODO: obtain free API key from https://api.data.gov/signup/ and set NUTRITION_USDA_API_KEY in .env
 */

const API_KEY = process.env.NUTRITION_USDA_API_KEY;
const BASE_URL = "https://api.nal.usda.gov/fdc/v1";

// FDC nutrient IDs for the fields we care about
const NID = {
  calories: 1008,
  protein: 1003,
  carbs: 1005,
  fat: 1004,
  fiber: 1079,
  sugar: 2000,
  sodium: 1093,
  cholesterol: 1253,
  saturatedFat: 1258,
  potassium: 1092,
  vitaminA: 1106,
  vitaminC: 1162,
  vitaminD: 1114,
  calcium: 1087,
  iron: 1089,
};

function extractNutrient(foodNutrients, id) {
  const n = (foodNutrients || []).find(
    (n) => n.nutrientId === id || Number(n.nutrientNumber) === id
  );
  return n?.value ?? undefined;
}

function mapToUnified(food) {
  return {
    source: "usda",
    sourceId: String(food.fdcId),
    name: food.description,
    brand: food.brandOwner || food.brandName || undefined,
    barcode: food.gtinUpc || undefined,
    servingSize: food.servingSize ?? 100,
    servingUnit: food.servingSizeUnit ?? "g",
    nutrients: {
      calories: extractNutrient(food.foodNutrients, NID.calories) ?? 0,
      protein: extractNutrient(food.foodNutrients, NID.protein) ?? 0,
      carbs: extractNutrient(food.foodNutrients, NID.carbs) ?? 0,
      fat: extractNutrient(food.foodNutrients, NID.fat) ?? 0,
      fiber: extractNutrient(food.foodNutrients, NID.fiber),
      sugar: extractNutrient(food.foodNutrients, NID.sugar),
      sodium: extractNutrient(food.foodNutrients, NID.sodium),
      cholesterol: extractNutrient(food.foodNutrients, NID.cholesterol),
      saturatedFat: extractNutrient(food.foodNutrients, NID.saturatedFat),
      potassium: extractNutrient(food.foodNutrients, NID.potassium),
      vitaminA: extractNutrient(food.foodNutrients, NID.vitaminA),
      vitaminC: extractNutrient(food.foodNutrients, NID.vitaminC),
      vitaminD: extractNutrient(food.foodNutrients, NID.vitaminD),
      calcium: extractNutrient(food.foodNutrients, NID.calcium),
      iron: extractNutrient(food.foodNutrients, NID.iron),
    },
  };
}

export const USDAProvider = {
  available() {
    if (!API_KEY) {
      console.warn(
        "[USDAProvider] NUTRITION_USDA_API_KEY not set — provider disabled. " +
        "TODO: get a free key at https://api.data.gov/signup/ and add NUTRITION_USDA_API_KEY to .env"
      );
      return false;
    }
    return true;
  },

  async search(query, pageSize = 20) {
    if (!this.available()) return [];
    try {
      const url =
        `${BASE_URL}/foods/search?query=${encodeURIComponent(query)}` +
        `&pageSize=${pageSize}&api_key=${API_KEY}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.foods || []).map(mapToUnified);
    } catch {
      return [];
    }
  },

  async barcode(code) {
    if (!this.available()) return null;
    try {
      const url =
        `${BASE_URL}/foods/search?query=${encodeURIComponent(code)}` +
        `&dataType=Branded&pageSize=10&api_key=${API_KEY}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      const match = (data.foods || []).find((f) => f.gtinUpc === code);
      return match ? mapToUnified(match) : null;
    } catch {
      return null;
    }
  },
};
