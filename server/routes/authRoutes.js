const router  = require("express").Router();
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const axios   = require("axios");
const crypto  = require("crypto");
const User    = require("../models/User");
const { authenticate, requireAdmin } = require("../middleware/auth");

// ── Password validation helper ────────────────────────────────────
function validatePassword(password) {
  if (!password || password.length < 8) {
    return "Password must be at least 8 characters long.";
  }
  if (password.length > 12) {
    return "Password must not exceed 12 characters.";
  }
  return null;
}

// ── Brevo HTTP API email sender ────────────────────────────────────
async function sendEmail(to, subject, html) {
  try {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name:  "Report System",
          email: process.env.BREVO_USER,
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
      },
      {
        headers: {
          "api-key":      process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
          "Accept":       "application/json",
        },
      }
    );
    console.log("✅ Email sent to:", to);
  } catch (err) {
    console.error("❌ EMAIL SEND ERROR:", err.response?.data || err.message);
    throw new Error("Failed to send email: " + (err.response?.data?.message || err.message));
  }
}

// ── REGISTER ───────────────────────────────────────────────────────
// Faculty self-registration only. Admin access is never created through this
// route — it is gated entirely behind the predefined ADMIN_EMAIL / ADMIN_PASSWORD
// environment variables and the /admin-login route below.
router.post("/register", async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);
    const { name, email, password, department } = req.body;

    if (!name || !email || !password || !department) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const pwdError = validatePassword(password);
    if (pwdError) {
      return res.status(400).json({ message: pwdError });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user   = new User({ name, email, password: hashed, role: "faculty", department });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("❌ REGISTER ERROR:", err.message);
    res.status(500).json({ message: err.message || "Server Error" });
  }
});

// ── LOGIN ──────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  console.log("✅ Login route hit");
  console.log("📧 Email received:", req.body.email);

  try {
    const { email, password } = req.body;

    const pwdError = validatePassword(password);
    if (pwdError) {
      return res.status(400).json({ message: pwdError });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp       = otp;
    user.otpExpiry = Date.now() + 300000; // 5 minutes
    await user.save();

    await sendEmail(
      email,
      "Your Login OTP",
      `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px">
          <h2 style="color:#3730a3;margin-bottom:8px">OTP Verification</h2>
          <p style="color:#6b7280">Use the OTP below to login. It is valid for <strong>5 minutes</strong>.</p>
          <div style="background:#eef2ff;border-radius:8px;padding:24px;text-align:center;margin:24px 0">
            <h1 style="color:#3730a3;font-size:42px;letter-spacing:10px;margin:0">${otp}</h1>
          </div>
          <p style="color:#9ca3af;font-size:12px">If you did not request this OTP, please ignore this email.</p>
        </div>
      `
    );

    res.json({ success: true, email });

  } catch (err) {
    console.error("❌ LOGIN ERROR:", err.message);
    res.status(500).json({ message: err.message || "Server Error" });
  }
});

// ── VERIFY OTP ─────────────────────────────────────────────────────
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.otp !== otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email, name: user.name, department: user.department },
      process.env.JWT_SECRET || "secretkey"
    );

    user.otp       = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ token, user });

  } catch (err) {
    console.error("❌ OTP ERROR:", err.message);
    res.status(500).json({ message: err.message || "Server Error" });
  }
});

// ── FORGOT PASSWORD ────────────────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Return generic message to prevent email enumeration
      return res.json({ message: "If this email is registered, a reset link has been sent." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken       = token;
    user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
    await user.save();

    const clientURL = process.env.CLIENT_URL || "http://localhost:5173";
    const resetURL  = `${clientURL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    await sendEmail(
      email,
      "Password Reset Request",
      `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px">
          <h2 style="color:#3730a3;margin-bottom:8px">Password Reset</h2>
          <p style="color:#6b7280">You requested a password reset. Click the button below to set a new password. This link is valid for <strong>1 hour</strong>.</p>
          <div style="text-align:center;margin:28px 0">
            <a href="${resetURL}"
               style="background:linear-gradient(135deg,#3b82f6,#6366f1);color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">
              Reset Password
            </a>
          </div>
          <p style="color:#6b7280;font-size:13px">Or copy this link:<br/>
            <a href="${resetURL}" style="color:#6366f1;word-break:break-all">${resetURL}</a>
          </p>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px">If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
        </div>
      `
    );

    res.json({ message: "If this email is registered, a reset link has been sent." });

  } catch (err) {
    console.error("❌ FORGOT PASSWORD ERROR:", err.message);
    res.status(500).json({ message: err.message || "Server Error" });
  }
});

// ── RESET PASSWORD ─────────────────────────────────────────────────
router.post("/reset-password", async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const pwdError = validatePassword(newPassword);
    if (pwdError) {
      return res.status(400).json({ message: pwdError });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid reset request" });
    }

    if (user.resetToken !== token || user.resetTokenExpiry < Date.now()) {
      return res.status(400).json({ message: "Reset link is invalid or has expired" });
    }

    user.password         = await bcrypt.hash(newPassword, 10);
    user.resetToken       = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ message: "Password reset successfully. You can now log in." });

  } catch (err) {
    console.error("❌ RESET PASSWORD ERROR:", err.message);
    res.status(500).json({ message: err.message || "Server Error" });
  }
});

// ── ADMIN LOGIN ────────────────────────────────────────────────────
// There is no Admin record in the database and no Admin self-registration.
// Access is granted only to the single predefined account configured via
// the ADMIN_EMAIL / ADMIN_PASSWORD environment variables on the server.
router.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const adminEmail    = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error("❌ ADMIN_EMAIL / ADMIN_PASSWORD not configured on the server.");
      return res.status(500).json({ message: "Admin login is not configured on the server." });
    }

    const emailMatches    = email.trim().toLowerCase() === adminEmail.trim().toLowerCase();
    const passwordMatches = password === adminPassword;

    if (!emailMatches || !passwordMatches) {
      return res.status(401).json({ message: "Invalid admin email or password." });
    }

    const token = jwt.sign(
      { role: "admin", email: adminEmail, name: "Administrator" },
      process.env.JWT_SECRET || "secretkey"
    );

    res.json({ token, user: { role: "admin", email: adminEmail, name: "Administrator" } });
  } catch (err) {
    console.error("❌ ADMIN LOGIN ERROR:", err.message);
    res.status(500).json({ message: err.message || "Server Error" });
  }
});

// ── LIST FACULTY USERS (Admin only) ─────────────────────────────────
router.get("/users", authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, "-password -otp -otpExpiry -resetToken -resetTokenExpiry");
    res.json(users);
  } catch (err) {
    console.error("❌ LIST USERS ERROR:", err.message);
    res.status(500).json({ message: err.message || "Server Error" });
  }
});

module.exports = router;
