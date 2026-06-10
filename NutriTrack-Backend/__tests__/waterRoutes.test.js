/**
 * Water Intake API — integration tests.
 *
 * Real controller logic runs; Mongoose model methods are mocked so no
 * MongoMemoryServer is needed.
 */

import request from "supertest";
import express from "express";
import waterRouter from "../routes/waterRoutes.js";
import { notFoundHandler, errorHandler } from "../middleware/errorHandler.js";

// ── module mocks ────────────────────────────────────────────────────────────────

jest.mock("../middleware/authMiddleware.js", () => ({
  authMiddleware: jest.fn((req, _res, next) => {
    req.user = { id: "649c72b17b3b4f001234abcd", role: "customer" };
    next();
  }),
}));

jest.mock("../models/index.js", () => ({
  waterLogModel: {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndDelete: jest.fn(),
    aggregate: jest.fn(),
  },
  waterGoalModel: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

// ── app setup ──────────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());
app.use("/api/v1/water", waterRouter);
app.use(notFoundHandler);
app.use(errorHandler);

// ── mock data ──────────────────────────────────────────────────────────────────

const USER_ID = "649c72b17b3b4f001234abcd";
const LOG_1 = { _id: "log001", userId: USER_ID, amount: 250, loggedAt: new Date().toISOString(), source: "quick_add" };
const LOG_2 = { _id: "log002", userId: USER_ID, amount: 500, loggedAt: new Date().toISOString(), source: "manual" };
const GOAL  = { userId: USER_ID, dailyGoalMl: 2500 };

// ── helpers ────────────────────────────────────────────────────────────────────

let waterLogModel, waterGoalModel;

const mockFindChain = (results) => {
  const chain = { sort: jest.fn(), lean: jest.fn() };
  chain.sort.mockReturnValue(chain);
  chain.lean.mockResolvedValue(results);
  return chain;
};

beforeEach(async () => {
  jest.clearAllMocks();
  const models = await import("../models/index.js");
  waterLogModel  = models.waterLogModel;
  waterGoalModel = models.waterGoalModel;
});

// ── POST /api/v1/water/log ─────────────────────────────────────────────────────

describe("POST /api/v1/water/log", () => {
  it("logs water and returns the entry + today totals", async () => {
    waterLogModel.create.mockResolvedValue(LOG_1);
    waterGoalModel.findOne.mockReturnValue({ lean: () => Promise.resolve(GOAL) });
    waterLogModel.find.mockReturnValue(mockFindChain([LOG_1, LOG_2]));

    const res = await request(app)
      .post("/api/v1/water/log")
      .send({ amount: 250, source: "quick_add" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.log.amount).toBe(250);
    expect(res.body.data.today.total).toBe(750); // 250 + 500
    expect(res.body.data.today.goal).toBe(2500);
    expect(res.body.data.today.percentage).toBe(30); // round(750/2500*100)
  });

  it("uses default goal of 3000 when no goal is set", async () => {
    waterLogModel.create.mockResolvedValue(LOG_1);
    waterGoalModel.findOne.mockReturnValue({ lean: () => Promise.resolve(null) });
    waterLogModel.find.mockReturnValue(mockFindChain([LOG_1]));

    const res = await request(app).post("/api/v1/water/log").send({ amount: 250 });

    expect(res.status).toBe(201);
    expect(res.body.data.today.goal).toBe(3000);
  });

  it("accepts a backdated loggedAt timestamp", async () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    waterLogModel.create.mockResolvedValue({ ...LOG_1, loggedAt: yesterday });
    waterGoalModel.findOne.mockReturnValue({ lean: () => Promise.resolve(null) });
    waterLogModel.find.mockReturnValue(mockFindChain([]));

    const res = await request(app)
      .post("/api/v1/water/log")
      .send({ amount: 300, loggedAt: yesterday });

    expect(res.status).toBe(201);
    expect(waterLogModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ loggedAt: new Date(yesterday) })
    );
  });

  it("returns 400 when amount is missing", async () => {
    const res = await request(app).post("/api/v1/water/log").send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when amount is 0", async () => {
    const res = await request(app).post("/api/v1/water/log").send({ amount: 0 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when amount exceeds 10,000 ml", async () => {
    const res = await request(app).post("/api/v1/water/log").send({ amount: 10001 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when source is not a valid enum", async () => {
    const res = await request(app).post("/api/v1/water/log").send({ amount: 250, source: "magic" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

// ── GET /api/v1/water/today ────────────────────────────────────────────────────

describe("GET /api/v1/water/today", () => {
  it("returns today's total, goal, percentage, and individual logs", async () => {
    waterGoalModel.findOne.mockReturnValue({ lean: () => Promise.resolve(GOAL) });
    waterLogModel.find.mockReturnValue(mockFindChain([LOG_1, LOG_2]));

    const res = await request(app).get("/api/v1/water/today");

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(750);
    expect(res.body.data.goal).toBe(2500);
    expect(res.body.data.percentage).toBe(30);
    expect(res.body.data.logs).toHaveLength(2);
  });

  it("returns total=0 when no entries logged today", async () => {
    waterGoalModel.findOne.mockReturnValue({ lean: () => Promise.resolve(null) });
    waterLogModel.find.mockReturnValue(mockFindChain([]));

    const res = await request(app).get("/api/v1/water/today");

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(0);
    expect(res.body.data.percentage).toBe(0);
    expect(res.body.data.logs).toHaveLength(0);
  });

  it("caps percentage at 100 when intake exceeds goal", async () => {
    waterGoalModel.findOne.mockReturnValue({ lean: () => Promise.resolve({ dailyGoalMl: 500 }) });
    const bigLog = { ...LOG_1, amount: 800 };
    waterLogModel.find.mockReturnValue(mockFindChain([bigLog]));

    const res = await request(app).get("/api/v1/water/today");

    expect(res.status).toBe(200);
    expect(res.body.data.percentage).toBe(100);
  });
});

// ── GET /api/v1/water/history ──────────────────────────────────────────────────

describe("GET /api/v1/water/history", () => {
  const HISTORY_ROWS = [
    { _id: "2026-06-04", total: 2200, count: 5 },
    { _id: "2026-06-05", total: 3000, count: 6 },
    { _id: "2026-06-06", total: 1800, count: 4 },
  ];

  it("returns daily totals with goal and percentage for the given date range", async () => {
    waterLogModel.aggregate.mockResolvedValue(HISTORY_ROWS);
    waterGoalModel.findOne.mockReturnValue({ lean: () => Promise.resolve(GOAL) });

    const res = await request(app).get("/api/v1/water/history?startDate=2026-06-04&endDate=2026-06-06");

    expect(res.status).toBe(200);
    expect(res.body.data.goal).toBe(2500);
    expect(res.body.data.days).toHaveLength(3);
    expect(res.body.data.days[0]).toMatchObject({ date: "2026-06-04", total: 2200, percentage: 88 });
    expect(res.body.data.days[1].percentage).toBe(100); // 3000/2500 capped
  });

  it("defaults to the last 7 days when no dates are provided", async () => {
    waterLogModel.aggregate.mockResolvedValue([]);
    waterGoalModel.findOne.mockReturnValue({ lean: () => Promise.resolve(null) });

    const res = await request(app).get("/api/v1/water/history");

    expect(res.status).toBe(200);
    expect(waterLogModel.aggregate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ $match: expect.any(Object) }),
      ])
    );
    expect(res.body.data.days).toEqual([]);
  });

  it("returns 400 when startDate format is invalid", async () => {
    const res = await request(app).get("/api/v1/water/history?startDate=not-a-date");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when startDate is after endDate", async () => {
    waterLogModel.aggregate.mockResolvedValue([]);
    waterGoalModel.findOne.mockReturnValue({ lean: () => Promise.resolve(null) });

    const res = await request(app).get("/api/v1/water/history?startDate=2026-06-10&endDate=2026-06-01");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_RANGE");
  });
});

// ── PUT /api/v1/water/goal ─────────────────────────────────────────────────────

describe("PUT /api/v1/water/goal", () => {
  it("sets a new daily goal and returns it", async () => {
    waterGoalModel.findOneAndUpdate.mockResolvedValue({ userId: USER_ID, dailyGoalMl: 2000 });

    const res = await request(app).put("/api/v1/water/goal").send({ dailyGoalMl: 2000 });

    expect(res.status).toBe(200);
    expect(res.body.data.dailyGoalMl).toBe(2000);
    expect(waterGoalModel.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: USER_ID },
      { $set: { dailyGoalMl: 2000 } },
      { upsert: true, new: true }
    );
  });

  it("returns 400 when dailyGoalMl is below 500", async () => {
    const res = await request(app).put("/api/v1/water/goal").send({ dailyGoalMl: 499 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when dailyGoalMl exceeds 10,000", async () => {
    const res = await request(app).put("/api/v1/water/goal").send({ dailyGoalMl: 10001 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when dailyGoalMl is missing", async () => {
    const res = await request(app).put("/api/v1/water/goal").send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

// ── DELETE /api/v1/water/log/:id ──────────────────────────────────────────────

describe("DELETE /api/v1/water/log/:id", () => {
  it("deletes the log and returns the deleted id", async () => {
    waterLogModel.findOneAndDelete.mockResolvedValue(LOG_1);

    const res = await request(app).delete("/api/v1/water/log/log001");

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("log001");
    expect(waterLogModel.findOneAndDelete).toHaveBeenCalledWith({
      _id: "log001",
      userId: USER_ID,
    });
  });

  it("returns 404 when the log does not exist or belongs to another user", async () => {
    waterLogModel.findOneAndDelete.mockResolvedValue(null);

    const res = await request(app).delete("/api/v1/water/log/ghost");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("WATER_LOG_NOT_FOUND");
  });
});
