
const mongoose = require("mongoose");
const dns = require("node:dns");

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);
 } catch (error) {
  console.error("MongoDB connection failed:", error.message);
  console.error("Error code:", error.code);
  console.error("Error name:", error.name);
  process.exit(1);
}
};

module.exports = connectDB;
