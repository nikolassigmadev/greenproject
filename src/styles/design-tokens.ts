// GoodScan — Design tokens backed by CSS custom properties for theme support.
// Light values are the defaults; .dark overrides live in index.css.
export const DS = {
  bg: 'var(--ds-bg)',
  card: 'var(--ds-card)',
  ink: 'var(--ds-ink)',
  ink2: 'var(--ds-ink2)',
  muted: 'var(--ds-muted)',
  hair: 'var(--ds-hair)',
  good: 'var(--ds-good)',
  warn: 'var(--ds-warn)',
  bad: 'var(--ds-bad)',
  goodBg: 'var(--ds-good-bg)',
  warnBg: 'var(--ds-warn-bg)',
  badBg: 'var(--ds-bad-bg)',
  brand: 'var(--ds-brand)',
  font: '"Inter", -apple-system, system-ui, sans-serif',
  // The single monospace stack for tabular numerics (carbon values, codes).
  mono: 'ui-monospace, "SF Mono", Menlo, monospace',
  radius: {
    sm: 14,
    md: 16,
    lg: 20,
  },
} as const;

export const scoreTone = (score: number) =>
  score >= 70 ? 'good' : score >= 45 ? 'warn' : 'bad';

export const toneColor = (tone: 'good' | 'warn' | 'bad') =>
  tone === 'good' ? DS.good : tone === 'warn' ? DS.warn : DS.bad;

export const toneBg = (tone: 'good' | 'warn' | 'bad') =>
  tone === 'good' ? DS.goodBg : tone === 'warn' ? DS.warnBg : DS.badBg;
