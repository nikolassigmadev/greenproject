import Dexie, { type Table } from 'dexie';
import { Product, defaultProducts } from '@/data/products';

class EthicalShopperDB extends Dexie {
  products!: Table<Product, string>;

  constructor() {
    super('EthicalShopperDB');
    this.version(1).stores({
      products: 'id, name, brand, category, barcode',
    });
  }
}

export const db = new EthicalShopperDB();

// Seed the database with default products if empty
export async function seedIfEmpty(): Promise<void> {
  const count = await db.products.count();
  if (count === 0) {
    await db.products.bulkAdd(defaultProducts);
  }
}

// One-time migration from localStorage to IndexedDB
export async function migrateFromLocalStorage(): Promise<void> {
  const STORAGE_KEY = 'ethical-shopper-products';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const products: Product[] = JSON.parse(stored);
      if (products.length > 0) {
        // Clear existing and import from localStorage
        await db.products.clear();
        await db.products.bulkAdd(products);
        // Remove from localStorage after successful migration
        localStorage.removeItem(STORAGE_KEY);
        console.log(`Migrated ${products.length} products from localStorage to IndexedDB`);
      }
    }
  } catch (error) {
    console.error('Failed to migrate from localStorage:', error);
  }
}

// Initialize: migrate first, then seed if still empty
export async function initDB(): Promise<void> {
  await migrateFromLocalStorage();
  await seedIfEmpty();
}

// CRUD operations
export async function getAllProducts(): Promise<Product[]> {
  return db.products.toArray();
}

export async function getProductById(id: string): Promise<Product | undefined> {
  return db.products.get(id);
}

export async function addProduct(product: Product): Promise<void> {
  await db.products.add(product);
}

export async function updateProduct(product: Product): Promise<void> {
  await db.products.put(product);
}

export async function deleteProduct(id: string): Promise<void> {
  await db.products.delete(id);
}

export async function saveAllProducts(products: Product[]): Promise<void> {
  await db.products.clear();
  await db.products.bulkAdd(products);
}
