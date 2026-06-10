/**
 * Workout Planner API — integration tests (templates, sessions, stats, history).
 * Mongoose model methods mocked; no MongoMemoryServer needed.
 */

import request from "supertest";
import express from "express";
import workoutRouter from "../routes/workoutRoutes.js";
import { notFoundHandler, errorHandler } from "../middleware/errorHandler.js";

jest.mock("../middleware/authMiddleware.js", () => ({
  authMiddleware: jest.fn((req, _res, next) => {
    req.user = { id: "649c72b17b3b4f001234abcd", role: "customer" };
    next();
  }),
}));

jest.mock("../models/index.js", () => ({
  workoutTemplateModel: {
    create:           jest.fn(),
    find:             jest.fn(),
    findOne:          jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
  },
  workoutSessionModel: {
    create:           jest.fn(),
    find:             jest.fn(),
    findOne:          jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
    countDocuments:   jest.fn(),
    aggregate:        jest.fn(),
    updateOne:        jest.fn(),
  },
}));

const app = express();
app.use(express.json());
app.use("/api/v1/workouts", workoutRouter);
app.use(notFoundHandler);
app.use(errorHandler);

// ── mock data ──────────────────────────────────────────────────────────────────

const USER_ID   = "649c72b17b3b4f001234abcd";
const EX_ID     = "649c72b17b3b4f001234ef01";
const TMPL_ID   = "649c72b17b3b4f001234ef02";
const SESS_ID   = "649c72b17b3b4f001234ef03";

const MOCK_TEMPLATE = {
  _id: TMPL_ID, userId: USER_ID,
  name: "Push Day",
  exercises: [{ exerciseId: EX_ID, targetSets: 4, targetReps: "8-12", restSeconds: 90, order: 0 }],
  tags: ["push"],
};

const MOCK_SESSION = {
  _id: SESS_ID, userId: USER_ID,
  name: "Push Session A",
  startedAt: new Date("2026-06-10T09:00:00Z"),
  completedAt: null,
  exercises: [{
    exerciseId: EX_ID,
    exerciseName: "Bench Press",
    sets: [
      { setNumber: 1, weight: 80, reps: 10, isWarmup: false, isPR: false, weightUnit: "kg" },
      { setNumber: 2, weight: 90, reps: 8,  isWarmup: false, isPR: false, weightUnit: "kg" },
    ],
  }],
  totalVolume: 80 * 10 + 90 * 8,
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
  const chain = { lean: jest.fn() };
  chain.lean.mockResolvedValue(result);
  return chain;
};

let workoutTemplateModel, workoutSessionModel;
beforeEach(async () => {
  jest.clearAllMocks();
  const models = await import("../models/index.js");
  workoutTemplateModel = models.workoutTemplateModel;
  workoutSessionModel  = models.workoutSessionModel;
});

// ── TEMPLATES ─────────────────────────────────────────────────────────────────

