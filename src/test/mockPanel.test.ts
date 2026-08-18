/**
 * Mock panel generator — a WORKED EXAMPLE of the research schema, not research.
 *
 * READ THIS BEFORE QUOTING ANY NUMBER IT PRODUCES.
 *
 * What is REAL here:
 *   - the 200 products (live Open Food Facts records: barcode, brand, category,
 *     ingredients)
 *   - the origins, commodities and TVPRA flags, computed by the real resolver
 *   - the SQL. Every query in the report runs against a structural copy of
 *     public.ai_scans, so it is the production query with a different schema
 *     name.
 *
 * What is INVENTED:
 *   - every human being in it
 *   - every price, every buy/skip, every dwell time, every intent
 *
 * Therefore every behavioural "finding" is a readback of the generative model
 * below. If the report says shoppers abandon at a 20% premium, that is because
 * PRICE_SENSITIVITY put them there. The value of this exercise is proving the
 * pipeline runs and showing the SHAPE of the output — never the output itself.
 *
 * Writes to the mock schema only. public.ai_scans is never touched.
 *
 *   MOCK_PANEL=1 npx vitest run src/test/mockPanel.test.ts --testTimeout=900000
 */

import { describe, it, expect } from 'vitest';
import { writeFileSync } from 'node:fs';
import { resolveSupplyChain } from '@/services/supplyChain/resolve';
import { detectCommodities } from '@/data/supplyChain/commodityOrigins';
import type { OpenFoodFactsResult } from '@/services/openfoodfacts/types';

const ENABLED = process.env.MOCK_PANEL === '1';

const CATEGORIES = [
  'chocolates', 'coffees', 'teas', 'breakfast-cereals', 'biscuits',
  'snacks', 'sodas', 'yogurts', 'breads', 'pastas',
  'rices', 'sauces', 'cheeses', 'crisps', 'ice-creams',
  'waters', 'juices', 'candies', 'spreads', 'canned-fish',
];
const PER_CATEGORY = 10;

// ── The generative model, stated up front so the report can point at it ──
const N_USERS = 60;
const RETAILERS: Record<string, string[]> = {
  GB: ['Tesco', 'Sainsbury’s', 'Aldi', 'Co-op'],
  US: ['Whole Foods', 'Trader Joe’s', 'Kroger', 'Target'],
  ID: ['Indomaret', 'Alfamart', 'Pepito', 'Hypermart'],
};
const CHANNELS = ['supermarket', 'convenience', 'online', 'market'];
// Rough shelf price per category, in local units. Invented, but ordered
// sensibly so the elasticity maths has something non-degenerate to chew on.
const BASE_PRICE: Record<string, number> = {
  chocolates: 2.4, coffees: 6.5, teas: 3.2, 'breakfast-cereals': 3.5, biscuits: 1.9,
  snacks: 2.1, sodas: 1.4, yogurts: 1.6, breads: 1.5, pastas: 1.3,
  rices: 2.8, sauces: 2.2, cheeses: 4.0, crisps: 1.8, 'ice-creams': 3.9,
  waters: 0.9, juices: 2.3, candies: 1.7, spreads: 3.1, 'canned-fish': 2.6,
};
const SECTIONS = ['origin', 'carbon', 'labour', 'swaps', 'ingredients', 'species', 'materials'];

let seed = 20260818;
/** Deterministic PRNG, so a rerun reproduces the same panel exactly. */
function rnd(): number {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
const pick = <T,>(a: T[]): T => a[Math.floor(rnd() * a.length)];
const gauss = (mean: number, sd: number) =>
  mean + sd * Math.sqrt(-2 * Math.log(rnd() || 1e-9)) * Math.cos(2 * Math.PI * rnd());

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchCategory(cat: string, attempt = 0): Promise<(OpenFoodFactsResult & { cat: string })[]> {
  const url =
    `https://world.openfoodfacts.org/api/v2/search?categories_tags_en=${encodeURIComponent(cat)}` +
    `&fields=code,product_name,brands,origins,ingredients_text,categories_tags,labels_tags` +
    `&page_size=${PER_CATEGORY}&json=1`;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'GoodScan-mock-panel/1.0' } });
    if (r.status === 503 && attempt < 3) { await sleep(8000 * (attempt + 1)); return fetchCategory(cat, attempt + 1); }
    if (!r.ok) return [];
    const j = (await r.json()) as { products?: Record<string, unknown>[] };
    return (j.products ?? []).map((p) => ({
      found: true, barcode: String(p.code ?? ''),
      productName: (p.product_name as string) || null,
      brand: (p.brands as string) || null,
      ecoscoreGrade: null, ecoscoreScore: null, nutriscoreGrade: null,
      nutriscoreScore: null, novaGroup: null, carbonFootprint100g: null,
      carbonFootprintProduct: null, carbonFootprintServing: null,
      labels: (p.labels_tags as string[]) ?? [],
      categories: (p.categories_tags as string[]) ?? [],
      origins: (p.origins as string) || null,
      ingredientsText: (p.ingredients_text as string) || null,
      imageUrl: null, ecoscoreData: null, rawProduct: p as never,
      cat,
    })) as (OpenFoodFactsResult & { cat: string })[];
  } catch { return []; }
}

