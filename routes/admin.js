// routes/admin.js — Admin: manage all users + view all records
import { Router } from "express";
import { getDB } from "../db/connection.js";
import { ObjectId } from "mongodb";

const router = Router();

// GET all users (paginated + search)
router.get("/users", async (req, res) => {
  try {
    const db = getDB();
    const { search, page = 1 } = req.query;
    const limit = 50;
    const skip = (Number(page) - 1) * limit;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { gym: { $regex: search, $options: "i" } },
        { trainingStyle: { $regex: search, $options: "i" } },
      ];
    }

    const total = await db.collection("users").countDocuments(filter);
    const users = await db
      .collection("users")
      .find(filter, { projection: { password: 0 } }) // never expose password
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    res.json({ users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a user (and their workouts + connections)
router.delete("/users/:id", async (req, res) => {
  try {
    const db = getDB();
    const userId = req.params.id;

    // Delete the user
    const result = await db.collection("users").deleteOne({ _id: new ObjectId(userId) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "User not found" });

    // Clean up their data
    await db.collection("workouts").deleteMany({ userId });
    await db.collection("connections").deleteMany({ userId });

    res.json({ message: "User and all their data deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET overview stats
router.get("/stats", async (req, res) => {
  try {
    const db = getDB();
    const totalUsers = await db.collection("users").countDocuments();
    const totalWorkouts = await db.collection("workouts").countDocuments();
    const totalConnections = await db.collection("connections").countDocuments();

    const byGym = await db.collection("users").aggregate([
      { $group: { _id: "$gym", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]).toArray();

    const byStyle = await db.collection("users").aggregate([
      { $group: { _id: "$trainingStyle", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray();

    // New registrations per week (last 8 weeks)
    const byWeek = await db.collection("users").aggregate([
      { $group: { _id: { $dateToString: { format: "%Y-%U", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: 8 },
    ]).toArray();

    res.json({ totalUsers, totalWorkouts, totalConnections, byGym, byStyle, byWeek: byWeek.reverse() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Keep workouts + connections endpoints for reference
router.get("/workouts", async (req, res) => {
  try {
    const db = getDB();
    const { page = 1 } = req.query;
    const limit = 50;
    const skip = (Number(page) - 1) * limit;
    const total = await db.collection("workouts").countDocuments();
    const workouts = await db.collection("workouts").find({}).sort({ date: -1 }).skip(skip).limit(limit).toArray();
    res.json({ workouts, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/connections", async (req, res) => {
  try {
    const db = getDB();
    const { page = 1 } = req.query;
    const limit = 50;
    const skip = (Number(page) - 1) * limit;
    const total = await db.collection("connections").countDocuments();
    const connections = await db.collection("connections").find({}).sort({ name: 1 }).skip(skip).limit(limit).toArray();
    res.json({ connections, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
