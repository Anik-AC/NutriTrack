import mongoose from "mongoose";

const nutrientSchema = new mongoose.Schema(
  {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    fiber: { type: Number },
    sugar: { type: Number },
    sodium: { type: Number },
    cholesterol: { type: Number },
    saturatedFat: { type: Number },
    potassium: { type: Number },
    vitaminA: { type: Number },
    vitaminC: { type: Number },
    vitaminD: { type: Number },
    calcium: { type: Number },
    iron: { type: Number },
  },
  { _id: false }
);

const nutritionCacheSchema = new mongoose.Schema({
  source: {
    type: String,
    enum: ["usda", "openfoodfacts", "edamam", "nutritionix", "custom"],
    required: true,
  },
  sourceId: { type: String, required: true },
  name: { type: String, required: true },
  brand: { type: String },
  barcode: { type: String },
  servingSize: { type: Number, required: true },
  servingUnit: { type: String, required: true },
  nutrients: { type: nutrientSchema, required: true },
  cachedAt: { type: Date, default: Date.now },
});

// 30-day TTL
nutritionCacheSchema.index({ cachedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
// Fast cache hit by source+sourceId
nutritionCacheSchema.index({ source: 1, sourceId: 1 }, { unique: true });
// Barcode lookup
nutritionCacheSchema.index({ barcode: 1 }, { sparse: true });

const nutritionCacheModel = mongoose.model("nutritionCache", nutritionCacheSchema);
export default nutritionCacheModel;
