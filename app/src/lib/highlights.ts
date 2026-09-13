import AsyncStorage from "@react-native-async-storage/async-storage";
import { getVerseNote, saveVerseNote, deleteVerseNote } from "./journal";

export type HighlightColor = "yellow" | "blue" | "red" | "pink" | "orange" | "green" | "purple";

export const HIGHLIGHT_COLORS: HighlightColor[] = [
  "yellow",
  "blue",
  "red",
  "pink",
  "orange",
  "green",
  "purple",
];

// Each highlight color always renders as its own little "patch of paper" —
// a pastel background with dark text on it — regardless of the app's
// light/dark theme, the same way a real highlighter mark looks the same
// whether the room is bright or dim. Keeps highlights legible without
// needing separate light/dark variants.
export const HIGHLIGHT_PALETTE: Record<HighlightColor, { swatch: string; background: string; text: string }> = {
  yellow: { swatch: "#f2c94c", background: "#f7e9a8", text: "#4a3c0a" },
  blue: { swatch: "#5b9bd5", background: "#bcdcf2", text: "#0f2d4a" },
  red: { swatch: "#e15b5b", background: "#f4c2c2", text: "#4a0f0f" },
  pink: { swatch: "#e58fc2", background: "#f6d3ea", text: "#4a0f36" },
  orange: { swatch: "#f0954a", background: "#fadbb8", text: "#4a2a0a" },
  green: { swatch: "#6fbf73", background: "#c8e9c5", text: "#0f3a12" },
  purple: { swatch: "#a875d1", background: "#e2cef2", text: "#2e0f4a" },
};

export interface Highlight {
  id: string;
  bookSlug: string;
  bookName: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
  color: HighlightColor;
  text: string;
  reference: string; // e.g. "John 3:16" or "John 3:16-18"
  createdAt: number;
}

const STORAGE_KEY = "soul-not-solo:highlights";

// Single-verse ids intentionally match the original (pre-passage) format —
// "bookSlug:chapter:verse" — so highlights and journal notes made before
// passages/colors existed keep working without a migration step.
export function highlightId(bookSlug: string, chapter: number, startVerse: number, endVerse: number): string {
  return startVerse === endVerse
    ? `${bookSlug}:${chapter}:${startVerse}`
    : `${bookSlug}:${chapter}:${startVerse}-${endVerse}`;
}

// Highlights saved before passages/colors existed only had a single `verse`
// field and no color — normalize them on read so the rest of the app only
// ever sees the current shape.
function normalize(raw: Record<string, unknown>): Highlight {
  if (typeof raw.startVerse === "number" && typeof raw.endVerse === "number") {
    return { color: "yellow", ...raw } as Highlight;
  }
  const verse = raw.verse as number;
  return { ...raw, startVerse: verse, endVerse: verse, color: raw.color ?? "yellow" } as Highlight;
}

export async function loadHighlights(): Promise<Highlight[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalize) : [];
  } catch {
    return [];
  }
}

async function persist(highlights: Highlight[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(highlights));
  } catch (err) {
    console.error("Failed to save highlights:", err);
  }
}

export async function getHighlight(id: string): Promise<Highlight | undefined> {
  const existing = await loadHighlights();
  return existing.find((h) => h.id === id);
}

export function findHighlightForVerse(
  highlights: Highlight[],
  bookSlug: string,
  chapter: number,
  verse: number
): Highlight | undefined {
  return highlights.find(
    (h) => h.bookSlug === bookSlug && h.chapter === chapter && verse >= h.startVerse && verse <= h.endVerse
  );
}

export async function removeHighlight(id: string): Promise<Highlight[]> {
  const existing = await loadHighlights();
  const updated = existing.filter((h) => h.id !== id);
  await persist(updated);
  return updated;
}

interface ExtendParams {
  bookSlug: string;
  bookName: string;
  chapter: number;
  verseNum: number;
  color: HighlightColor;
  chapterVerses: { verse: number; text: string }[];
}

// Highlighting a verse extends an adjacent highlight of the SAME color into
// one passage — highlighting three consecutive verses in yellow becomes one
// highlight covering all three, not three separate ones. Switching colors is
// a deliberate break: an adjacent highlight in a different color is left
// alone, same as picking up a different highlighter. If merging changes a
// highlight's id (a single verse growing into a range), any journal note
// already written against the old id moves to the new one so it isn't lost.
export async function addOrExtendHighlight(params: ExtendParams): Promise<Highlight[]> {
  const all = await loadHighlights();
  const sameChapter = all.filter((h) => h.bookSlug === params.bookSlug && h.chapter === params.chapter);
  const others = all.filter((h) => !(h.bookSlug === params.bookSlug && h.chapter === params.chapter));

  const prev = sameChapter.find((h) => h.endVerse === params.verseNum - 1 && h.color === params.color);
  const next = sameChapter.find((h) => h.startVerse === params.verseNum + 1 && h.color === params.color);
  const remaining = sameChapter.filter((h) => h !== prev && h !== next);

  const startVerse = prev ? prev.startVerse : params.verseNum;
  const endVerse = next ? next.endVerse : params.verseNum;
  const createdAt = prev?.createdAt ?? next?.createdAt ?? Date.now();
  const newId = highlightId(params.bookSlug, params.chapter, startVerse, endVerse);

  const text = params.chapterVerses
    .filter((v) => v.verse >= startVerse && v.verse <= endVerse)
    .map((v) => v.text.trim())
    .join(" ");
  const reference =
    startVerse === endVerse
      ? `${params.bookName} ${params.chapter}:${startVerse}`
      : `${params.bookName} ${params.chapter}:${startVerse}-${endVerse}`;

  const merged: Highlight = {
    id: newId,
    bookSlug: params.bookSlug,
    bookName: params.bookName,
    chapter: params.chapter,
    startVerse,
    endVerse,
    color: params.color,
    text,
    reference,
    createdAt,
  };

  for (const old of [prev, next]) {
    if (!old || old.id === newId) continue;
    const note = await getVerseNote(old.id);
    if (note) {
      await saveVerseNote(newId, note.notes);
      await deleteVerseNote(old.id);
    }
  }

  const updated = [...others, ...remaining, merged];
  await persist(updated);
  return updated;
}
