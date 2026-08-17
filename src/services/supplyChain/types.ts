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
