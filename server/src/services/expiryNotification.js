
import cron from "node-cron";
import Food from "../models/Food.js";
import User from "../models/User.js";
import NotificationLog from "../models/NotificationLog.js";
import { sendEmail } from "../utils/emailService.js";

function getIndiaDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function getDaysDifference(today, expiry) {
  const [y1, m1, d1] = today.split("-").map(Number);
  const [y2, m2, d2] = expiry.split("-").map(Number);

  return Math.round(
    (Date.UTC(y2, m2 - 1, d2) -
      Date.UTC(y1, m1 - 1, d1)) / 86400000
  );
}

export async function runExpiryNotifications() {
  const today = getIndiaDate();

  const foods = await Food.find({
    consumed: false,
    quantity: { $gt: 0 },
  }).lean();

  const remindersByUser = new Map();

  for (const food of foods) {
    if (!food.expiryDate || !food.user) continue;

    const expiry = new Date(food.expiryDate)
      .toISOString()
      .slice(0, 10);

    const daysLeft = getDaysDifference(today, expiry);

    if (![7, 3, 1, 0].includes(daysLeft)) continue;

    const alreadySent = await NotificationLog.findOne({
      user: food.user,
      food: food._id,
      expiryDate: food.expiryDate,
      reminderDays: daysLeft,
    });

    if (alreadySent) continue;

    const userId = food.user.toString();

    if (!remindersByUser.has(userId)) {
      remindersByUser.set(userId, []);
    }

    remindersByUser.get(userId).push({
      food,
      daysLeft,
      expiryDate: expiry,
    });
  }

  for (const [userId, reminders] of remindersByUser) {
    const user = await User.findById(userId).lean();

    if (!user?.email) continue;

    const rows = reminders.map(({ food, daysLeft, expiryDate }) => {
      const status =
        daysLeft === 0
          ? "Expires today"
          : `Expires in ${daysLeft} day(s)`;

      return `
        <tr>
          <td style="padding:10px;border:1px solid #ddd;">
            ${food.name}
          </td>
          <td style="padding:10px;border:1px solid #ddd;">
            ${expiryDate}
          </td>
          <td style="padding:10px;border:1px solid #ddd;">
            ${status}
          </td>
        </tr>
      `;
    }).join("");

    try {
      await sendEmail({
        to: user.email,
        subject: "FoodGuard - Food Expiry Reminder",
        text: reminders.map(({ food, daysLeft, expiryDate }) =>
          `${food.name} - ${daysLeft === 0 ? "Expires today" : `Expires in ${daysLeft} days`} (${expiryDate})`
        ).join("\n"),
        html: `
          <div style="font-family:Arial,sans-serif;padding:20px;">
            <h2 style="color:#16a34a;">Food Expiry Reminder 🌱</h2>
            <p>Hi ${user.name},</p>
            <p>These food items need your attention:</p>
            <table style="border-collapse:collapse;width:100%;">
              <thead>
                <tr>
                  <th style="padding:10px;border:1px solid #ddd;">Food</th>
                  <th style="padding:10px;border:1px solid #ddd;">Expiry Date</th>
                  <th style="padding:10px;border:1px solid #ddd;">Status</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            <p>Please check your inventory and plan accordingly.</p>
            <p><strong>Team FoodGuard 💚</strong></p>
          </div>
        `,
      });

      for (const { food, daysLeft } of reminders) {
        try {
          await NotificationLog.create({
            user: food.user,
            food: food._id,
            expiryDate: food.expiryDate,
            reminderDays: daysLeft,
          });
        } catch (logError) {
          if (logError.code !== 11000) throw logError;
        }
      }

      console.log(`Expiry email sent to ${user.email}`);
    } catch (error) {
      console.error(
        `Expiry email failed for ${user.email}:`,
        error.message
      );
    }
  }
}

export function startExpiryNotificationScheduler() {
  cron.schedule(
    "0 9 * * *",
    async () => {
      console.log("Running FoodGuard expiry reminder check...");
      await runExpiryNotifications();
    },
    { timezone: "Asia/Kolkata" }
  );

  console.log("FoodGuard expiry scheduler started (daily at 9 AM).");
}
