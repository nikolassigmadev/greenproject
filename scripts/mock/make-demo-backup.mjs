/**
 * Generates a GoodScan backup file full of plausible demo data, so the home
 * screen's impact card has something to show without weeks of real scanning.
 *
 * The format is exactly what src/utils/dataBackup.ts writes and validates:
 *   { app: "goodscan", version: 1, exportedAt, data: { <lsKey>: <string> } }
 * Every value in `data` must be a STRING, because that is what localStorage
 * holds — nested objects get stringified, not embedded.
 *
 *   node scripts/mock/make-demo-backup.mjs
 */
import { writeFileSync } from 'node:fs';

const now = Date.now();
const daysAgo = (d, h = 0) => now - d * 864e5 - h * 36e5;

// Real barcodes and products, so the entries look like genuine scans rather
// than lorem ipsum. Grades are plausible, not asserted as fact — this is demo
// data and it never leaves the device.
const P = [
  ['3017620422003', 'Nutella',                'Ferrero',      'd', 28, 'e', 2, 5, 3.4],
  ['7613035385696', 'Kit Kat 4 Finger',       'Nestlé',       'c', 46, 'd', 3, 4, 2.1],
  ['5449000000996', 'Coca-Cola Original',     'Coca-Cola',    'd', 32, 'e', 1, 4, 0.4],
  ['8000500310427', 'Kinder Bueno',           'Ferrero',      'd', 30, 'e', 2, 4, 3.1],
  ['7622210449283', 'Oreo Original',          'Mondelēz',     'c', 44, 'd', 1, 4, 1.5],
  ['5000159484695', 'Snickers',               'Mars',         'c', 48, 'd', 2, 4, 2.3],
  ['3229820129488', 'Bjorg Oat Drink',        'Bjorg',        'a', 82, 'b', 0, 1, 0.3],
  ['5411188110835', 'Alpro Soya Original',    'Alpro',        'a', 79, 'b', 0, 1, 0.3],
  ['8712566441174', 'Ben & Jerry’s Vanilla',  'Ben & Jerry’s','c', 51, 'd', 1, 4, 2.8],
  ['3168930010265', 'Bonne Maman Strawberry', 'Bonne Maman',  'b', 63, 'c', 0, 3, 0.9],
  ['80177173',      'Pringles Original',      'Kellanova',    'd', 35, 'd', 1, 4, 2.6],
  ['5000112637922', 'Lipton Yellow Label Tea','Unilever',     'b', 61, 'b', 2, 1, 1.2],
  ['3502110009449', 'Tipiak Couscous',        'Tipiak',       'b', 66, 'a', 0, 1, 0.7],
  ['4009900000490', 'Haribo Goldbears',       'Haribo',       'c', 43, 'e', 0, 4, 1.1],
];

const verdictFor = (grade, labor) => {
  if (labor >= 2) return { emoji: '🚫', label: 'Avoid', color: '#dc2626' };
  if (grade === 'a') return { emoji: '✅', label: 'Good pick', color: '#16a34a' };
  if (grade === 'b') return { emoji: '👍', label: 'Decent', color: '#65a30d' };
  if (grade === 'c') return { emoji: '⚠️', label: 'Think twice', color: '#f59e0b' };
  return { emoji: '🚫', label: 'Avoid', color: '#dc2626' };
};

const scanHistory = P.map(([bc, name, brand, grade, score, nutri, labor, nova, co2], i) => ({
  id: `demo-${bc}`,
  barcode: bc,
  productName: name,
  brand,
  imageUrl: `https://images.openfoodfacts.org/images/products/front_en.400.jpg`,
  timestamp: daysAgo(i, i * 2),
  verdict: verdictFor(grade, labor),
  scores: { ecoScore: score, ecoGrade: grade, nutriScore: nutri, laborAllegations: labor, novaGroup: nova },
  carbonFootprint100g: co2,
  labels: grade === 'a' ? ['organic'] : [],
}));

// Basket = what they'd buy next. Skewed to the better picks, with two
// borderline items so the card has something to push back on.
const basket = [P[6], P[7], P[12], P[9], P[4]].map(([bc, name, brand, grade, score, nutri, labor, , co2], i) => ({
  id: `demo-basket-${bc}`,
  barcode: bc,
  productName: name,
  brand,
  imageUrl: 'https://images.openfoodfacts.org/images/products/front_en.400.jpg',
  ecoscoreGrade: grade,
  ecoscoreScore: score,
  nutriscoreGrade: nutri,
  laborAllegations: labor,
  co2Per100g: co2,
  addedAt: daysAgo(i),
}));

// Decisions drive the "you skipped N" side of the impact card. Rejections are
// weighted toward the flagged products, which is what the card is meant to show.
const decisions = P.map(([bc, name, brand, grade, , , labor], i) => ({
  barcode: bc,
  name,
  brand,
  outcome: labor >= 2 || grade === 'd' ? 'rejected' : 'bought',
  verdict: labor >= 2 ? 'AVOID' : grade === 'a' ? 'BUY' : grade === 'b' ? 'CONSIDER' : 'CAUTION',
  ecoGrade: grade,
  timestamp: daysAgo(i, 1),
}));

// Priorities must NOT all be equal — Preferences.tsx rejects a flat set,
// because scoring needs something to weigh.
const priorities = { environment: 85, laborRights: 95, animalWelfare: 55, nutrition: 40 };

const backup = {
  app: 'goodscan',
  version: 1,
  exportedAt: new Date().toISOString(),
  data: {
    'ethical-shopper-scan-history': JSON.stringify(scanHistory),
    'ethical-shopper-basket': JSON.stringify(basket),
    'ethical-shopper-priorities': JSON.stringify(priorities),
    'ethical-shopper-priorities-set': 'true',
    'goodscan_decisions': JSON.stringify(decisions),
  },
};

writeFileSync('goodscan-demo-backup.json', JSON.stringify(backup, null, 2));
console.log(`wrote goodscan-demo-backup.json`);
console.log(`  ${scanHistory.length} scans, ${basket.length} basket items, ${decisions.length} decisions`);
console.log(`  rejected: ${decisions.filter(d => d.outcome === 'rejected').length}, bought: ${decisions.filter(d => d.outcome === 'bought').length}`);
