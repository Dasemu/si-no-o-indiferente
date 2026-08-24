import { useState } from "react";
import type { Story } from "../types";

interface RateStoryProps {
  story: Story;
  onSubmit: (rating: number) => void;
  onSkip: () => void;
}

const SCALE_LABELS: Record<number, string> = {
  1: "Muy fácil",
  2: "Fácil",
  3: "Media",
  4: "Difícil",
  5: "Muy difícil",
};

export default function RateStory({ story, onSubmit, onSkip }: RateStoryProps) {
  const [rating, setRating] = useState(3);

  return (
    <section className="screen rate">
      <p className="case-tag">Cierre del caso</p>
      <h2>¿Qué dificultad le pondrías a “{story.title}”?</h2>
      <p className="subtitle">
        Es completamente voluntario. Tu valoración ayuda a reclasificar la dificultad de esta historia con el tiempo.
      </p>

      <div className="rate-card">
        <input
          className="rate-slider"
          type="range"
          min={1}
          max={5}
          step={1}
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
        />
        <div className="rate-scale">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className={n === rating ? "rate-tick is-active" : "rate-tick"}>
              {n}
            </span>
          ))}
        </div>
        <p className="rate-label">{SCALE_LABELS[rating]}</p>
      </div>

      <button className="primary" onClick={() => onSubmit(rating)}>
        Enviar valoración
      </button>
      <button className="ghost" onClick={onSkip}>
        Omitir
      </button>
    </section>
  );
}
