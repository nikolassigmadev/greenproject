// Verified Ethics database — brands with strong, verified ethical practices

export interface EthicsHighlight {
  label: string;
  detail: string;
  source: string;
  sourceUrl: string;
}

interface VerifiedEthicsBrand {
  brandPattern: RegExp;
  brandName: string;
  highlights: EthicsHighlight[];
}

const VERIFIED_ETHICS_DATABASE: VerifiedEthicsBrand[] = [
  {
    brandPattern: /feastables/i,
    brandName: "Feastables",
    highlights: [
      { label: "Fair Trade Certified", detail: "Feastables chocolate is made with Fair Trade certified cocoa, ensuring farmers receive fair wages and safe working conditions.", source: "Feastables", sourceUrl: "https://feastables.com" },
      { label: "Sustainably Sourced", detail: "Uses sustainably sourced, plant-based ingredients with no artificial colors, flavors, or preservatives.", source: "Feastables", sourceUrl: "https://feastables.com" },
    ],
  },
  {
    brandPattern: /tony'?s?\s*chocolonely/i,
    brandName: "Tony's Chocolonely",
    highlights: [
      { label: "Slave-Free Chocolate Mission", detail: "Tony's Chocolonely's entire mission is to make chocolate 100% slave-free. They pay above Fairtrade prices and invest directly in farming communities in West Africa.", source: "Tony's Chocolonely", sourceUrl: "https://tonyschocolonely.com/us/en/our-mission" },
      { label: "Full Supply Chain Transparency", detail: "Tony's publishes an annual FAIR report detailing their bean-to-bar supply chain, traceability, and the premiums paid to cocoa farmers.", source: "Tony's Chocolonely Annual FAIR Report", sourceUrl: "https://tonyschocolonely.com/us/en/annual-fair-reports" },
      { label: "B Corp Certified", detail: "Tony's Chocolonely is a certified B Corporation, meeting rigorous standards for social and environmental performance, accountability, and transparency.", source: "B Corporation", sourceUrl: "https://www.bcorporation.net/" },
    ],
  },
];

export interface VerifiedEthicsRecord {
  brandName: string;
  highlights: EthicsHighlight[];
}

export function findVerifiedEthics(
  brand: string | null | undefined,
  productName: string | null | undefined,
): VerifiedEthicsRecord | null {
  const text = `${brand || ""} ${productName || ""}`.toLowerCase();
  for (const record of VERIFIED_ETHICS_DATABASE) {
    if (record.brandPattern.test(text)) {
      return { brandName: record.brandName, highlights: record.highlights };
    }
  }
  return null;
}
