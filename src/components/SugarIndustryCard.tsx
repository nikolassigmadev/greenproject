/**
 * Sugar Industry Card
 *
 * Surfaces company / brand-level sugar industry findings (ownership tracing,
 * certifications, documented accusations, severity rating) from the Sugar
 * Industry Database when a scanned product's brand matches a known sugar
 * producer or refiner.
 *
 * Renders nothing when the brand has no sugar record.
 *
 * Styling mirrors EggChickenWelfareCard and BeefWelfareCard: hairline-bordered
 * card with a 46px / 1fr header, editorial body copy and a footnote.
 */

import { AlertTriangle, ExternalLink } from 'lucide-react';
import {
  getSugarCompanyByBrand,
  sugarSeverityTone,
  sugarSeverityLabel,
  type SugarCompany,
} from '@/data/sugarIndustry';
import { DS, toneColor, toneBg } from '@/styles/design-tokens';

interface SugarIndustryCardProps {
  brand: string | null | undefined;
}

function SeverityBadge({ severity }: { severity: SugarCompany['severity'] }) {
  const tone = sugarSeverityTone(severity);
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
      Severity: {severity}
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

export function SugarIndustryCard({ brand }: SugarIndustryCardProps) {
  const record = getSugarCompanyByBrand(brand);
  if (!record) return null;

  const tone = sugarSeverityTone(record.severity);

  return (
    <div
      style={{
        background: DS.card,
        border: `1px solid ${DS.hair}`,
        borderRadius: 22,
        padding: '18px 20px',
      }}
    >
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
            🍬
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 19, lineHeight: 1.15, color: DS.ink, letterSpacing: -0.3, fontWeight: 700 }}>
              {record.company}
            </span>
            <SeverityBadge severity={record.severity} />
          </div>
          <div style={{ fontSize: 11, color: DS.muted, marginTop: 4, letterSpacing: 0.3 }}>
            {record.country} &middot; {record.region === 'Origin' ? 'Cane-origin supplier' : 'Sugar producer / refiner'}
          </div>
          <div style={{ fontSize: 12.5, color: DS.ink2, marginTop: 8, lineHeight: 1.45 }}>
            {sugarSeverityLabel(record.severity)}
          </div>
        </div>
      </div>

      {/* Detail fields */}
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${DS.hair}` }}>
        <Field label="Parent / ownership" value={record.parent} />
        <Field label="Production scale" value={record.productionVolume} />
        <Field label="Certifications" value={record.certifications} />
        <Field label="Documented accusations" value={record.accusations} />
        {record.notes && <Field label="Notes" value={record.notes} />}
      </div>

      {/* Red flags for Severe/High */}
      {(record.severity === 'Severe' || record.severity === 'High') && (
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
              {record.severity === 'Severe' ? 'Severe concern' : 'High concern'}
            </div>
            <p style={{ fontSize: 12.5, color: DS.ink2, margin: '4px 0 0', lineHeight: 1.45 }}>
              {record.accusations}
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
        Source: Sugar Industry Ethics &amp; Sustainability Database &middot; compiled June 2026.
        Allegations are described by status, not as proof of guilt. Settlement &ne; admission of liability.
      </div>
    </div>
  );
}
