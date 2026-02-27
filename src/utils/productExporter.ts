import { Product } from '@/data/products';

export const exportProductsToJson = (products: Product[]): string => {
  return JSON.stringify(products, null, 2);
};

export const exportSingleProductToJson = (product: Product): string => {
  return JSON.stringify(product, null, 2);
};

export const downloadProductsFile = (products: Product[]) => {
  const json = exportProductsToJson(products);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'products.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const copySingleProductCode = (product: Product): Promise<boolean> => {
  const json = exportSingleProductToJson(product);

  // Check if clipboard API is available
  if (!navigator.clipboard) {
    console.warn('Clipboard API not available, using fallback');
    return fallbackCopy(json);
  }

  return navigator.clipboard.writeText(json).then(() => {
    console.log('Product JSON copied to clipboard!');
    return true;
  }).catch(err => {
    console.error('Failed to copy product JSON:', err);
    // Fallback to manual copy method
    return fallbackCopy(json);
  });
};

const fallbackCopy = (text: string): Promise<boolean> => {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return Promise.resolve(success);
  } catch (err) {
    console.error('Fallback copy failed:', err);
    return Promise.resolve(false);
  }
};
