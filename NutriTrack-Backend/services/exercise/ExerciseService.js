import { exerciseModel } from "../../models/index.js";

const WGER_BASE = "https://wger.de/api/v2/exerciseinfo/";

const WGER_CATEGORY_MAP = {
  10: "core", 8: "arms", 12: "back", 14: "legs",
  11: "chest", 9: "legs", 13: "shoulders",
};

const WGER_EQUIPMENT_MAP = {
  0: "other", 1: "barbell", 2: "barbell", 3: "dumbbell",
  4: "bodyweight", 5: "bodyweight", 6: "bodyweight", 7: "bodyweight",
  8: "band", 9: "cable", 10: "machine",
};

const MUSCLE_TO_WGER_CAT = {
  chest: 11, back: 12, shoulders: 13, arms: 8, core: 10, legs: "9",
};

function parseWgerExercise(raw) {
  const engTrans = raw.translations?.find((t) => t.language === 2);
  if (!engTrans?.name?.trim()) return null;

  const desc = (engTrans.description ?? "").replace(/<[^>]+>/g, " ");
  const instructions = desc
    .split(/\n|\. /)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  return {
    source: "wger",
    sourceId: String(raw.id),
    name: engTrans.name.trim(),
    muscleGroup: WGER_CATEGORY_MAP[raw.category?.id] ?? "other",
    secondaryMuscles: (raw.muscles_secondary ?? []).map((m) => m.name_en ?? m.name).filter(Boolean),
    equipment: WGER_EQUIPMENT_MAP[raw.equipment?.[0]?.id] ?? "other",
    instructions,
    imageUrl: null,
    gifUrl: null,
  };
}

export class ExerciseService {
  async search({ q, muscleGroup, equipment, limit = 20 } = {}) {
    const cacheFilter = {};
    if (q) cacheFilter.name = { $regex: q, $options: "i" };
    if (muscleGroup) cacheFilter.muscleGroup = muscleGroup;
    if (equipment) cacheFilter.equipment = equipment;

    const cached = await exerciseModel.find(cacheFilter).limit(limit).lean();
    if (cached.length >= Math.min(limit, 5)) return cached;

    try {
      const params = new URLSearchParams({ format: "json", language: "2", limit: String(limit) });
      if (q) params.append("name", q);
      if (muscleGroup && MUSCLE_TO_WGER_CAT[muscleGroup]) {
        params.append("category", String(MUSCLE_TO_WGER_CAT[muscleGroup]));
      }

      const resp = await fetch(`${WGER_BASE}?${params}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!resp.ok) return cached;

      const data = await resp.json();
      const exercises = (data.results ?? []).map(parseWgerExercise).filter(Boolean);

      // Cache in background — don't await
      exercises.forEach((ex) =>
        exerciseModel
          .findOneAndUpdate(
            { source: ex.source, sourceId: ex.sourceId },
            { $set: { ...ex, cachedAt: new Date() } },
            { upsert: true, new: true }
          )
          .catch(() => null)
      );

      return exercises;
    } catch {
      return cached;
    }
  }

  async getById(id) {
    return exerciseModel.findById(id).lean();
  }
}

export const exerciseService = new ExerciseService();
