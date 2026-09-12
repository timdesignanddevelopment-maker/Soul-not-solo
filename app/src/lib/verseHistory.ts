import AsyncStorage from "@react-native-async-storage/async-storage";

// Persists every successful verse match so someone who taps into one card
// (e.g. "read in context," which leaves the reveal carousel for the Read
// tab) can find their way back to the other matches from that same request
// instead of having to retype their situation from scratch.

export interface SavedCard {
  reference: string;
  text: string;
  encouragement: string;
}

export interface SavedRequest {
  id: string;
  situation: string;
  cards: SavedCard[];
  createdAt: number;
}

const STORAGE_KEY = "soul-not-solo:verse-history";
const MAX_ENTRIES = 30;

export async function loadHistory(): Promise<SavedRequest[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveRequest(situation: string, cards: SavedCard[]): Promise<void> {
  try {
    const existing = await loadHistory();
    const entry: SavedRequest = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      situation,
      cards,
      createdAt: Date.now(),
    };
    const updated = [entry, ...existing].slice(0, MAX_ENTRIES);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save verse history:", err);
  }
}

export async function deleteRequest(id: string): Promise<SavedRequest[]> {
  const existing = await loadHistory();
  const updated = existing.filter((entry) => entry.id !== id);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to update verse history:", err);
  }
  return updated;
}
