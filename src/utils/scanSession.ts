// One "scan event" = one product-page view.
//
// The exposure row (logged when the page opens) and the conversion row (logged
// when the user presses Buy/Skip) are two separate inserts into ai_scans. Before
// this, joining them meant guessing with a time window and an anon id. Minting a
// UUID when the page opens and stamping it on both rows makes that join exact.
//
// The same record carries the signals that are only knowable *between* those two
// inserts: how long the user stayed (dwell), whether the swap section actually
// rendered picks, and whether they tapped one. Availability, rendering and
// tapping are three different things and each can leak independently.
//
// Lives in sessionStorage: survives a reload, dies with the tab, never syncs to
// another tab (two tabs = two genuinely different page views).

const KEY = "goodscan-scan-event";

export interface ScanEvent {
  /** UUID joining the exposure row to the conversion row. */
  id: string;
  /** Which product this event is about — guards against a stale cross-product read. */
  barcode: string;
  /** epoch ms the product page opened. */
  openedAt: number;
  /** Did the "Better swaps" section actually render at least one pick? */
  swapShown: boolean;
  /** Did the user tap one of those picks? */
  swapClicked: boolean;
}

/** Longest dwell we'll record (10 min). Beyond this the tab was simply left open. */
export const MAX_DWELL_MS = 600_000;

function read(): ScanEvent | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const e = JSON.parse(raw) as ScanEvent;
    return e && typeof e.id === "string" && typeof e.openedAt === "number" ? e : null;
  } catch {
    return null;
  }
}

function write(e: ScanEvent): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(e));
  } catch {
    // storage full / disabled — telemetry is best-effort, never break the page
  }
}

function uuid(): string {
  try {
    const id = globalThis.crypto?.randomUUID?.();
    if (id) return id;
  } catch {
    // fall through
  }
  // Non-secure fallback for browsers without randomUUID (older iOS Safari).
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Start a new scan event for this product view. Call once per product-page open
 * (the detail page's per-barcode effect), BEFORE the exposure row is logged.
 * Always mints a fresh id: revisiting the same product later is a new view, and
 * carrying the old one over would silently inflate its dwell.
 */
export function beginScanEvent(barcode: string): string {
  const e: ScanEvent = {
    id: uuid(),
    barcode,
    openedAt: Date.now(),
    swapShown: false,
    swapClicked: false,
  };
  write(e);
  return e.id;
}

/** The current event, but only if it belongs to `barcode`. */
function current(barcode: string): ScanEvent | null {
  const e = read();
  return e && e.barcode === barcode ? e : null;
}

/** The id to stamp on a row for this product, or null if there's no live event. */
export function getScanEventId(barcode: string): string | null {
  return current(barcode)?.id ?? null;
}

/**
 * Milliseconds between the page opening and now, or null when there's no live
 * event for this product. Clamped: anything over MAX_DWELL_MS is an abandoned
 * tab, not a decision, and recording it would poison the average.
 */
export function getDwellMs(barcode: string): number | null {
  const e = current(barcode);
  if (!e) return null;
  const ms = Date.now() - e.openedAt;
  if (!Number.isFinite(ms) || ms < 0) return null;
  return Math.min(Math.round(ms), MAX_DWELL_MS);
}

function mark(barcode: string, patch: Partial<ScanEvent>): void {
  const e = current(barcode);
  if (!e) return;
  write({ ...e, ...patch });
}

/** The swap section rendered at least one pick to this user. */
export function markSwapShown(barcode: string): void {
  mark(barcode, { swapShown: true });
}

/** The user tapped one of the rendered picks. */
export function markSwapClicked(barcode: string): void {
  mark(barcode, { swapShown: true, swapClicked: true });
}

/** Both engagement flags, or nulls when there's no live event to read. */
export function getSwapEngagement(barcode: string): {
  swapShown: boolean | null;
  swapClicked: boolean | null;
} {
  const e = current(barcode);
  if (!e) return { swapShown: null, swapClicked: null };
  return { swapShown: e.swapShown, swapClicked: e.swapClicked };
}
