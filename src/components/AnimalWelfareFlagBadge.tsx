/**
 * Animal Welfare Flag Badge Component
 * Displays a warning badge for products from companies with poor animal welfare records
 */

import { checkAnimalWelfareFlag, getAnimalWelfareFlagEmoji, getAnimalWelfareFlagColor } from '@/utils/animalWelfareFlags';

interface AnimalWelfareFlagBadgeProps {
  brand: string | null | undefined;
  showDetails?: boolean;
}

export function AnimalWelfareFlagBadge({ brand, showDetails = true }: AnimalWelfareFlagBadgeProps) {
  const flag = checkAnimalWelfareFlag(brand);

  if (!flag.isFlagged) {
    return null;
  }

  const emoji = getAnimalWelfareFlagEmoji(flag.severity);
  const color = getAnimalWelfareFlagColor(flag.severity);
  const company = flag.company!;

  return (
    <div
      style={{
        backgroundColor: `${color}15`,
        border: `2px solid ${color}`,
        borderRadius: '0.75rem',
        padding: '1rem',
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '1rem',
        alignItems: 'flex-start',
      }}
    >
      <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>{emoji}</div>
      <div style={{ flex: 1 }}>
        <h3 style={{ fontWeight: 'bold', color, marginBottom: '0.25rem' }}>
          Animal Welfare Concern
        </h3>
        <p style={{ color: 'hsl(150 10% 35%)', fontSize: '0.9rem', marginBottom: showDetails ? '0.75rem' : 0 }}>
          {company.companyName} has poor animal welfare practices according to the BBFAW (Business Benchmark on Farm
          Animal Welfare).
        </p>

        {showDetails && company && (
          <div style={{ fontSize: '0.85rem', color: 'hsl(150 10% 45%)' }}>
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>BBFAW Tier:</strong> {company.bbfawTier} ({company.bbfawScore})
            </p>
            {company.concerns.length > 0 && (
              <div>
                <p style={{ marginBottom: '0.25rem' }}>
                  <strong>Concerns:</strong>
                </p>
                <ul style={{ margin: '0.25rem 0 0 1.25rem', paddingLeft: 0 }}>
                  {company.concerns.slice(0, 3).map((concern, i) => (
                    <li key={i} style={{ marginBottom: '0.25rem' }}>
                      {concern}
                    </li>
                  ))}
                  {company.concerns.length > 3 && <li>+ {company.concerns.length - 3} more</li>}
                </ul>
              </div>
            )}
            <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'hsl(150 10% 55%)', fontStyle: 'italic' }}>
              Source: BBFAW 2024/2025 Report, World Animal Protection
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
