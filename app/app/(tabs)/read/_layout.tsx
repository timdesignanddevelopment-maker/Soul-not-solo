import { Stack } from "expo-router";
import { useTheme } from "@/lib/ThemeContext";

// A nested stack so book list -> chapter list -> chapter reader push/pop
// within the "Read" tab, each with a native back button.
export default function ReadLayout() {
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
      <Stack.Screen name="index" options={{ title: "Read the Bible" }} />
      <Stack.Screen name="[book]/index" options={{ title: "" }} />
      <Stack.Screen name="[book]/[chapter]" options={{ title: "" }} />
    </Stack>
  );
}
