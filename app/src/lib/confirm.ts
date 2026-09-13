import { Alert, Platform } from "react-native";

// react-native-web's Alert.alert is a total no-op — on web, the confirm/
// cancel buttons it would show simply never appear, so destructive actions
// silently do nothing. Fall back to the browser's native confirm() there.
export function confirmAction(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void
): void {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: confirmLabel, style: "destructive", onPress: onConfirm },
  ]);
}
