import { config } from "./config.js";
import { GeminiStoryBatchSchema, type Story } from "./storySchema.js";

const GEMINI_ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

// Subconjunto de OpenAPI que acepta el "structured output" de Gemini.
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    stories: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          title: { type: "STRING" },
          difficulty: { type: "STRING", enum: ["easy", "medium", "hard"] },
          tags: { type: "ARRAY", items: { type: "STRING" } },
          teaser: { type: "STRING" },
          hints: { type: "ARRAY", items: { type: "STRING" } },
          solution: { type: "STRING" },
        },
        required: ["id", "title", "difficulty", "tags", "teaser", "hints", "solution"],
      },
    },
  },
  required: ["stories"],
};

function buildPrompt(count: number, avoidTitles: string[]): string {
  const avoidList = avoidTitles.length
    ? `Evita repetir o parafrasear estos titulos ya usados: ${avoidTitles.join(", ")}.`
    : "";

  return `Sos un escritor experto en acertijos narrativos de pensamiento lateral, en el estilo del juego de mesa "historias negras"/"black stories": se cuenta un enigma breve y desconcertante (el "teaser"), y los jugadores deben adivinar la explicacion completa (la "solution") haciendo preguntas de si/no.

Genera exactamente ${count} historias completamente ORIGINALES en español (no copies acertijos clasicos ni de ningun juego comercial existente). Cada historia debe tener:
- id: slug corto en minusculas separado por guiones, unico, derivado del titulo.
- title: titulo corto y evocador.
- difficulty: "easy", "medium" o "hard", variando entre las ${count} historias.
- tags: 1 a 3 palabras clave en minusculas.
- teaser: 2 a 4 frases. Presenta una situacion extraña o aparentemente inexplicable, resoluble con preguntas de si/no. No debe insinuar la solucion.
- hints: entre 3 y 4 pistas progresivas (de mas vaga a mas reveladora) que el narrador puede leer si los jugadores estan trabados, sin regalar la solucion completa en las primeras.
- solution: la explicacion completa y coherente que resuelve el enigma, respondiendo a todo lo planteado en el teaser. 4 a 8 frases.

Las historias deben ser aptas para todo publico (sin violencia grafica extrema, sin contenido sexual), pueden ser misteriosas, agridulces o con un giro emotivo, pero siempre con una explicacion logica y satisfactoria. ${avoidList}

Devolve unicamente el JSON que respeta el schema indicado.`;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
}

export async function generateStoriesWithGemini(
  count: number,
  avoidTitles: string[] = []
): Promise<Story[]> {
  if (!config.geminiApiKey) {
    throw new Error("GEMINI_API_KEY no esta configurada");
  }

  const body = {
    contents: [{ parts: [{ text: buildPrompt(count, avoidTitles) }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 1,
    },
  };

  const res = await fetch(`${GEMINI_ENDPOINT(config.geminiModel)}?key=${config.geminiApiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Respuesta de Gemini sin contenido de texto");
  }

  const parsedJson = JSON.parse(text);
  const validated = GeminiStoryBatchSchema.parse(parsedJson);

  // Aseguramos ids unicos por si el modelo repite alguno.
  const seen = new Set<string>();
  for (const story of validated.stories) {
    let id = story.id;
    while (seen.has(id)) id = `${id}-2`;
    seen.add(id);
    story.id = id;
  }

  return validated.stories.slice(0, count);
}
