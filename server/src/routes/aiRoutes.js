
import express from "express";

import Food from "../models/Food.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

const OLLAMA_URL =
  process.env.OLLAMA_URL || "http://127.0.0.1:11434";

const OLLAMA_MODEL =
  process.env.OLLAMA_MODEL || "llama3.2:3b";

// Get today's date in India (YYYY-MM-DD)
function getTodayIndia() {
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

// Calculate calendar-day difference without timezone errors
function calculateDaysRemaining(today, expiryDate) {
  const [todayYear, todayMonth, todayDay] = today
    .split("-")
    .map(Number);

  const [expiryYear, expiryMonth, expiryDay] = expiryDate
    .split("-")
    .map(Number);

  const todayUTC = Date.UTC(
    todayYear,
    todayMonth - 1,
    todayDay
  );

  const expiryUTC = Date.UTC(
    expiryYear,
    expiryMonth - 1,
    expiryDay
  );

  return Math.round(
    (expiryUTC - todayUTC) / (1000 * 60 * 60 * 24)
  );
}

// Classify food expiry status
function getExpiryStatus(daysRemaining) {
  if (daysRemaining < 0) return "Expired";
  if (daysRemaining === 0) return "Expires Today";
  if (daysRemaining <= 7) return "Expiring Soon";

  return "Fresh";
}

// POST /api/ai/chat
router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a message.",
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Message must be 2000 characters or fewer.",
      });
    }

    // Fetch only the logged-in user's active inventory
    const foods = await Food.find({
      user: req.user.id,
      consumed: false,
      quantity: { $gt: 0 },
    })
      .select(
        "name category quantity unit expiryDate storageLocation notes"
      )
      .sort({ expiryDate: 1 })
      .limit(100)
      .lean();

    const today = getTodayIndia();

    // Backend calculates expiry information
    const inventory = foods.map((food) => {
      const expiryDate = food.expiryDate
        ? new Date(food.expiryDate).toISOString().slice(0, 10)
        : null;

      if (!expiryDate) {
        return {
          name: food.name,
          category: food.category,
          quantity: food.quantity,
          unit: food.unit,
          expiryDate: null,
          daysUntilExpiry: null,
          expiryStatus: "Unknown",
          storageLocation: food.storageLocation,
          notes: food.notes || "",
        };
      }

      const daysUntilExpiry = calculateDaysRemaining(
        today,
        expiryDate
      );

      return {
        name: food.name,
        category: food.category,
        quantity: food.quantity,
        unit: food.unit,
        expiryDate,
        daysUntilExpiry,
        expiryStatus: getExpiryStatus(daysUntilExpiry),
        storageLocation: food.storageLocation,
        notes: food.notes || "",
      };
    });

    const systemPrompt = `
You are FoodGuard AI, an intelligent food inventory and food-waste reduction assistant.

VERIFIED DATE INFORMATION:
Today's date: ${today}
Timezone: Asia/Kolkata

USER'S CURRENT INVENTORY:
${JSON.stringify(inventory, null, 2)}

IMPORTANT RULES:

1. The backend has already calculated daysUntilExpiry and expiryStatus.
   Treat these values as authoritative. Never recalculate them yourself.

2. Explain expiry information using the supplied values.
   - Expired: The listed expiry date has passed.
   - Expires Today: The listed expiry date is today.
   - Expiring Soon: The listed expiry date is within the next 7 days.
   - Fresh: More than 7 days remain.
   - Unknown: No expiry information is available.

3. Never recommend consuming an item marked Expired.
   Explain that the date has passed and advise checking the
   package instructions and appropriate food-safety guidance.

4. An expiry date alone does not establish whether food is safe.
   Do not guarantee food safety based on appearance or smell.

5. Never invent food items, quantities, expiry dates or expiry statuses.

6. Only recommend ingredients present in the supplied inventory
   as available. Clearly label other ingredients as unavailable
   or optional.

7. Prioritize usable ingredients that are Expiring Soon.

8. If inventory is empty, tell the user no active food items
   were found.

9. Give practical recipes, food storage advice and food-waste
   reduction suggestions.

10. Never claim to have modified the user's inventory.

11. Keep answers friendly, concise and easy to understand.
`;

    // Connect to local Ollama
    const ollamaResponse = await fetch(
      `${OLLAMA_URL}/api/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          stream: false,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: message.trim(),
            },
          ],
          options: {
            temperature: 0.3,
          },
        }),
        signal: AbortSignal.timeout(90000),
      }
    );

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();

      console.error("Ollama API error:", errorText);

      return res.status(502).json({
        success: false,
        message: "Local AI service returned an error.",
      });
    }

    const result = await ollamaResponse.json();
    const reply = result?.message?.content;

    if (typeof reply !== "string" || !reply.trim()) {
      return res.status(502).json({
        success: false,
        message: "The AI did not return a valid response.",
      });
    }

    return res.json({
      success: true,
      reply: reply.trim(),
      model: OLLAMA_MODEL,
      currentDate: today,
      inventoryCount: inventory.length,
      inventory: inventory.map((item) => ({
        name: item.name,
        expiryDate: item.expiryDate,
        daysUntilExpiry: item.daysUntilExpiry,
        expiryStatus: item.expiryStatus,
      })),
    });

  } catch (error) {
    console.error("FoodGuard AI error:", error.message);

    if (
      error.name === "TimeoutError" ||
      error.name === "AbortError"
    ) {
      return res.status(504).json({
        success: false,
        message: "AI response timed out. Please try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Could not process your AI request.",
    });
  }
});

export default router;
