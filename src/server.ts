import cors from "cors";
import express from "express";
import {
  convertToModelMessages,
  createUIMessageStream,
  pipeUIMessageStreamToResponse,
  toUIMessageStream,
} from "ai";
import { runAgent, streamAgent } from "./agent.js";
import { appendAllergenNotice, ALLERGEN_NOTICE } from "./guardrails/allergen.js";
import type { ModelMessage, UIMessage } from "ai";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/chat", async (req, res) => {
  const { message, history, deviceId } = req.body as {
    message: string;
    history?: ModelMessage[];
    deviceId?: string;
  };

  if (typeof message !== "string" || message.trim() === "") {
    return res.status(400).json({ error: "message is required" });
  }

  const messages: ModelMessage[] = [
    ...(history ?? []),
    { role: "user", content: message },
  ];

  const rawReply = await runAgent(messages, deviceId ?? "anonymous");
  const reply = appendAllergenNotice(rawReply);
  res.json({ reply });
});

// Streaming counterpart of /chat, for the React frontend's useChat hook.
// Takes UI messages (not the plain-JSON shape above) and streams a UI
// message stream back, with the allergen notice appended as a final chunk.
app.post("/chat/stream", async (req, res) => {
  const { messages, deviceId } = req.body as {
    messages?: UIMessage[];
    deviceId?: string;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages is required" });
  }

  const modelMessages = await convertToModelMessages(messages);
  const result = streamAgent(modelMessages, deviceId ?? "anonymous");

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      for await (const chunk of toUIMessageStream({ stream: result.fullStream })) {
        writer.write(chunk);
      }
      const noticeId = "allergen-notice";
      writer.write({ type: "text-start", id: noticeId });
      writer.write({ type: "text-delta", id: noticeId, delta: ALLERGEN_NOTICE });
      writer.write({ type: "text-end", id: noticeId });
    },
  });

  pipeUIMessageStreamToResponse({ response: res, stream });
});

const port = Number(process.env.PORT ?? 8000);
app.listen(port, () => {
  console.log(`PantryPal backend listening on :${port}`);
});
