import { callModel, getModelProvider } from "./modelProvider";

export interface VerseMatch {
  reference: string;
  encouragement: string;
  theme: string;
}

// Used when Claude is unreachable or returns something we can't parse, so the
// app never dead-ends on a broken AI response. Each theme offers a small set
// of genuinely different angles (comfort, hope, presence, promise) rather
// than one reflexive "be strong" verse for everything.
const FALLBACKS: { keywords: string[]; matches: VerseMatch[] }[] = [
  {
    keywords: ["fear", "afraid", "scared", "anxious", "anxiety", "worry", "worried", "panic"],
    matches: [
      {
        reference: "Isaiah 41:10",
        encouragement:
          "God is with you in this fear — you don't have to face it alone or in your own strength.",
        theme: "fear",
      },
      {
        reference: "Philippians 4:6-7",
        encouragement:
          "Bring the specific thing you're afraid of into words before God — His peace can guard your heart even before the situation resolves.",
        theme: "fear",
      },
      {
        reference: "Psalm 34:4",
        encouragement:
          "Others who were just as afraid sought Him and were freed from their fear — that's available to you too.",
        theme: "fear",
      },
    ],
  },
  {
    keywords: [
      "grief",
      "grieving",
      "loss",
      "losing",
      "lost my",
      "lost a",
      "death",
      "died",
      "dying",
      "mourning",
      "miss them",
      "passed away",
      "loved one",
    ],
    matches: [
      {
        reference: "Psalm 34:18",
        encouragement:
          "The Lord is close to the brokenhearted; your grief is not invisible to Him, and you don't have to carry it at a distance from Him.",
        theme: "grief",
      },
      {
        reference: "Matthew 5:4",
        encouragement:
          "Your mourning itself is named as a place where blessing and comfort meet you — grief isn't something to rush past.",
        theme: "grief",
      },
      {
        reference: "Revelation 21:4",
        encouragement:
          "This pain is real now, and it is not permanent — there is a promised end to every tear.",
        theme: "grief",
      },
    ],
  },
  {
    keywords: ["money", "job", "work", "finance", "financial", "debt", "poor", "bills", "unemployed", "fired"],
    matches: [
      {
        reference: "Philippians 4:6-7",
        encouragement:
          "Bring this need honestly to God — His peace can guard your heart even before the situation changes.",
        theme: "provision",
      },
      {
        reference: "Matthew 6:31-33",
        encouragement:
          "This worry is a normal one to carry — and also one you're invited to hand over while you keep doing the next right thing.",
        theme: "provision",
      },
      {
        reference: "Psalm 37:25",
        encouragement:
          "This isn't a promise that it'll be easy, but a witness that He has sustained others through exactly this kind of need.",
        theme: "provision",
      },
    ],
  },
  {
    keywords: ["alone", "lonely", "isolated", "no one", "nobody"],
    matches: [
      {
        reference: "Deuteronomy 31:6",
        encouragement:
          "You are not as alone as it feels right now — He goes before you and will not leave you.",
        theme: "loneliness",
      },
      {
        reference: "Psalm 68:6",
        encouragement:
          "God has a particular care for the isolated — this is something He notices and moves toward, not away from.",
        theme: "loneliness",
      },
      {
        reference: "Matthew 28:20",
        encouragement:
          "Even when no one else is in the room, this is a promise of presence that doesn't depend on other people showing up.",
        theme: "loneliness",
      },
    ],
  },
  {
    keywords: ["angry", "anger", "resentment", "bitter", "unforgiveness"],
    matches: [
      {
        reference: "Ephesians 4:31-32",
        encouragement:
          "What you're carrying is heavy — let this be permission to set some of it down, in your own time.",
        theme: "anger",
      },
      {
        reference: "Psalm 4:4",
        encouragement:
          "Feeling this is allowed — the invitation here is to sit with it honestly rather than act it out or bury it.",
        theme: "anger",
      },
      {
        reference: "James 1:19-20",
        encouragement:
          "Not a demand to feel differently right now, just a gentle nudge toward slowing down before this anger drives the next move.",
        theme: "anger",
      },
    ],
  },
  {
    keywords: [],
    matches: [
      {
        reference: "Psalm 34:18",
        encouragement: "Whatever this is, you're not carrying it unseen — He is close to you in it.",
        theme: "general",
      },
      {
        reference: "Matthew 11:28",
        encouragement: "This is a direct invitation to bring exactly what's weighing on you and rest.",
        theme: "general",
      },
      {
        reference: "Joshua 1:9",
        encouragement: "Be strong and courageous — you are not facing this alone.",
        theme: "general",
      },
    ],
  },
];

