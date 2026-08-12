import { useState } from "react";
import type { Story } from "../types";

interface NarratorViewProps {
  story: Story;
  onFinish: () => void;
}

export default function NarratorView({ story, onFinish }: NarratorViewProps) {
  const [revealedHints, setRevealedHints] = useState(0);
  const [solutionArmed, setSolutionArmed] = useState(false);
  const [solutionShown, setSolutionShown] = useState(false);

  return (
    <section className="screen narrator">
      <div className="narrator-warning">Solo para quien narra — no muestres la pantalla al resto del grupo.</div>

      <h2>{story.title}</h2>

      <div className="teaser-card">
        <h3>Enigma (leélo en voz alta)</h3>
        <p>{story.teaser}</p>
      </div>

      {revealedHints > 0 && (
        <div className="hints-card">
          <h3>Pistas reveladas</h3>
          <ol>
            {story.hints.slice(0, revealedHints).map((hint, i) => (
              <li key={i}>{hint}</li>
            ))}
          </ol>
        </div>
      )}

      {revealedHints < story.hints.length && (
        <button className="ghost" onClick={() => setRevealedHints((n) => n + 1)}>
          Revelar siguiente pista ({revealedHints}/{story.hints.length})
        </button>
      )}

      <div className="solution-area">
        {!solutionShown ? (
          <>
            {!solutionArmed ? (
              <button className="danger" onClick={() => setSolutionArmed(true)}>
                Mostrar solución
              </button>
            ) : (
              <div className="confirm-row">
                <span>¿Seguro? Esto revela el final de la historia.</span>
                <button className="danger" onClick={() => setSolutionShown(true)}>
                  Sí, mostrar
                </button>
                <button className="ghost" onClick={() => setSolutionArmed(false)}>
                  Cancelar
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="solution-card">
            <h3>Solución completa</h3>
            <p>{story.solution}</p>
          </div>
        )}
      </div>

      <button className="primary" onClick={onFinish}>
        Terminar historia y volver
      </button>
    </section>
  );
}
