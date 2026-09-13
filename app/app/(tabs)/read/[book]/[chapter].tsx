import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { BIBLE_BOOKS } from "@/lib/bibleIndex";
import { fetchChapter, type BiblePassage } from "@/lib/bibleApi";
import { getSelectedTranslationId } from "@/lib/translations";
import {
  loadHighlights,
  addOrExtendHighlight,
  findHighlightForVerse,
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
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [activeDefinition, setActiveDefinition] = useState<WordDefinition | null>(null);
  const [definitionLoading, setDefinitionLoading] = useState(false);

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
      setHighlights(all.filter((h) => h.bookSlug === bookInfo.slug && h.chapter === chapterNum));
    });
    return () => {
      cancelled = true;
    };
  }, [book, chapter]);

  async function handleVersePress(verseNum: number) {
    if (!bookInfo || !passage) return;
    const existing = findHighlightForVerse(highlights, bookInfo.slug, chapterNum, verseNum);
    if (existing) {
      router.push(`/journal/${encodeURIComponent(existing.id)}`);
      return;
    }
    const updatedAll = await addOrExtendHighlight({
      bookSlug: bookInfo.slug,
      bookName: bookInfo.name,
      chapter: chapterNum,
      verseNum,
      color: selectedColor,
      chapterVerses: passage.verses.map((v) => ({ verse: v.verse, text: v.text })),
    });
    setHighlights(updatedAll.filter((h) => h.bookSlug === bookInfo.slug && h.chapter === chapterNum));
  }

  async function handleWordPress(word: string, verseText: string) {
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

  if (!bookInfo) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Book not found</Text>
      </View>
    );
  }

  const hasPrev = chapterNum > 1;
  const hasNext = chapterNum < bookInfo.chapters;

  return (
    <View style={styles.flex}>
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
            Tap the verse number to highlight it • tap a highlighted number to open your journal
            note • tap any word to look it up
          </Text>
          <Text style={styles.body}>
            {passage?.verses.map((v) => {
              const highlight = findHighlightForVerse(highlights, bookInfo.slug, chapterNum, v.verse);
              const palette = highlight ? HIGHLIGHT_PALETTE[highlight.color] : null;
              const highlightStyle = palette ? { backgroundColor: palette.background, color: palette.text } : undefined;
              return (
                <Text key={v.verse}>
                  <Text
                    onPress={() => handleVersePress(v.verse)}
                    style={[styles.verseNum, palette && { backgroundColor: palette.background, color: palette.text }]}
                  >
                    {v.verse}{" "}
                  </Text>
                  {tokenizeVerse(v.text).map((token, i) =>
                    token.word ? (
                      <Text key={i} onPress={() => handleWordPress(token.word!, v.text)} style={highlightStyle}>
                        {token.raw}
                      </Text>
                    ) : (
                      <Text key={i} style={highlightStyle}>
                        {token.raw}
                      </Text>
                    )
                  )}
                  {"  "}
                </Text>
              );
            })}
          </Text>
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
    body: { fontFamily: FONT_SERIF, fontSize: 19, lineHeight: 30, color: colors.text },
    verseNum: { fontFamily: FONT_SERIF_BOLD, fontSize: 13, color: colors.accent },
    error: { color: colors.danger, fontSize: 15, padding: 24, textAlign: "center" },
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
