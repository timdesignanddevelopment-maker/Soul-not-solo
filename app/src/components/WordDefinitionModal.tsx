import { useMemo } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/ThemeContext";
import type { ThemeColors } from "@/lib/theme";
import type { WordDefinition } from "@/lib/dictionary";
import { FONT_SCRIPT, FONT_SERIF } from "@/lib/fonts";

interface Props {
  word: string | null;
  definition: WordDefinition | null;
  loading: boolean;
  onClose: () => void;
}

export function WordDefinitionModal({ word, definition, loading, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible={!!word} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.word}>{word}</Text>
          {loading ? (
            <ActivityIndicator color={colors.accent} style={styles.spinner} />
          ) : (
            definition?.definitions.map((def, i) => (
              <Text key={i} style={styles.definition}>
                {def}
              </Text>
            ))
          )}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
    },
    sheet: {
      width: "100%",
      maxWidth: 400,
      backgroundColor: colors.backgroundAlt,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 24,
      gap: 12,
    },
    word: {
      fontFamily: FONT_SCRIPT,
      fontSize: 30,
      color: colors.accent,
      textAlign: "center",
      textTransform: "capitalize",
    },
    spinner: { marginVertical: 8 },
    definition: { fontFamily: FONT_SERIF, fontSize: 16, lineHeight: 23, color: colors.text },
    closeButton: { alignSelf: "center", marginTop: 8, paddingHorizontal: 20, paddingVertical: 8 },
    closeText: { fontFamily: FONT_SERIF, color: colors.textMuted, fontSize: 14 },
  });
