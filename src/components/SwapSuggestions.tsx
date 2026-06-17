import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Package2, TrendingDown, Share2, Sparkles,
  MapPin, ChevronDown, Check,
} from "lucide-react";
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
  loadRegion, regionPlaceLabel,
  REGION_EVENT, type UserRegion,
} from "@/utils/userRegion";
import { loadPriorities } from "@/utils/userPreferences";
import { RegionPicker } from "@/components/RegionPicker";
import { toast } from "sonner";

const GRADE_CO2: Record<string, number> = { a: 0.5, b: 1.2, c: 2.5, d: 4.0, e: 6.0 };

const GRADE_COLORS: Record<string, { text: string; bg: string }> = {
  a: { text: "#10b981", bg: "#F0FAF6" },
  b: { text: "#84cc16", bg: "#F7FAF0" },
  c: { text: "#f59e0b", bg: "#FFFBEB" },
  d: { text: "#f97316", bg: "#FFF5EE" },
  e: { text: "#ef4444", bg: "#FFF0F0" },
};

function origCo2(p: OpenFoodFactsResult): number | null {
  return (
    p.ecoscoreData?.agribalyse?.co2_total ??
    (p.carbonFootprint100g != null ? p.carbonFootprint100g * 10 : null) ??
    (p.ecoscoreGrade ? GRADE_CO2[p.ecoscoreGrade.toLowerCase()] ?? null : null)
  );
}

function shortConcernLabel(primary: ProductConcern, categoryKey: SwapCategoryKey | null): string {
  const cat = categoryKey ? CATEGORY_LABELS[categoryKey].toLowerCase() : "sourcing";
  switch (primary.type) {
    case "labor": return `labour-flagged ${cat}`;
    case "boycott": return "a boycott-listed brand";
    case "animal_welfare": return "animal-welfare concerns";
    case "eco": return `a high-carbon ${cat}`;
  }
}

function GradeBadge({ grade }: { grade: string | null }) {
  if (!grade) return null;
  const s = GRADE_COLORS[grade] ?? { text: DS.muted, bg: DS.bg };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      minWidth: 22, height: 22, padding: "0 6px", borderRadius: 6,
      background: s.bg, color: s.text, fontSize: "0.72rem", fontWeight: 800,
    }}>
      {grade.toUpperCase()}
    </span>
  );
}

function CertRow({ certs }: { certs: string[] }) {
  if (certs.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
      {certs.slice(0, 4).map((c) => {
        const badge = CERTIFICATION_BADGES[c as keyof typeof CERTIFICATION_BADGES];
        if (!badge) return null;
        return (
          <span key={c} style={{
            fontSize: "0.66rem", fontWeight: 800, padding: "2px 8px", borderRadius: 999,
            background: badge.bg, color: badge.color,
          }}>
            {badge.shortLabel}
          </span>
        );
      })}
    </div>
  );
}

