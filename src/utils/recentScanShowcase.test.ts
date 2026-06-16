import { describe, it, expect } from 'vitest';
import { hasCompleteEcoData, scanEntryToShowcase } from './recentScanShowcase';
import type { ScanHistoryEntry } from './userPreferences';

const baseEntry = (overrides: Partial<ScanHistoryEntry> = {}): ScanHistoryEntry => ({
  id: 'x',
  barcode: '50184453',
  productName: 'Marmite Yeast Extract',
  brand: 'Marmite',
  imageUrl: null,
  timestamp: 1,
  verdict: { emoji: '', label: 'BUY', color: '#10b981' },
  scores: {
    ecoScore: null,
    ecoGrade: 'b',
    nutriScore: 'c',
    laborAllegations: 0,
    novaGroup: 4,
  },
  ...overrides,
});

describe('hasCompleteEcoData', () => {
  it('is true when an eco grade is present', () => {
    expect(hasCompleteEcoData(baseEntry({ scores: { ...baseEntry().scores, ecoGrade: 'a', ecoScore: null } }))).toBe(true);
  });
  it('is true when a numeric eco score is present', () => {
    expect(hasCompleteEcoData(baseEntry({ scores: { ...baseEntry().scores, ecoGrade: null, ecoScore: 71 } }))).toBe(true);
  });
  it('is false when neither eco grade nor score exist', () => {
    expect(hasCompleteEcoData(baseEntry({ scores: { ...baseEntry().scores, ecoGrade: null, ecoScore: null } }))).toBe(false);
  });
});

describe('scanEntryToShowcase', () => {
  it('maps name, brand and a BUY verdict', () => {
    const s = scanEntryToShowcase(baseEntry());
    expect(s.name).toBe('Marmite Yeast Extract');
    expect(s.subtitle).toBe('Marmite');
    expect(s.verdict).toBe('BUY');
    expect(s.icon).toBe('good');
  });

  it('always includes Environment and Labour bars', () => {
    const labels = scanEntryToShowcase(baseEntry()).categories.map((c) => c.label);
    expect(labels).toContain('Environment');
    expect(labels).toContain('Labour');
  });

  it('includes Nutrition and Processing only when graded', () => {
    const full = scanEntryToShowcase(baseEntry()).categories.map((c) => c.label);
    expect(full).toEqual(['Environment', 'Labour', 'Nutrition', 'Processing']);

    const sparse = scanEntryToShowcase(
      baseEntry({ scores: { ...baseEntry().scores, nutriScore: null, novaGroup: null } }),
    ).categories.map((c) => c.label);
    expect(sparse).toEqual(['Environment', 'Labour']);
  });

  it('derives the environment value from the eco grade', () => {
    const env = scanEntryToShowcase(baseEntry()).categories.find((c) => c.label === 'Environment');
    expect(env?.value).toBe(74); // grade "b"
    expect(scanEntryToShowcase(baseEntry()).score).toBe(74);
  });

  it('prefers a numeric eco score over the grade', () => {
    const s = scanEntryToShowcase(baseEntry({ scores: { ...baseEntry().scores, ecoScore: 61 } }));
    expect(s.score).toBe(61);
  });

  it('clamps an out-of-range eco score to the 0-100 scale', () => {
    // OFF eco-scores with bonuses can exceed 100 and were once persisted to
    // history, surfacing as "101 / 100" in the home hero. Guard against it.
    const over = scanEntryToShowcase(baseEntry({ scores: { ...baseEntry().scores, ecoGrade: null, ecoScore: 101 } }));
    expect(over.score).toBe(100);
    expect(over.categories.find((c) => c.label === 'Environment')?.value).toBe(100);
    expect(over.description).toContain('Eco-Score 100/100');

    const under = scanEntryToShowcase(baseEntry({ scores: { ...baseEntry().scores, ecoScore: -8 } }));
    expect(under.score).toBe(0);
  });

  it('lowers the Labour bar as allegations rise', () => {
    const clean = scanEntryToShowcase(baseEntry()).categories.find((c) => c.label === 'Labour')!.value;
    const flagged = scanEntryToShowcase(
      baseEntry({ scores: { ...baseEntry().scores, laborAllegations: 2 } }),
    ).categories.find((c) => c.label === 'Labour')!.value;
    expect(flagged).toBeLessThan(clean);
  });

  it('builds a factual description from the grades', () => {
    expect(scanEntryToShowcase(baseEntry()).description)
      .toBe('Eco-Score B · Nutri-Score C · NOVA 4');
  });

  it('falls back to UNRATED for an unknown verdict', () => {
    const s = scanEntryToShowcase(baseEntry({ verdict: { emoji: '', label: 'UNKNOWN', color: '#000' } }));
    expect(s.verdict).toBe('UNRATED');
  });
});
