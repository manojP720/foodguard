import express from "express";

import Food from "../models/Food.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

const OLLAMA_URL =
  process.env.OLLAMA_URL || "http://127.0.0.1:11434";

const OLLAMA_MODEL =
  process.env.OLLAMA_MODEL || "llama3.2:3b";

// POST /api/ai/chat
router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    // Validate the user's message
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

    // Fetch only the logged-in user's active food inventory
    const foods = await Food.find({
      user: req.user.id,
      consumed: false,
      quantity: { $gt: 0 },
    })
      .select("name category quantity unit expiryDate storageLocation notes")
      .sort({ expiryDate: 1 })
      .limit(100)
      .lean();

    const inventory = foods.map((food) => ({
      name: food.name,
      category: food.category,
      quantity: food.quantity,
      unit: food.unit,
      expiryDate: food.expiryDate
        ? new Date(food.expiryDate).toISOString().slice(0, 10)
        : "Unknown",
      storageLocation: food.storageLocation,
      notes: food.notes || "",
    }));
    const today = new Date().toISOString().slice(0, 10);

    const systemPrompt = `
    CURRENT DATE: ${today}
You are FoodGuard AI, an intelligent food inventory and food-waste reduction assistant.

Your responsibilities:
1. Suggest recipes using the user's actual available inventory.
2. Prioritize ingredients that are nearing their expiry date.
3. Suggest practical ways to reduce food waste.
4. Explain food storage and basic food safety.
5. Suggest alternatives when an ingredient is unavailable.

IMPORTANT RULES:
- Use the inventory supplied below as the only source of information about what the user owns.
- Never claim an ingredient is available unless it appears in the inventory.
- Clearly label ingredients not in inventory as "Not in your inventory".
- Do not invent quantities, expiry dates, or storage details.
- Do not assume an expired food item is safe to eat.
- If an expiry date has passed, warn the user and do not recommend consuming that item.
- If inventory is empty, tell the user that no active food items were found.
- You may suggest common additional ingredients, but clearly label them as optional or unavailable.
- Keep answers practical, friendly, and easy to understand.
- Never claim that you updated, deleted, or added inventory items. You can only provide advice.

USER'S CURRENT INVENTORY:
${JSON.stringify(inventory, null, 2)}
`;

    // Ask the local Ollama model
    const ollamaResponse = await fetch(`${OLLAMA_URL}/api/chat`, {
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
          temperature: 0.4,
        },
      }),
      signal: AbortSignal.timeout(90000),
    });

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
      inventoryCount: inventory.length,
    });
  } catch (error) {
    console.error("FoodGuard AI error:", error.message);

    if (error.name === "TimeoutError" || error.name === "AbortError") {
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