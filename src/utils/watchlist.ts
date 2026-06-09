// Brand watchlist — users mark brands they care about ("never buy Nestlé").
// Stored in localStorage, mirrored to a window event so any open view can react.

const STORAGE_KEY = 'goodscan-watchlist';
export const WATCHLIST_EVENT = 'watchlistUpdated';

function normalize(brand: string): string {
  return brand.trim().toLowerCase();
}

export function loadWatchlist(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

function persist(list: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(WATCHLIST_EVENT));
}

export function isWatched(brand: string | null | undefined): boolean {
  if (!brand) return false;
  const target = normalize(brand);
  return loadWatchlist().some((b) => normalize(b) === target);
}

export function addToWatchlist(brand: string): void {
  if (!brand || !brand.trim()) return;
  const list = loadWatchlist();
  if (list.some((b) => normalize(b) === normalize(brand))) return;
  list.unshift(brand.trim());
  persist(list);
}

export function removeFromWatchlist(brand: string): void {
  const list = loadWatchlist().filter((b) => normalize(b) !== normalize(brand));
  persist(list);
}

export function toggleWatchlist(brand: string): boolean {
  if (isWatched(brand)) {
    removeFromWatchlist(brand);
    return false;
  }
  addToWatchlist(brand);
  return true;
}
