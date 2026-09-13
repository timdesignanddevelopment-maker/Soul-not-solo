import AsyncStorage from "@react-native-async-storage/async-storage";
import { isExpired } from "./trash";

// Notes written against a specific highlighted verse — one per highlight.
export interface VerseNote {
  highlightId: string;
  notes: string;
  updatedAt: number;
}

// Freeform personal journal entries, unrelated to any verse.
export interface PersonalEntry {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

const VERSE_NOTES_KEY = "soul-not-solo:verse-notes";
const PERSONAL_KEY = "soul-not-solo:personal-journal";

export async function loadVerseNotes(): Promise<VerseNote[]> {
  try {
    const raw = await AsyncStorage.getItem(VERSE_NOTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getVerseNote(highlightId: string): Promise<VerseNote | undefined> {
  const notes = await loadVerseNotes();
  return notes.find((n) => n.highlightId === highlightId);
}

export async function saveVerseNote(highlightId: string, notes: string): Promise<void> {
  try {
    const existing = await loadVerseNotes();
    const withoutThis = existing.filter((n) => n.highlightId !== highlightId);
    const updated = [{ highlightId, notes, updatedAt: Date.now() }, ...withoutThis];
    await AsyncStorage.setItem(VERSE_NOTES_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save verse note:", err);
  }
}

export async function deleteVerseNote(highlightId: string): Promise<void> {
  try {
    const existing = await loadVerseNotes();
    const updated = existing.filter((n) => n.highlightId !== highlightId);
    await AsyncStorage.setItem(VERSE_NOTES_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to delete verse note:", err);
  }
}

async function loadPersonalEntriesRaw(): Promise<PersonalEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(PERSONAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function persistPersonalEntries(entries: PersonalEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(PERSONAL_KEY, JSON.stringify(entries));
  } catch (err) {
    console.error("Failed to save personal journal entries:", err);
  }
}

export async function loadPersonalEntries(): Promise<PersonalEntry[]> {
  const all = await loadPersonalEntriesRaw();
  const kept = all.filter((e) => !e.deletedAt || !isExpired(e.deletedAt));
  if (kept.length !== all.length) await persistPersonalEntries(kept);
  return kept.filter((e) => !e.deletedAt);
}

export async function loadDeletedPersonalEntries(): Promise<PersonalEntry[]> {
  const all = await loadPersonalEntriesRaw();
  return all.filter((e) => e.deletedAt && !isExpired(e.deletedAt));
}

export async function getPersonalEntry(id: string): Promise<PersonalEntry | undefined> {
  const entries = await loadPersonalEntries();
  return entries.find((e) => e.id === id);
}

// Pass an existing id to update that entry, or null to create a new one.
export async function savePersonalEntry(id: string | null, content: string): Promise<PersonalEntry> {
  const existing = await loadPersonalEntriesRaw();
  const now = Date.now();

  if (id) {
    const current = existing.find((e) => e.id === id);
    const entry: PersonalEntry = {
      id,
      content,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    };
    await persistPersonalEntries([entry, ...existing.filter((e) => e.id !== id)]);
    return entry;
  }

  const entry: PersonalEntry = {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    content,
    createdAt: now,
    updatedAt: now,
  };
  await persistPersonalEntries([entry, ...existing]);
  return entry;
}

// Soft-delete — moves the entry to the trash for 30 days rather than
// erasing it immediately.
export async function deletePersonalEntry(id: string): Promise<PersonalEntry[]> {
  const existing = await loadPersonalEntriesRaw();
  const updated = existing.map((e) => (e.id === id ? { ...e, deletedAt: Date.now() } : e));
  await persistPersonalEntries(updated);
  return updated.filter((e) => !e.deletedAt);
}

export async function restorePersonalEntry(id: string): Promise<PersonalEntry[]> {
  const existing = await loadPersonalEntriesRaw();
  const updated = existing.map((e) => (e.id === id ? { ...e, deletedAt: undefined } : e));
  await persistPersonalEntries(updated);
  return updated.filter((e) => !e.deletedAt);
}

export async function purgePersonalEntryForever(id: string): Promise<void> {
  const existing = await loadPersonalEntriesRaw();
  await persistPersonalEntries(existing.filter((e) => e.id !== id));
}
