// Tracks when a user accepts a "greener swap" suggestion.
// Used by the impact dashboard to show "X swaps accepted this month".

const STORAGE_KEY = 'goodscan-accepted-swaps';
const MAX_ENTRIES = 200;
export const SWAP_EVENT = 'swapsUpdated';

export type SwapConcernType = "labor" | "boycott" | "animal_welfare" | "eco";

export interface AcceptedSwap {
  timestamp: number;
  fromBarcode: string;
  fromName: string;
  fromBrand: string | null;
  toBarcode: string;
  toName: string;
  toBrand: string | null;
  co2SavedKg: number | null;
  /** The primary concern the swap resolved (drives "concerns avoided" stats). */
  concernAvoided?: SwapConcernType | null;
  /** Catalog category of the swap, e.g. "chocolate". */
  categoryKey?: string | null;
  /** ISO country code the user shopped in, when known. */
  regionCountry?: string | null;
}

export function loadAcceptedSwaps(): AcceptedSwap[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordSwap(swap: AcceptedSwap): void {
  try {
    const list = loadAcceptedSwaps();
    list.unshift(swap);
    const trimmed = list.slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    window.dispatchEvent(new Event(SWAP_EVENT));
  } catch {
    // localStorage may be full / disabled — silently ignore
  }
}

export function clearAcceptedSwaps(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(SWAP_EVENT));
}
