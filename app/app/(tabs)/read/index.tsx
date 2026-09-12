import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { BIBLE_BOOKS } from "@/lib/bibleIndex";
import { FONT_SCRIPT, FONT_SERIF } from "@/lib/fonts";

export default function BookListScreen() {
  const router = useRouter();
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

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#14100c" },
  list: { padding: 20, paddingBottom: 40 },
  header: { fontFamily: FONT_SCRIPT, fontSize: 40, color: "#d8b46a", marginBottom: 16, textAlign: "center" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#3a2e22",
  },
  rowText: { fontFamily: FONT_SERIF, fontSize: 19, color: "#f3ead9" },
  rowMeta: { fontFamily: FONT_SERIF, fontSize: 14, color: "#8a7d6d" },
});
