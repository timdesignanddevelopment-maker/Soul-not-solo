import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ParchmentPaper } from "@/components/ParchmentPaper";
import { getHighlight, removeHighlight, type Highlight } from "@/lib/highlights";
import { deleteVerseNote, getVerseNote, saveVerseNote } from "@/lib/journal";
import { confirmAction } from "@/lib/confirm";
import { FONT_SERIF, FONT_SERIF_BOLD, FONT_SERIF_ITALIC } from "@/lib/fonts";

export default function VerseJournalScreen() {
  const router = useRouter();
  const { highlightId } = useLocalSearchParams<{ highlightId: string }>();
  const id = decodeURIComponent(highlightId ?? "");

  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [notes, setNotes] = useState("");
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getHighlight(id), getVerseNote(id)]).then(([h, note]) => {
      if (cancelled) return;
      setHighlight(h ?? null);
      setNotes(note?.notes ?? "");
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  function handleChangeNotes(text: string) {
    setNotes(text);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveVerseNote(id, text);
    }, 600);
  }

  function handleRemoveHighlight() {
    confirmAction(
      "Remove highlight?",
      "This also deletes anything you've written about this verse.",
      "Remove",
      async () => {
        await removeHighlight(id);
        await deleteVerseNote(id);
        router.back();
      }
    );
  }

  if (!loaded) {
    return <View style={styles.flex} />;
  }

  if (!highlight) {
    return (
      <View style={[styles.flex, styles.center]}>
        <Text style={styles.missingText}>This highlight no longer exists.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen options={{ title: highlight.reference }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ParchmentPaper style={styles.versePaper}>
          <Text style={styles.reference}>{highlight.reference}</Text>
          <Text style={styles.verseText}>"{highlight.text}"</Text>
        </ParchmentPaper>

        <ParchmentPaper style={styles.notesPaper}>
          <TextInput
            style={styles.notesInput}
            multiline
            placeholder="What does this verse mean to you? Write your thoughts here…"
            placeholderTextColor="#8a7d6d"
            value={notes}
            onChangeText={handleChangeNotes}
            textAlignVertical="top"
          />
        </ParchmentPaper>

        <Pressable style={styles.removeButton} onPress={handleRemoveHighlight}>
          <Ionicons name="trash-outline" size={16} color="#e07a5f" />
          <Text style={styles.removeText}>Remove highlight</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#14100c" },
  center: { alignItems: "center", justifyContent: "center" },
  missingText: { fontFamily: FONT_SERIF_ITALIC, color: "#8a7d6d", fontSize: 15 },
  content: { padding: 20, paddingBottom: 60, gap: 16 },
  versePaper: {},
  reference: { fontFamily: FONT_SERIF_BOLD, fontSize: 15, color: "#6b5535", marginBottom: 8 },
  verseText: { fontFamily: FONT_SERIF_ITALIC, fontSize: 18, lineHeight: 26, color: "#3a2e18" },
  notesPaper: { minHeight: 320 },
  notesInput: {
    fontFamily: FONT_SERIF,
    fontSize: 17,
    lineHeight: 26,
    color: "#3a2e18",
    minHeight: 280,
  },
  removeButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10 },
  removeText: { fontFamily: FONT_SERIF, color: "#e07a5f", fontSize: 14 },
});
