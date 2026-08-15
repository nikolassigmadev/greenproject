// Which shop the user says they're standing in.
//
// Stored per device, cleared automatically when it stops making sense — if they
// change country, a Tesco selection is no longer a shop they can walk into, and
// silently keeping it would produce availability answers about the wrong market.

import { getRetailerById, type Retailer } from '@/data/retailers';

const KEY = 'goodscan-retailer';
export const RETAILER_EVENT = 'goodscan-retailer-updated';

export function loadRetailer(countryCode?: string | null): Retailer | null {
  try {
    const id = localStorage.getItem(KEY);
    const retailer = getRetailerById(id);
    if (!retailer) return null;
    // A saved chain that doesn't trade in the current market is stale, not a
    // preference. Drop it rather than answering questions about Tesco to
    // somebody who has moved to Bali.
    if (countryCode && !retailer.countries.includes(countryCode.toUpperCase())) return null;
    return retailer;
  } catch {
    return null;
  }
}

export function saveRetailer(id: string): void {
  try {
    localStorage.setItem(KEY, id);
    window.dispatchEvent(new Event(RETAILER_EVENT));
  } catch {
    // storage disabled — selection just won't persist
  }
}

export function clearRetailer(): void {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(RETAILER_EVENT));
  } catch {
    // ignore
  }
}
