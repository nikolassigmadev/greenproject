import { Product } from './products';

export interface SimpleLivestockFactors {
  animalSpace: 'excellent' | 'good' | 'poor' | 'terrible';
  animalExecution: 'humane' | 'standard' | 'inhumane';
  animalDiet: 'natural' | 'organic' | 'conventional' | 'processed';
}

// Extract simple livestock factors from product materials
export function extractSimpleLivestockFactors(product: Product): SimpleLivestockFactors {
  const materials = product.materials.map(m => m.toLowerCase());
  
  // Extract animal space
  let animalSpace: SimpleLivestockFactors['animalSpace'] = 'poor';
  if (materials.some(m => m.includes('excellent space') || m.includes('ample space'))) {
    animalSpace = 'excellent';
  } else if (materials.some(m => m.includes('good space') || m.includes('adequate space'))) {
    animalSpace = 'good';
  } else if (materials.some(m => m.includes('limited space') || m.includes('crowded'))) {
    animalSpace = 'poor';
  } else if (materials.some(m => m.includes('overcrowded') || m.includes('terrible space'))) {
    animalSpace = 'terrible';
  }
  
  // Extract animal execution
  let animalExecution: SimpleLivestockFactors['animalExecution'] = 'standard';
  if (materials.some(m => m.includes('humane execution') || m.includes('humane certified'))) {
    animalExecution = 'humane';
  } else if (materials.some(m => m.includes('inhumane') || m.includes('poor welfare'))) {
    animalExecution = 'inhumane';
  }
  
  // Extract animal diet
  let animalDiet: SimpleLivestockFactors['animalDiet'] = 'conventional';
  if (materials.some(m => m.includes('natural diet') || m.includes('species-appropriate'))) {
    animalDiet = 'natural';
  } else if (materials.some(m => m.includes('organic diet') || m.includes('organic certified'))) {
    animalDiet = 'organic';
  } else if (materials.some(m => m.includes('processed') || m.includes('industrial'))) {
    animalDiet = 'processed';
  }
  
  return {
    animalSpace,
    animalExecution,
    animalDiet,
  };
}

// Calculate simple livestock score
export function calculateSimpleLivestockScore(product: Product): number {
  if (!product.category.includes('Meat') && 
      !product.category.includes('Dairy') && 
      !product.category.includes('Eggs')) {
    return calculateScore(product); // Use standard scoring for non-livestock products
  }
  
  const factors = extractSimpleLivestockFactors(product);
  
  // Start with base score of 50 for meat, dairy, and eggs
  let totalScore = 50;
  
  // Labor risk adjustments
  if (product.laborRisk === 'high') totalScore -= 10;
  else if (product.laborRisk === 'medium') totalScore -= 5;
  else if (product.laborRisk === 'low') totalScore += 5;
  
  // Animal space adjustments
  if (factors.animalSpace === 'excellent') totalScore += 20;
  else if (factors.animalSpace === 'good') totalScore += 10;
  else if (factors.animalSpace === 'poor') totalScore -= 10;
  else if (factors.animalSpace === 'terrible') totalScore -= 20;
  
  // Animal execution adjustments
  if (factors.animalExecution === 'humane') totalScore += 15;
  else if (factors.animalExecution === 'standard') totalScore += 0; // No change
  else if (factors.animalExecution === 'inhumane') totalScore -= 15;
  
  // Animal diet adjustments
  if (factors.animalDiet === 'natural') totalScore += 15;
  else if (factors.animalDiet === 'organic') totalScore += 10;
  else if (factors.animalDiet === 'conventional') totalScore -= 5;
  else if (factors.animalDiet === 'processed') totalScore -= 15;
  
  // Certification adjustments (3 points each)
  totalScore += product.certifications.length * 3;
  
  return Math.max(0, Math.min(100, Math.round(totalScore)));
}

// Import the original calculateScore function for non-livestock products
import { calculateScore } from './products';
