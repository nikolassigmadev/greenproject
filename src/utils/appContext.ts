// Aggregates every piece of user-side data the app stores locally and packages
// it as a compact context object that can be sent to the AI Product Analyst
// (ChatGPTScan) so its verdicts reflect what the user actually buys and cares
// about.

import { loadPriorities, loadScanHistory, getHistoryStats, type ScanHistoryEntry } from "./userPreferences";
import { loadWatchlist } from "./watchlist";
import { loadBasket, getBasketEthicsReport } from "./basketStorage";

export interface AppContext {
  priorities: {
    environment: number;
    laborRights: number;
    animalWelfare: number;
    nutrition: number;
    summary: string;
  };
  watchlist: string[];
  basket: {
    itemCount: number;
    items: { name: string; brand: string | null; ecoGrade: string | null }[];
    overallGrade: string;
    flaggedItems: string[];
  };
  scanHistory: {
    total: number;
    good: number;
    moderate: number;
    caution: number;
    avoid: number;
    recent: { name: string; brand: string | null; verdict: string }[];
  };
}

// Three levels only — mirrors priorityMultiplier()'s buckets.
const levelLabel = (v: number): string => {
  if (v <= 37) return "low";
  if (v <= 62) return "medium";
  return "critical";
};

const buildPrioritySummary = (p: {
  environment: number;
  laborRights: number;
  animalWelfare: number;
  nutrition: number;
}): string => {
  // Nutrition is no longer a user-tunable priority, so it is not presented as
  // one here — only the three values the user can actually set are summarised.
  const entries: [string, number][] = [
    ["environment", p.environment],
    ["labor rights", p.laborRights],
    ["animal welfare", p.animalWelfare],
  ];
  const top = entries.filter(([, v]) => v >= 63).map(([k]) => k);   // critical
  const low = entries.filter(([, v]) => v <= 37).map(([k]) => k);   // low
  if (top.length === 0 && low.length === 0) return "balanced (all priorities at medium).";
  const bits: string[] = [];
  if (top.length) bits.push(`strongly cares about ${top.join(", ")}`);
  if (low.length) bits.push(`only lightly weights ${low.join(", ")}`);
  return bits.join("; ") + ".";
};

/**
 * Build a snapshot of everything the app knows about the current user.
 * Safe to call from any client component — falls back gracefully if any
 * localStorage key is missing.
 */
export function buildAppContext(): AppContext {
  const priorities = loadPriorities();
  const watchlist = loadWatchlist();
  const basket = loadBasket();
  const basketReport = getBasketEthicsReport(basket);
  const history = loadScanHistory();
  const stats = getHistoryStats(history);

  return {
    priorities: {
      environment: priorities.environment,
      laborRights: priorities.laborRights,
      animalWelfare: priorities.animalWelfare,
      nutrition: priorities.nutrition,
      summary: buildPrioritySummary(priorities),
    },
    watchlist: watchlist.slice(0, 30),
    basket: {
      itemCount: basket.length,
      items: basket.slice(0, 12).map((b) => ({
        name: b.productName,
        brand: b.brand,
        ecoGrade: b.ecoscoreGrade,
      })),
      overallGrade: basketReport.overallGrade,
      flaggedItems: basketReport.flaggedItems
        .slice(0, 10)
        .map((b) => `${b.productName}${b.brand ? ` (${b.brand})` : ""}`),
    },
    scanHistory: {
      total: stats.total,
      good: stats.good,
      moderate: stats.moderate,
      caution: stats.caution,
      avoid: stats.avoid,
      recent: history.slice(0, 8).map((h: ScanHistoryEntry) => ({
        name: h.productName,
        brand: h.brand,
        verdict: h.verdict.label,
      })),
    },
  };
}

/**
 * A condensed natural-language brief of the user, suitable for stuffing into a
 * system prompt. Trims to ~600 chars so it never dominates a request.
 */
export function buildContextBrief(ctx: AppContext): string {
  const p = ctx.priorities;
  const lines: string[] = [];

  lines.push(
    `User priorities — env:${levelLabel(p.environment)}, labor:${levelLabel(
      p.laborRights,
    )}, animal:${levelLabel(p.animalWelfare)}. ${p.summary}`,
  );

  if (ctx.watchlist.length) {
    lines.push(`Brands user has on watchlist (wants to avoid): ${ctx.watchlist.join(", ")}.`);
  }

  if (ctx.basket.itemCount > 0) {
    const items = ctx.basket.items
      .map((i) => `${i.name}${i.brand ? ` (${i.brand})` : ""}`)
      .join("; ");
    lines.push(
      `Current basket (${ctx.basket.itemCount} items, overall eco-grade ${ctx.basket.overallGrade.toUpperCase()}): ${items}.`,
    );
    if (ctx.basket.flaggedItems.length) {
      lines.push(`Flagged basket items: ${ctx.basket.flaggedItems.join("; ")}.`);
    }
  }

  if (ctx.scanHistory.total > 0) {
    lines.push(
      `Scan history: ${ctx.scanHistory.total} total scans (${ctx.scanHistory.good} good, ${ctx.scanHistory.moderate} moderate, ${ctx.scanHistory.caution} caution, ${ctx.scanHistory.avoid} avoid).`,
    );
    if (ctx.scanHistory.recent.length) {
      const recent = ctx.scanHistory.recent
        .map((r) => `${r.name}${r.brand ? ` [${r.brand}]` : ""}=${r.verdict}`)
        .join("; ");
      lines.push(`Recent scans: ${recent}.`);
    }
  }

  return lines.join("\n");
}
