import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI environment variable is not set");
const dbName = process.env.MONGODB_DB_NAME || "wordle";

const client = new MongoClient(uri);
let db: Db;

export async function initializeDatabase() {
  await client.connect();
  db = client.db(dbName);
  await db.collection("players").createIndex({ playerId: 1 }, { unique: true });
  await db.collection("games").createIndex({ playerId: 1, date: 1 }, { unique: true });
  await db.collection("games").createIndex({ playerId: 1 });
  await db.collection("games").createIndex({ date: 1 });
}

export interface PlayerStats {
  playerId: string;
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  lastPlayedDate: string | null;
}

export interface GameRecord {
  playerId: string;
  date: string;
  solution: string;
  attempts: string[];
  won: boolean;
}

export async function getPlayerStats(playerId: string): Promise<PlayerStats | null> {
  const doc = await db.collection("players").findOne({ playerId });
  if (!doc) return null;
  return {
    playerId: doc.playerId,
    gamesPlayed: doc.gamesPlayed,
    gamesWon: doc.gamesWon,
    currentStreak: doc.currentStreak,
    maxStreak: doc.maxStreak,
    lastPlayedDate: doc.lastPlayedDate ?? null,
  };
}

export async function createOrUpdatePlayerStats(playerId: string, stats: Partial<PlayerStats>) {
  await db.collection("players").updateOne(
    { playerId },
    {
      $set: { ...stats, updatedAt: new Date() },
      $setOnInsert: { playerId, createdAt: new Date() },
    },
    { upsert: true }
  );
}

export async function saveGameRecord(record: GameRecord) {
  await db.collection("games").updateOne(
    { playerId: record.playerId, date: record.date },
    { $set: { ...record, createdAt: new Date() } },
    { upsert: true }
  );
}

export async function getGameRecord(playerId: string, date: string): Promise<GameRecord | null> {
  const doc = await db.collection("games").findOne({ playerId, date });
  if (!doc) return null;
  return {
    playerId: doc.playerId,
    date: doc.date,
    solution: doc.solution,
    attempts: doc.attempts,
    won: doc.won,
  };
}
