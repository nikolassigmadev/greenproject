/**
 * Egg & Chicken Welfare Card
 *
 * Surfaces producer / brand-level welfare findings (ownership tracing,
 * certifications, documented issues, pledge status and credibility scores) from
 * the Egg & Chicken Welfare Database when a scanned product's brand matches a
 * known egg or chicken producer.
 *
 * Renders nothing when the brand has no welfare record.
 */

import {
  getWelfareProducerByBrand,
  welfareScoreTone,
  type WelfareProducer,
} from '@/data/eggChickenWelfare';
import { DS, toneColor, toneBg } from '@/styles/design-tokens';

interface EggChickenWelfareCardProps {
  brand: string | null | undefined;
}

const CONFIDENCE_COPY: Record<WelfareProducer['confidence'], string> = {
  VERIFIED: 'Verified — backed by a Tier-1 source',
  REPORTED: 'Reported — credible news, not independently checked',
  DISPUTED: 'Disputed — sources conflict',
  UNVERIFIED: 'Unverified — company claim only / supplier opacity',
};

function ScoreDot({ label, value }: { label: string; value: number }) {
  const tone = value >= 4 ? 'good' : value === 3 ? 'warn' : 'bad';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: toneBg(tone),
          color: toneColor(tone),
          fontWeight: 800,
          fontSize: 15,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: DS.mono,
        }}
      >
        {value}
      </div>
      <span style={{ fontSize: 10, color: DS.muted, textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  if (!value || value === 'n/a') return null;
  return (
    <div style={{ marginBottom: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: DS.muted, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </span>
      <p style={{ fontSize: 13, color: DS.ink2, margin: '2px 0 0', lineHeight: 1.45 }}>{value}</p>
    </div>
  );
}

export function EggChickenWelfareCard({ brand }: EggChickenWelfareCardProps) {
  const record = getWelfareProducerByBrand(brand);
  if (!record) return null;

  const tone = welfareScoreTone(record.suggestedOverall);
  const color = toneColor(tone);
  const icon = record.category === 'egg' ? '🥚' : '🐔';

  return (
    <div
      style={{
        background: DS.card,
        border: `2px solid ${color}`,
        borderRadius: DS.radius.md,
        padding: '1rem',
        marginBottom: '1.5rem',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontWeight: 800, color: DS.ink, margin: 0, fontSize: 16, lineHeight: 1.2 }}>
            {record.producer}
          </h3>
          <p style={{ fontSize: 12.5, color: DS.muted, margin: '3px 0 0' }}>
            {record.region} · {record.productType}
          </p>
        </div>
        {/* Suggested overall score */}
        <div style={{ flexShrink: 0 }}>
          <ScoreDot label="Overall" value={record.suggestedOverall} />
        </div>
      </div>

      {/* Score breakdown */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          padding: '10px 0',
          borderTop: `1px solid ${DS.hair}`,
          borderBottom: `1px solid ${DS.hair}`,
          marginBottom: 12,
        }}
      >
        <ScoreDot label="Label integrity" value={record.labelIntegrity} />
        <ScoreDot label="Verification" value={record.verification} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 11.5, color: DS.muted, lineHeight: 1.4 }}>
            Overall = the weaker of "does the label mean anything" and "how independently verified".
          </span>
        </div>
      </div>

      {/* Confidence */}
      <div
        style={{
          display: 'inline-block',
          fontSize: 11,
          fontWeight: 700,
          color,
          background: toneBg(tone),
          padding: '3px 8px',
          borderRadius: 999,
          marginBottom: 12,
        }}
      >
        {CONFIDENCE_COPY[record.confidence]} · {record.sourceTier}
      </div>

      {/* Detail fields */}
      <Field label="Parent / holding co" value={record.parent} />
      {record.privateLabel && <Field label="Private label" value={record.privateLabel} />}
      <Field label="Welfare claims on pack" value={record.welfareClaims} />
      <Field label="Housing system (documented)" value={record.housingSystem} />
      <Field label="Certifications (audited)" value={record.certifications} />
      <Field label="Pledge status" value={`${record.pledges} — ${record.pledgeStatus}`} />
      <Field label="Documented issues" value={record.documentedIssues} />

      {/* Red flags */}
      {record.redFlags && (
        <div
          style={{
            background: DS.warnBg,
            borderRadius: DS.radius.sm,
            padding: '8px 10px',
            marginTop: 4,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: DS.warn, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            ⚑ Red flags
          </span>
          <p style={{ fontSize: 12.5, color: DS.ink2, margin: '3px 0 0', lineHeight: 1.45 }}>{record.redFlags}</p>
        </div>
      )}

      <p style={{ fontSize: 10.5, color: DS.muted, fontStyle: 'italic', margin: '10px 0 0' }}>
        Source: Egg &amp; Chicken Welfare Database · last verified {record.lastVerified}. Allegations are described by
        status, not as proof of guilt.
      </p>
    </div>
  );
}
