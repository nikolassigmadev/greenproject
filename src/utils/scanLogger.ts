// Fire-and-forget logger that records every scanned product to the backend
// scan-analytics DB (server.js → data/scans.db). Never throws and never blocks
// the UI; if the server is down or the user opted out, it silently no-ops.

import { getBackendUrl } from "@/config/backend";
import { loadRegion } from "@/utils/userRegion";
import { loadPriorities, type UserPriorities } from "@/utils/userPreferences";

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

/** Opt-out toggle (no UI yet, but honoured if a user sets it). */
export function isScanLoggingOptedOut(): boolean {
  try {
    return localStorage.getItem(OPTOUT_KEY) === "true";
  } catch {
    return false;
  }
}

export type PrimaryConcern = "labor" | "boycott" | "animal_welfare" | "eco";

export interface ScanLogInput {
  barcode?: string | null;
  name: string;
  brand?: string | null;
  ecoGrade?: string | null;
  /** Trimmed string OpenAI identified the product as (brand + product), when scanned via the camera. */
  openaiResponse?: string | null;
  /** The COMPLETE raw OpenAI response, before it's trimmed to the brand+product OFF search. */
  fullOpenaiResponse?: string | null;
  /** 'YES' if the user bought the product, 'NO' if they skipped it. */
  bought?: "YES" | "NO" | null;
  /** CO2e grams per 100g (Open Food Facts), when known. */
  carbonFootprint100g?: number | null;
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
      brand: input.brand ?? null,
      ecoGrade: input.ecoGrade ?? null,
      openaiResponse: input.openaiResponse ?? null,
      fullOpenaiResponse: input.fullOpenaiResponse ?? null,
      bought: input.bought ?? null,
      country: region?.countryCode ?? null,
      city: region?.city ?? null,
      anonId: getAnonId(),
      carbonFootprint100g: input.carbonFootprint100g ?? null,
      priorities: priorities ?? null,
      category: input.category ?? null,
      verdict: input.verdict ?? null,
      primaryConcern: input.primaryConcern ?? null,
      swapAvailable: input.swapAvailable ?? null,
      image: input.image ?? null,
    });
    void fetch(`${getBackendUrl()}/api/scans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(4000),
      keepalive: true,
    }).catch(() => {
      // server down / offline — analytics are best-effort, ignore
    });
  } catch {
    // never let logging break a scan
  }
}
