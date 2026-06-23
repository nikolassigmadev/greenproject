import { describe, it, expect } from 'vitest';
import {
  WELFARE_PRODUCERS,
  EGG_PRODUCERS,
  CHICKEN_PRODUCERS,
  LABEL_DECODER,
  GREENWASHING_RED_FLAGS,
  getWelfareProducerByBrand,
  hasWelfareRecord,
  getLabelInfo,
  welfareScoreTone,
} from './eggChickenWelfare';

describe('eggChickenWelfare data integrity', () => {
  it('suggestedOverall equals min(labelIntegrity, verification) for every record', () => {
    for (const r of WELFARE_PRODUCERS) {
      expect(r.suggestedOverall).toBe(Math.min(r.labelIntegrity, r.verification));
    }
  });

  it('every record has at least one brand and a documented source tier', () => {
    for (const r of WELFARE_PRODUCERS) {
      expect(r.brands.length).toBeGreaterThan(0);
      expect(r.sourceTier).toBeTruthy();
      expect(r.lastVerified).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  it('record ids are unique', () => {
    const ids = WELFARE_PRODUCERS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps egg and chicken records separated', () => {
    expect(EGG_PRODUCERS.every((r) => r.category === 'egg')).toBe(true);
    expect(CHICKEN_PRODUCERS.every((r) => r.category === 'chicken')).toBe(true);
  });
});

describe('getWelfareProducerByBrand', () => {
  it('matches a known on-pack brand (case-insensitive)', () => {
    expect(getWelfareProducerByBrand('Vital Farms')?.id).toBe('vital-farms');
    expect(getWelfareProducerByBrand('vital farms')?.id).toBe('vital-farms');
  });

  it('matches a sub-brand within a multi-brand record', () => {
    expect(getWelfareProducerByBrand("Nellie's Free Range")?.id).toBe('pete-and-gerrys');
    expect(getWelfareProducerByBrand('Hillshire Farm')?.id).toBe('tyson');
  });

  it('falls back to producer / parent company names', () => {
    expect(getWelfareProducerByBrand('Cal-Maine Foods')?.id).toBe('cal-maine');
  });

  it('returns undefined for unknown or empty brands', () => {
    expect(getWelfareProducerByBrand('Some Unrelated Brand')).toBeUndefined();
    expect(getWelfareProducerByBrand('')).toBeUndefined();
    expect(getWelfareProducerByBrand(null)).toBeUndefined();
  });

  it('does not false-match on generic tokens like "Farms" or "Foods"', () => {
    expect(getWelfareProducerByBrand('Acme Farms')).toBeUndefined();
  });

  it('hasWelfareRecord mirrors getWelfareProducerByBrand', () => {
    expect(hasWelfareRecord('Tyson')).toBe(true);
    expect(hasWelfareRecord('Nonexistent')).toBe(false);
  });
});

describe('label decoder & red flags', () => {
  it('has the full label decoder and red-flag sets', () => {
    expect(LABEL_DECODER.length).toBe(13);
    expect(GREENWASHING_RED_FLAGS.length).toBe(10);
  });

  it('looks up a label entry by partial text', () => {
    expect(getLabelInfo('American Humane Certified')?.credibility).toBe('Marketing');
    expect(getLabelInfo('Animal Welfare Approved')?.credibility).toBe('Meaningful');
  });
});

describe('welfareScoreTone', () => {
  it('maps 1-5 scores to good/warn/bad tones', () => {
    expect(welfareScoreTone(5)).toBe('good');
    expect(welfareScoreTone(4)).toBe('good');
    expect(welfareScoreTone(3)).toBe('warn');
    expect(welfareScoreTone(2)).toBe('bad');
    expect(welfareScoreTone(1)).toBe('bad');
  });
});
