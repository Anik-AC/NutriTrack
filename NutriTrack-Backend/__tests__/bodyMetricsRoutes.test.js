/**
 * Body Metrics API — integration tests.
 * Mongoose models and cloudinary are mocked; no MongoMemoryServer needed.
 */

import request from "supertest";
import express from "express";
import bodyMetricsRouter from "../routes/bodyMetricsRoutes.js";
import { notFoundHandler, errorHandler } from "../middleware/errorHandler.js";

jest.mock("../middleware/authMiddleware.js", () => ({
  authMiddleware: jest.fn((req, _res, next) => {
    req.user = { id: "649c72b17b3b4f001234abcd", role: "customer" };
    next();
  }),
}));

jest.mock("../models/index.js", () => ({
  bodyMetricsLogModel: {
    create:           jest.fn(),
    find:             jest.fn(),
    findOne:          jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
  },
  progressPhotoModel: {
    create:           jest.fn(),
    find:             jest.fn(),
    findOne:          jest.fn(),
    findOneAndDelete: jest.fn(),
    countDocuments:   jest.fn(),
  },
}));

jest.mock("cloudinary", () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy:       jest.fn(),
    },
  },
}));

const app = express();
app.use(express.json());
app.use("/api/v1/body-metrics", bodyMetricsRouter);
app.use(notFoundHandler);
app.use(errorHandler);

// ── mock data ──────────────────────────────────────────────────────────────────

const USER_ID  = "649c72b17b3b4f001234abcd";
const LOG_ID   = "649c72b17b3b4f001234ef10";
const PHOTO_ID = "649c72b17b3b4f001234ef11";

const MOCK_ENTRY = {
  _id:               LOG_ID,
  userId:            USER_ID,
  date:              new Date("2026-06-10T08:00:00Z"),
  weight:            75.5,
  weightUnit:        "kg",
  bodyFatPercentage: 18.5,
  measurements:      { waist: 82, hips: 98, unit: "cm" },
  notes:             "Morning weigh-in",
  source:            "manual",
};

