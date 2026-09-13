export type ThemeMode = "dark" | "light";

export interface ThemeColors {
  background: string;
  backgroundGradient: [string, string, string];
  backgroundAlt: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentText: string;
  danger: string;
  // The illuminated-manuscript "paper" surfaces (VerseCard, ParchmentPaper)
  // are already a light parchment tone against the dark background — in
  // light mode they get a slightly lighter/warmer variant so they still
  // read as a distinct surface rather than blending into the page.
  parchment: [string, string, string];
  parchmentText: string;
  parchmentTextMuted: string;
}

export const DARK_THEME: ThemeColors = {
  background: "#14100c",
  backgroundGradient: ["#2b2013", "#1c140c", "#0e0a06"],
  backgroundAlt: "#1c1410",
  surface: "#1f1710",
  border: "#3a2e22",
  text: "#f3ead9",
  textMuted: "#9a8f83",
  accent: "#d8b46a",
  accentText: "#1c1410",
  danger: "#e07a5f",
  parchment: ["#f6ecd6", "#eeddb8", "#e3cc9a"],
  parchmentText: "#3a2e18",
  parchmentTextMuted: "#6b5535",
};

// Reuses tones already present in the dark theme (the parchment/accent
// colors) so light mode feels like the same illuminated-manuscript design
// rather than a generic inverted palette.
export const LIGHT_THEME: ThemeColors = {
  background: "#f2e8d0",
  backgroundGradient: ["#fbf3de", "#f2e8d0", "#e8dcb8"],
  backgroundAlt: "#e8dcc0",
  surface: "#fbf6ea",
  border: "#c9b78f",
  text: "#3a2e18",
  textMuted: "#7a6a52",
  accent: "#8a6a2f",
  accentText: "#fbf6ea",
  danger: "#c0392b",
  parchment: ["#fdf9ee", "#f6ecd6", "#eeddb8"],
  parchmentText: "#3a2e18",
  parchmentTextMuted: "#6b5535",
};

export function getThemeColors(mode: ThemeMode): ThemeColors {
  return mode === "light" ? LIGHT_THEME : DARK_THEME;
}
