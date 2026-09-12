import { useMemo, useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import ViewShot from "react-native-view-shot";
import { VerseCard } from "@/components/VerseCard";
import { shareVerse } from "@/lib/shareImage";
import { parseReference } from "@/lib/parseReference";

interface Card {
  reference: string;
  text: string;
  encouragement: string;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 64, 380);
const CARD_SPACING = 16;
const SNAP_INTERVAL = CARD_WIDTH + CARD_SPACING;

export default function RevealScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ cards: string; situation: string }>();
  const cards: Card[] = useMemo(() => {
    try {
      return JSON.parse(params.cards ?? "[]");
    } catch {
      return [];
    }
  }, [params.cards]);

  const shotRefs = useRef<(ViewShot | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(event.nativeEvent.contentOffset.x / SNAP_INTERVAL);
    setActiveIndex(Math.max(0, Math.min(index, cards.length - 1)));
  }

  function handleCardPress(card: Card) {
    const parsed = parseReference(card.reference);
    if (!parsed) return;
    router.push(`/read/${parsed.book.slug}/${parsed.chapter}`);
  }

  function handleTalkMore() {
    const card = cards[activeIndex];
    if (!card) return;
    router.push({
      pathname: "/conversation",
      params: {
        situation: params.situation ?? "",
        reference: card.reference,
        text: card.text,
        encouragement: card.encouragement,
      },
    });
  }

  async function handleShare() {
    const ref = shotRefs.current[activeIndex];
    const card = cards[activeIndex];
    if (!ref || !card || sharing) return;
    setSharing(true);
    setShareError(null);
    try {
      await shareVerse(ref, `${card.reference} — ${card.text}`);
    } catch (err) {
      console.error("Share failed:", err);
      setShareError("Couldn't share right now.");
    } finally {
      setSharing(false);
    }
  }

  return (
    <View style={styles.flex}>
      <LinearGradient colors={["#2b2013", "#1c140c", "#0e0a06"]} style={StyleSheet.absoluteFillObject} />
      <View style={styles.pageLines} pointerEvents="none">
        {Array.from({ length: 14 }).map((_, i) => (
          <View key={i} style={[styles.pageLine, { opacity: 0.05 + (i % 3) * 0.02 }]} />
        ))}
      </View>

      <SafeAreaView style={styles.safeArea}>
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={26} color="#f3ead9" />
        </Pressable>

        {cards.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No verses to show.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.hint}>Swipe for more • tap a card to read it in context</Text>

            <ScrollView
              horizontal
              pagingEnabled={false}
              showsHorizontalScrollIndicator={false}
              snapToInterval={SNAP_INTERVAL}
              decelerationRate="fast"
              contentContainerStyle={{
                paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2,
              }}
              onMomentumScrollEnd={handleScrollEnd}
              style={styles.carousel}
            >
              {cards.map((card, index) => (
                <View key={card.reference + index} style={{ marginRight: index === cards.length - 1 ? 0 : CARD_SPACING }}>
                  <ViewShot
                    ref={(r) => {
                      shotRefs.current[index] = r;
                    }}
                    options={{ format: "png", quality: 0.95 }}
                  >
                    <VerseCard
                      reference={card.reference}
                      text={card.text}
                      encouragement={card.encouragement}
                      width={CARD_WIDTH}
                      onPress={() => handleCardPress(card)}
                    />
                  </ViewShot>
                </View>
              ))}
            </ScrollView>

            <View style={styles.dots}>
              {cards.map((_, i) => (
                <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
              ))}
            </View>

            <View style={styles.bottomArea}>
              {shareError ? <Text style={styles.error}>{shareError}</Text> : null}
              <Pressable style={styles.talkButton} onPress={handleTalkMore}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#d8b46a" />
                <Text style={styles.talkText}>Talk more about this</Text>
              </Pressable>
              <Pressable style={styles.shareButton} onPress={handleShare} disabled={sharing}>
                <Ionicons name="share-outline" size={20} color="#1c1410" />
                <Text style={styles.shareText}>{sharing ? "Preparing…" : "Share this verse"}</Text>
              </Pressable>
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#14100c" },
  safeArea: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#c9bba7", fontSize: 15 },
  pageLines: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-evenly",
    paddingVertical: 60,
  },
  pageLine: { height: 1, backgroundColor: "#f3ead9", marginHorizontal: 32 },
  closeButton: {
    marginLeft: 20,
    marginTop: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(20,16,12,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    textAlign: "center",
    color: "#9a8f83",
    fontSize: 12,
    marginTop: 18,
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  carousel: { flexGrow: 0 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 18 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#3a2e22" },
  dotActive: { backgroundColor: "#d8b46a", width: 20 },
  bottomArea: { alignItems: "center", gap: 10, marginTop: "auto", marginBottom: 24 },
  error: { color: "#e07a5f", fontSize: 13 },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#d8b46a",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
  },
  shareText: { fontWeight: "600", color: "#1c1410", fontSize: 15 },
  talkButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4 },
  talkText: { color: "#d8b46a", fontSize: 14, fontWeight: "600" },
});
