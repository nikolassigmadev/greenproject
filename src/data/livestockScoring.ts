import { Product } from './products';

// Livestock-specific scoring algorithm for meat, dairy, and eggs
// Based on scientific research on animal welfare and environmental impact

export interface LivestockFactors {
  // Animal Welfare Factors
  housingType: 'free-range' | 'pasture-raised' | 'caged' | 'factory-farmed' | 'intensive' | 'extensive';
  feedType: 'grass-fed' | 'organic-feed' | 'conventional-feed' | 'grain-fed' | 'mixed-feed';
  antibioticsUse: 'no-antibiotics' | 'therapeutic-only' | 'routine-use' | 'growth-promoters';
  hormonesUse: 'no-hormones' | 'natural-hormones' | 'synthetic-hormones';
  slaughterMethod: 'humane-certified' | 'standard' | 'unknown';
  spacePerAnimal: 'high' | 'adequate' | 'crowded' | 'overcrowded';
  
  // Environmental Factors
  landUse: 'low' | 'medium' | 'high' | 'very-high'; // hectares per kg of product
  waterUsage: 'low' | 'medium' | 'high' | 'very-high'; // liters per kg of product
  methaneEmissions: 'low' | 'medium' | 'high' | 'very-high'; // kg CO2e per kg of product
  biodiversityImpact: 'positive' | 'neutral' | 'negative' | 'severe-negative';
  deforestationRisk: 'none' | 'low' | 'medium' | 'high';
  
  // Certifications (weighted by credibility)
  certifications: string[];
}

// Certification weights based on rigor and verification (increased by 3 points each)
const certificationWeights: { [key: string]: number } = {
  'Certified Humane': 11,
  'Animal Welfare Approved': 13,
  'Global Animal Partnership (GAP) 5+': 12,
  'Global Animal Partnership (GAP) 4': 10,
  'Global Animal Partnership (GAP) 3': 8,
  'Global Animal Partnership (GAP) 2': 6,
  'Global Animal Partnership (GAP) 1': 4,
  'USDA Organic': 9,
  'EU Organic': 10,
  'Pasture for Life': 12,
  'Regenerative Organic Certified': 13,
  'Demeter Biodynamic': 12,
  'MSC Certified': 11, // for seafood
  'Sustainable Seafood': 9,
  'Non-GMO': 6,
  'Grass-fed Certified': 10,
  'Free-Range Certified': 8,
  'Carbon Neutral': 7,
  'Fair Trade': 8,
};

// Factor scoring weights (sum to 100)
const factorWeights = {
  // Animal Welfare (60%)
  housingType: 15,
  feedType: 12,
  antibioticsUse: 10,
  hormonesUse: 8,
  slaughterMethod: 7,
  spacePerAnimal: 8,
  
  // Environmental (20%)
  landUse: 6,
  waterUsage: 4,
  methaneEmissions: 6,
  biodiversityImpact: 4,
  
  // Certifications (20%) - Increased weight for more impact
  certifications: 20,
};

// Score mappings for each factor
const factorScores: { [key: string]: { [value: string]: number } } = {
  housingType: {
    'free-range': 90,
    'pasture-raised': 95,
    'caged': 20,
    'factory-farmed': 15,
    'intensive': 25,
    'extensive': 85,
  },
  feedType: {
    'grass-fed': 85,
    'organic-feed': 80,
    'conventional-feed': 40,
    'grain-fed': 35,
    'mixed-feed': 60,
  },
  antibioticsUse: {
    'no-antibiotics': 90,
    'therapeutic-only': 70,
    'routine-use': 30,
    'growth-promoters': 15,
  },
  hormonesUse: {
    'no-hormones': 85,
    'natural-hormones': 60,
    'synthetic-hormones': 20,
  },
  slaughterMethod: {
    'humane-certified': 85,
    'standard': 50,
    'unknown': 40,
  },
  spacePerAnimal: {
    'high': 91,
    'adequate': 70,
    'crowded': 35,
    'overcrowded': 15,
  },
  landUse: {
    'low': 85,
    'medium': 65,
    'high': 40,
    'very-high': 20,
  },
  waterUsage: {
    'low': 85,
    'medium': 70,
    'high': 45,
    'very-high': 25,
  },
  methaneEmissions: {
    'low': 85,
    'medium': 65,
    'high': 40,
    'very-high': 20,
  },
  biodiversityImpact: {
    'positive': 90,
    'neutral': 60,
    'negative': 35,
    'severe-negative': 15,
  },
  deforestationRisk: {
    'none': 90,
    'low': 75,
    'medium': 50,
    'high': 25,
  },
};

