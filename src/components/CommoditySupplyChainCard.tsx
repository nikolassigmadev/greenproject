/**
 * Commodity Supply Chain Card
 *
 * Surfaces supply-chain findings for controversial food commodities (palm oil,
 * coffee, soy, seafood) when a scanned product's brand matches a known company.
 * Cocoa is excluded here — it's handled by the dedicated Chocolate Directory.
 *
 * Renders nothing when the brand has no commodity record.
 *
 * A single brand (e.g. Nestl\u00e9) may appear in multiple commodities; each
 * gets its own card section within one container.
 *
 * Styling mirrors EggChickenWelfareCard / BeefWelfareCard / SugarIndustryCard.
 */

import { AlertTriangle, ExternalLink } from 'lucide-react';
import {
  getCommodityRecordsByBrand,
  greenwashRiskTone,
  COMMODITY_LABELS,
  COMMODITY_ICON,
  type CommodityCompany,
} from '@/data/commoditySupplyChains';
import { DS, toneColor, toneBg } from '@/styles/design-tokens';

interface CommoditySupplyChainCardProps {
  brand: string | null | undefined;
}

function RiskBadge({ risk }: { risk: CommodityCompany['greenwashRisk'] }) {
  const tone = greenwashRiskTone(risk);
  const color = toneColor(tone);
  return (
    <span
      style={{
        fontSize: 10.5,
        fontWeight: 800,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color,
        background: toneBg(tone),
        border: `1px solid ${color}`,
        borderRadius: 999,
        padding: '2px 9px',
      }}
    >
      Greenwash risk: {risk}
    </span>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  if (!value || value === 'n/a') return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: DS.muted, textTransform: 'uppercase', letterSpacing: 0.6 }}>
        {label}
      </div>
      <p style={{ fontSize: 13, color: DS.ink2, margin: '3px 0 0', lineHeight: 1.45 }}>{value}</p>
    </div>
  );
}

function SingleCommoditySection({ record }: { record: CommodityCompany }) {
  const tone = greenwashRiskTone(record.greenwashRisk);
  const icon = COMMODITY_ICON[record.commodity];
  const isHighRisk = record.greenwashRisk === 'High' || record.greenwashRisk === 'Medium-High';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '46px 1fr', gap: 14, alignItems: 'start' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: toneBg(tone),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 19,
            }}
          >
            {icon}
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 19, lineHeight: 1.15, color: DS.ink, letterSpacing: -0.3, fontWeight: 700 }}>
              {record.company}
            </span>
            <RiskBadge risk={record.greenwashRisk} />
          </div>
          <div style={{ fontSize: 11, color: DS.muted, marginTop: 4, letterSpacing: 0.3 }}>
            {COMMODITY_LABELS[record.commodity]} supply chain &middot; {record.hq} &middot; Tier {record.tier} {record.role}
          </div>
          <div style={{ fontSize: 12.5, color: DS.ink2, marginTop: 8, lineHeight: 1.45 }}>
            {record.claimsVsReality}
          </div>
        </div>
      </div>

      {/* Detail fields */}
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${DS.hair}` }}>
        <Field label="Sourcing regions" value={record.sourcingRegions} />
        <Field label="Transparency" value={record.transparency} />
        <Field label="Labor allegations" value={record.laborAllegations} />
        <Field label="Environmental impact" value={record.environmentalImpact} />
        <Field label="Certifications" value={record.certifications} />
      </div>

      {/* High-risk alert */}
      {isHighRisk && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '46px 1fr',
            gap: 14,
            alignItems: 'start',
            marginTop: 4,
            paddingTop: 16,
            borderTop: `1px solid ${DS.hair}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: DS.badBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle style={{ width: 20, height: 20, color: DS.bad }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: DS.bad, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              Claims vs. reality
            </div>
            <p style={{ fontSize: 12.5, color: DS.ink2, margin: '4px 0 0', lineHeight: 1.45 }}>
              {record.claimsVsReality}
            </p>
            {record.sourceUrl && (
              <a
                href={record.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 11,
                  color: toneColor('bad'),
                  marginTop: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <ExternalLink style={{ width: 10, height: 10 }} /> View source
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function CommoditySupplyChainCard({ brand }: CommoditySupplyChainCardProps) {
  const records = getCommodityRecordsByBrand(brand);
  if (records.length === 0) return null;

  return (
    <div
      style={{
        background: DS.card,
        border: `1px solid ${DS.hair}`,
        borderRadius: 22,
        padding: '18px 20px',
      }}
    >
      {records.map((record, i) => (
        <div key={record.id}>
          {i > 0 && (
            <div style={{ borderTop: `1px solid ${DS.hair}`, marginTop: 20, paddingTop: 20 }} />
          )}
          <SingleCommoditySection record={record} />
        </div>
      ))}

      {/* Source footnote */}
      <div
        style={{
          fontStyle: 'italic',
          fontSize: 12,
          color: DS.muted,
          marginTop: 16,
          lineHeight: 1.4,
          borderTop: `1px solid ${DS.hair}`,
          paddingTop: 14,
        }}
      >
        Source: Commodity Supply Chains Database &middot; compiled June 2026.
        Allegations are described by status, not as proof of guilt. Certification
        membership &ne; certified volume.
      </div>
    </div>
  );
}
