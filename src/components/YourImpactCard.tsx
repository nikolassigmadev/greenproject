// The home-page "Your impact" widget, rebuilt as one live view over every
// store it reflects: the basket, the user's priorities, buy/skip decisions,
// and scan history. The only state is a version counter bumped by the stores'
// events — every number is re-derived from localStorage on render, so nothing
// this card shows can drift out of sync with the rest of the app.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight, Leaf, ScanLine, Shield, ShoppingCart, SlidersHorizontal,
} from "lucide-react";
import { DS, scoreTone, toneColor, toneBg } from "@/styles/design-tokens";
import { loadBasket, getBasketEthicsReport } from "@/utils/basketStorage";
import { loadPriorities, loadScanHistory, summarizePriorities } from "@/utils/userPreferences";
import { loadDecisions, DECISIONS_EVENT } from "@/utils/decisions";

const GOOD_VERDICTS = new Set(["BUY", "CONSIDER"]);
const BAD_VERDICTS = new Set(["CAUTION", "AVOID"]);

// Grade → kg CO₂e/kg estimates mirror getCarbonStats in userPreferences.
const GRADE_CO2: Record<string, number> = { "a-plus": 0.3, a: 0.5, b: 1.2, c: 2.5, d: 4.0, e: 6.0 };
const BASELINE = 2.5, SERVING = 0.25; // kg CO₂e/kg, ~kg per product

/** Every in-app event that changes something this card displays. */
const LIVE_EVENTS = [
  "basketUpdated",
  "prioritiesUpdated",
  DECISIONS_EVENT,
  "scanHistoryUpdated",
] as const;

function useImpactVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const refresh = () => setVersion((n) => n + 1);
    for (const e of LIVE_EVENTS) window.addEventListener(e, refresh);
    // In-app events don't cover writes from another tab or bfcache restores.
    window.addEventListener("storage", refresh);
    window.addEventListener("pageshow", refresh);
    return () => {
      for (const e of LIVE_EVENTS) window.removeEventListener(e, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("pageshow", refresh);
    };
  }, []);
  return version;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10.5, fontWeight: 800, letterSpacing: 1.1,
      textTransform: "uppercase", color: DS.muted, marginBottom: 12,
    }}>
      {children}
    </div>
  );
}

function StatCell({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
      <div style={{
        fontSize: 20, fontWeight: 800, color, lineHeight: 1,
        fontVariantNumeric: "tabular-nums", letterSpacing: -0.4,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: DS.muted, marginTop: 6, lineHeight: 1.2 }}>
        {label}
      </div>
    </div>
  );
}

function StatDivider() {
  return <div style={{ width: 1, alignSelf: "stretch", background: DS.hair, margin: "0 6px" }} />;
}

function ImpactRow({ icon: Icon, tint, value, text }: {
  icon: React.ElementType;
  tint: string;
  value: React.ReactNode;
  text: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        background: `color-mix(in srgb, ${tint} 15%, transparent)`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon style={{ width: 17, height: 17, color: tint }} />
      </div>
      <div style={{ fontSize: 13.5, lineHeight: 1.35 }}>
        <span style={{ fontWeight: 800, color: DS.ink }}>{value}</span>{" "}
        <span style={{ color: DS.ink2 }}>{text}</span>
      </div>
    </div>
  );
}

/**
 * Live basket half of the card. Rendered from the current basket scored with
 * the current priorities — removing an item or changing a priority level
 * recomputes it on the spot.
 */
function BasketNow() {
  const basket = loadBasket();
  const priorities = loadPriorities();

  if (basket.length === 0) {
    return (
      <Link to="/basket" style={{
        display: "flex", alignItems: "center", gap: 12,
        background: DS.bg, borderRadius: 12, padding: "13px 14px",
        textDecoration: "none",
      }}>
        <ShoppingCart style={{ width: 16, height: 16, color: DS.muted, flexShrink: 0 }} />
        <div style={{ flex: 1, fontSize: 12.5, color: DS.muted, lineHeight: 1.4 }}>
          Your basket is empty — add products to see how they score against your values.
        </div>
        <ChevronRight style={{ width: 15, height: 15, color: DS.muted, flexShrink: 0 }} />
      </Link>
    );
  }

  const report = getBasketEthicsReport(basket, priorities);
  const scored = report.overallGrade !== "unknown";
  const tone = scored ? scoreTone(report.overallScore) : null;

  return (
    <>
      <Link to="/basket" style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none" }}>
        <div style={{
          width: 46, height: 46, borderRadius: 14, flexShrink: 0,
          background: tone ? toneBg(tone) : DS.bg,
          color: tone ? toneColor(tone) : DS.muted,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, fontWeight: 800,
        }}>
          {scored ? report.overallGrade.toUpperCase() : "—"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: DS.ink, letterSpacing: -0.2 }}>
            Basket score
          </div>
          <div style={{ fontSize: 12, color: DS.muted, marginTop: 2, lineHeight: 1.35 }}>
            {scored
              ? `${report.overallScore}/100 across ${basket.length} item${basket.length === 1 ? "" : "s"}, weighted by your priorities`
              : "Scores will appear as your items gain data"}
          </div>
        </div>
        <ChevronRight style={{ width: 16, height: 16, color: DS.muted, flexShrink: 0 }} />
      </Link>

      <div style={{
        display: "flex", alignItems: "center",
        background: DS.bg, borderRadius: 13, padding: "12px 8px", marginTop: 14,
      }}>
        <StatCell value={String(basket.length)} label="Items" color={DS.ink} />
        <StatDivider />
        <StatCell
          value={String(report.laborFlagCount)}
          label="Labour flags"
          color={report.laborFlagCount > 0 ? DS.bad : DS.good}
        />
        <StatDivider />
        <StatCell
          value={report.co2ScoredCount > 0
            ? `${report.co2NetKg >= 0 ? "−" : "+"}${Math.abs(report.co2NetKg)}`
            : "—"}
          label={report.co2ScoredCount > 0 ? "kg CO₂ vs avg" : "CO₂"}
          color={report.co2ScoredCount === 0 ? DS.muted : report.co2NetKg >= 0 ? DS.good : DS.warn}
        />
      </div>

      {/* Spell out how the priorities are shaping the number, with a way to
          change them right here — so the connection is never a mystery. */}
      <Link to="/preferences" style={{
        display: "flex", alignItems: "flex-start", gap: 8, marginTop: 12,
        textDecoration: "none",
      }}>
        <SlidersHorizontal style={{ width: 13, height: 13, color: DS.muted, flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1, fontSize: 11.5, color: DS.muted, lineHeight: 1.45 }}>
          {summarizePriorities(priorities)}{" "}
          <span style={{ fontWeight: 700, color: DS.ink }}>Adjust</span>
        </div>
      </Link>
    </>
  );
}

