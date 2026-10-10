
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

      if (updates.quantity === 0) {
        updates.consumed = true;
      } else {
        updates.consumed = false;
      }
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
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});
