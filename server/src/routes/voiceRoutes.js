import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/session", authMiddleware, async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        message: "Voice assistant is not configured.",
      });
    }

    const sessionConfig = {
      session: {
        type: "realtime",
        model: "gpt-realtime-2.1",

        instructions: `
You are FoodGuard, an intelligent food management assistant.

Your responsibilities:
- Help users understand and manage their food inventory.
- Answer questions about food expiry and storage.
- Give practical food waste reduction suggestions.
- Be friendly, clear and concise.

LANGUAGES:
- Support English, Kannada and Hindi.
- Respond in the language the user is substantively speaking.
- Switch languages naturally when the user switches.
- Do not infer language from accent alone.
- If language is unclear, ask politely.

IMPORTANT:
- Never invent inventory records or expiry dates.
- Never claim that an action succeeded unless the backend confirms it.
- Ask for confirmation before destructive actions.
- Keep spoken responses natural and relatively short.
`,

        audio: {
          output: {
            voice: "marin",
          },
        },
      },
    };

    const response = await fetch(
      "https://api.openai.com/v1/realtime/client_secrets",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionConfig),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Realtime API error:", data);

      return res.status(response.status).json({
        message:
          data.error?.message || "Could not create voice session.",
      });
    }

    if (!data.value) {
      return res.status(502).json({
        message: "The voice session key was not returned.",
      });
    }

    res.json({
      clientSecret: data.value,
      expiresAt: data.expires_at,
    });

  } catch (error) {
    console.error("Voice session error:", error);

    res.status(500).json({
      message: "Internal voice assistant error.",
    });
  }
});

export default router;
        