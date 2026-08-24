import { promises as fs } from "node:fs";
import path from "node:path";
import { config } from "./config.js";
import { isNodeError, writeJsonAtomic } from "./lib/jsonFile.js";
import { StoryListSchema, type Story, type StoryList } from "./storySchema.js";

const LATEST_FILE = "latest.json";

export async function ensureDataDir(): Promise<void> {
  await fs.mkdir(config.dataDir, { recursive: true });
}

function dailyFileName(date: Date): string {
  const iso = date.toISOString().slice(0, 10); // YYYY-MM-DD
  return `${iso}.json`;
}

/**
 * Saves a new batch of stories generated today, both in a dated file
 * (history) and in latest.json (what the API serves).
 */
export async function saveDailyStories(stories: Story[]): Promise<StoryList> {
  await ensureDataDir();
  const list: StoryList = {
    version: Date.now(),
    generatedAt: new Date().toISOString(),
    source: "gemini",
    stories,
  };
  StoryListSchema.parse(list);

  const dailyPath = path.join(config.dataDir, dailyFileName(new Date()));
  const latestPath = path.join(config.dataDir, LATEST_FILE);

  await writeJsonAtomic(dailyPath, list);
  await writeJsonAtomic(latestPath, list);

  return list;
}

/**
 * Returns the latest generated batch of stories (may be from a previous day
 * if today's generation hasn't run yet or failed). If nothing has ever been
 * generated, returns null and the client should use its embedded default set.
 */
export async function getLatestStories(): Promise<StoryList | null> {
  const latestPath = path.join(config.dataDir, LATEST_FILE);
  try {
    const raw = await fs.readFile(latestPath, "utf8");
    const parsed = StoryListSchema.parse(JSON.parse(raw));
    return parsed;
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === "ENOENT") return null;
    throw err;
  }
}
