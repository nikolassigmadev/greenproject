// Product Database - Add products here with their details
// The app will automatically calculate scores based on the data provided

import { loadProducts } from '@/utils/storage';
import { calculateSimpleLivestockScore } from './simpleLivestockScoring';

export interface Product {
  id: string; // Format: #p0001
  name: string;
  brand: string;
  category: string;
  origin: {
    country: string;
    region?: string;
  };
  materials: string[]; // e.g., ['Organic Cotton', 'Recycled Polyester']
  laborRisk: 'low' | 'medium' | 'high';
  transportDistance: number; // km from origin to user (estimated)
  certifications: string[]; // e.g., Fair Trade, Organic, B-Corp
  carbonFootprint: number; // kg CO2 equivalent
  imageUrl?: string;
  barcode?: string;
  keywords: string[]; // For finding alternatives
  manualScore?: number; // Optional manual score override (0-100)
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const getMaterialsImpact = (materials: string[]) => {
  const normalized = materials.map((m) => m.toLowerCase());

  let points = 0;

  const hasAny = (terms: string[]) => normalized.some((m) => terms.some((t) => m.includes(t)));

  if (hasAny(["recycled", "ocean plastic"])) points += 6;
  if (hasAny(["organic", "plant-based", "bamboo", "cork"])) points += 5;
  if (hasAny(["stainless steel", "glass"])) points += 3;
  if (hasAny(["plastic-free", "compostable"])) points += 4;

  if (hasAny(["virgin plastic"])) points -= 8;
  if (hasAny(["plastic", "pet"])) points -= 5;
  if (hasAny(["polyester", "synthetic", "nylon"])) points -= 4;
  if (hasAny(["artificial", "preservatives", "food coloring"])) points -= 3;

  return clamp(points, -15, 15);
};

// Helper function to calculate overall sustainability score (0-100)
export function calculateScore(product: Product): number {
  // If manual score is set, use that instead of calculating
  if (product.manualScore !== undefined && product.manualScore >= 0 && product.manualScore <= 100) {
    return product.manualScore;
  }
  
  // Use simple livestock scoring for meat, dairy, and eggs
  if (product.category.includes('Meat') || 
      product.category.includes('Dairy') || 
      product.category.includes('Eggs')) {
    return calculateSimpleLivestockScore(product);
  }
  
  // Use standard scoring for other products
  let score = 100;

  // Labor risk penalty
  if (product.laborRisk === 'high') score -= 50;
  else if (product.laborRisk === 'medium') score -= 20;

  // Carbon footprint penalty (higher = worse)
  if (product.carbonFootprint > 50) score -= 30;
  else if (product.carbonFootprint > 20) score -= 20;
  else if (product.carbonFootprint > 10) score -= 10;

  // Transport distance penalty
  if (product.transportDistance > 10000) score -= 35;
  else if (product.transportDistance > 5000) score -= 20;
  else if (product.transportDistance > 2000) score -= 5;

  score += getMaterialsImpact(product.materials);

  // Certification bonus
  score += Math.min(product.certifications.length * 5, 15);

  return Math.max(0, Math.min(100, score));
}

// Get score rating label
export function getScoreRating(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent', color: 'text-emerald-600' };
  if (score >= 60) return { label: 'Good', color: 'text-lime-600' };
  if (score >= 40) return { label: 'Fair', color: 'text-amber-600' };
  if (score >= 20) return { label: 'Poor', color: 'text-orange-600' };
  return { label: 'Critical', color: 'text-red-600' };
}

// Find alternative products based on keywords and category
export function findAlternatives(product: Product, allProducts: Product[]): Product[] {
  return allProducts
    .filter(p => p.id !== product.id)
    .filter(p => 
      p.category === product.category ||
      p.keywords.some(k => product.keywords.includes(k))
    )
    .map(p => ({ product: p, score: calculateScore(p) }))
    .filter(({ score }) => score > calculateScore(product))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ product }) => product);
}

// ==========================================
// PRODUCT DATABASE - ADD YOUR PRODUCTS HERE
// ==========================================

