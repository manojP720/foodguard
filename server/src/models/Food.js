
const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
     user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true,
},
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      default: "Other",
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      default: "pieces",
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    storageLocation: {
      type: String,
      default: "Pantry",
    },
    notes: {
      type: String,
      default: "",
    },
    consumed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Food", foodSchema);
