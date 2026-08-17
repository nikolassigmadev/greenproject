// Citations for the supply-chain map.
//
// One registry, so a claim can't be rendered without one and a URL can't drift
// between the three places that used to reference it. Every entry here was
// fetched and returned HTTP 200 on the accessed date — see the verification
// note on each. A citation that 404s is worse than no citation: it implies
// there was something to check.
//
// Two of these were wrong on the first attempt and are recorded as fixed rather
// than quietly corrected:
//   - ferrerosustainability.com/.../sourcing-ingredients → 404. The real page
//     is on ferrero.com.
//   - rainforest-alliance.org/insights/what-is-sustainable-cocoa/ → 404.
//     Dropped rather than replaced with a guess.

import type { SourceRef } from '@/services/supplyChain/types';

/** Last date every URL in this file was fetched and confirmed to return 200. */
export const SOURCES_VERIFIED_ON = '2026-08-17';

// ── Commodity-level risk ─────────────────────────────────────────────────────

/**
 * The join key that makes this map mean something rather than just be geography.
 *
 * IMPORTANT, and repeated wherever this is used: TVPRA is COMMODITY-level. It
 * establishes that cocoa from Côte d'Ivoire involves child labour. It says
 * nothing about which company bought that cocoa. Every UI string built on it
 * has to carry that distinction — it is the same rule the brand flags follow
 * via claimType: 'supply_chain_inference'.
 *
 * US Government work — public domain.
 */
export const DOL_TVPRA: SourceRef = {
  label: 'US Dept of Labor — List of Goods Produced by Child Labor or Forced Labor (2024)',
  url: 'https://www.dol.gov/agencies/ilab/reports/child-labor/list-of-goods',
};

// ── Product-level ────────────────────────────────────────────────────────────

export const OFF_PRODUCT: SourceRef = {
  label: 'Open Food Facts — product record (ODbL)',
  url: 'https://world.openfoodfacts.org',
};

// ── Independent assessment ───────────────────────────────────────────────────

/**
 * Be Slavery Free's Chocolate Scorecard — the basis for every entry in
 * src/data/chocolateDirectory.ts, which until now carried no citation at all.
 * 6th edition, 2025, assessing 81 cocoa and chocolate companies.
 */
export const CHOCOLATE_SCORECARD: SourceRef = {
  label: 'Chocolate Scorecard 2025 — Be Slavery Free',
  url: 'https://www.beslaveryfree.com/chocolate-scorecard',
};

// ── Company sourcing programmes ──────────────────────────────────────────────
//
// Where a brand publishes its own cocoa origins, cite the brand's own
// disclosure. That is what makes the claim `declared` rather than inferred —
// it is the company's statement about itself, not our inference about it.

export const COMPANY_COCOA_PROGRAMMES: Record<string, SourceRef> = {
  ferrero: {
    label: 'Ferrero — Sourcing cocoa sustainably (Ferrero Farming Values)',
    url: 'https://www.ferrero.com/int/en/people-planet/source-our-ingredients-sustainably/cocoa',
  },
  nestle: {
    label: 'Nestlé Cocoa Plan — sourcing and origins',
    url: 'https://www.nestlecocoaplan.com/',
  },
  mondelez: {
    label: 'Cocoa Life (Mondelēz) — sourcing origins',
    url: 'https://www.cocoalife.org/',
  },
};

/** Match a brand to its own published cocoa programme, if it has one. */
export function companyCocoaSource(brand: string | null | undefined): SourceRef | null {
  if (!brand) return null;
  const b = brand.toLowerCase();
  if (/ferrero|nutella|kinder|tic\s?tac|rocher/.test(b)) return COMPANY_COCOA_PROGRAMMES.ferrero;
  if (/nestl|kitkat|kit kat|smarties|aero|milkybar/.test(b)) return COMPANY_COCOA_PROGRAMMES.nestle;
  if (/mondel|cadbury|milka|toblerone|oreo|côte d'or|cote d'or/.test(b)) {
    return COMPANY_COCOA_PROGRAMMES.mondelez;
  }
  return null;
}

// ── Certification schemes ────────────────────────────────────────────────────

export const FAIRTRADE_COCOA: SourceRef = {
  label: 'Fairtrade International — cocoa standards and producing regions',
  url: 'https://www.fairtrade.net/product/cocoa',
};

export const RSPO: SourceRef = {
  label: 'Roundtable on Sustainable Palm Oil (RSPO)',
  url: 'https://rspo.org/',
};

// ── Where the coordinates come from ──────────────────────────────────────────

/**
 * Origin points are PRODUCTION centroids, not political capitals — cocoa grows
 * in south-west Côte d'Ivoire, not Yamoussoukro. That is a claim about
 * geography and it needs a citation like any other.
 *
 * These two are the reference for which regions actually produce which
 * commodity; the coordinates themselves are representative points chosen inside
 * those regions, which is why the map copy says "region" and never "farm".
 */
export const FAOSTAT_PRODUCTION: SourceRef = {
  label: 'FAOSTAT — Crops and livestock products (production by country), CC BY 4.0',
  url: 'https://www.fao.org/faostat/en/#data/QCL',
};

export const ICCO_STATISTICS: SourceRef = {
  label: 'International Cocoa Organization — production statistics',
  url: 'https://www.icco.org/statistics/',
};

/** Base map. Public domain, and vendored into the repo so it works offline. */
export const NATURAL_EARTH: SourceRef = {
  label: 'Natural Earth / world-atlas — country outlines (public domain)',
  url: 'https://www.naturalearthdata.com/',
};

/**
 * Shown once at the bottom of the map, covering the things that back the whole
 * picture rather than any single pin. ODbL attribution for Open Food Facts is a
 * licence condition, not a courtesy.
 */
export const BASE_SOURCES: SourceRef[] = [
  OFF_PRODUCT,
  FAOSTAT_PRODUCTION,
  NATURAL_EARTH,
];
