/**
 * NutritionService tests — fully mocked (no MongoMemoryServer, no network).
 *
 * NutritionCache is mocked at the module level so the service tests exercise
 * only provider selection, fallback logic, deduplication, and pagination.
 * Providers are spied on per-test using jest.spyOn / jest.restoreAllMocks.
 */

jest.mock("../services/nutrition/NutritionCache.js", () => ({
  NutritionCache: {
    getBySourceId: jest.fn().mockResolvedValue(null),
    getByBarcode: jest.fn().mockResolvedValue(null),
    getById: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue({}),
    setMany: jest.fn().mockResolvedValue(null),
  },
}));

import { NutritionService } from "../services/nutrition/NutritionService.js";
import { USDAProvider } from "../services/nutrition/providers/USDAProvider.js";
import { OpenFoodFactsProvider } from "../services/nutrition/providers/OpenFoodFactsProvider.js";
import { EdamamProvider } from "../services/nutrition/providers/EdamamProvider.js";
import { NutritionixProvider } from "../services/nutrition/providers/NutritionixProvider.js";
import { NutritionCache } from "../services/nutrition/NutritionCache.js";

const USDA_ITEM = {
  source: "usda",
  sourceId: "123",
  name: "Banana, raw",
  servingSize: 100,
  servingUnit: "g",
  nutrients: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
};

const OFF_ITEM = {
  source: "openfoodfacts",
  sourceId: "abc",
  name: "Organic Banana",
  barcode: "012345678905",
  servingSize: 100,
  servingUnit: "g",
  nutrients: { calories: 90, protein: 1.0, carbs: 22, fat: 0.2 },
};

const EDAMAM_ITEM = {
  source: "edamam",
  sourceId: "food_xyz",
  name: "Egg, whole",
  servingSize: 50,
  servingUnit: "large",
  nutrients: { calories: 71, protein: 6.3, carbs: 0.4, fat: 4.8 },
};

