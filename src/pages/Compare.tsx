import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, Loader2, GitCompareArrows, AlertTriangle,
  CheckCircle2, ExternalLink, Package2, X, Trophy, Leaf, Heart, Cloud,
  ShieldCheck, Sparkles, Plus, SlidersHorizontal, Camera,
} from "lucide-react";
import { useRef } from "react";
import { BackButton } from "@/components/BackButton";
import { DS } from "@/styles/design-tokens";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";
import { getVerifiedFlagForBrand } from "@/services/brandFlags";
import type { BrandFlagV2, FlagCategory } from "@/types/brandFlag";
import { smartProductSearch } from "@/utils/smartProductSearch";
import { identifyLabelFromImage, fileToDataUrl } from "@/utils/identifyFromImage";
import { loadPriorities, priorityMultiplier, type UserPriorities } from "@/utils/userPreferences";
import { getBrandSentiment } from "@/utils/watchlist";
import { toast } from "sonner";

type Slot = "A" | "B";

interface SlotState {
  query: string;
  loading: boolean;
  product: OpenFoodFactsResult | null;
}

const GRADE_COLOR: Record<string, string> = {
  a: DS.good, b: DS.good, c: DS.warn, d: DS.bad, e: DS.bad,
};

// Alpha helper. Hex-string concat (`${color}22`) breaks when `color` is a
// CSS var, since `var(--x)22` is invalid. Use color-mix so it works for both
// hex literals and CSS vars.
function alpha(color: string, pct: number): string {
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
}

const QUICK_PAIRS: Array<{ a: string; b: string; tag: string }> = [
  { a: "Coca-Cola", b: "Pepsi", tag: "Cola classics" },
  { a: "Nutella", b: "Biscoff", tag: "Spread duel" },
  { a: "KitKat", b: "Twix", tag: "Bar fight" },
  { a: "Lay's Classic", b: "Pringles", tag: "Crisp face-off" },
];

function gradeRank(grade: string | null | undefined): number {
  if (!grade) return 6;
  const g = grade.toLowerCase();
  return ({ "a-plus": 0, a: 1, b: 2, c: 3, d: 4, e: 5 } as Record<string, number>)[g] ?? 6;
}

// ────────────────────────────────────────────────────────────
// Shared verdict — computes who wins so card borders + verdict card stay in sync
// ────────────────────────────────────────────────────────────

// Each verdict measure maps to one of the four user-priority dimensions, so the
// user's weighting in /preferences can amplify or mute it.
type PriorityDim = "environment" | "laborRights" | "animalWelfare" | "nutrition";

const ALL_DIMS: PriorityDim[] = ["environment", "laborRights", "animalWelfare", "nutrition"];

const CATEGORY_DIMENSION: Record<FlagCategory, PriorityDim> = {
  forced_labour: "laborRights",
  child_labour: "laborRights",
  wage_theft: "laborRights",
  unsafe_conditions: "laborRights",
  union_busting: "laborRights",
  discrimination: "laborRights",
  supply_chain_opacity: "laborRights",
  boycott_listed: "laborRights",
  animal_welfare: "animalWelfare",
  environmental_harm: "environment",
};

interface VerdictPoint {
  label: string;
  icon: typeof Leaf;
  winner: "A" | "B" | "tie";
  note?: string;
  dimension: PriorityDim;
  weight: number; // priorityMultiplier(priorities[dimension]) → 0.3 (low) … 5.0 (critical)
  /** Overrides the dimension-derived weight (watchlist stance = decisive; nutrition = 0). */
  fixedWeight?: number;
}

interface VerdictResult {
  points: VerdictPoint[];
  aWins: number;   // raw measures won
  bWins: number;
  aScore: number;  // priority-weighted
  bScore: number;
  leader: "A" | "B" | "tie";
  personalized: boolean; // any priority differs from the neutral default
}

