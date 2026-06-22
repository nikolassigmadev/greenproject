// Adapter: turn the Chocolate Brand Directory's LEADER/BETTER makers into swap
// candidates the engine can recommend when a CAUTION/AVOID chocolate is scanned.
//
// The directory (chocolateDirectory.ts) is the reference dataset; this maps its
// "buy these" tier onto the AltCandidate shape the swap engine consumes. Brands
// already in the hand-curated catalog (Tony's, Divine, Equal Exchange, Alter
// Eco…) are deduped away upstream — the catalog entry, with real market data,
// wins. This fills in the long tail (Beyond Good, Taza, Theo, Pacari…).

import { getChocolateLeaders, type ChocolateEntry } from "@/data/chocolateDirectory";
import type { AltCandidate, ConcernType, SwapCategoryKey } from "@/data/ethicalAlternatives";
import type { CertificationType } from "@/utils/verifiedEthics";

// Infer certifications from the directory note + sourcing text.
function inferCertifications(entry: ChocolateEntry): CertificationType[] {
  const text = `${entry.note} ${entry.sourcing}`.toLowerCase();
  const certs: CertificationType[] = [];
  if (/fair[\s-]?trade|fairtrade/.test(text)) certs.push("fair_trade");
  if (/\borganic\b/.test(text)) certs.push("organic");
  if (/direct[\s-]?trade/.test(text)) certs.push("direct_trade");
  if (/worker-owned|co-?op|cooperative|farmer-owned|co-owned/.test(text)) certs.push("worker_coop");
  if (/rainforest/.test(text)) certs.push("rainforest_alliance");
  if (/regenerative/.test(text)) certs.push("regenerative_organic");
  return [...new Set(certs)];
}

// Which concerns a leader meaningfully addresses. All address labour (their
// whole pitch is supply-chain integrity); organic/regenerative/agroforestry
// makers also address eco.
function inferAddresses(entry: ChocolateEntry): ConcernType[] {
  const text = `${entry.note} ${entry.sourcing}`.toLowerCase();
  const addresses: ConcernType[] = ["labor"];
  if (/organic|regenerative|agroforestry|reforestation|carbon|sail-shipped/.test(text)) {
    addresses.push("eco");
  }
  return addresses;
}

// Short, scannable strengths from the note (split on sentence/clause breaks).
function toStrengths(entry: ChocolateEntry): string[] {
  return entry.note
    .split(/[;.]\s+/)
    .map((s) => s.trim().replace(/\.$/, ""))
    .filter((s) => s.length > 0)
    .slice(0, 2);
}

function toCandidate(entry: ChocolateEntry): AltCandidate {
  const certifications = inferCertifications(entry);
  return {
    brand: entry.name,
    productName: entry.name,
    searchQuery: `${entry.name} chocolate`,
    certifications,
    strengths: toStrengths(entry),
    addresses: inferAddresses(entry),
    // Market coverage isn't tracked in the directory, so we don't assume local
    // availability — only claim it when Open Food Facts confirms a country.
    assumeAvailable: false,
    fallbackEcoGrade: certifications.includes("organic") ? "b" : "c",
  };
}

let CACHE: AltCandidate[] | null = null;

/** Directory "buy these" makers as chocolate swap candidates. */
export function getChocolateDirectoryCandidates(category: SwapCategoryKey): AltCandidate[] {
  if (category !== "chocolate") return [];
  if (!CACHE) CACHE = getChocolateLeaders().map(toCandidate);
  return CACHE;
}
