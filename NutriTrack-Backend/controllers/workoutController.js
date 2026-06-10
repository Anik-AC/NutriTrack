import mongoose from "mongoose";
import { workoutTemplateModel, workoutSessionModel } from "../models/index.js";
import { asyncHandler, ApiError, sendSuccess } from "../utils/apiResponse.js";

// ── helpers ────────────────────────────────────────────────────────────────────

function calcVolume(exercises = []) {
  return exercises.reduce(
    (total, ex) =>
      total +
      ex.sets
        .filter((s) => !s.isWarmup)
        .reduce((sum, s) => sum + s.weight * s.reps, 0),
    0
  );
}

async function detectPRs(userId, excludeSessionId, exercises) {
  const prevData = await workoutSessionModel.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        completedAt: { $ne: null },
        _id: { $ne: new mongoose.Types.ObjectId(excludeSessionId) },
      },
    },
    { $unwind: "$exercises" },
    { $unwind: "$exercises.sets" },
    { $match: { "exercises.sets.isWarmup": false } },
    {
      $group: {
        _id: { exerciseId: "$exercises.exerciseId", reps: "$exercises.sets.reps" },
        maxWeight: { $max: "$exercises.sets.weight" },
      },
    },
  ]);

  const prMap = {};
  for (const row of prevData) {
    prMap[`${row._id.exerciseId}:${row._id.reps}`] = row.maxWeight;
  }

  return exercises.map((ex) => ({
    ...ex,
    sets: ex.sets.map((set) => {
      if (set.isWarmup) return set;
      const prevMax = prMap[`${ex.exerciseId}:${set.reps}`] ?? 0;
      return { ...set, isPR: set.weight > prevMax };
    }),
  }));
}

// ── TEMPLATES ─────────────────────────────────────────────────────────────────

export const createTemplate = asyncHandler(async (req, res) => {
  const template = await workoutTemplateModel.create({ ...req.body, userId: req.user.id });
  return sendSuccess(res, template, 201);
});

export const listTemplates = asyncHandler(async (req, res) => {
  const templates = await workoutTemplateModel
    .find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .lean();
  return sendSuccess(res, { templates, count: templates.length });
});

export const updateTemplate = asyncHandler(async (req, res) => {
  const updated = await workoutTemplateModel.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { $set: req.body },
    { new: true }
  );
  if (!updated) throw new ApiError(404, "TEMPLATE_NOT_FOUND", "Workout template not found");
  return sendSuccess(res, updated);
});

export const deleteTemplate = asyncHandler(async (req, res) => {
  const deleted = await workoutTemplateModel.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id,
  });
  if (!deleted) throw new ApiError(404, "TEMPLATE_NOT_FOUND", "Workout template not found");
  return sendSuccess(res, { id: deleted._id });
});

// ── SESSIONS ──────────────────────────────────────────────────────────────────

export const createSession = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { name, templateId, startedAt, completedAt, exercises = [], caloriesBurned, source } = req.body;

  const startTime = startedAt ? new Date(startedAt) : new Date();
  const endTime = completedAt ? new Date(completedAt) : null;
  const totalVolume = calcVolume(exercises);
  const durationMinutes = endTime ? Math.round((endTime - startTime) / 60000) : undefined;

  const session = await workoutSessionModel.create({
    userId, name, templateId, startedAt: startTime,
    completedAt: endTime, exercises, totalVolume, durationMinutes,
    caloriesBurned, source: source ?? "manual",
  });

  if (endTime) {
    const withPRs = await detectPRs(userId, session._id, exercises);
    await workoutSessionModel.updateOne({ _id: session._id }, { $set: { exercises: withPRs } });
    session.exercises = withPRs;
  }

  return sendSuccess(res, session, 201);
});

