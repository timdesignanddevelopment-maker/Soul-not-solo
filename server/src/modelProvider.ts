import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

// Which backend answers AI calls. Defaults to NVIDIA NIM (production) — set
// MODEL_PROVIDER=anthropic to route through Claude instead.
//
// Everything here that touches process.env is read lazily (inside a
// function, at call time) rather than captured into a module-load-time
// const. index.ts calls dotenv.config() after its imports run, and this
// module gets imported transitively (via the route files) before that
// happens — so any env var read at module scope here would see values from
// before .env was loaded. For a plain string comparison that's easy to miss
// (it just silently ignores .env and falls back to the default), but for the
// API clients it's fatal: constructing them eagerly bakes in a missing
// apiKey permanently, no matter what .env actually says.
export function getModelProvider(): "nim" | "anthropic" {
  return process.env.MODEL_PROVIDER === "anthropic" ? "anthropic" : "nim";
}

let anthropicClient: Anthropic | null = null;
function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

let nimClient: OpenAI | null = null;
function getNimClient(): OpenAI {
  if (!nimClient) {
    // Falls back to a placeholder so construction never throws when the key
    // is unset — an actual request without a real key fails naturally at
    // call time and is caught by callers.
    nimClient = new OpenAI({
      apiKey: process.env.NVIDIA_NIM_API_KEY ?? "unset",
      baseURL: "https://integrate.api.nvidia.com/v1",
    });
  }
  return nimClient;
}

function getClaudeModel(): string {
  return process.env.CLAUDE_MODEL ?? "claude-haiku-4-5-20251001";
}

function getNimModel(): string {
  return process.env.NVIDIA_NIM_MODEL ?? "deepseek-ai/deepseek-v4-flash-0731";
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

function extractAnthropicText(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

export function warnIfMisconfigured(): void {
  const provider = getModelProvider();
  if (provider === "nim" && !process.env.NVIDIA_NIM_API_KEY) {
    console.warn(
      "MODEL_PROVIDER=nim (default) but NVIDIA_NIM_API_KEY is not set — AI calls will fail and every response will use the built-in fallback content. Copy .env.example to .env and add your key."
    );
  } else if (provider === "anthropic" && !process.env.ANTHROPIC_API_KEY) {
    console.warn(
      "MODEL_PROVIDER=anthropic but ANTHROPIC_API_KEY is not set — AI calls will fail and every response will use the built-in fallback content."
    );
  }
}

// The only part that differs between providers: sending a system prompt +
// conversation and getting raw text back. Prompt content, parsing, retries,
// fallbacks, and caching are provider-agnostic and live in the callers.
export async function callModel(
  system: string,
  messages: ChatMessage[],
  maxTokens = 600
): Promise<string> {
  if (getModelProvider() === "nim") {
    const response = await getNimClient().chat.completions.create({
      model: getNimModel(),
      max_tokens: maxTokens,
      messages: [{ role: "system", content: system }, ...messages],
      // deepseek-v4-flash is a hybrid reasoning model: left to itself, it
      // spends the whole token budget on chain-of-thought (returned
      // separately as reasoning_content) and leaves `content` empty, which
      // showed up as every call silently exhausting maxTokens with
      // finish_reason "length" and no usable text. This NVIDIA-specific
      // extension (not in the OpenAI SDK's types) turns that off.
      ...({ chat_template_kwargs: { thinking: false } } as Record<string, unknown>),
    });
    return response.choices[0]?.message?.content ?? "";
  }

  const response = await getAnthropicClient().messages.create({
    model: getClaudeModel(),
    max_tokens: maxTokens,
    system,
    messages,
  });
  return extractAnthropicText(response);
}
