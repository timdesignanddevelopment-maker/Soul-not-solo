import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { BIBLE_BOOKS } from "@/lib/bibleIndex";
import { useTheme } from "@/lib/ThemeContext";
import type { ThemeColors } from "@/lib/theme";
import { FONT_SCRIPT, FONT_SERIF } from "@/lib/fonts";

export default function BookListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.flex}>
      <FlatList
        data={BIBLE_BOOKS}
        keyExtractor={(item) => item.slug}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.header}>Read the Bible</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => router.push(`/read/${item.slug}`)}>
            <Text style={styles.rowText}>{item.name}</Text>
            <Text style={styles.rowMeta}>{item.chapters} ch.</Text>
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
    header: { fontFamily: FONT_SCRIPT, fontSize: 40, color: colors.accent, marginBottom: 16, textAlign: "center" },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    rowText: { fontFamily: FONT_SERIF, fontSize: 19, color: colors.text },
    rowMeta: { fontFamily: FONT_SERIF, fontSize: 14, color: colors.textMuted },
  });
