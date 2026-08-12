import { promises as fs } from "node:fs";
import path from "node:path";
import { config } from "./config.js";
import { StoryListSchema, type Story, type StoryList } from "./storySchema.js";

const LATEST_FILE = "latest.json";

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(config.dataDir, { recursive: true });
}

function dailyFileName(date: Date): string {
  const iso = date.toISOString().slice(0, 10); // YYYY-MM-DD
  return `${iso}.json`;
}

/** Escritura atomica: escribe a un archivo temporal y luego renombra. */
async function writeJsonAtomic(filePath: string, data: unknown): Promise<void> {
  const tmpPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmpPath, filePath);
}

/**
 * Guarda un nuevo lote de historias generado hoy, tanto en un archivo fechado
 * (historial) como en latest.json (lo que sirve la API).
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
 * Devuelve el ultimo lote de historias generado (puede ser de un dia anterior
 * si la generacion de hoy todavia no corrio o fallo). Si nunca se genero
 * nada, devuelve null y el cliente debe usar su set default embebido.
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

function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return typeof err === "object" && err !== null && "code" in err;
}
