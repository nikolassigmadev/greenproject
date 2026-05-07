// GoodScan — Simple design direction tokens
export const DS = {
  bg: '#f7f6f3',
  card: '#ffffff',
  ink: '#1a1a1a',
  muted: '#6e6e73',
  hair: 'rgba(0,0,0,0.08)',
  good: '#2f7d4f',
  warn: '#c97a1a',
  bad: '#c44a36',
  goodBg: '#ecf4ee',
  warnBg: '#faf1e2',
  badBg: '#f8e9e4',
  brand: '#1a1a1a',
  font: '"Inter", -apple-system, system-ui, sans-serif',
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
