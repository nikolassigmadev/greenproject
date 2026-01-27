import bcrypt from 'bcryptjs';

/**
 * Generate bcrypt hash for "geo" password
 */
async function generateGeoHash() {
  const password = 'geo';
  const saltRounds = 10;
  
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('=== Bcrypt Hash Generator ===');
    console.log('Password:', password);
    console.log('Bcrypt Hash:', hash);
    return hash;
  } catch (error) {
    console.error('Error generating hash:', error);
    return null;
  }
}

export { generateGeoHash };
