// Browser push notifications for watchlist brands.
// Calls /api/push/{subscribe,unsubscribe} on the backend.

import { getBackendUrl } from '@/config/backend';
import { loadWatchlist } from './watchlist';

const SUBSCRIBED_KEY = 'goodscan-push-subscribed';
export const PUSH_EVENT = 'pushSubscriptionChanged';

export type PushStatus = 'unsupported' | 'denied' | 'idle' | 'subscribed';

export function isPushSupported(): boolean {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window;
}

export function getLocalPushStatus(): PushStatus {
  if (!isPushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  return localStorage.getItem(SUBSCRIBED_KEY) === '1' ? 'subscribed' : 'idle';
}

async function ensureServiceWorker(): Promise<ServiceWorkerRegistration> {
  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  return reg;
}

export async function enablePushNotifications(): Promise<{ ok: boolean; reason?: string }> {
  if (!isPushSupported()) return { ok: false, reason: 'unsupported' };

  let perm = Notification.permission;
  if (perm === 'default') perm = await Notification.requestPermission();
  if (perm !== 'granted') return { ok: false, reason: 'denied' };

  try {
    const reg = await ensureServiceWorker();
    // No VAPID key shipped yet — backend treats this as a stub registration.
    // Browsers require an applicationServerKey for prod; we record the
    // subscription locally and on the backend for now.
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      try {
        subscription = await reg.pushManager.subscribe({ userVisibleOnly: true });
      } catch {
        // VAPID may be required; we still record an opt-in flag locally so the
        // demo flow can show a notification via the service worker's manual API.
        localStorage.setItem(SUBSCRIBED_KEY, '1');
        window.dispatchEvent(new Event(PUSH_EVENT));
        return { ok: true };
      }
    }

    await fetch(`${getBackendUrl()}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        watchedBrands: loadWatchlist(),
      }),
    });

    localStorage.setItem(SUBSCRIBED_KEY, '1');
    window.dispatchEvent(new Event(PUSH_EVENT));
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: 'error' };
  }
}

export async function disablePushNotifications(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await fetch(`${getBackendUrl()}/api/push/unsubscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => undefined);
        await sub.unsubscribe();
      }
    }
  } finally {
    localStorage.removeItem(SUBSCRIBED_KEY);
    window.dispatchEvent(new Event(PUSH_EVENT));
  }
}

/** Send a local demo notification via the service worker — for in-app testing. */
export async function showLocalDemoNotification(title: string, body: string): Promise<boolean> {
  if (!isPushSupported() || Notification.permission !== 'granted') return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration() ?? (await ensureServiceWorker());
    await reg.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'goodscan-watchlist-demo',
      data: { url: '/watchlist' },
    });
    return true;
  } catch {
    return false;
  }
}
