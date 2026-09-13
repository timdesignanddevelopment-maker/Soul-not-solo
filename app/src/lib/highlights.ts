import AsyncStorage from "@react-native-async-storage/async-storage";
import { getVerseNote, saveVerseNote, deleteVerseNote } from "./journal";
import { isExpired } from "./trash";

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
  // Word-range highlights (drag/long-press selecting less than a whole
  // verse) set both of these to indices into that verse's word tokens.
  // Whole-verse-and-up highlights (tapping a verse number, possibly merged
  // into a passage) leave them undefined.
  startWord?: number;
  endWord?: number;
  color: HighlightColor;
  text: string;
  reference: string; // e.g. "John 3:16" or "John 3:16-18"
  createdAt: number;
  // A highlight only shows up in the Journal's glossary once the user
  // deliberately long-presses it to save it there — plain highlighting is
  // just marking up the text, not journaling about it.
  savedToJournal: boolean;
  deletedAt?: number;
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

function partialHighlightId(bookSlug: string, chapter: number, verse: number, startWord: number, endWord: number): string {
  return `${bookSlug}:${chapter}:${verse}:w${startWord}-${endWord}`;
}

// Highlights saved before passages/colors/journal-opt-in existed only had a
// `verse` field, no color, and were implicitly "in the journal" — normalize
// them on read so the rest of the app only ever sees the current shape.
function normalize(raw: Record<string, unknown>): Highlight {
  if (typeof raw.startVerse === "number" && typeof raw.endVerse === "number") {
    return { color: "yellow", savedToJournal: true, ...raw } as Highlight;
  }
  const verse = raw.verse as number;
  return {
    ...raw,
    startVerse: verse,
    endVerse: verse,
    color: raw.color ?? "yellow",
    savedToJournal: true,
  } as Highlight;
}

async function loadAllRaw(): Promise<Highlight[]> {
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

// Purges anything past its trash retention window, then returns only the
// still-active (non-deleted) highlights — the shape every screen except the
// trash view should see.
export async function loadHighlights(): Promise<Highlight[]> {
  const all = await loadAllRaw();
  const kept = all.filter((h) => !h.deletedAt || !isExpired(h.deletedAt));
  if (kept.length !== all.length) await persist(kept);
  return kept.filter((h) => !h.deletedAt);
}

export async function loadDeletedHighlights(): Promise<Highlight[]> {
  const all = await loadAllRaw();
  return all.filter((h) => h.deletedAt && !isExpired(h.deletedAt));
}

export async function getHighlight(id: string): Promise<Highlight | undefined> {
  const existing = await loadHighlights();
  return existing.find((h) => h.id === id);
}

// Whole-verse (and passage) highlights covering this verse — at most one,
// since same-color adjacency merges them and different colors don't overlap
// a single verse today.
export function findHighlightForVerse(
  highlights: Highlight[],
  bookSlug: string,
  chapter: number,
  verse: number
): Highlight | undefined {
  return highlights.find(
    (h) =>
      h.startWord === undefined &&
      h.bookSlug === bookSlug &&
      h.chapter === chapter &&
      verse >= h.startVerse &&
      verse <= h.endVerse
  );
}

// Word-range highlights anchored to this exact verse (there can be several —
// e.g. two separate phrases picked out in different colors).
export function findPartialHighlightsForVerse(
  highlights: Highlight[],
  bookSlug: string,
  chapter: number,
  verse: number
): Highlight[] {
  return highlights.filter(
    (h) =>
      h.startWord !== undefined &&
      h.bookSlug === bookSlug &&
      h.chapter === chapter &&
      h.startVerse === verse &&
      h.endVerse === verse
  );
}

// Soft-delete: moves a highlight to the trash (kept for 30 days) rather than
// erasing it immediately, and takes any note written about it along with it
// so "restore" brings the note back too.
export async function removeHighlight(id: string): Promise<Highlight[]> {
  const existing = await loadAllRaw();
  const updated = existing.map((h) => (h.id === id ? { ...h, deletedAt: Date.now() } : h));
  await persist(updated);
  return updated.filter((h) => !h.deletedAt);
}

export async function restoreHighlight(id: string): Promise<Highlight[]> {
  const existing = await loadAllRaw();
  const updated = existing.map((h) => (h.id === id ? { ...h, deletedAt: undefined } : h));
  await persist(updated);
  return updated.filter((h) => !h.deletedAt);
}

export async function purgeHighlightForever(id: string): Promise<void> {
  const existing = await loadAllRaw();
  await persist(existing.filter((h) => h.id !== id));
  await deleteVerseNote(id);
}

export async function setHighlightSavedToJournal(id: string, saved: boolean): Promise<Highlight[]> {
  const existing = await loadAllRaw();
  const updated = existing.map((h) => (h.id === id ? { ...h, savedToJournal: saved } : h));
  await persist(updated);
  return updated.filter((h) => !h.deletedAt);
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
  const sameChapter = all.filter(
    (h) => h.startWord === undefined && h.bookSlug === params.bookSlug && h.chapter === params.chapter
  );
  const others = (await loadAllRaw()).filter((h) => h.deletedAt || h.startWord !== undefined || !(h.bookSlug === params.bookSlug && h.chapter === params.chapter));

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
    savedToJournal: false,
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
  return updated.filter((h) => !h.deletedAt);
}

interface PartialParams {
  bookSlug: string;
  bookName: string;
  chapter: number;
  verseNum: number;
  verseText: string;
  startWord: number;
  endWord: number;
  words: string[]; // this verse's word tokens (raw, in order) so we can slice out the highlighted text
  color: HighlightColor;
}

// A word-range selection ("start and stop the highlight" mid-verse) always
// creates its own highlight rather than merging into anything — phrases
// picked out this way are meant to be distinct little markers, not passages.
export async function addPartialHighlight(params: PartialParams): Promise<Highlight[]> {
  const all = await loadAllRaw();
  const lo = Math.min(params.startWord, params.endWord);
  const hi = Math.max(params.startWord, params.endWord);
  const id = partialHighlightId(params.bookSlug, params.chapter, params.verseNum, lo, hi);
  const text = params.words.slice(lo, hi + 1).join(" ").trim();

  const highlight: Highlight = {
    id,
    bookSlug: params.bookSlug,
    bookName: params.bookName,
    chapter: params.chapter,
    startVerse: params.verseNum,
    endVerse: params.verseNum,
    startWord: lo,
    endWord: hi,
    color: params.color,
    text,
    reference: `${params.bookName} ${params.chapter}:${params.verseNum}`,
    createdAt: Date.now(),
    savedToJournal: false,
  };

  const updated = [...all.filter((h) => h.id !== id), highlight];
  await persist(updated);
  return updated.filter((h) => !h.deletedAt);
}
