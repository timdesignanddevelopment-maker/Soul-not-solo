import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadHistory, deleteRequest, type SavedRequest } from "@/lib/verseHistory";
import { confirmAction } from "@/lib/confirm";
import { useTheme } from "@/lib/ThemeContext";
import type { ThemeColors } from "@/lib/theme";
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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

  function removeEntry(id: string) {
    confirmAction("Delete this?", "You can restore it from Trash for 30 days.", "Delete", async () => {
      setHistory((current) => current.filter((entry) => entry.id !== id));
      await deleteRequest(id);
    });
  }

  return (
    <View style={styles.flex}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.headerRow}>
            <Text style={styles.header}>Saved Verses</Text>
            <Pressable style={styles.trashLink} onPress={() => router.push("/trash")} hitSlop={12}>
              <Ionicons name="trash-bin-outline" size={20} color={colors.textMuted} />
            </Pressable>
          </View>
        }
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
              <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
            </Pressable>
          </Pressable>
        )}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    list: { padding: 20, paddingBottom: 40, flexGrow: 1 },
    headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 16 },
    header: { fontFamily: FONT_SCRIPT, fontSize: 40, color: colors.accent, textAlign: "center" },
    trashLink: { position: "absolute", right: 0 },
    empty: {
      fontFamily: FONT_SERIF_ITALIC,
      color: colors.textMuted,
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
      borderBottomColor: colors.border,
      gap: 12,
    },
    rowText: { flex: 1 },
    situation: { fontFamily: FONT_SERIF, fontSize: 17, color: colors.text },
    meta: { fontFamily: FONT_SERIF_ITALIC, fontSize: 13, color: colors.accent, marginTop: 2 },
    when: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  });
