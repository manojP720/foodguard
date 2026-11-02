
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/session", authMiddleware, async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: "Voice assistant is not configured.",
      });
    }

    const sessionConfig = {
      expires_after: {
        anchor: "created_at",
        seconds: 600,
      },

      session: {
        type: "realtime",
        model: "gpt-realtime-2.1",

        instructions: `
You are FoodGuard, an intelligent food management assistant.

Help users manage food inventory, understand expiry dates,
reduce food waste and discover recipes.

Languages:
- English
- Kannada
- Hindi

Respond naturally in the language the user speaks.
Switch languages when the user switches.
Never invent inventory records or expiry dates.
Never claim an action succeeded without backend confirmation.
Ask before destructive actions.
Keep spoken responses concise and friendly.
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

      return res.status(502).json({
        success: false,
        message: "Could not create voice session.",
      });
    }

    if (!data.value) {
      return res.status(502).json({
        success: false,
        message: "Voice session secret was not returned.",
      });
    }

    return res.json({
      success: true,
      clientSecret: data.value,
      expiresAt: data.expires_at,
    });

  } catch (error) {
    console.error("Voice session error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal voice assistant error.",
    });
  }
});

export default router;
