import AsyncStorage from "@react-native-async-storage/async-storage";
import { isExpired } from "./trash";

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
  deletedAt?: number;
}

const STORAGE_KEY = "soul-not-solo:verse-history";
const MAX_ENTRIES = 30;

async function loadHistoryRaw(): Promise<SavedRequest[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function persist(entries: SavedRequest[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.error("Failed to save verse history:", err);
  }
}

export async function loadHistory(): Promise<SavedRequest[]> {
  const all = await loadHistoryRaw();
  const kept = all.filter((e) => !e.deletedAt || !isExpired(e.deletedAt));
  if (kept.length !== all.length) await persist(kept);
  return kept.filter((e) => !e.deletedAt);
}

export async function loadDeletedHistory(): Promise<SavedRequest[]> {
  const all = await loadHistoryRaw();
  return all.filter((e) => e.deletedAt && !isExpired(e.deletedAt));
}

export async function saveRequest(situation: string, cards: SavedCard[]): Promise<void> {
  const existing = await loadHistoryRaw();
  const entry: SavedRequest = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    situation,
    cards,
    createdAt: Date.now(),
  };
  const updated = [entry, ...existing].slice(0, MAX_ENTRIES);
  await persist(updated);
}

// Soft-delete — moves the entry to the trash for 30 days rather than
// erasing it immediately.
export async function deleteRequest(id: string): Promise<SavedRequest[]> {
  const existing = await loadHistoryRaw();
  const updated = existing.map((e) => (e.id === id ? { ...e, deletedAt: Date.now() } : e));
  await persist(updated);
  return updated.filter((e) => !e.deletedAt);
}

export async function restoreRequest(id: string): Promise<SavedRequest[]> {
  const existing = await loadHistoryRaw();
  const updated = existing.map((e) => (e.id === id ? { ...e, deletedAt: undefined } : e));
  await persist(updated);
  return updated.filter((e) => !e.deletedAt);
}

export async function purgeRequestForever(id: string): Promise<void> {
  const existing = await loadHistoryRaw();
  await persist(existing.filter((e) => e.id !== id));
}
