import mongoose from "mongoose";
import { sleepLogModel, trackingModel } from "../models/index.js";
import { asyncHandler, ApiError, sendSuccess } from "../utils/apiResponse.js";

// ── helpers ────────────────────────────────────────────────────────────────────

function calcDuration(bedtime, wakeTime) {
  return Math.round((new Date(wakeTime) - new Date(bedtime)) / 60000);
}

function computeStdDev(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function bedtimeDecimalHour(date) {
  const d = new Date(date);
  return d.getUTCHours() + d.getUTCMinutes() / 60;
}

function dateKey(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

// ── POST /api/v1/sleep/log ─────────────────────────────────────────────────────

export const logSleep = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { bedtime, wakeTime, quality, notes, factors, source } = req.body;

  const bt = new Date(bedtime);
  const wt = new Date(wakeTime);

  if (wt <= bt) throw new ApiError(400, "INVALID_TIMES", "wakeTime must be after bedtime");

  const durationMinutes = calcDuration(bt, wt);
  if (durationMinutes > 1440) throw new ApiError(400, "INVALID_DURATION", "Sleep duration cannot exceed 24 hours");

  const entry = await sleepLogModel.create({
    userId, bedtime: bt, wakeTime: wt, durationMinutes,
    quality, notes, factors: factors ?? [], source: source ?? "manual",
  });

  return sendSuccess(res, entry, 201);
});

// ── GET /api/v1/sleep/today ────────────────────────────────────────────────────

export const getLatest = asyncHandler(async (req, res) => {
  const entry = await sleepLogModel.findOne({ userId: req.user.id }).sort({ bedtime: -1 }).lean();
  if (!entry) throw new ApiError(404, "SLEEP_LOG_NOT_FOUND", "No sleep entries found");
  return sendSuccess(res, entry);
});

// ── GET /api/v1/sleep/history ─────────────────────────────────────────────────

export const getHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate, page, limit } = req.validatedQuery ?? req.query;

  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setUTCHours(23, 59, 59, 999);

  if (start > end) throw new ApiError(400, "INVALID_RANGE", "startDate must be before endDate");

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  const [entries, total] = await Promise.all([
    sleepLogModel.find({ userId, bedtime: { $gte: start, $lte: end } })
      .sort({ bedtime: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    sleepLogModel.countDocuments({ userId, bedtime: { $gte: start, $lte: end } }),
  ]);

  const avgDuration = entries.length ? entries.reduce((s, e) => s + e.durationMinutes, 0) / entries.length : 0;
  const avgQuality  = entries.length ? entries.reduce((s, e) => s + e.quality, 0) / entries.length : 0;

  return sendSuccess(res, {
    entries,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    averageDurationMinutes: Math.round(avgDuration),
    averageQuality: Math.round(avgQuality * 10) / 10,
  });
});

// ── PUT /api/v1/sleep/log/:id ─────────────────────────────────────────────────

export const updateLog = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const updates = { ...req.body };

  if (updates.bedtime && updates.wakeTime) {
    const bt = new Date(updates.bedtime);
    const wt = new Date(updates.wakeTime);
    if (wt <= bt) throw new ApiError(400, "INVALID_TIMES", "wakeTime must be after bedtime");
    updates.bedtime = bt;
    updates.wakeTime = wt;
    updates.durationMinutes = calcDuration(bt, wt);
  }

  const updated = await sleepLogModel.findOneAndUpdate(
    { _id: id, userId },
    { $set: updates },
    { new: true }
  );
  if (!updated) throw new ApiError(404, "SLEEP_LOG_NOT_FOUND", "Sleep log entry not found");

  return sendSuccess(res, updated);
});

// ── DELETE /api/v1/sleep/log/:id ──────────────────────────────────────────────

export const deleteLog = asyncHandler(async (req, res) => {
  const deleted = await sleepLogModel.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!deleted) throw new ApiError(404, "SLEEP_LOG_NOT_FOUND", "Sleep log entry not found");
  return sendSuccess(res, { id: deleted._id });
});

