import { connectDB, getDB } from "./connection.js";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";

// ── Fixed demo accounts (always present) ─────────────────────────────────────
const demoUsers = [
  { name: "Ayush Demo", email: "ayush@fitsync.app", password: "demo123" },
  { name: "Siddharth Demo", email: "siddharth@fitsync.app", password: "demo123" },
];

// ── Reference data for generating fake users ─────────────────────────────────
const firstNames = ["Alex","Jordan","Sam","Taylor","Morgan","Casey","Riley","Drew","Jamie","Avery",
  "Blake","Cameron","Dakota","Emerson","Finley","Hayden","Kendall","Logan","Parker","Peyton",
  "Quinn","Reese","Skyler","Tyler","Zoe","Liam","Emma","Noah","Olivia","Ethan","Mia","James",
  "Sofia","Aiden","Isabella","Oliver","Charlotte","Lucas","Ava","Mason","Ella","Elijah","Aria",
  "Jackson","Luna","Aiden","Chloe","Lucas","Penelope","Mateo","Layla","Levi","Riley","Sebastian",
  "Zoey","Jack","Nora","Owen","Lily","Theodore","Eleanor","Caleb","Hannah","Ryan","Lillian",
  "Nathan","Addison","Aaron","Aubrey","Isaiah","Ellie","Thomas","Stella","Charles","Natalie"];
const lastNames = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Wilson",
  "Moore","Taylor","Anderson","Thomas","Jackson","White","Harris","Martin","Thompson","Young",
  "Robinson","Lewis","Walker","Hall","Allen","Wright","Scott","Torres","Nguyen","Hill","Flores",
  "Green","Adams","Nelson","Baker","Campbell","Mitchell","Roberts","Carter","Phillips","Evans"];
const gyms = ["Planet Fitness","LA Fitness","Gold's Gym","Equinox","24 Hour Fitness","YMCA","Home Gym"];
const trainingStyles = ["Powerlifting","Bodybuilding","CrossFit","Calisthenics","General Fitness","Olympic Lifting"];
const domains = ["gmail.com","yahoo.com","outlook.com","hotmail.com","proton.me","icloud.com"];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randDate(daysBack) {
  const d = new Date();
  d.setDate(d.getDate() - randInt(0, daysBack));
  return d;
}

