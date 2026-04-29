import { useEffect } from "react";
import { Link } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { getMostRecentVerifiedDate } from "@/services/brandFlags";
import { Shield, FileText, AlertTriangle, MessageSquare, Info, ChevronRight } from "lucide-react";

/* ─── Shared tokens (match Index.tsx) ───────────────────────────────── */
const D  = "'Bebas Neue', sans-serif";
const M  = "'JetBrains Mono', monospace";
const G  = "#00c853";
const GR = "#84898E";
const B  = "rgba(255,255,255,0.08)";
const RED = "#ff4136";
const AMB = "#ffc700";

/* ─── Data ───────────────────────────────────────────────────────────── */

const SEVERITY_TIERS = [
  {
    label: "CRITICAL",
    color: RED,
    desc: "Documented forced labour, child labour, or modern slavery — typically confirmed by a government body, court ruling, or corporate admission.",
    examples: "CBP Withhold Release Order, US federal court verdict, DOL child labour investigation fine.",
  },
  {
    label: "HIGH",
    color: "#ff6b35",
    desc: "Serious findings with credible evidence from established NGOs or investigative outlets. Not yet confirmed by a government authority, but sourced from organisations with track records of accuracy.",
    examples: "Amnesty International report, Human Rights Watch investigation, BBC Dispatches.",
  },
  {
    label: "MEDIUM",
    color: AMB,
    desc: "Ongoing concerns or unresolved supply-chain transparency gaps — typically sourced from campaign scorecards or multi-outlet investigative series.",
    examples: "Oxfam Behind the Brands scorecard, Green America Chocolate Scorecard.",
  },
];

const SOURCE_TIERS = [
  {
    tier: "TIER 1",
    color: RED,
    label: "Primary official record",
    types: "Court filing, regulatory finding, government report, corporate admission",
    examples: "US DOL TVPRA list, CBP Withhold Release Order, Nestlé v. Doe (US Supreme Court), DOL child labour investigation findings, OECD NCP complaint, Lindt corporate disclosure admitting 87 child workers",
  },
  {
    tier: "TIER 2",
    color: AMB,
    label: "Independent verified NGO report",
    types: "NGO report, academic study",
    examples: "Amnesty International, Human Rights Watch, Oxfam, Greenpeace, BHRRC, Global Labor Justice-ILRF, KnowTheChain, Walk Free, ILO",
  },
  {
    tier: "TIER 3",
    color: GR,
    label: "Investigative journalism",
    types: "Investigative journalism, news report",
    examples: "BBC, The Guardian, Washington Post, AP, Channel 4 Dispatches, NYT / Fuller Project, Swiss TV Rundschau, Reporter Brasil",
  },
];

const SOURCING_BAR = [
  { rule: "≥ 1 tier-1 source", detail: "Any single government report, court filing, regulatory finding, or corporate admission is sufficient." },
  { rule: "≥ 2 independent tier-2 sources", detail: "Two NGO reports from different organisations covering the same finding. The publishers must be independent of each other." },
  { rule: "≥ 1 tier-2 + ≥ 2 tier-3 sources", detail: "One NGO report plus at least two separate investigative journalism pieces covering the same specific allegation." },
];

const DONT_DO = [
  "Include brand flags without at least one source that meets the tier bar above.",
  "Describe findings as proven fact when only one tier-3 source exists — those entries are held in pending review and not shown.",
  "Accept allegations from anonymous or unverifiable sources.",
  "Show a flag that a brand has successfully disputed with new evidence, without updating it.",
  "Carry a flag indefinitely — if a brand demonstrates material remediation with documentation, we archive the flag.",
];

