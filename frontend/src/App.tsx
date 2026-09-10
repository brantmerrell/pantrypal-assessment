import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";

const API_URL = ["localhost", "127.0.0.1"].includes(location.hostname)
  ? "http://localhost:8000/chat/stream"
  : "https://pantrypal-api.jbm.eco/chat/stream";

const DEVICE_ID_KEY = "pantrypal_device_id";

function loadDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

const TOOL_LABELS: Record<string, string> = {
  webSearch: "Searching the web",
  checkEquipment: "Checking your equipment",
  savePreference: "Saving a preference",
  getPreferences: "Checking saved preferences",
};

function toolLabel(name: string): string {
  return TOOL_LABELS[name] ?? name;
}

function ToolChip({ name, done }: { name: string; done: boolean }) {
  return (
    <span className={`tag ${done ? "is-success" : "is-warning"} tool-chip`}>
      {done ? "✓" : "⋯"} {toolLabel(name)}
    </span>
  );
}

function Message({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  return (
    <article className={`message ${isUser ? "is-primary" : ""}`}>
      <div className="message-header">
        <p>{isUser ? "You" : "PantryPal"}</p>
      </div>
      <div className="message-body content">
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return <span key={i}>{part.text}</span>;
          }
          if (part.type === "dynamic-tool") {
            return (
              <ToolChip
                key={i}
                name={part.toolName}
                done={part.state === "output-available"}
              />
            );
          }
          if (part.type.startsWith("tool-")) {
            const name = part.type.slice("tool-".length);
            const toolState = (part as { state: string }).state;
            return (
              <ToolChip
                key={i}
                name={name}
                done={toolState === "output-available"}
              />
            );
          }
          return null;
        })}
      </div>
    </article>
  );
}

export default function App() {
  const [deviceId] = useState(loadDeviceId);
  const [input, setInput] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: API_URL,
      body: { deviceId },
    }),
  });

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, status]);

  const busy = status === "submitted" || status === "streaming";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text });
    setInput("");
  }

  return (
    <section className="section">
      <div className="container pantrypal-container">
        <h1 className="title">PantryPal</h1>
        <p className="subtitle is-6">
          Your cooking assistant — ask about recipes, substitutions, or what to make with what you've got.
        </p>

        <div className="box chat-log" ref={logRef}>
          {messages.length === 0 && (
            <div className="notification">
              Try: "What can I make with chicken thighs and rice?" or "I only have a hot plate, no oven — got a
              roast chicken idea?"
            </div>
          )}
          {messages.map((m) => (
            <Message key={m.id} message={m} />
          ))}
          {status === "submitted" && (
            <article className="message">
              <div className="message-header">
                <p>PantryPal</p>
              </div>
              <div className="message-body is-italic">thinking…</div>
            </article>
          )}
          {error && <div className="notification is-danger">Something went wrong: {error.message}</div>}
        </div>

        <form className="field has-addons" onSubmit={handleSubmit}>
          <div className="control is-expanded">
            <input
              className="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What do you want to cook?"
              autoComplete="off"
              disabled={busy}
            />
          </div>
          <div className="control">
            <button className={`button is-primary ${busy ? "is-loading" : ""}`} type="submit" disabled={busy || !input.trim()}>
              Send
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