function computeVerdict(
  a: OpenFoodFactsResult,
  b: OpenFoodFactsResult,
  priorities: UserPriorities,
): VerdictResult {
  const aFlag = getVerifiedFlagForBrand(a.brand);
  const bFlag = getVerifiedFlagForBrand(b.brand);
  const weightFor = (dim: PriorityDim) => priorityMultiplier(priorities[dim]);
  const raw: Omit<VerdictPoint, "weight">[] = [];

  const ar = gradeRank(a.ecoscoreGrade);
  const br = gradeRank(b.ecoscoreGrade);
  if (ar !== br) {
    raw.push({
      label: "Eco-score", icon: Leaf, dimension: "environment",
      winner: ar < br ? "A" : "B",
      note: `${(a.ecoscoreGrade ?? "?").toUpperCase()} vs ${(b.ecoscoreGrade ?? "?").toUpperCase()}`,
    });
  }

  const an = gradeRank(a.nutriscoreGrade);
  const bn = gradeRank(b.nutriscoreGrade);
  if (an !== bn) {
    raw.push({
      label: "Nutri-score", icon: Heart, dimension: "nutrition",
      winner: an < bn ? "A" : "B",
      note: `${(a.nutriscoreGrade ?? "?").toUpperCase()} vs ${(b.nutriscoreGrade ?? "?").toUpperCase()}`,
    });
  }

  const aco2 = a.ecoscoreData?.agribalyse?.co2_total;
  const bco2 = b.ecoscoreData?.agribalyse?.co2_total;
  if (aco2 != null && bco2 != null && aco2 !== bco2) {
    raw.push({
      label: "Lower CO2", icon: Cloud, dimension: "environment",
      winner: aco2 < bco2 ? "A" : "B",
      note: `${aco2.toFixed(1)} vs ${bco2.toFixed(1)} kg`,
    });
  }

  // Ethics: the flagged side loses; the dimension follows the flag's category
  // (labour vs animal welfare vs environmental harm).
  if (!aFlag && bFlag) {
    raw.push({ label: "Clean ethics record", icon: ShieldCheck, winner: "A", dimension: CATEGORY_DIMENSION[bFlag.category] ?? "laborRights" });
  } else if (aFlag && !bFlag) {
    raw.push({ label: "Clean ethics record", icon: ShieldCheck, winner: "B", dimension: CATEGORY_DIMENSION[aFlag.category] ?? "laborRights" });
  }

  // The user's personal watchlist stance is decisive — mirror the scan detail
  // page, where "avoid" sinks a product and "trust" lifts it. A large fixed
  // weight lets it dominate the head-to-head when only one side is flagged.
  const SENTIMENT_WEIGHT = 10;
  const aSent = getBrandSentiment(a.brand);
  const bSent = getBrandSentiment(b.brand);
  if ((aSent === "avoid") !== (bSent === "avoid")) {
    const avoided = aSent === "avoid" ? "A" : "B";
    const avoidedBrand = (avoided === "A" ? a.brand : b.brand) || "that brand";
    raw.push({
      label: "On your watchlist", icon: ShieldCheck, winner: avoided === "A" ? "B" : "A",
      dimension: "laborRights", fixedWeight: SENTIMENT_WEIGHT,
      note: `You marked ${avoidedBrand} as a brand to avoid`,
    });
  }
  if ((aSent === "trust") !== (bSent === "trust")) {
    const trusted = aSent === "trust" ? "A" : "B";
    const trustedBrand = (trusted === "A" ? a.brand : b.brand) || "that brand";
    raw.push({
      label: "You trust this brand", icon: ShieldCheck, winner: trusted,
      dimension: "laborRights", fixedWeight: SENTIMENT_WEIGHT,
      note: `You marked ${trustedBrand} as a brand you trust`,
    });
  }

  // Nutrition is no longer a user priority, so the Nutri-score comparison is
  // shown for reference (weight 0 → renders muted) but never sways the winner.
  const points: VerdictPoint[] = raw.map((p) => ({
    ...p,
    weight: p.fixedWeight ?? (p.dimension === "nutrition" ? 0 : weightFor(p.dimension)),
  }));

  const aWins = points.filter((p) => p.winner === "A").length;
  const bWins = points.filter((p) => p.winner === "B").length;
  let aScore = points.filter((p) => p.winner === "A").reduce((s, p) => s + p.weight, 0);
  let bScore = points.filter((p) => p.winner === "B").reduce((s, p) => s + p.weight, 0);

  // If the user zeroed out every priority that applies here, fall back to an
  // unweighted count so we can still call a winner.
  if (aScore === 0 && bScore === 0 && points.length > 0) {
    aScore = aWins;
    bScore = bWins;
  }

  const leader: "A" | "B" | "tie" = aScore > bScore ? "A" : bScore > aScore ? "B" : "tie";
  const personalized = ALL_DIMS.some((d) => priorities[d] !== 50);

  return { points, aWins, bWins, aScore, bScore, leader, personalized };
}

/** Map a priority multiplier to a short, human label for the verdict. */
function priorityTag(weight: number): { text: string; muted: boolean } {
  if (weight <= 0) return { text: "Not counted", muted: true };
  if (weight <= 0.5) return { text: "Low priority", muted: false };
  if (weight <= 1.2) return { text: "Counts", muted: false };
  if (weight <= 2.5) return { text: "High priority", muted: false };
  return { text: "Top priority", muted: false };
}

// ────────────────────────────────────────────────────────────
// Unified compare form — both inputs + one Compare button in a single step
// ────────────────────────────────────────────────────────────

