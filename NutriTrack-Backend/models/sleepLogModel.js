import mongoose from "mongoose";

const { Schema, model, Types: { ObjectId } } = mongoose;

const VALID_FACTORS = ["caffeine_late", "exercise", "screen_time", "stress", "alcohol"];

const sleepLogSchema = new Schema(
  {
    userId:          { type: ObjectId, ref: "users", required: true },
    bedtime:         { type: Date, required: true },
    wakeTime:        { type: Date, required: true },
    durationMinutes: { type: Number, required: true, min: 0 },
    quality:         { type: Number, required: true, min: 1, max: 5 },
    notes:           { type: String, maxlength: 1000 },
    factors:         { type: [String], enum: VALID_FACTORS, default: [] },
    source:          { type: String, enum: ["manual", "apple_health"], default: "manual" },
  },
  { timestamps: true }
);

sleepLogSchema.index({ userId: 1, bedtime: -1 });

export default model("SleepLog", sleepLogSchema);
