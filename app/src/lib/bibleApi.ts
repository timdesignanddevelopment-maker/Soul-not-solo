// Client for bible-api.com — free, no API key, public-domain translations.
import { fetchWithTimeout } from "./fetchWithTimeout";

const BASE_URL = "https://bible-api.com";
const TIMEOUT_MS = 20000;
const DEFAULT_TRANSLATION = "web";

export interface BibleVerse {
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BiblePassage {
  reference: string;
  verses: BibleVerse[];
  text: string;
  translation_id: string;
  translation_name: string;
}

async function fetchPassage(
  reference: string,
  translation: string = DEFAULT_TRANSLATION
): Promise<BiblePassage> {
  const url = `${BASE_URL}/${encodeURIComponent(reference)}?translation=${translation}`;
  const res = await fetchWithTimeout(url, {}, TIMEOUT_MS);
  if (!res.ok) {
    throw new Error(`Failed to fetch "${reference}" (${res.status})`);
  }
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data as BiblePassage;
}

// A single reference, e.g. "Philippians 4:6-7" or "John 3:16".
export function fetchVerseText(reference: string, translation?: string) {
  return fetchPassage(reference, translation);
}

// A whole chapter at once, e.g. bookName "John", chapter 3.
export function fetchChapter(bookName: string, chapter: number, translation?: string) {
  return fetchPassage(`${bookName} ${chapter}`, translation);
}
