import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { BIBLE_BOOKS } from "@/lib/bibleIndex";
import { useTheme } from "@/lib/ThemeContext";
import type { ThemeColors } from "@/lib/theme";

export default function ChapterListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { book } = useLocalSearchParams<{ book: string }>();
  const bookInfo = BIBLE_BOOKS.find((b) => b.slug === book);

  if (!bookInfo) {
    return (
      <View style={styles.flex}>
        <Text style={styles.header}>Book not found</Text>
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
        numColumns={5}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.header}>{bookInfo.name}</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.cell} onPress={() => router.push(`/read/${bookInfo.slug}/${item}`)}>
            <Text style={styles.cellText}>{item}</Text>
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
    header: { fontSize: 26, fontWeight: "700", color: colors.text, marginBottom: 16, width: "100%" },
    cell: {
      width: 56,
      height: 56,
      margin: 6,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    cellText: { color: colors.text, fontSize: 16, fontWeight: "600" },
  });
