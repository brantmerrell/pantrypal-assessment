import { anthropic } from "@ai-sdk/anthropic";
import { generateText, stepCountIs, type ModelMessage } from "ai";
import { webSearch } from "./tools/search.js";

const SYSTEM_PROMPT =
  "You are PantryPal, a cooking assistant. Scaffold placeholder prompt — " +
  "guardrails, personality, and tool set are filled in during the core agent build.";

export async function runAgent(messages: ModelMessage[]) {
  const result = await generateText({
    model: anthropic("claude-sonnet-5"),
    system: SYSTEM_PROMPT,
    messages,
    tools: { webSearch },
    stopWhen: stepCountIs(8),
  });

  return result.text;
}
