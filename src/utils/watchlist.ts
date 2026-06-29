// Brand watchlist — users mark brands they have a personal stance on. A brand
// can be flagged "avoid" (you distrust it — pulls a product's score down when it
// shows up) or "trust" (you vouch for it — lifts the score). Stored in
// localStorage and mirrored to a window event so any open view can react.

const STORAGE_KEY = 'goodscan-watchlist';
export const WATCHLIST_EVENT = 'watchlistUpdated';

export type BrandSentiment = 'avoid' | 'trust';

export interface WatchEntry {
  brand: string;
  sentiment: BrandSentiment;
}

function normalize(brand: string): string {
  return brand.trim().toLowerCase();
}

// Reads the raw store, migrating the legacy `string[]` format (brands the user
// wanted to "never buy") into entries flagged as "avoid".
function readEntries(): WatchEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item): WatchEntry | null => {
        if (typeof item === 'string') {
          return item.trim() ? { brand: item.trim(), sentiment: 'avoid' } : null;
        }
        if (item && typeof item.brand === 'string' && item.brand.trim()) {
          return {
            brand: item.brand.trim(),
            sentiment: item.sentiment === 'trust' ? 'trust' : 'avoid',
          };
        }
        return null;
      })
      .filter((e): e is WatchEntry => e !== null);
  } catch {
    return [];
  }
}

function persist(entries: WatchEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new Event(WATCHLIST_EVENT));
}

/** Full entries with sentiment. */
export function loadWatchlistEntries(): WatchEntry[] {
  return readEntries();
}

/** Brand names only — kept for the many consumers that don't care about sentiment. */
export function loadWatchlist(): string[] {
  return readEntries().map((e) => e.brand);
}

export function isWatched(brand: string | null | undefined): boolean {
  if (!brand) return false;
  const target = normalize(brand);
  return readEntries().some((e) => normalize(e.brand) === target);
}

/** The user's stance on a brand, or null if it isn't on their list. */
export function getBrandSentiment(brand: string | null | undefined): BrandSentiment | null {
  if (!brand) return null;
  const target = normalize(brand);
  return readEntries().find((e) => normalize(e.brand) === target)?.sentiment ?? null;
}

/** Add a brand (or update its sentiment if already present). Defaults to "avoid". */
export function addToWatchlist(brand: string, sentiment: BrandSentiment = 'avoid'): void {
  if (!brand || !brand.trim()) return;
  const entries = readEntries();
  const existing = entries.find((e) => normalize(e.brand) === normalize(brand));
  if (existing) {
    existing.sentiment = sentiment;
    persist(entries);
    return;
  }
  entries.unshift({ brand: brand.trim(), sentiment });
  persist(entries);
}

/** Explicitly set (or change) a brand's sentiment, adding it if needed. */
export function setBrandSentiment(brand: string, sentiment: BrandSentiment): void {
  addToWatchlist(brand, sentiment);
}

export function removeFromWatchlist(brand: string): void {
  const entries = readEntries().filter((e) => normalize(e.brand) !== normalize(brand));
  persist(entries);
}

export function toggleWatchlist(brand: string): boolean {
  if (isWatched(brand)) {
    removeFromWatchlist(brand);
    return false;
  }
  addToWatchlist(brand);
  return true;
}
