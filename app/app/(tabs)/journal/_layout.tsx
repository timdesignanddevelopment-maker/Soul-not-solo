import { Stack } from "expo-router";
import { useTheme } from "@/lib/ThemeContext";

// A nested stack so the glossary -> verse note / personal entry push/pop
// within the "Journal" tab, each with a native back button.
export default function JournalLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Journal" }} />
      <Stack.Screen name="[highlightId]" options={{ title: "" }} />
      <Stack.Screen name="entry/[id]" options={{ title: "" }} />
    </Stack>
  );
}
