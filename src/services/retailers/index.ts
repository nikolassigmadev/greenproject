// How likely is it that this product is on the shelf in front of you?
//
// The honest answer is never "definitely". We have four signals, none of which
// is stock, and this module's whole job is to keep them distinguishable instead
// of collapsing them into a green tick.
//
// The ladder, strongest first:
//   confirmed_here  a shopper told us they saw it at this chain, in this country
//   seen_at_chain   Open Food Facts carries a store tag naming this chain
//   sold_in_market  the brand trades in this country, nothing chain-specific
//   unknown         no signal at all
//
// "seen_at_chain" is a sighting somebody once recorded, with no date and no
// branch. It is genuinely useful and genuinely not stock information, and the
// label the user reads has to reflect that.

import type { OpenFoodFactsResult } from '@/services/openfoodfacts/types';
import type { Retailer } from '@/data/retailers';
import { storeTagsMatchRetailer } from '@/data/retailers';
import { getSightingCount } from '@/utils/storeSightings';

export type AvailabilityConfidence =
  | 'confirmed_here'
  | 'seen_at_chain'
  | 'sold_in_market'
  | 'unknown';

export interface RetailerAvailability {
  confidence: AvailabilityConfidence;
  /** Short label for a badge. Never implies live stock. */
  label: string;
  /** One sentence a user can act on, explaining where the signal came from. */
  explain: string;
  /** How many shoppers have confirmed a sighting at this chain. */
  sightings: number;
}

/**
 * Pull store tags off an OFF product. The field is `stores` (free text, comma
 * separated) with a parallel `stores_tags` array; different endpoints return
 * different ones, so accept both.
 */
export function extractStoreTags(product: OpenFoodFactsResult | null): string[] {
  if (!product) return [];
  const raw = product.rawProduct as unknown as Record<string, unknown> | null | undefined;
  if (!raw) return [];
  const tags = raw.stores_tags;
  if (Array.isArray(tags)) return tags.filter((t): t is string => typeof t === 'string');
  const stores = raw.stores;
  if (typeof stores === 'string') return stores.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

export function assessAvailability(
  product: OpenFoodFactsResult | null,
  retailer: Retailer,
  opts: { barcode?: string | null; soldInMarket?: boolean } = {},
): RetailerAvailability {
  const barcode = opts.barcode ?? product?.barcode ?? null;
  const sightings = barcode ? getSightingCount(barcode, retailer.id) : 0;

  if (sightings > 0) {
    return {
      confidence: 'confirmed_here',
      label: `Seen at ${retailer.name}`,
      explain:
        sightings === 1
          ? `One shopper confirmed seeing this at ${retailer.name}. Shelves change — it may not be there today.`
          : `${sightings} shoppers confirmed seeing this at ${retailer.name}. Shelves change — it may not be there today.`,
      sightings,
    };
  }

  if (storeTagsMatchRetailer(extractStoreTags(product), retailer)) {
    return {
      confidence: 'seen_at_chain',
      label: `Listed at ${retailer.name}`,
      explain:
        `Open Food Facts records this product as sold at ${retailer.name}. That entry has no date and no branch, ` +
        `so treat it as "this chain carries it", not "it is in stock".`,
      sightings: 0,
    };
  }

  if (opts.soldInMarket) {
    return {
      confidence: 'sold_in_market',
      label: 'Sold in your country',
      explain:
        `We know this brand trades in your market, but we have nothing linking it to ${retailer.name} specifically. ` +
        `It may or may not be on their shelves.`,
      sightings: 0,
    };
  }

  return {
    confidence: 'unknown',
    label: 'Availability unknown',
    explain: `We have no information about whether ${retailer.name} carries this. Worth checking, not worth a trip.`,
    sightings: 0,
  };
}

/** Rank order for sorting — higher is a stronger signal. */
export const CONFIDENCE_RANK: Record<AvailabilityConfidence, number> = {
  confirmed_here: 3,
  seen_at_chain: 2,
  sold_in_market: 1,
  unknown: 0,
};