describe("NutritionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    NutritionCache.getByBarcode.mockResolvedValue(null);
    NutritionCache.getById.mockResolvedValue(null);
    NutritionCache.set.mockResolvedValue({});
    NutritionCache.setMany.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── search ──────────────────────────────────────────────────────────────────

  describe("search()", () => {
    it("returns USDA results and does NOT call OFacts when USDA >= 3", async () => {
      const usdaResults = [0, 1, 2].map((i) => ({ ...USDA_ITEM, sourceId: String(i) }));
      jest.spyOn(USDAProvider, "search").mockResolvedValue(usdaResults);
      const offSpy = jest.spyOn(OpenFoodFactsProvider, "search");

      const results = await NutritionService.search("banana");

      expect(USDAProvider.search).toHaveBeenCalledWith("banana", 20);
      expect(offSpy).not.toHaveBeenCalled();
      expect(results).toHaveLength(3);
      expect(results[0].source).toBe("usda");
    });

    it("calls OFacts when USDA returns fewer than 3 results", async () => {
      jest.spyOn(USDAProvider, "search").mockResolvedValue([USDA_ITEM]);
      jest.spyOn(OpenFoodFactsProvider, "search").mockResolvedValue([OFF_ITEM]);

      const results = await NutritionService.search("banana");

      expect(OpenFoodFactsProvider.search).toHaveBeenCalled();
      expect(results).toHaveLength(2);
    });

    it("deduplicates items with same source + sourceId", async () => {
      jest.spyOn(USDAProvider, "search").mockResolvedValue([USDA_ITEM, USDA_ITEM]);
      jest.spyOn(OpenFoodFactsProvider, "search").mockResolvedValue([]);

      const results = await NutritionService.search("banana");
      expect(results).toHaveLength(1);
    });

    it("does not include cross-source duplicates as duplicates", async () => {
      const sameNameDifferentSource = { ...OFF_ITEM, sourceId: "123" }; // same sourceId, different source
      jest.spyOn(USDAProvider, "search").mockResolvedValue([USDA_ITEM]);
      jest.spyOn(OpenFoodFactsProvider, "search").mockResolvedValue([sameNameDifferentSource]);

      const results = await NutritionService.search("banana");
      expect(results).toHaveLength(2); // usda:123 and openfoodfacts:123 are different
    });

    it("uses Nutritionix deprecated fallback when all primary providers return nothing", async () => {
      jest.spyOn(USDAProvider, "search").mockResolvedValue([]);
      jest.spyOn(OpenFoodFactsProvider, "search").mockResolvedValue([]);
      jest.spyOn(NutritionixProvider, "available").mockReturnValue(true);
      jest.spyOn(NutritionixProvider, "search").mockResolvedValue([
        { ...USDA_ITEM, source: "nutritionix" },
      ]);

      const results = await NutritionService.search("banana");
      expect(NutritionixProvider.search).toHaveBeenCalled();
      expect(results[0].source).toBe("nutritionix");
    });

    it("does NOT call Nutritionix when it is not available", async () => {
      jest.spyOn(USDAProvider, "search").mockResolvedValue([]);
      jest.spyOn(OpenFoodFactsProvider, "search").mockResolvedValue([]);
      jest.spyOn(NutritionixProvider, "available").mockReturnValue(false);
      const nixSpy = jest.spyOn(NutritionixProvider, "search");

      await NutritionService.search("banana");
      expect(nixSpy).not.toHaveBeenCalled();
    });

    it("slices results per page/limit", async () => {
      const items = Array.from({ length: 10 }, (_, i) => ({
        ...USDA_ITEM,
        sourceId: String(i),
        name: `Food ${i}`,
      }));
      jest.spyOn(USDAProvider, "search").mockResolvedValue(items);
      jest.spyOn(OpenFoodFactsProvider, "search").mockResolvedValue([]);

      const page1 = await NutritionService.search("food", 1, 3);
      const page2 = await NutritionService.search("food", 2, 3);

      expect(page1).toHaveLength(3);
      expect(page2).toHaveLength(3);
      expect(page1[0].name).not.toBe(page2[0].name);
    });
  });

  // ── barcode ──────────────────────────────────────────────────────────────────

  describe("barcode()", () => {
    it("returns cached item without calling any provider", async () => {
      NutritionCache.getByBarcode.mockResolvedValue(OFF_ITEM);
      const offSpy = jest.spyOn(OpenFoodFactsProvider, "barcode");

      const result = await NutritionService.barcode("012345678905");

      expect(offSpy).not.toHaveBeenCalled();
      expect(result).toBe(OFF_ITEM);
    });

    it("calls OFacts on cache miss, returns result without calling USDA", async () => {
      jest.spyOn(OpenFoodFactsProvider, "barcode").mockResolvedValue(OFF_ITEM);
      const usdaSpy = jest.spyOn(USDAProvider, "barcode");

      const result = await NutritionService.barcode("012345678905");

      expect(OpenFoodFactsProvider.barcode).toHaveBeenCalledWith("012345678905");
      expect(usdaSpy).not.toHaveBeenCalled();
      expect(result.source).toBe("openfoodfacts");
    });

    it("falls back to USDA when OFacts returns null", async () => {
      jest.spyOn(OpenFoodFactsProvider, "barcode").mockResolvedValue(null);
      jest.spyOn(USDAProvider, "barcode").mockResolvedValue(USDA_ITEM);

      const result = await NutritionService.barcode("012345678905");

      expect(USDAProvider.barcode).toHaveBeenCalled();
      expect(result.source).toBe("usda");
    });

    it("returns null when both providers return null", async () => {
      jest.spyOn(OpenFoodFactsProvider, "barcode").mockResolvedValue(null);
      jest.spyOn(USDAProvider, "barcode").mockResolvedValue(null);

      const result = await NutritionService.barcode("000000000000");
      expect(result).toBeNull();
    });

    it("caches item after a successful provider lookup", async () => {
      jest.spyOn(OpenFoodFactsProvider, "barcode").mockResolvedValue(OFF_ITEM);

      await NutritionService.barcode("012345678905");

      expect(NutritionCache.set).toHaveBeenCalledWith(OFF_ITEM);
    });

    it("does not call NutritionCache.set when both providers return null", async () => {
      jest.spyOn(OpenFoodFactsProvider, "barcode").mockResolvedValue(null);
      jest.spyOn(USDAProvider, "barcode").mockResolvedValue(null);

      await NutritionService.barcode("000000000000");

      expect(NutritionCache.set).not.toHaveBeenCalled();
    });
  });

  // ── parse ────────────────────────────────────────────────────────────────────

  describe("parse()", () => {
    it("returns Edamam results and does not call Nutritionix", async () => {
      jest.spyOn(EdamamProvider, "parse").mockResolvedValue([EDAMAM_ITEM]);
      const nixSpy = jest.spyOn(NutritionixProvider, "parse");

      const results = await NutritionService.parse("2 eggs");

      expect(EdamamProvider.parse).toHaveBeenCalledWith("2 eggs");
      expect(nixSpy).not.toHaveBeenCalled();
      expect(results).toHaveLength(1);
      expect(results[0].source).toBe("edamam");
    });

    it("falls back to Nutritionix when Edamam returns empty", async () => {
      jest.spyOn(EdamamProvider, "parse").mockResolvedValue([]);
      jest.spyOn(NutritionixProvider, "available").mockReturnValue(true);
      jest.spyOn(NutritionixProvider, "parse").mockResolvedValue([
        { ...EDAMAM_ITEM, source: "nutritionix" },
      ]);

      const results = await NutritionService.parse("2 eggs");

      expect(NutritionixProvider.parse).toHaveBeenCalled();
      expect(results[0].source).toBe("nutritionix");
    });

    it("returns empty array when all providers return nothing", async () => {
      jest.spyOn(EdamamProvider, "parse").mockResolvedValue([]);
      jest.spyOn(NutritionixProvider, "available").mockReturnValue(false);

      const results = await NutritionService.parse("xyzzy food");
      expect(results).toEqual([]);
    });
  });

  // ── getFood ──────────────────────────────────────────────────────────────────

  describe("getFood()", () => {
    it("delegates to NutritionCache.getById and returns the item", async () => {
      NutritionCache.getById.mockResolvedValue(USDA_ITEM);

      const result = await NutritionService.getFood("some-id");

      expect(NutritionCache.getById).toHaveBeenCalledWith("some-id");
      expect(result).toBe(USDA_ITEM);
    });

    it("returns null when cache has no entry for the given id", async () => {
      NutritionCache.getById.mockResolvedValue(null);

      const result = await NutritionService.getFood("unknown-id");
      expect(result).toBeNull();
    });
  });
});
