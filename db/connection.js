import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

let db;

export async function connectDB() {
  await client.connect();
  db = client.db("fitsync");
  console.log("Connected to MongoDB");
  return db;
}

export function getDB() {
  if (!db) throw new Error("DB not initialized. Call connectDB first.");
  return db;
}