function fallbackMatch(situation: string): VerseMatch[] {
  const lower = situation.toLowerCase();
  for (const { keywords, matches } of FALLBACKS) {
    if (keywords.some((k) => lower.includes(k))) return matches;
  }
  return FALLBACKS[FALLBACKS.length - 1].matches;
}

function parseAndValidate(raw: string): VerseMatch[] | null {
  try {
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) return null;
    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
    if (!Array.isArray(parsed.matches) || parsed.matches.length === 0) return null;

    const matches: VerseMatch[] = [];
    for (const entry of parsed.matches) {
      if (
        typeof entry.reference === "string" &&
        entry.reference.trim().length > 0 &&
        typeof entry.encouragement === "string" &&
        entry.encouragement.trim().length > 0 &&
        typeof entry.theme === "string"
      ) {
        matches.push({
          reference: entry.reference.trim(),
          encouragement: entry.encouragement.trim(),
          theme: entry.theme.trim(),
        });
      }
    }
    return matches.length > 0 ? matches.slice(0, 4) : null;
  } catch {
    return null;
  }
}

// A curated reference bank so the model has genuinely good, emotionally-fitting
// options to draw from instead of defaulting to a generic "be strong" verse
// for everything. Organized by the emotional register of the situation, not
// just the topic, since a grieving person and a frightened person need
// different kinds of passages even if both technically involve "hardship."
const REFERENCE_BANK = `Reference bank, organized by emotional register (use this to ground your picks, but you are not limited to it):

GRIEF / LOSS (comfort and lament, not commands to be strong): Psalm 34:18, Psalm 147:3, Psalm 23:4, Matthew 5:4, John 11:25-26, 2 Corinthians 1:3-4, 1 Thessalonians 4:13-14, Revelation 21:4, Lamentations 3:22-23, Romans 8:38-39

FEAR / ANXIETY (presence and peace): Isaiah 41:10, Philippians 4:6-7, Psalm 34:4, Psalm 56:3, 2 Timothy 1:7, John 14:27, Matthew 6:25-27, 1 Peter 5:7

FACING A CHALLENGE / NEEDING COURAGE (strength for action, appropriate when the person needs to DO something difficult, not merely endure pain): Joshua 1:9, Deuteronomy 31:6, Philippians 4:13, Isaiah 40:31, 2 Corinthians 12:9

GUILT / SHAME (grace, not condemnation): Romans 8:1, Psalm 103:12, 1 John 1:9, Isaiah 1:18, Micah 7:18-19

ANGER / BITTERNESS (honesty and release): Ephesians 4:26, Ephesians 4:31-32, Psalm 4:4, James 1:19-20, Colossians 3:13

LONELINESS / ISOLATION (presence): Deuteronomy 31:6, Psalm 68:6, Matthew 28:20, Hebrews 13:5, Psalm 27:10

DOUBT / FAITH CRISIS (honest wrestling, not forced certainty): Mark 9:24, Psalm 42:11, Habakkuk 3:17-18, Job 13:15, 2 Corinthians 5:7

RELATIONSHIP CONFLICT / BROKEN TRUST: 1 Corinthians 13:4-7, Ephesians 4:32, Proverbs 15:1, Romans 12:18, Colossians 3:13

FINANCIAL STRESS / PROVISION: Philippians 4:6-7, Matthew 6:31-33, Psalm 37:25, Philippians 4:19, Proverbs 3:5-6

ILLNESS / PHYSICAL SUFFERING: Psalm 34:18, 2 Corinthians 12:9, James 5:14-15, Psalm 41:3, Isaiah 53:5

PURPOSE / DIRECTION / FEELING LOST: Jeremiah 29:11, Proverbs 3:5-6, Psalm 32:8, Romans 8:28, Psalm 37:23

GRATITUDE / JOY: Psalm 100:4-5, 1 Thessalonians 5:16-18, Philippians 4:4, Psalm 118:24

TEMPTATION / STRUGGLE WITH SIN: 1 Corinthians 10:13, James 4:7, Galatians 5:16-17, Hebrews 4:15-16

PATIENCE / WAITING: Isaiah 40:31, Psalm 27:14, Romans 8:25, Lamentations 3:25-26`;

