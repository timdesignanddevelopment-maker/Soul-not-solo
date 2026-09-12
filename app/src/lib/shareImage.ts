import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";
import type { ViewShotRef } from "react-native-view-shot";

// Snapshots the reveal screen (verse over the blurred-book background) and
// opens the native share sheet with it, so sharing works with whatever
// social apps are installed rather than integrating each one's own SDK.
export async function shareVerse(shotRef: ViewShotRef, caption: string) {
  const uri = await captureRef(shotRef, { format: "png", quality: 0.95 });

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error("Sharing is not available on this device");
  }

  await Sharing.shareAsync(uri, {
    dialogTitle: caption,
    mimeType: "image/png",
  });
}
