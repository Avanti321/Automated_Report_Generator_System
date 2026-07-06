const jwt = require("jsonwebtoken");

// Verifies the Bearer token and attaches { id, role, email, department } to req.user
function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired session. Please log in again." });
  }
}

// Must be used after `authenticate`. Restricts a route to admins only.
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only." });
  }
  next();
}

// Must be used after `authenticate`. Restricts a route to faculty only.
function requireFaculty(req, res, next) {
  if (!req.user || req.user.role !== "faculty") {
    return res.status(403).json({ message: "Faculty access only." });
  }
  next();
}

module.exports = { authenticate, requireAdmin, requireFaculty };
