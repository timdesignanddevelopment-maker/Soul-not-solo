import "react-native-gesture-handler";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_500Medium_Italic,
  CormorantGaramond_600SemiBold,
} from "@expo-google-fonts/cormorant-garamond";
import { GreatVibes_400Regular } from "@expo-google-fonts/great-vibes";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_500Medium_Italic,
    CormorantGaramond_600SemiBold,
    GreatVibes_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Every screen leans on these custom fonts (see src/lib/fonts.ts) for the
  // illuminated-manuscript look, so hold the splash screen rather than flash
  // system fonts first. A font load error still lets the app through rather
  // than dead-ending on the splash screen forever.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="reveal" options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="conversation" options={{ presentation: "modal" }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
