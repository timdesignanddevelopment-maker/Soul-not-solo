import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { BIBLE_BOOKS } from "@/lib/bibleIndex";
import { useTheme } from "@/lib/ThemeContext";
import type { ThemeColors } from "@/lib/theme";
import { FONT_SCRIPT, FONT_SERIF, FONT_SERIF_ITALIC } from "@/lib/fonts";

export default function ChapterListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { book } = useLocalSearchParams<{ book: string }>();
  const bookInfo = BIBLE_BOOKS.find((b) => b.slug === book);

  if (!bookInfo) {
    return (
      <View style={styles.flex}>
        <Text style={styles.title}>Book not found</Text>
      </View>
    );
  }

  const chapters = Array.from({ length: bookInfo.chapters }, (_, i) => i + 1);

  return (
    <View style={styles.flex}>
      <Stack.Screen options={{ title: bookInfo.name }} />
      <FlatList
        data={chapters}
        keyExtractor={(item) => String(item)}
        numColumns={3}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <Text style={styles.title}>{bookInfo.name}</Text>
            <Text style={styles.subtitle}>{bookInfo.chapters} chapters</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.chapterCard}
            onPress={() => router.push(`/read/${bookInfo.slug}/${item}`)}
            android_ripple={{ color: colors.accent, foreground: true }}
          >
            <Text style={styles.chapterNumber}>{item}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    list: { padding: 20, paddingBottom: 40 },
    headerSection: { marginBottom: 24, width: "100%" },
    title: { fontFamily: FONT_SCRIPT, fontSize: 36, color: colors.accent, marginBottom: 4 },
    subtitle: { fontFamily: FONT_SERIF_ITALIC, fontSize: 14, color: colors.textMuted },
    chapterCard: {
      flex: 1,
      margin: 10,
      aspectRatio: 1,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    chapterNumber: { fontFamily: FONT_SERIF, fontSize: 32, fontWeight: "600", color: colors.accent },
  });
