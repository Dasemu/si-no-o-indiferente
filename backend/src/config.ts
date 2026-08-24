import "dotenv/config";
import path from "node:path";

function required(name: string, value: string | undefined, fallback?: string): string {
  if (value && value.length > 0) return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing environment variable ${name}`);
}

export const config = {
  port: Number(process.env.PORT ?? 8787),
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  storiesPerDay: Number(process.env.STORIES_PER_DAY ?? 5),
  dataDir: path.resolve(process.cwd(), process.env.DATA_DIR ?? "./data"),
  adminToken: required("ADMIN_TOKEN", process.env.ADMIN_TOKEN, "change-this-token"),
  minRatingsForReclassification: Number(process.env.MIN_RATINGS_FOR_RECLASSIFICATION ?? 3),
};
