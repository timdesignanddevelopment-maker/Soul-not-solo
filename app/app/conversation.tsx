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
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { continueConversation, type ConversationTurn } from "@/lib/api";
import { useTheme } from "@/lib/ThemeContext";
import type { ThemeColors } from "@/lib/theme";
import { FONT_SCRIPT, FONT_SERIF, FONT_SERIF_BOLD } from "@/lib/fonts";

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ConversationScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const params = useLocalSearchParams<{
    situation: string;
    reference: string;
    text: string;
    encouragement: string;
  }>();

  const openingMessage = `${params.reference} — "${params.text}"\n\n${params.encouragement}`;

  const [messages, setMessages] = useState<DisplayMessage[]>([
    { role: "assistant", content: openingMessage },
  ]);
  const [suggestions, setSuggestions] = useState<string[]>([
    "How do I actually pray about this?",
    "Show me someone in the Bible who felt this way",
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Shared by both a fresh send and a retry — `history` is every prior turn
  // (not including messageText itself, which the backend takes separately).
  // On failure the user's message stays in `messages` (added by the caller
  // before this runs) so retry can resend it without retyping.
  async function callApi(history: DisplayMessage[], messageText: string) {
    setError(null);
    setLoading(true);
    try {
      const historyTurns: ConversationTurn[] = history.map((m) => ({ role: m.role, content: m.content }));
      const result = await continueConversation(params.situation ?? "", historyTurns, messageText);
      setMessages([...history, { role: "user", content: messageText }, { role: "assistant", content: result.reply }]);
      setSuggestions(result.suggestions ?? []);
      setLastFailedMessage(null);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't reach the server. Check that the backend is running and try again."
      );
      setLastFailedMessage(messageText);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    setSuggestions([]);
    const history = messages;
    setMessages([...messages, { role: "user", content: trimmed }]);
    await callApi(history, trimmed);
  }

  function retry() {
    if (!lastFailedMessage || loading) return;
    callApi(messages.slice(0, -1), lastFailedMessage);
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Talk it through</Text>
        <View style={styles.closeButton} />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message, i) => (
          <View
            key={i}
            style={[styles.bubble, message.role === "user" ? styles.bubbleUser : styles.bubbleAssistant]}
          >
            <Text style={message.role === "user" ? styles.bubbleTextUser : styles.bubbleTextAssistant}>
              {message.content}
            </Text>
          </View>
        ))}

        {loading ? (
          <View style={[styles.bubble, styles.bubbleAssistant]}>
            <ActivityIndicator color={colors.parchmentTextMuted} />
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorRow}>
            <Text style={styles.error}>{error}</Text>
            {lastFailedMessage ? (
              <Pressable style={styles.retryButton} onPress={retry} hitSlop={10}>
                <Ionicons name="refresh" size={16} color={colors.accent} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {suggestions.length > 0 && !loading ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestions}>
          {suggestions.map((suggestion, i) => (
            <Pressable key={i} style={styles.chip} onPress={() => send(suggestion)}>
              <Text style={styles.chipText} numberOfLines={1} ellipsizeMode="tail">
                {suggestion}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="How? This isn't helping. Ask anything..."
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          editable={!loading}
          multiline
        />
        <Pressable
          style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
          disabled={!input.trim() || loading}
          onPress={() => send(input)}
        >
          <Ionicons name="arrow-up" size={20} color={colors.accentText} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 56,
      paddingHorizontal: 12,
      paddingBottom: 12,
    },
    closeButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontFamily: FONT_SCRIPT, fontSize: 26, color: colors.accent },
    messages: { padding: 16, gap: 12 },
    bubble: { maxWidth: "85%", borderRadius: 16, padding: 14 },
    bubbleAssistant: {
      alignSelf: "flex-start",
      backgroundColor: colors.parchment[1],
      borderBottomLeftRadius: 4,
    },
    bubbleUser: {
      alignSelf: "flex-end",
      backgroundColor: colors.text,
      borderBottomRightRadius: 4,
    },
    bubbleTextAssistant: { fontFamily: FONT_SERIF, fontSize: 17, lineHeight: 24, color: colors.parchmentText },
    bubbleTextUser: { fontFamily: FONT_SERIF, fontSize: 17, lineHeight: 24, color: colors.background },
    errorRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 8,
    },
    error: { color: colors.danger, fontSize: 13, textAlign: "center" },
    retryButton: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    suggestions: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
    chip: {
      maxWidth: 260,
      borderWidth: 1,
      borderColor: colors.accent,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
      marginRight: 8,
      backgroundColor: colors.surface,
    },
    chipText: { fontFamily: FONT_SERIF_BOLD, fontSize: 13, color: colors.accent },
    inputRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 10,
      padding: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    input: {
      flex: 1,
      maxHeight: 100,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      color: colors.text,
      fontFamily: FONT_SERIF,
      fontSize: 16,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    sendButtonDisabled: { opacity: 0.4 },
  });
