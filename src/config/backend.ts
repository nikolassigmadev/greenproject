/**
 * Backend URL configuration
 *
 * Always uses the production backend (https://goodscan.shop) unless
 * VITE_BACKEND_URL is explicitly set in .env.local.
 *
 * To use a local server during development, add to .env.local:
 *   VITE_BACKEND_URL=http://localhost:3001
 */

const PRODUCTION_BACKEND = 'https://goodscan.shop';

export const getBackendUrl = (): string => {
  // Explicit override (e.g. VITE_BACKEND_URL=http://localhost:3001 in .env.local)
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }

  // Always fall back to production — browser dev and Capacitor both use it
  return PRODUCTION_BACKEND;
};
