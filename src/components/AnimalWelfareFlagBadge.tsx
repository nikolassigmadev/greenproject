/**
 * Animal Welfare Flag Badge Component
 * Displays a warning card for products from companies with poor animal welfare
 * records. Styled to match the verdict page's concern cards (boycott / labour):
 * a neutral card with a soft-yellow icon chip, using the shared DS tokens so it
 * sits consistently alongside the other ethics flags rather than as a loud,
 * differently-shaped box.
 */

import { PawPrint } from 'lucide-react';
import { checkAnimalWelfareFlag } from '@/utils/animalWelfareFlags';
import { DS } from '@/styles/design-tokens';

interface AnimalWelfareFlagBadgeProps {
  brand: string | null | undefined;
  showDetails?: boolean;
}

export function AnimalWelfareFlagBadge({ brand, showDetails = true }: AnimalWelfareFlagBadgeProps) {
  const flag = checkAnimalWelfareFlag(brand);

  if (!flag.isFlagged) {
    return null;
  }

  const company = flag.company!;
  // Animal welfare reads as yellow across the app's palette, regardless of the
  // underlying BBFAW severity tier.
  const accent = DS.warn;
  const accentSoft = DS.warnBg;

  return (
    <div
      style={{
        background: DS.card,
        border: `1px solid ${DS.hair}`,
        borderRadius: 22,
        padding: '18px 20px',
        display: 'grid',
        gridTemplateColumns: '46px 1fr',
        gap: 14,
        alignItems: 'start',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: accentSoft,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PawPrint style={{ width: 20, height: 20, color: accent }} />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 19, lineHeight: 1.15, color: DS.ink, letterSpacing: -0.3, fontWeight: 700 }}>
          Animal welfare concern
        </div>
        <div style={{ fontSize: 12.5, color: DS.ink2, marginTop: 6, lineHeight: 1.45 }}>
          {company.companyName} has poor animal welfare practices according to the BBFAW (Business Benchmark on Farm
          Animal Welfare).
        </div>

        {showDetails && (
          <div style={{ fontSize: 12, color: DS.ink2, marginTop: 10, lineHeight: 1.5 }}>
            <div>
              <span style={{ fontWeight: 700, color: DS.ink2 }}>BBFAW tier: </span>
              {company.bbfawTier} ({company.bbfawScore})
            </div>
            {company.concerns.length > 0 && (
              <ul style={{ margin: '6px 0 0', paddingLeft: 16 }}>
                {company.concerns.slice(0, 3).map((concern, i) => (
                  <li key={i} style={{ marginBottom: 2 }}>
                    {concern}
                  </li>
                ))}
                {company.concerns.length > 3 && <li>+ {company.concerns.length - 3} more</li>}
              </ul>
            )}
            <div style={{ marginTop: 8, fontSize: 11, color: DS.muted, fontStyle: 'italic' }}>
              Source: BBFAW 2024/2025 Report, World Animal Protection
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
