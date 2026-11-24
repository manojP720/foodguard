
import mongoose from "mongoose";

const notificationLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    food: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Food",
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    reminderDays: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

notificationLogSchema.index(
  { user: 1, food: 1, expiryDate: 1, reminderDays: 1 },
  { unique: true }
);

export default mongoose.model("NotificationLog", notificationLogSchema);
