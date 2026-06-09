import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, Search, Loader2, GitCompareArrows, AlertTriangle,
  CheckCircle2, ExternalLink, Package2,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { DS } from "@/styles/design-tokens";
import { searchProducts } from "@/services/openfoodfacts";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";
import { getVerifiedFlagForBrand } from "@/services/brandFlags";
import type { BrandFlagV2 } from "@/types/brandFlag";
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

function GradeBadge({ grade, label }: { grade: string | null; label: string }) {
  const g = grade?.toLowerCase();
  const color = g ? (GRADE_COLOR[g] ?? DS.muted) : DS.muted;
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: g ? `${color}22` : DS.bg,
        color, fontSize: 18, fontWeight: 800,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {g ? g.toUpperCase() : "?"}
      </div>
      <div style={{
        fontSize: 10, fontWeight: 700, color: DS.muted,
        textTransform: "uppercase", letterSpacing: "0.04em",
      }}>
        {label}
      </div>
    </div>
  );
}

function FlagBlock({ flag }: { flag: BrandFlagV2 | null }) {
  if (!flag) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: DS.goodBg, color: DS.good,
        padding: "10px 12px", borderRadius: 10,
        fontSize: 12, fontWeight: 600,
      }}>
        <CheckCircle2 style={{ width: 14, height: 14 }} />
        No verified flags
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

function ProductCard({
  slot, state, onSearch, onQueryChange, onClear,
}: {
  slot: Slot;
  state: SlotState;
  onSearch: () => void;
  onQueryChange: (value: string) => void;
  onClear: () => void;
}) {
  const product = state.product;
  const flag = product ? getVerifiedFlagForBrand(product.brand) : null;

  return (
    <div style={{
      background: DS.card, borderRadius: 18, padding: 16,
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      display: "flex", flexDirection: "column", gap: 12, minHeight: 320,
    }}>
      <div style={{
        fontSize: 10.5, fontWeight: 800, color: DS.muted,
        letterSpacing: "0.08em", textTransform: "uppercase",
      }}>
        Product {slot}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSearch(); }} style={{ display: "flex", gap: 6 }}>
        <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
          <Search style={{
            position: "absolute", left: 10, width: 13, height: 13,
            color: DS.muted, pointerEvents: "none",
          }} />
          <input
            type="text"
            value={state.query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="e.g. Coca-Cola"
            style={{
              width: "100%", height: 38, padding: "0 10px 0 30px",
              borderRadius: 10, border: `1px solid ${DS.hair}`,
              background: DS.bg, color: DS.ink,
              fontSize: 13, fontFamily: DS.font, outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
        <button
          type="submit"
          disabled={!state.query.trim() || state.loading}
          style={{
            height: 38, padding: "0 12px", borderRadius: 10, border: "none",
            background: state.query.trim() ? DS.ink : DS.hair,
            color: state.query.trim() ? DS.card : DS.muted,
            fontWeight: 700, fontSize: 12, cursor: state.query.trim() ? "pointer" : "not-allowed",
          }}
        >
          {state.loading ? <Loader2 style={{ width: 13, height: 13, animation: "spin 0.7s linear infinite" }} /> : "Search"}
        </button>
      </form>

      {!product && !state.loading && (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          color: DS.muted, fontSize: 12, gap: 8, padding: "16px 0",
        }}>
          <Package2 style={{ width: 28, height: 28, opacity: 0.5 }} />
          <span>Search a product to compare</span>
        </div>
      )}

      {product && (
        <>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.productName || ""}
                style={{
                  width: 52, height: 52, borderRadius: 10, objectFit: "contain",
                  border: `1px solid ${DS.hair}`, background: DS.bg, flexShrink: 0,
                }}
              />
            ) : (
              <div style={{
                width: 52, height: 52, borderRadius: 10,
                background: DS.bg, border: `1px solid ${DS.hair}`, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Package2 style={{ width: 20, height: 20, color: DS.muted }} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 14, fontWeight: 800, color: DS.ink, lineHeight: 1.2,
              }}>
                {product.productName || "Unknown product"}
              </div>
              <div style={{ fontSize: 11.5, color: DS.muted, marginTop: 2 }}>
                {product.brand || "Unknown brand"}
              </div>
            </div>
            <button
              onClick={onClear}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: DS.muted, fontSize: 11, fontWeight: 600,
              }}
            >
              Clear
            </button>
          </div>

          <div style={{
            display: "flex", gap: 8, background: DS.bg,
            borderRadius: 12, padding: "10px 6px",
          }}>
            <GradeBadge grade={product.ecoscoreGrade} label="Eco" />
            <GradeBadge grade={product.nutriscoreGrade} label="Nutri" />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: product.novaGroup ? `${DS.ink}11` : DS.bg,
                color: DS.ink, fontSize: 18, fontWeight: 800,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {product.novaGroup ?? "?"}
              </div>
              <div style={{
                fontSize: 10, fontWeight: 700, color: DS.muted,
                textTransform: "uppercase", letterSpacing: "0.04em",
              }}>
                NOVA
              </div>
            </div>
          </div>

          <div style={{ fontSize: 11, color: DS.muted }}>
            CO2: <strong style={{ color: DS.ink, fontWeight: 700 }}>
              {product.ecoscoreData?.agribalyse?.co2_total != null
                ? `${product.ecoscoreData.agribalyse.co2_total.toFixed(2)} kg/kg`
                : "—"}
            </strong>
          </div>

          <FlagBlock flag={flag} />
        </>
      )}
    </div>
  );
}

