import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { matchVerse } from "@/lib/api";
import { fetchVerseText } from "@/lib/bibleApi";
import { saveRequest } from "@/lib/verseHistory";
import { useTheme } from "@/lib/ThemeContext";
import type { ThemeColors } from "@/lib/theme";
import { FONT_SCRIPT, FONT_SERIF_BOLD, FONT_SERIF_ITALIC } from "@/lib/fonts";

export default function InputScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [situation, setSituation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slowNotice, setSlowNotice] = useState(false);
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleSubmit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError(null);
    setLoading(true);
    setSlowNotice(false);
    // The free AI tier this runs on can genuinely take 20-30s per call, and
    // occasionally needs a retry on top of that — without any feedback, a
    // slow-but-working request looks identical to a broken one.
    slowTimer.current = setTimeout(() => setSlowNotice(true), 7000);
    try {
      const matches = await matchVerse(trimmed);
      const cards = await Promise.all(
        matches.map(async (match) => {
          const passage = await fetchVerseText(match.reference);
          return {
            reference: match.reference,
            text: passage.text.trim(),
            encouragement: match.encouragement,
          };
        })
      );
      saveRequest(trimmed, cards);
      router.push({
        pathname: "/reveal",
        params: { cards: JSON.stringify(cards), situation: trimmed },
      });
      setSituation("");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't reach the verse-matching service. Check that the backend is running and try again."
      );
    } finally {
      if (slowTimer.current) clearTimeout(slowTimer.current);
      setLoading(false);
      setSlowNotice(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.wordmark}>Soul Not Solo</Text>
        <Text style={styles.title}>What are you going through?</Text>
        <Text style={styles.subtitle}>
          Tell it like you'd tell a friend. We'll find a few passages that meet you where you are.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="There's something weighing on my heart lately..."
          placeholderTextColor={colors.textMuted}
          value={situation}
          onChangeText={setSituation}
          multiline
          editable={!loading}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.submitButton, (loading || !situation.trim()) && styles.submitButtonDisabled]}
          disabled={loading || !situation.trim()}
          onPress={() => handleSubmit(situation)}
        >
          {loading ? (
            <ActivityIndicator color={colors.accentText} />
          ) : (
            <>
              <Text style={styles.submitText}>Find my verses</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.accentText} />
            </>
          )}
        </Pressable>
        {loading && slowNotice ? (
          <Text style={styles.slowNotice}>Still working — this can take up to a minute sometimes.</Text>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    container: { flexGrow: 1, padding: 24, justifyContent: "center", gap: 16 },
    wordmark: {
      fontFamily: FONT_SCRIPT,
      fontSize: 42,
      color: colors.accent,
      textAlign: "center",
      marginBottom: 4,
    },
    title: { fontFamily: FONT_SERIF_BOLD, fontSize: 28, color: colors.text, textAlign: "center" },
    subtitle: {
      fontFamily: FONT_SERIF_ITALIC,
      fontSize: 16,
      color: colors.textMuted,
      lineHeight: 22,
      textAlign: "center",
    },
    input: {
      minHeight: 120,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      color: colors.text,
      padding: 16,
      fontSize: 16,
      textAlignVertical: "top",
    },
    error: { color: colors.danger, fontSize: 13 },
    slowNotice: {
      fontFamily: FONT_SERIF_ITALIC,
      color: colors.textMuted,
      fontSize: 13,
      textAlign: "center",
    },
    submitButton: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.accent,
      borderRadius: 999,
      paddingVertical: 14,
      marginTop: 4,
    },
    submitButtonDisabled: { opacity: 0.5 },
    submitText: { fontFamily: FONT_SERIF_BOLD, fontSize: 16, color: colors.accentText },
  });
