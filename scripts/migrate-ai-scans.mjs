// One-off, idempotent migration for the new ai_scans columns + unmet-demand
// heatmap view. Additive only — no DROP/UPDATE, safe to run against production.
//
//   node scripts/migrate-ai-scans.mjs
//
// Reads DATABASE_URL from the environment, or from .env.local / .env.production
// (in that order) if not already set. The server also applies this same schema
// on startup, so running this is optional — it just avoids a restart.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import pkg from 'pg';

const { Pool } = pkg;

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  for (const f of ['.env.local', '.env.production', '.env']) {
    try {
      const line = readFileSync(join(process.cwd(), f), 'utf8')
        .split('\n')
        .find((l) => l.startsWith('DATABASE_URL='));
      if (line) {
        const val = line.slice('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
        if (val) return val;
      }
    } catch { /* file absent — try the next */ }
  }
  return null;
}

const MIGRATION = `
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS carbon_footprint_100g REAL;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS priorities      JSONB;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS category        TEXT;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS verdict         TEXT;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS primary_concern TEXT;
ALTER TABLE ai_scans ADD COLUMN IF NOT EXISTS swap_available  BOOLEAN;

CREATE INDEX IF NOT EXISTS idx_ai_scans_demand
  ON ai_scans (country, category, primary_concern)
  WHERE primary_concern IS NOT NULL AND swap_available IS NOT TRUE;

CREATE OR REPLACE VIEW unmet_ethical_demand AS
SELECT
  country,
  city,
  category,
  primary_concern,
  count(*)                                AS demand_signals,
  count(*) FILTER (WHERE bought = 'NO')   AS rejected,
  count(DISTINCT user_id)                 AS distinct_users,
  max(created_at)                         AS last_seen
FROM ai_scans
WHERE category IS NOT NULL
  AND primary_concern IS NOT NULL
  AND swap_available IS NOT TRUE
GROUP BY country, city, category, primary_concern
ORDER BY rejected DESC, demand_signals DESC;
`;

const url = loadDatabaseUrl();
if (!url) {
  console.error('No DATABASE_URL found (env, .env.local, or .env.production).');
  process.exit(1);
}

const isLocal = /@(localhost|127\.0\.0\.1)/.test(url);
const pool = new Pool({
  connectionString: url,
  ssl: !isLocal && process.env.DATABASE_SSL !== 'false' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
});

try {
  await pool.query(MIGRATION);
  const cols = await pool.query(
    `SELECT column_name, data_type FROM information_schema.columns
      WHERE table_name = 'ai_scans'
        AND column_name IN
          ('carbon_footprint_100g','priorities','category','verdict','primary_concern','swap_available')
      ORDER BY column_name`,
  );
  const view = await pool.query(
    `SELECT 1 FROM information_schema.views WHERE table_name = 'unmet_ethical_demand'`,
  );
  console.log('Migration applied. New columns on ai_scans:');
  for (const c of cols.rows) console.log(`  - ${c.column_name} (${c.data_type})`);
  console.log(`View unmet_ethical_demand: ${view.rowCount ? 'present' : 'MISSING'}`);
} catch (e) {
  console.error('Migration failed:', e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
