
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import User from "../models/User.js";
import Food from "../models/Food.js";
import { sendEmail } from "../utils/emailService.js";

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    { id: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

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

function getDaysLeft(expiryDate) {
  const today = getIndiaDate();
  const expiry = new Date(expiryDate).toISOString().slice(0, 10);

  const [y1, m1, d1] = today.split("-").map(Number);
  const [y2, m2, d2] = expiry.split("-").map(Number);

  return Math.round(
    (Date.UTC(y2, m2 - 1, d2) -
      Date.UTC(y1, m1 - 1, d1)) / 86400000
  );
}

function getExpiryStatus(daysLeft) {
  if (daysLeft < 0) return `Expired ${Math.abs(daysLeft)} day(s) ago`;
  if (daysLeft === 0) return "Expires today";
  if (daysLeft === 1) return "Expires tomorrow";
  return `Expires in ${daysLeft} days`;
}

function getRecipeSuggestions(items) {
  const names = items.map((item) => item.name.toLowerCase());
  const recipes = [];

  if (names.some((n) => n.includes("egg")) &&
      names.some((n) => n.includes("bread"))) {
    recipes.push("Bread omelette – use your available bread and eggs.");
  }

  if (names.some((n) => n.includes("milk")) &&
      names.some((n) => n.includes("egg"))) {
    recipes.push("Milk and egg pancakes – use your available milk and eggs.");
  }

  if (names.some((n) => n.includes("rice")) &&
      names.some((n) => n.includes("tomato"))) {
    recipes.push("Tomato rice – use your available rice and tomatoes.");
  }

  if (names.some((n) => n.includes("potato")) &&
      names.some((n) => n.includes("onion"))) {
    recipes.push("Potato onion stir-fry – use your available potatoes and onions.");
  }

  if (recipes.length === 0 && items.length > 0) {
    recipes.push(
      `Check your available ingredients (${items.slice(0, 4).map((i) => i.name).join(", ")}) and prepare a suitable meal before they expire.`
    );
  }

  return recipes;
}

async function getUserInventory(userId) {
  const foods = await Food.find({
    user: userId,
    consumed: false,
    quantity: { $gt: 0 },
  }).sort({ expiryDate: 1 }).lean();

  return foods.map((food) => ({
    ...food,
    daysLeft: getDaysLeft(food.expiryDate),
  }));
}

function createInventoryText(items) {
  if (!items.length) {
    return "Your inventory is currently empty. Add food items to start tracking expiry dates.";
  }

  return items.map((item) =>
    `${item.name} - ${getExpiryStatus(item.daysLeft)}`
  ).join("\n");
}

function createInventoryHtml(items) {
  if (!items.length) {
    return "<p>Your inventory is currently empty. Add food items to start tracking expiry dates.</p>";
  }

  return `
    <table style="border-collapse:collapse;width:100%;">
      <thead>
        <tr>
          <th style="padding:10px;border:1px solid #ddd;">Food</th>
          <th style="padding:10px;border:1px solid #ddd;">Quantity</th>
          <th style="padding:10px;border:1px solid #ddd;">Expiry status</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item) => `
          <tr>
            <td style="padding:10px;border:1px solid #ddd;">
              ${escapeHtml(item.name)}
            </td>
            <td style="padding:10px;border:1px solid #ddd;">
              ${escapeHtml(item.quantity)} ${escapeHtml(item.unit)}
            </td>
            <td style="padding:10px;border:1px solid #ddd;">
              ${escapeHtml(getExpiryStatus(item.daysLeft))}
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

// SIGNUP
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        success: false,
        message: "Password must be 8–72 characters long.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists. Please log in.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    // Welcome email ONLY after signup
    try {
      await sendEmail({
        to: user.email,
        subject: "Welcome to FoodGuard! 🌱",
        text: `Hi ${user.name},

Welcome to FoodGuard!

Your account has been successfully created.

Manage your food inventory, track expiry dates and reduce food waste.

Team FoodGuard 💚`,
        html: `
          <div style="font-family:Arial,sans-serif;padding:24px;color:#333;">
            <h2 style="color:#16a34a;">Welcome to FoodGuard! 🌱</h2>
            <p>Hi ${escapeHtml(user.name)},</p>
            <p>Your account has been successfully created.</p>
            <p>You can now manage your food inventory, track expiry dates and get recipe suggestions.</p>
            <strong>Team FoodGuard 💚</strong>
          </div>
        `,
      });

      console.log(`Signup welcome email sent to ${user.email}`);
    } catch (error) {
      console.error("Signup welcome email failed:", error.message);
    }

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token: createToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Signup error:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered. Please log in.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Could not create account. Please try again.",
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Login email with this user's actual inventory
    try {
      const items = await getUserInventory(user._id);
      const recipes = getRecipeSuggestions(
        items.filter((item) => item.daysLeft >= 0)
      );

      await sendEmail({
        to: user.email,
        subject: "Welcome Back to FoodGuard! 💚",
        text: `Hi ${user.name},

Welcome back to FoodGuard!

Your inventory:
${createInventoryText(items)}

Recipe suggestions:
${recipes.length ? recipes.join("\n") : "Add available food items to get recipe suggestions."}

Use your food wisely!

Team FoodGuard 💚`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:24px;color:#333;">
            <h2 style="color:#16a34a;">Welcome Back to FoodGuard! 💚</h2>
            <p>Hi ${escapeHtml(user.name)},</p>
            <p>Your food inventory is ready. Here is your latest expiry status:</p>

            ${createInventoryHtml(items)}

            <h3 style="color:#16a34a;">🍳 Recipe Suggestions</h3>
            <ul>
              ${recipes.length
                ? recipes.map((recipe) => `<li>${escapeHtml(recipe)}</li>`).join("")
                : "<li>Add available food items to get recipe suggestions.</li>"
              }
            </ul>

            <p>Use your available ingredients before they expire!</p>
            <strong>Team FoodGuard 💚</strong>
          </div>
        `,
      });

      console.log(`Welcome back email sent to ${user.email}`);
    } catch (emailError) {
      console.error("Welcome back email failed:", emailError.message);
    }

    return res.json({
      success: true,
      message: "Login successful.",
      token: createToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not log in. Please try again.",
    });
  }
});

// LOGOUT
router.post("/logout", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required.",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Send goodbye email with latest expiry information
    try {
      const items = await getUserInventory(user._id);

      const upcoming = items.filter((item) => item.daysLeft >= 0);

      await sendEmail({
        to: user.email,
        subject: "See You Soon! FoodGuard Goodbye 👋",
        text: `Hi ${user.name},

You have successfully logged out of FoodGuard.

Remember to check your food inventory:

${createInventoryText(items)}

Take care of your food and avoid waste!

Team FoodGuard 💚`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:24px;color:#333;">
            <h2 style="color:#16a34a;">See You Soon! 👋</h2>
            <p>Hi ${escapeHtml(user.name)},</p>
            <p>You have successfully logged out of FoodGuard.</p>
            <p>Before you go, check your food expiry status:</p>
            ${createInventoryHtml(items)}
            <p>You have <strong>${upcoming.length}</strong> item(s) that are not yet expired.</p>
            <p>Use them wisely and help reduce food waste!</p>
            <strong>Team FoodGuard 💚</strong>
          </div>
        `,
      });

      console.log(`Goodbye email sent to ${user.email}`);
    } catch (emailError) {
      console.error("Goodbye email failed:", emailError.message);
    }

    return res.json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Logout error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Logout failed.",
    });
  }
});

// FORGOT PASSWORD
router.post("/forgot-password", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const user = await User.findOne({ email });

    const message =
      "If an account exists for this email, a password reset link will be sent.";

    if (!user) {
      return res.json({ success: true, message });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpires = new Date(
      Date.now() + 15 * 60 * 1000
    );

    await user.save();

    const frontendUrl =
      process.env.FRONTEND_URL || "http://localhost:5173";

    const resetLink =
      `${frontendUrl}/reset-password?token=${token}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Reset your FoodGuard password",
        text: `Use this link to reset your password within 15 minutes: ${resetLink}`,
        html: `
          <h2>FoodGuard password reset</h2>
          <p>This link expires in 15 minutes.</p>
          <p><a href="${resetLink}">Reset my password</a></p>
          <p>If you did not request this, ignore this email.</p>
        `,
      });
    } catch (emailError) {
      user.passwordResetTokenHash = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      throw emailError;
    }

    return res.json({ success: true, message });
  } catch (error) {
    console.error("Forgot password error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to process the request. Please try again.",
    });
  }
});

export default router;
