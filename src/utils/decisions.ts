// The user's explicit buy/skip decision on a product — the whole point of the
// app made into one tracked action. Where "add to cart" was optional and easy
// to skip, a decision is the call to action: Buy it, or Skip it. localStorage-
// backed; emits DECISIONS_EVENT so any view (the bar, a dashboard stat) reacts.

export type DecisionOutcome = "bought" | "rejected";

export interface ProductDecision {
  barcode: string;
  name: string;
  brand?: string | null;
  outcome: DecisionOutcome;
  /** Verdict key at decision time (BUY|CONSIDER|CAUTION|AVOID|UNKNOWN). */
  verdict: string;
  ecoGrade?: string | null;
  timestamp: number;
}

const KEY = "goodscan_decisions";
export const DECISIONS_EVENT = "decisionsUpdated";
const MAX = 500;

export function loadDecisions(): ProductDecision[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getDecision(barcode: string | null | undefined): ProductDecision | null {
  if (!barcode) return null;
  return loadDecisions().find((d) => d.barcode === barcode) ?? null;
}

/** Record (or overwrite) the decision for a product, most-recent first. */
export function recordDecision(d: Omit<ProductDecision, "timestamp">): void {
  try {
    const all = loadDecisions().filter((x) => x.barcode !== d.barcode);
    all.unshift({ ...d, timestamp: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(all.slice(0, MAX)));
    window.dispatchEvent(new Event(DECISIONS_EVENT));
  } catch {
    // best-effort; never break the flow
  }
}

/** Undo a decision for a product. */
export function clearDecision(barcode: string): void {
  try {
    const all = loadDecisions().filter((x) => x.barcode !== barcode);
    localStorage.setItem(KEY, JSON.stringify(all));
    window.dispatchEvent(new Event(DECISIONS_EVENT));
  } catch {
    // ignore
  }
}

export function getDecisionStats(): { bought: number; rejected: number } {
  const all = loadDecisions();
  return {
    bought: all.filter((d) => d.outcome === "bought").length,
    rejected: all.filter((d) => d.outcome === "rejected").length,
  };
}
