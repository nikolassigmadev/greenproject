import { useEffect } from "react";
import { getMostRecentVerifiedDate } from "@/services/brandFlags";
import { getVerifiedFlags } from "@/data/brandFlags.v2";
import {
  Shield, FileText, AlertTriangle, Info,
  Scale, Database, ExternalLink, GitBranch, Sparkles, Store,
} from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { DS } from "@/styles/design-tokens";

const RED = DS.bad;
const AMBER = DS.warn;
const ORANGE = "#EA580C";
const GREEN = DS.good;
const ACCENT = DS.ink;

export default function Methodology() {
  const lastUpdate = getMostRecentVerifiedDate();
  const verified = getVerifiedFlags();
  const totalVerified = verified.length;
  // Counted from the data, not written down — a hardcoded split would be wrong
  // the first time a flag is reclassified, on the page that exists to be exact.
  const directCount = verified.filter((f) => f.claimType === "direct").length;
  const inferenceCount = verified.filter((f) => f.claimType === "supply_chain_inference").length;
  // How far the commodity-level sources (the DOL TVPRA listings) actually reach.
  // Derived rather than written down: the first draft of this paragraph asserted
  // "four flags", which was wrong by an order of magnitude, on the one page whose
  // entire purpose is being checkable.
  const withCommodity = verified.filter((f) => f.sources.some((s) => s.commodityLevel));
  const commodityCited = withCommodity.length;
  const commodityOnlyInference = withCommodity.filter(
    (f) => f.claimType === "supply_chain_inference",
  ).length;

  useEffect(() => {
    document.title = "Methodology — GoodScan";
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content =
      "How GoodScan sources and verifies brand labour flags: our tier system, sourcing bar, and database limitations.";
    return () => { document.title = "GoodScan"; };
  }, []);

  // Scroll to #sourcing-bar (etc.) when arriving from the footer.
  //
  // The browser only honours a hash on a full page load. This page is
  // lazy-loaded and reached by client-side navigation, so without this the
  // link lands at the top and the deep link silently does nothing — the kind
  // of failure that looks like it works until someone actually taps it.
  //
  // rAF waits for the lazy chunk's first paint; the element does not exist yet
  // on the tick this effect runs.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const raf = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // `id` is optional so sections can be deep-linked from elsewhere in the app —
  // the footer points straight at #sourcing-bar. scrollMarginTop keeps the
  // heading clear of the fixed header when the browser jumps to it; without it
  // the anchor lands with the title hidden underneath.
  const Section = ({ icon: Icon, iconColor, number, title, id, children }: {
    icon: React.ElementType; iconColor: string; number: string; title: string;
    id?: string; children: React.ReactNode;
  }) => (
    <div id={id} style={{ background: DS.card, borderRadius: 18, padding: "20px", marginBottom: 14, scrollMarginTop: 80 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: DS.hair, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon style={{ width: 16, height: 16, color: iconColor }} />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: DS.muted, letterSpacing: 0.5, lineHeight: 1, textTransform: "uppercase" }}>{number}</p>
          <p style={{ fontSize: "1rem", fontWeight: 700, color: DS.ink, lineHeight: 1.3 }}>{title}</p>
        </div>
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ minHeight: "100dvh", background: DS.bg, fontFamily: DS.font, color: DS.ink, display: "flex", flexDirection: "column" }}>
      <main style={{ flex: 1, maxWidth: 640, margin: "0 auto", width: "100%", padding: `max(60px, calc(env(safe-area-inset-top, 0px) + 16px)) 20px calc(env(safe-area-inset-bottom, 0px) + 160px)` }}>

        {/* Back — returns to wherever the user came from (About, a product flag, etc.) */}
        <div style={{ marginBottom: 16 }}>
          <BackButton />
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: DS.hair, display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
          }}>
            <Scale style={{ width: 28, height: 28, color: DS.ink }} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, color: DS.ink, marginBottom: 6 }}>Our Methodology</h1>
          <p style={{ fontSize: "0.85rem", color: DS.muted, lineHeight: 1.6, maxWidth: 380, margin: "0 auto" }}>
            Every brand flag is backed by independently verifiable sources. Here's how we research, verify, and maintain our data.
          </p>
        </div>

        {/* Stats strip */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14,
        }}>
          {[
            { label: "Verified Flags", value: String(totalVerified), color: GREEN },
            { label: "Last Updated", value: lastUpdate ? lastUpdate.slice(5, 10).replace("-", "/") : "—", color: ACCENT },
            { label: "Source Tiers", value: "3", color: AMBER },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: DS.card, borderRadius: DS.radius.md, padding: "14px 12px", textAlign: "center",
            }}>
              <p style={{ fontSize: "1.2rem", fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>{value}</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: DS.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* 01 — Severity Levels */}
        <Section icon={Shield} iconColor={RED} number="01" title="Severity Levels">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              {
                label: "Critical", color: RED, bg: DS.badBg,
                desc: "Documented forced labour, child labour, or modern slavery confirmed by a government body, court ruling, or corporate admission.",
                examples: "CBP Withhold Release Order, US federal court verdict, DOL child labour investigation",
              },
              {
                label: "High", color: ORANGE, bg: DS.warnBg,
                desc: "Serious findings with credible evidence from established NGOs or investigative outlets. Not yet confirmed by a government authority.",
                examples: "Amnesty International report, Human Rights Watch investigation, BBC Dispatches",
              },
              {
                label: "Medium", color: AMBER, bg: DS.warnBg,
                desc: "Ongoing concerns or unresolved supply-chain transparency gaps from campaign scorecards or multi-outlet investigations.",
                examples: "Oxfam Behind the Brands scorecard, Green America Chocolate Scorecard",
              },
            ].map((tier) => (
              <div key={tier.label} style={{
                borderRadius: 12, background: tier.bg, padding: "14px 16px",
                borderLeft: `4px solid ${tier.color}`,
              }}>
                <p style={{ fontSize: "0.8rem", fontWeight: 700, color: tier.color, marginBottom: 4 }}>{tier.label}</p>
                <p style={{ fontSize: "0.8rem", color: DS.ink, lineHeight: 1.6, marginBottom: 6 }}>{tier.desc}</p>
                <p style={{ fontSize: "0.72rem", color: DS.muted, fontStyle: "italic" }}>e.g. {tier.examples}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 02 — Source Tiers */}
        <Section id="source-tiers" icon={FileText} iconColor={ACCENT} number="02" title="Source Tiers">
          <p style={{ fontSize: "0.82rem", color: DS.muted, lineHeight: 1.6, marginBottom: 14 }}>
            Every source is classified into one of three tiers based on its institutional authority and verifiability. All source URLs are now linked directly in our database.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              {
                tier: "Tier 1", color: RED, bg: DS.badBg, label: "Primary official record",
                types: "Court filing, regulatory finding, government report, corporate admission",
                examples: "US DOL TVPRA list, CBP Withhold Release Order, Supreme Court opinion, OECD NCP complaint",
              },
              {
                tier: "Tier 2", color: AMBER, bg: DS.warnBg, label: "Independent NGO report",
                types: "NGO report, academic study",
                examples: "Amnesty International, Human Rights Watch, Oxfam, Greenpeace, BHRRC, Columbia Law School",
              },
              {
                tier: "Tier 3", color: DS.muted, bg: DS.hair, label: "Investigative journalism",
                types: "Investigative journalism, news report",
                examples: "BBC, The Guardian, Washington Post, AP, Channel 4, NYT, Reporter Brasil",
              },
            ].map((s) => (
              <div key={s.tier} style={{
                borderRadius: 12, background: s.bg, padding: "14px 16px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{
                    fontSize: "0.65rem", fontWeight: 700, color: DS.card, background: s.color,
                    borderRadius: 6, padding: "2px 8px", letterSpacing: "0.04em",
                  }}>{s.tier}</span>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: DS.ink }}>{s.label}</span>
                </div>
                <p style={{ fontSize: "0.75rem", color: DS.muted, marginBottom: 2 }}>
                  <span style={{ fontWeight: 600 }}>Types:</span> {s.types}
                </p>
                <p style={{ fontSize: "0.72rem", color: DS.muted, fontStyle: "italic" }}>{s.examples}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 03 — The Sourcing Bar */}
        <Section id="sourcing-bar" icon={AlertTriangle} iconColor={AMBER} number="03" title="The Sourcing Bar">
          <p style={{ fontSize: "0.82rem", color: DS.muted, lineHeight: 1.6, marginBottom: 14 }}>
            A flag is only shown in the app if it meets <span style={{ fontWeight: 700, color: GREEN }}>at least one</span> of these criteria:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { rule: "1+ tier-1 source", detail: "Any single government report, court filing, regulatory finding, or corporate admission." },
              { rule: "2+ independent tier-2 sources", detail: "Two NGO reports from different organisations covering the same finding." },
              { rule: "1 tier-2 + 2 tier-3 sources", detail: "One NGO report plus two separate investigative journalism pieces on the same allegation." },
            ].map((item, i) => (
              <div key={i} style={{
                borderRadius: 12, background: DS.goodBg,
                padding: "14px 16px", display: "flex", gap: 12,
                border: `1px solid ${DS.good}`,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, background: DS.goodBg,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  fontSize: "0.75rem", fontWeight: 700, color: GREEN,
                }}>
                  {i + 1}
                </div>
                <div>
                  <p style={{ fontSize: "0.82rem", fontWeight: 700, color: DS.ink, marginBottom: 2 }}>{item.rule}</p>
                  <p style={{ fontSize: "0.75rem", color: DS.muted, lineHeight: 1.55 }}>{item.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 12, borderRadius: 10, background: DS.warnBg, border: `1px solid ${DS.warn}`,
            padding: "12px 14px",
          }}>
            <p style={{ fontSize: "0.78rem", color: ORANGE, lineHeight: 1.6, fontWeight: 500 }}>
              Flags with only tier-3 sources are held in <span style={{ fontWeight: 700 }}>pending review</span> and not shown to users until additional sourcing is confirmed.
            </p>
          </div>
        </Section>

        {/* 04 — What a Flag Actually Claims */}
        <Section icon={GitBranch} iconColor={ACCENT} number="04" title="What a Flag Actually Claims">
          <p style={{ fontSize: "0.82rem", color: DS.muted, lineHeight: 1.6, marginBottom: 14 }}>
            Source tier tells you how good the evidence is. It doesn't tell you what the evidence is
            evidence <span style={{ fontStyle: "italic" }}>of</span>. Those are different questions, and we
            record both.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{
              borderRadius: 12, background: DS.bg, padding: "14px 16px",
              border: `1px solid ${DS.hair}`,
            }}>
              <p style={{ fontSize: "0.82rem", fontWeight: 700, color: DS.ink, marginBottom: 4 }}>
                Direct — {directCount} of {totalVerified} flags
              </p>
              <p style={{ fontSize: "0.78rem", color: DS.muted, lineHeight: 1.6 }}>
                A source names the company: a lawsuit against it, a regulator's finding, an
                investigation into it, or its own disclosure. Shown with a solid border.
              </p>
            </div>
            <div style={{
              borderRadius: 12, background: DS.bg, padding: "14px 16px",
              border: `2px dashed ${DS.hair}`,
            }}>
              <p style={{ fontSize: "0.82rem", fontWeight: 700, color: DS.ink, marginBottom: 4 }}>
                Supply-chain inference — {inferenceCount} of {totalVerified} flags
              </p>
              <p style={{ fontSize: "0.78rem", color: DS.muted, lineHeight: 1.6 }}>
                The source documents a commodity or region, and the company is linked because it buys
                from there. Shown with a dashed border and stated on the flag itself before the claim.
              </p>
            </div>
          </div>
          <div style={{
            marginTop: 12, borderRadius: 10, background: DS.warnBg, border: `1px solid ${DS.warn}`,
            padding: "12px 14px",
          }}>
            <p style={{ fontSize: "0.78rem", color: ORANGE, lineHeight: 1.6, fontWeight: 500 }}>
              The clearest example: the US Department of Labor's list of goods produced with child
              labour establishes that cocoa from Côte d'Ivoire and Ghana involves child labour. It is a
              tier-1 government source and we trust it completely — about cocoa. It says nothing about
              which company bought that cocoa. {commodityCited} of our flags cite it or a sibling
              commodity listing. For {commodityOnlyInference} of them that is the strongest link we
              have, and those are inferences; for the other {commodityCited - commodityOnlyInference},
              a separate source names the company directly.
            </p>
          </div>
          <p style={{ fontSize: "0.78rem", color: DS.muted, lineHeight: 1.6, marginTop: 12 }}>
            An inference is not a weak claim. A company that buys cocoa from a region where child
            labour is documented, and cannot show otherwise, has a real problem. It is a
            <span style={{ fontWeight: 700, color: DS.ink }}> different </span>
            claim from "this company was found responsible", and we no longer print them in the same words.
          </p>
        </Section>

        {/* 05 — Where AI Is Used */}
        <Section icon={Sparkles} iconColor={DS.muted} number="05" title="Where AI Is Used">
          <p style={{ fontSize: "0.82rem", color: DS.muted, lineHeight: 1.6, marginBottom: 14 }}>
            This page used to describe the tier system and stop there, which left out that a second,
            completely different mechanism produces a large share of what the app shows you.
          </p>

          <div style={{
            borderRadius: 12, background: DS.bg, padding: "14px 16px",
            border: `2px dashed ${DS.hair}`, marginBottom: 12,
          }}>
            <p style={{ fontSize: "0.82rem", fontWeight: 700, color: DS.ink, marginBottom: 6 }}>
              The model: OpenAI GPT-4o-mini
            </p>
            <p style={{ fontSize: "0.78rem", color: DS.muted, lineHeight: 1.6, marginBottom: 8 }}>
              When you scan a product we have no verified data for, we ask GPT-4o-mini to analyse it
              from its training knowledge. It returns a labour-risk level, A–E scores for environment
              and nutrition, certifications and suggested alternatives.
            </p>
            <p style={{ fontSize: "0.78rem", color: DS.muted, lineHeight: 1.6 }}>
              <span style={{ fontWeight: 700, color: DS.ink }}>None of it is cited.</span>{" "}
              The model cannot tell us where any particular claim came from, and it can be
              confidently wrong. It also rates its own confidence — that number is the model's
              opinion of itself, not a measure of whether it is right.
            </p>
          </div>

          <p style={{ fontSize: "0.82rem", fontWeight: 700, color: DS.ink, marginBottom: 8 }}>
            How to tell them apart
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
            {[
              {
                what: "Sourced flags",
                how: "Solid card, a severity heading, and a \"View sources\" link that opens a list of documents you can go and read.",
              },
              {
                what: "AI estimates",
                how: "A dashed card headed \"AI estimate — not source-verified\", shown above the result rather than beneath it. No green confidence badge, and never the same badge component as a verified flag.",
              },
            ].map((row) => (
              <div key={row.what} style={{
                display: "flex", gap: 10, padding: "10px 12px",
                borderRadius: 10, background: DS.bg,
              }}>
                <div>
                  <p style={{ fontSize: "0.78rem", fontWeight: 700, color: DS.ink, marginBottom: 2 }}>{row.what}</p>
                  <p style={{ fontSize: "0.75rem", color: DS.muted, lineHeight: 1.55 }}>{row.how}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            borderRadius: 10, background: DS.warnBg, border: `1px solid ${DS.warn}`,
            padding: "12px 14px",
          }}>
            <p style={{ fontSize: "0.78rem", color: ORANGE, lineHeight: 1.6, fontWeight: 500 }}>
              Coverage is {totalVerified} verified brands. That is a small number against a
              supermarket. Everything outside it falls through to the AI path — so for most products
              you scan, what you are reading is an estimate, not a sourced finding.
            </p>
          </div>
        </Section>

        {/* 06 — Supermarket availability */}
        <Section icon={Store} iconColor={DS.muted} number="06" title="What “Available Here” Means">
          <p style={{ fontSize: "0.82rem", color: DS.muted, lineHeight: 1.6, marginBottom: 14 }}>
            The shop feature ranks products by how likely a chain is to carry them. It is not stock
            information, and it cannot be: no supermarket publishes live inventory that we may
            lawfully use, and scraping their sites would breach both their terms and, in the UK and
            EU, their database rights. So we say what we actually know, on a ladder.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
            {[
              { t: "Seen at [chain]", d: "Another shopper confirmed seeing it there in the last six months. Confirmations expire, because a shelf from two years ago tells you nothing." },
              { t: "Listed at [chain]", d: "Open Food Facts records the product as sold by that chain. The entry has no date and no branch — it means the chain carries it, not that it's there today." },
              { t: "Sold in your country", d: "The brand trades in your market, but we have nothing linking it to that chain specifically." },
              { t: "Availability unknown", d: "No signal at all. Shown as-is rather than hidden, so a gap in our data doesn't look like a judgement." },
            ].map((row) => (
              <div key={row.t} style={{ padding: "10px 12px", borderRadius: 10, background: DS.bg }}>
                <p style={{ fontSize: "0.78rem", fontWeight: 700, color: DS.ink, marginBottom: 2 }}>{row.t}</p>
                <p style={{ fontSize: "0.75rem", color: DS.muted, lineHeight: 1.55 }}>{row.d}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: "0.82rem", fontWeight: 700, color: DS.ink, marginBottom: 6 }}>
            Comparisons
          </p>
          <p style={{ fontSize: "0.78rem", color: DS.muted, lineHeight: 1.6, marginBottom: 12 }}>
            When we say a pick is better, it is measured against the average for that category as
            sold in your country, sampled from Open Food Facts. The sample size and date appear next
            to every figure. Where a market has too few products to average — which is common outside
            western Europe — we fall back to the global average and say so rather than quietly
            comparing your local shelf to someone else's. Carbon numbers are Agribalyse life-cycle
            estimates for a <em>type</em> of product, not measurements of an individual item.
          </p>
          <div style={{
            borderRadius: 10, background: DS.warnBg, border: `1px solid ${DS.warn}`,
            padding: "12px 14px",
          }}>
            <p style={{ fontSize: "0.78rem", color: ORANGE, lineHeight: 1.6, fontWeight: 500 }}>
              We have no relationship with any retailer named in this app. We use shop names only so
              you can tell us which shop you're in. Our ethical flags concern the companies that{" "}
              <span style={{ fontWeight: 700 }}>make</span> products, never the shops that sell them —
              we make no claim about any retailer's own conduct or buying standards.
            </p>
          </div>
        </Section>

        {/* 07 — What We Don't Do */}
        <Section icon={Info} iconColor={DS.muted} number="07" title="What We Don't Do">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              "Include brand flags without at least one source that meets the tier bar.",
              "Describe findings as proven fact when only one tier-3 source exists.",
              "Accept allegations from anonymous or unverifiable sources.",
              "Show a flag that has been proven factually incorrect without updating it.",
              "Carry a flag indefinitely — documented remediation leads to archival.",
            ].map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px",
                borderRadius: 10, background: i % 2 === 0 ? DS.bg : DS.card,
              }}>
                <span style={{ color: RED, fontWeight: 700, fontSize: "0.85rem", flexShrink: 0, lineHeight: 1.5 }}>x</span>
                <p style={{ fontSize: "0.8rem", color: DS.muted, lineHeight: 1.6 }}>{item}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 07 — Database Status */}
        <Section id="database-status" icon={Database} iconColor={ACCENT} number="08" title="Database Status">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Last Verified", value: lastUpdate ? lastUpdate.slice(0, 10) : "—", color: GREEN },
              { label: "Status", value: "Active", color: AMBER },
              { label: "Total Brands", value: String(totalVerified), color: ACCENT },
              { label: "All URLs Cited", value: "Yes", color: GREEN },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                borderRadius: 12, background: DS.bg,
                padding: "14px", textAlign: "center",
              }}>
                <p style={{ fontSize: "1.1rem", fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>{value}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: DS.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* 07 — Limitations */}
        <div style={{
          background: DS.warnBg, borderRadius: 18,
          padding: "20px", marginBottom: 14,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: DS.warnBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <AlertTriangle style={{ width: 16, height: 16, color: AMBER }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: DS.muted, letterSpacing: 0.5, lineHeight: 1, textTransform: "uppercase" }}>07</p>
              <p style={{ fontSize: "1rem", fontWeight: 700, color: DS.ink, lineHeight: 1.3 }}>Limitations</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              "We currently flag ~35 brands. Major multinationals are prioritised; smaller or regional brands may not yet be covered.",
              "We focus on consumer food and grocery goods. Fashion, electronics, and household goods are out of scope.",
              "Geographic coverage skews toward supply chains with English-language investigative coverage.",
              "A brand not in our database does not mean it has no issues — it may not have been researched yet.",
              "This is not legal advice. Flags describe documented findings, not legal verdicts (unless the source is a court ruling).",
            ].map((l, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: AMBER, fontWeight: 700, fontSize: "0.85rem", flexShrink: 0, lineHeight: 1.5 }}>!</span>
                <p style={{ fontSize: "0.78rem", color: DS.muted, lineHeight: 1.6 }}>{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p style={{ fontSize: "0.72rem", color: DS.muted, textAlign: "center", marginTop: 8 }}>
          Methodology v2 — Updated May 2026
        </p>

      </main>
    </div>
  );
}
