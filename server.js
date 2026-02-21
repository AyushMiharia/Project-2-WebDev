import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import MongoStore from "connect-mongo";
import { connectDB } from "./db/connection.js";
import authRouter from "./routes/auth.js";
import workoutsRouter from "./routes/ayush/workouts.js";
import connectionsRouter from "./routes/siddharth/connections.js";
import adminRouter from "./routes/admin.js";
import { requireAuth, requireAdmin } from "./middleware/auth.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  secret: process.env.SESSION_SECRET || "fitsync-secret",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 },
}));

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/workouts", requireAuth, workoutsRouter);
app.use("/api/connections", requireAuth, connectionsRouter);
app.use("/api/admin", requireAdmin, adminRouter);

// ── Public pages ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  if (req.session.userId) return res.redirect("/workouts");
  if (req.session.isAdmin) return res.redirect("/admin/dashboard");
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/login", (req, res) => {
  if (req.session.userId) return res.redirect("/workouts");
  res.sendFile(path.join(__dirname, "public", "pages", "login.html"));
});

app.get("/signup", (req, res) => {
  if (req.session.userId) return res.redirect("/workouts");
  res.sendFile(path.join(__dirname, "public", "pages", "login.html"));
});

app.get("/admin/login", (req, res) => {
  if (req.session.isAdmin) return res.redirect("/admin/dashboard");
  res.sendFile(path.join(__dirname, "public", "pages", "admin/login.html"));
});

// ── Protected user pages ──────────────────────────────────────────────────────
app.get("/workouts", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pages", "ayush/workouts.html"));
});
app.get("/connections", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pages", "siddharth/connections.html"));
});
app.get("/stats", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pages", "ayush/stats.html"));
});
app.get("/network", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pages", "siddharth/network.html"));
});

// ── Protected admin pages ─────────────────────────────────────────────────────
app.get("/admin/dashboard", requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pages", "admin/dashboard.html"));
});

connectDB().then(() => {
  app.listen(PORT, () => console.log(`FitSync running at http://localhost:${PORT}`));
});
