/**
 * Script meant to run once a day via a systemd timer / cron.
 * Generates STORIES_PER_DAY new stories with Gemini and saves them as the
 * new "latest.json" served by the API.
 *
 * Usage: npm run generate   (dev, with tsx)
 *        npm run generate:built  (prod, after "npm run build")
 */
import { config } from "../config.js";
import { generateStoriesWithGemini } from "../gemini.js";
import { getLatestStories, saveDailyStories } from "../storyStore.js";

async function main() {
  console.log(`[${new Date().toISOString()}] Generating ${config.storiesPerDay} new stories with ${config.geminiModel}...`);

  const previous = await getLatestStories();
  const avoidTitles = previous?.stories.map((s) => s.title) ?? [];

  const stories = await generateStoriesWithGemini(config.storiesPerDay, avoidTitles);
  const saved = await saveDailyStories(stories);

  console.log(`[${new Date().toISOString()}] OK: ${saved.stories.length} stories saved.`);
  for (const s of saved.stories) console.log(` - (${s.difficulty}) ${s.title}`);
}

main().catch((err) => {
  console.error("Daily generation failed:", err);
  process.exitCode = 1;
});
