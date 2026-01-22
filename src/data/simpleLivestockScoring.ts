import { Product } from './products';

export interface SimpleLivestockFactors {
  animalSpace: 'excellent' | 'good' | 'poor' | 'terrible';
  animalExecution: 'humane' | 'standard' | 'inhumane';
  animalDiet: 'natural' | 'organic' | 'conventional' | 'processed';
}

// Score mappings for each factor
const factorScores: { [key: string]: { [value: string]: number } } = {
  animalSpace: {
    'excellent': 95,
    'good': 75,
    'poor': 40,
    'terrible': 15,
  },
  animalExecution: {
    'humane': 90,
    'standard': 60,
    'inhumane': 20,
  },
  animalDiet: {
    'natural': 85,
    'organic': 80,
    'conventional': 45,
    'processed': 25,
  },
};

// Factor weights (sum to 100)
const factorWeights = {
  animalSpace: 35, // 35% weight
  animalExecution: 35, // 35% weight
  animalDiet: 30, // 30% weight
};

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
  let totalScore = 0;
  
  // Calculate weighted score for each factor
  Object.keys(factorWeights).forEach(factor => {
    const weight = factorWeights[factor as keyof typeof factorWeights];
    const factorKey = factor as keyof typeof factorScores;
    const factorValue = factors[factorKey] as string;
    const factorScore = factorScores[factorKey]?.[factorValue] || 50; // Default to 50 if unknown
    
    totalScore += (factorScore * weight) / 100;
  });
  
  // Add standard scoring factors (30% of total)
  let standardScore = 100;
  
  // Labor risk penalty
  if (product.laborRisk === 'high') standardScore -= 50;
  else if (product.laborRisk === 'medium') standardScore -= 20;
  
  // Transport distance penalty
  if (product.transportDistance > 10000) standardScore -= 35;
  else if (product.transportDistance > 5000) standardScore -= 20;
  else if (product.transportDistance > 2000) standardScore -= 5;
  
  // Carbon footprint penalty
  if (product.carbonFootprint > 50) standardScore -= 30;
  else if (product.carbonFootprint > 20) standardScore -= 20;
  else if (product.carbonFootprint > 10) standardScore -= 10;
  
  // Certification bonus
  standardScore += Math.min(product.certifications.length * 5, 15);
  
  totalScore += (standardScore * 0.3); // 30% weight for standard factors
  
  return Math.max(0, Math.min(100, Math.round(totalScore)));
}

// Import the original calculateScore function for non-livestock products
import { calculateScore } from './products';
