// Guardrails for the supermarket feature.
//
// These encode the two rules that keep it legally defensible, so that they
// survive contact with future edits rather than living in a comment:
//
//   1. A retailer never carries an ethical judgement. Flags belong to the
//      manufacturer. "Tesco stocks a flagged product" is a sourced fact about a
//      manufacturer; "Tesco is unethical" is an unsourced claim about a
//      retailer, and it is the single most likely thing in this feature to
//      generate a letter.
//   2. Nothing ever claims stock. We cannot know what's on the shelf, so no
//      string the user reads may say we do.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  RETAILERS, getRetailersForCountry, getRetailerById,
  normaliseStoreTag, storeTagsMatchRetailer,
} from '@/data/retailers';
import { assessAvailability, CONFIDENCE_RANK } from '@/services/retailers';
import { orderReasonsByPriority, activePriorityLabels, type PlainReason } from '@/services/supermarket';
import { COUNTRIES } from '@/utils/userRegion';
import type { UserPriorities } from '@/utils/userPreferences';

describe('retailer data', () => {
  it('has unique ids', () => {
    const ids = RETAILERS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only lists countries the app actually supports', () => {
    // A chain in a market the region picker can't select is unreachable, and
    // silently suggests coverage we don't have.
    const supported = new Set(COUNTRIES.map((c) => c.code));
    for (const r of RETAILERS) {
      for (const c of r.countries) {
        expect(supported.has(c), `${r.name} lists unsupported market ${c}`).toBe(true);
      }
    }
  });

  it('gives every supported country at least one chain, or none at all', () => {
    // Partial coverage is fine; what isn't fine is a country with exactly one
    // chain, which reads as "this is where you shop" rather than a choice.
    for (const c of COUNTRIES) {
      const n = getRetailersForCountry(c.code).length;
      expect(n === 0 || n >= 2, `${c.name} has exactly ${n} chain`).toBe(true);
    }
  });

  it('always includes the plain name among the OFF aliases', () => {
    for (const r of RETAILERS) {
      const plain = normaliseStoreTag(r.name);
      const aliases = r.offAliases.map(normaliseStoreTag);
      expect(aliases, `${r.name} does not alias its own name`).toContain(plain);
    }
  });

  it('carries no ethical judgement on any retailer', () => {
    // The hard rule. If a score, verdict, flag or rating ever appears on a
    // Retailer, this is where it gets caught.
    const banned = ['score', 'rating', 'verdict', 'flag', 'severity', 'concern', 'ethicalScore'];
    for (const r of RETAILERS) {
      for (const key of Object.keys(r)) {
        expect(
          banned.some((b) => key.toLowerCase().includes(b.toLowerCase())),
          `Retailer.${key} looks like a judgement about ${r.name}`,
        ).toBe(false);
      }
    }
  });
});

describe('store tag matching', () => {
  const tesco = getRetailerById('tesco')!;
  const coop = getRetailerById('coop-uk')!;

  it('matches the spellings Open Food Facts actually returns', () => {
    expect(storeTagsMatchRetailer(['Tesco'], tesco)).toBe(true);
    expect(storeTagsMatchRetailer(['tesco'], tesco)).toBe(true);
    expect(storeTagsMatchRetailer(['en:Tesco'], tesco)).toBe(true);
    expect(storeTagsMatchRetailer(['Tesco Express'], tesco)).toBe(true);
  });

  it('does not invent availability from a substring', () => {
    // "Coop" inside "Co-op Funeralcare" or "Cooperative Bank" must not read as
    // a grocery sighting. This is the same class of bug that once matched
    // "Philly Swirl" to illycaffè in the brand-flag matcher.
    expect(storeTagsMatchRetailer(['Tescoland Toys'], tesco)).toBe(false);
    expect(storeTagsMatchRetailer(['Coopérative Agricole'], coop)).toBe(false);
    expect(storeTagsMatchRetailer(['Scottish Tesco Bank'], tesco)).toBe(false);
  });

  it('handles empty and missing tags', () => {
    expect(storeTagsMatchRetailer([], tesco)).toBe(false);
    expect(storeTagsMatchRetailer(null, tesco)).toBe(false);
    expect(storeTagsMatchRetailer(['', '  '], tesco)).toBe(false);
  });
});

