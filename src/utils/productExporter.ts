import { Product } from '@/data/products';

export const exportProductsToCode = (products: Product[]): string => {
  // Convert products array to TypeScript code
  const productsCode = products.map(product => {
    const imageUrlField = product.imageUrl ? `imageUrl: '${product.imageUrl}'` : 'imageUrl: undefined';
    const regionField = product.origin.region ? `region: '${product.origin.region}'` : '';
    const manualScoreField = product.manualScore !== undefined ? `manualScore: ${product.manualScore}` : '';
    
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

export const copySingleProductCode = (product: Product): void => {
  const code = exportSingleProductToCode(product);
  navigator.clipboard.writeText(code).then(() => {
    // Optional: Show success message
    console.log('Product code copied to clipboard!');
  }).catch(err => {
    console.error('Failed to copy product code:', err);
  });
};