export const updateSession = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const existing = await workoutSessionModel.findOne({ _id: id, userId }).lean();
  if (!existing) throw new ApiError(404, "SESSION_NOT_FOUND", "Workout session not found");

  const updates = { ...req.body };

  if (updates.exercises) {
    updates.totalVolume = calcVolume(updates.exercises);
  }
  if (updates.completedAt) {
    const startTime = updates.startedAt ? new Date(updates.startedAt) : existing.startedAt;
    updates.durationMinutes = Math.round((new Date(updates.completedAt) - startTime) / 60000);
  }

  const updated = await workoutSessionModel.findOneAndUpdate(
    { _id: id, userId },
    { $set: updates },
    { new: true }
  );

  // Run PR detection when session transitions from incomplete → complete
  if (updates.completedAt && !existing.completedAt) {
    const exercisesForPR = updates.exercises ?? updated.exercises;
    const withPRs = await detectPRs(userId, id, exercisesForPR);
    await workoutSessionModel.updateOne({ _id: id }, { $set: { exercises: withPRs } });
    updated.exercises = withPRs;
  }

  return sendSuccess(res, updated);
});

export const listSessions = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate, page, limit } = req.validatedQuery ?? req.query;
  const pageNum = Number(page ?? 1);
  const limitNum = Number(limit ?? 20);

  const filter = { userId };
  if (startDate || endDate) {
    filter.startedAt = {};
    if (startDate) filter.startedAt.$gte = new Date(startDate);
    if (endDate) {
      const e = new Date(endDate);
      e.setUTCHours(23, 59, 59, 999);
      filter.startedAt.$lte = e;
    }
  }

  const [sessions, total] = await Promise.all([
    workoutSessionModel
      .find(filter)
      .sort({ startedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    workoutSessionModel.countDocuments(filter),
  ]);

  return sendSuccess(res, { sessions, total, page: pageNum, pages: Math.ceil(total / limitNum) });
});

export const getSession = asyncHandler(async (req, res) => {
  const session = await workoutSessionModel
    .findOne({ _id: req.params.id, userId: req.user.id })
    .lean();
  if (!session) throw new ApiError(404, "SESSION_NOT_FOUND", "Workout session not found");
  return sendSuccess(res, session);
});

// ── STATS ─────────────────────────────────────────────────────────────────────

export const getStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { period } = req.validatedQuery ?? req.query;
  const days = Number(period ?? 30);

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  since.setUTCHours(0, 0, 0, 0);

  const [sessions, prsAgg] = await Promise.all([
    workoutSessionModel
      .find({ userId, startedAt: { $gte: since }, completedAt: { $ne: null } })
      .lean(),
    workoutSessionModel.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          startedAt: { $gte: since },
          completedAt: { $ne: null },
        },
      },
      { $unwind: "$exercises" },
      { $unwind: "$exercises.sets" },
      { $match: { "exercises.sets.isPR": true } },
      {
        $group: {
          _id: "$exercises.exerciseId",
          exerciseName: { $first: "$exercises.exerciseName" },
          bestWeight:   { $max: "$exercises.sets.weight" },
          achievedAt:   { $max: "$startedAt" },
        },
      },
    ]),
  ]);

  const totalVolume  = sessions.reduce((s, sess) => s + (sess.totalVolume ?? 0), 0);
  const avgDuration  = sessions.length
    ? sessions.reduce((s, sess) => s + (sess.durationMinutes ?? 0), 0) / sessions.length
    : 0;

  return sendSuccess(res, {
    period: days,
    totalSessions: sessions.length,
    totalVolume: Math.round(totalVolume),
    averageDurationMinutes: Math.round(avgDuration),
    prsAchieved: prsAgg.map((p) => ({
      exerciseId:   p._id,
      exerciseName: p.exerciseName,
      bestWeight:   p.bestWeight,
      achievedAt:   p.achievedAt,
    })),
  });
});

// ── EXERCISE HISTORY ──────────────────────────────────────────────────────────

export const getExerciseHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { exerciseId } = req.params;

  const sessions = await workoutSessionModel
    .find({
      userId,
      completedAt: { $ne: null },
      "exercises.exerciseId": exerciseId,
    })
    .sort({ completedAt: 1 })
    .lean();

  const history = sessions.map((sess) => {
    const ex = sess.exercises.find((e) => e.exerciseId.toString() === exerciseId);
    return {
      date:        sess.completedAt ?? sess.startedAt,
      sessionId:   sess._id,
      sessionName: sess.name,
      sets:        ex.sets,
      totalVolume: ex.sets.reduce((s, set) => s + set.weight * set.reps, 0),
      hasPR:       ex.sets.some((s) => s.isPR),
    };
  });

  return sendSuccess(res, { exerciseId, history, count: history.length });
});
