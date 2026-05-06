import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { getBackendUrl } from "@/config/backend";

const BLUE = "#2979FF";
const TEXT = "#111827";
const TEXT_MUTED = "#6B7280";
const BORDER = "#E5E7EB";
const CARD = "#FFFFFF";

type Msg = { role: "user" | "bot"; content: string };

const STARTER: Msg = {
  role: "bot",
  content: "Hi! I'm the GoodScan assistant. Ask me anything about how the app works, our methodology, or our data sources.",
};

export function AboutChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([STARTER]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/chat/aboutus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const reply = data?.reply || data?.error || "Sorry, something went wrong.";
      setMessages((m) => [...m, { role: "bot", content: reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: "bot", content: "Network error — please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open About chatbot"
          style={{
            position: "fixed",
            right: 18,
            bottom: 90,
            width: 56,
            height: 56,
            borderRadius: 28,
            background: BLUE,
            color: "#fff",
            border: "none",
            boxShadow: "0 6px 20px rgba(41,121,255,0.35)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <MessageCircle style={{ width: 24, height: 24 }} />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          role="dialog"
          aria-label="About chatbot"
          style={{
            position: "fixed",
            right: 16,
            bottom: 86,
            width: "min(360px, calc(100vw - 32px))",
            height: "min(520px, calc(100vh - 140px))",
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            boxShadow: "0 10px 40px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "column",
            zIndex: 1000,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "12px 14px",
              borderBottom: `1px solid ${BORDER}`,
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#F9FAFB",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: `${BLUE}14`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MessageCircle style={{ width: 16, height: 16, color: BLUE }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "0.85rem", fontWeight: 700, color: TEXT, lineHeight: 1.2 }}>
                Ask GoodScan
              </p>
              <p style={{ fontSize: "0.7rem", color: TEXT_MUTED, lineHeight: 1.2 }}>
                About the app & methodology
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 6,
                borderRadius: 8,
                color: TEXT_MUTED,
              }}
            >
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  padding: "10px 12px",
                  borderRadius: 14,
                  background: m.role === "user" ? BLUE : "#F3F4F6",
                  color: m.role === "user" ? "#fff" : TEXT,
                  fontSize: "0.82rem",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div
                style={{
                  alignSelf: "flex-start",
                  padding: "10px 12px",
                  borderRadius: 14,
                  background: "#F3F4F6",
                  color: TEXT_MUTED,
                  fontSize: "0.82rem",
                  fontStyle: "italic",
                }}
              >
                Thinking…
              </div>
            )}
          </div>

          {/* Input */}
          <div
            style={{
              borderTop: `1px solid ${BORDER}`,
              padding: 10,
              display: "flex",
              gap: 8,
              background: "#fff",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask a question…"
              disabled={loading}
              style={{
                flex: 1,
                border: `1px solid ${BORDER}`,
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: "0.85rem",
                outline: "none",
                color: TEXT,
                background: "#F9FAFB",
              }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              aria-label="Send"
              style={{
                background: BLUE,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "0 14px",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                opacity: loading || !input.trim() ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Send style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