export default function Methodology() {
  const lastUpdate = getMostRecentVerifiedDate();

  // 5.4 — meta description for search-engine indexing
  useEffect(() => {
    document.title = "Methodology — Ethical Shopper";
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content =
      "How Ethical Shopper sources and verifies brand labour flags: our tier system, sourcing bar, dispute process, and database limitations.";
    return () => {
      document.title = "Ethical Shopper";
    };
  }, []);

  return (
    <div style={{ background: "#000", minHeight: "100vh", overflowX: "hidden" }}>
      <div className="scanlines" />

      <main className="pb-nav" style={{ position: "relative", zIndex: 1 }}>

        {/* ── Top bar ── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "max(52px, env(safe-area-inset-top)) 20px 14px",
          borderBottom: `1px solid ${B}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span className="terminal-cursor" style={{ width: 6, height: 6, borderRadius: "50%", background: G, display: "inline-block" }} />
            <span style={{ fontFamily: M, fontSize: "0.44rem", color: GR, letterSpacing: "0.24em", textTransform: "uppercase" }}>
              ETHICAL SCANNER / METHODOLOGY
            </span>
          </div>
          {lastUpdate && (
            <span style={{ fontFamily: M, fontSize: "0.4rem", color: "rgba(132,137,142,0.5)", letterSpacing: "0.1em" }}>
              DB: {lastUpdate.slice(0, 10)}
            </span>
          )}
        </div>

        {/* ── Page heading ── */}
        <div style={{ padding: "28px 20px 20px", borderBottom: `1px solid ${B}` }}>
          <p style={{ fontFamily: M, fontSize: "0.48rem", color: G, letterSpacing: "0.26em", textTransform: "uppercase", marginBottom: 12, opacity: 0.85 }}>
            // HOW WE WORK
          </p>
          <h1 style={{ fontFamily: D, fontWeight: 400, fontSize: "clamp(2.4rem, 11vw, 3.6rem)", color: "#fff", letterSpacing: "0.02em", lineHeight: 0.92, marginBottom: 14 }}>
            OUR<br />
            <span style={{ color: G }}>METHODOLOGY</span>
          </h1>
          <p style={{ fontFamily: M, fontSize: "0.7rem", color: GR, lineHeight: 1.75, letterSpacing: "0.02em", maxWidth: 480 }}>
            Every brand flag on this app is derived from independently verifiable sources. This page explains our sourcing rules, what evidence counts, and what we won't do.
          </p>
        </div>

        {/* ═══ 1. HOW WE SCORE BRANDS ═══════════════════════════════════ */}
        <div style={{ padding: "24px 20px", borderBottom: `1px solid ${B}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Shield style={{ width: 13, height: 13, color: G, flexShrink: 0 }} strokeWidth={1.5} />
            <p style={{ fontFamily: M, fontSize: "0.48rem", color: GR, letterSpacing: "0.24em", textTransform: "uppercase" }}>
              // 01 — HOW WE SCORE BRANDS
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {SEVERITY_TIERS.map((tier, i) => (
              <div key={tier.label} style={{ borderLeft: `3px solid ${tier.color}`, background: "rgba(255,255,255,0.02)", padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: M, fontSize: "0.44rem", color: "rgba(132,137,142,0.4)", letterSpacing: "0.1em" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ fontFamily: D, fontSize: "1.1rem", color: tier.color, letterSpacing: "0.08em" }}>
                    {tier.label}
                  </span>
                </div>
                <p style={{ fontFamily: M, fontSize: "0.62rem", color: "#ccc", lineHeight: 1.7, marginBottom: 6 }}>
                  {tier.desc}
                </p>
                <p style={{ fontFamily: M, fontSize: "0.52rem", color: "rgba(132,137,142,0.6)", lineHeight: 1.5, fontStyle: "italic" }}>
                  e.g. {tier.examples}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ 2. SOURCE TIERS ═══════════════════════════════════════════ */}
        <div style={{ padding: "24px 20px", borderBottom: `1px solid ${B}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <FileText style={{ width: 13, height: 13, color: G, flexShrink: 0 }} strokeWidth={1.5} />
            <p style={{ fontFamily: M, fontSize: "0.48rem", color: GR, letterSpacing: "0.24em", textTransform: "uppercase" }}>
              // 02 — SOURCE TIERS
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {SOURCE_TIERS.map((s) => (
              <div key={s.tier} style={{ border: `1px solid rgba(255,255,255,0.06)`, padding: "14px 16px", position: "relative", overflow: "hidden" }}>
                <div className="diagonal-stripe" style={{ position: "absolute", inset: 0, opacity: 0.3 }} />
                <div style={{ position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontFamily: D, fontSize: "1rem", color: s.color, letterSpacing: "0.1em", flexShrink: 0 }}>{s.tier}</span>
                    <span style={{ fontFamily: M, fontSize: "0.56rem", color: "#fff", letterSpacing: "0.04em" }}>{s.label}</span>
                  </div>
                  <p style={{ fontFamily: M, fontSize: "0.52rem", color: GR, letterSpacing: "0.04em", marginBottom: 4 }}>
                    Types: <span style={{ color: "#ccc" }}>{s.types}</span>
                  </p>
                  <p style={{ fontFamily: M, fontSize: "0.5rem", color: "rgba(132,137,142,0.6)", lineHeight: 1.55 }}>
                    {s.examples}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ 3. THE SOURCING BAR ═══════════════════════════════════════ */}
        <div style={{ padding: "24px 20px", borderBottom: `1px solid ${B}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <AlertTriangle style={{ width: 13, height: 13, color: AMB, flexShrink: 0 }} strokeWidth={1.5} />
            <p style={{ fontFamily: M, fontSize: "0.48rem", color: GR, letterSpacing: "0.24em", textTransform: "uppercase" }}>
              // 03 — THE SOURCING BAR
            </p>
          </div>

          <p style={{ fontFamily: M, fontSize: "0.64rem", color: "#ccc", lineHeight: 1.7, marginBottom: 16 }}>
            A flag is only shown in production if it meets <span style={{ color: G }}>at least one</span> of these criteria:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {SOURCING_BAR.map((rule, i) => (
              <div key={i} style={{ display: "flex", gap: 0, borderLeft: `3px solid ${G}`, background: "rgba(0,200,83,0.03)", padding: "13px 0" }}>
                <span style={{ fontFamily: M, fontSize: "0.46rem", color: "rgba(132,137,142,0.35)", letterSpacing: "0.1em", minWidth: "2.8rem", paddingLeft: 12, flexShrink: 0 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div style={{ paddingRight: 16 }}>
                  <p style={{ fontFamily: D, fontSize: "1.1rem", color: G, letterSpacing: "0.04em", lineHeight: 1, marginBottom: 5 }}>
                    {rule.rule}
                  </p>
                  <p style={{ fontFamily: M, fontSize: "0.56rem", color: GR, lineHeight: 1.6 }}>
                    {rule.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, padding: "12px 14px", border: `1px solid rgba(255,199,0,0.2)`, background: "rgba(255,199,0,0.04)" }}>
            <p style={{ fontFamily: M, fontSize: "0.56rem", color: AMB, lineHeight: 1.6 }}>
              A flag with only tier-3 sources is held in <span style={{ color: "#fff" }}>pending_review</span> and not shown to users until additional sourcing is confirmed.
            </p>
          </div>
        </div>

        {/* ═══ 4. WHAT WE DON'T DO ══════════════════════════════════════ */}
        <div style={{ padding: "24px 20px", borderBottom: `1px solid ${B}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <Info style={{ width: 13, height: 13, color: G, flexShrink: 0 }} strokeWidth={1.5} />
            <p style={{ fontFamily: M, fontSize: "0.48rem", color: GR, letterSpacing: "0.24em", textTransform: "uppercase" }}>
              // 04 — WHAT WE DON'T DO
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {DONT_DO.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                <span style={{ fontFamily: M, fontSize: "0.44rem", color: RED, letterSpacing: "0.1em", flexShrink: 0, marginTop: 2 }}>✕</span>
                <p style={{ fontFamily: M, fontSize: "0.6rem", color: GR, lineHeight: 1.65 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ 5. DISPUTES & CORRECTIONS ═══════════════════════════════ */}
        <div style={{ padding: "24px 20px", borderBottom: `1px solid ${B}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <MessageSquare style={{ width: 13, height: 13, color: G, flexShrink: 0 }} strokeWidth={1.5} />
            <p style={{ fontFamily: M, fontSize: "0.48rem", color: GR, letterSpacing: "0.24em", textTransform: "uppercase" }}>
              // 05 — DISPUTES &amp; CORRECTIONS
            </p>
          </div>

          <p style={{ fontFamily: M, fontSize: "0.64rem", color: "#ccc", lineHeight: 1.75, marginBottom: 16 }}>
            Brands, researchers, or users can report incorrect flags, outdated sources, or missing context using the report button on any brand flag. We commit to a <span style={{ color: G }}>14-day review</span> for all submissions.
          </p>

          <p style={{ fontFamily: M, fontSize: "0.6rem", color: GR, lineHeight: 1.7, marginBottom: 16 }}>
            If a brand provides new evidence that a flag is factually incorrect or that meaningful remediation has occurred, the flag will be updated or archived accordingly. Brands may not request removal based solely on disagreement — evidence is required.
          </p>

          <Link to="/admin/disputes" style={{ textDecoration: "none", display: "flex" }}>
            <div style={{ border: `1px solid rgba(0,200,83,0.3)`, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flex: 1, background: "rgba(0,200,83,0.04)" }}>
              <div>
                <p style={{ fontFamily: M, fontSize: "0.44rem", color: G, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 3 }}>ADMIN</p>
                <p style={{ fontFamily: D, fontSize: "1.1rem", color: "#fff", letterSpacing: "0.04em" }}>VIEW DISPUTE QUEUE</p>
              </div>
              <ChevronRight style={{ width: 16, height: 16, color: GR }} />
            </div>
          </Link>
        </div>

        {/* ═══ 6. LAST DATABASE UPDATE ══════════════════════════════════ */}
        <div style={{ padding: "24px 20px", borderBottom: `1px solid ${B}` }}>
          <p style={{ fontFamily: M, fontSize: "0.48rem", color: GR, letterSpacing: "0.24em", textTransform: "uppercase", marginBottom: 14 }}>
            // 06 — DATABASE STATUS
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <div style={{ border: `1px solid rgba(255,255,255,0.06)`, padding: "16px 14px" }}>
              <p style={{ fontFamily: M, fontSize: "0.44rem", color: GR, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>LAST VERIFIED</p>
              <p style={{ fontFamily: D, fontSize: "1.4rem", color: G, letterSpacing: "0.04em", lineHeight: 1 }}>
                {lastUpdate ? lastUpdate.slice(0, 10) : "—"}
              </p>
            </div>
            <div style={{ border: `1px solid rgba(255,255,255,0.06)`, padding: "16px 14px" }}>
              <p style={{ fontFamily: M, fontSize: "0.44rem", color: GR, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>RESPONSE SLA</p>
              <p style={{ fontFamily: D, fontSize: "1.4rem", color: AMB, letterSpacing: "0.04em", lineHeight: 1 }}>14 DAYS</p>
            </div>
          </div>
        </div>

        {/* ═══ 7. LIMITATIONS ═══════════════════════════════════════════ */}
        <div style={{ padding: "24px 20px 32px" }}>
          <p style={{ fontFamily: M, fontSize: "0.48rem", color: GR, letterSpacing: "0.24em", textTransform: "uppercase", marginBottom: 14 }}>
            // 07 — LIMITATIONS
          </p>

          <div style={{ border: `1px solid rgba(255,199,0,0.15)`, padding: "16px", background: "rgba(255,199,0,0.03)", marginBottom: 14 }}>
            <p style={{ fontFamily: M, fontSize: "0.6rem", color: AMB, lineHeight: 1.7, marginBottom: 8 }}>
              Be aware of what this database is and isn't:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                "We currently flag ~50 brands. Major multinationals are prioritised; smaller or regional brands are under-represented.",
                "We focus on consumer food and grocery goods. Fashion, electronics, and household goods are largely out of scope.",
                "Geographic coverage skews toward supply chains that have received English-language investigative coverage. Issues in less-reported regions may be missing.",
                "A brand not appearing in our database does not mean it has no issues — it may simply not have been researched yet.",
                "This is not legal advice. Flags describe documented findings, not legal verdicts (unless the source is a court ruling).",
              ].map((l, i) => (
                <div key={i} style={{ display: "flex", gap: 10 }}>
                  <span style={{ fontFamily: M, fontSize: "0.44rem", color: AMB, flexShrink: 0, marginTop: 2 }}>▸</span>
                  <p style={{ fontFamily: M, fontSize: "0.58rem", color: GR, lineHeight: 1.65 }}>{l}</p>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontFamily: M, fontSize: "0.52rem", color: "rgba(132,137,142,0.4)", letterSpacing: "0.08em", textAlign: "center" }}>
            METHODOLOGY v1 — 2026
          </p>
        </div>

      </main>

      <BottomNav />
    </div>
  );
}
