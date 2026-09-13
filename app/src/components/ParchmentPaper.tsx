import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/lib/ThemeContext";

// A warm, illuminated-manuscript-style writing surface — used everywhere the
// journal wants to feel like an old parchment scroll rather than a plain
// app screen: ruled lines under the content, aged-paper gradient behind it.
// Always renders as light parchment regardless of the app's light/dark
// theme (like real paper doesn't change color with the room lighting) —
// only the gradient's exact tone shifts slightly per theme.
export function ParchmentPaper({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.paper, { borderColor: colors.accent }, style]}>
      <LinearGradient colors={colors.parchment} style={StyleSheet.absoluteFill} />
      <View style={styles.ruledLines} pointerEvents="none">
        {Array.from({ length: 24 }).map((_, i) => (
          <View key={i} style={[styles.ruleLine, { backgroundColor: colors.accent }]} />
        ))}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
  },
  ruledLines: {
    ...StyleSheet.absoluteFill,
    justifyContent: "space-evenly",
    paddingTop: 44,
  },
  ruleLine: { height: 1, opacity: 0.22, marginHorizontal: 18 },
  content: { padding: 20 },
});
