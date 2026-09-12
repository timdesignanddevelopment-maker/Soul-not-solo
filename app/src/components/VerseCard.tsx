import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { FONT_SCRIPT, FONT_SERIF, FONT_SERIF_BOLD, FONT_SERIF_ITALIC } from "@/lib/fonts";

interface Props {
  reference: string;
  text: string;
  encouragement: string;
  width: number;
  onPress: () => void;
}

// One illuminated-manuscript-style card. The whole card is tappable to jump
// to that passage in the full Bible reader.
export function VerseCard({ reference, text, encouragement, width, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { width }]}
      accessibilityRole="button"
      accessibilityLabel={`Read ${reference} in context`}
    >
      <LinearGradient
        colors={["#f6ecd6", "#eeddb8", "#e3cc9a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.innerBorder} pointerEvents="none" />

      <View style={styles.content}>
        <Text style={styles.reference}>{reference}</Text>
        <Text style={styles.verse}>&ldquo;{text}&rdquo;</Text>
        <View style={styles.divider} />
        <Text style={styles.encouragement}>{encouragement}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Read in context</Text>
        <Ionicons name="arrow-forward-circle-outline" size={16} color="#6b5535" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#a9873f",
    minHeight: 420,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  innerBorder: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderWidth: 1,
    borderColor: "rgba(107, 85, 53, 0.35)",
    borderRadius: 14,
  },
  content: { flex: 1, padding: 28, justifyContent: "center", gap: 14 },
  reference: {
    fontFamily: FONT_SCRIPT,
    fontSize: 30,
    color: "#6b4a1f",
    textAlign: "center",
  },
  verse: {
    fontFamily: FONT_SERIF_ITALIC,
    fontSize: 22,
    lineHeight: 30,
    color: "#3a2e18",
    textAlign: "center",
  },
  divider: {
    alignSelf: "center",
    width: 48,
    height: 1,
    backgroundColor: "#a9873f",
    marginVertical: 4,
  },
  encouragement: {
    fontFamily: FONT_SERIF,
    fontSize: 16,
    lineHeight: 23,
    color: "#4a3c24",
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingBottom: 18,
  },
  footerText: {
    fontFamily: FONT_SERIF_BOLD,
    fontSize: 13,
    letterSpacing: 0.5,
    color: "#6b5535",
    textTransform: "uppercase",
  },
});
