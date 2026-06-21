import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronRight, Package2, Share2, MapPin } from "lucide-react";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";
import { DS } from "@/styles/design-tokens";
import {
  getSwaps, type SwapResult, type SwapSuggestion, type ProductConcern,
} from "@/services/swaps";
import { CATEGORY_LABELS, type SwapCategoryKey } from "@/data/ethicalAlternatives";
import { recordSwap } from "@/utils/swapTracking";
import { shareSwapCard } from "@/utils/shareCard";
import { CERTIFICATION_BADGES } from "@/utils/verifiedEthics";
import {
  loadRegion, regionPlaceLabel, findCountry,
  REGION_EVENT, type UserRegion,
} from "@/utils/userRegion";
import { loadPriorities } from "@/utils/userPreferences";
import { RegionPicker } from "@/components/RegionPicker";
import { toast } from "sonner";

const GRADE_CO2: Record<string, number> = { a: 0.5, b: 1.2, c: 2.5, d: 4.0, e: 6.0 };

function origCo2(p: OpenFoodFactsResult): number | null {
  return (
    p.ecoscoreData?.agribalyse?.co2_total ??
    (p.carbonFootprint100g != null ? p.carbonFootprint100g * 10 : null) ??
    (p.ecoscoreGrade ? GRADE_CO2[p.ecoscoreGrade.toLowerCase()] ?? null : null)
  );
}

function shortConcernLabel(primary: ProductConcern, categoryKey: SwapCategoryKey | null): string {
  const cat = categoryKey ? CATEGORY_LABELS[categoryKey] : "sourcing";
  switch (primary.type) {
    case "labor": return `labour-flagged ${cat}`;
    case "boycott": return "a boycott-listed brand";
    case "animal_welfare": return "animal-welfare concerns";
    case "eco": return `a high-carbon ${cat}`;
  }
}

// ── Small editorial pieces ────────────────────────────────────────────────────