const MOCK_PHOTO = {
  _id:          PHOTO_ID,
  userId:       USER_ID,
  imageUrl:     "https://res.cloudinary.com/test/image/upload/v1/nutritrack/progress-photos/abc.jpg",
  thumbnailUrl: "https://res.cloudinary.com/test/image/upload/c_fill,h_300,w_300/v1/nutritrack/progress-photos/abc.jpg",
  publicId:     "nutritrack/progress-photos/649c72b17b3b4f001234abcd/abc",
  date:         new Date("2026-06-10T08:00:00Z"),
  pose:         "front",
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

let bodyMetricsLogModel, progressPhotoModel;
beforeEach(async () => {
  jest.clearAllMocks();
  const models = await import("../models/index.js");
  bodyMetricsLogModel = models.bodyMetricsLogModel;
  progressPhotoModel  = models.progressPhotoModel;
});

// ── POST /log ─────────────────────────────────────────────────────────────────

describe("POST /api/v1/body-metrics/log", () => {
  it("logs weight and measurements, returns 201", async () => {
    bodyMetricsLogModel.create.mockResolvedValue(MOCK_ENTRY);
    const res = await request(app).post("/api/v1/body-metrics/log").send({
      weight: 75.5,
      weightUnit: "kg",
      bodyFatPercentage: 18.5,
      measurements: { waist: 82, hips: 98, unit: "cm" },
      notes: "Morning weigh-in",
    });
    expect(res.status).toBe(201);
    expect(res.body.data.weight).toBe(75.5);
    expect(res.body.data.bodyFatPercentage).toBe(18.5);
  });

  it("logs body fat only (no weight required)", async () => {
    bodyMetricsLogModel.create.mockResolvedValue({ ...MOCK_ENTRY, weight: undefined, bodyFatPercentage: 20 });
    const res = await request(app).post("/api/v1/body-metrics/log").send({ bodyFatPercentage: 20 });
    expect(res.status).toBe(201);
  });

  it("logs measurements only", async () => {
    bodyMetricsLogModel.create.mockResolvedValue({ ...MOCK_ENTRY, weight: undefined });
    const res = await request(app).post("/api/v1/body-metrics/log").send({
      measurements: { waist: 82, unit: "cm" },
    });
    expect(res.status).toBe(201);
  });

  it("returns 400 when no metric fields provided", async () => {
    const res = await request(app).post("/api/v1/body-metrics/log").send({ notes: "just a note" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for negative weight", async () => {
    const res = await request(app).post("/api/v1/body-metrics/log").send({ weight: -5 });
    expect(res.status).toBe(400);
  });

  it("returns 400 for body fat > 100", async () => {
    const res = await request(app).post("/api/v1/body-metrics/log").send({ bodyFatPercentage: 105 });
    expect(res.status).toBe(400);
  });
});

// ── GET /latest ───────────────────────────────────────────────────────────────

describe("GET /api/v1/body-metrics/latest", () => {
  it("returns the most recent entry", async () => {
    bodyMetricsLogModel.findOne.mockReturnValue(mockFindOneChain(MOCK_ENTRY));
    const res = await request(app).get("/api/v1/body-metrics/latest");
    expect(res.status).toBe(200);
    expect(res.body.data.weight).toBe(75.5);
  });

  it("returns null when no entries exist", async () => {
    bodyMetricsLogModel.findOne.mockReturnValue(mockFindOneChain(null));
    const res = await request(app).get("/api/v1/body-metrics/latest");
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });
});

// ── GET /history ──────────────────────────────────────────────────────────────

describe("GET /api/v1/body-metrics/history", () => {
  it("returns entries and 7-day moving average", async () => {
    const entries = [
      { ...MOCK_ENTRY, date: new Date("2026-06-08T08:00:00Z"), weight: 76 },
      { ...MOCK_ENTRY, date: new Date("2026-06-09T08:00:00Z"), weight: 75.5 },
      { ...MOCK_ENTRY, date: new Date("2026-06-10T08:00:00Z"), weight: 75 },
    ];
    bodyMetricsLogModel.find.mockReturnValue(mockFindChain(entries));
    const res = await request(app).get("/api/v1/body-metrics/history?startDate=2026-06-08&endDate=2026-06-10");
    expect(res.status).toBe(200);
    expect(res.body.data.entries).toHaveLength(3);
    expect(res.body.data.weightMovingAverage).toBeDefined();
    expect(res.body.data.weightMovingAverage.length).toBeGreaterThan(0);
    expect(res.body.data.count).toBe(3);
  });

  it("uses default 90-day range when no dates supplied", async () => {
    bodyMetricsLogModel.find.mockReturnValue(mockFindChain([]));
    const res = await request(app).get("/api/v1/body-metrics/history");
    expect(res.status).toBe(200);
    expect(res.body.data.entries).toHaveLength(0);
  });

  it("computes correct moving average", async () => {
    // Same weight every day — MA should equal that weight
    const entries = Array.from({ length: 7 }, (_, i) => ({
      ...MOCK_ENTRY,
      _id: `id${i}`,
      date: new Date(`2026-06-0${i + 1}T08:00:00Z`),
      weight: 75,
    }));
    bodyMetricsLogModel.find.mockReturnValue(mockFindChain(entries));
    const res = await request(app).get("/api/v1/body-metrics/history?startDate=2026-06-01&endDate=2026-06-07");
    expect(res.status).toBe(200);
    const ma = res.body.data.weightMovingAverage;
    expect(ma.every((d) => d.value === 75)).toBe(true);
  });

  it("excludes entries before startDate from entries but uses them for MA", async () => {
    // Fetch window includes 6 days before start, but entries only within range are returned
    const entries = [
      { ...MOCK_ENTRY, date: new Date("2026-06-04T08:00:00Z"), weight: 76 }, // before range
      { ...MOCK_ENTRY, date: new Date("2026-06-05T08:00:00Z"), weight: 75 }, // before range
      { ...MOCK_ENTRY, date: new Date("2026-06-10T08:00:00Z"), weight: 74 }, // in range
    ];
    bodyMetricsLogModel.find.mockReturnValue(mockFindChain(entries));
    const res = await request(app).get("/api/v1/body-metrics/history?startDate=2026-06-10&endDate=2026-06-10");
    expect(res.status).toBe(200);
    expect(res.body.data.entries).toHaveLength(1);
    // MA should incorporate the earlier entries
    expect(res.body.data.weightMovingAverage[0].value).toBeCloseTo((76 + 75 + 74) / 3, 1);
  });
});

// ── PUT /log/:id ──────────────────────────────────────────────────────────────

describe("PUT /api/v1/body-metrics/log/:id", () => {
  it("updates an entry and returns it", async () => {
    bodyMetricsLogModel.findOneAndUpdate.mockResolvedValue({ ...MOCK_ENTRY, weight: 74.8 });
    const res = await request(app).put(`/api/v1/body-metrics/log/${LOG_ID}`).send({ weight: 74.8 });
    expect(res.status).toBe(200);
    expect(res.body.data.weight).toBe(74.8);
  });

  it("returns 404 when entry not found", async () => {
    bodyMetricsLogModel.findOneAndUpdate.mockResolvedValue(null);
    const res = await request(app).put("/api/v1/body-metrics/log/ghost").send({ weight: 70 });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("METRICS_NOT_FOUND");
  });
});

// ── DELETE /log/:id ───────────────────────────────────────────────────────────

describe("DELETE /api/v1/body-metrics/log/:id", () => {
  it("deletes an entry and returns its id", async () => {
    bodyMetricsLogModel.findOneAndDelete.mockResolvedValue(MOCK_ENTRY);
    const res = await request(app).delete(`/api/v1/body-metrics/log/${LOG_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(LOG_ID);
  });

  it("returns 404 when entry not found", async () => {
    bodyMetricsLogModel.findOneAndDelete.mockResolvedValue(null);
    const res = await request(app).delete("/api/v1/body-metrics/log/ghost");
    expect(res.status).toBe(404);
  });
});

// ── GET /photos ───────────────────────────────────────────────────────────────

describe("GET /api/v1/body-metrics/photos", () => {
  it("returns paginated photo list", async () => {
    progressPhotoModel.find.mockReturnValue(mockFindChain([MOCK_PHOTO]));
    progressPhotoModel.countDocuments.mockResolvedValue(1);
    const res = await request(app).get("/api/v1/body-metrics/photos");
    expect(res.status).toBe(200);
    expect(res.body.data.photos).toHaveLength(1);
    expect(res.body.data.total).toBe(1);
  });

  it("filters by pose", async () => {
    progressPhotoModel.find.mockReturnValue(mockFindChain([MOCK_PHOTO]));
    progressPhotoModel.countDocuments.mockResolvedValue(1);
    const res = await request(app).get("/api/v1/body-metrics/photos?pose=front");
    expect(res.status).toBe(200);
  });

  it("returns 400 for invalid pose value", async () => {
    const res = await request(app).get("/api/v1/body-metrics/photos?pose=diagonal");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns empty list when no photos", async () => {
    progressPhotoModel.find.mockReturnValue(mockFindChain([]));
    progressPhotoModel.countDocuments.mockResolvedValue(0);
    const res = await request(app).get("/api/v1/body-metrics/photos");
    expect(res.status).toBe(200);
    expect(res.body.data.photos).toHaveLength(0);
    expect(res.body.data.total).toBe(0);
  });
});

// ── DELETE /photo/:id ─────────────────────────────────────────────────────────

describe("DELETE /api/v1/body-metrics/photo/:id", () => {
  it("deletes photo and returns its id", async () => {
    const { v2: cloudinary } = await import("cloudinary");
    cloudinary.uploader.destroy.mockResolvedValue({ result: "ok" });
    progressPhotoModel.findOneAndDelete.mockResolvedValue(MOCK_PHOTO);

    const res = await request(app).delete(`/api/v1/body-metrics/photo/${PHOTO_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(PHOTO_ID);
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(MOCK_PHOTO.publicId);
  });

  it("returns 404 when photo not found", async () => {
    progressPhotoModel.findOneAndDelete.mockResolvedValue(null);
    const res = await request(app).delete("/api/v1/body-metrics/photo/ghost");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("PHOTO_NOT_FOUND");
  });

  it("returns 200 even if Cloudinary destroy fails (best-effort)", async () => {
    const { v2: cloudinary } = await import("cloudinary");
    cloudinary.uploader.destroy.mockRejectedValue(new Error("Cloudinary unavailable"));
    progressPhotoModel.findOneAndDelete.mockResolvedValue(MOCK_PHOTO);

    const res = await request(app).delete(`/api/v1/body-metrics/photo/${PHOTO_ID}`);
    expect(res.status).toBe(200);
  });
});
