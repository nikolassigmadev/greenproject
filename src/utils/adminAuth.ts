import bcrypt from 'bcryptjs';

const ADMIN_AUTH_STORAGE_KEY = "greenstone_admin_authenticated";

// Bcrypt hash for "geo" password
export const ADMIN_PASSWORD_HASH = "$2b$10$VOZs5Jxk648bNDLgw7Dz0eG54sfrYhNB1UvFmMUU4m1kiJdmNiR2C";

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

export function isAdminAuthenticated(): boolean {
  return localStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === "true";
}

export function setAdminAuthenticated(authenticated: boolean): void {
  localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, authenticated ? "true" : "false");
}

export function clearAdminAuthenticated(): void {
  localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
}
