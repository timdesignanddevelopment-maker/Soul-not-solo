import { fetchWithTimeout } from "./fetchWithTimeout";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

export interface WordDefinition {
  word: string;
  definitions: string[];
  source: "dictionary" | "ai";
}

// Free, no API key, but only knows standard modern English — nothing
// archaic (thee, beget), theological (propitiation), or a proper noun
// (Bethlehem), all of which show up constantly in Scripture.
async function tryFreeDictionary(word: string): Promise<string[] | null> {
  try {
    const res = await fetchWithTimeout(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`,
      {},
      8000
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;

    const defs: string[] = [];
    for (const entry of data) {
      for (const meaning of entry.meanings ?? []) {
        for (const def of meaning.definitions ?? []) {
          if (typeof def.definition === "string") defs.push(def.definition);
          if (defs.length >= 3) break;
        }
        if (defs.length >= 3) break;
      }
      if (defs.length >= 3) break;
    }
    return defs.length > 0 ? defs : null;
  } catch {
    return null;
  }
}

// Falls back to our own backend (which asks the AI provider) for anything
// the free dictionary doesn't recognize — the words most worth looking up
// in a Bible reader are exactly the ones a general dictionary misses.
async function tryAiDefinition(word: string, context: string): Promise<string[] | null> {
  try {
    const res = await fetchWithTimeout(
      `${BACKEND_URL}/api/define`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word, context }),
      },
      30000
    );
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.definition === "string" && data.definition.trim() ? [data.definition] : null;
  } catch {
    return null;
  }
}

export async function defineWord(word: string, context: string): Promise<WordDefinition> {
  const fromDictionary = await tryFreeDictionary(word);
  if (fromDictionary) {
    return { word, definitions: fromDictionary, source: "dictionary" };
  }
  const fromAi = await tryAiDefinition(word, context);
  if (fromAi) {
    return { word, definitions: fromAi, source: "ai" };
  }
  return { word, definitions: ["No definition found for this word."], source: "dictionary" };
}
