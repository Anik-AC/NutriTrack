import { trackingModel, customFoodModel} from "../models/index.js";

/**
 * Normalizes a UnifiedFoodItem payload (from /api/v1/nutrition/*) to the shape
 * expected by trackingModel. Legacy payloads (with `details` already set) pass through unchanged.
 */
function normalizeTrackPayload(body) {
  // Legacy format: body already has foodName + details — pass through
  if (body.details) return body;

  // UnifiedFoodItem format: body has `name` + `nutrients`
  if (body.nutrients) {
    return {
      userId: body.userId,
      foodName: body.name,
      details: {
        calories: body.nutrients.calories ?? 0,
        protein: body.nutrients.protein ?? 0,
        carbohydrates: body.nutrients.carbs ?? 0,
        fat: body.nutrients.fat ?? 0,
        fiber: body.nutrients.fiber,
      },
      quantity: body.quantity ?? 1,
      servingUnit: body.servingUnit ?? "serving",
      eatenWhen: body.eatenWhen,
      eatenDate: body.eatenDate,
      source: body.source ?? "legacy",
      sourceId: body.sourceId,
    };
  }

  return body;
}

export const trackfoodItem = async (req, res) => {
  let trackData = normalizeTrackPayload(req.body);

  try {
    let data = await trackingModel.create(trackData);
    res.status(201).send({ success: true, message: "Food Added" });
  } catch (err) {
    res
      .status(500)
      .send({ failure: true, message: "Some Problem in adding the food" });
  }
};

export const getMealsConsumed = async (req, res) => {
  const getTodayDate = new Date().toLocaleDateString('en-CA');
  try {
    const mealsConsumed = await trackingModel
      .find({ eatenDate: getTodayDate, userId: req.user.id })
      .select("foodName details eatenWhen source sourceId");
    if (mealsConsumed.length != 0) {
      res.send({ success: true, data: mealsConsumed });
    } else {
      res
        .status(404)
        .send({ failure: true, message: "No meals consumed for today" });
    }
  } catch (err) {
    res
      .status(500)
      .send({ failure: true, message: "Error in retreiving data" });
  }
};
export const addCustomFoodItem = async (req, res) => {
  let customFood = req.body;

  try {
    let data = await customFoodModel.create(customFood);
    res
      .status(201)
      .send({ success: true, message: "Custom food Added", data: data });
  } catch (err) {
    res
      .status(500)
      .send({ failure: true, message: "Some Problem in adding custom food" });
  }
};

export const getCustomFoods = async (req, res) => {
  console.log(req.user);
  try {
    const customFoods = await customFoodModel
      .find({ userId: req.user.id })
      .select("foodName details serving_unit serving_weight_grams"); // Select only relevant fields

    if (customFoods.length !== 0) {
      res.send({ success: true, data: customFoods });
    } else {
      res.status(404).send({ failure: true, message: "No custom meals found" });
    }
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .send({ failure: true, message: "Error in retrieving data" });
  }
};
export const updateCustomFoodItem = async (req, res) => {
  const { id } = req.params; // Food item ID from URL parameters
  const updatedFoodData = req.body; // Updated data from request body
  const userId = req.user.id; // User ID from authMiddleware

  try {
    // Find and update the food item by both ID and userId
    const updatedFood = await customFoodModel.findOneAndUpdate(
      { _id: id, userId: userId }, // Match both food ID and user ID
      updatedFoodData,
      { new: true, runValidators: true } // Return updated document, run schema validation
    );

    if (!updatedFood) {
      return res.status(404).send({
        failure: true,
        message: "Custom food item not found or you don’t have permission to update it",
      });
    }

    res.status(200).send({
      success: true,
      message: "Custom food updated successfully",
      data: updatedFood,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      failure: true,
      message: "Some problem in updating custom food",
    });
  }
};

export const deleteCustomFoodItem = async (req, res) => {
  const { id } = req.params; // Food item ID from URL parameters
  const userId = req.user.id; // User ID from authMiddleware

  try {
    // Find and delete the food item by both ID and userId
    const deletedFood = await customFoodModel.findOneAndDelete({
      _id: id,
      userId: userId, // Match both food ID and user ID
    });

    if (!deletedFood) {
      return res.status(404).send({
        failure: true,
        message: "Custom food item not found or you don’t have permission to delete it",
      });
    }

    res.status(200).send({
      success: true,
      message: "Custom food deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      failure: true,
      message: "Some problem in deleting custom food",
    });
  }
}