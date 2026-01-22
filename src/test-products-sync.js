// Test script to verify product synchronization
// This can be run in the browser console to test the functionality

// Test 1: Check if products are loaded from localStorage
console.log('=== Product Sync Test ===');

// Test 2: Add a test product to localStorage
const testProduct = {
  id: '#p9999',
  name: 'Test Product',
  brand: 'Test Brand',
  category: 'Test Category',
  origin: { country: 'Test Country', region: 'Test Region' },
  materials: ['Test Material'],
  laborRisk: 'low',
  transportDistance: 1000,
  certifications: ['Test Cert'],
  carbonFootprint: 5.0,
  keywords: ['test', 'product'],
  barcode: '9999999999999'
};

// Save test product
const existingProducts = JSON.parse(localStorage.getItem('ethical-shopper-products') || '[]');
const updatedProducts = [...existingProducts, testProduct];
localStorage.setItem('ethical-shopper-products', JSON.stringify(updatedProducts));

console.log('Added test product to localStorage');
console.log('Total products in localStorage:', updatedProducts.length);

// Test 3: Trigger custom event to notify components
window.dispatchEvent(new Event('productsUpdated'));
console.log('Triggered productsUpdated event');

console.log('Test completed! Check the admin page and main pages to see if the test product appears.');
