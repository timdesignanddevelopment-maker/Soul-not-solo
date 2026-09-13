import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Highlight {
  id: string; // `${bookSlug}:${chapter}:${verse}`
  bookSlug: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  reference: string; // e.g. "John 3:16"
  createdAt: number;
}

const STORAGE_KEY = "soul-not-solo:highlights";

export function highlightId(bookSlug: string, chapter: number, verse: number): string {
  return `${bookSlug}:${chapter}:${verse}`;
}

export async function loadHighlights(): Promise<Highlight[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getHighlight(id: string): Promise<Highlight | undefined> {
  const existing = await loadHighlights();
  return existing.find((h) => h.id === id);
}

export async function addHighlight(highlight: Highlight): Promise<void> {
  try {
    const existing = await loadHighlights();
    if (existing.some((h) => h.id === highlight.id)) return;
    const updated = [highlight, ...existing];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save highlight:", err);
  }
}

export async function removeHighlight(id: string): Promise<Highlight[]> {
  const existing = await loadHighlights();
  const updated = existing.filter((h) => h.id !== id);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to update highlights:", err);
  }
  return updated;
}
