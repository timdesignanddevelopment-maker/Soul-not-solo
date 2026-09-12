import { Stack } from "expo-router";

// A nested stack so book list -> chapter list -> chapter reader push/pop
// within the "Read" tab, each with a native back button.
export default function ReadLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#14100c" },
        headerTintColor: "#f3ead9",
        headerTitleStyle: { color: "#f3ead9" },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Read the Bible" }} />
      <Stack.Screen name="[book]/index" options={{ title: "" }} />
      <Stack.Screen name="[book]/[chapter]" options={{ title: "" }} />
    </Stack>
  );
}
