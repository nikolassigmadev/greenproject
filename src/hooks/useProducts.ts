import { useState, useEffect } from 'react';
import { Product, defaultProducts } from '@/data/products';
import { loadProducts } from '@/utils/storage';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>(() => {
    // Initialize with products from localStorage or default products
    return loadProducts() || defaultProducts;
  });

  // Listen for storage changes and update products
  useEffect(() => {
    const handleStorageChange = () => {
      const updatedProducts = loadProducts();
      if (updatedProducts) {
        setProducts(updatedProducts);
      }
    };

    // Listen for custom storage events
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for a custom event for same-tab updates
    window.addEventListener('productsUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('productsUpdated', handleStorageChange);
    };
  }, []);

  return products;
};
