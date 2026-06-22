import { useEffect, useMemo, useState } from "react";
import { Search, ExternalLink, X } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { DS } from "@/styles/design-tokens";
import {
  CHOCOLATE_DIRECTORY,
  PARENT_INDEX,
  SOURCES,
  VERDICT_META,
  TIER_META,
  IMPORTANT_NUANCE,
  BOTTOM_LINE,
  DIRECTORY_INTRO,
  DIRECTORY_PREPARED,
  DIRECTORY_STATS,
  type ChocolateEntry,
  type ChocolateVerdict,
  type ChocolateTier,
} from "@/data/chocolateDirectory";

// Verdict → theme-aware colors. Leader is the only filled badge so the
// "buy these" tier reads with visual primacy; the rest are soft-tinted.
const verdictStyle = (v: ChocolateVerdict): { color: string; bg: string; solid: boolean } => {
  switch (v) {
    case "leader":
      return { color: DS.card, bg: DS.good, solid: true };
    case "better":
      return { color: DS.good, bg: DS.goodBg, solid: false };
    case "caution":
      return { color: DS.warn, bg: DS.warnBg, solid: false };
    case "avoid":
      return { color: DS.bad, bg: DS.badBg, solid: false };
  }
};

function VerdictBadge({ verdict }: { verdict: ChocolateVerdict }) {
  const s = verdictStyle(verdict);
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center",
        fontSize: 10.5, fontWeight: 800, letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: s.color, background: s.bg,
        border: s.solid ? "none" : `1px solid ${s.color}`,
        borderRadius: 999, padding: "3px 9px", flexShrink: 0, lineHeight: 1.4,
        whiteSpace: "nowrap",
      }}
    >
      {VERDICT_META[verdict].label}
    </span>
  );
}