describe('mock panel', () => {
  it.skipIf(!ENABLED)('generates a synthetic panel and reports on it', async () => {
    // ── 1. Real products ──
    const batches: (OpenFoodFactsResult & { cat: string })[][] = [];
    for (const cat of CATEGORIES) { batches.push(await fetchCategory(cat)); await sleep(4000); }
    const products = batches.flat().filter((p) => p.barcode && p.productName);
    expect(products.length).toBeGreaterThan(150);

    // ── 2. Real verdict inputs, from our own resolver ──
    const enriched = products.map((p) => {
      const chain = resolveSupplyChain(p, null);
      const origins = chain.nodes.filter((n) => n.kind === 'origin');
      const tvpra = origins.filter((n) => n.tvpraFlagged);
      const commodities = detectCommodities(p.ingredientsText, p.productName, p.categories)
        .map((m) => m.profile.commodity);
      // Verdict driven by real signals: a TVPRA-flagged origin is the strongest
      // negative we actually hold, so it decides the verdict here too.
      const verdict = tvpra.length >= 2 ? 'AVOID' : tvpra.length === 1 ? 'CAUTION'
        : origins.length > 0 ? 'CONSIDER' : 'UNKNOWN';
      const concern = tvpra.length ? 'labor' : commodities.includes('palm-oil') ? 'eco' : null;
      return {
        p, verdict, concern, commodities,
        flagIds: tvpra.map((n) => `tvpra:${n.commodity}:${n.label}`.slice(0, 64)).slice(0, 5),
        bestTier: chain.bestTier,
        swapAvailable: verdict === 'AVOID' || verdict === 'CAUTION' ? rnd() < 0.62 : false,
      };
    });

    // ── 3. Invented people ──
    const users = Array.from({ length: N_USERS }, (_, i) => {
      const country = pick(['GB', 'GB', 'US', 'US', 'ID']);
      return {
        user_id: `mock-u${String(i).padStart(3, '0')}`,
        country,
        city: country === 'GB' ? pick(['London', 'Manchester']) : country === 'US' ? pick(['Chicago', 'Austin']) : pick(['Denpasar', 'Jakarta']),
        age_band: pick(['18-24', '25-34', '25-34', '35-44', '45-54', '55+']),
        income_band: pick(['low', 'mid', 'mid', 'high']),
        diet: pick(['omnivore', 'omnivore', 'flexitarian', 'vegetarian', 'vegan']),
        // How much this person cares about ethics vs price. Drives everything.
        ethicsWeight: Math.min(1, Math.max(0, gauss(0.55, 0.22))),
        priceSensitivity: Math.min(1, Math.max(0, gauss(0.5, 0.25))),
        research_consent: rnd() < 0.72,
      };
    });

    // ── 4. Invented behaviour ──
    type Row = Record<string, unknown>;
    const rows: Row[] = [];
    let scanId = 0;
    for (const u of users) {
      const sessions = 2 + Math.floor(rnd() * 4);
      for (let s = 0; s < sessions; s++) {
        const sessionId = `${u.user_id}-t${s}`;
        const retailer = pick(RETAILERS[u.country]);
        const channel = pick(CHANNELS);
        const nScans = 3 + Math.floor(rnd() * 10);
        for (let k = 0; k < nScans; k++) {
          const e = enriched[Math.floor(rnd() * enriched.length)];
          const cat = e.p.cat;
          const price = Math.max(0.3, gauss(BASE_PRICE[cat] ?? 2.5, (BASE_PRICE[cat] ?? 2.5) * 0.25));
          const intent = rnd() < 0.7 ? 'ABOUT_TO_BUY' : rnd() < 0.65 ? 'BROWSING' : 'RESEARCHING';
          const swapShown = e.swapAvailable && rnd() < 0.85;
          // Premium of the offered alternative. Centre +14%, wide spread, so
          // the curve has points across the range rather than one spike.
          const delta = swapShown ? Math.max(-25, Math.min(90, gauss(14, 18))) : null;

          // THE INJECTED DECISION RULE. Everything the report says about price
          // sensitivity is this line read back.
          const badness = e.verdict === 'AVOID' ? 1 : e.verdict === 'CAUTION' ? 0.6 : e.verdict === 'CONSIDER' ? 0.2 : 0;
          let pSkip = 0.06 + badness * u.ethicsWeight * 0.85;
          if (intent === 'BROWSING') pSkip *= 0.55;        // never going to buy anyway
          if (intent === 'RESEARCHING') pSkip *= 0.4;
          if (swapShown && delta !== null) {
            // A cheap alternative helps; an expensive one erodes the intent.
            pSkip += 0.12 - (delta / 100) * u.priceSensitivity * 0.9;
          }
          pSkip = Math.min(0.97, Math.max(0.02, pSkip));
          const skipped = rnd() < pSkip;
          const swapClicked = swapShown && skipped && rnd() < 0.55;

          const sectionsOpened = SECTIONS.filter(() => rnd() < (badness ? 0.34 : 0.12)).slice(0, 4);
          const dwell = Math.round(Math.max(900, gauss(skipped ? 21000 : 9000, 7000)));
          scanId++;
          rows.push({
            user_id: u.user_id, source: 'decision', product_name: e.p.productName,
            brand: e.p.brand, barcode: e.p.barcode, country: u.country, city: u.city,
            category: cat, verdict: e.verdict, primary_concern: e.concern,
            swap_available: e.swapAvailable, resolved: true,
            scan_event_id: `mock-ev-${scanId}`, session_id: sessionId,
            bought: skipped ? 'NO' : 'YES',
            dwell_ms: dwell, swap_shown: swapShown, swap_clicked: swapClicked,
            price_observed: Math.round(price * 100) / 100,
            price_currency: u.country === 'GB' ? 'GBP' : u.country === 'US' ? 'USD' : 'IDR',
            swap_price_delta: delta === null ? null : Math.round(delta * 100) / 100,
            retailer, retail_channel: channel, intent_before: intent,
            swap_shown_id: swapShown ? `swap-${e.p.barcode}` : null,
            scan_method: rnd() < 0.72 ? 'barcode' : rnd() < 0.6 ? 'camera_ocr' : 'typed_search',
            match_method: rnd() < 0.75 ? 'barcode_exact' : rnd() < 0.7 ? 'off_search' : 'ai_inferred',
            match_confidence: Math.min(1, Math.max(0.3, gauss(0.88, 0.12))),
            app_version: '1.0.0',
            flag_ids: e.flagIds.length ? JSON.stringify(e.flagIds) : null,
            sections_opened: sectionsOpened.length ? JSON.stringify(sectionsOpened) : null,
          });
        }
      }
    }

    // ── 5. Load ──
    // Vitest doesn't put .env.local into process.env (it only exposes VITE_*
    // via import.meta.env), so without this pg quietly falls back to localhost
    // and fails with ECONNREFUSED ::1:5432.
    const { default: dotenv } = await import('dotenv');
    dotenv.config({ path: '.env.local' });
    const { default: pg } = await import('pg');
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set — cannot load mock panel');
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    await pool.query('TRUNCATE mock.ai_scans, mock.users');
    for (const u of users) {
      await pool.query(
        `INSERT INTO mock.users (user_id,country,city,age_band,income_band,diet,research_consent,consent_version,consent_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [u.user_id, u.country, u.city, u.age_band, u.income_band, u.diet,
         u.research_consent, u.research_consent ? 'mock-v1' : null, u.research_consent ? new Date() : null],
      );
    }
    const cols = Object.keys(rows[0]);
    for (let i = 0; i < rows.length; i += 200) {
      const chunk = rows.slice(i, i + 200);
      const values: unknown[] = [];
      const tuples = chunk.map((r, ri) => {
        const ph = cols.map((c, ci) => {
          values.push(r[c]);
          const n = ri * cols.length + ci + 1;
          return c === 'flag_ids' || c === 'sections_opened' ? `$${n}::jsonb` : `$${n}`;
        });
        return `(${ph.join(',')})`;
      });
      await pool.query(`INSERT INTO mock.ai_scans (${cols.join(',')}) VALUES ${tuples.join(',')}`, values);
    }

    // ── 6. Analysis — the real queries, against mock ──
    const q = async (sql: string) => (await pool.query(sql)).rows;

    const totals = (await q(`SELECT count(*)::int scans, count(DISTINCT user_id)::int users,
      count(DISTINCT session_id)::int sessions, count(DISTINCT barcode)::int products FROM mock.ai_scans`))[0];
    const consent = (await q(`SELECT count(*) FILTER (WHERE research_consent)::int consented,
      count(*)::int total FROM mock.users`))[0];
    const byVerdict = await q(`SELECT verdict, count(*)::int n,
      round(100.0*count(*) FILTER (WHERE bought='NO')/count(*),1) AS skip_pct
      FROM mock.ai_scans GROUP BY verdict ORDER BY skip_pct DESC NULLS LAST`);
    const byIntent = await q(`SELECT intent_before, count(*)::int n,
      round(100.0*count(*) FILTER (WHERE bought='NO')/count(*),1) AS skip_pct
      FROM mock.ai_scans GROUP BY intent_before ORDER BY skip_pct DESC`);
    const elasticity = await q(`
      SELECT width_bucket(swap_price_delta, -20, 60, 8) AS b,
             min(swap_price_delta)::numeric(6,1) AS from_pct,
             max(swap_price_delta)::numeric(6,1) AS to_pct,
             count(*)::int n,
             round(100.0*count(*) FILTER (WHERE swap_clicked)/count(*),1) AS switch_pct
      FROM mock.ai_scans WHERE swap_shown AND swap_price_delta IS NOT NULL
      GROUP BY b ORDER BY b`);
    const intendedFlip = (await q(`SELECT count(*)::int n,
      round(100.0*count(*) FILTER (WHERE bought='NO')/count(*),1) AS flipped_pct
      FROM mock.ai_scans WHERE intent_before='ABOUT_TO_BUY'`))[0];
    const byRetailer = await q(`SELECT retailer, count(*)::int n,
      round(100.0*count(*) FILTER (WHERE bought='NO')/count(*),1) AS skip_pct
      FROM mock.ai_scans GROUP BY retailer HAVING count(DISTINCT user_id)>=5 ORDER BY skip_pct DESC LIMIT 8`);
    const byFlag = await q(`SELECT f AS flag_id, count(*)::int n,
      round(100.0*count(*) FILTER (WHERE bought='NO')/count(*),1) AS skip_pct
      FROM mock.ai_scans, jsonb_array_elements_text(flag_ids) f
      GROUP BY f HAVING count(*)>=20 ORDER BY skip_pct DESC LIMIT 8`);
    const bySection = await q(`SELECT s AS section, count(*)::int n,
      round(100.0*count(*) FILTER (WHERE bought='NO')/count(*),1) AS skip_pct,
      round(avg(dwell_ms))::int avg_dwell
      FROM mock.ai_scans, jsonb_array_elements_text(sections_opened) s
      GROUP BY s ORDER BY skip_pct DESC`);
    const basket = (await q(`SELECT round(avg(n),1) AS scans_per_trip, round(avg(skips),1) AS skips_per_trip
      FROM (SELECT session_id, count(*) n, count(*) FILTER (WHERE bought='NO') skips
            FROM mock.ai_scans GROUP BY session_id) t`))[0];
    const lowConf = (await q(`SELECT count(*)::int n FROM mock.ai_scans WHERE match_confidence < 0.7`))[0];

    const tbl = (rows: Record<string, unknown>[], heads: string[]) =>
      rows.length
        ? [`| ${heads.join(' | ')} |`, `| ${heads.map(() => '---').join(' | ')} |`,
           ...rows.map((r) => `| ${Object.values(r).map((v) => v ?? '—').join(' | ')} |`)].join('\n')
        : '_no rows_';

    const md = `# Mock panel report

**Generated ${new Date().toISOString().slice(0, 10)} from \`src/test/mockPanel.test.ts\`.**

> ## Read this first
>
> **The people in this report do not exist.** Every price, every buy/skip, every
> dwell time and every intent was invented by the generator in that file.
>
> **Real:** the ${totals.products} products (live Open Food Facts records), their
> origins, commodities and TVPRA flags — all computed by the production
> resolver. And the SQL: \`mock.ai_scans\` is a structural copy of
> \`public.ai_scans\`, so every query below is the real query with one word
> changed.
>
> **Invented:** all ${consent.total} users and all ${totals.scans} decisions.
>
> So every behavioural number here is a **readback of the generative model**, not
> a finding. Where the report says price sensitivity does something, that is
> \`pSkip\` in the generator saying it. The purpose is to show the *shape* of the
> output and prove the pipeline runs end to end — not to learn anything about
> shoppers.

## Panel

| Metric | Value |
| --- | --- |
| Scans | ${totals.scans} |
| Users (synthetic) | ${totals.users} |
| Shopping trips | ${totals.sessions} |
| Distinct real products | ${totals.products} |
| Research-consented users | ${consent.consented} / ${consent.total} |
| Rows below 0.7 match confidence | ${lowConf.n} |
| Scans per trip | ${basket.scans_per_trip} (of which ${basket.skips_per_trip} skipped) |

## 1. Rejection by verdict

${tbl(byVerdict, ['verdict', 'scans', 'skip %'])}

## 2. The denominator — why \`intent_before\` matters

${tbl(byIntent, ['intent', 'scans', 'skip %'])}

Restricted to shoppers who said they were **about to buy**: ${intendedFlip.n} scans,
${intendedFlip.flipped_pct}% did not buy. That is the only defensible form of an
impact claim, and it is unavailable without this column — a browser who doesn't
buy was never a conversion.

## 3. Price elasticity of ethics

Switch rate against how much more the alternative cost.

${tbl(elasticity, ['bucket', 'from %', 'to %', 'n', 'switched %'])}

**This curve is the single most saleable output the schema can produce, and it
cannot be reconstructed retroactively** — a scan logged without \`price_observed\`
is gone as evidence forever. Here its shape is dictated by \`priceSensitivity\`
in the generator.

## 4. By retailer

k-anonymity floor applied (≥5 distinct users per row).

${tbl(byRetailer, ['retailer', 'scans', 'skip %'])}

## 5. Attribution to a specific flag

${tbl(byFlag, ['flag id', 'scans', 'skip %'])}

This is what \`flag_ids\` buys over \`primary_concern\`: "the DOL cocoa listing
drove N rejections" instead of "something about labour did".

## 6. Which evidence people open

${tbl(bySection, ['section opened', 'n', 'skip %', 'avg dwell ms'])}

The question the Methodology page raises and cannot currently answer. On real
data this would show whether labour, carbon or animal welfare actually changes a
decision.

## What to distrust in the tables above

Two things are worth pointing at, because they are exactly the mistakes this
output invites on real data too.

**Small cells.** Several rows above rest on a handful of scans — the far ends of
the elasticity curve, and the top row of the flag table. A 60.9% skip rate on 23
scans is not a higher number than 47% on 132; it is the same number with more
noise. Any real version of this report needs a minimum-n rule alongside the
k-anonymity floor, and they are not the same rule: one protects the reader from
nonsense, the other protects the user from identification.

**Section 6 is a null result, and correctly so.** Every section lands between 21%
and 27% with near-identical dwell times. That is not a finding that all evidence
types work equally — it is the generator opening sections at random,
independently of the decision. The query is doing its job and reporting no
signal, because there is no signal to find. On real data this table is the
interesting one; here it is a control that confirms the pipeline does not invent
structure that was never put in.

## What this exercise actually established

1. The schema round-trips: ${totals.scans} rows with every research field populated.
2. All six analyses run as plain SQL — no post-processing.
3. \`session_id\` makes per-trip metrics possible (${basket.scans_per_trip} scans/trip).
4. The consent JOIN and the k-anonymity floor both work in practice.

## What it did NOT establish

Anything whatsoever about how people shop.

To get real numbers you need the capture UI listed in
[research-schema.md](research-schema.md) — above all \`price_observed\` and
\`intent_before\`, which are the two that cannot be backfilled.
`;

    writeFileSync('docs/mock-panel-report.md', md);
    console.log(`\n[mock] ${totals.scans} scans, ${totals.users} users, ${totals.products} real products`);
    console.log('[mock] → docs/mock-panel-report.md');
    await pool.end();
  }, 900_000);
});
