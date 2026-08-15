// "I saw this at that shop" — the only per-chain availability data we can
// honestly build, because shoppers are the only people who actually look.
//
// Stored on the device and mirrored to the backend so a sighting helps the next
// person. Deliberately modest: a sighting records product + chain + country +
// date, and nothing about who reported it beyond the anonymous device id the
// scan log already uses. No GPS, no branch, no name.
//
// Sightings decay. A confirmation from eighteen months ago tells you about a
// shelf that has been reset a dozen times since, so anything older than
// SIGHTING_TTL_DAYS stops counting rather than quietly ageing into a claim.

import { getBackendUrl } from '@/config/backend';
import { getAnonId, isScanLoggingOptedOut } from '@/utils/scanLogger';

const KEY = 'goodscan-store-sightings';
export const SIGHTINGS_EVENT = 'goodscan-sightings-updated';

/** Beyond this, a sighting is history rather than evidence. */
export const SIGHTING_TTL_DAYS = 180;

export interface StoreSighting {
  barcode: string;
  retailerId: string;
  countryCode: string;
  /**
   * The city the user set, when they gave one. Recorded so a future version can
   * say "seen by 3 shoppers in Denpasar" rather than "somewhere in Indonesia" —
   * counts are still aggregated per chain today, and this is never precise
   * enough to locate anybody.
   */
  city?: string | null;
  /** epoch ms */
  seenAt: number;
}

function load(): StoreSighting[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoreSighting[]) : [];
  } catch {
    return [];
  }
}

function save(list: StoreSighting[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(SIGHTINGS_EVENT));
  } catch {
    // storage disabled — sightings just won't persist locally
  }
}

function isFresh(s: StoreSighting): boolean {
  return Date.now() - s.seenAt < SIGHTING_TTL_DAYS * 86_400_000;
}

/** Every sighting this device has recorded that still counts. */
export function loadSightings(): StoreSighting[] {
  return load().filter(isFresh);
}

/**
 * How many fresh confirmations exist for this product at this chain.
 *
 * Reads local sightings plus whatever the backend last sent us. Local-only
 * would mean a sighting never helps anyone else, which is the entire point.
 */
export function getSightingCount(barcode: string, retailerId: string): number {
  const mine = loadSightings().filter(
    (s) => s.barcode === barcode && s.retailerId === retailerId,
  ).length;
  return mine + getRemoteCount(barcode, retailerId);
}

/** Has THIS device already confirmed this pairing? Drives the button state. */
export function hasConfirmed(barcode: string, retailerId: string): boolean {
  return loadSightings().some((s) => s.barcode === barcode && s.retailerId === retailerId);
}

/**
 * Record a sighting. Idempotent per device: confirming twice does not count
 * twice, or one enthusiastic user becomes a consensus.
 */
export function recordSighting(input: Omit<StoreSighting, 'seenAt'>): void {
  const list = load().filter(isFresh);
  const existing = list.findIndex(
    (s) => s.barcode === input.barcode && s.retailerId === input.retailerId,
  );
  const sighting: StoreSighting = { ...input, seenAt: Date.now() };
  if (existing !== -1) list[existing] = sighting;
  else list.push(sighting);
  save(list);
  void publish(sighting);
}

export function removeSighting(barcode: string, retailerId: string): void {
  save(load().filter((s) => !(s.barcode === barcode && s.retailerId === retailerId)));
}

// ── Backend mirror ───────────────────────────────────────────────────────────
// Same fire-and-forget shape as scanLogger: never blocks, never throws, and
// honours the same opt-out. A user who turned off scan logging did not agree to
// send us shelf reports either.

async function publish(s: StoreSighting): Promise<void> {
  try {
    if (isScanLoggingOptedOut()) return;
    await fetch(`${getBackendUrl()}/api/store-sightings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...s, anonId: getAnonId() }),
      signal: AbortSignal.timeout(4000),
      keepalive: true,
    });
  } catch {
    // offline / server down — the local copy still counts for this user
  }
}

// Counts fetched from the backend, keyed `barcode|retailerId`. Populated by
// primeRemoteCounts() when a results page loads, so the common case is one
// request per search rather than one per product.
const remoteCounts = new Map<string, number>();

function getRemoteCount(barcode: string, retailerId: string): number {
  return remoteCounts.get(`${barcode}|${retailerId}`) ?? 0;
}

/**
 * Fetch community sighting counts for a set of products at one chain.
 * Best-effort: failure just means we fall back to local counts.
 */
export async function primeRemoteCounts(barcodes: string[], retailerId: string): Promise<void> {
  const codes = barcodes.filter(Boolean).slice(0, 50);
  if (codes.length === 0) return;
  try {
    const url = new URL(`${getBackendUrl()}/api/store-sightings`);
    url.searchParams.set('retailerId', retailerId);
    url.searchParams.set('barcodes', codes.join(','));
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return;
    const data = await res.json();
    for (const row of data.counts ?? []) {
      if (typeof row?.barcode === 'string' && typeof row?.count === 'number') {
        remoteCounts.set(`${row.barcode}|${retailerId}`, row.count);
      }
    }
    window.dispatchEvent(new Event(SIGHTINGS_EVENT));
  } catch {
    // best effort
  }
}
