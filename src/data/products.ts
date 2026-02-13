// Product Database - Add products here with their details
// The app will automatically calculate scores based on the data provided

import { loadProducts } from '@/utils/storage';
import { calculateSimpleLivestockScore } from './simpleLivestockScoring';
import { getScoreBreakdown } from './scoreBreakdown';

export interface Product {
  id: string; // Format: #p0001
  name: string;
  brand: string;
  category: string;
  origin?: {
    country: string;
    region?: string;
  };
  materials: string[]; // e.g., ['Organic Cotton', 'Recycled Polyester']
  laborRisk?: 'low' | 'medium' | 'high'; // Optional for backward compatibility
  transportDistance: number; // km from origin to user (estimated)
  certifications: string[]; // e.g., Fair Trade, Organic, B-Corp
  carbonFootprint: number; // kg CO2 equivalent
  imageUrl?: string;
  barcode?: string;
  keywords: string[]; // For finding alternatives
  manualScore?: number; // Optional manual score override (0-100)
  comments?: string; // Comments that appear on the product page
  
  // New detailed scoring fields
  laborViolations?: string;
  laborBonuses?: string[];
  laborManualPoints?: number; // Manual override for labor scoring (0-35)
  animalWelfareConditions?: string;
  animalWelfareItems?: string[];
  animalWelfareManualPoints?: number; // Manual override for animal welfare (0-30)
  transportMode?: string;
  transportManualPoints?: number; // Manual override for transportation (0-10)
  certificationManualPoints?: number; // Manual override for certifications (0-10)
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
  
  // Use the new ethical scoring system
  const breakdown = getScoreBreakdown(product);
  return breakdown.finalScore;
}

// Get score rating label
export function getScoreRating(score: number): { label: string; color: string } {
  if (score >= 90) return { label: 'EXCELLENT', color: 'text-emerald-600' };
  if (score >= 75) return { label: 'GOOD', color: 'text-lime-600' };
  if (score >= 60) return { label: 'FAIR', color: 'text-amber-600' };
  if (score >= 40) return { label: 'POOR', color: 'text-orange-600' };
  return { label: 'CRITICAL', color: 'text-red-600' };
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
    name: 'Aqua',
    brand: 'Danone',
    category: 'Drinkware',
    origin: { country: 'Indonesia', region: ' Bali' },
    materials: ['Standard Production'],
    laborRisk: 'high',
    transportDistance: 2000,
    certifications: [],
    carbonFootprint: 8.4,
    keywords: [],
    barcode: '',
    imageUrl: 'https://www.shutterstock.com/image-photo/jakarta-indonesia-july-27th-2024-600nw-2494710323.jpg',
    
    
  }


];


// Export products that always uses the file data
export const products: Product[] = defaultProducts;
