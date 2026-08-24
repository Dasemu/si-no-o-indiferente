import type { StoryList } from "../types";

interface HomeProps {
  loading: boolean;
  storyList: StoryList | null;
  usedCount: number;
  onPlay: () => void;
  onResetUsed: () => void;
}

export default function Home({ loading, storyList, usedCount, onPlay, onResetUsed }: HomeProps) {
  return (
    <section className="screen home">
      <p className="case-tag">Expediente confidencial</p>
      <h1>Sí, no, o indiferente</h1>
      <p className="subtitle">
        Un jugador narra un enigma y el resto pregunta con sí o no hasta descubrir la historia completa.
      </p>

      <div className="rules-card">
        <h2>Cómo se juega</h2>
        <ol>
          <li>Elegid quién narra primero. Esa persona coge el móvil.</li>
          <li>El narrador elige una historia y lee en voz alta el enigma.</li>
          <li>Los demás jugadores hacen preguntas que se respondan con sí, no, o "no es relevante".</li>
          <li>El narrador tiene la solución siempre a la vista para comprobar las respuestas.</li>
          <li>Cuando el grupo adivina (o se rinde), el narrador muestra la solución completa.</li>
        </ol>
      </div>

      <button className="primary" onClick={onPlay} disabled={loading || !storyList}>
        {loading ? "Cargando…" : "Jugar"}
      </button>

      {usedCount > 0 && (
        <button className="ghost" onClick={onResetUsed}>
          Reiniciar historias jugadas ({usedCount})
        </button>
      )}
    </section>
  );
}
