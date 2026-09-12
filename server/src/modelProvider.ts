import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

// Which backend answers AI calls. Defaults to NVIDIA NIM (production) — set
// MODEL_PROVIDER=anthropic to route through Claude instead.
export const MODEL_PROVIDER: "nim" | "anthropic" =
  process.env.MODEL_PROVIDER === "anthropic" ? "anthropic" : "nim";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? "claude-haiku-4-5-20251001";

// Falls back to a placeholder so construction never throws when the key is
// unset (matching how the Anthropic client behaves) — an actual request
// without a real key fails naturally at call time and is caught by callers.
const nim = new OpenAI({
  apiKey: process.env.NVIDIA_NIM_API_KEY ?? "unset",
  baseURL: "https://integrate.api.nvidia.com/v1",
});
const NIM_MODEL = process.env.NVIDIA_NIM_MODEL ?? "deepseek-ai/deepseek-v4-flash-0731";

export type ChatMessage = { role: "user" | "assistant"; content: string };

function extractAnthropicText(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

export function warnIfMisconfigured(): void {
  if (MODEL_PROVIDER === "nim" && !process.env.NVIDIA_NIM_API_KEY) {
    console.warn(
      "MODEL_PROVIDER=nim (default) but NVIDIA_NIM_API_KEY is not set — AI calls will fail and every response will use the built-in fallback content. Copy .env.example to .env and add your key."
    );
  } else if (MODEL_PROVIDER === "anthropic" && !process.env.ANTHROPIC_API_KEY) {
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
  if (MODEL_PROVIDER === "nim") {
    const response = await nim.chat.completions.create({
      model: NIM_MODEL,
      max_tokens: maxTokens,
      messages: [{ role: "system", content: system }, ...messages],
    });
    return response.choices[0]?.message?.content ?? "";
  }

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    system,
    messages,
  });
  return extractAnthropicText(response);
}
