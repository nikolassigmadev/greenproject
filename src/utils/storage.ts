import { Product } from '@/data/products';

const STORAGE_KEY = 'ethical-shopper-products';

export const saveProducts = (products: Product[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    // Dispatch custom event to notify other components in the same tab
    window.dispatchEvent(new Event('productsUpdated'));
  } catch (error) {
    console.error('Failed to save products to localStorage:', error);
  }
};

export const loadProducts = (): Product[] | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load products from localStorage:', error);
    return null;
  }
};

export const clearProducts = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear products from localStorage:', error);
  }
};
