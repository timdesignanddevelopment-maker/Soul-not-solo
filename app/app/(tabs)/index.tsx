import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { matchVerse } from "@/lib/api";
import { fetchVerseText } from "@/lib/bibleApi";
import { VoiceInputButton } from "@/components/VoiceInputButton";
import { FONT_SCRIPT, FONT_SERIF_BOLD, FONT_SERIF_ITALIC } from "@/lib/fonts";

export default function InputScreen() {
  const router = useRouter();
  const [situation, setSituation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError(null);
    setLoading(true);
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
      router.push({
        pathname: "/reveal",
        params: { cards: JSON.stringify(cards), situation: trimmed },
      });
      setSituation("");
    } catch (err) {
      console.error(err);
      setError(
        "Couldn't reach the verse-matching service. Check that the backend is running and try again."
      );
    } finally {
      setLoading(false);
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
          placeholderTextColor="#8a7d6d"
          value={situation}
          onChangeText={setSituation}
          multiline
          editable={!loading}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actions}>
          <VoiceInputButton
            disabled={loading}
            onResult={(spoken) => {
              setSituation(spoken);
              handleSubmit(spoken);
            }}
          />

          <Pressable
            style={[styles.submitButton, (loading || !situation.trim()) && styles.submitButtonDisabled]}
            disabled={loading || !situation.trim()}
            onPress={() => handleSubmit(situation)}
          >
            {loading ? (
              <ActivityIndicator color="#1c1410" />
            ) : (
              <>
                <Text style={styles.submitText}>Find my verses</Text>
                <Ionicons name="arrow-forward" size={18} color="#1c1410" />
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#14100c" },
  container: { flexGrow: 1, padding: 24, justifyContent: "center", gap: 16 },
  wordmark: {
    fontFamily: FONT_SCRIPT,
    fontSize: 42,
    color: "#d8b46a",
    textAlign: "center",
    marginBottom: 4,
  },
  title: { fontFamily: FONT_SERIF_BOLD, fontSize: 28, color: "#f3ead9", textAlign: "center" },
  subtitle: {
    fontFamily: FONT_SERIF_ITALIC,
    fontSize: 16,
    color: "#b7a999",
    lineHeight: 22,
    textAlign: "center",
  },
  input: {
    minHeight: 120,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#3a2e22",
    backgroundColor: "#1f1710",
    color: "#f3ead9",
    padding: 16,
    fontSize: 16,
    textAlignVertical: "top",
  },
  error: { color: "#e07a5f", fontSize: 13 },
  actions: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  submitButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#d8b46a",
    borderRadius: 999,
    paddingVertical: 14,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitText: { fontFamily: FONT_SERIF_BOLD, fontSize: 16, color: "#1c1410" },
});
