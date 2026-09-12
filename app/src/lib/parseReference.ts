import { BIBLE_BOOKS, type BibleBook } from "@/lib/bibleIndex";

// Aliases for how a book name might come back from Claude or bible-api.com
// versus how it's spelled in our static index.
const BOOK_ALIASES: Record<string, string> = {
  psalm: "psalms",
  "song of songs": "song of solomon",
  canticles: "song of solomon",
  revelations: "revelation",
};

function normalizeBookName(raw: string): string {
  const lower = raw.trim().toLowerCase();
  return BOOK_ALIASES[lower] ?? lower;
}

export interface ParsedReference {
  book: BibleBook;
  chapter: number;
}

// "Psalm 34:18" -> { book: Psalms, chapter: 34 }. "Philippians 4:6-7" -> chapter 4.
// Returns null if the reference doesn't parse to a book we know about.
export function parseReference(reference: string): ParsedReference | null {
  const match = reference.trim().match(/^(.+?)\s+(\d+)(?::\d+(?:-\d+)?)?$/);
  if (!match) return null;

  const [, bookNamePart, chapterPart] = match;
  const normalized = normalizeBookName(bookNamePart);
  const book = BIBLE_BOOKS.find((b) => b.name.toLowerCase() === normalized);
  if (!book) return null;

  const chapter = Number(chapterPart);
  if (!Number.isFinite(chapter) || chapter < 1 || chapter > book.chapters) return null;

  return { book, chapter };
}
