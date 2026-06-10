import mongoose from "mongoose";

const { Schema, model } = mongoose;

const exerciseSchema = new Schema(
  {
    source:           { type: String, enum: ["wger", "custom"], default: "wger" },
    sourceId:         { type: String, required: true },
    name:             { type: String, required: true, trim: true },
    muscleGroup:      { type: String, enum: ["chest","back","legs","shoulders","arms","core","cardio","other"], required: true },
    secondaryMuscles: { type: [String], default: [] },
    equipment:        { type: String, enum: ["barbell","dumbbell","machine","bodyweight","cable","band","other"], default: "other" },
    instructions:     { type: [String], default: [] },
    imageUrl:         { type: String },
    gifUrl:           { type: String },
    cachedAt:         { type: Date, default: Date.now },
  },
  { timestamps: true }
);

exerciseSchema.index({ source: 1, sourceId: 1 }, { unique: true });
exerciseSchema.index({ name: "text" });
exerciseSchema.index({ muscleGroup: 1, equipment: 1 });

export default model("Exercise", exerciseSchema);
