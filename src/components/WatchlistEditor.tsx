import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { DS } from "@/styles/design-tokens";
import {
  loadWatchlistEntries, addToWatchlist, setBrandSentiment, removeFromWatchlist,
  WATCHLIST_EVENT, type WatchEntry, type BrandSentiment,
} from "@/utils/watchlist";

const SENTIMENTS: { value: BrandSentiment; label: string; color: string }[] = [
  { value: "avoid", label: "Avoid", color: DS.bad },
  { value: "trust", label: "Trust", color: DS.good },
];

/**
 * Lets the user keep a personal list of brands they avoid or trust. The stance
 * directly moves a product's score when that brand shows up in a scan (see
 * personalizedScore / getVerdict) — so it lives right alongside the priorities.
 */
export function WatchlistEditor() {
  const [entries, setEntries] = useState<WatchEntry[]>(() => loadWatchlistEntries());
  const [input, setInput] = useState("");

  useEffect(() => {
    const refresh = () => setEntries(loadWatchlistEntries());
    window.addEventListener(WATCHLIST_EVENT, refresh);
    return () => window.removeEventListener(WATCHLIST_EVENT, refresh);
  }, []);

  const add = () => {
    const name = input.trim();
    if (!name) return;
    addToWatchlist(name, "avoid");
    setInput("");
  };

  return (
    <div style={{
      background: DS.card, borderRadius: 18, padding: 16,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
    }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: DS.ink, marginBottom: 2 }}>
        Brands you're watching
      </div>
      <div style={{ fontSize: 11.5, color: DS.muted, marginBottom: 14, lineHeight: 1.5 }}>
        Mark a brand <b style={{ color: DS.bad }}>Avoid</b> and it pulls a product's score down when it
        shows up. Mark it <b style={{ color: DS.good }}>Trust</b> and it lifts the score.
      </div>

      {/* Add a brand */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") add(); }}
          placeholder="Add a brand…"
          style={{
            flex: 1, height: 42, padding: "0 14px", borderRadius: 11,
            border: `1px solid ${DS.hair}`, background: DS.bg, color: DS.ink,
            fontSize: 14, fontFamily: DS.font, outline: "none",
          }}
        />
        <button
          onClick={add}
          aria-label="Add brand"
          style={{
            width: 42, height: 42, borderRadius: 11, border: "none",
            background: DS.ink, color: DS.card, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* The list */}
      {entries.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
          {entries.map((entry) => (
            <div
              key={entry.brand.toLowerCase()}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 8px 8px 12px", borderRadius: 12,
                background: DS.bg, border: `1px solid ${DS.hair}`,
              }}
            >
              <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: DS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {entry.brand}
              </span>

              {/* Avoid / Trust toggle */}
              <div style={{ display: "flex", gap: 3, padding: 3, background: DS.card, borderRadius: 9, border: `1px solid ${DS.hair}` }}>
                {SENTIMENTS.map((s) => {
                  const active = entry.sentiment === s.value;
                  return (
                    <button
                      key={s.value}
                      onClick={() => setBrandSentiment(entry.brand, s.value)}
                      aria-pressed={active}
                      style={{
                        padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer",
                        background: active ? s.color : "transparent",
                        color: active ? "#fff" : DS.muted,
                        fontSize: 11.5, fontWeight: active ? 800 : 600, fontFamily: DS.font,
                        transition: "background 0.15s, color 0.15s",
                      }}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => removeFromWatchlist(entry.brand)}
                aria-label={`Remove ${entry.brand}`}
                style={{
                  width: 30, height: 30, borderRadius: 8, border: "none",
                  background: "transparent", color: DS.muted, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default WatchlistEditor;
