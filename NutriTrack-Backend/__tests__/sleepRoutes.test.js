/**
 * Sleep Tracker API — integration tests.
 *
 * Real controller + middleware logic; Mongoose model methods mocked so no
 * MongoMemoryServer is needed.
 */

import request from "supertest";
import express from "express";
import sleepRouter from "../routes/sleepRoutes.js";
import { notFoundHandler, errorHandler } from "../middleware/errorHandler.js";

// ── module mocks ────────────────────────────────────────────────────────────────

jest.mock("../middleware/authMiddleware.js", () => ({
  authMiddleware: jest.fn((req, _res, next) => {
    req.user = { id: "649c72b17b3b4f001234abcd", role: "customer" };
    next();
  }),
}));

jest.mock("../models/index.js", () => ({
  sleepLogModel: {
    create:           jest.fn(),
    findOne:          jest.fn(),
    find:             jest.fn(),
    countDocuments:   jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
  },
  trackingModel: {
    aggregate: jest.fn(),
  },
}));

// ── app setup ──────────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());
app.use("/api/v1/sleep", sleepRouter);
app.use(notFoundHandler);
app.use(errorHandler);

// ── mock data ──────────────────────────────────────────────────────────────────

const BEDTIME   = "2026-06-09T22:00:00.000Z";
const WAKE_TIME = "2026-06-10T06:30:00.000Z";
const DURATION  = Math.round((new Date(WAKE_TIME) - new Date(BEDTIME)) / 60000); // 510 min

const MOCK_LOG = {
  _id:             "sleep001",
  userId:          "649c72b17b3b4f001234abcd",
  bedtime:         BEDTIME,
  wakeTime:        WAKE_TIME,
  durationMinutes: DURATION,
  quality:         4,
  notes:           "Good night",
  factors:         ["exercise"],
  source:          "manual",
};

// ── helpers ────────────────────────────────────────────────────────────────────

const mockFindChain = (results) => {
  const chain = { sort: jest.fn(), skip: jest.fn(), limit: jest.fn(), lean: jest.fn() };
  chain.sort.mockReturnValue(chain);
  chain.skip.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  chain.lean.mockResolvedValue(results);
  return chain;
};

const mockFindOneChain = (result) => {
  const chain = { sort: jest.fn(), lean: jest.fn() };
  chain.sort.mockReturnValue(chain);
  chain.lean.mockResolvedValue(result);
  return chain;
};

let sleepLogModel, trackingModel;

beforeEach(async () => {
  jest.clearAllMocks();
  const models = await import("../models/index.js");
  sleepLogModel  = models.sleepLogModel;
  trackingModel  = models.trackingModel;
});

// ── POST /api/v1/sleep/log ─────────────────────────────────────────────────────

