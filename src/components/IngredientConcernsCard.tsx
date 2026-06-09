// GoodScan — Ingredient concerns card.
//
// Editorial-style card displaying ingredient-level flags detected in an
// OpenFoodFacts product's ingredients text. Matches the visual language of
// the labour and threatened-species sections on OpenFoodFactsDetail.

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, ExternalLink, Sprout } from "lucide-react";
import { DS } from "@/styles/design-tokens";
import type { IngredientFlag, IngredientSeverity, IngredientCategory } from "@/data/ingredientFlags";

interface IngredientConcernsCardProps {
  flags: IngredientFlag[];
}

const CATEGORY_LABEL: Record<IngredientCategory, string> = {
  forced_labour: "Forced labour",
  child_labour: "Child labour",
  environmental_harm: "Environmental harm",
  deforestation: "Deforestation",
  biodiversity_loss: "Biodiversity loss",
  water_stress: "Water stress",
  unsafe_conditions: "Unsafe conditions",
};

const SEVERITY_LABEL: Record<IngredientSeverity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

function severityColor(severity: IngredientSeverity): string {
  switch (severity) {
    case "critical":
    case "high":
      return DS.bad;
    case "medium":
      return DS.warn;
    case "low":
    default:
      return DS.muted;
  }
}

function FlagRow({ flag, defaultExpanded }: { flag: IngredientFlag; defaultExpanded: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const dot = severityColor(flag.severity);
  const primarySource = flag.sources[0];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "46px 1fr",
        gap: 14,
        padding: "18px 0",
        borderTop: `1px solid ${DS.hair}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 4 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: DS.card,
            border: `1px solid ${DS.hair}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: dot,
          }}
        >
          <Sprout style={{ width: 18, height: 18 }} />
        </div>
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span
            aria-hidden="true"
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: dot,
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 10.5,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: DS.muted,
              fontWeight: 700,
            }}
          >
            {SEVERITY_LABEL[flag.severity]} · {CATEGORY_LABEL[flag.category]}
          </span>
        </div>
        <div
          style={{
            fontSize: 19,
            lineHeight: 1.15,
            color: DS.ink,
            letterSpacing: -0.3,
            fontWeight: 700,
          }}
        >
          {flag.displayName}
        </div>
        <div style={{ fontSize: 12.5, color: DS.ink2, marginTop: 6, lineHeight: 1.45 }}>
          {flag.summary}
        </div>

        <button
          type="button"
          onClick={() => setExpanded(prev => !prev)}
          aria-expanded={expanded}
          style={{
            marginTop: 10,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.4,
            textTransform: "uppercase",
            color: DS.muted,
            fontFamily: "inherit",
          }}
        >
          {expanded ? "Hide details" : "Why this matters"}
          {expanded ? (
            <ChevronUp style={{ width: 12, height: 12 }} />
          ) : (
            <ChevronDown style={{ width: 12, height: 12 }} />
          )}
        </button>

        {expanded && (
          <div style={{ marginTop: 12 }}>
            <p
              style={{
                margin: 0,
                fontSize: 12.5,
                color: DS.ink2,
                lineHeight: 1.5,
              }}
            >
              {flag.details}
            </p>
            <p
              style={{
                margin: "10px 0 0",
                fontSize: 12,
                color: DS.ink,
                lineHeight: 1.45,
                fontStyle: "italic",
              }}
            >
              <strong style={{ fontStyle: "normal", fontWeight: 800 }}>What to look for:</strong>{" "}
              {flag.whatToLookFor}
            </p>
            {primarySource && (
              <a
                href={primarySource.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 11,
                  color: severityColor(flag.severity),
                  marginTop: 10,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                <ExternalLink style={{ width: 10, height: 10 }} /> {primarySource.publisher}
                {flag.sources.length > 1 && (
                  <span style={{ color: DS.muted, fontWeight: 600, marginLeft: 6 }}>
                    +{flag.sources.length - 1} more
                  </span>
                )}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function IngredientConcernsCard({ flags }: IngredientConcernsCardProps) {
  if (!flags || flags.length === 0) return null;

  return (
    <div
      style={{
        background: DS.card,
        border: `1px solid ${DS.hair}`,
        borderRadius: 22,
        padding: "8px 20px 22px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "16px 0 4px",
        }}
      >
        <AlertTriangle style={{ width: 16, height: 16, color: DS.muted }} />
        <span
          style={{
            fontSize: 10.5,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            color: DS.muted,
            fontWeight: 700,
          }}
        >
          {flags.length} concern{flags.length === 1 ? "" : "s"} detected
        </span>
      </div>
      {flags.map((flag, i) => (
        <FlagRow key={flag.id} flag={flag} defaultExpanded={i === 0} />
      ))}
      <div
        style={{
          fontStyle: "italic",
          fontSize: 12,
          color: DS.muted,
          marginTop: 16,
          lineHeight: 1.4,
          borderTop: `1px solid ${DS.hair}`,
          paddingTop: 14,
        }}
      >
        Flagged from the ingredient list against documented concerns about these commodities at a global / regional level. Individual brands may use verified-sustainable sources — check certifications on pack.
      </div>
    </div>
  );
}

export default IngredientConcernsCard;
