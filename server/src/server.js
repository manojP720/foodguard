const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "FoodGuard API is running 🚀",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`FoodGuard API running on http://localhost:${PORT}`);
});
