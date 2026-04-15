/**
 * Backend URL configuration
 *
 * Production: uses the dedicated backend on Hostinger
 * Development: uses localhost:3001
 */

const PRODUCTION_BACKEND = 'https://goodscan.shop';

export const getBackendUrl = (): string => {
  // If explicitly set via env var, use that
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }

  // Local development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }

  // Production & Capacitor — use dedicated backend
  return PRODUCTION_BACKEND;
};
