/**
 * Script pensado para correr una vez al dia via systemd timer / cron.
 * Genera STORIES_PER_DAY historias nuevas con Gemini y las guarda como el
 * nuevo "latest.json" que sirve la API.
 *
 * Uso: npm run generate   (dev, con tsx)
 *      npm run generate:built  (prod, tras "npm run build")
 */
import { config } from "../config.js";
import { generateStoriesWithGemini } from "../gemini.js";
import { getLatestStories, saveDailyStories } from "../storyStore.js";

async function main() {
  console.log(`[${new Date().toISOString()}] Generando ${config.storiesPerDay} historias nuevas con ${config.geminiModel}...`);

  const previous = await getLatestStories();
  const avoidTitles = previous?.stories.map((s) => s.title) ?? [];

  const stories = await generateStoriesWithGemini(config.storiesPerDay, avoidTitles);
  const saved = await saveDailyStories(stories);

  console.log(`[${new Date().toISOString()}] OK: ${saved.stories.length} historias guardadas.`);
  for (const s of saved.stories) console.log(` - (${s.difficulty}) ${s.title}`);
}

main().catch((err) => {
  console.error("Fallo la generacion diaria:", err);
  process.exitCode = 1;
});
