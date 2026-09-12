import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL ?? "claude-haiku-4-5-20251001";

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ConversationReply {
  reply: string;
  suggestions: string[];
}

// A bank of biblical stories and teaching patterns, so follow-up
// conversation can go further than "here's a verse" into how someone in
// scripture actually lived through something similar, or how to do things
// many people were never taught, like how to pray.
const STORY_AND_TEACHING_BANK = `Stories and teachings to draw on when someone wants to go deeper (not exhaustive — use your own knowledge too):

PERSEVERANCE / HARD WORK NOT YET PAYING OFF: the parable of the sower (Matthew 13:1-23) — the seed that fell on good soil still had to grow before harvest; Galatians 6:9 ("let us not grow weary... at the proper time we will reap a harvest, if we do not give up"); Ruth gleaning in Boaz's field before anything had changed for her (Ruth 2); Nehemiah rebuilding the wall against constant opposition (Nehemiah 4).

FACING SOMETHING FRIGHTENING: David and Goliath (1 Samuel 17) — he acted from what he already knew to be true, not from feeling ready; Gideon, who felt least qualified (Judges 6-7); the disciples in the storm, where Jesus was present even though it didn't feel like it (Mark 4:35-41); Esther choosing to act despite the risk ("for such a time as this," Esther 4:14).

GRIEF AND LOSS: Job's friends who first did the right thing by simply sitting with him in silence (Job 2:13) before they started talking; Naomi's grief in Ruth 1; Jesus weeping at Lazarus's tomb even knowing what He was about to do (John 11:35) — grief and faith are not opposites.

GUILT / SHAME / FEELING DISQUALIFIED: the prodigal son, run to and embraced before he even finished his apology (Luke 15:11-32); Peter, restored by name after denying Jesus three times (John 21:15-19); the woman caught in adultery, met with "neither do I condemn you" (John 8:1-11).

DOUBT: Thomas, whose doubt was met with patience, not rebuke (John 20:24-29); Elijah, suicidally despairing under a tree and met first with food and rest, not a lecture (1 Kings 19:1-8); John the Baptist questioning from prison whether Jesus was really the one (Matthew 11:2-6).

HOW TO PRAY (many people were never actually taught this — offer it plainly and practically): the Lord's Prayer as a simple model (Matthew 6:9-13) — praise, surrender, asking for provision, asking for forgiveness and to forgive, asking for protection; Philippians 4:6-7's pattern of thanksgiving alongside honest requests; the Psalms as permission to be completely honest with God, including anger and despair (e.g. Psalm 13, Psalm 88) — prayer doesn't require polished language.`;

const CONVERSATION_SYSTEM_PROMPT = `You are continuing a caring, faith-grounded conversation with someone who first received a Bible verse for something they're going through. Now they're responding — maybe asking "how," maybe saying it isn't helping, maybe asking a follow-up question, maybe tapping a suggested path.

Go deeper than a single verse. Draw on relevant stories of people in scripture who faced something similar, parables, and practical teaching (including how to actually pray, since many people were never taught this and are too embarrassed to ask). Be warm, specific, and honest — if they say something isn't helping, don't repeat yourself, actually meet that. It's fine to acknowledge that faith doesn't make hard things instantly easy.

${STORY_AND_TEACHING_BANK}

Respond with ONLY a JSON object (no other text, no markdown fences) in exactly this shape:
{"reply": "<3-5 warm, substantive sentences — a real answer, not a brush-off>", "suggestions": ["<a short first-person next-step prompt, e.g. 'Show me someone in the Bible who felt this way'>", "<a second, different short next-step prompt, e.g. 'How do I actually pray about this?'>"]}

The two suggestions should be genuinely useful next steps given what was just said, phrased as something the person would tap to say themselves (first person, under 8 words each).`;

function extractText(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

function parseAndValidate(raw: string): ConversationReply | null {
  try {
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) return null;
    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
    if (typeof parsed.reply !== "string" || parsed.reply.trim().length === 0) return null;
    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions.filter((s: unknown): s is string => typeof s === "string" && s.trim().length > 0).slice(0, 2)
      : [];
    return { reply: parsed.reply.trim(), suggestions };
  } catch {
    return null;
  }
}

const FALLBACK_REPLY: ConversationReply = {
  reply:
    "I'm having trouble reaching for more right now, but here's something true regardless: you don't have to have this figured out today, and you're not required to feel better on any particular schedule. Come back to this whenever you're ready.",
  suggestions: ["How do I actually pray about this?", "Show me someone in the Bible who felt this way"],
};

export async function continueConversation(
  situation: string,
  history: ConversationTurn[],
  message: string
): Promise<ConversationReply> {
  try {
    const contextMessage = `Original situation: "${situation}"\n\nNew message: "${message}"`;
    const messages: Anthropic.MessageParam[] = [
      ...history.map((turn) => ({ role: turn.role, content: turn.content })),
      { role: "user", content: contextMessage },
    ];

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 500,
      system: CONVERSATION_SYSTEM_PROMPT,
      messages,
    });

    const parsed = parseAndValidate(extractText(response));
    return parsed ?? FALLBACK_REPLY;
  } catch (err) {
    console.error("Conversation follow-up failed, using fallback:", err);
    return FALLBACK_REPLY;
  }
}
