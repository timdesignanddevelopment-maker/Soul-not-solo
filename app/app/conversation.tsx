import { useRef, useState } from "react";
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
import { FONT_SCRIPT, FONT_SERIF, FONT_SERIF_BOLD } from "@/lib/fonts";

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ConversationScreen() {
  const router = useRouter();
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
  const scrollRef = useRef<ScrollView>(null);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError(null);
    setInput("");
    setSuggestions([]);
    const nextMessages: DisplayMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setLoading(true);
    try {
      const history: ConversationTurn[] = messages.map((m) => ({ role: m.role, content: m.content }));
      const result = await continueConversation(params.situation ?? "", history, trimmed);
      setMessages([...nextMessages, { role: "assistant", content: result.reply }]);
      setSuggestions(result.suggestions ?? []);
    } catch (err) {
      console.error(err);
      setError("Couldn't reach the server. Check that the backend is running and try again.");
    } finally {
      setLoading(false);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#f3ead9" />
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
            <ActivityIndicator color="#6b5535" />
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      {suggestions.length > 0 && !loading ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestions}>
          {suggestions.map((suggestion, i) => (
            <Pressable key={i} style={styles.chip} onPress={() => send(suggestion)}>
              <Text style={styles.chipText}>{suggestion}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="How? This isn't helping. Ask anything..."
          placeholderTextColor="#8a7d6d"
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
          <Ionicons name="arrow-up" size={20} color="#1c1410" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#14100c" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 56,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  closeButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: FONT_SCRIPT, fontSize: 26, color: "#d8b46a" },
  messages: { padding: 16, gap: 12 },
  bubble: { maxWidth: "85%", borderRadius: 16, padding: 14 },
  bubbleAssistant: {
    alignSelf: "flex-start",
    backgroundColor: "#eeddb8",
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: "#3a2e22",
    borderBottomRightRadius: 4,
  },
  bubbleTextAssistant: { fontFamily: FONT_SERIF, fontSize: 17, lineHeight: 24, color: "#3a2e18" },
  bubbleTextUser: { fontFamily: FONT_SERIF, fontSize: 17, lineHeight: 24, color: "#f3ead9" },
  error: { color: "#e07a5f", fontSize: 13, textAlign: "center", marginTop: 8 },
  suggestions: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#a9873f",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: "rgba(216, 180, 106, 0.1)",
  },
  chipText: { fontFamily: FONT_SERIF_BOLD, fontSize: 13, color: "#d8b46a" },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#3a2e22",
  },
  input: {
    flex: 1,
    maxHeight: 100,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#3a2e22",
    backgroundColor: "#1f1710",
    color: "#f3ead9",
    fontFamily: FONT_SERIF,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#d8b46a",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: { opacity: 0.4 },
});
