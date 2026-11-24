
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import User from "../models/User.js";
import { sendEmail } from "../utils/emailService.js";

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    { id: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
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

    // Send welcome email without blocking registration
    try {
      await sendEmail({
        to: user.email,
        subject: "Welcome to FoodGuard! 🌱",
        text: `Hi ${user.name},

Welcome to FoodGuard!

Your account has been successfully created.

You can now manage your food inventory, track expiry dates and reduce food waste.

Happy Food Saving!

Team FoodGuard`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;color:#333;">
            <h2 style="color:#16a34a;">Welcome to FoodGuard! 🌱</h2>
            <p>Hi ${user.name},</p>
            <p>Your FoodGuard account has been successfully created.</p>
            <p>With FoodGuard, you can:</p>
            <ul>
              <li>Manage your food inventory</li>
              <li>Track food expiry dates</li>
              <li>Receive expiry reminders</li>
              <li>Get AI-powered recipe suggestions</li>
            </ul>
            <p>Let's reduce food waste together!</p>
            <p><strong>Team FoodGuard 💚</strong></p>
          </div>
        `,
      });

      console.log(`Welcome email sent to ${user.email}`);
    } catch (emailError) {
      console.error("Welcome email failed:", emailError.message);
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
          <p>Click below to set a new password. This link expires in 15 minutes.</p>
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
