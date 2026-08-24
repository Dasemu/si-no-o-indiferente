import defaultStoriesRaw from "./data/defaultStories.json";
import type { StoryList } from "./types";

const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
const CACHE_KEY = "historias.cachedServerList.v1";
const FETCH_TIMEOUT_MS = 5000;

const defaultStories = defaultStoriesRaw as StoryList;

function readCachedServerList(): StoryList | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoryList;
  } catch {
    return null;
  }
}

function writeCachedServerList(list: StoryList): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(list));
  } catch {
    // localStorage may fail (private mode, quota full); not critical.
  }
}

async function fetchWithTimeout(url: string, ms: number, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Tries to fetch the updated story list from the backend.
 * If the backend doesn't respond, has no stories yet (204), or the network
 * fails: uses the last server list cached locally and, if that doesn't
 * exist either, falls back to the default story set bundled with the app.
 */
export async function loadStories(): Promise<StoryList> {
  try {
    const res = await fetchWithTimeout(`${API_URL}/api/stories`, FETCH_TIMEOUT_MS);
    if (res.status === 200) {
      const data = (await res.json()) as StoryList;
      if (Array.isArray(data.stories) && data.stories.length > 0) {
        writeCachedServerList(data);
        return data;
      }
    }
    // 204 (no stories generated yet) or another empty response: fall through.
  } catch {
    // No connection, timeout, CORS, etc.: fall through.
  }

  const cached = readCachedServerList();
  if (cached && cached.stories.length > 0) {
    return { ...cached, source: "cache" };
  }

  return defaultStories;
}

/**
 * Sends a player's voluntary 1-5 difficulty rating for a story to the
 * backend, for later periodic reclassification. Best-effort: failures
 * (offline, backend down, etc.) are swallowed since this is just a nice-to-
 * have signal, not something that should block the game flow.
 */
export async function submitRating(storyId: string, rating: number): Promise<void> {
  try {
    await fetchWithTimeout(`${API_URL}/api/stories/${encodeURIComponent(storyId)}/ratings`, FETCH_TIMEOUT_MS, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ rating }),
    });
  } catch {
    // No connection, timeout, CORS, etc.: nothing to do, the rating is just lost.
  }
}
