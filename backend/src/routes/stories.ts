import { Router } from "express";
import { config } from "../config.js";
import { generateStoriesWithGemini } from "../gemini.js";
import { getLatestStories, saveDailyStories } from "../storyStore.js";

export const storiesRouter = Router();

/** GET /api/stories: devuelve el ultimo lote generado, o 204 si no hay ninguno todavia. */
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
 * POST /api/admin/generate: dispara manualmente una generacion con Gemini.
 * Requiere header "x-admin-token" que coincida con ADMIN_TOKEN.
 * Pensado para pruebas manuales; la generacion diaria real la dispara el
 * systemd timer llamando al script generateDaily.
 */
storiesRouter.post("/admin/generate", async (req, res) => {
  const token = req.header("x-admin-token");
  if (!token || token !== config.adminToken) {
    res.status(401).json({ error: "token invalido" });
    return;
  }

  try {
    const previous = await getLatestStories();
    const avoidTitles = previous?.stories.map((s) => s.title) ?? [];
    const stories = await generateStoriesWithGemini(config.storiesPerDay, avoidTitles);
    const saved = await saveDailyStories(stories);
    res.json(saved);
  } catch (err) {
    console.error("Error generando historias:", err);
    res.status(500).json({ error: "fallo la generacion", detail: String(err) });
  }
});