/** Replica of OpenFoodFactsDetail's SectionHead so this slots into the flow. */
function EditorialHead({ num, title, kicker }: { num: string; title: string; kicker?: string }) {
  return (
    <div style={{ padding: "0 0 14px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span style={{ fontStyle: "italic", fontSize: 13, color: DS.muted }}>{num}</span>
        <span style={{ fontSize: 24, color: DS.ink, letterSpacing: -0.4, fontWeight: 600 }}>{title}</span>
      </div>
      {kicker && (
        <div style={{ fontSize: 12.5, color: DS.ink2, marginTop: 4, marginLeft: 26, lineHeight: 1.5 }}>
          {kicker}
        </div>
      )}
    </div>
  );
}

function GradeSquare({ grade }: { grade: string | null }) {
  // A swap is only ever surfaced because it's a better choice for the user's
  // priorities, so its badge always reads green/positive regardless of the raw
  // eco letter — never amber/red.
  return (
    <div style={{ textAlign: "center", flexShrink: 0 }}>
      <div style={{
        width: 38, height: 38, borderRadius: 11,
        background: DS.goodBg, color: DS.good,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 17, fontWeight: 800,
      }}>
        {grade ? grade.toUpperCase() : "✓"}
      </div>
      <div style={{ fontSize: 8.5, color: DS.good, marginTop: 3, letterSpacing: 0.4, textTransform: "uppercase" }}>
        Better
      </div>
    </div>
  );
}

function ProductThumb({ url, alt, size = 56 }: { url: string | null; alt: string; size?: number }) {
  if (url) {
    return (
      <img src={url} alt={alt} style={{
        width: size, height: size, borderRadius: 14, objectFit: "contain",
        border: `1px solid ${DS.hair}`, background: "#fff", flexShrink: 0,
      }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: 14, border: `1px solid ${DS.hair}`,
      background: DS.bg, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Package2 style={{ width: size * 0.34, height: size * 0.34, color: DS.muted }} />
    </div>
  );
}

function CertPills({ certs }: { certs: string[] }) {
  if (certs.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
      {certs.slice(0, 3).map((c) => {
        const badge = CERTIFICATION_BADGES[c as keyof typeof CERTIFICATION_BADGES];
        if (!badge) return null;
        return (
          <span key={c} style={{
            fontSize: 9.5, fontWeight: 800, padding: "2px 7px", borderRadius: 999,
            background: badge.bg, color: badge.color,
          }}>
            {badge.shortLabel}
          </span>
        );
      })}
    </div>
  );
}

function CustomTag() {
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase",
      padding: "2px 7px", borderRadius: 999, background: DS.ink, color: DS.card,
    }}>
      Editor's pick
    </span>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface SwapSuggestionsProps {
  product: OpenFoodFactsResult;
  /** Editorial section number, e.g. "03". */
  sectionNumber?: string;
  /**
   * Reports whether any cleaner picks actually render. Lets the parent (and the
   * DecisionBar) avoid promising "see a cleaner pick below" when there are none.
   * null = still resolving.
   */
  onAvailabilityChange?: (hasSwaps: boolean | null) => void;
}

export function SwapSuggestions({ product, sectionNumber = "03", onAvailabilityChange }: SwapSuggestionsProps) {
  const navigate = useNavigate();
  const [result, setResult] = useState<SwapResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [region, setRegion] = useState<UserRegion | null>(() => loadRegion());
  const [showRegionPicker, setShowRegionPicker] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const priorities = loadPriorities();
    getSwaps(product, { region: loadRegion(), priorities, limit: 4 })
      .then((res) => { if (!cancelled) setResult(res); })
      .catch(() => { if (!cancelled) setResult(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [product, region]);

  useEffect(() => {
    const sync = () => setRegion(loadRegion());
    window.addEventListener(REGION_EVENT, sync);
    return () => window.removeEventListener(REGION_EVENT, sync);
  }, []);

  // Tell the parent whether any cleaner picks will actually render. Mirrors the
  // exact render condition below (null returns nothing). null while loading.
  useEffect(() => {
    if (loading) { onAvailabilityChange?.(null); return; }
    const hasSwaps = !!(result && result.diagnosis.primary && result.suggestions.length > 0);
    onAvailabilityChange?.(hasSwaps);
  }, [loading, result, onAvailabilityChange]);

  const origC = useMemo(() => origCo2(product), [product]);
  const co2SavedFor = (s: SwapSuggestion): number | null => {
    if (origC == null || s.co2Kg == null) return null;
    const diff = origC - s.co2Kg;
    return diff > 0 ? Math.round(diff * 10) / 10 : 0;
  };
  const pctSavedFor = (s: SwapSuggestion): number | null => {
    const saved = co2SavedFor(s);
    if (saved == null || origC == null || origC <= 0 || saved <= 0) return null;
    return Math.round((saved / origC) * 100);
  };

  if (loading) {
    return (
      <div>
        <EditorialHead num={sectionNumber} title="Better swaps" />
        <div style={{ background: DS.card, border: `1px solid ${DS.hair}`, borderRadius: 22, padding: 20, opacity: 0.6 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: 14, background: DS.bg, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 16, width: "55%", background: DS.hair, borderRadius: 7, marginBottom: 9 }} />
              <div style={{ height: 11, width: "75%", background: DS.hair, borderRadius: 6 }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!result || !result.diagnosis.primary || result.suggestions.length === 0) return null;

  const { diagnosis, suggestions } = result;
  const primary = diagnosis.primary;
  const best = suggestions[0];
  const rest = suggestions.slice(1);
  const concernLabel = shortConcernLabel(primary, diagnosis.categoryKey);
  const categoryLabel = diagnosis.categoryKey ? CATEGORY_LABELS[diagnosis.categoryKey] : "option";
  const certShort = (s: SwapSuggestion) =>
    s.certifications.map((c) => CERTIFICATION_BADGES[c]?.shortLabel).filter(Boolean) as string[];

  const kicker = `${product.brand || "This product"} has ${primary.label.toLowerCase()}. `
    + `A cleaner ${categoryLabel}${region ? `, sold in ${region.country}` : ""}.`;

  const handleSwitch = (s: SwapSuggestion) => {
    recordSwap({
      timestamp: Date.now(),
      fromBarcode: product.barcode,
      fromName: product.productName || "Unknown",
      fromBrand: product.brand,
      toBarcode: s.barcode || s.brand,
      toName: s.productName,
      toBrand: s.brand,
      co2SavedKg: co2SavedFor(s),
      concernAvoided: primary.type,
      categoryKey: diagnosis.categoryKey,
      regionCountry: region?.countryCode ?? null,
    });
    if (s.barcode) navigate(`/product-off/${s.barcode}`);
  };

  const handleShare = async (s: SwapSuggestion) => {
    if (sharing) return;
    setSharing(true);
    try {
      const res = await shareSwapCard({
        fromName: product.productName || "Current product",
        fromBrand: product.brand,
        toName: s.productName,
        toBrand: s.brand,
        co2SavedKg: co2SavedFor(s),
        pctSaved: pctSavedFor(s),
        concernLabel,
        certifications: certShort(s),
        regionLabel: regionPlaceLabel(region),
      });
      if (res === "downloaded") toast.success("Swap card downloaded");
      else if (res === "shared") toast.success("Shared");
      else toast.error("Couldn't generate share card");
    } finally {
      setSharing(false);
    }
  };

  const saved = co2SavedFor(best);
  const pct = pctSavedFor(best);
  const heroStrength = best.strengths[0] ?? null;
  const flag = findCountry(region?.countryCode)?.flag ?? "";

  return (
    <div>
      <EditorialHead num={sectionNumber} title="Better swaps" kicker={kicker} />

      {/* Hero recommendation */}
      <div style={{ background: DS.card, border: `1px solid ${DS.hair}`, borderRadius: 22, overflow: "hidden" }}>
        <div style={{ padding: "18px 20px", display: "flex", gap: 16, alignItems: "center" }}>
          <ProductThumb url={best.imageUrl} alt={best.brand} size={72} />
          <div style={{ flex: 1, minWidth: 0 }}>
            {best.custom && <div style={{ marginBottom: 6 }}><CustomTag /></div>}
            <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: -0.4, color: DS.ink, lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis" }}>
              {best.brand}
            </div>
            {heroStrength && (
              <div style={{ fontSize: 12.5, color: DS.ink2, marginTop: 5, lineHeight: 1.4 }}>
                {heroStrength}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 9, flexWrap: "wrap" }}>
              <CertPills certs={certShort(best)} />
              {region && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: best.regionAvailable ? DS.good : DS.muted }}>
                  <MapPin style={{ width: 11, height: 11 }} /> {best.availabilityLabel}
                </span>
              )}
            </div>
          </div>
          <GradeSquare grade={best.ecoGrade} />
        </div>

        {/* Stat + action bar */}
        <div style={{
          borderTop: `1px solid ${DS.hair}`, padding: "13px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <div style={{ minWidth: 0 }}>
            {saved != null && saved > 0 ? (
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: -1, color: DS.ink, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>−{saved}</span>
                <span style={{ fontSize: 11.5, color: DS.ink2 }}>kg CO₂{pct != null ? ` · ${pct}% less` : ""}</span>
              </div>
            ) : (
              <span style={{ fontSize: 13.5, color: DS.ink2, fontStyle: "italic" }}>A cleaner supply chain</span>
            )}
            <div style={{ fontSize: 10.5, color: DS.muted, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              instead of {product.brand || product.productName || "this product"}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleSwitch(best)}
            style={{
              flexShrink: 0, height: 42, padding: "0 18px", borderRadius: 12, border: "none",
              background: DS.ink, color: DS.card, fontWeight: 800, fontSize: 13.5,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontFamily: DS.font,
            }}
          >
            Switch <ArrowRight style={{ width: 15, height: 15 }} />
          </button>
        </div>
      </div>

      {/* Quiet list of further options */}
      {rest.length > 0 && (
        <div style={{ marginTop: 10, background: DS.card, border: `1px solid ${DS.hair}`, borderRadius: 18, overflow: "hidden" }}>
          {rest.map((s, i) => {
            const sv = co2SavedFor(s);
            const meta = region && s.regionAvailable
              ? [certShort(s)[0], s.availabilityLabel].filter(Boolean).join(" · ")
              : (certShort(s).join(" · ") || s.productName);
            return (
              <button
                key={`${s.barcode || s.brand}-${i}`}
                type="button"
                onClick={() => (s.barcode ? navigate(`/product-off/${s.barcode}`) : handleSwitch(s))}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 16px", background: "none", cursor: "pointer", textAlign: "left",
                  border: "none", borderTop: i > 0 ? `1px solid ${DS.hair}` : "none", fontFamily: DS.font,
                }}
              >
                <ProductThumb url={s.imageUrl} alt={s.brand} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: DS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.brand}</span>
                    {s.custom && <span style={{ width: 6, height: 6, borderRadius: 99, background: DS.ink, flexShrink: 0 }} />}
                  </div>
                  <div style={{ fontSize: 11.5, color: DS.muted, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.ecoGrade ? `Eco ${s.ecoGrade.toUpperCase()} · ` : ""}{meta}
                  </div>
                </div>
                {sv != null && sv > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: DS.good, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>−{sv}kg</span>
                )}
                <ChevronRight style={{ width: 16, height: 16, color: DS.muted, flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
      )}

      {/* Quiet footer: share · region */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
        <button
          type="button"
          onClick={() => handleShare(best)}
          disabled={sharing}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "none", border: "none", padding: 0,
            color: DS.ink2, fontSize: 12.5, fontWeight: 700,
            cursor: sharing ? "not-allowed" : "pointer", fontFamily: DS.font,
          }}
        >
          <Share2 style={{ width: 14, height: 14 }} /> Share this swap
        </button>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() => setShowRegionPicker((v) => !v)}
          style={{
            background: "none", border: "none", padding: 0,
            color: region ? DS.muted : DS.good, fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: DS.font,
          }}
        >
          {region ? `${flag} ${region.country} · Change` : "Set your country →"}
        </button>
      </div>

      {showRegionPicker && (
        <div style={{ marginTop: 12 }}>
          <RegionPicker
            compact
            onSaved={() => { setShowRegionPicker(false); setRegion(loadRegion()); }}
            onCancel={() => setShowRegionPicker(false)}
          />
        </div>
      )}

      <p style={{ fontSize: 11, color: DS.muted, lineHeight: 1.45, margin: "14px 0 0", fontStyle: "italic" }}>
        Curated brands recognised for {concernLabel.includes("carbon") ? "lower-impact sourcing" : "stronger ethics"}.
        Certifications reduce risk but don't guarantee a flawless supply chain — verify before you buy.
      </p>
    </div>
  );
}
