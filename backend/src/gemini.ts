import { config } from "./config.js";
import { GeminiStoryBatchSchema, type Story } from "./storySchema.js";

const GEMINI_ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

// Subset of OpenAPI accepted by Gemini's "structured output".
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
          solution: { type: "STRING" },
        },
        required: ["id", "title", "difficulty", "tags", "teaser", "solution"],
      },
    },
  },
  required: ["stories"],
};

function buildPrompt(count: number, avoidTitles: string[]): string {
  const avoidList = avoidTitles.length
    ? `Evita repetir o parafrasear estos títulos ya usados: ${avoidTitles.join(", ")}.`
    : "";

  return `Eres un escritor experto en acertijos narrativos de pensamiento lateral, al estilo del juego de mesa "historias negras"/"black stories": se cuenta un enigma breve y desconcertante (el "teaser"), y los jugadores deben adivinar la explicación completa (la "solution") haciendo preguntas de sí/no.

Genera exactamente ${count} historias completamente ORIGINALES en español (no copies acertijos clásicos ni de ningún juego comercial existente). Cada historia debe tener:
- id: slug corto en minúsculas separado por guiones, único, derivado del título.
- title: título corto y evocador.
- difficulty: "easy", "medium" o "hard", variando entre las ${count} historias.
- tags: 1 a 3 palabras clave en minúsculas.
- teaser: 2 a 4 frases. Presenta una situación extraña o aparentemente inexplicable, resoluble con preguntas de sí/no. No debe insinuar la solución.
- solution: la explicación completa y coherente que resuelve el enigma, respondiendo a todo lo planteado en el teaser. 4 a 8 frases.

Las historias deben ser aptas para todo público (sin violencia gráfica extrema, sin contenido sexual), pueden ser misteriosas, agridulces o con un giro emotivo, pero siempre con una explicación lógica y satisfactoria. ${avoidList}

Importante sobre el idioma: todo el texto de cada historia (title, teaser, solution y tags) debe estar escrito en castellano de España (español peninsular), con su vocabulario, expresiones y gramática característicos (por ejemplo "vosotros", "coger", "ordenador"). No uses español latinoamericano ni ninguna otra variante regional del español.

Devuelve únicamente el JSON que respeta el schema indicado.`;
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
    throw new Error("GEMINI_API_KEY is not configured");
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
    throw new Error("Gemini response has no text content");
  }

  const parsedJson = JSON.parse(text);
  const validated = GeminiStoryBatchSchema.parse(parsedJson);

  // Ensure unique ids in case the model repeats one.
  const seen = new Set<string>();
  for (const story of validated.stories) {
    let id = story.id;
    while (seen.has(id)) id = `${id}-2`;
    seen.add(id);
    story.id = id;
  }

  return validated.stories.slice(0, count);
}
