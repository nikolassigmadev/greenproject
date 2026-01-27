import bcrypt from 'bcryptjs';

/**
 * Generate bcrypt hash for "geo" password
 */
async function generateGeoHash() {
  const password = 'geo';
  const saltRounds = 10; // Good balance of security and performance
  
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('=== Bcrypt Hash Generator ===');
    console.log('Password:', password);
    console.log('Salt Rounds:', saltRounds);
    console.log('Bcrypt Hash:', hash);
    console.log('');
    console.log('Copy this hash to your adminAuth.ts file:');
    console.log(`export const ADMIN_PASSWORD_HASH = "${hash}";`);
    return hash;
  } catch (error) {
    console.error('Error generating hash:', error);
    return null;
  }
}

/**
 * Verify password against hash
 */
async function verifyPassword(password: string, hash: string) {
  try {
    const isValid = await bcrypt.compare(password, hash);
    console.log(`Password "${password}" is ${isValid ? 'VALID' : 'INVALID'} for the provided hash`);
    return isValid;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

// Auto-generate when run
if (typeof window !== 'undefined') {
  // Browser environment
  generateGeoHash();
} else if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  generateGeoHash();
}

export { generateGeoHash, verifyPassword };
