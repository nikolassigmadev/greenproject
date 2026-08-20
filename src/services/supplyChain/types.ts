// Supply-chain graph types.
//
// See docs/SUPPLY_CHAIN_INVARIANTS.md. The short version: every node and edge
// declares how much we actually know, and "we don't know" is a first-class
// answer that renders as a node rather than a line.

/** How strongly the evidence supports this node or edge. */
export type ProvenanceTier =
  /** A field on the product itself, or a citable entry in one of our datasets. */
  | 'declared'
  /** Where this commodity, sold in this market, typically comes from. */
  | 'inferred'
  /** No basis at all. Renders as a "not disclosed" node — never as a line. */
  | 'unknown';

export type NodeKind = 'origin' | 'processing' | 'destination';

/** Same shape as MapCompany['sources'] so the citation renderer works unchanged. */
export interface SourceRef {
  label: string;
  url?: string;
}

export interface SupplyChainNode {
  id: string;
  kind: NodeKind;
  label: string;
  /** null when the tier is 'unknown' — there is nowhere to draw it. */
  lon: number | null;
  lat: number | null;
  tier: ProvenanceTier;
  /** 0–1. Not a probability; a stated confidence in this specific claim. */
  confidence: number;
  /** Plain English, shown to the user verbatim. Must state the inference. */
  basis: string;
  sources: SourceRef[];
  /** Commodity this origin relates to, e.g. "cocoa". Origins only. */
  commodity?: string;
  /**
   * Declared share of this origin, 0-100, ONLY where the pack prints it.
   *
   * In practice this is honey: since 14 June 2026, Dir. (EU) 2024/1438 requires
   * every jar to list each origin country in descending order WITH its
   * percentage. That makes honey the one category where a complete, verified,
   * percentage-weighted breakdown is possible today.
   *
   * Never estimated, never normalised to sum to 100. Absent means the pack did
   * not say, which is the ordinary case for every other category.
   */
  declaredShare?: number;
  /** True when this commodity+country appears on the US DOL TVPRA list. */
  tvpraFlagged?: boolean;
}

export interface SupplyChainEdge {
  from: string;
  to: string;
  tier: ProvenanceTier;
  confidence: number;
  basis: string;
}

export interface SupplyChainGraph {
  nodes: SupplyChainNode[];
  /** Never contains an edge touching an 'unknown' node. */
  edges: SupplyChainEdge[];
  /** How many ingredients we could say nothing about. */
  undisclosedCount: number;
  /**
   * The strongest tier anywhere in the graph. Drives the headline copy, so the
   * page never claims more than its best evidence.
   */
  bestTier: ProvenanceTier;
  /** True when we have nothing at all — the honest empty state. */
  isEmpty: boolean;
}

// ── Evidence read off the physical pack ──────────────────────────────────────

export type OriginStatementKind =
  | 'origin'
  | 'reared'
  | 'slaughtered'
  | 'caught'
  | 'organic_region'
  | 'protected_designation';

/** One origin statement as printed on the packaging. */
export interface OriginStatement {
  /** Verbatim, exactly as printed. Shown to the user unaltered (INVARIANTS §7). */
  text: string;
  kind: OriginStatementKind;
  /** ISO 3166-1 alpha-2, only where the country is NAMED on the pack. */
  countries: string[];
  /** Declared share per country. Only where printed — honey, mainly. */
  percentages?: Record<string, number>;
}

/**
 * What the packaging itself told us, passed INTO the resolver.
 *
 * Plain data only — no promises, no functions. The OCR call that produces this
 * is asynchronous and lives in the component; the resolver stays a pure
 * function of its inputs (INVARIANTS §4) and the audit harnesses keep working
 * unchanged. This is the same shape of contract as PrecomputedOrigin.
 */
export interface PackagingEvidence {
  /** Origin statements read off the pack (rung A4). */
  statements?: OriginStatement[];
  /**
   * Establishment number from the USDA inspection mark, e.g. "EST. 34D".
   * Kept for display and logging; the RESOLVED facility is the field below.
   */
  usdaEstablishment?: string | null;
  /**
   * The FSIS facility that number resolves to, already looked up.
   *
   * Resolved by the caller rather than in the resolver, and passed in as plain
   * data, for a bundle-size reason worth stating: the FSIS directory is 13,290
   * establishments, and importing it from the resolver put ~305 KB (gzipped)
   * into the verdict-page chunk for every scan of every product worldwide — to
   * serve a feature that only ever fires on US meat and poultry. The caller can
   * `await import()` the directory only when a number was actually read, so the
   * bundle cost is paid by the scans that use it and by no others.
   *
   * The resolver still gets everything it needs and stays pure and synchronous.
   */
  usdaFacility?: {
    establishmentNumber: string;
    name: string;
    city: string;
    state: string;
    lon: number;
    lat: number;
  } | null;
}

// ── The precomputed index (rungs A1-A3, resolved offline) ────────────────────

/** One claim from the precomputed index. Plain data, straight from Postgres. */
export interface PrecomputedClaim {
  /** Which rung produced it: 'A1' | 'A2' | 'A3'. */
  rung: string;
  tier: ProvenanceTier;
  confidence: number;
  /** The raw value — an origins tag, a label tag, or a manufacturing place. */
  value: string;
  /** ISO 3166-1 alpha-2 where the rung could determine one. */
  iso2?: string | null;
  /** 'processing' for rung A3; absent means an ingredient-origin claim. */
  kind?: string;
  /** Plain English, shown to the user verbatim (INVARIANTS §7). */
  basis: string;
}

/**
 * A row from GET /api/origin/:barcode.
 *
 * PLAIN DATA — no promises, no functions. The fetch happens in the component;
 * the resolver receives the result as an ordinary argument and stays a pure
 * function of its inputs, so the audit harnesses keep working unchanged.
 */
export interface PrecomputedOrigin {
  code: string;
  market?: string | null;
  brand?: string | null;
  bestTier: ProvenanceTier;
  commodities?: string[];
  claims: PrecomputedClaim[];
  nClaims?: number;
  builtAt?: string | null;
}
