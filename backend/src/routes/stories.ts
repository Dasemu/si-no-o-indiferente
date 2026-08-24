import { Router } from "express";
import { config } from "../config.js";
import { generateStoriesWithGemini } from "../gemini.js";
import { addRating } from "../ratingStore.js";
import { RatingInputSchema } from "../ratingSchema.js";
import { getLatestStories, saveDailyStories } from "../storyStore.js";

export const storiesRouter = Router();

/** GET /api/stories: returns the latest generated batch, or 204 if none exists yet. */
storiesRouter.get("/stories", async (_req, res) => {
  const latest = await getLatestStories();
  if (!latest) {
    res.status(204).end();
    return;
  }
  res.set("Cache-Control", "public, max-age=300");
  res.json(latest);
});

/**
 * POST /api/stories/:id/ratings: records a player's voluntary 1-5 difficulty
 * rating for a story once the round is over. Open endpoint, no auth — this
 * is a low-stakes, best-effort signal used later by the reclassification
 * script, not a security-sensitive write. Works for any story id, including
 * ones from the default set embedded in the frontend (the backend doesn't
 * need to know a story to accept a rating for it).
 */
storiesRouter.post("/stories/:id/ratings", async (req, res) => {
  const parsed = RatingInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid rating" });
    return;
  }
  await addRating(req.params.id, parsed.data.rating);
  res.status(204).end();
});

/**
 * POST /api/admin/generate: manually triggers a generation run with Gemini.
 * Requires an "x-admin-token" header matching ADMIN_TOKEN.
 * Meant for manual testing; the real daily generation is triggered by the
 * systemd timer calling the generateDaily script.
 */
storiesRouter.post("/admin/generate", async (req, res) => {
  const token = req.header("x-admin-token");
  if (!token || token !== config.adminToken) {
    res.status(401).json({ error: "invalid token" });
    return;
  }

  try {
    const previous = await getLatestStories();
    const avoidTitles = previous?.stories.map((s) => s.title) ?? [];
    const stories = await generateStoriesWithGemini(config.storiesPerDay, avoidTitles);
    const saved = await saveDailyStories(stories);
    res.json(saved);
  } catch (err) {
    console.error("Error generating stories:", err);
    res.status(500).json({ error: "generation failed", detail: String(err) });
  }
});
