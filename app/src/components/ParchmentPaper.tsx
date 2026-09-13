import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

// A warm, illuminated-manuscript-style writing surface — used everywhere the
// journal wants to feel like an old parchment scroll rather than a plain
// app screen: ruled lines under the content, aged-paper gradient behind it.
export function ParchmentPaper({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <View style={[styles.paper, style]}>
      <LinearGradient colors={["#f6ecd6", "#eeddb8", "#e3cc9a"]} style={StyleSheet.absoluteFill} />
      <View style={styles.ruledLines} pointerEvents="none">
        {Array.from({ length: 24 }).map((_, i) => (
          <View key={i} style={styles.ruleLine} />
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
    borderColor: "#a9873f",
  },
  ruledLines: {
    ...StyleSheet.absoluteFill,
    justifyContent: "space-evenly",
    paddingTop: 44,
  },
  ruleLine: { height: 1, backgroundColor: "#a9873f", opacity: 0.22, marginHorizontal: 18 },
  content: { padding: 20 },
});
