/**
 * OpenFoodFactsProvider — Open Food Facts (https://world.openfoodfacts.org/).
 * No API key required. Used for barcode lookup (primary) and as fallback search.
 */

const BASE_URL = "https://world.openfoodfacts.org";
const USER_AGENT = "NutriTrack/1.0 (https://nutritrack.onixpace.com)";

function perServing(per100g, servingGrams) {
  if (per100g == null) return undefined;
  return (per100g * servingGrams) / 100;
}

function mapToUnified(product) {
  const n = product.nutriments || {};
  const servingGrams = product.serving_quantity || 100;

  return {
    source: "openfoodfacts",
    sourceId: product.code || product._id,
    name: product.product_name || product.product_name_en || "Unknown",
    brand: product.brands || undefined,
    barcode: product.code || undefined,
    servingSize: servingGrams,
    servingUnit: "g",
    nutrients: {
      calories:
        n["energy-kcal_serving"] ??
        perServing(n["energy-kcal_100g"], servingGrams) ??
        0,
      protein:
        n["proteins_serving"] ??
        perServing(n["proteins_100g"], servingGrams) ??
        0,
      carbs:
        n["carbohydrates_serving"] ??
        perServing(n["carbohydrates_100g"], servingGrams) ??
        0,
      fat:
        n["fat_serving"] ??
        perServing(n["fat_100g"], servingGrams) ??
        0,
      fiber:
        n["fiber_serving"] ??
        perServing(n["fiber_100g"], servingGrams),
      sugar:
        n["sugars_serving"] ??
        perServing(n["sugars_100g"], servingGrams),
      // OFacts stores sodium in g/100g; convert to mg/serving
      sodium:
        n["sodium_serving"] != null
          ? n["sodium_serving"] * 1000
          : n["sodium_100g"] != null
            ? (n["sodium_100g"] * servingGrams / 100) * 1000
            : undefined,
      cholesterol:
        n["cholesterol_serving"] ??
        perServing(n["cholesterol_100g"], servingGrams),
      saturatedFat:
        n["saturated-fat_serving"] ??
        perServing(n["saturated-fat_100g"], servingGrams),
      potassium:
        n["potassium_serving"] ??
        perServing(n["potassium_100g"], servingGrams),
      vitaminA:
        n["vitamin-a_serving"] ??
        perServing(n["vitamin-a_100g"], servingGrams),
      vitaminC:
        n["vitamin-c_serving"] ??
        perServing(n["vitamin-c_100g"], servingGrams),
      vitaminD:
        n["vitamin-d_serving"] ??
        perServing(n["vitamin-d_100g"], servingGrams),
      calcium:
        n["calcium_serving"] ??
        perServing(n["calcium_100g"], servingGrams),
      iron:
        n["iron_serving"] ??
        perServing(n["iron_100g"], servingGrams),
    },
  };
}

export const OpenFoodFactsProvider = {
  available() {
    return true; // No key required
  },

  async search(query, pageSize = 20) {
    try {
      const url =
        `${BASE_URL}/cgi/search.pl?action=process` +
        `&search_terms=${encodeURIComponent(query)}` +
        `&json=true&page_size=${pageSize}` +
        `&fields=product_name,product_name_en,brands,code,nutriments,serving_quantity,serving_size`;
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.products || [])
        .filter((p) => p.product_name || p.product_name_en)
        .map(mapToUnified);
    } catch {
      return [];
    }
  },

  async barcode(code) {
    try {
      const url = `${BASE_URL}/api/v0/product/${code}.json`;
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.status !== 1 || !data.product) return null;
      return mapToUnified(data.product);
    } catch {
      return null;
    }
  },
};
