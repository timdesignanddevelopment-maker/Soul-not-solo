import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadHighlights, HIGHLIGHT_PALETTE, type Highlight } from "@/lib/highlights";
import { loadPersonalEntries, type PersonalEntry } from "@/lib/journal";
import { useTheme } from "@/lib/ThemeContext";
import type { ThemeColors } from "@/lib/theme";
import { FONT_SCRIPT, FONT_SERIF, FONT_SERIF_ITALIC } from "@/lib/fonts";

type Mode = "verses" | "personal";

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

export default function JournalIndexScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [mode, setMode] = useState<Mode>("verses");
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [entries, setEntries] = useState<PersonalEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all([loadHighlights(), loadPersonalEntries()]).then(([h, e]) => {
        if (cancelled) return;
        setHighlights(h);
        setEntries(e);
        setLoaded(true);
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  return (
    <View style={styles.flex}>
      <Text style={styles.header}>Journal</Text>

      <View style={styles.segmented}>
        <Pressable
          style={[styles.segment, mode === "verses" && styles.segmentActive]}
          onPress={() => setMode("verses")}
        >
          <Text style={[styles.segmentText, mode === "verses" && styles.segmentTextActive]}>
            Highlighted Verses
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segment, mode === "personal" && styles.segmentActive]}
          onPress={() => setMode("personal")}
        >
          <Text style={[styles.segmentText, mode === "personal" && styles.segmentTextActive]}>My Journal</Text>
        </Pressable>
      </View>

      {mode === "verses" ? (
        <FlatList
          data={highlights}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            loaded ? (
              <Text style={styles.empty}>
                Nothing highlighted yet — tap a verse in the Bible reader to highlight it, then come back
                here to write about it.
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => router.push(`/journal/${encodeURIComponent(item.id)}`)}>
              <View style={[styles.colorDot, { backgroundColor: HIGHLIGHT_PALETTE[item.color].swatch }]} />
              <View style={styles.rowText}>
                <Text style={styles.rowReference}>{item.reference}</Text>
                <Text style={styles.rowVerse} numberOfLines={2}>
                  {item.text}
                </Text>
                <Text style={styles.rowWhen}>{formatWhen(item.createdAt)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Pressable style={styles.newEntry} onPress={() => router.push("/journal/entry/new")}>
              <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
              <Text style={styles.newEntryText}>New journal entry</Text>
            </Pressable>
          }
          ListEmptyComponent={
            loaded ? (
              <Text style={styles.empty}>
                Nothing written yet — tap "New journal entry" to start writing.
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => router.push(`/journal/entry/${item.id}`)}>
              <View style={styles.rowText}>
                <Text style={styles.rowVerse} numberOfLines={2}>
                  {item.content.trim() || "(empty entry)"}
                </Text>
                <Text style={styles.rowWhen}>{formatWhen(item.updatedAt)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    header: {
      fontFamily: FONT_SCRIPT,
      fontSize: 40,
      color: colors.accent,
      textAlign: "center",
      marginTop: 20,
      marginBottom: 12,
    },
    segmented: {
      flexDirection: "row",
      marginHorizontal: 20,
      marginBottom: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    segment: { flex: 1, paddingVertical: 10, alignItems: "center" },
    segmentActive: { backgroundColor: colors.surface },
    segmentText: { fontFamily: FONT_SERIF, fontSize: 13, color: colors.textMuted },
    segmentTextActive: { color: colors.accent, fontFamily: FONT_SERIF, fontWeight: "700" },
    list: { padding: 20, paddingTop: 4, flexGrow: 1 },
    empty: {
      fontFamily: FONT_SERIF_ITALIC,
      color: colors.textMuted,
      fontSize: 15,
      textAlign: "center",
      marginTop: 40,
      lineHeight: 22,
      paddingHorizontal: 8,
    },
    newEntry: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    newEntryText: { fontFamily: FONT_SERIF, fontSize: 15, color: colors.accent },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      gap: 12,
    },
    colorDot: { width: 12, height: 12, borderRadius: 6 },
    rowText: { flex: 1 },
    rowReference: { fontFamily: FONT_SERIF_ITALIC, fontSize: 13, color: colors.accent, marginBottom: 2 },
    rowVerse: { fontFamily: FONT_SERIF, fontSize: 16, color: colors.text },
    rowWhen: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  });
