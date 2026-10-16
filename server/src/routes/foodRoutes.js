
const express = require("express");
const mongoose = require("mongoose");
const Food = require("../models/Food");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// All food routes require login
router.use(authMiddleware);

// Fields users are allowed to create or update
const allowedFields = [
  "name",
  "category",
  "quantity",
  "unit",
  "purchaseDate",
  "expiryDate",
  "storageLocation",
  "notes",
  "consumed",
];

function pickAllowedFields(body) {
  const result = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      result[field] = body[field];
    }
  }

  return result;
}

// GET: only this user's food
router.get("/", async (req, res) => {
  try {
    const foods = await Food.find({ user: req.user.id })
      .sort({ expiryDate: 1 });

    res.json({
      success: true,
      count: foods.length,
      data: foods,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not fetch food items.",
    });
  }
});

// POST: add food to this user's account
router.post("/", async (req, res) => {
  try {
    const foodData = pickAllowedFields(req.body);

    const food = await Food.create({
      ...foodData,
      user: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Food item added successfully.",
      data: food,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Could not add food item. Check the entered details.",
    });
  }
});

// PUT: update only this user's food
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid food item ID.",
      });
    }

    const updates = pickAllowedFields(req.body);

    if (updates.quantity !== undefined) {
      updates.quantity = Number(updates.quantity);

      if (!Number.isFinite(updates.quantity) || updates.quantity < 0) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be zero or greater.",
        });
      }

      updates.consumed = updates.quantity === 0;
    }

    const food = await Food.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      updates,
      { new: true, runValidators: true }
    );

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food item not found.",
      });
    }

    res.json({
      success: true,
      message: "Food item updated successfully.",
      data: food,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Could not update food item.",
    });
  }
});

// DELETE: delete only this user's food
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid food item ID.",
      });
    }

    const food = await Food.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food item not found.",
      });
    }

    res.json({
      success: true,
      message: "Food item deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not delete food item.",
    });
  }
});

module.exports = router;
