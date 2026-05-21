import { getBackendUrl } from '@/config/backend';

const ADMIN_TOKEN_KEY = 'greenstone_admin_token';

/**
 * Login via server-side auth. Returns true if successful.
 */
export async function loginAdmin(password: string): Promise<boolean> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (data.success && data.token) {
      localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
}

/**
 * Check if we have a valid admin session (calls server to verify).
 * For synchronous route guards, use getAdminToken() !== null as a fast check,
 * then call verifyAdmin() for server confirmation.
 */
export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function isAdminAuthenticated(): boolean {
  return !!localStorage.getItem(ADMIN_TOKEN_KEY);
}

export async function verifyAdmin(): Promise<boolean> {
  const token = getAdminToken();
  if (!token) return false;
  try {
    const res = await fetch(`${getBackendUrl()}/api/admin/verify`, {
      headers: { 'X-Admin-Token': token },
    });
    const data = await res.json();
    if (!data.authenticated) {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function logoutAdmin(): Promise<void> {
  const token = getAdminToken();
  if (token) {
    try {
      await fetch(`${getBackendUrl()}/api/admin/logout`, {
        method: 'POST',
        headers: { 'X-Admin-Token': token },
      });
    } catch {
      // Best effort
    }
  }
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

/**
 * @deprecated Use logoutAdmin() instead
 */
export function clearAdminAuthenticated(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}