async function seed() {
  await connectDB();
  const db = getDB();

  // Clear all collections
  await db.collection("users").deleteMany({});
  await db.collection("workouts").deleteMany({});
  await db.collection("connections").deleteMany({});
  console.log("🗑  Cleared existing data");

  // ── Insert 2 fixed demo users ──────────────────────────────────────────────
  const demoDocs = await Promise.all(
    demoUsers.map(async (u) => ({
      _id: new ObjectId(),
      name: u.name,
      email: u.email.toLowerCase(),
      password: await bcrypt.hash(u.password, 10),
      role: "user",
      gym: rand(gyms),
      trainingStyle: rand(trainingStyles),
      joinedAt: new Date(),
      createdAt: new Date(),
    }))
  );

  // ── Generate 998 fake users (total = 1000) ─────────────────────────────────
  const usedEmails = new Set(demoUsers.map((u) => u.email));
  const fakeDocs = [];
  const hashedPw = await bcrypt.hash("demo123", 10); // same hash for all fake users (faster)

  while (fakeDocs.length < 998) {
    const first = rand(firstNames);
    const last = rand(lastNames);
    const num = randInt(1, 999);
    const email = `${first.toLowerCase()}.${last.toLowerCase()}${num}@${rand(domains)}`;
    if (usedEmails.has(email)) continue;
    usedEmails.add(email);

    fakeDocs.push({
      _id: new ObjectId(),
      name: `${first} ${last}`,
      email,
      password: hashedPw,
      role: "user",
      gym: rand(gyms),
      trainingStyle: rand(trainingStyles),
      joinedAt: randDate(730),
      createdAt: randDate(730),
    });
  }

  const allUsers = [...demoDocs, ...fakeDocs];
  await db.collection("users").insertMany(allUsers);
  console.log(`✅ Inserted ${allUsers.length} users`);

  // ── Seed 150 connections for Ayush demo user ───────────────────────────────
  const ayushId = demoDocs[0]._id.toString();
  const connections = [];
  for (let i = 0; i < 150; i++) {
    connections.push({
      _id: new ObjectId(),
      userId: ayushId,
      name: `${rand(firstNames)} ${rand(lastNames)}`,
      gym: rand(gyms),
      trainingStyle: rand(trainingStyles),
      howMet: rand(["At the gym","Through a friend","University rec center","Online community","Sports team","Personal trainer"]),
      notes: `Great training partner. Focused on ${rand(trainingStyles).toLowerCase()}.`,
      createdAt: randDate(365),
    });
  }
  await db.collection("connections").insertMany(connections);
  console.log(`✅ Inserted ${connections.length} connections`);

  // ── Seed 200 workouts for Ayush demo user ─────────────────────────────────
  const muscleGroups = ["Chest","Back","Legs","Shoulders","Arms","Core","Full Body","Cardio"];
  const workoutTypes = ["Strength","Cardio","Flexibility","HIIT","Powerlifting"];
  const exercises = {
    Chest: ["Bench Press","Incline Press","Cable Flyes","Push-ups","Dips"],
    Back: ["Deadlift","Pull-ups","Barbell Row","Lat Pulldown","Cable Row"],
    Legs: ["Squat","Leg Press","Romanian Deadlift","Lunges","Leg Curl"],
    Shoulders: ["Overhead Press","Lateral Raises","Front Raises","Face Pulls","Arnold Press"],
    Arms: ["Barbell Curl","Tricep Pushdown","Hammer Curl","Skull Crushers","Preacher Curl"],
    Core: ["Plank","Crunches","Russian Twists","Leg Raises","Cable Crunch"],
    "Full Body": ["Burpees","Kettlebell Swings","Clean and Press","Thrusters","Turkish Get-up"],
    Cardio: ["Running","Cycling","Jump Rope","Rowing","Stair Climber"],
  };

  const workouts = [];
  const usedKeys = new Set();
  let attempts = 0;
  while (workouts.length < 200 && attempts < 5000) {
    attempts++;
    const muscleGroup = rand(muscleGroups);
    const type = rand(workoutTypes);
    const date = randDate(730);
    const dateStr = date.toISOString().split("T")[0];
    const key = `${ayushId}-${dateStr}-${muscleGroup}-${type}`;
    if (usedKeys.has(key)) continue;
    usedKeys.add(key);

    const exList = exercises[muscleGroup];
    const workoutExercises = Array.from({ length: randInt(2, 5) }, () => ({
      name: rand(exList), sets: randInt(2, 5), reps: randInt(6, 20), weight: randInt(20, 315),
    }));
    const trainingPartners = Array.from({ length: randInt(0, 2) }, () => rand(connections)._id);

    workouts.push({
      _id: new ObjectId(),
      userId: ayushId,
      date, muscleGroup, type,
      duration: randInt(30, 120),
      exercises: workoutExercises,
      trainingPartners,
      notes: `${rand(["Great","Tough","Solid","Quick","Intense"])} ${muscleGroup.toLowerCase()} session.`,
      createdAt: randDate(730),
    });
  }
  await db.collection("workouts").insertMany(workouts);
  console.log(`✅ Inserted ${workouts.length} workouts`);

  console.log("\n🎉 Seed complete!");
  console.log("─────────────────────────────────────────────");
  console.log("Database: fitsync2");
  console.log("Collections: users (1000), connections (150), workouts (200)");
  console.log("\nDemo logins:");
  console.log("  ayush@fitsync.app    / demo123");
  console.log("  siddharth@fitsync.app / demo123");
  console.log("\nAdmin login password: admin123");
  console.log("─────────────────────────────────────────────");
  process.exit(0);
}

seed().catch((err) => { console.error("Seed failed:", err); process.exit(1); });