const SYSTEM_PROMPT = `You help people find real Bible passages that speak directly to whatever they are going through — with genuine pastoral care, not a reflexive default.

Given a description of someone's situation, respond with ONLY a JSON object (no other text, no markdown fences) in exactly this shape:
{"matches": [{"reference": "<a real, specific Bible reference>", "encouragement": "<2-3 warm, direct sentences connecting this specific passage to their specific situation>", "theme": "<a short lowercase theme, e.g. 'grief', 'fear', 'provision'>"}, ...]}

Return exactly 3 matches, in this order:
1. The most immediately comforting passage — presence, reassurance, "you are not alone in this feeling." This is the first thing someone hurting needs to hear.
2. A second, different comforting angle — not a near-duplicate of the first (e.g. if #1 is about God's nearness, #2 could be the promise of eventual comfort or hope beyond the pain), still landing as comfort rather than instruction.
3. A deeper, practical passage that goes further than comfort alone — a principle for actually moving through this (perseverance, sowing and reaping, faithfulness in hard seasons, trusting a process that isn't finished yet). This one can challenge or instruct, since by the third card the person has already been met with comfort.

Critical: match the EMOTIONAL REGISTER of the situation, not just its topic. Someone grieving a death needs comfort and presence first, not a command to "be strong and not be afraid" — that's for someone facing a coming challenge, not someone already in pain. Someone in a faith crisis needs honest wrestling, not forced certainty. Read what they actually need, and sequence comfort before instruction.

${REFERENCE_BANK}

Every reference must be real and verifiable — never invent one. Draw on the bank above as a strong starting point, but use your own knowledge of scripture too when a better-fitting passage exists.`;

// Repeat situations (two people typing near-identical things, or one person
// resubmitting) shouldn't cost a second API call. Keyed on normalized text;
// only real Claude responses are cached, not fallback results, so a
// transient outage doesn't get permanently stuck cached for that phrasing.
const responseCache = new Map<string, VerseMatch[]>();
const MAX_CACHE_ENTRIES = 500;

function normalizeCacheKey(situation: string): string {
  return situation.trim().toLowerCase().replace(/\s+/g, " ");
}

function rememberInCache(key: string, matches: VerseMatch[]): void {
  responseCache.set(key, matches);
  if (responseCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey !== undefined) responseCache.delete(oldestKey);
  }
}

export async function matchVerseWithClaude(situation: string): Promise<VerseMatch[]> {
  const cacheKey = normalizeCacheKey(situation);
  const cached = responseCache.get(cacheKey);
  if (cached) return cached;

  try {
    const text = await callModel(SYSTEM_PROMPT, [{ role: "user", content: situation }]);
    const parsed = parseAndValidate(text);
    if (parsed) {
      rememberInCache(cacheKey, parsed);
      return parsed;
    }

    const retryText = await callModel(SYSTEM_PROMPT, [
      { role: "user", content: situation },
      { role: "assistant", content: text },
      { role: "user", content: "Respond again with ONLY the JSON object, nothing else." },
    ]);
    const retryParsed = parseAndValidate(retryText);
    if (retryParsed) {
      rememberInCache(cacheKey, retryParsed);
      return retryParsed;
    }

    console.warn(`${getModelProvider()} response failed validation twice, using fallback verses.`);
    return fallbackMatch(situation);
  } catch (err) {
    console.error(`Verse match failed via ${getModelProvider()}, using fallback:`, err);
    return fallbackMatch(situation);
  }
}
