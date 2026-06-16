// "Weekly impact recap" — surfaced in-app when a week has passed since the
// last one. All numbers come from existing client-side data (impactStats).
//
// NOTE: a true server-pushed weekly notification isn't possible here — stats
// live only on-device and no VAPID key is shipped. So this is an in-app recap;
// if the user has already granted notification permission we *also* fire a
// local notification as a nudge.

import { computeMonthlyImpact } from './impactStats';
import { showLocalDemoNotification, getLocalPushStatus } from './pushNotifications';

const SEEN_KEY = 'goodscan-weekly-recap-seen'; // last-seen timestamp (ms)
const WEEK_MS = 7 * 86_400_000;

export interface WeeklyRecap {
  scanCount: number;
  swapsAccepted: number;
  co2SavedKg: number;
  flaggedBrandCount: number;
  topBrand: string | null;
}

export function getWeeklyRecap(): WeeklyRecap {
  const m = computeMonthlyImpact(7);
  return {
    scanCount: m.scanCount,
    swapsAccepted: m.swapsAccepted,
    co2SavedKg: m.co2SavedKg,
    flaggedBrandCount: m.flaggedBrandCount,
    topBrand: m.topBrands[0]?.brand ?? null,
  };
}

export function markRecapSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, String(Date.now()));
  } catch {
    // localStorage disabled — recap simply won't be throttled
  }
}

/**
 * Due when there's something to show AND it's been ≥7 days since the last
 * recap. On a user's very first visit we seed the timestamp and stay quiet,
 * so the first recap lands a week in (not right after the first scan).
 */
export function isRecapDue(): boolean {
  if (getWeeklyRecap().scanCount === 0) return false;
  const raw = localStorage.getItem(SEEN_KEY);
  if (raw === null) {
    markRecapSeen();
    return false;
  }
  return Date.now() - Number(raw) >= WEEK_MS;
}

/** Fire a local OS notification for the recap if permission is already granted. */
export async function maybeNotifyRecap(recap: WeeklyRecap): Promise<void> {
  if (getLocalPushStatus() !== 'subscribed') return;
  const swapBit = recap.swapsAccepted > 0
    ? ` and chose ${recap.swapsAccepted} greener swap${recap.swapsAccepted === 1 ? '' : 's'}`
    : '';
  await showLocalDemoNotification(
    'Your week on GoodScan 🌱',
    `You scanned ${recap.scanCount} product${recap.scanCount === 1 ? '' : 's'}${swapBit} this week.`,
  );
}
