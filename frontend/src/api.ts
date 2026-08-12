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
    // localStorage puede fallar (modo privado, cuota llena); no es critico.
  }
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Intenta obtener la lista de historias actualizada del backend.
 * Si el backend no responde, no tiene historias todavia (204), o falla la
 * red: usa la ultima lista del servidor que haya quedado cacheada localmente
 * y, si tampoco existe, cae en el set de historias default embebido en la app.
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
    // 204 (sin historias generadas aun) u otra respuesta vacia: seguimos abajo.
  } catch {
    // sin conexion, timeout, CORS, etc.: seguimos abajo.
  }

  const cached = readCachedServerList();
  if (cached && cached.stories.length > 0) {
    return { ...cached, source: "cache" };
  }

  return defaultStories;
}
