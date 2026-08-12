import type { StoryList } from "../types";

interface HomeProps {
  loading: boolean;
  storyList: StoryList | null;
  usedCount: number;
  onPlay: () => void;
  onResetUsed: () => void;
}

function sourceLabel(storyList: StoryList | null): string {
  if (!storyList) return "";
  switch (storyList.source) {
    case "gemini":
      return `Historias actualizadas (${new Date(storyList.generatedAt ?? "").toLocaleDateString()})`;
    case "cache":
      return "Historias guardadas (sin conexión ahora)";
    default:
      return "Historias por defecto";
  }
}

export default function Home({ loading, storyList, usedCount, onPlay, onResetUsed }: HomeProps) {
  return (
    <section className="screen home">
      <h1>Historias Incompletas</h1>
      <p className="subtitle">
        Un jugador narra un enigma, el resto pregunta con sí o no hasta descubrir la historia completa.
      </p>

      <div className="rules-card">
        <h2>Cómo se juega</h2>
        <ol>
          <li>Elijan quién narra primero. Esa persona toma el celular.</li>
          <li>El narrador elige una historia y lee en voz alta solo el enigma.</li>
          <li>Los demás jugadores hacen preguntas que se respondan con sí, no, o "no es relevante".</li>
          <li>El narrador puede dar pistas si el grupo se traba.</li>
          <li>Cuando adivinan (o se rinden), el narrador lee la solución completa.</li>
        </ol>
      </div>

      <div className="status-row">
        {loading ? (
          <span className="badge">Cargando historias…</span>
        ) : (
          <span className="badge">{sourceLabel(storyList)} · {storyList?.stories.length ?? 0} historias</span>
        )}
      </div>

      <button className="primary" onClick={onPlay} disabled={loading || !storyList}>
        Jugar
      </button>

      {usedCount > 0 && (
        <button className="ghost" onClick={onResetUsed}>
          Reiniciar historias jugadas ({usedCount})
        </button>
      )}
    </section>
  );
}
