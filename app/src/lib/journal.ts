import AsyncStorage from "@react-native-async-storage/async-storage";

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

export async function loadPersonalEntries(): Promise<PersonalEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(PERSONAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getPersonalEntry(id: string): Promise<PersonalEntry | undefined> {
  const entries = await loadPersonalEntries();
  return entries.find((e) => e.id === id);
}

// Pass an existing id to update that entry, or null to create a new one.
export async function savePersonalEntry(id: string | null, content: string): Promise<PersonalEntry> {
  const existing = await loadPersonalEntries();
  const now = Date.now();

  if (id) {
    const current = existing.find((e) => e.id === id);
    const entry: PersonalEntry = {
      id,
      content,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    };
    const updated = [entry, ...existing.filter((e) => e.id !== id)];
    try {
      await AsyncStorage.setItem(PERSONAL_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to save personal journal entry:", err);
    }
    return entry;
  }

  const entry: PersonalEntry = {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    content,
    createdAt: now,
    updatedAt: now,
  };
  const updated = [entry, ...existing];
  try {
    await AsyncStorage.setItem(PERSONAL_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save personal journal entry:", err);
  }
  return entry;
}

export async function deletePersonalEntry(id: string): Promise<PersonalEntry[]> {
  const existing = await loadPersonalEntries();
  const updated = existing.filter((e) => e.id !== id);
  try {
    await AsyncStorage.setItem(PERSONAL_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to delete personal journal entry:", err);
  }
  return updated;
}
