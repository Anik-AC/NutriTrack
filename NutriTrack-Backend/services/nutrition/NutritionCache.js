import nutritionCacheModel from "../../models/nutritionCacheModel.js";

export const NutritionCache = {
  async getBySourceId(source, sourceId) {
    return nutritionCacheModel.findOne({ source, sourceId }).lean();
  },

  async getByBarcode(barcode) {
    if (!barcode) return null;
    return nutritionCacheModel.findOne({ barcode }).lean();
  },

  async getById(id) {
    return nutritionCacheModel.findById(id).lean();
  },

  async set(item) {
    const { source, sourceId, ...rest } = item;
    return nutritionCacheModel
      .findOneAndUpdate(
        { source, sourceId },
        { source, sourceId, ...rest, cachedAt: new Date() },
        { upsert: true, new: true, lean: true }
      )
      .catch(() => null);
  },

  async setMany(items) {
    if (items.length === 0) return;
    const ops = items.map((item) => ({
      updateOne: {
        filter: { source: item.source, sourceId: item.sourceId },
        update: { $set: { ...item, cachedAt: new Date() } },
        upsert: true,
      },
    }));
    return nutritionCacheModel.bulkWrite(ops).catch(() => null);
  },
};