describe('availability claims', () => {
  const tesco = getRetailerById('tesco')!;

  it('never says a product is in stock', () => {
    // Every branch of the ladder, checked for the one phrase we must not use.
    const cases = [
      assessAvailability(null, tesco, { barcode: 'x', soldInMarket: true }),
      assessAvailability(null, tesco, { barcode: 'x', soldInMarket: false }),
    ];
    for (const a of cases) {
      const text = `${a.label} ${a.explain}`.toLowerCase();
      expect(text, a.label).not.toContain('in stock');
      expect(text, a.label).not.toContain('available now');
      expect(text, a.label).not.toContain('guaranteed');
    }
  });

  it('always explains where the claim came from', () => {
    const a = assessAvailability(null, tesco, { barcode: 'x', soldInMarket: true });
    expect(a.explain.length).toBeGreaterThan(20);
    expect(a.label.length).toBeGreaterThan(0);
  });

  it('degrades to "unknown" rather than guessing', () => {
    const a = assessAvailability(null, tesco, { barcode: 'x', soldInMarket: false });
    expect(a.confidence).toBe('unknown');
  });

  it('ranks the confidence ladder in the right order', () => {
    expect(CONFIDENCE_RANK.confirmed_here).toBeGreaterThan(CONFIDENCE_RANK.seen_at_chain);
    expect(CONFIDENCE_RANK.seen_at_chain).toBeGreaterThan(CONFIDENCE_RANK.sold_in_market);
    expect(CONFIDENCE_RANK.sold_in_market).toBeGreaterThan(CONFIDENCE_RANK.unknown);
  });
});

describe('breakdown responds to the user’s priorities', () => {
  const P = (o: Partial<UserPriorities>): UserPriorities =>
    ({ environment: 50, laborRights: 50, animalWelfare: 50, nutrition: 50, ...o });

  const reasons: PlainReason[] = [
    { tone: 'good', text: 'No labour or boycott flags on this brand', pillar: 'labour' },
    { tone: 'good', text: 'Lower carbon than most chocolate', pillar: 'environment' },
    { tone: 'bad', text: 'Animal-welfare concerns reported', pillar: 'animal' },
    { tone: 'good', text: 'Carries 2 ethical certifications', pillar: 'other' },
  ];

  it('leads with the pillar the shopper marked critical', () => {
    // The card shows three lines before "More", so ordering decides what most
    // people ever read.
    expect(orderReasonsByPriority(reasons, P({ laborRights: 100 }))[0].pillar).toBe('labour');
    expect(orderReasonsByPriority(reasons, P({ environment: 100 }))[0].pillar).toBe('environment');
    expect(orderReasonsByPriority(reasons, P({ animalWelfare: 100 }))[0].pillar).toBe('animal');
  });

  it('puts bad news above good news within the same pillar', () => {
    // A problem in something they care about is the most useful thing on screen.
    const mixed: PlainReason[] = [
      { tone: 'good', text: 'good env', pillar: 'environment' },
      { tone: 'bad', text: 'bad env', pillar: 'environment' },
    ];
    expect(orderReasonsByPriority(mixed, P({ environment: 100 }))[0].tone).toBe('bad');
  });

  it('never drops a reason while reordering', () => {
    const out = orderReasonsByPriority(reasons, P({ environment: 100 }));
    expect(out).toHaveLength(reasons.length);
    expect(new Set(out.map((r) => r.text))).toEqual(new Set(reasons.map((r) => r.text)));
  });

  it('names only the priorities actually dialled up', () => {
    expect(activePriorityLabels(P({}))).toEqual([]);                       // all balanced
    expect(activePriorityLabels(P({ laborRights: 100 }))).toEqual(['Labour rights']);
    expect(activePriorityLabels(P({ laborRights: 100, environment: 100 })))
      .toEqual(['Labour rights', 'Environment']);
  });
});

describe('legal wording is present in the shipped source', () => {
  // Static checks: these strings are the disclosure, so their absence is a
  // regression even though no unit test would otherwise notice.
  const disclaimer = readFileSync(
    resolve(process.cwd(), 'src/components/RetailerDisclaimer.tsx'), 'utf8',
  );

  it('states there is no affiliation', () => {
    expect(disclaimer).toMatch(/not affiliated with/i);
  });

  it('states that this is not stock information', () => {
    expect(disclaimer).toMatch(/not stock information/i);
  });

  it('states that flags concern manufacturers, not retailers', () => {
    expect(disclaimer).toMatch(/manufacturers, never retailers/i);
  });

  it('attributes Open Food Facts under ODbL', () => {
    const svc = readFileSync(resolve(process.cwd(), 'src/services/supermarket/index.ts'), 'utf8');
    expect(svc).toMatch(/ODbL/);
  });

  it('does not reference any retailer logo asset', () => {
    // Naming a shop is nominative fair use; reproducing its logo is not.
    const page = readFileSync(resolve(process.cwd(), 'src/pages/Supermarket.tsx'), 'utf8');
    expect(page).not.toMatch(/logo/i);
  });
});
