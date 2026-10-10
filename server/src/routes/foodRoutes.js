
const express = require("express");
const Food = require("../models/Food");

const router = express.Router();

// GET: all food items
router.get("/", async (req, res) => {
  try {
    const foods = await Food.find().sort({ expiryDate: 1 });
    res.json({ success: true, count: foods.length, data: foods });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST: add food
router.post("/", async (req, res) => {
  try {
    const food = await Food.create(req.body);
    res.status(201).json({
      success: true,
      message: "Food item added successfully",
      data: food,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT: edit food or update quantity
router.put("/:id", async (req, res) => {
  try {
    const updates = { ...req.body };

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

    const food = await Food.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food item not found",
      });
    }

    res.json({
      success: true,
      message: "Food item updated successfully",
      data: food,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE: remove food
router.delete("/:id", async (req, res) => {
  try {
    const food = await Food.findByIdAndDelete(req.params.id);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food item not found",
      });
    }

    res.json({ success: true, message: "Food item deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
