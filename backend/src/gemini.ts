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

Reglas de coherencia y verosimilitud (muy importantes, la calidad depende de esto):
- El teaser debe ser literalmente cierto, aunque esté redactado para inducir a un malentendido. Nunca describas como un hecho algo que no ocurrió de verdad: por ejemplo, si el personaje en realidad oyó un zumbido de avispas, no escribas "escuchó una voz que le advirtió"; escribe algo objetivamente exacto como "escuchó un sonido que interpretó como una advertencia". La sorpresa debe venir de la interpretación errónea del lector, nunca de una frase falsa en el teaser.
- Cada detalle extraño mencionado en el teaser debe tener una razón de ser explicada en la solution. No dejes cabos sueltos ni elementos decorativos que no se resuelvan.
- La solution no puede depender de datos, casualidades o personajes que no se puedan deducir razonablemente a partir de preguntas de sí/no. Nada de giros de última hora que introduzcan información imposible de anticipar.
- Evita explicaciones sobrenaturales, mágicas o de ciencia ficción, salvo que el propio teaser deje claro desde el principio que la historia pertenece a ese género.
- La relación entre el misterio planteado y su explicación debe ser directa y verificable: un jugador que haga las preguntas adecuadas debe poder llegar a la solución paso a paso, sin necesidad de adivinar un detalle arbitrario.
- La solution debe girar en torno a un HECHO concreto, externo y verificable (una profesión, un objeto, una regla, una relación entre personajes, un dato que alguien conocía, una circunstancia física) que un jugador podría destapar formulando preguntas de sí/no sobre hechos. No conviertas un cambio de humor, una epifanía emocional o una decisión interna del personaje en el mecanismo que resuelve el enigma: los sentimientos pueden acompañar la historia, pero nunca deben ser la pieza que la explica, porque no se puede verificar con preguntas de sí/no si alguien "tuvo una revelación" o "en el fondo no quería".
- Si la solution incluye una coincidencia, esta debe ser secundaria y menor, nunca la pieza central que sostiene todo el misterio (por ejemplo, evita que "el error resultó ser justo lo que esa persona necesitaba" sea la explicación).
- Aplica la navaja de Ockham: usa la explicación más sencilla, mundana y verosímil que resuelva el enigma. No añadas profesiones o escenarios exóticos (astronautas, espías, científicos con tecnología secreta, agencias gubernamentales...) si una causa cotidiana (una enfermedad, una apuesta, una tradición familiar, un trabajo normal, una condena) explica igual de bien lo planteado en el teaser. Cuanto más inusual y específico sea un elemento de la solution, menos pistas tiene el jugador para llegar a él y peor funciona el acertijo; nada en el teaser debe requerir adivinar un dato exótico que no esté insinuado.
- Los objetos y mecanismos deben comportarse de forma físicamente realista según cómo se describen en el teaser (tamaño, ubicación, uso cotidiano). No conviertas un objeto corriente (por ejemplo, un reloj de arena de mesilla de noche) en una versión imposible de sí mismo (que dure semanas) solo para que la solution encaje; si un objeto necesita una propiedad especial o fuera de lo normal, dilo explícitamente en el propio teaser.
- Antes de dar tu respuesta final, revisa mentalmente cada historia: ¿resuelve la solution TODO lo planteado en el teaser mediante un hecho concreto, sencillo y no mediante una casualidad, un cambio de sentimientos o un escenario exótico inalcanzable? ¿Es una explicación realista y satisfactoria, sin lagunas ni contradicciones? Descarta y reescribe cualquier historia que no cumpla esto.
- Dedica el mismo nivel de cuidado y rigor a todas las historias, incluidas las últimas del lote; no reduzcas la calidad por generar varias a la vez.

Ejemplo del nivel de coherencia esperado (no lo reutilices, es solo referencia de estilo):
teaser: "Cada mañana, un anciano que vivía solo pintaba la puerta de su casa de un color distinto. Un día, los vecinos se dieron cuenta de que la puerta llevaba una semana sin cambiar de color y llamaron a una ambulancia. El anciano estaba perfectamente bien."
solution: "El anciano padecía una afección que podía provocarle una caída repentina sin previo aviso. Su hija, que vivía lejos y no podía visitarlo a diario, había acordado con él una señal sencilla para los vecinos: mientras la puerta cambiara de color cada día, significaba que se había levantado y encontraba bien. Si pasaban varios días sin cambio, era la señal de que algo podía ir mal y debían comprobarlo. Esa semana se le había acabado la pintura y, al no conducir, no había podido reponerla; no avisó a nadie porque no imaginó que tardaría tanto en salir a comprar más. La señal cumplió su función aunque esta vez fuera una falsa alarma: los vecinos actuaron exactamente como se había previsto."

Ejemplo de lo que NO debes hacer (mecanismo prohibido: la solución se apoya en una epifanía emocional y una coincidencia conveniente, no en un hecho verificable):
teaser (mal): "Marta subió a un tren con la intención de no volver jamás. Cuando el revisor le dijo que se había equivocado de trayecto, ella sonrió aliviada y decidió quedarse en su asiento."
solution (mal, evítalo): "En realidad Marta no quería huir de verdad; el error del billete le hizo darse cuenta de que solo necesitaba reflexionar, así que decidió volver a casa." — Esto no vale porque el enigma se resuelve con un cambio de sentimientos no verificable y con la casualidad de que el billete equivocado fuera justo el que la devolvía a casa.

Otro ejemplo de lo que NO debes hacer (mecanismo prohibido: información inalcanzable y objeto físicamente imposible):
teaser (mal): "Un hombre observa un reloj de arena en su mesilla de noche. Al caer el último grano, sonríe con alivio y sale a pasear bajo la lluvia por primera vez en meses."
solution (mal, evítalo): "Es un astronauta que regresaba de una larga misión espacial, y el reloj de arena estaba calibrado para marcar el fin exacto de sus tres semanas de cuarentena planetaria." — Esto no vale por dos motivos: (1) nada en el teaser apunta a un astronauta ni a una cuarentena espacial, es un dato inalcanzable con preguntas de sí/no que nadie podría adivinar; (2) un reloj de arena corriente de mesilla de noche no puede fluir físicamente durante tres semanas sin que el teaser avise de que se trata de un objeto especial. Una explicación mundana (una cuarentena por enfermedad, una condena domiciliaria, una apuesta) habría funcionado igual o mejor.

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
      temperature: 0.85,
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
