import cors from "cors";
import express from "express";
import { runAgent } from "./agent.js";
import { appendAllergenNotice } from "./guardrails/allergen.js";
import type { ModelMessage } from "ai";

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

const port = Number(process.env.PORT ?? 8000);
app.listen(port, () => {
  console.log(`PantryPal backend listening on :${port}`);
});
