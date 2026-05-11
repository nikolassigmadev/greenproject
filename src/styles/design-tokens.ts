// GoodScan — Simple design direction tokens
export const DS = {
  bg: '#F7F6F3',
  card: '#FBF7EC',
  ink: '#1A1614',
  ink2: '#5C544B',
  muted: '#8C8278',
  hair: '#E4DCC9',
  good: '#1F6B4E',
  warn: '#C0822A',
  bad: '#B23A2B',
  goodBg: '#D8E5DA',
  warnBg: '#F0E1C2',
  badBg: '#F0DAD3',
  brand: '#1A1614',
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
