import { Stack } from "expo-router";

// A nested stack so the glossary -> verse note / personal entry push/pop
// within the "Journal" tab, each with a native back button.
export default function JournalLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#14100c" },
        headerTintColor: "#f3ead9",
        headerTitleStyle: { color: "#f3ead9" },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Journal" }} />
      <Stack.Screen name="[highlightId]" options={{ title: "" }} />
      <Stack.Screen name="entry/[id]" options={{ title: "" }} />
    </Stack>
  );
}
