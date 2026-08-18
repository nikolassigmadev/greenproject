// Certifications read straight off the product's own Open Food Facts labels.
//
// WHY THIS IS THE CHEAPEST COVERAGE WE WILL EVER GET. Every product payload we
// already fetch carries `labels_tags`. No new API, no key, no research, no
// scraping — the data is sitting in a field we were discarding.
//
// WHY IT IS ALSO THE SAFEST LAYER IN THE APP. Everything else here is an
// allegation: someone did something bad, and we are repeating it. A
// certification is the opposite. "This pack carries the EU organic mark" is a
// statement about what is printed on the packaging, made by the certifier, and
// reported by the manufacturer. There is no defamation risk in correctly
// reporting a certificate a company publicly holds, and it lets the app say
// something positive instead of only ever accusing.
//
// WHAT THIS IS NOT. It is not verification. We are reporting a label claim
// recorded by an Open Food Facts contributor from the packaging; we have not
// queried B Lab's or Fairtrade's registry to confirm the certificate is
// current. That distinction is carried in `basis` and must survive into any UI
// copy — "carries the Fairtrade mark" is honest, "is Fairtrade certified" is a
// claim we have not checked.
//
// The registry lookups the plan mentions (B Lab directory, Fairtrade licensee
// finder, Rainforest Alliance certificate search, SBTi's downloadable list) are
// the upgrade path: same CertificationType vocabulary, stronger basis. This
// layer does not block that work, it front-runs it at zero cost.

import type { CertificationType } from '@/utils/verifiedEthics';

export interface LabelCertification {
  type: CertificationType;
  /** The OFF tag that matched, kept so a wrong mapping can be traced back. */
  matchedTag: string;
  /** Plain English, shown to the user. States the limits of the claim. */
  basis: string;
}

/**
 * OFF label tag → certification.
 *
 * Tags are matched as prefixes against `labels_tags`, which are lowercase and
 * language-prefixed (`en:`, `fr:`, `de:`). Prefix matching handles the long
 * tail of national organic scheme codes — en:fr-bio-01, en:de-oko-001,
 * en:gb-org-05 are all the EU organic scheme wearing different hats.
 *
 * Deliberately conservative: a tag only appears here if it unambiguously means
 * the certification. `en:no-added-sugar` and `en:high-fibres` are nutrition
 * claims, not certifications, and are absent on purpose.
 */
const TAG_MAP: { tags: string[]; type: CertificationType; basis: string }[] = [
  {
    tags: ['en:certified-b-corporation', 'en:b-corp', 'en:bcorp'],
    type: 'b_corp',
    basis: 'The packaging carries the Certified B Corporation mark. We have not queried B Lab’s directory to confirm the certificate is current.',
  },
  {
    tags: ['en:fairtrade', 'en:fair-trade', 'en:fairtrade-international',
           'en:max-havelaar', 'en:fairtrade-cotton', 'fr:commerce-equitable'],
    type: 'fair_trade',
    basis: 'The packaging carries a Fairtrade mark. We have not confirmed the licence against Fairtrade International’s register.',
  },
  {
    tags: ['en:organic', 'en:eu-organic', 'en:usda-organic', 'en:bio',
           'en:certified-by-ecocert', 'en:ab-agriculture-biologique',
           'en:fr-bio-', 'en:de-oko-', 'en:gb-org-', 'en:it-bio-', 'en:es-eco-',
           'fr:ab-agriculture-biologique'],
    type: 'organic',
    basis: 'The packaging carries a certified-organic mark (EU, USDA or an accredited national scheme).',
  },
  {
    tags: ['en:rainforest-alliance', 'en:utz', 'en:utz-certified'],
    type: 'rainforest_alliance',
    basis: 'The packaging carries the Rainforest Alliance mark (UTZ merged into Rainforest Alliance in 2018).',
  },
  {
    tags: ['en:sustainable-seafood-msc', 'en:msc', 'en:marine-stewardship-council'],
    type: 'msc',
    basis: 'The packaging carries the Marine Stewardship Council mark for wild-caught fish.',
  },
  {
    tags: ['en:responsible-aquaculture-asc', 'en:asc', 'en:aquaculture-stewardship-council'],
    type: 'asc',
    basis: 'The packaging carries the Aquaculture Stewardship Council mark for farmed fish.',
  },
  {
    tags: ['en:certified-humane'],
    type: 'certified_humane',
    basis: 'The packaging carries the Certified Humane mark for animal welfare.',
  },
  {
    tags: ['en:animal-welfare-approved', 'en:a-greener-world'],
    type: 'animal_welfare_approved',
    basis: 'The packaging carries the Animal Welfare Approved mark.',
  },
  {
    tags: ['en:regenerative-organic-certified'],
    type: 'regenerative_organic',
    basis: 'The packaging carries the Regenerative Organic Certified mark.',
  },
  {
    tags: ['en:carbon-neutral', 'en:climate-neutral', 'en:certified-carbon-neutral'],
    type: 'climate_neutral',
    basis: 'The packaging carries a climate/carbon-neutral certification mark. These schemes vary widely in rigour and often rely on offsetting rather than reduction.',
  },
];

/**
 * Certifications claimed on this product's packaging.
 *
 * Pure and synchronous, matching the resolver contract used elsewhere, so the
 * coverage harness and the audit harness can both call it directly.
 *
 * Deduplicated by type: a product tagged both `en:organic` and `en:eu-organic`
 * is organic once, not twice.
 */
export function findLabelCertifications(
  labelsTags: string[] | null | undefined,
): LabelCertification[] {
  if (!labelsTags || labelsTags.length === 0) return [];
  const lower = labelsTags.map((t) => t.toLowerCase().trim()).filter(Boolean);
  const out: LabelCertification[] = [];
  const seen = new Set<CertificationType>();

  for (const entry of TAG_MAP) {
    if (seen.has(entry.type)) continue;
    const hit = lower.find((t) => entry.tags.some((want) => t === want || t.startsWith(want)));
    if (hit) {
      seen.add(entry.type);
      out.push({ type: entry.type, matchedTag: hit, basis: entry.basis });
    }
  }
  return out;
}
