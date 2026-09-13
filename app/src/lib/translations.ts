import AsyncStorage from "@react-native-async-storage/async-storage";

// English, public-domain translations bible-api.com supports (it also has
// Cherokee/Chinese/Czech/Latin/Portuguese/Romanian ones, left out since the
// rest of the app's UI is English-only). ylt is New Testament only, so it's
// left out too — picking it would silently fail on any Old Testament verse.
export interface Translation {
  id: string;
  label: string;
  shortLabel: string;
}

export const TRANSLATIONS: Translation[] = [
  { id: "web", label: "World English Bible", shortLabel: "WEB" },
  { id: "kjv", label: "King James Version", shortLabel: "KJV" },
  { id: "asv", label: "American Standard Version", shortLabel: "ASV" },
  { id: "bbe", label: "Bible in Basic English", shortLabel: "BBE" },
  { id: "webbe", label: "World English Bible (British)", shortLabel: "WEBBE" },
  { id: "darby", label: "Darby Bible", shortLabel: "DARBY" },
  { id: "dra", label: "Douay-Rheims", shortLabel: "DRA" },
  { id: "oeb-us", label: "Open English Bible (US)", shortLabel: "OEB-US" },
];

export const DEFAULT_TRANSLATION_ID = "web";
const STORAGE_KEY = "soul-not-solo:translation";

export function getTranslation(id: string): Translation {
  return TRANSLATIONS.find((t) => t.id === id) ?? TRANSLATIONS[0];
}

export async function getSelectedTranslationId(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored && TRANSLATIONS.some((t) => t.id === stored) ? stored : DEFAULT_TRANSLATION_ID;
  } catch {
    return DEFAULT_TRANSLATION_ID;
  }
}

export async function setSelectedTranslationId(id: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, id);
  } catch (err) {
    console.error("Failed to save translation preference:", err);
  }
}
