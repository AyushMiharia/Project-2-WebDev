// routes/ayush/workouts.js — Ayush's section: Workout Management
import { Router } from "express";
import { getDB } from "../../db/connection.js";
import { ObjectId } from "mongodb";

const router = Router();

// GET all workouts — own workouts + workouts where user is a training partner
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const { muscleGroup, type, dateFrom, dateTo, duration, search } = req.query;
    const userId = req.session.userId;

    // Base: own workouts OR workouts where this user appears as a connection/partner
    // Training partners are stored as connection ObjectIds, so we need to find
    // the connection doc that links this user, then match by that connection _id
    const myConnectionDocs = await db.collection("connections")
      .find({ linkedUserId: userId })
      .project({ _id: 1 })
      .toArray();
    const myConnectionIds = myConnectionDocs.map((c) => c._id);

    const baseOr = [
      { userId },
      ...(myConnectionIds.length > 0 ? [{ trainingPartners: { $in: myConnectionIds } }] : []),
    ];

    const filter = { $or: baseOr };

    if (muscleGroup) filter.muscleGroup = muscleGroup;
    if (type) filter.type = type;
    if (duration) filter.duration = { $lte: Number(duration) };
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }
    if (search) {
      filter.$and = [
        { $or: baseOr },
        {
          $or: [
            { muscleGroup: { $regex: search, $options: "i" } },
            { notes: { $regex: search, $options: "i" } },
            { "exercises.name": { $regex: search, $options: "i" } },
          ],
        },
      ];
      delete filter.$or;
    }

    const workouts = await db.collection("workouts").find(filter).sort({ date: -1 }).limit(100).toArray();

    // Populate training partners from connections
    const allPartnerIds = workouts.flatMap((w) => w.trainingPartners || []);
    let partnersMap = {};
    if (allPartnerIds.length > 0) {
      const partners = await db.collection("connections").find({ _id: { $in: allPartnerIds } }).toArray();
      partnersMap = Object.fromEntries(partners.map((p) => [p._id.toString(), p]));
    }

    // Populate owner info for workouts created by others (shared)
    const ownerIds = [...new Set(workouts.filter((w) => w.userId !== userId).map((w) => w.userId))];
    let ownerMap = {};
    if (ownerIds.length > 0) {
      const owners = await db.collection("users")
        .find({ _id: { $in: ownerIds.map((id) => new ObjectId(id)) } }, { projection: { password: 0 } })
        .toArray();
      ownerMap = Object.fromEntries(owners.map((o) => [o._id.toString(), o]));
    }

    const enriched = workouts.map((w) => ({
      ...w,
      trainingPartners: (w.trainingPartners || []).map((id) => partnersMap[id.toString()] || { _id: id, name: "Unknown" }),
      isOwner: w.userId === userId,
      sharedBy: w.userId !== userId ? ownerMap[w.userId] || null : null,
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET workout stats — own + shared
router.get("/stats", async (req, res) => {
  try {
    const db = getDB();
    const userId = req.session.userId;

    const myConnectionDocs = await db.collection("connections")
      .find({ linkedUserId: userId })
      .project({ _id: 1 })
      .toArray();
    const myConnectionIds = myConnectionDocs.map((c) => c._id);

    const match = {
      $or: [
        { userId },
        ...(myConnectionIds.length > 0 ? [{ trainingPartners: { $in: myConnectionIds } }] : []),
      ],
    };

    const total = await db.collection("workouts").countDocuments(match);

    const byMuscle = await db.collection("workouts").aggregate([
      { $match: match },
      { $group: { _id: "$muscleGroup", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray();

    const avgDuration = await db.collection("workouts").aggregate([
      { $match: match },
      { $group: { _id: null, avg: { $avg: "$duration" } } },
    ]).toArray();

    const byWeek = await db.collection("workouts").aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: "%Y-%U", date: "$date" } }, count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: 12 },
    ]).toArray();

    const byType = await db.collection("workouts").aggregate([
      { $match: match },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]).toArray();

    res.json({
      total,
      byMuscle,
      avgDuration: Math.round(avgDuration[0]?.avg || 0),
      byWeek: byWeek.reverse(),
      byType,
      topMuscle: byMuscle[0]?._id || "—",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single workout
router.get("/:id", async (req, res) => {
  try {
    const db = getDB();
    const userId = req.session.userId;

    const myConnectionDocs = await db.collection("connections")
      .find({ linkedUserId: userId })
      .project({ _id: 1 })
      .toArray();
    const myConnectionIds = myConnectionDocs.map((c) => c._id);

    const workout = await db.collection("workouts").findOne({
      _id: new ObjectId(req.params.id),
      $or: [
        { userId },
        ...(myConnectionIds.length > 0 ? [{ trainingPartners: { $in: myConnectionIds } }] : []),
      ],
    });
    if (!workout) return res.status(404).json({ error: "Workout not found" });

    if (workout.trainingPartners?.length > 0) {
      const partners = await db.collection("connections").find({ _id: { $in: workout.trainingPartners } }).toArray();
      workout.trainingPartners = partners;
    }
    workout.isOwner = workout.userId === userId;
    res.json(workout);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create workout (with duplicate prevention)
router.post("/", async (req, res) => {
  try {
    const db = getDB();
    const { date, muscleGroup, type, duration, exercises, trainingPartners, notes } = req.body;
    if (!date || !muscleGroup || !type || !duration)
      return res.status(400).json({ error: "date, muscleGroup, type, and duration are required." });

    // Duplicate check
    const existing = await db.collection("workouts").findOne({
      userId: req.session.userId,
      date: new Date(date),
      muscleGroup,
      type,
    });
    if (existing) return res.status(409).json({ error: "Duplicate: a workout with the same date, muscle group, and type already exists." });

    const partnerIds = (trainingPartners || []).map((id) => new ObjectId(id));
    const workout = {
      userId: req.session.userId,
      date: new Date(date),
      muscleGroup,
      type,
      duration: Number(duration),
      exercises: exercises || [],
      trainingPartners: partnerIds,
      notes: notes || "",
      createdAt: new Date(),
    };
    const result = await db.collection("workouts").insertOne(workout);
    res.status(201).json({ ...workout, _id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update workout — owner OR training partner can edit
// IMPORTANT: only the owner can change trainingPartners; partners can edit everything else
router.put("/:id", async (req, res) => {
  try {
    const db = getDB();
    const { date, muscleGroup, type, duration, exercises, trainingPartners, notes } = req.body;
    const userId = req.session.userId;

    // Get the workout first to check access
    const workout = await db.collection("workouts").findOne({ _id: new ObjectId(req.params.id) });
    if (!workout) return res.status(404).json({ error: "Workout not found." });

    const isOwner = workout.userId === userId;

    // Check if user is a training partner on this workout
    const myConnectionDocs = await db.collection("connections")
      .find({ linkedUserId: userId })
      .project({ _id: 1 })
      .toArray();
    const myConnectionIds = myConnectionDocs.map((c) => c._id.toString());
    const isPartner = (workout.trainingPartners || []).some((pid) => myConnectionIds.includes(pid.toString()));

    if (!isOwner && !isPartner) {
      return res.status(403).json({ error: "You don't have access to edit this workout." });
    }

    // Build the update — partners cannot change trainingPartners (avoids breaking visibility)
    const updateFields = {
      date: new Date(date),
      muscleGroup,
      type,
      duration: Number(duration),
      exercises: exercises || [],
      notes: notes || "",
    };

    // Only the owner can update who's tagged as training partners
    if (isOwner && trainingPartners) {
      updateFields.trainingPartners = trainingPartners.map((id) => new ObjectId(id));
    }

    await db.collection("workouts").updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateFields }
    );

    res.json({ message: "Workout updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE workout — owner OR training partner can delete (removes for everyone)
router.delete("/:id", async (req, res) => {
  try {
    const db = getDB();
    const userId = req.session.userId;

    const workout = await db.collection("workouts").findOne({ _id: new ObjectId(req.params.id) });
    if (!workout) return res.status(404).json({ error: "Workout not found." });

    const isOwner = workout.userId === userId;

    // Check if user is a training partner
    const myConnectionDocs = await db.collection("connections")
      .find({ linkedUserId: userId })
      .project({ _id: 1 })
      .toArray();
    const myConnectionIds = myConnectionDocs.map((c) => c._id.toString());
    const isPartner = (workout.trainingPartners || []).some((pid) => myConnectionIds.includes(pid.toString()));

    if (!isOwner && !isPartner) {
      return res.status(403).json({ error: "You don't have access to delete this workout." });
    }

    await db.collection("workouts").deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: "Workout deleted for everyone." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
