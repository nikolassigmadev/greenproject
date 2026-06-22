/**
 * LIVE integration test — hits the production backend to diagnose why real
 * scans ("Theo Chocolate Crisp", "Tony's Chocolonely") fail to match.
 * Run: npx vitest run src/utils/scanMatch.integration.test.ts
 */
import { describe, it } from 'vitest';
import { searchProducts } from '@/services/openfoodfacts';
import { pickBestMatch } from '@/utils/productRelevance';

// Mirror the query building in Scan.tsx::processImageForOFF
function buildScanQueries(brand: string, product: string): { rawQuery: string; queries: string[] } {
  const brandOnly = brand.trim();
  const prodOnly = product.trim();
  const rawQuery = [brandOnly, prodOnly].filter(Boolean).join(' ');
  const queries: string[] = [];
  const add = (q: string) => { if (q && !queries.some(s => s.toLowerCase() === q.toLowerCase())) queries.push(q); };
  if (brandOnly && prodOnly) add(`${brandOnly} ${prodOnly}`);
  if (prodOnly) add(prodOnly);
  add(rawQuery);
  if (brandOnly) add(brandOnly);
  const words = rawQuery.split(' ').filter(Boolean);
  for (let len = words.length - 1; len >= 2; len--) add(words.slice(0, len).join(' '));
  return { rawQuery, queries };
}

const CASES: { label: string; brand: string; product: string }[] = [
  { label: 'Theo — coconut crisp', brand: 'Theo Chocolate', product: 'Coconut Crisp' },
  { label: 'Theo — chocolate crisp', brand: 'Theo', product: 'Chocolate Crisp' },
  { label: 'Theo — dark chocolate', brand: 'Theo Chocolate', product: 'Dark Chocolate' },
  { label: "Tony's — milk chocolate", brand: "Tony's Chocolonely", product: 'Milk Chocolate' },
  { label: "Tony's — chocolonely (brand only product)", brand: "Tony's", product: 'Chocolonely' },
];

describe('LIVE scan match diagnosis', () => {
  for (const c of CASES) {
    it(`${c.label}`, async () => {
      const { rawQuery, queries } = buildScanQueries(c.brand, c.product);
      const brandOnly = c.brand.trim();
      console.log(`\n══════ ${c.label} ══════`);
      console.log(`rawQuery="${rawQuery}"  brandGate="${brandOnly}"`);
      console.log(`queries: ${queries.map(q => `"${q}"`).join(', ')}`);

      let matched = false;
      for (const q of queries) {
        const results = await searchProducts(q, 20);
        const topNames = results.slice(0, 4).map(r => `${r.productName}|${r.brand}|eco:${r.ecoscoreGrade}`);
        const withGate = pickBestMatch(results, rawQuery, q, undefined, brandOnly || undefined);
        const noGate = pickBestMatch(results, rawQuery, q);
        console.log(
          `  q="${q}" → ${results.length} results` +
          ` | GATE pass=${withGate.passedRelevanceGate} brandOnly=${withGate.brandOnlyFallback} conf=${withGate.confidence.toFixed(2)} → ${withGate.product?.productName ?? 'NONE'}` +
          ` | NOGATE pass=${noGate.passedRelevanceGate} → ${noGate.product?.productName ?? 'NONE'}`,
        );
        if (results.length > 0) console.log(`     top: ${topNames.join('  ;  ')}`);
        if (withGate.passedRelevanceGate && withGate.product) {
          console.log(`  ✅ MATCH via gate: ${withGate.product.productName} by ${withGate.product.brand} [${withGate.product.barcode}]`);
          matched = true;
          break;
        }
      }
      if (!matched) console.log(`  ❌ NO MATCH (would show "product not found")`);
    }, 60000);
  }
});
