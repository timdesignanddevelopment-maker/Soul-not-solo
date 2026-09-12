import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadHistory, deleteRequest, type SavedRequest } from "@/lib/verseHistory";
import { FONT_SCRIPT, FONT_SERIF, FONT_SERIF_ITALIC } from "@/lib/fonts";

function formatWhen(timestamp: number): string {
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function SavedScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<SavedRequest[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Reload every time this tab gains focus (not just on mount) so a verse
  // matched moments ago on the "Find a Verse" tab shows up immediately.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      loadHistory().then((entries) => {
        if (!cancelled) {
          setHistory(entries);
          setLoaded(true);
        }
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  function openEntry(entry: SavedRequest) {
    router.push({
      pathname: "/reveal",
      params: { cards: JSON.stringify(entry.cards), situation: entry.situation },
    });
  }

  async function removeEntry(id: string) {
    setHistory((current) => current.filter((entry) => entry.id !== id));
    await deleteRequest(id);
  }

  return (
    <View style={styles.flex}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.header}>Saved Verses</Text>}
        ListEmptyComponent={
          loaded ? (
            <Text style={styles.empty}>
              Nothing here yet — every match from "Find a Verse" is saved here automatically, so
              you can come back to the other verses from a request after reading one in context.
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => openEntry(item)}>
            <View style={styles.rowText}>
              <Text style={styles.situation} numberOfLines={2}>
                {item.situation}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {item.cards.map((card) => card.reference).join(" • ")}
              </Text>
              <Text style={styles.when}>{formatWhen(item.createdAt)}</Text>
            </View>
            <Pressable hitSlop={12} onPress={() => removeEntry(item.id)}>
              <Ionicons name="trash-outline" size={18} color="#8a7d6d" />
            </Pressable>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#14100c" },
  list: { padding: 20, paddingBottom: 40, flexGrow: 1 },
  header: { fontFamily: FONT_SCRIPT, fontSize: 40, color: "#d8b46a", marginBottom: 16, textAlign: "center" },
  empty: {
    fontFamily: FONT_SERIF_ITALIC,
    color: "#8a7d6d",
    fontSize: 15,
    textAlign: "center",
    marginTop: 40,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#3a2e22",
    gap: 12,
  },
  rowText: { flex: 1 },
  situation: { fontFamily: FONT_SERIF, fontSize: 17, color: "#f3ead9" },
  meta: { fontFamily: FONT_SERIF_ITALIC, fontSize: 13, color: "#d8b46a", marginTop: 2 },
  when: { fontSize: 11, color: "#6b5f52", marginTop: 4 },
});
