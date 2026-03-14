/**
 * Barcode validation and cleaning utility
 * Supports multiple formats: EAN-13, EAN-8, UPC-A, UPC-E, ISBN
 */

export type BarcodeFormat = 'EAN-13' | 'EAN-8' | 'UPC-A' | 'UPC-E' | 'ISBN-13' | 'ISBN-10' | 'UNKNOWN';

export interface BarcodeValidationResult {
  isValid: boolean;
  format: BarcodeFormat;
  cleaned: string;
  original: string;
  checkDigitValid?: boolean;
}

/**
 * Validates and cleans barcode input
 * Removes common separators and checks format
 */
export function validateAndCleanBarcode(input: string): BarcodeValidationResult {
  if (!input || typeof input !== 'string') {
    return {
      isValid: false,
      format: 'UNKNOWN',
      cleaned: '',
      original: input || '',
    };
  }

  // Remove common separators: spaces, hyphens, dots, commas, slashes
  const cleaned = input.replace(/[\s\-./,]/g, '').trim();

  if (!cleaned) {
    return {
      isValid: false,
      format: 'UNKNOWN',
      cleaned: '',
      original: input,
    };
  }

  // Check format
  if (cleaned.length === 13 && /^\d{13}$/.test(cleaned)) {
    return {
      isValid: true,
      format: 'EAN-13',
      cleaned,
      original: input,
      checkDigitValid: validateEAN13CheckDigit(cleaned),
    };
  }

  if (cleaned.length === 8 && /^\d{8}$/.test(cleaned)) {
    return {
      isValid: true,
      format: 'EAN-8',
      cleaned,
      original: input,
      checkDigitValid: validateEAN8CheckDigit(cleaned),
    };
  }

  if (cleaned.length === 12 && /^\d{12}$/.test(cleaned)) {
    return {
      isValid: true,
      format: 'UPC-A',
      cleaned,
      original: input,
      checkDigitValid: validateUPCACheckDigit(cleaned),
    };
  }

  // ISBN-13 (13 digits starting with 978 or 979)
  if (cleaned.length === 13 && /^97[89]\d{10}$/.test(cleaned)) {
    return {
      isValid: true,
      format: 'ISBN-13',
      cleaned,
      original: input,
    };
  }

  // ISBN-10 (10 digits, last can be X)
  if (cleaned.length === 10 && /^\d{9}[\dX]$/.test(cleaned.toUpperCase())) {
    return {
      isValid: true,
      format: 'ISBN-10',
      cleaned: cleaned.toUpperCase(),
      original: input,
    };
  }

  // UPC-E (8 digits, compressed format)
  if (cleaned.length === 8 && /^\d{8}$/.test(cleaned) && isUPCEFormat(cleaned)) {
    return {
      isValid: true,
      format: 'UPC-E',
      cleaned,
      original: input,
    };
  }

  return {
    isValid: false,
    format: 'UNKNOWN',
    cleaned,
    original: input,
  };
}

/**
 * Returns alternative barcode formats to try
 * Useful for fallback barcode lookup
 */
export function getAlternativeFormats(barcode: string): string[] {
  const cleaned = barcode.replace(/[\s\-./,]/g, '').trim();
  const alternatives: string[] = [];

  // If 13 digits, try 12 (remove check digit or leading zero)
  if (cleaned.length === 13) {
    alternatives.push(cleaned.slice(1)); // Remove leading zero (UPC-A from EAN-13)
    alternatives.push(cleaned.slice(0, 12)); // Remove check digit
  }

  // If 12 digits, try 13 (add leading zero)
  if (cleaned.length === 12) {
    alternatives.push('0' + cleaned);
  }

  // If 9 digits, try 8 (might be with check digit)
  if (cleaned.length === 9) {
    alternatives.push(cleaned.slice(0, 8)); // Remove check digit for EAN-8
  }

  return alternatives.filter(alt => alt.length >= 8 && alt.length <= 13);
}

/**
 * Check digit validation for EAN-13
 * Algorithm: weighted sum mod 10
 */
function validateEAN13CheckDigit(barcode: string): boolean {
  if (barcode.length !== 13) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(barcode[i], 10);
    const weight = i % 2 === 0 ? 1 : 3;
    sum += digit * weight;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(barcode[12], 10);
}

/**
 * Check digit validation for EAN-8
 */
function validateEAN8CheckDigit(barcode: string): boolean {
  if (barcode.length !== 8) return false;

  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const digit = parseInt(barcode[i], 10);
    const weight = i % 2 === 0 ? 3 : 1;
    sum += digit * weight;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(barcode[7], 10);
}

/**
 * Check digit validation for UPC-A
 */
function validateUPCACheckDigit(barcode: string): boolean {
  if (barcode.length !== 12) return false;

  let sum = 0;
  for (let i = 0; i < 11; i++) {
    const digit = parseInt(barcode[i], 10);
    const weight = i % 2 === 0 ? 3 : 1;
    sum += digit * weight;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(barcode[11], 10);
}

/**
 * Determine if barcode looks like UPC-E format
 * UPC-E is a compressed form of UPC-A
 */
function isUPCEFormat(barcode: string): boolean {
  if (barcode.length !== 8) return false;
  // Simple heuristic: typically starts with 0-2 or 3-9
  // UPC-E barcodes are typically numeric
  return /^\d{8}$/.test(barcode);
}

/**
 * Main validation function - returns true/false
 * Used for quick checks without detailed info
 */
export function isValidBarcode(barcode: string): boolean {
  const result = validateAndCleanBarcode(barcode);
  return result.isValid;
}
