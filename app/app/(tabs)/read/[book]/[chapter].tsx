import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, PanResponder, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { BIBLE_BOOKS } from "@/lib/bibleIndex";
import { fetchChapter, type BiblePassage } from "@/lib/bibleApi";
import { getSelectedTranslationId } from "@/lib/translations";
import {
  loadHighlights,
  addOrExtendHighlight,
  addPartialHighlight,
  removeHighlight,
  setHighlightSavedToJournal,
  findHighlightForVerse,
  findPartialHighlightsForVerse,
  HIGHLIGHT_COLORS,
  HIGHLIGHT_PALETTE,
  type Highlight,
  type HighlightColor,
} from "@/lib/highlights";
import { tokenizeVerse } from "@/lib/tokenizeVerse";
import { defineWord, type WordDefinition } from "@/lib/dictionary";
import { WordDefinitionModal } from "@/components/WordDefinitionModal";
import { useTheme } from "@/lib/ThemeContext";
import type { ThemeColors } from "@/lib/theme";
import { FONT_SCRIPT, FONT_SERIF, FONT_SERIF_BOLD } from "@/lib/fonts";

interface Selection {
  verse: number;
  anchor: number;
  end: number;
}

export default function ChapterReaderScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { book, chapter } = useLocalSearchParams<{ book: string; chapter: string }>();
  const bookInfo = BIBLE_BOOKS.find((b) => b.slug === book);
  const chapterNum = Number(chapter);

  const [passage, setPassage] = useState<BiblePassage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selectedColor, setSelectedColor] = useState<HighlightColor>("yellow");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [activeDefinition, setActiveDefinition] = useState<WordDefinition | null>(null);
  const [definitionLoading, setDefinitionLoading] = useState(false);

  const hasPrev = bookInfo ? chapterNum > 1 : false;
  const hasNext = bookInfo ? chapterNum < bookInfo.chapters : false;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, { dx }) => {
        const threshold = 50;
        if (dx > threshold) handleSwipe("right");
        else if (dx < -threshold) handleSwipe("left");
      },
    })
  ).current;

  useEffect(() => {
    if (!bookInfo) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getSelectedTranslationId()
      .then((translationId) => fetchChapter(bookInfo.name, chapterNum, translationId))
      .then((data) => {
        if (!cancelled) setPassage(data);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError("Couldn't load this chapter. Check your connection and try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [book, chapter]);

  useEffect(() => {
    if (!bookInfo) return;
    let cancelled = false;
    loadHighlights().then((all) => {
      if (cancelled) return;
      setHighlights(all.filter((h) => h.bookSlug === bookInfo!.slug && h.chapter === chapterNum));
    });
    return () => {
      cancelled = true;
    };
  }, [book, chapter]);

  async function refreshHighlights() {
    if (!bookInfo) return;
    const all = await loadHighlights();
    setHighlights(all.filter((h) => h.bookSlug === bookInfo.slug && h.chapter === chapterNum));
  }

  // Tapping an unhighlighted verse number highlights the whole verse; tapping
  // an already-highlighted one toggles it back off — like clicking a
  // highlighter pen on and off. This never touches the Journal — highlighting
  // is just marking up the text.
  async function handleVersePress(verseNum: number) {
    if (!bookInfo || !passage) return;
    const existing = findHighlightForVerse(highlights, bookInfo.slug, chapterNum, verseNum);
    if (existing) {
      await removeHighlight(existing.id);
      await refreshHighlights();
      return;
    }
    await addOrExtendHighlight({
      bookSlug: bookInfo.slug,
      bookName: bookInfo.name,
      chapter: chapterNum,
      verseNum,
      color: selectedColor,
      chapterVerses: passage.verses.map((v) => ({ verse: v.verse, text: v.text })),
    });
    await refreshHighlights();
  }

  // A long-press on a highlight — whole-verse or a word-range — is the
  // deliberate "save this to journal" action, so it only shows up in the
  // Journal glossary once someone actually wants to write about it.
  async function handleSaveToJournal(highlightId: string) {
    await setHighlightSavedToJournal(highlightId, true);
    await refreshHighlights();
    router.push(`/journal/${encodeURIComponent(highlightId)}`);
  }

  function handleVerseLongPress(verseNum: number) {
    if (!bookInfo) return;
    const existing = findHighlightForVerse(highlights, bookInfo.slug, chapterNum, verseNum);
    if (existing) handleSaveToJournal(existing.id);
  }

  function cancelSelection() {
    setSelection(null);
  }

  async function confirmSelection() {
    if (!bookInfo || !passage || !selection) return;
    const v = passage.verses.find((verse) => verse.verse === selection.verse);
    if (!v) {
      cancelSelection();
      return;
    }
    const words = tokenizeVerse(v.text)
      .filter((t) => t.word !== null)
      .map((t) => t.raw);
    await addPartialHighlight({
      bookSlug: bookInfo.slug,
      bookName: bookInfo.name,
      chapter: chapterNum,
      verseNum: selection.verse,
      verseText: v.text,
      startWord: selection.anchor,
      endWord: selection.end,
      words,
      color: selectedColor,
    });
    setSelection(null);
    await refreshHighlights();
  }

  async function handleWordPress(verseNum: number, wordIndex: number, existingHighlightId: string | null) {
    // Tapping a word starts/continues a highlight selection.
    if (selection && selection.verse === verseNum) {
      setSelection({ ...selection, end: wordIndex });
      return;
    }
    if (selection) {
      // A tap landed in a different verse while mid-selection — treat it as
      // abandoning that selection and starting fresh in this verse.
      setSelection(null);
    }
    setSelection({ verse: verseNum, anchor: wordIndex, end: wordIndex });
  }

  async function handleWordLongPress(verseNum: number, wordIndex: number, word: string, verseText: string, existingHighlightId: string | null) {
    // Long-pressing a word defines it or saves an existing highlight to journal.
    if (existingHighlightId) {
      handleSaveToJournal(existingHighlightId);
      return;
    }
    setActiveWord(word);
    setActiveDefinition(null);
    setDefinitionLoading(true);
    try {
      const result = await defineWord(word, verseText);
      setActiveDefinition(result);
    } finally {
      setDefinitionLoading(false);
    }
  }

  function handleSwipe(direction: "left" | "right") {
    if (direction === "left" && hasNext) {
      router.setParams({ chapter: String(chapterNum + 1) });
    } else if (direction === "right" && hasPrev) {
      router.setParams({ chapter: String(chapterNum - 1) });
    }
  }

  if (!bookInfo) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Book not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.flex} {...panResponder.panHandlers}>
      <Stack.Screen options={{ title: `${bookInfo.name} ${chapterNum}` }} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.chapterTitle}>
            {bookInfo.name} {chapterNum}
          </Text>
          <Text style={styles.hint}>
            Tap a verse number to highlight it, tap again to remove it • long-press a highlight to
            save it to your journal • tap a word to start highlighting, tap again to end • long-press
            a word to define it
          </Text>
          {passage?.verses.map((v) => {
            const wholeVerse = findHighlightForVerse(highlights, bookInfo.slug, chapterNum, v.verse);
            const wholePalette = wholeVerse ? HIGHLIGHT_PALETTE[wholeVerse.color] : null;
            const partials = findPartialHighlightsForVerse(highlights, bookInfo.slug, chapterNum, v.verse);
            const isSelectingThisVerse = selection?.verse === v.verse;
            const selLo = isSelectingThisVerse ? Math.min(selection!.anchor, selection!.end) : -1;
            const selHi = isSelectingThisVerse ? Math.max(selection!.anchor, selection!.end) : -1;

            let wordIndex = -1;

            return (
              <View key={v.verse} style={styles.verseBlock}>
                <Text style={styles.verseLine}>
                  <Text
                    onPress={() => handleVersePress(v.verse)}
                    onLongPress={() => handleVerseLongPress(v.verse)}
                    style={[styles.verseNum, wholePalette && { backgroundColor: wholePalette.background, color: wholePalette.text }]}
                  >
                    {v.verse}{" "}
                  </Text>
                  {tokenizeVerse(v.text).map((token, i) => {
                    if (!token.word) {
                      return (
                        <Text key={i} style={wholePalette ? { backgroundColor: wholePalette.background, color: wholePalette.text } : undefined}>
                          {token.raw}
                        </Text>
                      );
                    }
                    wordIndex += 1;
                    const idx = wordIndex;
                    const partial = partials.find((p) => idx >= p.startWord! && idx <= p.endWord!);
                    const isSelected = isSelectingThisVerse && idx >= selLo && idx <= selHi;

                    let wordStyle: { backgroundColor: string; color: string } | undefined;
                    if (isSelected) {
                      const previewPalette = HIGHLIGHT_PALETTE[selectedColor];
                      wordStyle = { backgroundColor: previewPalette.background, color: previewPalette.text };
                    } else if (partial) {
                      const p = HIGHLIGHT_PALETTE[partial.color];
                      wordStyle = { backgroundColor: p.background, color: p.text };
                    } else if (wholePalette) {
                      wordStyle = { backgroundColor: wholePalette.background, color: wholePalette.text };
                    }

                    return (
                      <Text
                        key={i}
                        onPress={() => handleWordPress(v.verse, idx, partial?.id ?? wholeVerse?.id ?? null)}
                        onLongPress={() => handleWordLongPress(v.verse, idx, token.word!, v.text, partial?.id ?? wholeVerse?.id ?? null)}
                        style={[wordStyle, isSelected && styles.selectingWord]}
                      >
                        {token.raw}
                      </Text>
                    );
                  })}
                  {"  "}
                </Text>

                {isSelectingThisVerse ? (
                  <View style={styles.selectionBar}>
                    <Text style={styles.selectionHint}>Tap the last word, then save</Text>
                    <Pressable style={styles.selectionButton} onPress={cancelSelection}>
                      <Ionicons name="close" size={16} color={colors.textMuted} />
                      <Text style={styles.selectionButtonText}>Cancel</Text>
                    </Pressable>
                    <Pressable style={[styles.selectionButton, styles.selectionSave]} onPress={confirmSelection}>
                      <Ionicons name="checkmark" size={16} color={colors.accentText} />
                      <Text style={[styles.selectionButtonText, styles.selectionSaveText]}>Save Highlight</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.colorPicker}>
        {HIGHLIGHT_COLORS.map((color) => (
          <Pressable
            key={color}
            onPress={() => setSelectedColor(color)}
            hitSlop={4}
            style={[
              styles.swatch,
              { backgroundColor: HIGHLIGHT_PALETTE[color].swatch },
              selectedColor === color && styles.swatchActive,
            ]}
          />
        ))}
      </View>

      <View style={styles.nav}>
        <Pressable
          style={[styles.navButton, !hasPrev && styles.navButtonDisabled]}
          disabled={!hasPrev}
          onPress={() => router.setParams({ chapter: String(chapterNum - 1) })}
        >
          <Text style={styles.navText}>← Previous</Text>
        </Pressable>
        <Pressable
          style={[styles.navButton, !hasNext && styles.navButtonDisabled]}
          disabled={!hasNext}
          onPress={() => router.setParams({ chapter: String(chapterNum + 1) })}
        >
          <Text style={styles.navText}>Next →</Text>
        </Pressable>
      </View>

      <WordDefinitionModal
        word={activeWord}
        definition={activeDefinition}
        loading={definitionLoading}
        onClose={() => setActiveWord(null)}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    content: { padding: 24, paddingRight: 56, paddingBottom: 100 },
    chapterTitle: { fontFamily: FONT_SCRIPT, fontSize: 34, color: colors.accent, marginBottom: 4, textAlign: "center" },
    hint: {
      fontFamily: FONT_SERIF,
      fontSize: 12,
      color: colors.textMuted,
      textAlign: "center",
      marginBottom: 16,
    },
    verseBlock: { marginBottom: 4 },
    verseLine: { fontFamily: FONT_SERIF, fontSize: 19, lineHeight: 30, color: colors.text },
    verseNum: { fontFamily: FONT_SERIF_BOLD, fontSize: 13, color: colors.accent },
    selectingWord: { textDecorationLine: "underline" },
    error: { color: colors.danger, fontSize: 15, padding: 24, textAlign: "center" },
    selectionBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 4,
      marginBottom: 8,
      padding: 8,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectionHint: { flex: 1, fontFamily: FONT_SERIF, fontSize: 12, color: colors.textMuted },
    selectionButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 8,
    },
    selectionButtonText: { fontFamily: FONT_SERIF, fontSize: 13, color: colors.textMuted },
    selectionSave: { backgroundColor: colors.accent },
    selectionSaveText: { color: colors.accentText },
    colorPicker: {
      position: "absolute",
      right: 10,
      top: "22%",
      gap: 12,
      padding: 8,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    swatch: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: "transparent",
    },
    swatchActive: { borderColor: colors.text },
    nav: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    navButton: { paddingVertical: 10, paddingHorizontal: 16 },
    navButtonDisabled: { opacity: 0.3 },
    navText: { fontFamily: FONT_SERIF_BOLD, color: colors.accent, fontSize: 16 },
  });
