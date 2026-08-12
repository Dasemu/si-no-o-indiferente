const USED_KEY = "historias.usedStoryIds.v1";

export function getUsedStoryIds(): string[] {
  try {
    const raw = localStorage.getItem(USED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function markStoryUsed(id: string): void {
  const used = new Set(getUsedStoryIds());
  used.add(id);
  try {
    localStorage.setItem(USED_KEY, JSON.stringify([...used]));
  } catch {
    // ignorar si localStorage no esta disponible
  }
}

export function resetUsedStories(): void {
  try {
    localStorage.removeItem(USED_KEY);
  } catch {
    // ignorar
  }
}