function UnifiedCompareForm({
  initialA, initialB, loading, onCompare,
}: {
  initialA: string;
  initialB: string;
  loading: boolean;
  onCompare: (a: string, b: string) => void;
}) {
  const [a, setA] = useState(initialA);
  const [b, setB] = useState(initialB);

  // Keep inputs in sync if parent resets / preloads them (e.g. quick pair click).
  useSyncedValue(initialA, setA);
  useSyncedValue(initialB, setB);

  const canSubmit = a.trim().length > 0 && b.trim().length > 0 && !loading;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (canSubmit) onCompare(a.trim(), b.trim()); }}
      style={{
        background: DS.card, borderRadius: 18, padding: 14,
        border: `1px solid ${DS.hair}`, marginBottom: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        display: "flex", flexDirection: "column", gap: 10,
      }}
    >
      <SlotInput slot="A" value={a} onChange={setA} disabled={loading} />
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, fontWeight: 800, color: DS.muted,
        letterSpacing: "0.15em",
      }}>
        <div style={{ height: 1, background: DS.hair, flex: 1, marginRight: 10 }} />
        VS
        <div style={{ height: 1, background: DS.hair, flex: 1, marginLeft: 10 }} />
      </div>
      <SlotInput slot="B" value={b} onChange={setB} disabled={loading} />
      <button
        type="submit"
        disabled={!canSubmit}
        style={{
          marginTop: 4, height: 48, borderRadius: 12, border: "none",
          background: canSubmit ? DS.ink : DS.hair,
          color: canSubmit ? DS.card : DS.muted,
          fontSize: 14, fontWeight: 800, letterSpacing: "0.02em",
          cursor: canSubmit ? "pointer" : "not-allowed",
          fontFamily: DS.font,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "background 150ms ease",
        }}
      >
        {loading ? (
          <>
            <Loader2 style={{ width: 16, height: 16, animation: "spin 0.7s linear infinite" }} />
            Comparing…
          </>
        ) : (
          <>
            <GitCompareArrows style={{ width: 16, height: 16 }} />
            Compare
          </>
        )}
      </button>
    </form>
  );
}

function SlotInput({
  slot, value, onChange, disabled,
}: {
  slot: Slot;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  const accent = slot === "A" ? DS.brand : DS.ink;
  const fileRef = useRef<HTMLInputElement>(null);
  const [identifying, setIdentifying] = useState(false);

  // Photo capture → same identification path as the scan page: OpenAI vision
  // reads the packaging (and any barcode), a barcode resolves against OFF, and
  // the resulting "Brand Product" label seeds the slot so the existing compare
  // search resolves it. Image → OpenAI → barcode → OFF, just like a scan.
  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    setIdentifying(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const label = await identifyLabelFromImage(dataUrl);
      if (label) {
        onChange(label);
        toast.success(`Identified: ${label}`);
      } else {
        toast.error("Couldn't read that product — try typing it instead.");
      }
    } catch {
      toast.error("Couldn't process that photo.");
    } finally {
      setIdentifying(false);
    }
  };

  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{
        width: 26, height: 26, borderRadius: 999,
        background: alpha(accent, 13), color: accent,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 800, flexShrink: 0,
      }}>
        {slot}
      </span>
      <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
        <Search style={{
          position: "absolute", left: 12, width: 14, height: 14,
          color: DS.muted, pointerEvents: "none",
        }} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || identifying}
          placeholder={identifying ? "Identifying photo…" : slot === "A" ? "First product (e.g. Oreo)" : "Second product (e.g. Hydrox)"}
          style={{
            width: "100%", height: 44, padding: "0 46px 0 34px",
            borderRadius: 11, border: `1.5px solid ${DS.hair}`,
            background: DS.bg, color: DS.ink,
            fontSize: 14, fontFamily: DS.font, outline: "none", boxSizing: "border-box",
            fontWeight: 600, opacity: disabled ? 0.6 : 1,
          }}
        />
        {/* Photo / camera capture — identifies the product like a scan. */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhoto}
          style={{ display: "none" }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled || identifying}
          aria-label={`Identify product ${slot} from a photo`}
          style={{
            position: "absolute", right: 6, width: 34, height: 34,
            borderRadius: 9, border: "none", background: "transparent",
            color: identifying ? DS.muted : accent,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            cursor: disabled || identifying ? "default" : "pointer",
          }}
        >
          {identifying
            ? <Loader2 style={{ width: 17, height: 17, animation: "spin 0.7s linear infinite" }} />
            : <Camera style={{ width: 17, height: 17 }} />}
        </button>
      </div>
    </label>
  );
}

/** Sync an external value into local state when it changes (e.g. parent reset). */
function useSyncedValue(external: string, setter: (v: string) => void) {
  // Deliberately re-runs only when the external value changes, not the setter.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setter(external); }, [external]);
}

// ────────────────────────────────────────────────────────────
// Product slot
// ────────────────────────────────────────────────────────────

