import mongoose from "mongoose";

const { Schema, Types: { ObjectId } } = mongoose;

const measurementsSchema = new Schema(
  {
    chest:      { type: Number, min: 0 },
    waist:      { type: Number, min: 0 },
    hips:       { type: Number, min: 0 },
    bicepLeft:  { type: Number, min: 0 },
    bicepRight: { type: Number, min: 0 },
    thighLeft:  { type: Number, min: 0 },
    thighRight: { type: Number, min: 0 },
    unit:       { type: String, enum: ["cm", "in"], default: "cm" },
  },
  { _id: false }
);

const bodyMetricsLogSchema = new Schema(
  {
    userId:              { type: ObjectId, ref: "users", required: true, index: true },
    date:                { type: Date, default: Date.now },
    weight:              { type: Number, min: 0 },
    weightUnit:          { type: String, enum: ["kg", "lbs"], default: "kg" },
    bodyFatPercentage:   { type: Number, min: 0, max: 100 },
    measurements:        { type: measurementsSchema },
    notes:               { type: String, maxlength: 1000 },
    source:              { type: String, enum: ["manual", "apple_health"], default: "manual" },
  },
  { timestamps: true }
);

bodyMetricsLogSchema.index({ userId: 1, date: -1 });

export default mongoose.model("bodyMetricsLog", bodyMetricsLogSchema);