export const defaultProducts: Product[] = [
  {
    id: '#p0001',
    name: 'Organic Cotton T-Shirt',
    brand: 'EcoWear',
    category: 'Clothing',
    origin: { country: 'Portugal', region: 'Porto' },
    materials: ['Organic Cotton', 'Natural Dyes'],
    laborRisk: 'low',
    transportDistance: 5500,
    certifications: ['GOTS Certified', 'Fair Trade', 'B-Corp'],
    carbonFootprint: 8.5,
    keywords: ['shirt', 'tshirt', 'cotton', 'apparel', 'top'],
    barcode: '1234567890123',
  },
  {
    id: '#p0002',
    name: 'Fast Fashion Basic Tee',
    brand: 'QuickStyle',
    category: 'Clothing',
    origin: { country: 'Bangladesh', region: 'Dhaka' },
    materials: ['Polyester', 'Cotton Blend'],
    laborRisk: 'high',
    transportDistance: 12000,
    certifications: [],
    carbonFootprint: 35,
    keywords: ['shirt', 'tshirt', 'cotton', 'apparel', 'top'],
    barcode: '2345678901234',
  },
  {
    id: '#p0003',
    name: 'Recycled Plastic Water Bottle',
    brand: 'GreenSip',
    category: 'Drinkware',
    origin: { country: 'USA', region: 'California' },
    materials: ['Recycled Ocean Plastic', 'Stainless Steel'],
    laborRisk: 'low',
    transportDistance: 2000,
    certifications: ['Ocean Bound Plastic', '1% for the Planet'],
    carbonFootprint: 4.2,
    keywords: ['bottle', 'water', 'drinkware', 'reusable'],
    barcode: '3456789012345',
  },
  {
    id: '#p0004',
    name: 'Single-Use Plastic Bottles (24 pack)',
    brand: 'AquaClear',
    category: 'Drinkware',
    origin: { country: 'China', region: 'Guangdong' },
    materials: ['Virgin Plastic', 'PET'],
    laborRisk: 'medium',
    transportDistance: 11000,
    certifications: [],
    carbonFootprint: 52,
    keywords: ['bottle', 'water', 'drinkware', 'plastic'],
    barcode: '4567890123456',
  },
  {
    id: '#p0005',
    name: 'Fair Trade Coffee Beans',
    brand: 'Ethical Roast',
    category: 'Food & Beverage',
    origin: { country: 'Colombia', region: 'Huila' },
    materials: ['Arabica Coffee Beans'],
    laborRisk: 'low',
    transportDistance: 4500,
    certifications: ['Fair Trade', 'Rainforest Alliance', 'Organic'],
    carbonFootprint: 6.8,
    keywords: ['coffee', 'beans', 'beverage', 'drink'],
    barcode: '5678901234567',
  },
  {
    id: '#p0006',
    name: 'Conventional Coffee Instant',
    brand: 'MegaBrew',
    category: 'Food & Beverage',
    origin: { country: 'Vietnam', region: 'Central Highlands' },
    materials: ['Robusta Coffee', 'Preservatives'],
    laborRisk: 'high',
    transportDistance: 13000,
    certifications: [],
    carbonFootprint: 28,
    keywords: ['coffee', 'instant', 'beverage', 'drink'],
    barcode: '6789012345678',
  },
  {
    id: '#p0007',
    name: 'Bamboo Toothbrush Set',
    brand: 'NatureBrush',
    category: 'Personal Care',
    origin: { country: 'Germany', region: 'Bavaria' },
    materials: ['Bamboo', 'Plant-Based Bristles'],
    laborRisk: 'low',
    transportDistance: 6000,
    certifications: ['Vegan', 'Plastic-Free', 'FSC Certified'],
    carbonFootprint: 2.1,
    keywords: ['toothbrush', 'dental', 'hygiene', 'bathroom'],
    barcode: '7890123456789',
  },
  {
    id: '#p0008',
    name: 'Plastic Toothbrush Multi-Pack',
    brand: 'DentaValue',
    category: 'Personal Care',
    origin: { country: 'India', region: 'Gujarat' },
    materials: ['Plastic', 'Nylon Bristles', 'Rubber Grip'],
    laborRisk: 'medium',
    transportDistance: 11500,
    certifications: [],
    carbonFootprint: 18,
    keywords: ['toothbrush', 'dental', 'hygiene', 'bathroom'],
    barcode: '8901234567890',
  },
  {
    id: '#p0009',
    name: 'Sustainable Sneakers',
    brand: 'EarthStep',
    category: 'Footwear',
    origin: { country: 'Italy', region: 'Tuscany' },
    materials: ['Recycled Rubber', 'Organic Canvas', 'Cork Insole'],
    laborRisk: 'low',
    transportDistance: 6500,
    certifications: ['B-Corp', 'Climate Neutral', 'Vegan'],
    carbonFootprint: 12,
    keywords: ['shoes', 'sneakers', 'footwear', 'athletic'],
    barcode: '9012345678901',
  },
  {
    id: '#p0010',
    name: 'Budget Athletic Shoes',
    brand: 'SportMax',
    category: 'Footwear',
    origin: { country: 'Indonesia', region: 'Java' },
    materials: ['Synthetic Leather', 'Foam', 'Rubber'],
    laborRisk: 'high',
    transportDistance: 14000,
    certifications: [],
    carbonFootprint: 45,
    keywords: ['shoes', 'sneakers', 'footwear', 'athletic'],
    barcode: '0123456789012',
  },
  {
    id: '#p0011',
    name: 'Organic Free-Range Eggs',
    brand: 'HappyHens',
    category: 'Meat, Dairy & Eggs',
    origin: { country: 'USA', region: 'California' },
    materials: ['Free-Range', 'Organic Feed', 'No Antibiotics', 'Hormone-Free', 'Adequate Space'],
    laborRisk: 'low',
    transportDistance: 800,
    certifications: ['USDA Organic', 'Certified Humane', 'Non-GMO', 'Animal Welfare Approved'],
    carbonFootprint: 3.2,
    keywords: ['eggs', 'dairy', 'breakfast', 'protein'],
    barcode: '1234567890124',
  },
  {
    id: '#p0012',
    name: 'Factory-Farmed Eggs',
    brand: 'EggCorp',
    category: 'Meat, Dairy & Eggs',
    origin: { country: 'China', region: 'Guangdong' },
    materials: ['Caged', 'Conventional Feed', 'Routine Antibiotics', 'Overcrowded'],
    laborRisk: 'high',
    transportDistance: 11000,
    certifications: [],
    carbonFootprint: 8.5,
    keywords: ['eggs', 'dairy', 'breakfast', 'protein'],
    barcode: '2345678901235',
  },
  {
    id: '#p0013',
    name: 'Grass-Fed Organic Beef',
    brand: 'GreenPastures',
    category: 'Meat, Dairy & Eggs',
    origin: { country: 'New Zealand', region: 'Waikato' },
    materials: ['Grass-fed', 'Organic', 'No Antibiotics', 'No Hormones', 'Pasture-raised', 'Humane Certified'],
    laborRisk: 'low',
    transportDistance: 7500,
    certifications: ['Organic', 'Grass-fed Certified', 'Animal Welfare Approved', 'Certified Humane'],
    carbonFootprint: 22,
    keywords: ['beef', 'meat', 'protein', 'steak'],
    barcode: '3456789012346',
  },
  {
    id: '#p0014',
    name: 'Conventional Ground Beef',
    brand: 'MegaMeat',
    category: 'Meat, Dairy & Eggs',
    origin: { country: 'Brazil', region: 'Mato Grosso' },
    materials: ['Grain-fed', 'Conventional', 'Routine Antibiotics', 'Growth Hormones', 'Factory-farmed'],
    laborRisk: 'high',
    transportDistance: 9000,
    certifications: [],
    carbonFootprint: 38,
    keywords: ['beef', 'meat', 'protein', 'ground'],
    barcode: '4567890123457',
  },
  {
    id: '#p0015',
    name: 'Organic Whole Milk',
    brand: 'PureDairy',
    category: 'Meat, Dairy & Eggs',
    origin: { country: 'USA', region: 'Wisconsin' },
    materials: ['Organic Milk', 'Pasture-raised', 'No Antibiotics', 'No Hormones', 'Organic Feed'],
    laborRisk: 'low',
    transportDistance: 1200,
    certifications: ['USDA Organic', 'Non-GMO', 'Pasture-raised', 'Certified Humane'],
    carbonFootprint: 4.8,
    keywords: ['milk', 'dairy', 'beverage', 'calcium'],
    barcode: '5678901234568',
  },
  {
    id: '#p0016',
    name: 'Smartphone Eco Edition',
    brand: 'GreenTech',
    category: 'Electronics & Appliances',
    origin: { country: 'Sweden', region: 'Stockholm' },
    materials: ['Recycled Aluminum', 'Fair-trade Minerals', 'Bioplastic'],
    laborRisk: 'low',
    transportDistance: 4500,
    certifications: ['EPEAT Gold', 'Fair Trade Certified', 'Carbon Neutral'],
    carbonFootprint: 65,
    keywords: ['phone', 'smartphone', 'electronics', 'mobile'],
    barcode: '6789012345679',
  },
  {
    id: '#p0017',
    name: 'Budget Smartphone',
    brand: 'TechMax',
    category: 'Electronics & Appliances',
    origin: { country: 'China', region: 'Shenzhen' },
    materials: ['Plastic', 'Virgin Aluminum', 'Conflict Minerals'],
    laborRisk: 'high',
    transportDistance: 12000,
    certifications: [],
    carbonFootprint: 95,
    keywords: ['phone', 'smartphone', 'electronics', 'mobile'],
    barcode: '7890123456780',
  },
  {
    id: '#p0018',
    name: 'Energy Efficient Refrigerator',
    brand: 'EcoCool',
    category: 'Electronics & Appliances',
    origin: { country: 'Germany', region: 'Bavaria' },
    materials: ['Recycled Steel', 'Natural Refrigerants', 'LED Lighting'],
    laborRisk: 'low',
    transportDistance: 6500,
    certifications: ['Energy Star', 'EU Energy Label A+++', 'RoHS Compliant'],
    carbonFootprint: 180,
    keywords: ['refrigerator', 'appliance', 'kitchen', 'cooling'],
    barcode: '8901234567891',
  },
  {
    id: '#p0019',
    name: 'Standard TV',
    brand: 'ViewMax',
    category: 'Electronics & Appliances',
    origin: { country: 'South Korea', region: 'Seoul' },
    materials: ['Plastic', 'Glass', 'Virgin Aluminum'],
    laborRisk: 'medium',
    transportDistance: 8500,
    certifications: [],
    carbonFootprint: 120,
    keywords: ['tv', 'television', 'electronics', 'display'],
    barcode: '9012345678902',
  },
  {
    id: '#p0020',
    name: 'Organic Trail Mix',
    brand: 'NatureBites',
    category: 'Snacks & Packaged Foods',
    origin: { country: 'USA', region: 'California' },
    materials: ['Organic Nuts', 'Dried Fruit', 'Dark Chocolate'],
    laborRisk: 'low',
    transportDistance: 1500,
    certifications: ['USDA Organic', 'Non-GMO', 'Fair Trade'],
    carbonFootprint: 2.8,
    keywords: ['snack', 'trail mix', 'nuts', 'healthy'],
    barcode: '0123456789013',
  },
  {
    id: '#p0021',
    name: 'Potato Chips Family Pack',
    brand: 'CrunchTime',
    category: 'Snacks & Packaged Foods',
    origin: { country: 'USA', region: 'Texas' },
    materials: ['Potatoes', 'Vegetable Oil', 'Salt'],
    laborRisk: 'medium',
    transportDistance: 2500,
    certifications: [],
    carbonFootprint: 4.5,
    keywords: ['chips', 'snack', 'potato', 'crunchy'],
    barcode: '1234567890125',
  },
  {
    id: '#p0022',
    name: 'Organic Granola Bars',
    brand: 'PureEnergy',
    category: 'Snacks & Packaged Foods',
    origin: { country: 'Canada', region: 'British Columbia' },
    materials: ['Organic Oats', 'Honey', 'Nuts', 'Seeds'],
    laborRisk: 'low',
    transportDistance: 3200,
    certifications: ['USDA Organic', 'Non-GMO', 'Gluten-Free'],
    carbonFootprint: 3.2,
    keywords: ['granola', 'bar', 'snack', 'breakfast'],
    barcode: '2345678901236',
  },
  {
    id: '#p0023',
    name: 'Sugary Cereal',
    brand: 'SweetStart',
    category: 'Snacks & Packaged Foods',
    origin: { country: 'Mexico', region: 'Jalisco' },
    materials: ['Corn', 'Sugar', 'Artificial Flavors', 'Preservatives'],
    laborRisk: 'high',
    transportDistance: 3500,
    certifications: [],
    carbonFootprint: 6.8,
    keywords: ['cereal', 'breakfast', 'sweet', 'snack'],
    barcode: '3456789012347',
  },
  {
    id: '#p0024',
    name: 'Wild-Caught Salmon',
    brand: 'OceanFresh',
    category: 'Meat, Dairy & Eggs',
    origin: { country: 'Norway', region: 'Bergen' },
    materials: ['Wild Salmon', 'Sea Salt'],
    laborRisk: 'low',
    transportDistance: 5500,
    certifications: ['MSC Certified', 'Sustainable Seafood', 'Non-GMO'],
    carbonFootprint: 8.2,
    keywords: ['fish', 'salmon', 'seafood', 'protein', 'omega-3'],
    barcode: '4567890123458',
  },
  {
    id: '#p0025',
    name: 'Farm-Raised Salmon',
    brand: 'AquaFarm',
    category: 'Meat, Dairy & Eggs',
    origin: { country: 'Chile', region: 'Puerto Montt' },
    materials: ['Farm Salmon', 'Fish Feed', 'Antibiotics'],
    laborRisk: 'medium',
    transportDistance: 8500,
    certifications: [],
    carbonFootprint: 12.5,
    keywords: ['fish', 'salmon', 'seafood', 'protein'],
    barcode: '5678901234569',
  },
  {
    id: '#p0026',
    name: 'Organic Greek Yogurt',
    brand: 'PureCulture',
    category: 'Meat, Dairy & Eggs',
    origin: { country: 'Greece', region: 'Thessaly' },
    materials: ['Organic Milk', 'Live Cultures', 'Fruit'],
    laborRisk: 'low',
    transportDistance: 6800,
    certifications: ['USDA Organic', 'Non-GMO', 'Probiotic'],
    carbonFootprint: 5.8,
    keywords: ['yogurt', 'dairy', 'breakfast', 'protein', 'probiotic'],
    barcode: '6789012345670',
  },
  {
    id: '#p0027',
    name: 'Conventional Yogurt',
    brand: 'DairyPlus',
    category: 'Meat, Dairy & Eggs',
    origin: { country: 'USA', region: 'California' },
    materials: ['Conventional Milk', 'Sugar', 'Gelatin', 'Artificial Flavors'],
    laborRisk: 'medium',
    transportDistance: 800,
    certifications: [],
    carbonFootprint: 7.2,
    keywords: ['yogurt', 'dairy', 'breakfast', 'snack'],
    barcode: '7890123456781',
  },
  {
    id: '#p0028',
    name: 'Laptop Eco Pro',
    brand: 'GreenCompute',
    category: 'Electronics & Appliances',
    origin: { country: 'Finland', region: 'Helsinki' },
    materials: ['Recycled Aluminum', 'Conflict-Free Minerals', 'Bioplastic'],
    laborRisk: 'low',
    transportDistance: 7200,
    certifications: ['EPEAT Gold', 'Energy Star', 'Carbon Neutral', 'RoHS'],
    carbonFootprint: 145,
    keywords: ['laptop', 'computer', 'electronics', 'work'],
    barcode: '8901234567892',
  },
  {
    id: '#p0029',
    name: 'Budget Laptop',
    brand: 'ValueTech',
    category: 'Electronics & Appliances',
    origin: { country: 'China', region: 'Shenzhen' },
    materials: ['Plastic', 'Virgin Aluminum', 'Conflict Minerals'],
    laborRisk: 'high',
    transportDistance: 11500,
    certifications: [],
    carbonFootprint: 220,
    keywords: ['laptop', 'computer', 'electronics', 'work'],
    barcode: '9012345678903',
  },
  {
    id: '#p0030',
    name: 'Smart Home Hub',
    brand: 'EcoHome',
    category: 'Electronics & Appliances',
    origin: { country: 'Denmark', region: 'Copenhagen' },
    materials: ['Recycled Plastic', 'Bamboo', 'Low-Power Components'],
    laborRisk: 'low',
    transportDistance: 5800,
    certifications: ['Energy Star', 'FSC Certified', 'Privacy Certified'],
    carbonFootprint: 28,
    keywords: ['smart home', 'iot', 'automation', 'electronics'],
    barcode: '0123456789014',
  },
  {
    id: '#p0031',
    name: 'Wireless Earbuds Sustainable',
    brand: 'EcoSound',
    category: 'Electronics & Appliances',
    origin: { country: 'Netherlands', region: 'Amsterdam' },
    materials: ['Recycled Plastic', 'Bamboo Case', 'Rechargeable Battery'],
    laborRisk: 'low',
    transportDistance: 4800,
    certifications: ['Fair Trade Certified', 'Recycled Materials', 'USB-C'],
    carbonFootprint: 18,
    keywords: ['earbuds', 'audio', 'music', 'wireless'],
    barcode: '1234567890126',
  },
  {
    id: '#p0032',
    name: 'Organic Dark Chocolate',
    brand: 'CacaoEthical',
    category: 'Snacks & Packaged Foods',
    origin: { country: 'Ecuador', region: 'Guayas' },
    materials: ['Organic Cacao', 'Cane Sugar', 'Vanilla'],
    laborRisk: 'low',
    transportDistance: 4200,
    certifications: ['Fair Trade', 'USDA Organic', 'Rainforest Alliance'],
    carbonFootprint: 3.8,
    keywords: ['chocolate', 'candy', 'snack', 'dessert', 'dark chocolate'],
    barcode: '2345678901237',
  },
  {
    id: '#p0033',
    name: 'Candy Bar Multipack',
    brand: 'SweetTreats',
    category: 'Snacks & Packaged Foods',
    origin: { country: 'USA', region: 'Illinois' },
    materials: ['Sugar', 'Corn Syrup', 'Palm Oil', 'Artificial Flavors'],
    laborRisk: 'high',
    transportDistance: 1800,
    certifications: [],
    carbonFootprint: 8.5,
    keywords: ['candy', 'chocolate', 'snack', 'sweet'],
    barcode: '3456789012348',
  },
  {
    id: '#p0034',
    name: 'Organic Popcorn',
    brand: 'NaturalPop',
    category: 'Snacks & Packaged Foods',
    origin: { country: 'USA', region: 'Iowa' },
    materials: ['Organic Corn', 'Sea Salt', 'Coconut Oil'],
    laborRisk: 'low',
    transportDistance: 1200,
    certifications: ['USDA Organic', 'Non-GMO', 'Gluten-Free'],
    carbonFootprint: 2.1,
    keywords: ['popcorn', 'snack', 'movie', 'healthy'],
    barcode: '4567890123459',
  },
  {
    id: '#p0035',
    name: 'Soda Pack',
    brand: 'FizzPop',
    category: 'Snacks & Packaged Foods',
    origin: { country: 'USA', region: 'Georgia' },
    materials: ['Water', 'High Fructose Corn Syrup', 'Artificial Flavors', 'CO2'],
    laborRisk: 'medium',
    transportDistance: 1500,
    certifications: [],
    carbonFootprint: 9.2,
    keywords: ['soda', 'drink', 'beverage', 'carbonated'],
    barcode: '5678901234570',
  },
  {
    id: '#p0036',
    name: 'Free-Range Chicken',
    brand: 'HappyBirds',
    category: 'Meat, Dairy & Eggs',
    origin: { country: 'France', region: 'Brittany' },
    materials: ['Free-Range Chicken', 'Organic Feed'],
    laborRisk: 'low',
    transportDistance: 5200,
    certifications: ['Certified Humane', 'USDA Organic', 'Free-Range'],
    carbonFootprint: 6.8,
    keywords: ['chicken', 'poultry', 'meat', 'protein'],
    barcode: '6789012345671',
  },
  {
    id: '#p0037',
    name: 'Factory Chicken',
    brand: 'ChickenCorp',
    category: 'Meat, Dairy & Eggs',
    origin: { country: 'USA', region: 'Arkansas' },
    materials: ['Factory Chicken', 'Antibiotics', 'Growth Hormones'],
    laborRisk: 'high',
    transportDistance: 900,
    certifications: [],
    carbonFootprint: 11.2,
    keywords: ['chicken', 'poultry', 'meat', 'protein'],
    barcode: '7890123456782',
  },
  {
    id: '#p0038',
    name: 'Tablet Eco Edition',
    brand: 'GreenTab',
    category: 'Electronics & Appliances',
    origin: { country: 'Sweden', region: 'Malmö' },
    materials: ['Recycled Aluminum', 'Conflict-Free Minerals', 'Glass'],
    laborRisk: 'low',
    transportDistance: 6200,
    certifications: ['EPEAT Gold', 'Energy Star', 'Carbon Neutral'],
    carbonFootprint: 95,
    keywords: ['tablet', 'electronics', 'mobile', 'computer'],
    barcode: '8901234567893',
  },
  {
    id: '#p0039',
    name: 'Budget Tablet',
    brand: 'TabMax',
    category: 'Electronics & Appliances',
    origin: { country: 'China', region: 'Guangzhou' },
    materials: ['Plastic', 'Virgin Aluminum', 'Conflict Minerals'],
    laborRisk: 'high',
    transportDistance: 12500,
    certifications: [],
    carbonFootprint: 140,
    keywords: ['tablet', 'electronics', 'mobile', 'computer'],
    barcode: '9012345678904',
  },
  {
    id: '#p0040',
    name: 'Coffee Maker Eco',
    brand: 'BrewGreen',
    category: 'Electronics & Appliances',
    origin: { country: 'Switzerland', region: 'Zurich' },
    materials: ['Recycled Steel', 'Glass', 'Bamboo Accents'],
    laborRisk: 'low',
    transportDistance: 7800,
    certifications: ['Energy Star', 'FSC Certified', 'BPA-Free'],
    carbonFootprint: 35,
    keywords: ['coffee maker', 'appliance', 'kitchen', 'brew'],
    barcode: '0123456789015',
  },
  {
    id: '#p0041',
    name: 'Organic Fruit Snacks',
    brand: 'FruitPure',
    category: 'Snacks & Packaged Foods',
    origin: { country: 'Costa Rica', region: 'San José' },
    materials: ['Organic Fruit', 'Natural Sweeteners', 'Fruit Pectin'],
    laborRisk: 'low',
    transportDistance: 3800,
    certifications: ['USDA Organic', 'Non-GMO', 'Fair Trade'],
    carbonFootprint: 3.5,
    keywords: ['fruit snacks', 'snack', 'healthy', 'organic'],
    barcode: '1234567890127',
  },
  {
    id: '#p0042',
    name: 'Fruit Gummies',
    brand: 'SweetFruit',
    category: 'Snacks & Packaged Foods',
    origin: { country: 'Germany', region: 'Bavaria' },
    materials: ['Sugar', 'Corn Syrup', 'Artificial Flavors', 'Food Coloring'],
    laborRisk: 'medium',
    transportDistance: 6200,
    certifications: [],
    carbonFootprint: 5.8,
    keywords: ['gummies', 'candy', 'snack', 'fruit'],
    barcode: '2345678901238',
  },
  {
    id: '#p0048',
    name: 'Sourpatch',
    brand: 'SweetFruit',
    category: 'Meat, Dairy & Eggs',
    origin: { country: 'Germany', region: 'Bavaria' },
    materials: ['Sugar', 'Corn Syrup', 'Artificial Flavors', 'Food Coloring'],
    laborRisk: 'medium',
    transportDistance: 9000,
    certifications: ['USDA Organic', 'Non-GMO', 'Fair Trade'],
    carbonFootprint: 5.8,
    keywords: ['gummies', 'candy', 'snack', 'fruit'],
    barcode: '2345678901238',
  },
  {
    id: '#p0043',
    name: 'Organic Beef Jerky',
    brand: 'MeatNatural',
    category: 'Snacks & Packaged Foods',
    origin: { country: 'USA', region: 'Montana' },
    materials: ['Organic Beef', 'Sea Salt', 'Spices'],
    laborRisk: 'low',
    transportDistance: 2000,
    certifications: ['USDA Organic', 'Grass-fed', 'No Preservatives'],
    carbonFootprint: 4.2,
    keywords: ['jerky', 'meat', 'snack', 'protein'],
    barcode: '3456789012349',
  },
 {
    id: '#p0049',
    name: 'testets77383',
    brand: 'SweetFruit',
    category: 'Meat, Dairy & Eggs',
    origin: { country: 'Germany', region: 'Bavaria' },
    materials: ['Sugar', 'Corn Syrup', 'Artificial Flavors', 'Food Coloring'],
    laborRisk: 'medium',
    transportDistance: 9000,
    certifications: ['USDA Organic', 'Non-GMO', 'Fair Trade'],
    carbonFootprint: 5.8,
    keywords: ['gummies', 'candy', 'snack', 'fruit'],
    barcode: '2345678901238',
  },
    {
    id: '#p0050',
    name: 'Surfboard',
    brand: 'ALMERIXK',
    category: 'Clothing',
    origin: { country: 'Spain' },
    materials: ['Standard Production'],
    laborRisk: 'low',
    transportDistance: 11000,
    certifications: [],
    carbonFootprint: 1.822,
    keywords: [],
    barcode: '',
    imageUrl: undefined,
    
  }
];


// Export products that always uses the file data
export const products: Product[] = defaultProducts;
