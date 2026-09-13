import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  loadDeletedHighlights,
  restoreHighlight,
  purgeHighlightForever,
  HIGHLIGHT_PALETTE,
  type Highlight,
} from "@/lib/highlights";
import {
  loadDeletedPersonalEntries,
  restorePersonalEntry,
  purgePersonalEntryForever,
  type PersonalEntry,
} from "@/lib/journal";
import { loadDeletedHistory, restoreRequest, purgeRequestForever, type SavedRequest } from "@/lib/verseHistory";
import { daysRemaining } from "@/lib/trash";
import { confirmAction } from "@/lib/confirm";
import { useTheme } from "@/lib/ThemeContext";
import type { ThemeColors } from "@/lib/theme";
import { FONT_SCRIPT, FONT_SERIF, FONT_SERIF_ITALIC } from "@/lib/fonts";

export default function TrashScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [entries, setEntries] = useState<PersonalEntry[]>([]);
  const [saved, setSaved] = useState<SavedRequest[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    Promise.all([loadDeletedHighlights(), loadDeletedPersonalEntries(), loadDeletedHistory()]).then(
      ([h, e, s]) => {
        setHighlights(h);
        setEntries(e);
        setSaved(s);
        setLoaded(true);
      }
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  async function handleRestoreHighlight(id: string) {
    await restoreHighlight(id);
    refresh();
  }

  function handlePurgeHighlight(id: string) {
    confirmAction("Delete this permanently?", "This can't be undone.", "Delete Forever", async () => {
      await purgeHighlightForever(id);
      refresh();
    });
  }

  async function handleRestoreEntry(id: string) {
    await restorePersonalEntry(id);
    refresh();
  }

  function handlePurgeEntry(id: string) {
    confirmAction("Delete this permanently?", "This can't be undone.", "Delete Forever", async () => {
      await purgePersonalEntryForever(id);
      refresh();
    });
  }

  async function handleRestoreSaved(id: string) {
    await restoreRequest(id);
    refresh();
  }

  function handlePurgeSaved(id: string) {
    confirmAction("Delete this permanently?", "This can't be undone.", "Delete Forever", async () => {
      await purgeRequestForever(id);
      refresh();
    });
  }

  const isEmpty = loaded && highlights.length === 0 && entries.length === 0 && saved.length === 0;

  return (
    <View style={styles.flex}>
      <Stack.Screen options={{ title: "Trash" }} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Trash</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Deleted items stay here for 30 days before they're gone for good.
        </Text>

        {isEmpty ? <Text style={styles.empty}>Trash is empty.</Text> : null}

        {highlights.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Highlights</Text>
            {highlights.map((h) => (
              <View key={h.id} style={styles.row}>
                <View style={[styles.colorDot, { backgroundColor: HIGHLIGHT_PALETTE[h.color].swatch }]} />
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{h.reference}</Text>
                  <Text style={styles.rowSnippet} numberOfLines={2}>
                    {h.text}
                  </Text>
                  <Text style={styles.rowDays}>{daysRemaining(h.deletedAt!)} days left</Text>
                </View>
                <View style={styles.rowActions}>
                  <Pressable hitSlop={8} onPress={() => handleRestoreHighlight(h.id)}>
                    <Ionicons name="refresh-outline" size={20} color={colors.accent} />
                  </Pressable>
                  <Pressable hitSlop={8} onPress={() => handlePurgeHighlight(h.id)}>
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {entries.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Journal Entries</Text>
            {entries.map((e) => (
              <View key={e.id} style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={styles.rowSnippet} numberOfLines={2}>
                    {e.content.trim() || "(empty entry)"}
                  </Text>
                  <Text style={styles.rowDays}>{daysRemaining(e.deletedAt!)} days left</Text>
                </View>
                <View style={styles.rowActions}>
                  <Pressable hitSlop={8} onPress={() => handleRestoreEntry(e.id)}>
                    <Ionicons name="refresh-outline" size={20} color={colors.accent} />
                  </Pressable>
                  <Pressable hitSlop={8} onPress={() => handlePurgeEntry(e.id)}>
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {saved.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Saved Verses</Text>
            {saved.map((s) => (
              <View key={s.id} style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {s.situation}
                  </Text>
                  <Text style={styles.rowDays}>{daysRemaining(s.deletedAt!)} days left</Text>
                </View>
                <View style={styles.rowActions}>
                  <Pressable hitSlop={8} onPress={() => handleRestoreSaved(s.id)}>
                    <Ionicons name="refresh-outline" size={20} color={colors.accent} />
                  </Pressable>
                  <Pressable hitSlop={8} onPress={() => handlePurgeSaved(s.id)}>
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 56,
      paddingBottom: 12,
    },
    headerTitle: { flex: 1, fontFamily: FONT_SCRIPT, fontSize: 32, color: colors.accent, textAlign: "center" },
    headerSpacer: { width: 24 },
    content: { padding: 20, paddingTop: 0, paddingBottom: 60 },
    subtitle: { fontFamily: FONT_SERIF_ITALIC, fontSize: 13, color: colors.textMuted, marginBottom: 16 },
    empty: {
      fontFamily: FONT_SERIF_ITALIC,
      color: colors.textMuted,
      fontSize: 15,
      textAlign: "center",
      marginTop: 40,
    },
    section: { marginBottom: 20 },
    sectionTitle: {
      fontFamily: FONT_SERIF,
      fontWeight: "700",
      fontSize: 13,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 8,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      gap: 12,
    },
    colorDot: { width: 12, height: 12, borderRadius: 6 },
    rowText: { flex: 1 },
    rowTitle: { fontFamily: FONT_SERIF_ITALIC, fontSize: 13, color: colors.accent, marginBottom: 2 },
    rowSnippet: { fontFamily: FONT_SERIF, fontSize: 15, color: colors.text },
    rowDays: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
    rowActions: { flexDirection: "row", gap: 16 },
  });
