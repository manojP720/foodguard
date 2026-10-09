
const express = require("express");
const Food = require("../models/Food");

const router = express.Router();

// Get all food items
router.get("/", async (req, res) => {
  try {
    const foods = await Food.find().sort({ expiryDate: 1 });
    res.json({ success: true, count: foods.length, data: foods });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add food item
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

// Update food item
router.put("/:id", async (req, res) => {
  try {
    const food = await Food.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food item not found",
      });
    }

    res.json({ success: true, data: food });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete food item
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
