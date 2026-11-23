
import express from "express";
import Food from "../models/Food.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

const OLLAMA_URL =
  process.env.OLLAMA_URL || "http://127.0.0.1:11434";

const OLLAMA_MODEL =
  process.env.OLLAMA_MODEL || "llama3.2:3b";

// Get today's date in India
function getIndiaToday() {
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

// Calculate days between two YYYY-MM-DD dates
function getDaysDifference(today, expiryDate) {
  const [y1, m1, d1] = today.split("-").map(Number);
  const [y2, m2, d2] = expiryDate.split("-").map(Number);

  const todayUTC = Date.UTC(y1, m1 - 1, d1);
  const expiryUTC = Date.UTC(y2, m2 - 1, d2);

  return Math.round((expiryUTC - todayUTC) / 86400000);
}

// Identify OCR placeholders
function isPlaceholder(name) {
  return (
    !name ||
    /^(---\s*full image\s*---|full image|image|unknown|n\/a|none)$/i.test(
      name.trim()
    )
  );
}

// Classify items conservatively using their names and OCR notes
function classifyItem(food) {
  const name = String(food.name || "").trim();
  const notes = String(food.notes || "");
  const text = `${name} ${notes}`.toLowerCase();

  if (isPlaceholder(name)) {
    return "review-required";
  }

  const nonFoodPatterns = [
    /\bpond'?s\b/,
    /\bshampoo\b/,
    /\bface\s?wash\b/,
    /\bmoisturizer\b/,
    /\bmoisturiser\b/,
    /\bskincare\b/,
    /\bskin care\b/,
    /\btoothpaste\b/,
    /\bdetergent\b/,
    /\bbody lotion\b/,
    /\bsunscreen\b/,
    /\bserum\b/,
    /\bcosmetic\b/,
  ];

  if (nonFoodPatterns.some((pattern) => pattern.test(text))) {
    return "non-food";
  }

  const foodPatterns = [
    /\bmilk\b/,
    /\bwater\b/,
    /\brice\b/,
    /\bcurd\b/,
    /\byogurt\b/,
    /\bbread\b/,
    /\begg(s)?\b/,
    /\bapple(s)?\b/,
    /\bbanana(s)?\b/,
    /\bpotato(es)?\b/,
    /\btomato(es)?\b/,
    /\bonion(s)?\b/,
    /\bvegetable(s)?\b/,
    /\bfruit(s)?\b/,
    /\bjuice\b/,
    /\bbutter\b/,
    /\bcheese\b/,
    /\bflour\b/,
    /\bsugar\b/,
    /\bsalt\b/,
    /\boil\b/,
    /\bchicken\b/,
    /\bfish\b/,
    /\bmeat\b/,
    /\bcoffee\b/,
    /\btea\b/,
    /\bdal\b/,
    /\bpulse(s)?\b/,
  ];

  if (foodPatterns.some((pattern) => pattern.test(name.toLowerCase()))) {
    return "food";
  }

  return "review-required";
}

// Prepare inventory with reliable expiry information
function prepareInventory(items) {
  const today = getIndiaToday();

  return items.map((item) => {
    const expiryDate = item.expiryDate
      ? new Date(item.expiryDate).toISOString().slice(0, 10)
      : null;

    const daysUntilExpiry = expiryDate
      ? getDaysDifference(today, expiryDate)
      : null;

    let expiryStatus = "Unknown";

    if (daysUntilExpiry !== null) {
      if (daysUntilExpiry < 0) {
        expiryStatus = "Expired";
      } else if (daysUntilExpiry <= 3) {
        expiryStatus = "Expiring soon";
      } else {
        expiryStatus = "Fresh";
      }
    }

    const itemType = classifyItem(item);

    return {
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      expiryDate,
      daysUntilExpiry,
      expiryStatus,
      storageLocation: item.storageLocation,
      itemType,
      needsReview: itemType === "review-required",
    };
  });
}

// POST /api/ai/chat
router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (
      typeof message !== "string" ||
      !message.trim() ||
      message.length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid message (maximum 2000 characters).",
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

    const inventory = prepareInventory(foods);

    const foodItems = inventory.filter(
      (item) => item.itemType === "food"
    );

    const nonFoodItems = inventory.filter(
      (item) => item.itemType === "non-food"
    );

    const reviewItems = inventory.filter(
      (item) => item.itemType === "review-required"
    );

    const usableFoodItems = foodItems.filter(
      (item) =>
        item.expiryStatus !== "Expired" &&
        item.daysUntilExpiry !== null
    );

    const expiredFoodItems = foodItems.filter(
      (item) => item.expiryStatus === "Expired"
    );

    const inventoryContext = {
      todayInIndia: getIndiaToday(),
      totalItems: inventory.length,
      foodItems,
      usableFoodItems,
      expiredFoodItems,
      nonFoodItems,
      itemsNeedingReview: reviewItems,
    };

    const systemPrompt = `
You are FoodGuard AI, a helpful food inventory and food-waste reduction assistant.

YOUR MAIN RESPONSIBILITY:
Help the user understand their food inventory, expiry dates, recipes and food storage.

IMPORTANT RULES:

1. The inventory data provided below is the only source of truth about the user's stock.
2. Never invent food items, quantities, expiry dates or ingredients.
3. Use ONLY "usableFoodItems" when suggesting recipes.
4. Never recommend eating items listed under "expiredFoodItems".
5. Clearly warn the user when an item is expired.
6. Items under "nonFoodItems" are NOT food. Never suggest eating or cooking with them.
7. Items under "itemsNeedingReview" have unclear names or OCR data. Do not assume what they are.
8. If an item name is "--- full image ---" or another placeholder, explain that its product name needs correction.
9. If the user asks for a recipe, separate:
   - Available ingredients
   - Optional ingredients
   - Missing ingredients
10. Never claim an ingredient is available unless it exists in usableFoodItems.
11. If there are no usable food items, explain that clearly and ask the user to add or verify food items.
12. For food safety questions, give cautious general guidance. Do not guarantee that food is safe just because its expiry date has not passed.
13. Do not confuse category labels with product identity. Product name and itemType are more important.
14. Do not call the inventory a cage, box of animals, or anything unrelated. Call it food inventory or food stock.

LANGUAGE:
- Reply in the same language as the user's message.
- If the user writes in Kannada, reply in natural, simple Kannada.
- If the user writes in English, reply in simple English.
- Keep answers clear, friendly and useful.
- Avoid unnecessary long explanations.

RESPONSE STYLE:
- Use short headings when helpful.
- Use bullet points for ingredients and steps.
- Give practical, easy-to-follow answers.
- If information is uncertain, say so instead of guessing.

USER INVENTORY DATA:
${JSON.stringify(inventoryContext, null, 2)}
`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);

    let ollamaResponse;

    try {
      ollamaResponse = await fetch(`${OLLAMA_URL}/api/chat`, {
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
            temperature: 0.2,
          },
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();

      console.error("Ollama API error:", errorText);

      return res.status(502).json({
        success: false,
        message: "FoodGuard AI could not connect to the local AI model.",
      });
    }

    const data = await ollamaResponse.json();
    const reply = data?.message?.content?.trim();

    if (!reply) {
      return res.status(502).json({
        success: false,
        message: "The AI model returned an empty response. Please try again.",
      });
    }

    return res.status(200).json({
      success: true,
      reply,
      model: OLLAMA_MODEL,
      inventoryCount: inventory.length,
    });
  } catch (error) {
    console.error("FoodGuard AI error:", error);

    if (error.name === "AbortError") {
      return res.status(504).json({
        success: false,
        message: "FoodGuard AI took too long to respond. Please try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong while processing your AI request.",
    });
  }
});

export default router;
