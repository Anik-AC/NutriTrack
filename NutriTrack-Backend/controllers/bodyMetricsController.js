import { v2 as cloudinary } from "cloudinary";
import { bodyMetricsLogModel, progressPhotoModel } from "../models/index.js";
import { asyncHandler, ApiError, sendSuccess } from "../utils/apiResponse.js";

// ── helpers ────────────────────────────────────────────────────────────────────

// Upload a buffer to Cloudinary (promise wrapper for upload_stream)
function uploadBuffer(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
    stream.end(buffer);
  });
}

// Compute 7-day simple moving average of weight over sorted date-grouped data.
// Input: array of { date (YYYY-MM-DD), avgWeight } sorted ascending.
// Returns: array of { date, value } for entries that have at least one weight data point.
function computeMovingAverage(dailyWeights) {
  const result = [];
  for (let i = 0; i < dailyWeights.length; i++) {
    const window = dailyWeights.slice(Math.max(0, i - 6), i + 1).filter((d) => d.avgWeight != null);
    if (window.length === 0) continue;
    const avg = window.reduce((s, d) => s + d.avgWeight, 0) / window.length;
    result.push({ date: dailyWeights[i].date, value: Math.round(avg * 100) / 100 });
  }
  return result;
}

// ── BODY METRICS LOG ──────────────────────────────────────────────────────────

export const logMetrics = asyncHandler(async (req, res) => {
  const entry = await bodyMetricsLogModel.create({ ...req.body, userId: req.user.id });
  return sendSuccess(res, entry, 201);
});

export const getLatest = asyncHandler(async (req, res) => {
  const entry = await bodyMetricsLogModel
    .findOne({ userId: req.user.id })
    .sort({ date: -1 })
    .lean();
  return sendSuccess(res, entry ?? null);
});

export const getHistory = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.validatedQuery ?? req.query;

  // Fetch 6 extra days before startDate so the MA window is correct for early entries.
  const fetchFrom = new Date(startDate);
  fetchFrom.setUTCDate(fetchFrom.getUTCDate() - 6);

  const endDay = new Date(endDate);
  endDay.setUTCHours(23, 59, 59, 999);

  const allEntries = await bodyMetricsLogModel
    .find({ userId: req.user.id, date: { $gte: fetchFrom, $lte: endDay } })
    .sort({ date: 1 })
    .lean();

  // Entries strictly within the requested range for the response
  const rangeStart = new Date(startDate);
  const inRange = allEntries.filter((e) => e.date >= rangeStart);

  // Build daily averages for MA computation (over the wider window)
  const byDate = {};
  for (const e of allEntries) {
    const key = e.date.toISOString().slice(0, 10);
    if (!byDate[key]) byDate[key] = { sum: 0, count: 0 };
    if (e.weight != null) { byDate[key].sum += e.weight; byDate[key].count++; }
  }
  const dailyWeights = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { sum, count }]) => ({ date, avgWeight: count ? sum / count : null }));

  const weightMovingAverage = computeMovingAverage(dailyWeights).filter(
    (d) => d.date >= startDate.slice(0, 10)
  );

  return sendSuccess(res, { entries: inRange, weightMovingAverage, count: inRange.length });
});

export const updateLog = asyncHandler(async (req, res) => {
  const entry = await bodyMetricsLogModel.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    { $set: req.body },
    { new: true }
  );
  if (!entry) throw new ApiError(404, "METRICS_NOT_FOUND", "Body metrics entry not found");
  return sendSuccess(res, entry);
});

export const deleteLog = asyncHandler(async (req, res) => {
  const entry = await bodyMetricsLogModel.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id,
  });
  if (!entry) throw new ApiError(404, "METRICS_NOT_FOUND", "Body metrics entry not found");
  return sendSuccess(res, { id: entry._id });
});

// ── PROGRESS PHOTOS ───────────────────────────────────────────────────────────

export const uploadPhoto = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "NO_FILE", "No image file provided");

  const result = await uploadBuffer(req.file.buffer, {
    folder: `nutritrack/progress-photos/${req.user.id}`,
    transformation: [{ width: 1200, crop: "limit", quality: "auto:good" }],
    eager: [{ width: 300, height: 300, crop: "fill", quality: 80 }],
  });

  const { date, pose = "front", notes } = req.body;

  const photo = await progressPhotoModel.create({
    userId:       req.user.id,
    imageUrl:     result.secure_url,
    thumbnailUrl: result.eager?.[0]?.secure_url ?? result.secure_url,
    publicId:     result.public_id,
    date:         date ? new Date(date) : new Date(),
    pose,
    notes,
  });

  return sendSuccess(res, photo, 201);
});

export const listPhotos = asyncHandler(async (req, res) => {
  const { page, limit, pose } = req.validatedQuery ?? req.query;
  const pageNum  = Number(page ?? 1);
  const limitNum = Number(limit ?? 20);

  const filter = { userId: req.user.id };
  if (pose) filter.pose = pose;

  const [photos, total] = await Promise.all([
    progressPhotoModel
      .find(filter)
      .sort({ date: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    progressPhotoModel.countDocuments(filter),
  ]);

  return sendSuccess(res, { photos, total, page: pageNum, pages: Math.ceil(total / limitNum) });
});

export const deletePhoto = asyncHandler(async (req, res) => {
  const photo = await progressPhotoModel.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id,
  });
  if (!photo) throw new ApiError(404, "PHOTO_NOT_FOUND", "Progress photo not found");

  // Remove from Cloudinary (best-effort — don't fail if this errors)
  try {
    await cloudinary.uploader.destroy(photo.publicId);
  } catch (_) { /* ignore */ }

  return sendSuccess(res, { id: photo._id });
});
