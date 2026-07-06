// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const path = require("path");
// require("dotenv").config({ path: path.join(__dirname, ".env") });

// console.log("EMAIL =", process.env.EMAIL);
// console.log("EMAIL_PASSWORD =", process.env.EMAIL_PASSWORD);

// const authRoutes = require("./routes/authRoutes");
// const reportRoutes = require("./routes/reportRoutes");

// const app = express();

// app.use(cors({
//   origin: function (origin, callback) {
//     const allowed = [
//       "http://localhost:5173",
//       "http://localhost:3000",
//       /\.vercel\.app$/
//     ];
//     const isAllowed = !origin || allowed.some(o =>
//       typeof o === "string" ? o === origin : o.test(origin)
//     );
//     callback(isAllowed ? null : new Error("Not allowed by CORS"), isAllowed);
//   },
//   credentials: true
// }));

// app.use(express.json());
// app.use("/uploads", express.static("uploads"));

// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => console.log("MongoDB Connected"))
//   .catch((err) => console.error("MongoDB connection error:", err));

// app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// app.use("/api/auth", authRoutes);
// app.use("/api/reports", reportRoutes);

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log("Server running on port " + PORT));
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

console.log("EMAIL =", process.env.EMAIL);
console.log("EMAIL_PASSWORD =", process.env.EMAIL_PASSWORD);

const authRoutes = require("./routes/authRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();

app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      /^http:\/\/localhost:\d+$/,   // any local Vite port (5173, 5174, ...)
      /^http:\/\/127\.0\.0\.1:\d+$/,
      /\.vercel\.app$/
    ];
    const isAllowed = !origin || allowed.some(o =>
      typeof o === "string" ? o === origin : o.test(origin)
    );
    if (!isAllowed) {
      console.warn("❌ CORS blocked origin:", origin);
    }
    callback(isAllowed ? null : new Error("Not allowed by CORS"), isAllowed);
  },
  credentials: true
}));

app.use(express.json());
app.use("/uploads", express.static("uploads"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
  console.log("CORS: allowing any http://localhost:<port> and http://127.0.0.1:<port> origin (dev-friendly build)");
});