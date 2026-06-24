/**
 * Beef Welfare Card
 *
 * Surfaces company / brand-level beef findings (ownership tracing,
 * certifications, documented issues, pledge status and credibility) from
 * the Beef Company Database when a scanned product's brand matches a
 * known beef company.
 *
 * Renders nothing when the brand has no beef record.
 *
 * Styling mirrors EggChickenWelfareCard and the other cards on the verdict
 * page: hairline-bordered card with a 46px / 1fr header (soft icon tile +
 * 19px title), editorial body copy and a footnote.
 */

import { AlertTriangle } from 'lucide-react';
import {
  getBeefCompanyByBrand,
  beefTransparencyTone,
  type BeefCompany,
} from '@/data/beefWelfare';
import { DS, toneColor, toneBg } from '@/styles/design-tokens';

interface BeefWelfareCardProps {
  brand: string | null | undefined;
}

const CONFIDENCE_COPY: Record<BeefCompany['confidence'], string> = {
  Verified: 'Verified \u2014 backed by a Tier-1/2 source',
  Reported: 'Reported \u2014 credible news, not independently confirmed',
  Mixed: 'Mixed \u2014 sources partly confirm and partly conflict',
};

function TransparencyBadge({ level }: { level: BeefCompany['transparency'] }) {
  const tone = beefTransparencyTone(level);
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
      Transparency: {level}
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

export function BeefWelfareCard({ brand }: BeefWelfareCardProps) {
  const record = getBeefCompanyByBrand(brand);
  if (!record) return null;

  const tone = beefTransparencyTone(record.transparency);
  const color = toneColor(tone);

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
            🥩
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 19, lineHeight: 1.15, color: DS.ink, letterSpacing: -0.3, fontWeight: 700 }}>
              {record.company}
            </span>
            <TransparencyBadge level={record.transparency} />
          </div>
          <div style={{ fontSize: 11, color: DS.muted, marginTop: 4, letterSpacing: 0.3 }}>
            {record.hq} &middot; {record.supplyChainRole}
          </div>
          <div style={{ fontSize: 12.5, color: DS.ink2, marginTop: 8, lineHeight: 1.45 }}>
            {CONFIDENCE_COPY[record.confidence]}
          </div>
        </div>
      </div>

      {/* Detail fields */}
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${DS.hair}` }}>
        <Field label="Parent / ownership" value={record.parent} />
        <Field label="Scale / market position" value={record.scale} />
        <Field label="Production system" value={record.productionSystem} />
        <Field label="Third-party certifications" value={record.certifications} />
        <Field label="Pledges & status" value={record.pledges} />
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

      {/* Sources */}
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
        Source: Ethical Beef Company Database &middot; compiled June 2026 &middot; {record.keySources}.
        Allegations are described by status, not as proof of guilt.
      </div>
    </div>
  );
}
