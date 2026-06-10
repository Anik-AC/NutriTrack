/**
 * Recipe API — integration tests.
 *
 * Strategy: real controller logic runs against mocked Mongoose model methods
 * (no MongoMemoryServer needed). Auth middleware is stubbed to inject a fixed
 * mock user. NutritionCache is mocked so auto-nutrient calculation is testable
 * without a live DB.  fetch() is spied on for the URL-import tests.
 */

import request from "supertest";
import express from "express";
import recipeRouter from "../routes/recipeRoutes.js";
import { notFoundHandler, errorHandler } from "../middleware/errorHandler.js";

// ── module mocks ────────────────────────────────────────────────────────────────

jest.mock("../middleware/authMiddleware.js", () => ({
  authMiddleware: jest.fn((req, _res, next) => {
    req.user = { id: "user123", role: "customer" };
    next();
  }),
}));

jest.mock("../models/index.js", () => ({
  recipeModel: {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
    countDocuments: jest.fn(),
  },
  trackingModel: { create: jest.fn() },
}));

jest.mock("../services/nutrition/NutritionCache.js", () => ({
  NutritionCache: { getById: jest.fn() },
}));

// ── app setup ──────────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());
app.use("/api/v1/recipes", recipeRouter);
app.use(notFoundHandler);
app.use(errorHandler);

// ── mock data ──────────────────────────────────────────────────────────────────