/**
 * Decision-driven track record. Quality is measured only on what the user
 * actually chose to BUY (good picks %), and they get credit for the flagged
 * products they SAW and SKIPPED — scans they never acted on don't count.
 */
function TrackRecord() {
  const decisions = loadDecisions();
  const scanned = loadScanHistory().length;

  const verdictOf = (d: { verdict: string }) => (d.verdict || "").toUpperCase();
  const bought = decisions.filter((d) => d.outcome === "bought");
  const skipped = decisions.filter((d) => d.outcome === "rejected");
  const goodBought = bought.filter((d) => GOOD_VERDICTS.has(verdictOf(d))).length;
  const goodPct = bought.length ? Math.round((goodBought / bought.length) * 100) : 0;

  // CO₂ avoided by buying lower-impact products than an average choice.
  let co2Saved = 0;
  for (const d of bought) {
    const co2 = GRADE_CO2[(d.ecoGrade || "").toLowerCase()];
    if (co2 == null) continue;
    const saved = (BASELINE - co2) * SERVING;
    if (saved > 0) co2Saved += saved;
  }
  co2Saved = Math.round(co2Saved * 10) / 10;

  // Distinct brands the user saw a problem with and chose to skip.
  const brandsAvoided = new Set(
    skipped
      .filter((d) => BAD_VERDICTS.has(verdictOf(d)))
      .map((d) => (d.brand || "").toLowerCase().trim())
      .filter(Boolean),
  ).size;

  return (
    <>
      {/* Hero — the quality of what they actually bought. Coloured by tone so a
          weak buy record reads honestly (red/amber), not a misleading green. */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{
          fontSize: 48, fontWeight: 800, lineHeight: 0.85, letterSpacing: -1.5,
          color: bought.length ? toneColor(scoreTone(goodPct)) : DS.muted,
        }}>
          {bought.length ? `${goodPct}%` : "—"}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16.5, fontWeight: 800, color: DS.ink, letterSpacing: -0.2 }}>Good picks</div>
          <div style={{ fontSize: 12.5, color: DS.muted, marginTop: 3, lineHeight: 1.35 }}>
            {bought.length
              ? `of the ${bought.length} product${bought.length > 1 ? "s" : ""} you chose to buy`
              : "Buy or skip a scanned product to start tracking"}
          </div>
        </div>
      </div>

      {bought.length > 0 && (
        <div style={{ height: 10, borderRadius: 999, overflow: "hidden", marginTop: 16, background: DS.bg }}>
          <div style={{ height: "100%", borderRadius: 999, background: toneColor(scoreTone(goodPct)), width: `${Math.max(goodPct, 2)}%` }} />
        </div>
      )}

      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 14 }}>
        <ImpactRow icon={Leaf} tint={DS.good}
          value={`${co2Saved} kg`} text="CO₂ saved vs. buying average products" />
        <ImpactRow icon={ScanLine} tint={DS.ink}
          value={scanned} text={`product${scanned === 1 ? "" : "s"} scanned in total`} />
      </div>

      {brandsAvoided > 0 && (
        <div style={{
          marginTop: 14, display: "flex", gap: 10, alignItems: "flex-start",
          background: DS.goodBg, borderRadius: 12, padding: "12px 14px",
        }}>
          <Shield style={{ width: 16, height: 16, color: DS.good, flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12.5, color: DS.ink, lineHeight: 1.45 }}>
            You walked away from{" "}
            <strong>{brandsAvoided} brand{brandsAvoided === 1 ? "" : "s"}</strong>{" "}
            with labour concerns.
          </div>
        </div>
      )}
    </>
  );
}

export function YourImpactCard() {
  useImpactVersion();

  return (
    <div style={{
      background: DS.card, borderRadius: DS.radius.lg, padding: 22,
      boxShadow: "0 6px 20px rgba(26,22,20,0.11), 0 0 0 1px rgba(26,22,20,0.05)",
    }}>
      <SectionLabel>In your basket</SectionLabel>
      <BasketNow />

      <div style={{ height: 1, background: DS.hair, margin: "20px 0 18px" }} />

      <SectionLabel>Your track record</SectionLabel>
      <TrackRecord />
    </div>
  );
}