describe("POST /api/v1/workouts/templates", () => {
  it("creates a template and returns 201", async () => {
    workoutTemplateModel.create.mockResolvedValue(MOCK_TEMPLATE);
    const res = await request(app).post("/api/v1/workouts/templates").send({
      name: "Push Day",
      exercises: [{ exerciseId: EX_ID, targetSets: 4, targetReps: "8-12", restSeconds: 90, order: 0 }],
    });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Push Day");
  });

  it("returns 400 when name is missing", async () => {
    const res = await request(app).post("/api/v1/workouts/templates").send({ exercises: [] });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /api/v1/workouts/templates", () => {
  it("returns all templates for the user", async () => {
    workoutTemplateModel.find.mockReturnValue(mockFindChain([MOCK_TEMPLATE]));
    const res = await request(app).get("/api/v1/workouts/templates");
    expect(res.status).toBe(200);
    expect(res.body.data.templates).toHaveLength(1);
    expect(res.body.data.count).toBe(1);
  });
});

describe("PUT /api/v1/workouts/templates/:id", () => {
  it("updates a template and returns it", async () => {
    workoutTemplateModel.findOneAndUpdate.mockResolvedValue({ ...MOCK_TEMPLATE, name: "Push Day v2" });
    const res = await request(app).put(`/api/v1/workouts/templates/${TMPL_ID}`).send({ name: "Push Day v2" });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Push Day v2");
  });

  it("returns 404 when template not found", async () => {
    workoutTemplateModel.findOneAndUpdate.mockResolvedValue(null);
    const res = await request(app).put("/api/v1/workouts/templates/ghost").send({ name: "X" });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("TEMPLATE_NOT_FOUND");
  });
});

describe("DELETE /api/v1/workouts/templates/:id", () => {
  it("deletes a template and returns its id", async () => {
    workoutTemplateModel.findOneAndDelete.mockResolvedValue(MOCK_TEMPLATE);
    const res = await request(app).delete(`/api/v1/workouts/templates/${TMPL_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(TMPL_ID);
  });

  it("returns 404 when template not found", async () => {
    workoutTemplateModel.findOneAndDelete.mockResolvedValue(null);
    const res = await request(app).delete("/api/v1/workouts/templates/ghost");
    expect(res.status).toBe(404);
  });
});

// ── SESSIONS ──────────────────────────────────────────────────────────────────

describe("POST /api/v1/workouts/sessions", () => {
  it("creates a session without completion and returns 201", async () => {
    workoutSessionModel.create.mockResolvedValue(MOCK_SESSION);
    const res = await request(app).post("/api/v1/workouts/sessions").send({
      name: "Push Session A",
      exercises: MOCK_SESSION.exercises,
    });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Push Session A");
    // No PR detection without completedAt
    expect(workoutSessionModel.aggregate).not.toHaveBeenCalled();
  });

  it("runs PR detection when session is created with completedAt", async () => {
    const completedSession = { ...MOCK_SESSION, completedAt: new Date("2026-06-10T10:00:00Z") };
    workoutSessionModel.create.mockResolvedValue(completedSession);
    workoutSessionModel.aggregate.mockResolvedValue([]); // no previous history
    workoutSessionModel.updateOne.mockResolvedValue({});

    const res = await request(app).post("/api/v1/workouts/sessions").send({
      name: "Push Session A",
      startedAt:   "2026-06-10T09:00:00.000Z",
      completedAt: "2026-06-10T10:00:00.000Z",
      exercises: MOCK_SESSION.exercises,
    });

    expect(res.status).toBe(201);
    expect(workoutSessionModel.aggregate).toHaveBeenCalled();
    expect(workoutSessionModel.updateOne).toHaveBeenCalled();
  });

  it("returns 400 when name is missing", async () => {
    const res = await request(app).post("/api/v1/workouts/sessions").send({ exercises: [] });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("PUT /api/v1/workouts/sessions/:id", () => {
  it("adds sets to an in-progress session", async () => {
    workoutSessionModel.findOne.mockReturnValue(mockFindOneChain(MOCK_SESSION));
    workoutSessionModel.findOneAndUpdate.mockResolvedValue({
      ...MOCK_SESSION,
      exercises: [{ ...MOCK_SESSION.exercises[0], sets: [...MOCK_SESSION.exercises[0].sets,
        { setNumber: 3, weight: 95, reps: 6, isWarmup: false, isPR: false, weightUnit: "kg" }
      ]}]
    });

    const res = await request(app).put(`/api/v1/workouts/sessions/${SESS_ID}`).send({
      exercises: [{ ...MOCK_SESSION.exercises[0], sets: [...MOCK_SESSION.exercises[0].sets,
        { setNumber: 3, weight: 95, reps: 6, isWarmup: false, isPR: false, weightUnit: "kg" }
      ]}]
    });

    expect(res.status).toBe(200);
    // PR detection NOT triggered (no completedAt)
    expect(workoutSessionModel.aggregate).not.toHaveBeenCalled();
  });

  it("detects and flags PRs when session is completed", async () => {
    workoutSessionModel.findOne.mockReturnValue(mockFindOneChain(MOCK_SESSION)); // no completedAt
    workoutSessionModel.findOneAndUpdate.mockResolvedValue({
      ...MOCK_SESSION,
      completedAt: new Date("2026-06-10T10:00:00Z"),
    });
    // Previous best: 85kg × 8 reps. Current: 90kg × 8 → new PR
    workoutSessionModel.aggregate.mockResolvedValue([
      { _id: { exerciseId: EX_ID, reps: 8 }, maxWeight: 85 },
      { _id: { exerciseId: EX_ID, reps: 10 }, maxWeight: 75 },
    ]);
    workoutSessionModel.updateOne.mockResolvedValue({});

    const res = await request(app).put(`/api/v1/workouts/sessions/${SESS_ID}`).send({
      completedAt: "2026-06-10T10:00:00.000Z",
      exercises: MOCK_SESSION.exercises,
    });

    expect(res.status).toBe(200);
    expect(workoutSessionModel.aggregate).toHaveBeenCalled();

    // Verify the updateOne was called with isPR=true on the 90kg×8 set
    const [, updatePayload] = workoutSessionModel.updateOne.mock.calls[0];
    const updatedSets = updatePayload.$set.exercises[0].sets;
    const prSet = updatedSets.find((s) => s.reps === 8 && s.weight === 90);
    expect(prSet.isPR).toBe(true);
    // 80kg×10 was also a PR (75 previous → 80 new)
    const prSet2 = updatedSets.find((s) => s.reps === 10 && s.weight === 80);
    expect(prSet2.isPR).toBe(true);
  });

  it("returns 404 when session not found", async () => {
    workoutSessionModel.findOne.mockReturnValue(mockFindOneChain(null));
    const res = await request(app).put("/api/v1/workouts/sessions/ghost").send({ name: "X" });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("SESSION_NOT_FOUND");
  });
});

describe("GET /api/v1/workouts/sessions", () => {
  it("returns paginated session list", async () => {
    workoutSessionModel.find.mockReturnValue(mockFindChain([MOCK_SESSION]));
    workoutSessionModel.countDocuments.mockResolvedValue(1);

    const res = await request(app).get("/api/v1/workouts/sessions");
    expect(res.status).toBe(200);
    expect(res.body.data.sessions).toHaveLength(1);
    expect(res.body.data.total).toBe(1);
  });
});

describe("GET /api/v1/workouts/sessions/:id", () => {
  it("returns a single session", async () => {
    workoutSessionModel.findOne.mockReturnValue(mockFindOneChain(MOCK_SESSION));
    const res = await request(app).get(`/api/v1/workouts/sessions/${SESS_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(SESS_ID);
  });

  it("returns 404 for missing session", async () => {
    workoutSessionModel.findOne.mockReturnValue(mockFindOneChain(null));
    const res = await request(app).get("/api/v1/workouts/sessions/ghost");
    expect(res.status).toBe(404);
  });
});

// ── STATS ─────────────────────────────────────────────────────────────────────

describe("GET /api/v1/workouts/stats", () => {
  it("returns aggregated workout stats", async () => {
    workoutSessionModel.find.mockReturnValue(mockFindChain([
      { ...MOCK_SESSION, completedAt: new Date(), totalVolume: 1500, durationMinutes: 60 },
      { ...MOCK_SESSION, _id: "sess002", completedAt: new Date(), totalVolume: 2000, durationMinutes: 75 },
    ]));
    workoutSessionModel.aggregate.mockResolvedValue([
      { _id: EX_ID, exerciseName: "Bench Press", bestWeight: 100, achievedAt: new Date() }
    ]);

    const res = await request(app).get("/api/v1/workouts/stats?period=30");
    expect(res.status).toBe(200);
    expect(res.body.data.totalSessions).toBe(2);
    expect(res.body.data.totalVolume).toBe(3500);
    expect(res.body.data.averageDurationMinutes).toBe(68);
    expect(res.body.data.prsAchieved).toHaveLength(1);
  });

  it("returns zeros when no sessions exist", async () => {
    workoutSessionModel.find.mockReturnValue(mockFindChain([]));
    workoutSessionModel.aggregate.mockResolvedValue([]);

    const res = await request(app).get("/api/v1/workouts/stats");
    expect(res.status).toBe(200);
    expect(res.body.data.totalSessions).toBe(0);
    expect(res.body.data.totalVolume).toBe(0);
  });
});

// ── EXERCISE HISTORY ──────────────────────────────────────────────────────────

describe("GET /api/v1/workouts/exercise-history/:exerciseId", () => {
  it("returns history for a specific exercise across sessions", async () => {
    const completedSession = {
      ...MOCK_SESSION,
      completedAt: new Date("2026-06-10T10:00:00Z"),
      exercises: [{
        exerciseId: { toString: () => EX_ID },
        exerciseName: "Bench Press",
        sets: [
          { setNumber: 1, weight: 90, reps: 8, isWarmup: false, isPR: true, weightUnit: "kg" },
        ],
      }],
    };
    workoutSessionModel.find.mockReturnValue(mockFindChain([completedSession]));

    const res = await request(app).get(`/api/v1/workouts/exercise-history/${EX_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(1);
    expect(res.body.data.history[0].hasPR).toBe(true);
    expect(res.body.data.history[0].totalVolume).toBe(90 * 8);
  });

  it("returns empty history when no sessions exist", async () => {
    workoutSessionModel.find.mockReturnValue(mockFindChain([]));
    const res = await request(app).get(`/api/v1/workouts/exercise-history/${EX_ID}`);
    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(0);
  });
});
