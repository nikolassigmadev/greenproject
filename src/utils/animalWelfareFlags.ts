/**
 * Animal Welfare Flags Utility
 * Flags products from companies with poor animal welfare records
 */

import { getPoorAnimalWelfareCompany, type PoorAnimalWelfareCompany } from '@/data/poorAnimalWelfareCompanies';

export interface AnimalWelfareFlag {
  isFlagged: boolean;
  company?: PoorAnimalWelfareCompany;
  severity?: 'critical' | 'high' | 'moderate';
  message: string;
}

/**
 * Check if a product should be flagged for poor animal welfare practices
 * @param brand - Product brand name
 * @returns Flag information
 */
export function checkAnimalWelfareFlag(brand: string | null | undefined): AnimalWelfareFlag {
  if (!brand) {
    return {
      isFlagged: false,
      message: 'No brand information available',
    };
  }

  const company = getPoorAnimalWelfareCompany(brand);

  if (!company) {
    return {
      isFlagged: false,
      message: 'No animal welfare concerns on record',
    };
  }

  return {
    isFlagged: true,
    company,
    severity: company.severity,
    message: `${company.companyName} has poor animal welfare practices (BBFAW Tier ${company.bbfawTier})`,
  };
}

/**
 * Get emoji badge for animal welfare flag
 * @param severity - Severity level
 * @returns Emoji string
 */
export function getAnimalWelfareFlagEmoji(severity: 'critical' | 'high' | 'moderate' | undefined): string {
  switch (severity) {
    case 'critical':
      return '🚨';
    case 'high':
      return '⚠️';
    case 'moderate':
      return '⚡';
    default:
      return '⚠️';
  }
}

/**
 * Get color for animal welfare flag badge
 * @param severity - Severity level
 * @returns HSL color string
 */
export function getAnimalWelfareFlagColor(severity: 'critical' | 'high' | 'moderate' | undefined): string {
  switch (severity) {
    case 'critical':
      return 'hsl(0 70% 50%)'; // Red
    case 'high':
      return 'hsl(25 80% 50%)'; // Orange
    case 'moderate':
      return 'hsl(45 93% 47%)'; // Yellow
    default:
      return 'hsl(0 70% 50%)';
  }
}

/**
 * Reduce animal welfare score based on flag severity
 * Used in product verdict scoring
 * @param baseScore - Base animal welfare score (0-100)
 * @param severity - Flag severity
 * @returns Adjusted score (0-100)
 */
export function adjustScoreForAnimalWelfareFlag(baseScore: number, severity: 'critical' | 'high' | 'moderate' | undefined): number {
  if (!severity) return baseScore;

  switch (severity) {
    case 'critical':
      return Math.max(0, baseScore - 40); // Severe penalty
    case 'high':
      return Math.max(0, baseScore - 25); // Moderate penalty
    case 'moderate':
      return Math.max(0, baseScore - 15); // Light penalty
    default:
      return baseScore;
  }
}
