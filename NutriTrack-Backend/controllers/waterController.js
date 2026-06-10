import mongoose from "mongoose";
import { waterLogModel, waterGoalModel } from "../models/index.js";
import { asyncHandler, ApiError, sendSuccess } from "../utils/apiResponse.js";

const DEFAULT_GOAL_ML = 3000;

function todayBounds() {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
}

async function getTodayTotals(userId, goalDoc) {
  const { start, end } = todayBounds();
  const logs = await waterLogModel
    .find({ userId, loggedAt: { $gte: start, $lte: end } })
    .sort({ loggedAt: 1 })
    .lean();
  const total = logs.reduce((sum, l) => sum + l.amount, 0);
  const goal = goalDoc?.dailyGoalMl ?? DEFAULT_GOAL_ML;
  return { total, goal, percentage: Math.min(100, Math.round((total / goal) * 100)), logs };
}

// POST /api/v1/water/log
export const logWater = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { amount, loggedAt, source } = req.body;

  const entry = await waterLogModel.create({
    userId,
    amount,
    loggedAt: loggedAt ? new Date(loggedAt) : new Date(),
    source: source ?? "manual",
  });

  const goalDoc = await waterGoalModel.findOne({ userId }).lean();
  const today = await getTodayTotals(userId, goalDoc);

  return sendSuccess(res, { log: entry, today }, 201);
});

// GET /api/v1/water/today
export const getToday = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const goalDoc = await waterGoalModel.findOne({ userId }).lean();
  const today = await getTodayTotals(userId, goalDoc);
  return sendSuccess(res, today);
});

// GET /api/v1/water/history
export const getHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate } = req.validatedQuery ?? req.query;

  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setUTCHours(23, 59, 59, 999);

  if (start > end) throw new ApiError(400, "INVALID_RANGE", "startDate must be before endDate");

  const [dailyTotals, goalDoc] = await Promise.all([
    waterLogModel.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          loggedAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$loggedAt" } },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    waterGoalModel.findOne({ userId }).lean(),
  ]);

  const goal = goalDoc?.dailyGoalMl ?? DEFAULT_GOAL_ML;
  const days = dailyTotals.map((d) => ({
    date: d._id,
    total: d.total,
    count: d.count,
    goal,
    percentage: Math.min(100, Math.round((d.total / goal) * 100)),
  }));

  return sendSuccess(res, { goal, days });
});

// PUT /api/v1/water/goal
export const setGoal = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { dailyGoalMl } = req.body;

  const goalDoc = await waterGoalModel.findOneAndUpdate(
    { userId },
    { $set: { dailyGoalMl } },
    { upsert: true, new: true }
  );

  return sendSuccess(res, { dailyGoalMl: goalDoc.dailyGoalMl });
});

// DELETE /api/v1/water/log/:id
export const deleteLog = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const deleted = await waterLogModel.findOneAndDelete({ _id: id, userId });
  if (!deleted) throw new ApiError(404, "WATER_LOG_NOT_FOUND", "Water log entry not found");

  return sendSuccess(res, { id: deleted._id });
});
