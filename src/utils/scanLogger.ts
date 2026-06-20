// Fire-and-forget logger that records every scanned product to the backend
// scan-analytics DB (server.js → data/scans.db). Never throws and never blocks
// the UI; if the server is down or the user opted out, it silently no-ops.

import { getBackendUrl } from "@/config/backend";
import { loadRegion } from "@/utils/userRegion";

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

export interface ScanLogInput {
  barcode?: string | null;
  name: string;
  brand?: string | null;
  ecoGrade?: string | null;
  /** Raw string OpenAI identified the product as (brand + product), when scanned via the camera. */
  openaiResponse?: string | null;
  /** 'YES' if the user bought the product, 'NO' if they skipped it. */
  bought?: "YES" | "NO" | null;
}

export function logScan(input: ScanLogInput): void {
  try {
    if (isScanLoggingOptedOut()) return;
    if (!input.name) return;
    const region = loadRegion();
    const body = JSON.stringify({
      barcode: input.barcode ?? null,
      name: input.name,
      brand: input.brand ?? null,
      ecoGrade: input.ecoGrade ?? null,
      openaiResponse: input.openaiResponse ?? null,
      bought: input.bought ?? null,
      country: region?.countryCode ?? null,
      city: region?.city ?? null,
      anonId: getAnonId(),
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
