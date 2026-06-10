import mongoose from "mongoose";

const mealEntrySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner", "evening_snack"],
      required: true,
    },
    recipeId: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe" },
    servings: { type: Number, required: true, min: 0.25, default: 1 },
  },
  { _id: false }
);

const dayPlanSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    meals: { type: [mealEntrySchema], default: [] },
    targetCalories: { type: Number },
    targetProtein: { type: Number },
    targetCarbs: { type: Number },
    targetFat: { type: Number },
  },
  { _id: false }
);

const mealPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    weekStart: { type: Date, required: true },
    days: { type: [dayPlanSchema], default: [] },
  },
  { timestamps: true }
);

mealPlanSchema.index({ userId: 1, weekStart: -1 });
mealPlanSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

const mealPlanModel = mongoose.model("MealPlan", mealPlanSchema);
export default mealPlanModel;
