import mongoose from "mongoose";

const { Schema, model, Types: { ObjectId } } = mongoose;

const waterLogSchema = new Schema(
  {
    userId:   { type: ObjectId, ref: "users", required: true, index: true },
    amount:   { type: Number, required: true, min: 1, max: 10000 }, // ml
    loggedAt: { type: Date, default: Date.now },
    source:   { type: String, enum: ["manual", "quick_add", "apple_health"], default: "manual" },
  },
  { timestamps: true }
);

waterLogSchema.index({ userId: 1, loggedAt: -1 });

export default model("WaterLog", waterLogSchema);
