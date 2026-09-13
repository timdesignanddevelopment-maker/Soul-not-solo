import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TRANSLATIONS, getTranslation } from "@/lib/translations";
import { FONT_SERIF_BOLD } from "@/lib/fonts";

interface Props {
  selectedId: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export function TranslationPicker({ selectedId, onSelect, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const current = getTranslation(selectedId);

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setOpen(true)} disabled={disabled}>
        <Text style={styles.triggerText}>{current.shortLabel}</Text>
        <Ionicons name="chevron-down" size={14} color="#d8b46a" />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Choose a translation</Text>
            <FlatList
              data={TRANSLATIONS}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.row}
                  onPress={() => {
                    onSelect(item.id);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.rowText, item.id === selectedId && styles.rowTextActive]}>
                    {item.label}
                  </Text>
                  {item.id === selectedId ? <Ionicons name="checkmark" size={18} color="#d8b46a" /> : null}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#3a2e22",
    backgroundColor: "rgba(216, 180, 106, 0.08)",
    alignSelf: "center",
  },
  triggerText: { fontFamily: FONT_SERIF_BOLD, fontSize: 13, color: "#d8b46a", letterSpacing: 0.5 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#1c1410",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: "60%",
  },
  sheetTitle: {
    fontFamily: FONT_SERIF_BOLD,
    fontSize: 16,
    color: "#f3ead9",
    textAlign: "center",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2c2119",
  },
  rowText: { fontFamily: FONT_SERIF_BOLD, fontSize: 15, color: "#c9bba7" },
  rowTextActive: { color: "#d8b46a" },
});