function ProductSlot({
  slot, state, outcome, onClear,
}: {
  slot: Slot;
  state: SlotState;
  outcome: "winner" | "loser" | "neutral";
  onClear: () => void;
}) {
  const product = state.product;
  const accent = slot === "A" ? DS.brand : DS.ink;
  const isAccentBrand = slot === "A";

  // Outcome wins over slot accent for the border / top strip color.
  // We tint with alpha rather than slamming saturated red/green so it works
  // in both light and dark themes without screaming.
  const outcomeColor =
    outcome === "winner" ? DS.good
    : outcome === "loser" ? DS.bad
    : null;

  if (!product) {
    return (
      <div style={{
        background: DS.card, borderRadius: 18, padding: "18px 14px",
        border: `1.5px dashed ${DS.hair}`,
        display: "flex", alignItems: "center", gap: 12,
        opacity: state.loading ? 1 : 0.7,
      }}>
        <span style={{
          width: 28, height: 28, borderRadius: 999,
          background: alpha(accent, 13), color: accent,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 800, flexShrink: 0,
        }}>
          {slot}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 11, fontWeight: 800, color: DS.muted,
            letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
            Product {slot}
          </div>
          <div style={{ fontSize: 13, color: DS.ink, fontWeight: 600, marginTop: 2 }}>
            {state.loading
              ? (state.query ? `Searching “${state.query}”…` : "Searching…")
              : "Waiting for a comparison"}
          </div>
        </div>
        {state.loading && (
          <Loader2 style={{
            width: 18, height: 18, color: DS.muted,
            animation: "spin 0.7s linear infinite", flexShrink: 0,
          }} />
        )}
      </div>
    );
  }

  const flag = getVerifiedFlagForBrand(product.brand);
  const g = product.ecoscoreGrade?.toLowerCase();
  const ng = product.nutriscoreGrade?.toLowerCase();
  const co2 = product.ecoscoreData?.agribalyse?.co2_total;
  const dataPoints = [g, ng, product.novaGroup, co2].filter((v) => v != null && v !== "").length;
  const dataTier: "full" | "partial" | "limited" =
    dataPoints >= 4 ? "full" : dataPoints >= 2 ? "partial" : "limited";

  // Border + strip use outcome color when verdict is decided; otherwise fall
  // back to the per-slot accent (A=brand, B=ink) so the page still feels alive.
  const borderColor =
    outcomeColor
      ? alpha(outcomeColor, 55)
      : (isAccentBrand ? alpha(DS.brand, 20) : DS.hair);
  const stripColor = outcomeColor ?? accent;

  return (
    <div style={{
      background: DS.card, borderRadius: 18, padding: 16,
      boxShadow: outcomeColor
        ? `0 4px 18px ${alpha(outcomeColor, 18)}, 0 0 0 1px ${alpha(outcomeColor, 30)} inset`
        : "0 2px 8px rgba(0,0,0,0.06)",
      border: `1.5px solid ${borderColor}`,
      display: "flex", flexDirection: "column", gap: 14,
      position: "relative", overflow: "hidden",
      transition: "border-color 250ms ease, box-shadow 250ms ease",
    }}>
      {/* Accent strip */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: stripColor,
      }} />

      <button
        onClick={onClear}
        aria-label="Clear product"
        style={{
          position: "absolute", top: 12, right: 12,
          width: 26, height: 26, borderRadius: 8, border: "none",
          background: DS.bg, color: DS.muted, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1,
        }}
      >
        <X style={{ width: 13, height: 13 }} />
      </button>

      <div style={{
        display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        paddingRight: 32, // leave room for the absolute X
      }}>
        <span style={{
          width: 22, height: 22, borderRadius: 999,
          background: outcomeColor ? alpha(outcomeColor, 18) : (isAccentBrand ? alpha(DS.brand, 13) : DS.ink),
          color: outcomeColor ?? (isAccentBrand ? DS.brand : DS.card),
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 800, flexShrink: 0,
        }}>
          {slot}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 800, color: DS.muted,
          letterSpacing: "0.06em", textTransform: "uppercase",
        }}>
          Product {slot}
        </span>
        <OutcomePill outcome={outcome} />
        <DataTierBadge tier={dataTier} />
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.productName || ""}
            style={{
              width: 64, height: 64, borderRadius: 12, objectFit: "contain",
              border: `1px solid ${DS.hair}`, background: DS.bg, flexShrink: 0,
              padding: 4, boxSizing: "border-box",
            }}
          />
        ) : (
          <div style={{
            width: 64, height: 64, borderRadius: 12,
            background: DS.bg, border: `1px solid ${DS.hair}`, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Package2 style={{ width: 22, height: 22, color: DS.muted }} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 16, fontWeight: 800, color: DS.ink, lineHeight: 1.2,
            letterSpacing: -0.3,
          }}>
            {product.productName || "Unknown product"}
          </div>
          <div style={{ fontSize: 12, color: DS.muted, marginTop: 3 }}>
            {product.brand || "Unknown brand"}
          </div>
        </div>
      </div>

      {/* metrics chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <MetricChip icon={Leaf}  label="Eco"   grade={g}  color={g ? GRADE_COLOR[g] : DS.muted} />
        <MetricChip icon={Heart} label="Nutri" grade={ng} color={ng ? GRADE_COLOR[ng] : DS.muted} />
        {product.novaGroup != null && (
          <span style={chipStyle()}>
            <Cloud style={{ width: 11, height: 11, color: DS.muted }} />
            <span style={{ color: DS.muted, fontWeight: 700, fontSize: 10 }}>NOVA</span>
            <span style={{ color: DS.ink, fontWeight: 800 }}>{product.novaGroup}</span>
          </span>
        )}
        {co2 != null && (
          <span style={chipStyle()}>
            <Cloud style={{ width: 11, height: 11, color: DS.muted }} />
            <span style={{ color: DS.muted, fontWeight: 700, fontSize: 10 }}>CO2</span>
            <span style={{ color: DS.ink, fontWeight: 800, fontFeatureSettings: "'tnum'" }}>
              {co2.toFixed(1)}<span style={{ color: DS.muted, fontWeight: 600 }}>kg</span>
            </span>
          </span>
        )}
      </div>

      <FlagBlock flag={flag} />
    </div>
  );
}

function chipStyle(): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 4,
    background: DS.bg, padding: "5px 9px", borderRadius: 999,
    fontSize: 11.5, lineHeight: 1,
    border: `1px solid ${DS.hair}`,
  };
}

function OutcomePill({ outcome }: { outcome: "winner" | "loser" | "neutral" }) {
  if (outcome === "neutral") return null;
  const isWinner = outcome === "winner";
  const c = isWinner ? DS.good : DS.bad;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: alpha(c, 14),
      color: c,
      padding: "3px 9px", borderRadius: 999,
      fontSize: 10, fontWeight: 800, lineHeight: 1,
      letterSpacing: "0.05em", textTransform: "uppercase",
      border: `1px solid ${alpha(c, 30)}`,
    }}>
      {isWinner ? (
        <Trophy style={{ width: 10, height: 10 }} />
      ) : (
        <span style={{
          width: 5, height: 5, borderRadius: 999, background: c, display: "inline-block",
        }} />
      )}
      {isWinner ? "Better pick" : "Second"}
    </span>
  );
}

function DataTierBadge({ tier }: { tier: "full" | "partial" | "limited" }) {
  const c =
    tier === "full" ? DS.good
    : tier === "partial" ? DS.warn
    : DS.muted;
  const label =
    tier === "full" ? "Full data"
    : tier === "partial" ? "Partial data"
    : "Limited data";
  return (
    <span
      title={
        tier === "full" ? "Has eco-score, CO2, nutri-score, and NOVA group."
        : tier === "partial" ? "Has some metrics — others are missing."
        : "OpenFoodFacts has little scoring data on this product."
      }
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        background: alpha(c, 12),
        color: c,
        padding: "3px 7px", borderRadius: 999,
        fontSize: 9.5, fontWeight: 800, lineHeight: 1,
        letterSpacing: "0.03em", textTransform: "uppercase",
        border: `1px solid ${alpha(c, 22)}`,
      }}
    >
      <span style={{
        width: 5, height: 5, borderRadius: 999, background: c, flexShrink: 0,
      }} />
      {label}
    </span>
  );
}

function MetricChip({
  icon: Icon, label, grade, color,
}: {
  icon: typeof Leaf; label: string; grade: string | null | undefined; color: string;
}) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: grade ? alpha(color, 8) : DS.bg,
      padding: "5px 9px", borderRadius: 999,
      fontSize: 11.5, lineHeight: 1,
      border: `1px solid ${grade ? alpha(color, 20) : DS.hair}`,
    }}>
      <Icon style={{ width: 11, height: 11, color: grade ? color : DS.muted }} />
      <span style={{ color: DS.muted, fontWeight: 700, fontSize: 10 }}>{label}</span>
      <span style={{ color: grade ? color : DS.muted, fontWeight: 800 }}>
        {grade ? grade.toUpperCase() : "—"}
      </span>
    </span>
  );
}

function FlagBlock({ flag }: { flag: BrandFlagV2 | null }) {
  if (!flag) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        background: DS.goodBg, color: DS.good,
        padding: "8px 10px", borderRadius: 10,
        fontSize: 12, fontWeight: 700,
      }}>
        <ShieldCheck style={{ width: 13, height: 13 }} />
        Clean ethics record
      </div>
    );
  }
  const top = flag.sources[0];
  return (
    <div style={{
      background: DS.warnBg, borderRadius: 10, padding: "10px 12px", fontSize: 12, lineHeight: 1.4,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <AlertTriangle style={{ width: 12, height: 12, color: DS.warn }} />
        <span style={{ fontWeight: 800, textTransform: "capitalize" }}>{flag.severity}</span>
        <span style={{ color: DS.muted }}>·</span>
        <span style={{ color: DS.muted, textTransform: "capitalize" }}>
          {flag.category.replace(/_/g, " ")}
        </span>
      </div>
      <p style={{ margin: 0, color: DS.ink }}>{flag.summary}</p>
      {top && (
        <a
          href={top.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            color: DS.muted, fontSize: 11, fontWeight: 600,
            marginTop: 6, textDecoration: "none",
          }}
        >
          <ExternalLink style={{ width: 10, height: 10 }} />
          {top.publisher}
        </a>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// VS divider
// ────────────────────────────────────────────────────────────

function VsDivider({ active }: { active: boolean }) {
  return (
    <div style={{
      position: "relative", display: "flex", alignItems: "center",
      justifyContent: "center", margin: "-2px 0",
    }}>
      <div style={{
        position: "absolute", left: 24, right: 24, top: "50%",
        height: 1,
        background: `linear-gradient(to right, transparent, ${DS.hair}, transparent)`,
      }} />
      <div style={{
        width: 44, height: 44, borderRadius: 999,
        background: active ? DS.ink : DS.card,
        color: active ? DS.card : DS.muted,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 800, letterSpacing: 0.3,
        border: `2px solid ${DS.bg}`,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        position: "relative", zIndex: 1,
      }}>
        VS
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────

export default function Compare() {
  const [slotA, setSlotA] = useState<SlotState>({ query: "", loading: false, product: null });
  const [slotB, setSlotB] = useState<SlotState>({ query: "", loading: false, product: null });
  // The input panel collapses (slides away) once a comparison runs, and slides
  // back in when the user edits or starts over.
  const [formOpen, setFormOpen] = useState(true);
  // User priorities weight the verdict; keep them live if changed elsewhere.
  const [priorities, setPriorities] = useState<UserPriorities>(() => loadPriorities());

  useEffect(() => {
    const handler = () => setPriorities(loadPriorities());
    window.addEventListener("prioritiesUpdated", handler);
    return () => window.removeEventListener("prioritiesUpdated", handler);
  }, []);

  const updateSlot = (slot: Slot, patch: Partial<SlotState>) => {
    if (slot === "A") setSlotA((s) => ({ ...s, ...patch }));
    else setSlotB((s) => ({ ...s, ...patch }));
  };

  const resetAll = () => {
    setSlotA({ query: "", loading: false, product: null });
    setSlotB({ query: "", loading: false, product: null });
    setFormOpen(true);
  };

  const runPair = async (a: string, b: string) => {
    setFormOpen(false); // slide the input panel away as results come in
    setSlotA({ query: a, loading: true, product: null });
    setSlotB({ query: b, loading: true, product: null });
    try {
      const [matchA, matchB] = await Promise.all([
        smartProductSearch(a).catch(() => ({ product: null, noMatch: true } as const)),
        smartProductSearch(b).catch(() => ({ product: null, noMatch: true } as const)),
      ]);
      setSlotA({ query: a, loading: false, product: matchA.product ?? null });
      setSlotB({ query: b, loading: false, product: matchB.product ?? null });
      if (!matchA.product) toast.error(`No good match for “${a}”`);
      if (!matchB.product) toast.error(`No good match for “${b}”`);
    } catch {
      toast.error("Search failed.");
      updateSlot("A", { loading: false });
      updateSlot("B", { loading: false });
    }
  };

  const both = slotA.product && slotB.product;
  const verdict = both ? computeVerdict(slotA.product!, slotB.product!, priorities) : null;
  const outcomeFor = (slot: Slot): "winner" | "loser" | "neutral" => {
    if (!verdict || verdict.leader === "tie") return "neutral";
    return verdict.leader === slot ? "winner" : "loser";
  };

  // Results exist once a comparison has been kicked off (loading or loaded).
  const showResults = !!(slotA.product || slotB.product || slotA.loading || slotB.loading);

  return (
    <div style={{
      background: DS.bg, minHeight: "100dvh", fontFamily: DS.font, color: DS.ink,
    }}>
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "0 18px 110px" }}>
        {/* Header */}
        <header style={{
          display: "flex", alignItems: "center", gap: 16,
          paddingTop: "max(24px, calc(env(safe-area-inset-top, 0px) + 16px))",
          paddingBottom: 18,
        }}>
          <BackButton />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 10.5, fontWeight: 800, color: DS.muted,
              letterSpacing: "0.1em", textTransform: "uppercase",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <GitCompareArrows style={{ width: 12, height: 12 }} />
              Compare
            </div>
            <h1 style={{
              fontSize: 26, fontWeight: 800, margin: "4px 0 0",
              letterSpacing: -0.7, lineHeight: 1.1,
            }}>
              Two products,<br />
              <span style={{ color: DS.muted, fontWeight: 600, fontStyle: "italic" }}>
                one honest verdict.
              </span>
            </h1>
          </div>
        </header>

        {/* ── Collapsible input panel — slides away once a comparison runs ── */}
        <div
          aria-hidden={!formOpen}
          style={{
            display: "grid",
            gridTemplateRows: formOpen ? "1fr" : "0fr",
            opacity: formOpen ? 1 : 0,
            transform: formOpen ? "translateY(0)" : "translateY(-10px)",
            pointerEvents: formOpen ? "auto" : "none",
            transition:
              "grid-template-rows 420ms cubic-bezier(0.22,1,0.36,1), " +
              "opacity 260ms ease, transform 420ms cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <div style={{ overflow: "hidden", minHeight: 0 }}>
            {/* Quick pairs — only while there are no results to show */}
            {!showResults && (
              <section style={{ marginBottom: 14 }}>
                <div style={{
                  fontSize: 10.5, fontWeight: 800, color: DS.muted,
                  letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <Sparkles style={{ width: 12, height: 12 }} />
                  Quick pairs
                </div>
                <div style={{
                  display: "flex", gap: 8, overflowX: "auto",
                  paddingBottom: 4, scrollbarWidth: "none",
                }}>
                  {QUICK_PAIRS.map((p) => (
                    <button
                      key={`${p.a}-${p.b}`}
                      onClick={() => runPair(p.a, p.b)}
                      style={{
                        flexShrink: 0,
                        background: DS.card, border: `1px solid ${DS.hair}`,
                        borderRadius: 14, padding: "10px 14px", textAlign: "left",
                        cursor: "pointer", fontFamily: DS.font,
                        minWidth: 170,
                      }}
                    >
                      <div style={{
                        fontSize: 10, fontWeight: 800, color: DS.muted,
                        letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4,
                      }}>
                        {p.tag}
                      </div>
                      <div style={{
                        fontSize: 13, fontWeight: 700, color: DS.ink,
                        display: "flex", alignItems: "center", gap: 6,
                      }}>
                        {p.a}
                        <span style={{ color: DS.muted, fontWeight: 600, fontSize: 10 }}>VS</span>
                        {p.b}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Single-step search form — both inputs, one Compare button. */}
            <UnifiedCompareForm
              initialA={slotA.query}
              initialB={slotB.query}
              loading={slotA.loading || slotB.loading}
              onCompare={runPair}
            />
          </div>
        </div>

        {/* ── Compact "comparing" bar — appears once the panel has slid away ── */}
        {!formOpen && (
          <button
            onClick={() => setFormOpen(true)}
            className="cmp-editbar"
            style={{
              width: "100%", marginBottom: 12,
              display: "flex", alignItems: "center", gap: 8,
              background: DS.card, border: `1px solid ${DS.hair}`,
              borderRadius: 14, padding: "11px 14px",
              cursor: "pointer", fontFamily: DS.font, textAlign: "left",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <GitCompareArrows style={{ width: 14, height: 14, color: DS.muted, flexShrink: 0 }} />
            <span style={{
              flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: DS.ink,
              display: "flex", alignItems: "center", gap: 6,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{slotA.query || "Product A"}</span>
              <span style={{ color: DS.muted, fontWeight: 600, fontSize: 10, flexShrink: 0 }}>VS</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{slotB.query || "Product B"}</span>
            </span>
            <span style={{
              flexShrink: 0, fontSize: 11.5, fontWeight: 800, color: DS.brand,
              letterSpacing: "0.03em", textTransform: "uppercase",
            }}>
              Edit
            </span>
          </button>
        )}

        {/* ── Result cards — only after a comparison is initiated ── */}
        {showResults && (
          <div className="cmp-results">
            {/* Verdict first — lead with the answer, supporting detail below. */}
            {both && verdict && (
              <Verdict a={slotA.product!} b={slotB.product!} verdict={verdict} priorities={priorities} />
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <ProductSlot
                slot="A" state={slotA} outcome={outcomeFor("A")}
                onClear={() => setSlotA({ query: "", loading: false, product: null })}
              />
              <VsDivider active={!!both} />
              <ProductSlot
                slot="B" state={slotB} outcome={outcomeFor("B")}
                onClear={() => setSlotB({ query: "", loading: false, product: null })}
              />
            </div>

            {/* Reset */}
            <div style={{ marginTop: 14, textAlign: "center" }}>
              <button
                onClick={resetAll}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "transparent", border: `1px solid ${DS.hair}`,
                  borderRadius: 999, padding: "8px 16px",
                  fontSize: 12, fontWeight: 700, color: DS.muted,
                  cursor: "pointer", fontFamily: DS.font,
                }}
              >
                <Plus style={{ width: 12, height: 12, transform: "rotate(45deg)" }} />
                Start a new comparison
              </button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          /* Transform-only entrances: content is always opaque, so it can never
             get stuck invisible if the animation is skipped or frozen. */
          @keyframes cmpIn { from { transform: translateY(14px); } to { transform: translateY(0); } }
          @keyframes cmpFade { from { transform: translateY(-6px); } to { transform: translateY(0); } }
          .cmp-results { animation: cmpIn 440ms cubic-bezier(0.22,1,0.36,1); }
          .cmp-editbar { animation: cmpFade 320ms ease; }
          @media (prefers-reduced-motion: reduce) {
            .cmp-results, .cmp-editbar { animation: none; }
          }
        `}</style>
      </main>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Verdict card
// ────────────────────────────────────────────────────────────

function Verdict({
  a, b, verdict, priorities,
}: {
  a: OpenFoodFactsResult;
  b: OpenFoodFactsResult;
  verdict: VerdictResult;
  priorities: UserPriorities;
}) {
  const { points, aWins, bWins, leader, personalized } = verdict;
  const leaderProduct = leader === "A" ? a : leader === "B" ? b : null;
  const leaderWins = leader === "A" ? aWins : leader === "B" ? bWins : 0;
  // Leader hero color: green when a clear winner exists; muted on tie.
  const leaderColor = leaderProduct ? DS.good : DS.muted;

  return (
    <section style={{
      marginBottom: 14, background: DS.card, borderRadius: 22,
      overflow: "hidden",
      boxShadow: "0 4px 18px rgba(0,0,0,0.08)",
      border: `1px solid ${DS.hair}`,
    }}>
      {/* hero banner */}
      <div style={{
        background: leaderProduct
          ? `linear-gradient(135deg, ${leaderColor}, color-mix(in srgb, ${leaderColor} 80%, black))`
          : `linear-gradient(135deg, ${DS.muted}, color-mix(in srgb, ${DS.muted} 80%, black))`,
        color: DS.card,
        padding: "18px 20px 16px",
      }}>
        <div style={{
          fontSize: 10.5, fontWeight: 800, opacity: 0.85,
          letterSpacing: "0.1em", textTransform: "uppercase",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <Trophy style={{ width: 12, height: 12 }} />
          Verdict
          {personalized && (
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: "0.04em",
              padding: "2px 7px", borderRadius: 999,
              background: "rgba(255,255,255,0.22)", marginLeft: 2,
            }}>
              YOUR VALUES
            </span>
          )}
        </div>
        {leaderProduct ? (
          <>
            <div style={{
              fontSize: 22, fontWeight: 800, marginTop: 4,
              letterSpacing: -0.4, lineHeight: 1.2,
            }}>
              {leaderProduct.productName || `Product ${leader}`}
            </div>
            <div style={{
              fontSize: 12.5, opacity: 0.85, marginTop: 4, fontWeight: 600,
            }}>
              {personalized
                ? "Best match for the values you set."
                : `Wins on ${leaderWins} of ${points.length} measure${points.length === 1 ? "" : "s"}.`}
            </div>
          </>
        ) : (
          <>
            <div style={{
              fontSize: 22, fontWeight: 800, marginTop: 4,
              letterSpacing: -0.4, lineHeight: 1.2,
            }}>
              {points.length === 0 ? "Not enough data" : "It's a tie"}
            </div>
            <div style={{ fontSize: 12.5, opacity: 0.85, marginTop: 4, fontWeight: 600 }}>
              {points.length === 0
                ? "We need scored data on both to call a winner."
                : "Even split on what you care about — pick either."}
            </div>
          </>
        )}
      </div>

      {/* points list */}
      {points.length > 0 && (
        <div style={{ padding: 14 }}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            {points.map((p, i) => {
              const winnerName = p.winner === "A"
                ? (a.productName?.split(" ")[0] || "Product A")
                : (b.productName?.split(" ")[0] || "Product B");
              const tag = priorityTag(p.weight);
              const counted = !tag.muted;
              // Counted measures read green; ignored ones go muted so it's clear
              // they didn't sway the verdict.
              const wColor = counted ? DS.good : DS.muted;
              return (
                <li key={i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", background: DS.bg, borderRadius: 12,
                  opacity: counted ? 1 : 0.65,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 9,
                    background: alpha(wColor, 10), color: wColor,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <p.icon style={{ width: 14, height: 14 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: DS.ink, lineHeight: 1.2 }}>
                        {p.label}
                      </span>
                      {personalized && (
                        <span style={{
                          fontSize: 9, fontWeight: 800, letterSpacing: "0.02em", textTransform: "uppercase",
                          padding: "2px 6px", borderRadius: 999,
                          color: tag.muted ? DS.muted : DS.brand,
                          background: tag.muted ? "transparent" : alpha(DS.brand, 10),
                          border: `1px solid ${tag.muted ? DS.hair : alpha(DS.brand, 22)}`,
                        }}>
                          {tag.text}
                        </span>
                      )}
                    </div>
                    {p.note && (
                      <div style={{ fontSize: 11, color: DS.muted, marginTop: 2, fontFeatureSettings: "'tnum'" }}>
                        {p.note}
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 800,
                    padding: "5px 10px", borderRadius: 999,
                    color: wColor, background: alpha(wColor, 10),
                    border: `1px solid ${alpha(wColor, 20)}`,
                    display: "inline-flex", alignItems: "center", gap: 4,
                  }}>
                    <CheckCircle2 style={{ width: 11, height: 11 }} />
                    {winnerName}
                  </span>
                </li>
              );
            })}
          </ul>

          {/* Footer — transparency + jump to priorities */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 10, flexWrap: "wrap", margin: "12px 4px 0",
          }}>
            <p style={{ fontSize: 11, color: DS.muted, lineHeight: 1.45, margin: 0, fontStyle: "italic", flex: 1, minWidth: 160 }}>
              {personalized
                ? "Weighted by the priorities you set — not a recommendation."
                : "Set your priorities to tailor this verdict to what matters to you."}
            </p>
            <Link to="/preferences" style={{
              display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0,
              padding: "6px 11px", borderRadius: 999,
              background: alpha(DS.brand, 10), color: DS.brand,
              border: `1px solid ${alpha(DS.brand, 22)}`,
              fontSize: 11, fontWeight: 800, textDecoration: "none",
            }}>
              <SlidersHorizontal style={{ width: 12, height: 12 }} />
              {personalized ? "Adjust" : "Set priorities"}
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
