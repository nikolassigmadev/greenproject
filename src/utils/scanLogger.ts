// Fire-and-forget logger that records every scanned product to the backend
// scan-analytics DB (server.js → data/scans.db). Never throws and never blocks
// the UI; if the server is down or the user opted out, it silently no-ops.

import { getBackendUrl } from "@/config/backend";
import { loadRegion } from "@/utils/userRegion";
import { loadPriorities, type UserPriorities } from "@/utils/userPreferences";
import type { SwapGapReason } from "@/services/swaps";

const ANON_KEY = "goodscan-anon-id";
const OPTOUT_KEY = "goodscan-scan-logging-optout";

/** A stable per-device anonymous id (lets us count unique scanners, no PII). */
export function getAnonId(): string {
  try {
    let id = localStorage.getItem(ANON_KEY);
    if (!id) {
      id = (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)) as string;
      localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

/** Fires when the opt-out changes, so any mounted toggle stays in sync. */
export const SCAN_LOGGING_EVENT = "scanLoggingChanged";

/**
 * Has this user turned off anonymous scan logging?
 *
 * Checked at the top of every logScan() call, so it gates every write path
 * without each caller having to remember. Exposed in the UI at
 * Preferences → "Anonymous scan data".
 */
export function isScanLoggingOptedOut(): boolean {
  try {
    return localStorage.getItem(OPTOUT_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Turn anonymous scan logging on or off. Takes effect immediately — the next
 * logScan() call returns without sending anything.
 *
 * This only stops FUTURE writes. Rows already recorded are removed via
 * DELETE /api/admin/scans/:anonId, which is why the settings card shows the
 * anonymous id: it's the only handle a user has on their own data.
 */
export function setScanLoggingOptedOut(optedOut: boolean): void {
  try {
    if (optedOut) localStorage.setItem(OPTOUT_KEY, "true");
    else localStorage.removeItem(OPTOUT_KEY);
    window.dispatchEvent(new Event(SCAN_LOGGING_EVENT));
  } catch {
    // storage disabled (private mode) — nothing is being logged anyway
  }
}

export type PrimaryConcern = "labor" | "boycott" | "animal_welfare" | "eco";

/**
 * Which moment produced this row. The server whitelists these; anything else
 * falls back to the old bought-derived default.
 *  - `scan`       exposure: the product page opened
 *  - `decision`   conversion: the user pressed Buy or Skip
 *  - `swap_click` the user tapped a suggested alternative (and navigated away,
 *                 which is why this can't wait for a decision row)
 */
export type ScanLogSource = "scan" | "decision" | "swap_click";

export interface ScanLogInput {
  barcode?: string | null;
  name: string;
  /** Defaults server-side to decision/scan based on `bought`. */
  source?: ScanLogSource;
  brand?: string | null;
  ecoGrade?: string | null;
  /** Trimmed string OpenAI identified the product as (brand + product), when scanned via the camera. */
  openaiResponse?: string | null;
  /** The COMPLETE raw OpenAI response, before it's trimmed to the brand+product OFF search. */
  fullOpenaiResponse?: string | null;
  /** 'YES' if the user bought the product, 'NO' if they skipped it. */
  bought?: "YES" | "NO" | null;
  /** Swap-catalog category, e.g. "chocolate". */
  category?: string | null;
  /** Verdict shown to the user: BUY | CONSIDER | CAUTION | AVOID | UNKNOWN. */
  verdict?: string | null;
  /** The product's worst ethical concern, when flagged. */
  primaryConcern?: PrimaryConcern | null;
  /** Was a region-available ethical alternative on offer? Drives the unmet-demand heatmap. */
  swapAvailable?: boolean | null;
  /** Concern-weight snapshot; defaults to the user's current saved priorities. */
  priorities?: UserPriorities | null;
  /** The scanned photo as compressed JPEG base64 (no data: prefix), when from a camera scan. */
  image?: string | null;
  /** false when the scan never resolved to a product (logs the miss for debugging). Defaults to true. */
  resolved?: boolean;
  /**
   * UUID identifying this product-page view. Stamped on both the exposure row
   * (page open) and the conversion row (buy/skip) so they join exactly instead
   * of by a time window. From @/utils/scanSession.
   */
  scanEventId?: string | null;
  /** The verdict at DEFAULT priorities — the baseline `verdict` is measured against. */
  verdictBase?: string | null;
  /** Why no alternative qualified, when swapAvailable is false. */
  swapGapReason?: SwapGapReason | null;
  /** Did the swap section actually render picks? Only meaningful on the conversion row. */
  swapShown?: boolean | null;
  /** Did the user tap one of those picks? Only meaningful on the conversion row. */
  swapClicked?: boolean | null;
  /** Ms from page open to the buy/skip press. Only meaningful on the conversion row. */
  dwellMs?: number | null;
}

export function logScan(input: ScanLogInput): void {
  try {
    if (isScanLoggingOptedOut()) return;
    if (!input.name) return;
    const region = loadRegion();
    // Snapshot the user's concern weights with every scan (unless a caller
    // passed an explicit set). Aggregate, no PII — the server clamps it.
    const priorities = input.priorities ?? loadPriorities();
    const body = JSON.stringify({
      barcode: input.barcode ?? null,
      name: input.name,
      source: input.source ?? null,
      brand: input.brand ?? null,
      ecoGrade: input.ecoGrade ?? null,
      openaiResponse: input.openaiResponse ?? null,
      fullOpenaiResponse: input.fullOpenaiResponse ?? null,
      bought: input.bought ?? null,
      country: region?.countryCode ?? null,
      city: region?.city ?? null,
      anonId: getAnonId(),
      priorities: priorities ?? null,
      category: input.category ?? null,
      verdict: input.verdict ?? null,
      primaryConcern: input.primaryConcern ?? null,
      swapAvailable: input.swapAvailable ?? null,
      image: input.image ?? null,
      resolved: input.resolved ?? true,
      scanEventId: input.scanEventId ?? null,
      verdictBase: input.verdictBase ?? null,
      swapGapReason: input.swapGapReason ?? null,
      swapShown: input.swapShown ?? null,
      swapClicked: input.swapClicked ?? null,
      dwellMs: input.dwellMs ?? null,
    });
    void fetch(`${getBackendUrl()}/api/scans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(4000),
      // keepalive lets the log survive page navigation, but browsers reject
      // keepalive bodies over 64KB outright — a scan photo blows past that, so
      // image-bearing logs must be sent as a normal fetch or they never leave.
      keepalive: body.length < 60_000,
    }).catch(() => {
      // server down / offline — analytics are best-effort, ignore
    });
  } catch {
    // never let logging break a scan
  }
}