describe("POST /api/v1/sleep/log", () => {
  it("creates a log entry and returns 201 with durationMinutes", async () => {
    sleepLogModel.create.mockResolvedValue(MOCK_LOG);

    const res = await request(app).post("/api/v1/sleep/log").send({
      bedtime: BEDTIME, wakeTime: WAKE_TIME, quality: 4, factors: ["exercise"],
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.durationMinutes).toBe(DURATION);
    expect(sleepLogModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ quality: 4, durationMinutes: DURATION })
    );
  });

  it("returns 400 when wakeTime is before bedtime", async () => {
    const res = await request(app).post("/api/v1/sleep/log").send({
      bedtime: WAKE_TIME, wakeTime: BEDTIME, quality: 3,
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_TIMES");
  });

  it("returns 400 when duration exceeds 24 hours", async () => {
    const res = await request(app).post("/api/v1/sleep/log").send({
      bedtime: "2026-06-09T00:00:00.000Z",
      wakeTime: "2026-06-10T01:00:00.000Z", // 25h later
      quality: 3,
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_DURATION");
  });

  it("returns 400 when quality is out of range", async () => {
    const res = await request(app).post("/api/v1/sleep/log").send({
      bedtime: BEDTIME, wakeTime: WAKE_TIME, quality: 6,
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await request(app).post("/api/v1/sleep/log").send({ quality: 3 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when a factor value is invalid", async () => {
    const res = await request(app).post("/api/v1/sleep/log").send({
      bedtime: BEDTIME, wakeTime: WAKE_TIME, quality: 3, factors: ["gaming_late"],
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

// ── GET /api/v1/sleep/today ────────────────────────────────────────────────────

describe("GET /api/v1/sleep/today", () => {
  it("returns the most recent sleep entry", async () => {
    sleepLogModel.findOne.mockReturnValue(mockFindOneChain(MOCK_LOG));

    const res = await request(app).get("/api/v1/sleep/today");

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe("sleep001");
    expect(res.body.data.durationMinutes).toBe(DURATION);
  });

  it("returns 404 when no entries exist", async () => {
    sleepLogModel.findOne.mockReturnValue(mockFindOneChain(null));

    const res = await request(app).get("/api/v1/sleep/today");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("SLEEP_LOG_NOT_FOUND");
  });
});

// ── GET /api/v1/sleep/history ─────────────────────────────────────────────────

describe("GET /api/v1/sleep/history", () => {
  it("returns paginated entries with averages", async () => {
    const log2 = { ...MOCK_LOG, _id: "sleep002", durationMinutes: 420, quality: 3 };
    sleepLogModel.find.mockReturnValue(mockFindChain([MOCK_LOG, log2]));
    sleepLogModel.countDocuments.mockResolvedValue(2);

    const res = await request(app).get("/api/v1/sleep/history?startDate=2026-06-01&endDate=2026-06-10");

    expect(res.status).toBe(200);
    expect(res.body.data.entries).toHaveLength(2);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.averageDurationMinutes).toBe(Math.round((DURATION + 420) / 2));
    expect(res.body.data.averageQuality).toBe(3.5);
  });

  it("defaults to 30-day range when no dates provided", async () => {
    sleepLogModel.find.mockReturnValue(mockFindChain([]));
    sleepLogModel.countDocuments.mockResolvedValue(0);

    const res = await request(app).get("/api/v1/sleep/history");

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(0);
  });

  it("returns 400 when startDate is after endDate", async () => {
    sleepLogModel.find.mockReturnValue(mockFindChain([]));
    sleepLogModel.countDocuments.mockResolvedValue(0);

    const res = await request(app).get("/api/v1/sleep/history?startDate=2026-06-10&endDate=2026-06-01");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_RANGE");
  });
});

// ── PUT /api/v1/sleep/log/:id ─────────────────────────────────────────────────

describe("PUT /api/v1/sleep/log/:id", () => {
  it("updates quality and notes without changing times", async () => {
    const updated = { ...MOCK_LOG, quality: 5, notes: "Great sleep" };
    sleepLogModel.findOneAndUpdate.mockResolvedValue(updated);

    const res = await request(app).put("/api/v1/sleep/log/sleep001").send({
      quality: 5, notes: "Great sleep",
    });

    expect(res.status).toBe(200);
    expect(res.body.data.quality).toBe(5);
    expect(res.body.data.notes).toBe("Great sleep");
  });

  it("recomputes durationMinutes when both bedtime and wakeTime are updated", async () => {
    const newBedtime  = "2026-06-09T23:00:00.000Z";
    const newWakeTime = "2026-06-10T07:00:00.000Z"; // 8h = 480 min
    const updated = { ...MOCK_LOG, bedtime: newBedtime, wakeTime: newWakeTime, durationMinutes: 480 };
    sleepLogModel.findOneAndUpdate.mockResolvedValue(updated);

    const res = await request(app).put("/api/v1/sleep/log/sleep001").send({
      bedtime: newBedtime, wakeTime: newWakeTime,
    });

    expect(res.status).toBe(200);
    expect(sleepLogModel.findOneAndUpdate).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ $set: expect.objectContaining({ durationMinutes: 480 }) }),
      expect.any(Object)
    );
  });

  it("returns 400 when only bedtime is provided (missing wakeTime)", async () => {
    const res = await request(app).put("/api/v1/sleep/log/sleep001").send({
      bedtime: BEDTIME,
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when updated wakeTime is before bedtime", async () => {
    const res = await request(app).put("/api/v1/sleep/log/sleep001").send({
      bedtime: WAKE_TIME, wakeTime: BEDTIME,
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_TIMES");
  });

  it("returns 404 when log does not exist", async () => {
    sleepLogModel.findOneAndUpdate.mockResolvedValue(null);

    const res = await request(app).put("/api/v1/sleep/log/ghost").send({ quality: 3 });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("SLEEP_LOG_NOT_FOUND");
  });
});

// ── DELETE /api/v1/sleep/log/:id ──────────────────────────────────────────────

describe("DELETE /api/v1/sleep/log/:id", () => {
  it("deletes the entry and returns the deleted id", async () => {
    sleepLogModel.findOneAndDelete.mockResolvedValue(MOCK_LOG);

    const res = await request(app).delete("/api/v1/sleep/log/sleep001");

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("sleep001");
  });

  it("returns 404 when log does not exist", async () => {
    sleepLogModel.findOneAndDelete.mockResolvedValue(null);

    const res = await request(app).delete("/api/v1/sleep/log/ghost");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("SLEEP_LOG_NOT_FOUND");
  });
});

// ── GET /api/v1/sleep/analysis ────────────────────────────────────────────────

describe("GET /api/v1/sleep/analysis", () => {
  const makeLog = (bedHour, wakHour, quality, factors = []) => ({
    _id:             `log-${Math.random()}`,
    bedtime:         `2026-06-01T${String(bedHour).padStart(2, "0")}:00:00.000Z`,
    wakeTime:        `2026-06-02T${String(wakHour).padStart(2, "0")}:00:00.000Z`,
    durationMinutes: (wakHour + 24 - bedHour) * 60,
    quality,
    factors,
  });

  it("returns full analysis with insights when enough data exists", async () => {
    const logs = [
      makeLog(22, 6, 4, ["exercise"]),
      makeLog(22, 6, 5, ["exercise"]),
      makeLog(22, 6, 4, ["exercise"]),
      makeLog(23, 5, 2, ["caffeine_late"]),
      makeLog(23, 5, 2, ["caffeine_late"]),
      makeLog(23, 5, 1, ["caffeine_late"]),
    ];
    sleepLogModel.find.mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(logs) }) });
    trackingModel.aggregate.mockResolvedValue([]);

    const res = await request(app).get("/api/v1/sleep/analysis?period=30");

    expect(res.status).toBe(200);
    expect(res.body.data.entriesAnalyzed).toBe(6);
    expect(res.body.data.averageDurationMinutes).toBeGreaterThan(0);
    expect(res.body.data.consistencyScore).toBeGreaterThanOrEqual(0);
    expect(res.body.data.consistencyScore).toBeLessThanOrEqual(100);
    expect(res.body.data.insights).toBeInstanceOf(Array);
    // caffeine_late avg 1.67 vs exercise avg 4.33 — diff >= 0.5 → insight expected
    expect(res.body.data.insights.length).toBeGreaterThan(0);
  });

  it("returns low-data message when fewer than 3 entries", async () => {
    sleepLogModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([MOCK_LOG, MOCK_LOG]) }),
    });
    trackingModel.aggregate.mockResolvedValue([]);

    const res = await request(app).get("/api/v1/sleep/analysis");

    expect(res.status).toBe(200);
    expect(res.body.data.message).toMatch(/at least 3/i);
    expect(res.body.data.insights).toEqual([]);
  });

  it("includes nutrition insight when calorie correlation is significant", async () => {
    // 4 nights short sleep (<6h) + 4 nights good sleep (>=7h)
    const shortLogs = Array.from({ length: 4 }, (_, i) => ({
      _id: `short${i}`,
      bedtime:         `2026-06-0${i + 1}T02:00:00.000Z`,
      wakeTime:        `2026-06-0${i + 1}T07:00:00.000Z`, // 5h = 300 min
      durationMinutes: 300,
      quality: 2,
      factors: [],
    }));
    const goodLogs = Array.from({ length: 4 }, (_, i) => ({
      _id: `good${i}`,
      bedtime:  `2026-06-1${i}T22:00:00.000Z`,
      wakeTime: `2026-06-1${i}T06:00:00.000Z`, // crosses midnight: 8h = 480 min
      durationMinutes: 480,
      quality: 4,
      factors: [],
    }));

    sleepLogModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([...shortLogs, ...goodLogs]),
      }),
    });

    // Next-day calorie data: high calories after short sleep, low after good sleep
    trackingModel.aggregate.mockResolvedValue([
      { _id: "2026-06-01", totalCalories: 2800 },
      { _id: "2026-06-02", totalCalories: 2900 },
      { _id: "2026-06-03", totalCalories: 2750 },
      { _id: "2026-06-04", totalCalories: 2700 },
      { _id: "2026-06-10", totalCalories: 2000 },
      { _id: "2026-06-11", totalCalories: 2100 },
      { _id: "2026-06-12", totalCalories: 1950 },
      { _id: "2026-06-13", totalCalories: 2050 },
    ]);

    const res = await request(app).get("/api/v1/sleep/analysis?period=30");

    expect(res.status).toBe(200);
    const nutritionInsight = res.body.data.insights.find((i) => i.includes("calories"));
    expect(nutritionInsight).toBeDefined();
  });
});
