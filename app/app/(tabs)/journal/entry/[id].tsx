import { useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ParchmentPaper } from "@/components/ParchmentPaper";
import { deletePersonalEntry, getPersonalEntry, savePersonalEntry } from "@/lib/journal";
import { confirmAction } from "@/lib/confirm";
import { useTheme } from "@/lib/ThemeContext";
import type { ThemeColors } from "@/lib/theme";
import { FONT_SERIF } from "@/lib/fonts";

export default function PersonalJournalEntryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id: routeId } = useLocalSearchParams<{ id: string }>();
  const isNew = routeId === "new";

  const [entryId, setEntryId] = useState<string | null>(isNew ? null : routeId ?? null);
  const [content, setContent] = useState("");
  const [loaded, setLoaded] = useState(isNew);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    getPersonalEntry(routeId ?? "").then((entry) => {
      if (cancelled) return;
      setContent(entry?.content ?? "");
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [routeId, isNew]);

  function handleChangeContent(text: string) {
    setContent(text);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (!text.trim()) return;
      const saved = await savePersonalEntry(entryId, text);
      setEntryId(saved.id);
    }, 600);
  }

  function handleDelete() {
    if (!entryId) {
      router.back();
      return;
    }
    confirmAction("Delete this entry?", "You can restore it from Trash for 30 days.", "Delete", async () => {
      await deletePersonalEntry(entryId);
      router.back();
    });
  }

  if (!loaded) {
    return <View style={styles.flex} />;
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen options={{ title: isNew && !entryId ? "New Entry" : "Journal Entry" }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ParchmentPaper style={styles.paper}>
          <TextInput
            style={styles.input}
            multiline
            autoFocus={isNew}
            placeholder="Write whatever's on your heart today…"
            placeholderTextColor={colors.parchmentTextMuted}
            value={content}
            onChangeText={handleChangeContent}
            textAlignVertical="top"
          />
        </ParchmentPaper>

        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
          <Text style={styles.deleteText}>{entryId ? "Delete entry" : "Discard"}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 60, gap: 16 },
    paper: { minHeight: 420 },
    input: {
      fontFamily: FONT_SERIF,
      fontSize: 17,
      lineHeight: 26,
      color: colors.parchmentText,
      minHeight: 380,
    },
    deleteButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10 },
    deleteText: { fontFamily: FONT_SERIF, color: colors.danger, fontSize: 14 },
  });
