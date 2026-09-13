import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/ThemeContext";

// Fixed top-right on every screen — rendered once at the root, above the
// navigator, rather than added to each screen's own header.
export function ThemeToggle() {
  const { mode, colors, toggleTheme } = useTheme();

  return (
    <Pressable
      style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={toggleTheme}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Ionicons name={mode === "dark" ? "sunny-outline" : "moon-outline"} size={18} color={colors.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    top: 50,
    right: 16,
    zIndex: 1000,
    elevation: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