// Extract livestock factors from product materials and certifications
export function extractLivestockFactors(product: Product): LivestockFactors {
  const materials = product.materials.map(m => m.toLowerCase());
  const certifications = product.certifications.map(c => c.toLowerCase());
  
  // Extract animal type from materials
  let animalType: 'beef' | 'pork' | 'chicken' | 'turkey' | 'lamb' | 'salmon' | 'other' = 'other';
  if (materials.some(m => m.includes('beef') || m.includes('cow'))) animalType = 'beef';
  else if (materials.some(m => m.includes('pork') || m.includes('pig'))) animalType = 'pork';
  else if (materials.some(m => m.includes('chicken') || m.includes('poultry'))) animalType = 'chicken';
  else if (materials.some(m => m.includes('turkey'))) animalType = 'turkey';
  else if (materials.some(m => m.includes('lamb') || m.includes('sheep'))) animalType = 'lamb';
  else if (materials.some(m => m.includes('salmon') || m.includes('fish'))) animalType = 'salmon';
  
  // Extract housing type
  let housingType: LivestockFactors['housingType'] = 'factory-farmed';
  if (materials.some(m => m.includes('free-range') || m.includes('free range'))) {
    housingType = 'free-range';
  } else if (materials.some(m => m.includes('pasture-raised') || m.includes('pasture raised'))) {
    housingType = 'pasture-raised';
  } else if (materials.some(m => m.includes('caged'))) {
    housingType = 'caged';
  } else if (materials.some(m => m.includes('intensive'))) {
    housingType = 'intensive';
  } else if (materials.some(m => m.includes('extensive'))) {
    housingType = 'extensive';
  } else if (certifications.some(c => c.includes('free-range') || c.includes('pasture'))) {
    housingType = 'free-range';
  }
  
  // Extract feed type
  let feedType: LivestockFactors['feedType'] = 'conventional-feed';
  if (materials.some(m => m.includes('grass-fed') || m.includes('grass fed'))) {
    feedType = 'grass-fed';
  } else if (materials.some(m => m.includes('organic'))) {
    feedType = 'organic-feed';
  } else if (materials.some(m => m.includes('grain-fed') || m.includes('grain fed'))) {
    feedType = 'grain-fed';
  } else if (certifications.some(c => c.includes('grass-fed'))) {
    feedType = 'grass-fed';
  } else if (certifications.some(c => c.includes('organic'))) {
    feedType = 'organic-feed';
  }
  
  // Extract antibiotics use
  let antibioticsUse: LivestockFactors['antibioticsUse'] = 'routine-use';
  if (materials.some(m => m.includes('no antibiotics') || m.includes('antibiotic-free'))) {
    antibioticsUse = 'no-antibiotics';
  } else if (certifications.some(c => c.includes('antibiotic-free') || c.includes('no antibiotics'))) {
    antibioticsUse = 'no-antibiotics';
  } else if (certifications.some(c => c.includes('organic'))) {
    antibioticsUse = 'therapeutic-only';
  }
  
  // Extract hormones use
  let hormonesUse: LivestockFactors['hormonesUse'] = 'synthetic-hormones';
  if (materials.some(m => m.includes('no hormones') || m.includes('hormone-free'))) {
    hormonesUse = 'no-hormones';
  } else if (certifications.some(c => c.includes('hormone-free') || c.includes('no hormones'))) {
    hormonesUse = 'no-hormones';
  } else if (certifications.some(c => c.includes('organic'))) {
    hormonesUse = 'no-hormones';
  }
  
  // Extract space per animal
  let spacePerAnimal: LivestockFactors['spacePerAnimal'] = 'crowded';
  if (housingType === 'pasture-raised' || housingType === 'free-range') {
    spacePerAnimal = 'high';
  } else if (housingType === 'extensive') {
    spacePerAnimal = 'adequate';
  } else if (housingType === 'intensive') {
    spacePerAnimal = 'crowded';
  } else if (housingType === 'factory-farmed' || housingType === 'caged') {
    spacePerAnimal = 'overcrowded';
  } else {
    spacePerAnimal = 'crowded'; // Default fallback
  }
  
  // Environmental factors based on origin and production method
  const landUse = determineLandUse(feedType, housingType, product.origin.country);
  const waterUsage = determineWaterUsage(feedType, animalType);
  const methaneEmissions = determineMethaneEmissions(feedType, animalType);
  const biodiversityImpact = determineBiodiversityImpact(housingType, feedType);
  const deforestationRisk = determineDeforestationRisk(product.origin.country, feedType);
  
  return {
    housingType,
    feedType,
    antibioticsUse,
    hormonesUse,
    slaughterMethod: 'standard', // Default, rarely specified
    spacePerAnimal,
    landUse,
    waterUsage,
    methaneEmissions,
    biodiversityImpact,
    deforestationRisk,
    certifications: product.certifications,
  };
}

