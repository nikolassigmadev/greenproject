/**
 * Backend URL configuration
 *
 * In development (browser): uses same hostname with port 3001
 * In Capacitor (mobile app): uses the production Hostinger backend
 */

const isCapacitor = () => {
  return (
    window.location.protocol === 'capacitor:' ||
    window.location.hostname === 'localhost' && !window.location.port
  );
};

export const getBackendUrl = (): string => {
  // If explicitly set via env var, use that
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }

  // Capacitor mobile app — use production backend
  if (isCapacitor()) {
    return 'https://darkviolet-whale-491214.hostingersite.com:3001';
  }

  // Browser development — use same hostname with port 3001
  return `${window.location.protocol}//${window.location.hostname}:3001`;
};
