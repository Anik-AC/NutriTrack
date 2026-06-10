import mongoose from "mongoose";

const { Schema, model, Types: { ObjectId } } = mongoose;

const templateExerciseSchema = new Schema(
  {
    exerciseId:   { type: ObjectId, ref: "Exercise", required: true },
    targetSets:   { type: Number, required: true, min: 1, max: 20 },
    targetReps:   { type: String, required: true },
    targetWeight: { type: Number },
    restSeconds:  { type: Number, default: 90 },
    notes:        { type: String },
    order:        { type: Number, required: true },
  },
  { _id: false }
);

const workoutTemplateSchema = new Schema(
  {
    userId:            { type: ObjectId, ref: "users", required: true },
    name:              { type: String, required: true, trim: true },
    exercises:         { type: [templateExerciseSchema], default: [] },
    estimatedDuration: { type: Number },
    tags:              { type: [String], default: [] },
  },
  { timestamps: true }
);

workoutTemplateSchema.index({ userId: 1, createdAt: -1 });

export default model("WorkoutTemplate", workoutTemplateSchema);
