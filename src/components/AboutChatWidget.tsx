import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { getBackendUrl } from "@/config/backend";

import { DS } from "@/styles/design-tokens";
const BLUE = DS.ink;
const BG   = DS.bg;
const TEXT = DS.ink;
const TEXT_MUTED = DS.muted;
const BORDER = DS.hair;
const CARD = DS.card;

type Msg = { role: "user" | "bot"; content: string };

const STARTER: Msg = {
  role: "bot",
  content: "Hi! I'm the GoodScan assistant. Ask me anything about how the app works, our methodology, or our data sources.",
};

export function AboutChatWidget() {
  const navigate = useNavigate();
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

  const SECRET_KEYWORD = "GPTGPT";

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);

    // Secret passphrase — respond locally, no API call
    if (text.toUpperCase() === SECRET_KEYWORD) {
      setMessages((m) => [
        ...m,
        { role: "bot", content: "ACCESS_GRANTED::You've unlocked the AI Product Analyst. Tap the link below to try it.\n\n→ /chatgpt" },
      ]);
      return;
    }

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
            color: CARD,
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
            inset: 0,
            width: "100%",
            height: "100dvh",
            background: CARD,
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
              paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
              borderBottom: `1px solid ${BORDER}`,
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: BG,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: DS.hair,
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
            {messages.map((m, i) => {
              const isSecret = m.role === "bot" && m.content.startsWith("ACCESS_GRANTED::");
              if (isSecret) {
                return (
                  <div
                    key={i}
                    style={{
                      alignSelf: "flex-start",
                      maxWidth: "85%",
                      padding: "14px 14px",
                      borderRadius: 14,
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      color: "#fff",
                      fontSize: "0.82rem",
                      lineHeight: 1.5,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <Sparkles style={{ width: 14, height: 14 }} />
                      <span style={{ fontWeight: 700 }}>Access Granted</span>
                    </div>
                    <p style={{ margin: "0 0 10px" }}>You've unlocked the AI Product Analyst.</p>
                    <button
                      onClick={() => { setOpen(false); navigate("/chatgpt"); }}
                      style={{
                        background: "rgba(255,255,255,0.2)",
                        border: "1px solid rgba(255,255,255,0.3)",
                        borderRadius: 10,
                        padding: "8px 14px",
                        color: "#fff",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        width: "100%",
                        fontFamily: DS.font,
                      }}
                    >
                      Open AI Analyst →
                    </button>
                  </div>
                );
              }
              return (
                <div
                  key={i}
                  style={{
                    alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                    padding: "10px 12px",
                    borderRadius: 14,
                    background: m.role === "user" ? BLUE : BG,
                    color: m.role === "user" ? CARD : TEXT,
                    fontSize: "0.82rem",
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {m.content}
                </div>
              );
            })}
            {loading && (
              <div
                style={{
                  alignSelf: "flex-start",
                  padding: "10px 12px",
                  borderRadius: 14,
                  background: BG,
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
              padding: "10px 10px calc(env(safe-area-inset-bottom, 0px) + 10px)",
              display: "flex",
              gap: 8,
              background: CARD,
              flexShrink: 0,
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
                background: BG,
              }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              aria-label="Send"
              style={{
                background: BLUE,
                color: CARD,
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
