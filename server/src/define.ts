import { callModel } from "./modelProvider";

export interface WordDefinition {
  word: string;
  definition: string;
}

// Only reached for words the free public dictionary doesn't know — mostly
// archaic English (thee, beget, firmament), theological terms
// (propitiation, sanctification), and proper nouns (Bethlehem, Pharisees),
// none of which a general dictionary covers but which show up constantly in
// Scripture.
const SYSTEM_PROMPT = `You explain a single word or short phrase exactly as it's used in a specific Bible verse, for someone reading Scripture who doesn't recognize it. Respond with ONLY a JSON object (no markdown fences, no other text): {"definition": "<1-2 short, plain, modern-English sentences>"}. If it's a name (a person or place), briefly say who or where that is instead of a dictionary-style definition. Never invent a meaning you're not confident in — if genuinely unsure, give your best reasonable explanation rather than refusing.`;

function parseDefinition(raw: string): string | null {
  try {
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) return null;
    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
    return typeof parsed.definition === "string" && parsed.definition.trim() ? parsed.definition.trim() : null;
  } catch {
    return null;
  }
}

export async function defineWordInContext(word: string, verseContext: string): Promise<WordDefinition> {
  try {
    const text = await callModel(
      SYSTEM_PROMPT,
      [{ role: "user", content: `Word or phrase: "${word}"\nAs used in this verse: "${verseContext}"` }],
      200
    );
    const definition = parseDefinition(text);
    if (definition) return { word, definition };
  } catch (err) {
    console.error(`Failed to define "${word}":`, err);
  }
  return { word, definition: "No definition available right now — try again in a moment." };
}
