import { exerciseService } from "../services/exercise/ExerciseService.js";
import { asyncHandler, ApiError, sendSuccess } from "../utils/apiResponse.js";

export const searchExercises = asyncHandler(async (req, res) => {
  const { q, muscleGroup, equipment, limit } = req.validatedQuery ?? req.query;
  const results = await exerciseService.search({ q, muscleGroup, equipment, limit: Number(limit ?? 20) });
  return sendSuccess(res, { results, count: results.length });
});

export const getExerciseById = asyncHandler(async (req, res) => {
  const exercise = await exerciseService.getById(req.params.id);
  if (!exercise) throw new ApiError(404, "EXERCISE_NOT_FOUND", "Exercise not found");
  return sendSuccess(res, exercise);
});
