export interface VerseToken {
  raw: string; // exact text to render, including any trailing space/punctuation
  word: string | null; // cleaned lookup term (letters/apostrophes only), or null for pure whitespace/punctuation tokens
}

// Splits verse text into alternating word/whitespace tokens for per-word
// tap targets, while keeping whitespace exactly as-is so re-joining the
// tokens reproduces the original text.
export function tokenizeVerse(text: string): VerseToken[] {
  const parts = text.split(/(\s+)/);
  return parts
    .filter((part) => part.length > 0)
    .map((part) => {
      if (/^\s+$/.test(part)) {
        return { raw: part, word: null };
      }
      const cleaned = part.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, "");
      return { raw: part, word: cleaned.length > 0 ? cleaned : null };
    });
}