function EntryCard({ entry }: { entry: ChocolateEntry }) {
  return (
    <div style={{
      background: DS.card, borderRadius: 14, padding: "14px 15px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: DS.ink, lineHeight: 1.25, letterSpacing: "-0.01em" }}>
            {entry.name}
          </p>
          <p style={{ fontSize: 12, color: DS.muted, marginTop: 2, lineHeight: 1.35 }}>{entry.owner}</p>
        </div>
        <VerdictBadge verdict={entry.verdict} />
      </div>

      <div style={{
        display: "flex", gap: 6, alignItems: "baseline",
        fontSize: 12, color: DS.muted, lineHeight: 1.45, marginBottom: 8,
      }}>
        <span style={{ fontWeight: 700, color: DS.ink2, flexShrink: 0 }}>Sourcing</span>
        <span>{entry.sourcing}</span>
      </div>

      <p style={{ fontSize: 12.5, color: DS.ink, opacity: 0.82, lineHeight: 1.5 }}>{entry.note}</p>
    </div>
  );
}

const VERDICT_FILTERS: { key: "all" | ChocolateVerdict; label: string }[] = [
  { key: "all", label: "All" },
  { key: "leader", label: "Leader" },
  { key: "better", label: "Better" },
  { key: "caution", label: "Caution" },
  { key: "avoid", label: "Avoid" },
];

const TIER_ORDER: ChocolateTier[] = ["leader", "manufacturer", "trader", "retailer"];

export default function ChocolateDirectory() {
  const [query, setQuery] = useState("");
  const [verdictFilter, setVerdictFilter] = useState<"all" | ChocolateVerdict>("all");

  useEffect(() => {
    document.title = "Chocolate Directory — GoodScan";
    return () => { document.title = "GoodScan"; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CHOCOLATE_DIRECTORY.filter((e) => {
      if (verdictFilter !== "all" && e.verdict !== verdictFilter) return false;
      if (!q) return true;
      const hay = `${e.name} ${e.owner} ${e.sourcing} ${e.note} ${(e.aliases ?? []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, verdictFilter]);

  const sections = useMemo(
    () => TIER_ORDER.map((tier) => ({ tier, entries: filtered.filter((e) => e.tier === tier) })).filter((s) => s.entries.length > 0),
    [filtered],
  );

  return (
    <div style={{ minHeight: "100dvh", background: DS.bg, fontFamily: DS.font, color: DS.ink }}>
      <main style={{
        maxWidth: 640, margin: "0 auto", width: "100%",
        padding: `max(56px, calc(env(safe-area-inset-top, 0px) + 16px)) 16px calc(env(safe-area-inset-bottom, 0px) + 130px)`,
      }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "0 4px", marginBottom: 16 }}>
          <BackButton />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 11, fontWeight: 800, color: DS.muted,
              letterSpacing: "0.08em", textTransform: "uppercase", margin: "2px 0 4px",
            }}>
              Ethics scan
            </p>
            <h1 style={{ fontSize: "1.7rem", fontWeight: 800, color: DS.ink, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 8px" }}>
              The Chocolate Directory
            </h1>
            <p style={{ fontSize: 13, color: DS.muted, lineHeight: 1.55 }}>{DIRECTORY_INTRO}</p>
            <p style={{ fontSize: 11.5, color: DS.muted, marginTop: 8, fontStyle: "italic" }}>{DIRECTORY_PREPARED}</p>
          </div>
        </div>

        {/* Stat strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
          {[
            { label: "Leaders", value: DIRECTORY_STATS.leaders, color: DS.good },
            { label: "Better", value: DIRECTORY_STATS.better, color: DS.good },
            { label: "Caution", value: DIRECTORY_STATS.caution, color: DS.warn },
            { label: "Avoid", value: DIRECTORY_STATS.avoid, color: DS.bad },
          ].map((s) => (
            <div key={s.label} style={{ background: DS.card, borderRadius: 12, padding: "12px 8px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.04)" }}>
              <p style={{ fontSize: "1.25rem", fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.value}</p>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: DS.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* How to read the verdicts */}
        <div style={{ background: DS.card, borderRadius: 16, padding: "16px", marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)" }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: DS.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
            How to read the verdicts
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(["leader", "better", "caution", "avoid"] as ChocolateVerdict[]).map((v) => (
              <div key={v} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 64, flexShrink: 0 }}><VerdictBadge verdict={v} /></div>
                <p style={{ fontSize: 12, color: DS.muted, lineHeight: 1.5 }}>{VERDICT_META[v].blurb}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${DS.hair}` }}>
            <p style={{ fontSize: 11.5, color: DS.muted, lineHeight: 1.55 }}>
              <span style={{ fontWeight: 700, color: DS.ink }}>Important nuance. </span>{IMPORTANT_NUANCE}
            </p>
          </div>
        </div>

        {/* Search + verdict filters */}
        <div style={{ position: "relative", marginBottom: 10 }}>
          <Search style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: DS.muted }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a brand (Kit Kat, Cadbury, Tony's…)"
            style={{
              width: "100%", height: 44, paddingLeft: 38, paddingRight: query ? 38 : 14,
              borderRadius: 12, border: `1px solid ${DS.hair}`, background: DS.card,
              color: DS.ink, fontSize: 14, fontFamily: DS.font, outline: "none",
            }}
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
              <X style={{ width: 16, height: 16, color: DS.muted }} />
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 7, marginBottom: 18, flexWrap: "wrap" }}>
          {VERDICT_FILTERS.map((f) => {
            const active = verdictFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setVerdictFilter(f.key)}
                style={{
                  border: `1px solid ${active ? DS.ink : DS.hair}`,
                  background: active ? DS.ink : DS.card,
                  color: active ? DS.card : DS.muted,
                  borderRadius: 999, padding: "6px 13px",
                  fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: DS.font,
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Sections */}
        {sections.length === 0 ? (
          <p style={{ textAlign: "center", color: DS.muted, fontSize: 13, padding: "40px 0" }}>
            No brands match “{query}”.
          </p>
        ) : (
          sections.map(({ tier, entries }) => (
            <section key={tier} style={{ marginBottom: 26 }}>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: DS.ink, letterSpacing: "-0.02em", margin: "0 0 4px" }}>
                {TIER_META[tier].title}
              </h2>
              <p style={{ fontSize: 12, color: DS.muted, lineHeight: 1.5, margin: "0 0 12px" }}>{TIER_META[tier].blurb}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {entries.map((e) => <EntryCard key={e.id} entry={e} />)}
              </div>
            </section>
          ))
        )}

        {/* Parent-company index */}
        <section style={{ marginBottom: 26 }}>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: DS.ink, letterSpacing: "-0.02em", margin: "0 0 4px" }}>
            Quick parent-company index
          </h2>
          <p style={{ fontSize: 12, color: DS.muted, lineHeight: 1.5, margin: "0 0 12px" }}>
            Trace any product back to the company behind it.
          </p>
          <div style={{ background: DS.card, borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)" }}>
            {PARENT_INDEX.map((row, i) => (
              <div key={row.parent} style={{ display: "flex", gap: 12, padding: "12px 15px", borderTop: i ? `1px solid ${DS.hair}` : "none" }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: DS.ink, flex: "0 0 92px" }}>{row.parent}</span>
                <span style={{ fontSize: 12.5, color: DS.muted, lineHeight: 1.5 }}>{row.brands.join(", ")}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom line */}
        <div style={{ background: DS.goodBg, border: `1px solid ${DS.good}`, borderRadius: 16, padding: "16px", marginBottom: 22 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: DS.good, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
            Bottom line
          </p>
          <p style={{ fontSize: 13, color: DS.ink, lineHeight: 1.6 }}>{BOTTOM_LINE}</p>
        </div>

        {/* Sources */}
        <section>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: DS.ink, letterSpacing: "-0.02em", margin: "0 0 12px" }}>Sources</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {SOURCES.map((s, i) => {
              const inner = (
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ color: DS.muted, fontSize: 12, flexShrink: 0, lineHeight: 1.55 }}>•</span>
                  <span style={{ fontSize: 12, color: s.url ? DS.ink : DS.muted, lineHeight: 1.55 }}>
                    {s.label}
                    {s.url && <ExternalLink style={{ width: 11, height: 11, color: DS.muted, marginLeft: 5, display: "inline", verticalAlign: "middle" }} />}
                  </span>
                </div>
              );
              return s.url
                ? <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>{inner}</a>
                : <div key={i}>{inner}</div>;
            })}
          </div>
        </section>

        <p style={{ fontSize: 11, color: DS.muted, textAlign: "center", marginTop: 22, lineHeight: 1.5 }}>
          Verdicts blend third-party scorecard performance with the sourcing model and the public accusation record. They are a consumer-guidance synthesis, not a legal finding.
        </p>

      </main>
    </div>
  );
}