export default function Compare() {
  const navigate = useNavigate();
  const [slotA, setSlotA] = useState<SlotState>({ query: "", loading: false, product: null });
  const [slotB, setSlotB] = useState<SlotState>({ query: "", loading: false, product: null });

  const updateSlot = (slot: Slot, patch: Partial<SlotState>) => {
    if (slot === "A") setSlotA((s) => ({ ...s, ...patch }));
    else setSlotB((s) => ({ ...s, ...patch }));
  };

  const runSearch = async (slot: Slot) => {
    const state = slot === "A" ? slotA : slotB;
    const q = state.query.trim();
    if (!q) return;
    updateSlot(slot, { loading: true });
    try {
      const results = await searchProducts(q, 1);
      if (results.length === 0) {
        toast.error(`No results for "${q}"`);
        updateSlot(slot, { loading: false });
        return;
      }
      updateSlot(slot, { loading: false, product: results[0] });
    } catch {
      toast.error("Search failed. Try again.");
      updateSlot(slot, { loading: false });
    }
  };

  return (
    <div style={{
      background: DS.bg, minHeight: "100dvh", fontFamily: DS.font, color: DS.ink,
    }}>
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "0 20px 96px" }}>
        <header style={{
          display: "flex", alignItems: "center", gap: 8,
          paddingTop: "max(24px, calc(env(safe-area-inset-top, 0px) + 16px))",
          paddingBottom: 16,
        }}>
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            style={{
              width: 36, height: 36, borderRadius: 999, border: "none",
              background: DS.card, color: DS.ink, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ChevronLeft style={{ width: 18, height: 18 }} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: -0.4,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <GitCompareArrows style={{ width: 20, height: 20, color: DS.ink }} />
              Compare two products
            </h1>
            <p style={{ fontSize: 12.5, color: DS.muted, margin: "2px 0 0" }}>
              Search a product on each side. Decide in the aisle.
            </p>
          </div>
        </header>

        <div style={{
          display: "grid", gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        }}>
          <ProductCard
            slot="A"
            state={slotA}
            onSearch={() => runSearch("A")}
            onQueryChange={(v) => updateSlot("A", { query: v })}
            onClear={() => setSlotA({ query: "", loading: false, product: null })}
          />
          <ProductCard
            slot="B"
            state={slotB}
            onSearch={() => runSearch("B")}
            onQueryChange={(v) => updateSlot("B", { query: v })}
            onClear={() => setSlotB({ query: "", loading: false, product: null })}
          />
        </div>

        {slotA.product && slotB.product && (
          <div style={{
            marginTop: 16, background: DS.card, borderRadius: 18, padding: 18,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}>
            <div style={{
              fontSize: 11, fontWeight: 800, color: DS.muted,
              letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10,
            }}>
              At a glance
            </div>
            <Verdict a={slotA.product} b={slotB.product} />
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
      <BottomNav />
    </div>
  );
}

function gradeRank(grade: string | null | undefined): number {
  if (!grade) return 6;
  const g = grade.toLowerCase();
  return { a: 1, b: 2, c: 3, d: 4, e: 5 }[g] ?? 6;
}

function Verdict({ a, b }: { a: OpenFoodFactsResult; b: OpenFoodFactsResult }) {
  const aFlag = getVerifiedFlagForBrand(a.brand);
  const bFlag = getVerifiedFlagForBrand(b.brand);

  const points: { label: string; winner: "A" | "B" | "tie" }[] = [];

  // Eco
  const ar = gradeRank(a.ecoscoreGrade);
  const br = gradeRank(b.ecoscoreGrade);
  if (ar !== br) points.push({ label: "Eco-score", winner: ar < br ? "A" : "B" });

  // Nutri
  const an = gradeRank(a.nutriscoreGrade);
  const bn = gradeRank(b.nutriscoreGrade);
  if (an !== bn) points.push({ label: "Nutri-score", winner: an < bn ? "A" : "B" });

  // CO2
  const aco2 = a.ecoscoreData?.agribalyse?.co2_total;
  const bco2 = b.ecoscoreData?.agribalyse?.co2_total;
  if (aco2 != null && bco2 != null && aco2 !== bco2) {
    points.push({ label: "Lower CO2", winner: aco2 < bco2 ? "A" : "B" });
  }

  // Flags
  if (!aFlag && bFlag) points.push({ label: "Clean ethics record", winner: "A" });
  else if (aFlag && !bFlag) points.push({ label: "Clean ethics record", winner: "B" });

  const aWins = points.filter((p) => p.winner === "A").length;
  const bWins = points.filter((p) => p.winner === "B").length;

  const leader = aWins > bWins ? "A" : bWins > aWins ? "B" : "tie";
  const leaderProduct = leader === "A" ? a : leader === "B" ? b : null;

  return (
    <div>
      {leaderProduct ? (
        <div style={{
          background: DS.goodBg, borderRadius: 12, padding: "12px 14px",
          fontSize: 13.5, color: DS.ink, fontWeight: 600, marginBottom: 12,
        }}>
          <strong style={{ fontWeight: 800 }}>{leaderProduct.productName || `Product ${leader}`}</strong> wins on{" "}
          {Math.max(aWins, bWins)} of {points.length} measure{points.length === 1 ? "" : "s"}.
        </div>
      ) : (
        <div style={{
          background: DS.bg, borderRadius: 12, padding: "12px 14px",
          fontSize: 13.5, color: DS.ink, fontWeight: 600, marginBottom: 12,
        }}>
          The two products look roughly even.
        </div>
      )}

      {points.length === 0 ? (
        <p style={{ fontSize: 12, color: DS.muted, margin: 0 }}>
          Not enough scored data to call a winner. Try different products.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {points.map((p, i) => (
            <li key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 12px", background: DS.bg, borderRadius: 10,
              fontSize: 12.5, color: DS.ink,
            }}>
              <span>{p.label}</span>
              <span style={{
                fontSize: 11, fontWeight: 800, padding: "3px 9px",
                borderRadius: 999, color: DS.card,
                background: p.winner === "A" ? DS.good : p.winner === "B" ? DS.brand : DS.muted,
              }}>
                {p.winner === "tie" ? "TIE" : `Product ${p.winner}`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
