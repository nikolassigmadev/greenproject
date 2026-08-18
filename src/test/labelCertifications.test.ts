import { describe, it, expect } from 'vitest';
import { findLabelCertifications } from '@/data/labelCertifications';

const types = (tags: string[]) => findLabelCertifications(tags).map((c) => c.type).sort();

describe('label certifications — real OFF tag sets', () => {
  it('reads a real Bjorg muesli payload', () => {
    // Taken verbatim from world.openfoodfacts.org product 3229820129488.
    expect(types([
      'en:organic', 'en:certified-by-ecocert', 'en:eu-organic', 'en:non-eu-agriculture',
      'en:source-of-fibre', 'en:certified-b-corporation', 'en:de-oko-001',
      'en:fr-bio-01', 'en:gb-org-05', 'en:high-fibres', 'en:no-added-sugar',
      'en:planet-score', 'fr:ab-agriculture-biologique',
    ])).toEqual(['b_corp', 'organic']);
  });

  it('collapses the national organic scheme codes to one organic result', () => {
    // fr-bio-01 / de-oko-001 / gb-org-05 are the EU scheme in local dress.
    expect(types(['en:fr-bio-01', 'en:de-oko-001', 'en:gb-org-05', 'en:eu-organic']))
      .toEqual(['organic']);
  });

  it('treats UTZ as Rainforest Alliance', () => {
    // UTZ merged into Rainforest Alliance in 2018; older packs still carry it.
    expect(types(['en:utz-certified'])).toEqual(['rainforest_alliance']);
  });

  it('reads seafood marks', () => {
    expect(types(['en:sustainable-seafood-msc'])).toEqual(['msc']);
    expect(types(['en:responsible-aquaculture-asc'])).toEqual(['asc']);
  });

  it('reads Fairtrade in English and French', () => {
    expect(types(['en:fairtrade-international'])).toEqual(['fair_trade']);
    expect(types(['fr:commerce-equitable'])).toEqual(['fair_trade']);
  });
});

describe('label certifications — must NOT match', () => {
  it('ignores nutrition claims, which are not certifications', () => {
    expect(types(['en:no-added-sugar', 'en:high-fibres', 'en:source-of-fibre',
                  'en:low-fat', 'en:gluten-free'])).toEqual([]);
  });

  it('ignores an empty or missing label list', () => {
    expect(types([])).toEqual([]);
    expect(findLabelCertifications(null)).toEqual([]);
    expect(findLabelCertifications(undefined)).toEqual([]);
  });

  it('does not treat Planet Score as a certification', () => {
    // Planet Score is an environmental rating, not a certificate anyone issues.
    expect(types(['en:planet-score', 'fr:Planet Score A'])).toEqual([]);
  });
});

describe('label certifications — the claim it makes', () => {
  it('states that we have not verified the certificate is current', () => {
    const [cert] = findLabelCertifications(['en:certified-b-corporation']);
    // The distinction between "carries the mark" and "is certified" is the
    // whole safety of this layer; it must survive into the UI copy.
    expect(cert.basis).toMatch(/have not/i);
    expect(cert.matchedTag).toBe('en:certified-b-corporation');
  });
});
