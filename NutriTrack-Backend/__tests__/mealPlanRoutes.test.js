/**
 * Meal Plan API — integration tests.
 *
 * Real controller logic runs; Mongoose model methods are mocked so no
 * MongoMemoryServer is needed.
 */

import request from "supertest";
import express from "express";
import mealPlanRouter from "../routes/mealPlanRoutes.js";
import { notFoundHandler, errorHandler } from "../middleware/errorHandler.js";

// ── module mocks ────────────────────────────────────────────────────────────────

jest.mock("../middleware/authMiddleware.js", () => ({
  authMiddleware: jest.fn((req, _res, next) => {
    req.user = { id: "user123", role: "customer" };
    next();
  }),
}));

jest.mock("../models/index.js", () => ({
  mealPlanModel: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
    find: jest.fn(),
  },
  recipeModel: {
    find: jest.fn(),
  },
}));

// ── app setup ──────────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());
app.use("/api/v1/meal-plan", mealPlanRouter);
app.use(notFoundHandler);
app.use(errorHandler);

// ── mock data ──────────────────────────────────────────────────────────────────

const WEEK_START = "2026-06-09"; // Monday

const MOCK_PLAN = {
  _id: "plan001",
  userId: "user123",
  weekStart: new Date(WEEK_START).toISOString(),
  days: [
    {
      date: new Date("2026-06-09").toISOString(),
      meals: [
        { type: "breakfast", recipeId: "recipe001", servings: 1 },
        { type: "lunch", recipeId: "recipe002", servings: 2 },
      ],
      targetCalories: 2000,
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const MOCK_RECIPE_1 = {
  _id: "recipe001",
  userId: "user123",
  title: "Oatmeal",
  servings: 1,
  ingredients: [
    { name: "Oats", quantity: 80, unit: "g" },
    { name: "Milk", quantity: 200, unit: "ml" },
  ],
};

const MOCK_RECIPE_2 = {
  _id: "recipe002",
  userId: "user123",
  title: "Chicken Rice",
  servings: 2,
  ingredients: [
    { name: "Chicken breast", quantity: 200, unit: "g" },
    { name: "White rice", quantity: 150, unit: "g" },
  ],
};

// ── helpers ────────────────────────────────────────────────────────────────────

let mealPlanModel, recipeModel;

beforeEach(async () => {
  jest.clearAllMocks();
  const models = await import("../models/index.js");
  mealPlanModel = models.mealPlanModel;
  recipeModel = models.recipeModel;
});

// ── POST /api/v1/meal-plan ─────────────────────────────────────────────────────

describe("POST /api/v1/meal-plan", () => {
  it("creates a new meal plan and returns 200", async () => {
    mealPlanModel.findOneAndUpdate.mockResolvedValue(MOCK_PLAN);

    const res = await request(app)
      .post("/api/v1/meal-plan")
      .send({
        weekStart: WEEK_START,
        days: [
          {
            date: "2026-06-09",
            meals: [{ type: "breakfast", recipeId: "recipe001", servings: 1 }],
            targetCalories: 2000,
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe("plan001");
    expect(mealPlanModel.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: "user123", weekStart: new Date(WEEK_START) },
      expect.objectContaining({ $set: expect.any(Object) }),
      expect.objectContaining({ upsert: true, new: true })
    );
  });

  it("updates an existing plan when one exists for that week (upsert)", async () => {
    const updatedPlan = { ...MOCK_PLAN, days: [] };
    mealPlanModel.findOneAndUpdate.mockResolvedValue(updatedPlan);

    const res = await request(app)
      .post("/api/v1/meal-plan")
      .send({ weekStart: WEEK_START, days: [] });

    expect(res.status).toBe(200);
    expect(mealPlanModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
  });

  it("returns 400 when weekStart is missing", async () => {
    const res = await request(app)
      .post("/api/v1/meal-plan")
      .send({ days: [] });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when a meal type is invalid", async () => {
    const res = await request(app)
      .post("/api/v1/meal-plan")
      .send({
        weekStart: WEEK_START,
        days: [
          {
            date: "2026-06-09",
            meals: [{ type: "midnight_snack", servings: 1 }],
          },
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when more than 7 days are provided", async () => {
    const days = Array.from({ length: 8 }, (_, i) => ({
      date: `2026-06-0${i + 1}`,
      meals: [],
    }));
    const res = await request(app)
      .post("/api/v1/meal-plan")
      .send({ weekStart: WEEK_START, days });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

// ── GET /api/v1/meal-plan ──────────────────────────────────────────────────────

describe("GET /api/v1/meal-plan (current week)", () => {
  it("returns the current week plan", async () => {
    mealPlanModel.findOne.mockResolvedValue(MOCK_PLAN);

    const res = await request(app).get("/api/v1/meal-plan");

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe("plan001");
    expect(mealPlanModel.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user123" })
    );
  });

  it("returns 404 when no plan exists for current week", async () => {
    mealPlanModel.findOne.mockResolvedValue(null);

    const res = await request(app).get("/api/v1/meal-plan");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("MEAL_PLAN_NOT_FOUND");
  });
});

// ── GET /api/v1/meal-plan/week/:weekStart ─────────────────────────────────────

describe("GET /api/v1/meal-plan/week/:weekStart", () => {
  it("returns the plan for the specified week", async () => {
    mealPlanModel.findOne.mockResolvedValue(MOCK_PLAN);

    const res = await request(app).get(`/api/v1/meal-plan/week/${WEEK_START}`);

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe("plan001");
  });

  it("returns 404 when no plan found for that week", async () => {
    mealPlanModel.findOne.mockResolvedValue(null);

    const res = await request(app).get("/api/v1/meal-plan/week/2020-01-06");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("MEAL_PLAN_NOT_FOUND");
  });
});

// ── DELETE /api/v1/meal-plan/:id ──────────────────────────────────────────────

describe("DELETE /api/v1/meal-plan/:id", () => {
  it("deletes the plan and returns the deleted id", async () => {
    mealPlanModel.findOneAndDelete.mockResolvedValue(MOCK_PLAN);

    const res = await request(app).delete("/api/v1/meal-plan/plan001");

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("plan001");
    expect(mealPlanModel.findOneAndDelete).toHaveBeenCalledWith({
      _id: "plan001",
      userId: "user123",
    });
  });

  it("returns 404 when plan does not exist", async () => {
    mealPlanModel.findOneAndDelete.mockResolvedValue(null);

    const res = await request(app).delete("/api/v1/meal-plan/ghost");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("MEAL_PLAN_NOT_FOUND");
  });
});

// ── GET /api/v1/meal-plan/grocery-list ────────────────────────────────────────

describe("GET /api/v1/meal-plan/grocery-list", () => {
  it("generates a categorized grocery list from the current week's recipes", async () => {
    mealPlanModel.findOne.mockResolvedValue(MOCK_PLAN);
    recipeModel.find.mockResolvedValue([MOCK_RECIPE_1, MOCK_RECIPE_2]);

    const res = await request(app).get("/api/v1/meal-plan/grocery-list");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.categories).toBeInstanceOf(Array);

    // Verify chicken and oats appear somewhere in the categorized list
    const allItems = res.body.data.categories.flatMap((c) => c.items.map((i) => i.name.toLowerCase()));
    expect(allItems).toEqual(expect.arrayContaining(["oats", "chicken breast"]));
  });

  it("returns empty categories when no recipes are planned", async () => {
    const planNoRecipes = {
      ...MOCK_PLAN,
      days: [{ date: "2026-06-09", meals: [{ type: "breakfast", servings: 1 }] }],
    };
    mealPlanModel.findOne.mockResolvedValue(planNoRecipes);

    const res = await request(app).get("/api/v1/meal-plan/grocery-list");

    expect(res.status).toBe(200);
    expect(res.body.data.categories).toEqual([]);
  });

  it("returns 404 when no meal plan exists for current week", async () => {
    mealPlanModel.findOne.mockResolvedValue(null);

    const res = await request(app).get("/api/v1/meal-plan/grocery-list");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("MEAL_PLAN_NOT_FOUND");
  });

  it("scales ingredient quantities by servings planned vs recipe servings", async () => {
    // MOCK_PLAN has recipe002 planned for 2 servings, recipe002 itself has servings=2
    // So multiplier = 2/2 = 1x → chicken 200g, rice 150g
    mealPlanModel.findOne.mockResolvedValue({
      ...MOCK_PLAN,
      days: [{ date: "2026-06-09", meals: [{ type: "lunch", recipeId: "recipe002", servings: 4 }] }],
    });
    recipeModel.find.mockResolvedValue([MOCK_RECIPE_2]);

    const res = await request(app).get("/api/v1/meal-plan/grocery-list");

    expect(res.status).toBe(200);
    const allItems = res.body.data.categories.flatMap((c) => c.items);
    const chicken = allItems.find((i) => i.name.toLowerCase() === "chicken breast");
    // multiplier = 4 planned servings / 2 recipe servings = 2x → 200g * 2 = 400g
    expect(chicken.quantity).toBe(400);
  });
});
