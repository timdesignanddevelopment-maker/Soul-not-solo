import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { BIBLE_BOOKS } from "@/lib/bibleIndex";
import { fetchChapter, type BiblePassage } from "@/lib/bibleApi";
import { FONT_SCRIPT, FONT_SERIF, FONT_SERIF_BOLD } from "@/lib/fonts";

export default function ChapterReaderScreen() {
  const router = useRouter();
  const { book, chapter } = useLocalSearchParams<{ book: string; chapter: string }>();
  const bookInfo = BIBLE_BOOKS.find((b) => b.slug === book);
  const chapterNum = Number(chapter);

  const [passage, setPassage] = useState<BiblePassage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookInfo) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchChapter(bookInfo.name, chapterNum)
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
          <ActivityIndicator color="#d8b46a" />
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
          <Text style={styles.body}>
            {passage?.verses.map((v) => (
              <Text key={v.verse}>
                <Text style={styles.verseNum}>{v.verse} </Text>
                {v.text}
                {"  "}
              </Text>
            ))}
          </Text>
        </ScrollView>
      )}

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
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#14100c" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 24, paddingBottom: 100 },
  chapterTitle: { fontFamily: FONT_SCRIPT, fontSize: 34, color: "#d8b46a", marginBottom: 16, textAlign: "center" },
  body: { fontFamily: FONT_SERIF, fontSize: 19, lineHeight: 30, color: "#e5dac6" },
  verseNum: { fontFamily: FONT_SERIF_BOLD, fontSize: 13, color: "#d8b46a" },
  error: { color: "#e07a5f", fontSize: 15, padding: 24, textAlign: "center" },
  nav: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#3a2e22",
    backgroundColor: "#14100c",
  },
  navButton: { paddingVertical: 10, paddingHorizontal: 16 },
  navButtonDisabled: { opacity: 0.3 },
  navText: { fontFamily: FONT_SERIF_BOLD, color: "#d8b46a", fontSize: 16 },
});
