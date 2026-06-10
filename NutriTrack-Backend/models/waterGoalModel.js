import mongoose from "mongoose";

const { Schema, model, Types: { ObjectId } } = mongoose;

const waterGoalSchema = new Schema(
  {
    userId:       { type: ObjectId, ref: "users", required: true, unique: true },
    dailyGoalMl: { type: Number, required: true, default: 3000, min: 500, max: 10000 },
  },
  { timestamps: true }
);

export default model("WaterGoal", waterGoalSchema);
