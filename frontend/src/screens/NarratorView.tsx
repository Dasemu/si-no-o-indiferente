import { useState } from "react";
import type { Story } from "../types";

interface NarratorViewProps {
  story: Story;
  onFinish: () => void;
  onBack: () => void;
}

export default function NarratorView({ story, onFinish, onBack }: NarratorViewProps) {
  const [solutionHidden, setSolutionHidden] = useState(true);

  return (
    <section className="screen narrator">
      <header className="narrator-header">
        <button className="ghost" onClick={onBack}>
          ← Volver
        </button>
        <h2>{story.title}</h2>
      </header>

      <div className="teaser-card">
        <h3>Enigma</h3>
        <p>{story.teaser}</p>
      </div>

      <div className="solution-card">
        <div className="solution-card-header">
          <h3>Solución completa</h3>
          <button className="icon-toggle" onClick={() => setSolutionHidden((v) => !v)}>
            {solutionHidden ? "Mostrar" : "Ocultar"}
          </button>
        </div>
        <p className={solutionHidden ? "solution-text is-hidden" : "solution-text"}>{story.solution}</p>
        {solutionHidden && <span className="confidential-stamp">Confidencial</span>}
      </div>

      <button className="primary" onClick={onFinish}>
        Terminar historia y volver
      </button>
    </section>
  );
}
