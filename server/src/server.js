
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const foodRoutes = require("./routes/foodRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "FoodGuard API is running 🚀",
  });
});

app.use("/api/foods", foodRoutes);

// Start server after database connects
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`FoodGuard API running on http://localhost:${PORT}`);
  });
};

startServer();
