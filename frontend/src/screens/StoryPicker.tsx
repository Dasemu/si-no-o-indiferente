import { useMemo, useState } from "react";
import type { Difficulty, Story } from "../types";

interface StoryPickerProps {
  stories: Story[];
  usedIds: string[];
  onPick: (story: Story) => void;
  onBack: () => void;
}

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Fácil",
  medium: "Media",
  hard: "Difícil",
};

export default function StoryPicker({ stories, usedIds, onPick, onBack }: StoryPickerProps) {
  const [hideUsed, setHideUsed] = useState(true);
  const usedSet = useMemo(() => new Set(usedIds), [usedIds]);

  const visible = useMemo(
    () => stories.filter((s) => !hideUsed || !usedSet.has(s.id)),
    [stories, hideUsed, usedSet]
  );

  function pickRandom() {
    const pool = stories.filter((s) => !usedSet.has(s.id));
    const source = pool.length > 0 ? pool : stories;
    const chosen = source[Math.floor(Math.random() * source.length)];
    onPick(chosen);
  }

  return (
    <section className="screen picker">
      <header className="picker-header">
        <button className="ghost" onClick={onBack}>
          ← Volver
        </button>
        <h2>Elige una historia</h2>
      </header>

      <div className="picker-controls">
        <button className="primary" onClick={pickRandom} disabled={stories.length === 0}>
          Elegir al azar
        </button>
        <label className="checkbox">
          <input type="checkbox" checked={hideUsed} onChange={(e) => setHideUsed(e.target.checked)} />
          Ocultar ya jugadas
        </label>
      </div>

      <ul className="story-list">
        {visible.map((story) => (
          <li key={story.id}>
            <button className="story-card" onClick={() => onPick(story)}>
              <div className="story-card-title-row">
                <span className="story-title">{story.title}</span>
                <span className={`difficulty difficulty-${story.difficulty}`}>
                  {DIFFICULTY_LABEL[story.difficulty]}
                </span>
              </div>
              {story.tags.length > 0 && (
                <div className="tags">
                  {story.tags.map((tag) => (
                    <span key={tag} className="tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              {usedSet.has(story.id) && <span className="used-flag">Ya jugada</span>}
            </button>
          </li>
        ))}
      </ul>

      {visible.length === 0 && <p className="empty">No quedan historias sin jugar. Reinicia desde el inicio.</p>}
    </section>
  );
}
