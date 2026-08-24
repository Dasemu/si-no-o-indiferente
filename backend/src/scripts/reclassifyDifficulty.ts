/**
 * Script meant to run periodically via a systemd timer / cron.
 * Aggregates player-submitted difficulty ratings (1-5) per story and, for
 * stories with enough ratings, updates their difficulty band in the
 * currently served batch (latest.json). Stories from the frontend's
 * embedded default set aren't affected since the backend has no way to
 * modify the client bundle.
 *
 * Usage: npm run reclassify        (dev, with tsx)
 *        npm run reclassify:built  (prod, after "npm run build")
 */
import { config } from "../config.js";
import { readRatings } from "../ratingStore.js";
import type { Difficulty } from "../storySchema.js";
import { getLatestStories, saveDailyStories } from "../storyStore.js";

/** Maps a 1-5 average rating to a difficulty band, splitting the scale into three equal thirds. */
function difficultyFromAverage(average: number): Difficulty {
  if (average <= 2.33) return "easy";
  if (average <= 3.67) return "medium";
  return "hard";
}

async function main() {
  const ratings = await readRatings();
  if (ratings.length === 0) {
    console.log(`[${new Date().toISOString()}] No ratings collected yet, nothing to reclassify.`);
    return;
  }

  const byStory = new Map<string, number[]>();
  for (const entry of ratings) {
    const list = byStory.get(entry.storyId) ?? [];
    list.push(entry.rating);
    byStory.set(entry.storyId, list);
  }

  const latest = await getLatestStories();
  if (!latest) {
    console.log(`[${new Date().toISOString()}] No generated story batch to reclassify (backend hasn't generated any yet).`);
    return;
  }

  let changed = 0;
  const updatedStories = latest.stories.map((story) => {
    const votes = byStory.get(story.id);
    if (!votes || votes.length < config.minRatingsForReclassification) return story;

    const average = votes.reduce((sum, v) => sum + v, 0) / votes.length;
    const newDifficulty = difficultyFromAverage(average);
    if (newDifficulty === story.difficulty) return story;

    changed++;
    console.log(
      ` - "${story.title}": ${story.difficulty} -> ${newDifficulty} (avg ${average.toFixed(2)} over ${votes.length} ratings)`
    );
    return { ...story, difficulty: newDifficulty };
  });

  if (changed === 0) {
    console.log(`[${new Date().toISOString()}] Reviewed ${byStory.size} rated stories, no difficulty changes needed.`);
    return;
  }

  await saveDailyStories(updatedStories);
  console.log(`[${new Date().toISOString()}] OK: reclassified ${changed} stor${changed === 1 ? "y" : "ies"}.`);
}

main().catch((err) => {
  console.error("Difficulty reclassification failed:", err);
  process.exitCode = 1;
});