// ── GET /api/v1/sleep/analysis ────────────────────────────────────────────────

export const getAnalysis = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { period } = req.validatedQuery ?? req.query;
  const days = Number(period);

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  since.setUTCHours(0, 0, 0, 0);

  const [logs, nutritionAgg] = await Promise.all([
    sleepLogModel.find({ userId, bedtime: { $gte: since } }).sort({ bedtime: 1 }).lean(),
    trackingModel.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          eatenDate: { $gte: since.toISOString().split("T")[0] },
        },
      },
      { $group: { _id: "$eatenDate", totalCalories: { $sum: "$details.calories" } } },
    ]),
  ]);

  if (logs.length < 3) {
    return sendSuccess(res, {
      period: days,
      entriesAnalyzed: logs.length,
      message: "Keep logging to see analysis (need at least 3 entries).",
      insights: [],
    });
  }

  const avgDuration   = logs.reduce((s, l) => s + l.durationMinutes, 0) / logs.length;
  const avgQuality    = logs.reduce((s, l) => s + l.quality, 0) / logs.length;
  const bedtimeStdDev = computeStdDev(logs.map(l => bedtimeDecimalHour(l.bedtime)));
  const consistencyScore = Math.round(Math.max(0, 100 - bedtimeStdDev * 20));

  const FACTORS = ["caffeine_late", "exercise", "screen_time", "stress", "alcohol"];
  const insights = [];

  for (const factor of FACTORS) {
    const withFactor    = logs.filter(l => l.factors.includes(factor));
    const withoutFactor = logs.filter(l => !l.factors.includes(factor));
    if (withFactor.length >= 3 && withoutFactor.length >= 3) {
      const avgWith    = withFactor.reduce((s, l) => s + l.quality, 0) / withFactor.length;
      const avgWithout = withoutFactor.reduce((s, l) => s + l.quality, 0) / withoutFactor.length;
      if (Math.abs(avgWith - avgWithout) >= 0.5) {
        const label = factor.replace(/_/g, " ");
        insights.push(
          avgWith < avgWithout
            ? `Your sleep quality averages ${avgWith.toFixed(1)}/5 when you have ${label}, vs ${avgWithout.toFixed(1)}/5 without it.`
            : `${label.charAt(0).toUpperCase() + label.slice(1)} is associated with better sleep quality (${avgWith.toFixed(1)}/5 vs ${avgWithout.toFixed(1)}/5 without).`
        );
      }
    }
  }

  // Nutrition correlation — calories next day after short vs adequate sleep
  if (nutritionAgg.length >= 3) {
    const calByDate = Object.fromEntries(nutritionAgg.map(r => [r._id, r.totalCalories]));
    const nextDayCal = (wakeTime) => calByDate[dateKey(wakeTime)];

    const shortCals = logs.filter(l => l.durationMinutes < 360).map(l => nextDayCal(l.wakeTime)).filter(Boolean);
    const goodCals  = logs.filter(l => l.durationMinutes >= 420).map(l => nextDayCal(l.wakeTime)).filter(Boolean);

    if (shortCals.length >= 3 && goodCals.length >= 3) {
      const avgShort = shortCals.reduce((a, b) => a + b, 0) / shortCals.length;
      const avgGood  = goodCals.reduce((a, b) => a + b, 0) / goodCals.length;
      const pct = Math.round(((avgShort - avgGood) / avgGood) * 100);
      if (Math.abs(pct) >= 5) {
        insights.push(
          `On days after less than 6h of sleep, you eat about ${Math.abs(pct)}% ${pct > 0 ? "more" : "fewer"} calories on average.`
        );
      }
    }
  }

  return sendSuccess(res, {
    period: days,
    entriesAnalyzed: logs.length,
    averageDurationMinutes: Math.round(avgDuration),
    averageDurationHours: parseFloat((avgDuration / 60).toFixed(1)),
    consistencyScore,
    averageQuality: Math.round(avgQuality * 10) / 10,
    insights,
  });
});
