const ADMIN_AUTH_STORAGE_KEY = "greenstone_admin_authenticated";

export const ADMIN_PASSWORD = "pass";

export function isAdminAuthenticated(): boolean {
  return localStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === "true";
}

export function setAdminAuthenticated(authenticated: boolean): void {
  localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, authenticated ? "true" : "false");
}

export function clearAdminAuthenticated(): void {
  localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
}
