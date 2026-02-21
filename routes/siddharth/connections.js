// routes/siddharth/connections.js — Siddharth's section: Training Partners & Community
import { Router } from "express";
import { getDB } from "../../db/connection.js";
import { ObjectId } from "mongodb";

const router = Router();

// GET all connections (with filters)
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const { gym, trainingStyle, howMet, search } = req.query;
    const filter = { userId: req.session.userId };

    if (gym) filter.gym = gym;
    if (trainingStyle) filter.trainingStyle = trainingStyle;
    if (howMet) filter.howMet = howMet;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { gym: { $regex: search, $options: "i" } },
        { trainingStyle: { $regex: search, $options: "i" } },
        { howMet: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    const connections = await db.collection("connections").find(filter).sort({ name: 1 }).toArray();
    res.json(connections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET networking stats
router.get("/stats", async (req, res) => {
  try {
    const db = getDB();
    const userId = req.session.userId;
    const match = { userId };

    const total = await db.collection("connections").countDocuments(match);

    const byGym = await db.collection("connections").aggregate([
      { $match: match },
      { $group: { _id: "$gym", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray();

    const byStyle = await db.collection("connections").aggregate([
      { $match: match },
      { $group: { _id: "$trainingStyle", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray();

    const byHowMet = await db.collection("connections").aggregate([
      { $match: match },
      { $group: { _id: "$howMet", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray();

    res.json({ total, byGym, byStyle, byHowMet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /connections/lookup?email=... — validate user exists before adding
router.get("/lookup", async (req, res) => {
  try {
    const db = getDB();
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Email is required." });

    if (email.toLowerCase() === req.session.userEmail) {
      return res.status(400).json({ error: "You can't add yourself as a connection." });
    }

    const user = await db.collection("users").findOne(
      { email: email.toLowerCase() },
      { projection: { password: 0 } }
    );
    if (!user) return res.status(404).json({ error: "No FitSync user found with this email address." });

    // Check if already connected
    const already = await db.collection("connections").findOne({
      userId: req.session.userId,
      linkedUserId: user._id.toString(),
    });
    if (already) return res.status(409).json({ error: `${user.name} is already in your connections.` });

    res.json({ name: user.name, email: user.email, gym: user.gym, trainingStyle: user.trainingStyle, userId: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single connection + workouts + who added them
router.get("/:id", async (req, res) => {
  try {
    const db = getDB();
    const connection = await db.collection("connections").findOne({
      _id: new ObjectId(req.params.id),
      userId: req.session.userId,
    });
    if (!connection) return res.status(404).json({ error: "Connection not found" });

    // Who added this connection
    const addedBy = await db.collection("users").findOne(
      { _id: new ObjectId(req.session.userId) },
      { projection: { name: 1, email: 1 } }
    );

    // Workouts where current user is owner OR training partner, involving this connection
    const workouts = await db.collection("workouts").find({
      $or: [
        { userId: req.session.userId, trainingPartners: new ObjectId(req.params.id) },
        { userId: connection.linkedUserId, trainingPartners: new ObjectId(req.params.id) },
      ],
    }).sort({ date: -1 }).toArray();

    res.json({ ...connection, workouts, addedBy });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create connection — auto-mirrors to the other user as well
router.post("/", async (req, res) => {
  try {
    const db = getDB();
    const { email, gym, trainingStyle, howMet, notes } = req.body;

    if (!email) return res.status(400).json({ error: "Email address is required." });
    if (!gym || !trainingStyle) return res.status(400).json({ error: "Gym and training style are required." });

    // Validate user exists
    const linkedUser = await db.collection("users").findOne(
      { email: email.toLowerCase() },
      { projection: { password: 0 } }
    );
    if (!linkedUser) return res.status(404).json({ error: "No FitSync user found with this email address." });

    if (linkedUser._id.toString() === req.session.userId) {
      return res.status(400).json({ error: "You can't add yourself as a connection." });
    }

    // Duplicate check
    const existing = await db.collection("connections").findOne({
      userId: req.session.userId,
      linkedUserId: linkedUser._id.toString(),
    });
    if (existing) return res.status(409).json({ error: `${linkedUser.name} is already in your connections.` });

    // Get the current user's profile for the mirrored connection
    const currentUser = await db.collection("users").findOne(
      { _id: new ObjectId(req.session.userId) },
      { projection: { password: 0 } }
    );

    // ── Insert connection for the person who clicked Add (A → B) ─────────────
    const connAtoB = {
      userId: req.session.userId,
      linkedUserId: linkedUser._id.toString(),
      name: linkedUser.name,
      email: linkedUser.email,
      gym,
      trainingStyle,
      howMet: howMet || "",
      notes: notes || "",
      addedByUserId: req.session.userId,
      addedByName: req.session.userName,
      addedByEmail: req.session.userEmail,
      createdAt: new Date(),
    };
    const result = await db.collection("connections").insertOne(connAtoB);

    // ── Auto-mirror: insert connection for the other person (B → A) ───────────
    // Only if B doesn't already have A in their connections
    const mirrorExists = await db.collection("connections").findOne({
      userId: linkedUser._id.toString(),
      linkedUserId: req.session.userId,
    });

    if (!mirrorExists) {
      const connBtoA = {
        userId: linkedUser._id.toString(),
        linkedUserId: req.session.userId,
        name: currentUser.name,
        email: currentUser.email,
        gym: linkedUser.gym || gym,       // use their own gym if known
        trainingStyle: linkedUser.trainingStyle || trainingStyle,
        howMet: howMet || "",
        notes: "",                        // blank notes on their side — they can edit it
        addedByUserId: req.session.userId,
        addedByName: req.session.userName,
        addedByEmail: req.session.userEmail,
        autoAdded: true,                  // flag so we know it was auto-created
        createdAt: new Date(),
      };
      await db.collection("connections").insertOne(connBtoA);
    }

    res.status(201).json({ ...connAtoB, _id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update connection
router.put("/:id", async (req, res) => {
  try {
    const db = getDB();
    const { gym, trainingStyle, howMet, notes } = req.body;
    const result = await db.collection("connections").updateOne(
      { _id: new ObjectId(req.params.id), userId: req.session.userId },
      { $set: { gym, trainingStyle, howMet: howMet || "", notes: notes || "" } }
    );
    if (result.matchedCount === 0) return res.status(404).json({ error: "Connection not found" });
    res.json({ message: "Connection updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE connection — also removes the mirrored one on the other side
router.delete("/:id", async (req, res) => {
  try {
    const db = getDB();

    const conn = await db.collection("connections").findOne({
      _id: new ObjectId(req.params.id),
      userId: req.session.userId,
    });
    if (!conn) return res.status(404).json({ error: "Connection not found" });

    // Delete this side
    await db.collection("connections").deleteOne({ _id: new ObjectId(req.params.id) });

    // Delete the mirror on the other person's side too
    await db.collection("connections").deleteOne({
      userId: conn.linkedUserId,
      linkedUserId: req.session.userId,
    });

    res.json({ message: "Connection removed for both users." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
