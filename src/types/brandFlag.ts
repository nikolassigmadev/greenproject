/*
 * SOURCING BAR (a flag may be 'verified' only if it meets ONE of these):
 *   - At least 1 tier-1 source, OR
 *   - At least 2 tier-2 sources from independent organisations, OR
 *   - At least 1 tier-2 source AND 2 tier-3 sources covering the same finding.
 * A flag with only tier-3 sources is 'pending_review' and not shown in production.
 */

export type SourceTier = 'tier1' | 'tier2' | 'tier3';

export type SourceType =
  | 'court_filing'             // tier1
  | 'regulatory_finding'       // tier1
  | 'government_report'        // tier1 (e.g., US DOL TVPRA list)
  | 'corporate_admission'      // tier1
  | 'ngo_report'               // tier2 (KnowTheChain, BHRRC, Walk Free, ILO)
  | 'academic_study'           // tier2
  | 'investigative_journalism' // tier3
  | 'news_report';             // tier3

export interface FlagSource {
  url: string;
  title: string;
  publisher: string;        // e.g., "US Department of Labor", "KnowTheChain"
  type: SourceType;
  tier: SourceTier;
  publishedDate: string;    // ISO 8601 (YYYY-MM-DD)
  accessedDate: string;     // ISO 8601, when we verified it
  jurisdiction?: string;    // e.g., "US", "EU", "Global"
  excerpt?: string;         // optional short quote (under 25 words)
}

export type FlagCategory =
  | 'forced_labour'
  | 'child_labour'
  | 'wage_theft'
  | 'unsafe_conditions'
  | 'union_busting'
  | 'discrimination'
  | 'supply_chain_opacity'
  | 'animal_welfare'
  | 'environmental_harm'
  | 'boycott_listed';

export type FlagSeverity = 'critical' | 'high' | 'medium' | 'low';

export type VerificationStatus =
  | 'verified'        // meets sourcing bar, shown in production
  | 'pending_review'  // awaiting source verification, not shown in production
  | 'disputed'        // brand has formally disputed; under review
  | 'archived';       // removed from production but kept for history

export interface BrandFlagV2 {
  id: string;                    // stable slug, e.g., "nestle-forced-labour-2023"
  brandName: string;
  brandAliases?: string[];       // alternative names / parent companies
  category: FlagCategory;
  severity: FlagSeverity;
  summary: string;               // one-sentence claim, factual tone
  details: string;               // 2–4 sentences, factual, no editorialising
  sources: FlagSource[];
  status: VerificationStatus;
  lastVerified: string;          // ISO 8601
  createdAt: string;
  updatedAt: string;
  disputeNotes?: string;         // if brand has formally responded
}

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

export function isVerified(flag: BrandFlagV2): boolean {
  return flag.status === 'verified';
}

export function meetsSourcingBar(flag: BrandFlagV2): boolean {
  const sources = flag.sources;

  const tier1Count = sources.filter((s) => s.tier === 'tier1').length;
  if (tier1Count >= 1) return true;

  const tier2Sources = sources.filter((s) => s.tier === 'tier2');
  const tier3Sources = sources.filter((s) => s.tier === 'tier3');

  // 2 independent tier-2 sources (different publishers)
  const uniqueTier2Publishers = new Set(tier2Sources.map((s) => s.publisher));
  if (uniqueTier2Publishers.size >= 2) return true;

  // 1 tier-2 + 2 tier-3 covering the same finding
  if (tier2Sources.length >= 1 && tier3Sources.length >= 2) return true;

  return false;
}