function ProductThumb({ url, alt, size = 56 }: { url: string | null; alt: string; size?: number }) {
  if (url) {
    return (
      <img src={url} alt={alt} style={{
        width: size, height: size, borderRadius: 12, objectFit: "contain",
        border: `1px solid ${DS.hair}`, background: "#fff", flexShrink: 0,
      }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: 12, border: `1px solid ${DS.hair}`,
      background: DS.bg, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Package2 style={{ width: size * 0.36, height: size * 0.36, color: DS.muted }} />
    </div>
  );
}

interface SwapSuggestionsProps {
  product: OpenFoodFactsResult;
}

export function SwapSuggestions({ product }: SwapSuggestionsProps) {
  const navigate = useNavigate();
  const [result, setResult] = useState<SwapResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [region, setRegion] = useState<UserRegion | null>(() => loadRegion());
  const [showRegionPicker, setShowRegionPicker] = useState(false);

  // (Re)compute swaps when the product or the saved region changes.
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
      <div style={{ background: DS.card, borderRadius: 20, border: `1px solid ${DS.hair}`, padding: 18, opacity: 0.6 }}>
        <div style={{ height: 14, width: 140, background: DS.hair, borderRadius: 7, marginBottom: 10 }} />
        <div style={{ height: 11, width: 200, background: DS.hair, borderRadius: 6, marginBottom: 18 }} />
        <div style={{ height: 92, background: DS.bg, borderRadius: 14 }} />
      </div>
    );
  }

  if (!result || !result.diagnosis.primary || result.suggestions.length === 0) return null;

  const { diagnosis, suggestions } = result;
  const primary = diagnosis.primary;
  const best = suggestions[0];
  const rest = suggestions.slice(1);
  const concernLabel = shortConcernLabel(primary, diagnosis.categoryKey);
  const categoryLabel = diagnosis.categoryKey ? CATEGORY_LABELS[diagnosis.categoryKey] : null;
  const certShort = (s: SwapSuggestion) =>
    s.certifications.map((c) => CERTIFICATION_BADGES[c]?.shortLabel).filter(Boolean) as string[];

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
    toast.success(`Switched to ${s.brand}`, {
      description: primary.type === "eco"
        ? "Logged as a greener swap."
        : `Logged — you avoided ${concernLabel}.`,
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

  return (
    <div style={{
      background: DS.card, borderRadius: 22,
      border: `1px solid ${DS.hair}`, borderLeft: `4px solid ${DS.good}`,
      overflow: "hidden",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    }}>
      <div style={{ padding: "18px 18px 16px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9, background: DS.goodBg,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Sparkles style={{ width: 16, height: 16, color: DS.good }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: DS.ink, lineHeight: 1.15 }}>
              {categoryLabel ? `Better ${categoryLabel}` : "Better swaps"}
            </div>
            <div style={{ fontSize: 11, color: DS.muted, marginTop: 1 }}>
              {region ? `Same shelf · sold in ${region.country}` : "Same category · cleaner brands"}
            </div>
          </div>
        </div>

        {/* Why we're suggesting a swap */}
        <div style={{
          display: "flex", gap: 8, alignItems: "flex-start",
          background: DS.warnBg, borderRadius: 12, padding: "10px 12px",
          marginBottom: 14,
        }}>
          <TrendingDown style={{ width: 15, height: 15, color: DS.warn, flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12.5, color: DS.ink, lineHeight: 1.4 }}>
            <strong style={{ fontWeight: 800 }}>{product.brand || "This product"}</strong>{" "}
            has {primary.label.toLowerCase()}. Here {rest.length > 0 ? "are" : "is a"} better
            {" "}{categoryLabel || "option"}{rest.length > 0 ? " options" : ""}{region ? ` you can buy in ${region.country}` : ""}.
          </div>
        </div>

        {/* Region line / prompt */}
        {region ? (
          <div style={{
            display: "flex", alignItems: "center", gap: 6, marginBottom: 14,
            fontSize: 12, color: DS.muted,
          }}>
            <MapPin style={{ width: 13, height: 13, color: DS.good }} />
            <span>Top pick: <strong style={{ color: best.regionAvailable ? DS.good : DS.ink, fontWeight: 700 }}>{best.availabilityLabel}</strong></span>
            <button
              onClick={() => setShowRegionPicker((v) => !v)}
              style={{ marginLeft: "auto", background: "none", border: "none", color: DS.muted, fontSize: 11.5, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
            >
              Change
            </button>
          </div>
        ) : !showRegionPicker ? (
          <button
            onClick={() => setShowRegionPicker(true)}
            style={{
              width: "100%", marginBottom: 14, padding: "10px 12px",
              display: "flex", alignItems: "center", gap: 8,
              background: DS.bg, border: `1px dashed ${DS.hair}`, borderRadius: 12,
              cursor: "pointer", fontFamily: DS.font, textAlign: "left",
            }}
          >
            <MapPin style={{ width: 15, height: 15, color: DS.good, flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: DS.ink, fontWeight: 600 }}>
              Set your country to see swaps sold near you
            </span>
            <ChevronDown style={{ width: 14, height: 14, color: DS.muted, marginLeft: "auto" }} />
          </button>
        ) : null}

        {showRegionPicker && (
          <div style={{ marginBottom: 14 }}>
            <RegionPicker
              compact
              onSaved={() => { setShowRegionPicker(false); setRegion(loadRegion()); }}
              onCancel={() => setShowRegionPicker(false)}
            />
          </div>
        )}

        {/* From → To mini comparison */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{
            flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8,
            padding: 8, borderRadius: 12, border: `1px solid ${DS.hair}`, background: DS.bg,
            opacity: 0.85,
          }}>
            <ProductThumb url={product.imageUrl} alt={product.productName || "Current"} size={40} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: DS.muted, textTransform: "uppercase", letterSpacing: 0.3 }}>From</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: DS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {product.brand || product.productName}
              </div>
            </div>
          </div>
          <div style={{
            flexShrink: 0, width: 26, height: 26, borderRadius: "50%", background: DS.goodBg,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ArrowRight style={{ width: 13, height: 13, color: DS.good }} />
          </div>
          <div style={{ flex: 1, minWidth: 0, padding: 8, borderRadius: 12, border: `1px solid ${DS.good}`, background: DS.goodBg }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: DS.good, textTransform: "uppercase", letterSpacing: 0.3 }}>Swap to</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: DS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {best.brand}
            </div>
          </div>
        </div>

        {/* Best suggestion — detailed card */}
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <ProductThumb url={best.imageUrl} alt={best.brand} size={64} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: DS.ink, lineHeight: 1.2 }}>{best.brand}</div>
              <GradeBadge grade={best.ecoGrade} />
            </div>
            <div style={{ fontSize: 12, color: DS.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {best.productName}
            </div>
            <CertRow certs={certShort(best)} />
            {region && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8,
                fontSize: 10.5, fontWeight: 700,
                color: best.regionAvailable ? DS.good : DS.muted,
                background: best.regionAvailable ? DS.goodBg : DS.bg,
                border: `1px solid ${best.regionAvailable ? "transparent" : DS.hair}`,
                padding: "2px 8px", borderRadius: 999,
              }}>
                <MapPin style={{ width: 11, height: 11 }} /> {best.availabilityLabel}
              </div>
            )}
          </div>
          {saved != null && saved > 0 && (
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: DS.good, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                −{saved}kg
              </div>
              <div style={{ fontSize: 9.5, color: DS.muted, marginTop: 2 }}>
                CO₂{pct != null ? ` · ${pct}%` : ""}
              </div>
            </div>
          )}
        </div>

        {/* Strengths */}
        {best.strengths.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 14px", display: "grid", gap: 5 }}>
            {best.strengths.slice(0, 2).map((s, i) => (
              <li key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start", fontSize: 12, color: DS.ink2 }}>
                <Check style={{ width: 13, height: 13, color: DS.good, flexShrink: 0, marginTop: 2 }} />
                {s}
              </li>
            ))}
          </ul>
        )}

        {/* CTA + share */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => handleSwitch(best)}
            style={{
              flex: 1, height: 46, borderRadius: 12, border: "none",
              background: DS.good, color: "#fff", fontWeight: 800, fontSize: 14,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              fontFamily: DS.font,
            }}
          >
            Switch to {best.brand}
          </button>
          <button
            type="button"
            onClick={() => handleShare(best)}
            disabled={sharing}
            aria-label="Share this swap"
            style={{
              width: 46, height: 46, borderRadius: 12,
              border: `1px solid ${DS.hair}`, background: DS.card, color: DS.good,
              cursor: sharing ? "not-allowed" : "pointer", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Share2 style={{ width: 17, height: 17 }} />
          </button>
        </div>

        {/* More alternatives */}
        {rest.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              style={{
                width: "100%", marginTop: 12, background: "none", border: "none",
                fontSize: 12.5, color: DS.muted, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              }}
            >
              {expanded ? "Hide" : `${rest.length} more ethical ${rest.length === 1 ? "option" : "options"}`}
              <ChevronDown style={{ width: 14, height: 14, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </button>

            {expanded && (
              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                {rest.map((s, i) => {
                  const sv = co2SavedFor(s);
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: 10, borderRadius: 12, border: `1px solid ${DS.hair}`, background: DS.bg,
                    }}>
                      <ProductThumb url={s.imageUrl} alt={s.brand} size={42} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: DS.ink }}>{s.brand}</span>
                          <GradeBadge grade={s.ecoGrade} />
                        </div>
                        <div style={{ fontSize: 11, color: DS.muted, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {region && s.regionAvailable
                            ? `${certShort(s)[0] ? certShort(s)[0] + " · " : ""}${s.availabilityLabel}`
                            : (certShort(s).join(" · ") || s.productName)}
                        </div>
                      </div>
                      {sv != null && sv > 0 && (
                        <span style={{ fontSize: 12, fontWeight: 800, color: DS.good, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>−{sv}kg</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSwitch(s)}
                        aria-label={`Switch to ${s.brand}`}
                        style={{
                          flexShrink: 0, width: 34, height: 34, borderRadius: 9, border: "none",
                          background: DS.goodBg, color: DS.good, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <ArrowRight style={{ width: 15, height: 15 }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Honesty footnote */}
        <p style={{ fontSize: 10.5, color: DS.muted, lineHeight: 1.4, margin: "12px 0 0", fontStyle: "italic" }}>
          Suggestions are curated brands recognised for {concernLabel.includes("carbon") ? "lower-impact sourcing" : "stronger ethics"}. Certifications reduce risk but don't guarantee a flawless supply chain — verify before you buy.
        </p>
      </div>
    </div>
  );
}
