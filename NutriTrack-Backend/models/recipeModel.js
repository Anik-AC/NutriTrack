import mongoose from "mongoose";

const ingredientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    foodItemId: { type: String },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true },
    notes: { type: String },
    nutrients: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      fiber: Number,
    },
  },
  { _id: false }
);

const nutrientsSchema = new mongoose.Schema(
  {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    sugar: Number,
    sodium: Number,
    cholesterol: Number,
    saturatedFat: Number,
    potassium: Number,
    vitaminA: Number,
    vitaminC: Number,
    vitaminD: Number,
    calcium: Number,
    iron: Number,
  },
  { _id: false }
);

const recipeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    coverImage: { type: String },
    tags: { type: [String], default: [] },
    servings: { type: Number, required: true, min: 1 },
    prepTime: { type: Number, min: 0 },
    cookTime: { type: Number, min: 0 },
    ingredients: { type: [ingredientSchema], default: [] },
    instructions: { type: [String], default: [] },
    nutrientsPerServing: { type: nutrientsSchema },
    source: {
      type: String,
      enum: ["manual", "url_import", "image_import", "youtube_import", "ai_generated"],
      default: "manual",
    },
    sourceUrl: { type: String },
    rating: { type: Number, min: 1, max: 5 },
    isFavorite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

recipeSchema.index({ userId: 1, createdAt: -1 });
recipeSchema.index({ userId: 1, tags: 1 });

const recipeModel = mongoose.model("Recipe", recipeSchema);
export default recipeModel;
