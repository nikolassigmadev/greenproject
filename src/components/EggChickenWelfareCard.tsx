/**
 * Egg & Chicken Welfare Card
 *
 * Surfaces producer / brand-level welfare findings (ownership tracing,
 * certifications, documented issues, pledge status and credibility scores) from
 * the Egg & Chicken Welfare Database when a scanned product's brand matches a
 * known egg or chicken producer.
 *
 * Renders nothing when the brand has no welfare record.
 *
 * Styling mirrors the other cards in the product verdict page's "Ethics &
 * labour" section: a hairline-bordered card with a 46px / 1fr header (soft
 * icon tile + 19px title), editorial body copy and a footnote — so it reads as
 * one of the page, not a bespoke widget.
 */

import { AlertTriangle } from 'lucide-react';
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

/** A single 1–5 sub-score, shown as a tinted tile + caption (matches the page's icon tiles). */
function ScoreStat({ label, value }: { label: string; value: number }) {
  const tone = value >= 4 ? 'good' : value === 3 ? 'warn' : 'bad';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: toneBg(tone),
          color: toneColor(tone),
          fontWeight: 800,
          fontSize: 16,
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
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: DS.muted, textTransform: 'uppercase', letterSpacing: 0.6 }}>
        {label}
      </div>
      <p style={{ fontSize: 13, color: DS.ink2, margin: '3px 0 0', lineHeight: 1.45 }}>{value}</p>
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
        border: `1px solid ${DS.hair}`,
        borderRadius: 22,
        padding: '18px 20px',
      }}
    >
      {/* Header — 46px icon tile / 1fr, matching the section's other cards */}
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
              {record.producer}
            </span>
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
              Overall {record.suggestedOverall}/5
            </span>
          </div>
          <div style={{ fontSize: 11, color: DS.muted, marginTop: 4, letterSpacing: 0.3 }}>
            {record.region} · {record.productType}
          </div>
          <div style={{ fontSize: 12.5, color: DS.ink2, marginTop: 8, lineHeight: 1.45 }}>
            {CONFIDENCE_COPY[record.confidence]} · {record.sourceTier}
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      <div
        style={{
          display: 'flex',
          gap: 20,
          alignItems: 'center',
          marginTop: 16,
          paddingTop: 16,
          borderTop: `1px solid ${DS.hair}`,
        }}
      >
        <ScoreStat label="Label integrity" value={record.labelIntegrity} />
        <ScoreStat label="Verification" value={record.verification} />
        <span style={{ flex: 1, fontSize: 11.5, color: DS.muted, lineHeight: 1.4 }}>
          Overall = the weaker of "does the label mean anything" and "how independently verified".
        </span>
      </div>

      {/* Detail fields */}
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${DS.hair}` }}>
        <Field label="Parent / holding co" value={record.parent} />
        {record.privateLabel && <Field label="Private label" value={record.privateLabel} />}
        <Field label="Welfare claims on pack" value={record.welfareClaims} />
        <Field label="Housing system (documented)" value={record.housingSystem} />
        <Field label="Certifications (audited)" value={record.certifications} />
        <Field label="Pledge status" value={`${record.pledges} — ${record.pledgeStatus}`} />
        <Field label="Documented issues" value={record.documentedIssues} />
      </div>

      {/* Red flags */}
      {record.redFlags && (
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
                background: DS.warnBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle style={{ width: 20, height: 20, color: DS.warn }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: DS.warn, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              Red flags
            </div>
            <p style={{ fontSize: 12.5, color: DS.ink2, margin: '4px 0 0', lineHeight: 1.45 }}>{record.redFlags}</p>
          </div>
        </div>
      )}

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
        Source: Egg &amp; Chicken Welfare Database · last verified {record.lastVerified}. Allegations are described by
        status, not as proof of guilt.
      </div>
    </div>
  );
}
