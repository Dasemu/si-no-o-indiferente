import { promises as fs } from "node:fs";
import path from "node:path";
import { config } from "./config.js";
import { ensureDataDir } from "./storyStore.js";
import { isNodeError, writeJsonAtomic } from "./lib/jsonFile.js";
import { RatingEntrySchema, type RatingEntry } from "./ratingSchema.js";

const RATINGS_FILE = "ratings.json";

function ratingsPath(): string {
  return path.join(config.dataDir, RATINGS_FILE);
}

/** Returns every rating ever submitted by players (empty array if none yet). */
export async function readRatings(): Promise<RatingEntry[]> {
  try {
    const raw = await fs.readFile(ratingsPath(), "utf8");
    const parsed = JSON.parse(raw);
    return RatingEntrySchema.array().parse(parsed);
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === "ENOENT") return [];
    throw err;
  }
}

/** Appends one player-submitted difficulty rating (1-5) for a story. */
export async function addRating(storyId: string, rating: number): Promise<void> {
  await ensureDataDir();
  const existing = await readRatings();
  existing.push({ storyId, rating, ratedAt: new Date().toISOString() });
  await writeJsonAtomic(ratingsPath(), existing);
}
