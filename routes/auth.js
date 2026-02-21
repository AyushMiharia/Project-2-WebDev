import { Router } from "express";
import bcrypt from "bcrypt";
import { getDB } from "../db/connection.js";

const router = Router();

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const db = getDB();
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Name, email and password are required." });
    if (password.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters." });

    const existing = await db.collection("users").findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: "Email already registered. Please sign in." });

    const hashed = await bcrypt.hash(password, 10);
    const user = { name, email: email.toLowerCase(), password: hashed, role: "user", createdAt: new Date() };
    const result = await db.collection("users").insertOne(user);

    req.session.userId = result.insertedId.toString();
    req.session.userName = name;
    req.session.userEmail = email.toLowerCase();
    res.status(201).json({ message: "Account created!", name, email: email.toLowerCase() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const db = getDB();
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required." });

    const user = await db.collection("users").findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: "No account found. Please sign up first." });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Incorrect password." });

    req.session.userId = user._id.toString();
    req.session.userName = user.name;
    req.session.userEmail = user.email;
    res.json({ message: "Logged in!", name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/admin-login
router.post("/admin-login", (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  if (password !== adminPassword) return res.status(401).json({ error: "Incorrect admin password." });
  req.session.isAdmin = true;
  res.json({ message: "Admin logged in!" });
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  req.session.destroy();
  res.json({ message: "Logged out" });
});

// GET /api/auth/me
router.get("/me", (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Not logged in" });
  res.json({ userId: req.session.userId, name: req.session.userName, email: req.session.userEmail });
});

export default router;