// Helper functions to determine environmental factors
function determineLandUse(feedType: string, housingType: string, country: string): LivestockFactors['landUse'] {
  if (feedType === 'grass-fed' && housingType === 'pasture-raised') return 'high';
  if (feedType === 'grass-fed') return 'medium';
  if (housingType === 'factory-farmed') return 'low';
  return 'medium';
}

function determineWaterUsage(feedType: string, animalType: string): LivestockFactors['waterUsage'] {
  if (animalType === 'salmon') return 'medium'; // Fish use less water
  if (feedType === 'grass-fed') return 'medium';
  return 'high';
}

function determineMethaneEmissions(feedType: string, animalType: string): LivestockFactors['methaneEmissions'] {
  if (animalType === 'salmon' || animalType === 'chicken' || animalType === 'turkey') {
    return feedType === 'organic-feed' ? 'low' : 'medium'; // Poultry and fish have lower emissions
  }
  if (animalType === 'beef' || animalType === 'lamb') {
    return feedType === 'grass-fed' ? 'high' : 'medium'; // Ruminants have higher emissions
  }
  return 'medium';
}

function determineBiodiversityImpact(housingType: string, feedType: string): LivestockFactors['biodiversityImpact'] {
  if (housingType === 'pasture-raised' && feedType === 'grass-fed') return 'positive';
  if (housingType === 'free-range') return 'neutral';
  if (housingType === 'factory-farmed') return 'severe-negative';
  return 'negative';
}

function determineDeforestationRisk(country: string, feedType: string): LivestockFactors['deforestationRisk'] {
  const highRiskCountries = ['brazil', 'argentina', 'paraguay', 'bolivia', 'indonesia', 'malaysia'];
  const mediumRiskCountries = ['mexico', 'colombia', 'peru', 'venezuela'];
  
  if (highRiskCountries.includes(country.toLowerCase())) {
    return feedType === 'grass-fed' ? 'high' : 'medium';
  }
  if (mediumRiskCountries.includes(country.toLowerCase())) {
    return 'low';
  }
  return 'none';
}

// Calculate livestock-specific score
export function calculateLivestockScore(product: Product): number {
  if (!product.category.includes('Meat') && 
      !product.category.includes('Dairy') && 
      !product.category.includes('Eggs')) {
    return calculateScore(product); // Use standard scoring for non-livestock products
  }
  
  const factors = extractLivestockFactors(product);
  let totalScore = 0;
  
  // Calculate weighted score for livestock factors (70% of total)
  Object.keys(factorWeights).forEach(factor => {
    const weight = factorWeights[factor as keyof typeof factorWeights];
    let factorScore = 0;
    
    if (factor === 'certifications') {
      // Calculate certification score
      factorScore = factors.certifications.reduce((certScore, cert) => {
        const certWeight = certificationWeights[cert] || 0;
        return certScore + certWeight; // No cap - allow stacking
      }, 0);
    } else {
      // Get score for factor value
      const factorKey = factor as keyof typeof factorScores;
      const factorValue = factors[factorKey as keyof LivestockFactors] as string;
      factorScore = factorScores[factorKey]?.[factorValue] || 65; // Default to 65 if unknown
    }
    
    totalScore += (factorScore * weight) / 100; // Full weight for livestock factors
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
  
  // Certification bonus (for non-livestock certifications)
  const livestockCertifications = ['Animal Welfare Approved', 'Certified Humane', 'Global Animal Partnership', 'USDA Organic', 'Grass-fed Certified', 'MSC Certified', 'Sustainable Seafood'];
  const nonLivestockCerts = product.certifications.filter(cert => 
    !livestockCertifications.some(livestockCert => cert.includes(livestockCert))
  );
  standardScore += Math.min(nonLivestockCerts.length * 5, 15);
  
  totalScore += (standardScore * 0.3); // 30% weight for standard factors
  
  return Math.max(0, Math.min(100, Math.round(totalScore)));
}

// Import the original calculateScore function for non-livestock products
import { calculateScore } from './products';
