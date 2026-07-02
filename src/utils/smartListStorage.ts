// Smart shopping list — generic things the user needs ("coffee", "eggs"),
// stored alongside the concrete basket. Each item is mapped to a swap-catalog
// category so the shopping list can proactively recommend the best-scoring
// brand for the user's priorities and region. Same localStorage + window-event
// pattern as the basket.

import type { SwapCategoryKey } from "@/data/ethicalAlternatives";

export interface SmartListItem {
  id: string;
  /** What the user typed, e.g. "coffee". */
  label: string;
  /** Matched swap-catalog category, or null when we have no curated picks. */
  category: SwapCategoryKey | null;
  addedAt: number;
}

const STORAGE_KEY = "goodscan-smart-list";
export const SMART_LIST_EVENT = "smartListUpdated";

export function loadSmartList(): SmartListItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(items: SmartListItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(SMART_LIST_EVENT));
  } catch (error) {
    console.error("Failed to save smart list:", error);
  }
}

/** Add an item (no-op when an item with the same label already exists). */
export function addSmartListItem(label: string, category: SwapCategoryKey | null): SmartListItem | null {
  const trimmed = label.trim();
  if (!trimmed) return null;
  const items = loadSmartList();
  if (items.some((i) => i.label.toLowerCase() === trimmed.toLowerCase())) return null;
  const item: SmartListItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label: trimmed,
    category,
    addedAt: Date.now(),
  };
  persist([item, ...items]);
  return item;
}

export function removeSmartListItem(id: string): void {
  persist(loadSmartList().filter((i) => i.id !== id));
}
