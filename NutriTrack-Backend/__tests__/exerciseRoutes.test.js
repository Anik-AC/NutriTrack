/**
 * Exercise API — integration tests.
 * ExerciseService is mocked so no external HTTP calls are made.
 */

import request from "supertest";
import express from "express";
import exerciseRouter from "../routes/exerciseRoutes.js";
import { notFoundHandler, errorHandler } from "../middleware/errorHandler.js";

jest.mock("../middleware/authMiddleware.js", () => ({
  authMiddleware: jest.fn((req, _res, next) => {
    req.user = { id: "649c72b17b3b4f001234abcd", role: "customer" };
    next();
  }),
}));

jest.mock("../services/exercise/ExerciseService.js", () => ({
  exerciseService: {
    search:  jest.fn(),
    getById: jest.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use("/api/v1/exercises", exerciseRouter);
app.use(notFoundHandler);
app.use(errorHandler);

const MOCK_EXERCISES = [
  { _id: "ex001", name: "Bench Press",  muscleGroup: "chest", equipment: "barbell", instructions: ["Lie on bench", "Press up"] },
  { _id: "ex002", name: "Incline Press", muscleGroup: "chest", equipment: "dumbbell", instructions: [] },
];

let exerciseService;
beforeEach(async () => {
  jest.clearAllMocks();
  const svc = await import("../services/exercise/ExerciseService.js");
  exerciseService = svc.exerciseService;
});

// ── GET /api/v1/exercises/search ──────────────────────────────────────────────

describe("GET /api/v1/exercises/search", () => {
  it("returns exercises matching the query", async () => {
    exerciseService.search.mockResolvedValue(MOCK_EXERCISES);
    const res = await request(app).get("/api/v1/exercises/search?q=bench");
    expect(res.status).toBe(200);
    expect(res.body.data.results).toHaveLength(2);
    expect(res.body.data.count).toBe(2);
    expect(exerciseService.search).toHaveBeenCalledWith(
      expect.objectContaining({ q: "bench" })
    );
  });

  it("filters by muscleGroup and equipment", async () => {
    exerciseService.search.mockResolvedValue([MOCK_EXERCISES[0]]);
    const res = await request(app).get("/api/v1/exercises/search?muscleGroup=chest&equipment=barbell");
    expect(res.status).toBe(200);
    expect(exerciseService.search).toHaveBeenCalledWith(
      expect.objectContaining({ muscleGroup: "chest", equipment: "barbell" })
    );
  });

  it("returns empty results when nothing matches", async () => {
    exerciseService.search.mockResolvedValue([]);
    const res = await request(app).get("/api/v1/exercises/search?q=zzz");
    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(0);
  });

  it("returns 400 when muscleGroup is invalid", async () => {
    const res = await request(app).get("/api/v1/exercises/search?muscleGroup=wings");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("works without any query params (browse all)", async () => {
    exerciseService.search.mockResolvedValue(MOCK_EXERCISES);
    const res = await request(app).get("/api/v1/exercises/search");
    expect(res.status).toBe(200);
  });
});

// ── GET /api/v1/exercises/:id ─────────────────────────────────────────────────

describe("GET /api/v1/exercises/:id", () => {
  it("returns the exercise when found", async () => {
    exerciseService.getById.mockResolvedValue(MOCK_EXERCISES[0]);
    const res = await request(app).get("/api/v1/exercises/ex001");
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Bench Press");
  });

  it("returns 404 when exercise does not exist", async () => {
    exerciseService.getById.mockResolvedValue(null);
    const res = await request(app).get("/api/v1/exercises/ghost");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("EXERCISE_NOT_FOUND");
  });
});
