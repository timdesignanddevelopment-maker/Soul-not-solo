// Client for our own backend, which is the only thing allowed to hold the AI
// provider's API key. Set EXPO_PUBLIC_BACKEND_URL in app/.env when the backend
// isn't running on localhost (e.g. your dev machine's LAN IP for a physical
// device, or a deployed URL later).
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

export interface VerseMatch {
  reference: string;
  encouragement: string;
  theme: string;
}

// Returns a small set of genuinely different, well-suited passages for the
// situation (not just one reflexive pick), so the app can present them as
// swipeable cards.
export async function matchVerse(situation: string): Promise<VerseMatch[]> {
  const res = await fetch(`${BACKEND_URL}/api/verse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ situation }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Backend error (${res.status})`);
  }
  const data = await res.json();
  return data.matches;
}

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ConversationReply {
  reply: string;
  suggestions: string[];
}

// Goes deeper than the initial verse match — stories, parables, prayer
// guidance — carrying the conversation history so responses stay contextual.
export async function continueConversation(
  situation: string,
  history: ConversationTurn[],
  message: string
): Promise<ConversationReply> {
  const res = await fetch(`${BACKEND_URL}/api/conversation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ situation, history, message }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Backend error (${res.status})`);
  }
  return res.json();
}
