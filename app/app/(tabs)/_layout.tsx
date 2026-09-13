import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#d8b46a",
        tabBarInactiveTintColor: "#9a8f83",
        tabBarStyle: { backgroundColor: "#1c1410", borderTopColor: "#2c2119" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Find a Verse",
          tabBarIcon: ({ color, size }) => <Ionicons name="heart" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          tabBarIcon: ({ color, size }) => <Ionicons name="bookmark" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="read"
        options={{
          title: "Read Bible",
          tabBarIcon: ({ color, size }) => <Ionicons name="book" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: "Journal",
          tabBarIcon: ({ color, size }) => <Ionicons name="pencil" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: "About",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="information-circle" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
