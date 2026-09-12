import { useEffect, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// @react-native-voice/voice is a native module — it only works in a custom
// Expo dev client (see README), not in plain Expo Go. Guard the require so
// the app still renders (just without the mic button) if it's unavailable.
let Voice: typeof import("@react-native-voice/voice").default | null = null;
try {
  Voice = require("@react-native-voice/voice").default;
} catch {
  Voice = null;
}

interface Props {
  onResult: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInputButton({ onResult, disabled }: Props) {
  const [listening, setListening] = useState(false);

  useEffect(() => {
    if (!Voice) return;
    // Even when `require` succeeds, the native module can still be
    // unlinked (e.g. plain Expo Go) — every real interaction with Voice
    // needs its own guard, not just the module-level require above.
    try {
      Voice.onSpeechResults = (event: { value?: string[] }) => {
        const spoken = event.value?.[0];
        if (spoken) onResult(spoken);
        setListening(false);
      };
      Voice.onSpeechError = () => setListening(false);
    } catch (err) {
      console.warn("Voice module unavailable:", err);
    }
    return () => {
      try {
        Voice?.destroy()
          .then(() => Voice?.removeAllListeners())
          .catch(() => {});
      } catch {
        // native module not linked — nothing to clean up
      }
    };
  }, [onResult]);

  if (!Voice) {
    return null;
  }

  async function toggleListening() {
    if (!Voice) return;
    try {
      if (listening) {
        await Voice.stop();
        setListening(false);
      } else {
        setListening(true);
        await Voice.start("en-US");
      }
    } catch (err) {
      console.error("Voice input failed:", err);
      setListening(false);
    }
  }

  return (
    <Pressable
      onPress={toggleListening}
      disabled={disabled}
      style={[styles.button, listening && styles.buttonActive, disabled && styles.buttonDisabled]}
    >
      <Ionicons
        name={listening ? "mic" : "mic-outline"}
        size={22}
        color={listening ? "#1c1410" : "#f3ead9"}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2c2119",
    borderWidth: 1,
    borderColor: "#3a2e22",
  },
  buttonActive: { backgroundColor: "#d8b46a" },
  buttonDisabled: { opacity: 0.5 },
});
