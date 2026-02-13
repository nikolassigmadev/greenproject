import { Product } from '@/data/products';

export const exportProductsToCode = (products: Product[]): string => {
  // Convert products array to TypeScript code
  const productsCode = products.map(product => {
    const imageUrlField = product.imageUrl ? `imageUrl: '${product.imageUrl}'` : 'imageUrl: undefined';
    const regionField = product.origin.region ? `region: '${product.origin.region}'` : '';
    const manualScoreField = product.manualScore !== undefined ? `manualScore: ${product.manualScore}` : '';
    const commentsField = product.comments ? `comments: '${product.comments.replace(/'/g, "\\'")}'` : '';
    
    return `  {
    id: '${product.id}',
    name: '${product.name}',
    brand: '${product.brand}',
    category: '${product.category}',
    origin: { country: '${product.origin.country}'${regionField ? `, ${regionField}` : ''} },
    materials: [${product.materials.map(m => `'${m}'`).join(', ')}],
    laborRisk: '${product.laborRisk}',
    transportDistance: ${product.transportDistance},
    certifications: [${product.certifications.map(c => `'${c}'`).join(', ')}],
    carbonFootprint: ${product.carbonFootprint},
    keywords: [${product.keywords.map(k => `'${k}'`).join(', ')}],
    barcode: '${product.barcode}',
    ${imageUrlField},
    ${manualScoreField}
    ${commentsField ? `,${commentsField}` : ''}
  }`;
  }).join(',\n');

  return `// ==========================================
// PRODUCT DATABASE - ADD YOUR PRODUCTS HERE
// ==========================================

export const defaultProducts: Product[] = [
${productsCode},
];`;
};

export const exportSingleProductToCode = (product: Product): string => {
  const imageUrlField = product.imageUrl ? `imageUrl: '${product.imageUrl}'` : 'imageUrl: undefined';
  const regionField = product.origin.region ? `region: '${product.origin.region}'` : '';
  const manualScoreField = product.manualScore !== undefined ? `manualScore: ${product.manualScore}` : '';
  const commentsField = product.comments ? `comments: '${product.comments.replace(/'/g, "\\'")}'` : '';
  
  return `  {
    id: '${product.id}',
    name: '${product.name}',
    brand: '${product.brand}',
    category: '${product.category}',
    origin: { country: '${product.origin.country}'${regionField ? `, ${regionField}` : ''} },
    materials: [${product.materials.map(m => `'${m}'`).join(', ')}],
    laborRisk: '${product.laborRisk}',
    transportDistance: ${product.transportDistance},
    certifications: [${product.certifications.map(c => `'${c}'`).join(', ')}],
    carbonFootprint: ${product.carbonFootprint},
    keywords: [${product.keywords.map(k => `'${k}'`).join(', ')}],
    barcode: '${product.barcode}',
    ${imageUrlField},
    ${manualScoreField}
    ${commentsField ? `,${commentsField}` : ''}
  }`;
};

export const downloadProductsFile = (products: Product[]) => {
  const code = exportProductsToCode(products);
  const blob = new Blob([code], { type: 'text/typescript' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'products.ts';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const copySingleProductCode = (product: Product): Promise<boolean> => {
  const code = exportSingleProductToCode(product);

  // Check if clipboard API is available
  if (!navigator.clipboard) {
    console.warn('Clipboard API not available, using fallback');
    return fallbackCopy(code);
  }

  return navigator.clipboard.writeText(code).then(() => {
    console.log('Product code copied to clipboard!');
    return true;
  }).catch(err => {
    console.error('Failed to copy product code:', err);
    // Fallback to manual copy method
    return fallbackCopy(code);
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
