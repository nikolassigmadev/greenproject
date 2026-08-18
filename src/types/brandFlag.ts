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
  /**
   * ISO date the underlying matter STOPPED being live — a lawsuit settled or
   * dismissed, a CBP Withhold Release Order lifted, an entity removed from the
   * UFLPA list.
   *
   * This is the field that stops a true flag becoming a false one. A 2019
   * allegation that settled in 2023 was accurate when it was written and is
   * defamatory now, and nothing catches it: the URL still resolves, the page
   * still describes the allegation, and every liveness check passes. Setting
   * this takes the source out of the "live finding" count.
   */
  resolvedDate?: string;
  /**
   * True when this source documents a COMMODITY or REGION rather than any
   * particular company — the US DOL TVPRA list being the clearest example. It
   * establishes that cocoa from Côte d'Ivoire involves child labour; it says
   * nothing about who bought that cocoa.
   *
   * Marked on the source because it's a property of the document, true no
   * matter which company we attach it to. Whether a company is named is
   * per-flag (one lawsuit names six defendants and not a seventh), which is
   * why that lives in BrandFlagV2.claimType instead.
   */
  commodityLevel?: boolean;
}

/**
 * How strongly the sources connect this company to this finding.
 *
 * The distinction the tier system alone can't make: a tier-1 government report
 * proving child labour exists in Ivorian cocoa is excellent evidence about
 * Ivorian cocoa. Used to flag a chocolate brand, it is an inference — accurate,
 * defensible, and materially weaker than "a court found this company liable".
 * Presenting both in the same words is the single easiest thing to attack about
 * this dataset, so the schema records which one we have.
 */
export type ClaimType =
  /** A source names this company: a lawsuit, a regulatory action, its own disclosure. */
  | 'direct'
  /**
   * Sources document the commodity, region or sector; the company is linked
   * because it sources from there. Still evidence — just of a different claim.
   */
  | 'supply_chain_inference';

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
  | 'archived';       // removed from production but kept for history

export interface BrandFlagV2 {
  id: string;                    // stable slug, e.g., "nestle-forced-labour-2023"
  brandName: string;
  brandAliases?: string[];       // alternative names / parent companies
  category: FlagCategory;
  severity: FlagSeverity;
  /**
   * Whether the sources name this company, or document the commodity it buys.
   * Set to the STRONGEST claim the sources support: 'direct' if any one source
   * names the company, 'supply_chain_inference' otherwise.
   */
  claimType: ClaimType;
  summary: string;               // one-sentence claim, factual tone
  details: string;               // 2–4 sentences, factual, no editorialising
  sources: FlagSource[];
  /**
   * The company's own answer to this allegation, where one exists.
   *
   * This is the single strongest legal position available to us, and it costs
   * nothing but the link. A flag on its own is us making an accusation. A flag
   * shown next to "Nestlé's response: [link]" is us reporting a documented
   * dispute — which is a materially better place to stand if anyone complains,
   * and it is the structure the Business & Human Rights Resource Centre uses
   * for exactly that reason.
   *
   * It also gives the dispute process a middle state. Today a company that
   * contests a flag can only have it removed or not; publishing their reply
   * beside the claim is the outcome that is fair to both a shopper who wants
   * the facts and a company that disagrees with them.
   *
   * Deliberately left EMPTY rather than pre-filled. A response attributed to a
   * company that they did not give is a worse problem than the flag itself, so
   * every entry has to be a real, linkable statement.
   */
  companyResponse?: {
    /** Short, neutral summary of what they said. Never paraphrased into a concession. */
    summary: string;
    /** Link to the statement — their site, or the BHRRC page carrying it. */
    url: string;
    /** ISO date the response was published. */
    date: string;
    /** Where we found it, e.g. "Company statement" or "BHRRC". */
    publisher: string;
  };
  status: VerificationStatus;
  lastVerified: string;          // ISO 8601
  createdAt: string;
  updatedAt: string;
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
