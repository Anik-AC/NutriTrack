import mongoose from "mongoose";

const { Schema, model, Types: { ObjectId } } = mongoose;

const setSchema = new Schema(
  {
    setNumber:   { type: Number, required: true, min: 1 },
    weight:      { type: Number, required: true, min: 0 },
    weightUnit:  { type: String, enum: ["kg", "lbs"], default: "kg" },
    reps:        { type: Number, required: true, min: 0 },
    isWarmup:    { type: Boolean, default: false },
    isPR:        { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { _id: false }
);

const sessionExerciseSchema = new Schema(
  {
    exerciseId:   { type: ObjectId, ref: "Exercise", required: true },
    exerciseName: { type: String, required: true },
    sets:         { type: [setSchema], default: [] },
    notes:        { type: String },
  },
  { _id: false }
);

const workoutSessionSchema = new Schema(
  {
    userId:          { type: ObjectId, ref: "users", required: true },
    templateId:      { type: ObjectId, ref: "WorkoutTemplate" },
    name:            { type: String, required: true, trim: true },
    startedAt:       { type: Date, required: true, default: Date.now },
    completedAt:     { type: Date },
    exercises:       { type: [sessionExerciseSchema], default: [] },
    totalVolume:     { type: Number, default: 0 },
    durationMinutes: { type: Number },
    caloriesBurned:  { type: Number },
    source:          { type: String, enum: ["manual", "apple_health"], default: "manual" },
  },
  { timestamps: true }
);

workoutSessionSchema.index({ userId: 1, startedAt: -1 });
workoutSessionSchema.index({ userId: 1, "exercises.exerciseId": 1 });

export default model("WorkoutSession", workoutSessionSchema);
