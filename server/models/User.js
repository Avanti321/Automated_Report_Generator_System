const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: {
    type: String,
    enum: ["faculty"], // Admin is never stored/self-registered — see ADMIN_EMAIL/ADMIN_PASSWORD env vars
    default: "faculty"
  },
  department: String,

  otp: String,
  otpExpiry: Date,

  resetToken: String,
  resetTokenExpiry: Date
});

module.exports = mongoose.model("User", userSchema);