const MOCK_RECIPE = {
  _id: "recipe001",
  userId: "user123",
  title: "Chicken Rice Bowl",
  description: "Simple and nutritious bowl",
  servings: 2,
  prepTime: 10,
  cookTime: 20,
  tags: ["high-protein", "meal-prep"],
  ingredients: [
    { name: "Chicken breast", quantity: 200, unit: "g" },
    { name: "White rice", quantity: 100, unit: "g" },
  ],
  instructions: ["Cook rice", "Grill chicken", "Assemble bowl"],
  nutrientsPerServing: { calories: 450, protein: 42, carbs: 38, fat: 8 },
  source: "manual",
  isFavorite: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ── helpers ────────────────────────────────────────────────────────────────────

// Returns a chainable mock for recipeModel.find().sort().skip().limit()
function mockFindChain(results) {
  const chain = { sort: jest.fn(), skip: jest.fn(), limit: jest.fn() };
  chain.sort.mockReturnValue(chain);
  chain.skip.mockReturnValue(chain);
  chain.limit.mockReturnValue(Promise.resolve(results));
  return chain;
}

// Destructure fresh mock references after each test
let recipeModel, trackingModel, NutritionCache;

beforeEach(async () => {
  jest.clearAllMocks();
  const models = await import("../models/index.js");
  recipeModel = models.recipeModel;
  trackingModel = models.trackingModel;
  const nc = await import("../services/nutrition/NutritionCache.js");
  NutritionCache = nc.NutritionCache;
});

// ── POST /api/v1/recipes ───────────────────────────────────────────────────────

describe("POST /api/v1/recipes", () => {
  it("creates a recipe and returns 201 with the new record", async () => {
    recipeModel.create.mockResolvedValue(MOCK_RECIPE);

    const res = await request(app)
      .post("/api/v1/recipes")
      .send({
        title: "Chicken Rice Bowl",
        servings: 2,
        ingredients: [{ name: "Chicken breast", quantity: 200, unit: "g" }],
        instructions: ["Cook chicken"],
        nutrientsPerServing: { calories: 450, protein: 42, carbs: 38, fat: 8 },
        tags: ["high-protein"],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("Chicken Rice Bowl");
    expect(recipeModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Chicken Rice Bowl", userId: "user123" })
    );
  });

  it("returns 400 when title is missing", async () => {
    const res = await request(app)
      .post("/api/v1/recipes")
      .send({ servings: 2 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when servings is missing", async () => {
    const res = await request(app)
      .post("/api/v1/recipes")
      .send({ title: "No Servings Recipe" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("auto-calculates nutrients when ingredient has foodItemId and no nutrientsPerServing provided", async () => {
    NutritionCache.getById.mockResolvedValue({
      servingSize: 100,
      nutrients: { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
    });
    recipeModel.create.mockResolvedValue({ ...MOCK_RECIPE, title: "Auto Calc Recipe" });

    const res = await request(app)
      .post("/api/v1/recipes")
      .send({
        title: "Auto Calc Recipe",
        servings: 1,
        ingredients: [{ name: "Chicken breast", foodItemId: "cache001", quantity: 200, unit: "g" }],
        instructions: [],
      });

    expect(res.status).toBe(201);
    expect(NutritionCache.getById).toHaveBeenCalledWith("cache001");
    expect(recipeModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nutrientsPerServing: expect.objectContaining({ calories: expect.any(Number) }),
      })
    );
  });
});

// ── GET /api/v1/recipes ────────────────────────────────────────────────────────

describe("GET /api/v1/recipes", () => {
  it("returns paginated list of recipes", async () => {
    recipeModel.find.mockReturnValue(mockFindChain([MOCK_RECIPE]));
    recipeModel.countDocuments.mockResolvedValue(1);

    const res = await request(app).get("/api/v1/recipes");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recipes).toHaveLength(1);
    expect(res.body.data.total).toBe(1);
    expect(res.body.data.page).toBe(1);
  });

  it("returns empty list when no recipes exist", async () => {
    recipeModel.find.mockReturnValue(mockFindChain([]));
    recipeModel.countDocuments.mockResolvedValue(0);

    const res = await request(app).get("/api/v1/recipes");

    expect(res.status).toBe(200);
    expect(res.body.data.recipes).toHaveLength(0);
    expect(res.body.data.total).toBe(0);
    expect(res.body.data.pages).toBe(0);
  });

  it("passes tag filter to the DB query", async () => {
    recipeModel.find.mockReturnValue(mockFindChain([MOCK_RECIPE]));
    recipeModel.countDocuments.mockResolvedValue(1);

    await request(app).get("/api/v1/recipes?tags=high-protein");

    expect(recipeModel.find).toHaveBeenCalledWith(
      expect.objectContaining({ tags: { $in: ["high-protein"] } })
    );
  });

  it("passes search filter to the DB query", async () => {
    recipeModel.find.mockReturnValue(mockFindChain([]));
    recipeModel.countDocuments.mockResolvedValue(0);

    await request(app).get("/api/v1/recipes?search=chicken");

    expect(recipeModel.find).toHaveBeenCalledWith(
      expect.objectContaining({ title: { $regex: "chicken", $options: "i" } })
    );
  });

  it("coerces page and limit from strings", async () => {
    recipeModel.find.mockReturnValue(mockFindChain([]));
    recipeModel.countDocuments.mockResolvedValue(0);

    const res = await request(app).get("/api/v1/recipes?page=2&limit=5");

    expect(res.status).toBe(200);
    expect(res.body.data.page).toBe(2);
    expect(res.body.data.limit).toBe(5);
  });
});

// ── GET /api/v1/recipes/:id ────────────────────────────────────────────────────

describe("GET /api/v1/recipes/:id", () => {
  it("returns the recipe when it exists and belongs to the user", async () => {
    recipeModel.findOne.mockResolvedValue(MOCK_RECIPE);

    const res = await request(app).get("/api/v1/recipes/recipe001");

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe("recipe001");
    expect(recipeModel.findOne).toHaveBeenCalledWith({
      _id: "recipe001",
      userId: "user123",
    });
  });

  it("returns 404 when recipe does not exist", async () => {
    recipeModel.findOne.mockResolvedValue(null);

    const res = await request(app).get("/api/v1/recipes/nonexistent");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("RECIPE_NOT_FOUND");
  });
});

// ── PUT /api/v1/recipes/:id ────────────────────────────────────────────────────

describe("PUT /api/v1/recipes/:id", () => {
  it("updates the recipe and returns updated record", async () => {
    const updated = { ...MOCK_RECIPE, title: "Updated Bowl" };
    recipeModel.findOneAndUpdate.mockResolvedValue(updated);

    const res = await request(app)
      .put("/api/v1/recipes/recipe001")
      .send({ title: "Updated Bowl", servings: 2 });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Updated Bowl");
    expect(recipeModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: "recipe001", userId: "user123" },
      expect.objectContaining({ title: "Updated Bowl" }),
      expect.objectContaining({ new: true })
    );
  });

  it("returns 404 when recipe to update does not belong to user", async () => {
    recipeModel.findOneAndUpdate.mockResolvedValue(null);

    const res = await request(app)
      .put("/api/v1/recipes/other-recipe")
      .send({ title: "Stolen Recipe", servings: 1 });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("RECIPE_NOT_FOUND");
  });
});

// ── DELETE /api/v1/recipes/:id ─────────────────────────────────────────────────

describe("DELETE /api/v1/recipes/:id", () => {
  it("deletes the recipe and returns the deleted id", async () => {
    recipeModel.findOneAndDelete.mockResolvedValue(MOCK_RECIPE);

    const res = await request(app).delete("/api/v1/recipes/recipe001");

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("recipe001");
    expect(recipeModel.findOneAndDelete).toHaveBeenCalledWith({
      _id: "recipe001",
      userId: "user123",
    });
  });

  it("returns 404 when recipe does not exist", async () => {
    recipeModel.findOneAndDelete.mockResolvedValue(null);

    const res = await request(app).delete("/api/v1/recipes/ghost");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("RECIPE_NOT_FOUND");
  });
});

// ── POST /api/v1/recipes/:id/log ──────────────────────────────────────────────

describe("POST /api/v1/recipes/:id/log", () => {
  it("logs the recipe as a tracking entry", async () => {
    recipeModel.findOne.mockResolvedValue(MOCK_RECIPE);
    trackingModel.create.mockResolvedValue({ _id: "track001" });

    const res = await request(app)
      .post("/api/v1/recipes/recipe001/log")
      .send({ servings: 1, eatenWhen: "lunch" });

    expect(res.status).toBe(200);
    expect(res.body.data.logged).toBe(true);
    expect(res.body.data.recipe).toBe("Chicken Rice Bowl");
    expect(trackingModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user123",
        foodName: "Chicken Rice Bowl",
        eatenWhen: "lunch",
        source: "custom",
      })
    );
  });

  it("returns 404 when recipe not found", async () => {
    recipeModel.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/v1/recipes/ghost/log")
      .send({ servings: 1, eatenWhen: "dinner" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("RECIPE_NOT_FOUND");
  });

  it("returns 400 when eatenWhen is invalid", async () => {
    const res = await request(app)
      .post("/api/v1/recipes/recipe001/log")
      .send({ servings: 1, eatenWhen: "midnight snack" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when servings is missing", async () => {
    const res = await request(app)
      .post("/api/v1/recipes/recipe001/log")
      .send({ eatenWhen: "breakfast" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

// ── POST /api/v1/recipes/import/url ───────────────────────────────────────────

const SCHEMA_ORG_HTML = `
<html>
<head>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "name": "Classic Pancakes",
    "description": "Fluffy breakfast pancakes",
    "recipeYield": "4",
    "prepTime": "PT5M",
    "cookTime": "PT15M",
    "recipeIngredient": ["2 cups flour", "1 egg", "1 cup milk"],
    "recipeInstructions": [
      { "@type": "HowToStep", "text": "Mix dry ingredients" },
      { "@type": "HowToStep", "text": "Add wet ingredients" }
    ],
    "recipeCategory": "Breakfast"
  }
  </script>
</head>
</html>`;

describe("POST /api/v1/recipes/import/url", () => {
  it("extracts a recipe from a page with schema.org JSON-LD", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(SCHEMA_ORG_HTML),
    });

    const res = await request(app)
      .post("/api/v1/recipes/import/url")
      .send({ url: "https://example.com/pancakes" });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe("Classic Pancakes");
    expect(res.body.data.servings).toBe(4);
    expect(res.body.data.prepTime).toBe(5);
    expect(res.body.data.cookTime).toBe(15);
    expect(res.body.data.ingredients).toHaveLength(3);
    expect(res.body.data.source).toBe("url_import");
  });

  it("returns 422 when the page has no recipe schema", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("<html><body>No recipe here</body></html>"),
    });

    const res = await request(app)
      .post("/api/v1/recipes/import/url")
      .send({ url: "https://example.com/not-a-recipe" });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("NO_RECIPE_SCHEMA");
  });

  it("returns 502 when the URL is unreachable", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("ECONNREFUSED"));

    const res = await request(app)
      .post("/api/v1/recipes/import/url")
      .send({ url: "https://example.com/unreachable" });

    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe("FETCH_FAILED");
  });

  it("returns 400 when url is not a valid URL", async () => {
    const res = await request(app)
      .post("/api/v1/recipes/import/url")
      .send({ url: "not-a-url" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

// ── POST /api/v1/recipes/import/image (Phase 8 stub) ──────────────────────────

describe("POST /api/v1/recipes/import/image", () => {
  it("returns 501 not implemented", async () => {
    const res = await request(app).post("/api/v1/recipes/import/image");
    expect(res.status).toBe(501);
    expect(res.body.error.code).toBe("NOT_IMPLEMENTED");
  });
});

// ── POST /api/v1/recipes/import/youtube (Phase 8 stub) ────────────────────────

describe("POST /api/v1/recipes/import/youtube", () => {
  it("returns 501 not implemented", async () => {
    const res = await request(app)
      .post("/api/v1/recipes/import/youtube")
      .send({ url: "https://youtube.com/watch?v=abc123" });
    expect(res.status).toBe(501);
    expect(res.body.error.code).toBe("NOT_IMPLEMENTED");
  });
});
