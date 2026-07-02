// Brand activity for the watchlist — turns the flag/boycott datasets into a
// per-brand timeline, and detects *changes* so the watchlist can alert:
// "a brand you watch got a new verified flag" / "entered the boycott list".
//
// The data ships with the app bundle, so "new" means "new since this device
// last looked" — we keep a per-brand snapshot of known event ids and diff
// against it. Two snapshots with different jobs:
//   - notified: events we've fired an OS notification for (never repeat)
//   - seen:     events the user has viewed on the Watchlist page (NEW badge)
// A brand with no snapshot yet (fresh install, or just added to the watchlist)
// is baselined silently — matching the weekly-recap "seed quietly" pattern.

import { loadWatchlist } from './watchlist';
import { getVerifiedFlagsForBrand } from '@/services/brandFlags';
import { checkBoycott } from '@/data/boycottBrands';
import { getLocalPushStatus, showLocalDemoNotification } from './pushNotifications';
import type { FlagSeverity } from '@/types/brandFlag';

export interface BrandEvent {
  /** Stable id, e.g. "nestlé:flag:nestle-forced-labour-2023". */
  id: string;
  /** The watched brand this event is about (as the user wrote it). */
  brand: string;
  type: 'flag' | 'boycott';
  /** ISO date used for ordering; null for undated (ongoing) boycott listings. */
  date: string | null;
  title: string;
  detail: string;
  severity?: FlagSeverity;
  sourceUrl?: string;
  publisher?: string;
  /** Not yet viewed on the Watchlist page. */
  isNew: boolean;
}

const NOTIFIED_KEY = 'goodscan-brand-events-notified';
const SEEN_KEY = 'goodscan-brand-events-seen';
export const BRAND_EVENTS_EVENT = 'brandEventsUpdated';

type Snapshot = Record<string, string[]>; // normalized brand → known event ids

const normalize = (brand: string) => brand.trim().toLowerCase();

function loadSnapshot(key: string): Snapshot {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveSnapshot(key: string, snap: Snapshot): void {
  try {
    localStorage.setItem(key, JSON.stringify(snap));
  } catch {
    // localStorage disabled — events simply won't be deduplicated
  }
}

const CATEGORY_TITLE: Record<string, string> = {
  forced_labour: 'Forced-labour flag',
  child_labour: 'Child-labour flag',
  wage_theft: 'Wage-theft flag',
  unsafe_conditions: 'Unsafe-conditions flag',
  union_busting: 'Union-busting flag',
  discrimination: 'Discrimination flag',
  supply_chain_opacity: 'Supply-chain opacity flag',
  animal_welfare: 'Animal-welfare flag',
  environmental_harm: 'Environmental-harm flag',
  boycott_listed: 'Boycott listing',
};

/** All current events for one brand, derived from the live datasets. */
function eventsForBrand(brand: string, seen: Snapshot): BrandEvent[] {
  const key = normalize(brand);
  const seenIds = new Set(seen[key] ?? []);
  const events: BrandEvent[] = [];

  for (const flag of getVerifiedFlagsForBrand(brand)) {
    const top = flag.sources[0];
    const id = `${key}:flag:${flag.id}`;
    events.push({
      id,
      brand,
      type: 'flag',
      date: flag.updatedAt || flag.createdAt || flag.lastVerified || null,
      title: CATEGORY_TITLE[flag.category] ?? 'Verified flag',
      detail: flag.summary,
      severity: flag.severity,
      sourceUrl: top?.url,
      publisher: top?.publisher,
      isNew: !seenIds.has(id),
    });
  }

  const boycott = checkBoycott(brand);
  if (boycott) {
    const id = `${key}:boycott:${normalize(boycott.parent)}`;
    events.push({
      id,
      brand,
      type: 'boycott',
      date: null,
      title: `${boycott.parent} is boycott-listed`,
      detail: boycott.reason,
      isNew: !seenIds.has(id),
    });
  }

  return events;
}

/**
 * The full activity timeline for the given brands (defaults to the user's
 * watchlist), newest first — undated boycott listings sort last.
 */
export function getBrandTimeline(brands: string[] = loadWatchlist()): BrandEvent[] {
  const seen = loadSnapshot(SEEN_KEY);
  const events = brands.flatMap((brand) => eventsForBrand(brand, seen));
  // Alias matching can surface several flag records that tell the same story
  // (e.g. one per sub-brand of the same parent) — show each story once.
  const dedupedByStory = new Map<string, BrandEvent>();
  for (const e of events) {
    const key = `${normalize(e.brand)}:${e.title}:${e.detail}`;
    if (!dedupedByStory.has(key)) dedupedByStory.set(key, e);
  }
  return [...dedupedByStory.values()].sort((a, b) => {
    if (!!a.date !== !!b.date) return a.date ? -1 : 1;
    return (b.date ?? '').localeCompare(a.date ?? '');
  });
}

/** Record that the user has viewed these events (clears their NEW badge). */
export function markEventsSeen(events: BrandEvent[]): void {
  if (events.length === 0) return;
  const seen = loadSnapshot(SEEN_KEY);
  for (const e of events) {
    const key = normalize(e.brand);
    const ids = new Set(seen[key] ?? []);
    ids.add(e.id);
    seen[key] = [...ids];
  }
  saveSnapshot(SEEN_KEY, seen);
  window.dispatchEvent(new Event(BRAND_EVENTS_EVENT));
}

/**
 * App-load check: diff current events against the notified snapshot and fire
 * ONE local OS notification summarising anything new (when the user has
 * notifications on). Brands without a snapshot are baselined silently, so
 * neither a fresh install nor a just-watched brand spams alerts.
 * Returns the events that were genuinely new.
 */
export async function checkForNewBrandEvents(): Promise<BrandEvent[]> {
  const brands = loadWatchlist();
  if (brands.length === 0) return [];

  const notified = loadSnapshot(NOTIFIED_KEY);
  const seen = loadSnapshot(SEEN_KEY);
  const fresh: BrandEvent[] = [];
  let changed = false;

  for (const brand of brands) {
    const key = normalize(brand);
    const events = eventsForBrand(brand, seen);
    const ids = events.map((e) => e.id);
    if (!(key in notified)) {
      // First time we see this brand — baseline, don't alert on history.
      notified[key] = ids;
      changed = true;
      continue;
    }
    const known = new Set(notified[key]);
    const newOnes = events.filter((e) => !known.has(e.id));
    if (newOnes.length > 0) {
      fresh.push(...newOnes);
      notified[key] = ids;
      changed = true;
    }
  }

  if (changed) saveSnapshot(NOTIFIED_KEY, notified);

  if (fresh.length > 0) {
    window.dispatchEvent(new Event(BRAND_EVENTS_EVENT));
    if (getLocalPushStatus() === 'subscribed') {
      const first = fresh[0];
      const body = fresh.length === 1
        ? `${first.brand}: ${first.title.toLowerCase()}`
        : `${first.brand} and ${fresh.length - 1} more update${fresh.length > 2 ? 's' : ''} on brands you watch`;
      await showLocalDemoNotification('Watchlist update', body);
    }
  }

  return fresh;
}

/** Count of events the user hasn't viewed yet — for badges. */
export function getUnseenEventCount(): number {
  return getBrandTimeline().filter((e) => e.isNew).length;
}
