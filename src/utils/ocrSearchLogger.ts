/**
 * OCR Search Pipeline Logging
 * Captures detailed information about each stage of OCR → OpenFoodFacts flow
 * Data is logged to console and returned for UI debug panel
 */

export interface SearchPipelineLog {
  stage: string;
  timestamp: number;
  status: 'success' | 'warning' | 'error' | 'info';
  details: string;
  data: Record<string, string | number | boolean | undefined | (string | number | boolean)[]>;
}

class OCRSearchLogger {
  private logs: SearchPipelineLog[] = [];
  private maxLogs = 50; // Keep last 50 logs

  /**
   * Log a pipeline stage
   */
  log(
    stage: string,
    status: 'success' | 'warning' | 'error' | 'info',
    details: string,
    data: Record<string, string | number | boolean | undefined | (string | number | boolean)[]> = {}
  ) {
    const entry: SearchPipelineLog = {
      stage,
      timestamp: Date.now(),
      status,
      details,
      data,
    };

    this.logs.push(entry);

    // Keep log size manageable
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console with emoji indicator
    const emoji = this.getEmoji(status);
    const prefix = `[${stage.toUpperCase()}]`;
    console.log(`${emoji} ${prefix} ${details}`, data);

    return entry;
  }

  /**
   * Log OCR extraction results
   */
  logOCRExtraction(
    productName: string | null,
    brand: string | null,
    barcode: string | null,
    confidence: number
  ) {
    return this.log('OCR_EXTRACTION', 'success', 'OCR extraction complete', {
      productName: productName || '(not found)',
      brand: brand || '(not found)',
      barcode: barcode || '(not found)',
      confidence: `${Math.round(confidence * 100)}%`,
    });
  }

  /**
   * Log barcode validation
   */
  logBarcodeValidation(
    input: string,
    cleaned: string,
    isValid: boolean,
    format?: string
  ) {
    return this.log(
      'BARCODE_VALIDATION',
      isValid ? 'success' : 'warning',
      isValid
        ? `Barcode validated: ${format}`
        : `Barcode validation failed`,
      {
        input,
        cleaned,
        format: format || 'UNKNOWN',
        valid: isValid,
      }
    );
  }

  /**
   * Log text preprocessing
   */
  logTextPreprocessing(
    original: string,
    cleaned: string,
    removedTokens: string[],
    keptTokens: string[]
  ) {
    return this.log(
      'TEXT_PREPROCESSING',
      removedTokens.length > 0 ? 'warning' : 'success',
      `Text preprocessing: ${keptTokens.length} tokens kept, ${removedTokens.length} removed`,
      {
        original: original.slice(0, 100),
        cleaned: cleaned.slice(0, 100),
        keptCount: keptTokens.length,
        removedCount: removedTokens.length,
        removed: removedTokens.slice(0, 5),
        kept: keptTokens.slice(0, 5),
      }
    );
  }

  /**
   * Log barcode search attempt
   */
  logBarcodeSearch(barcode: string, found: boolean, productName?: string) {
    return this.log(
      'BARCODE_SEARCH',
      found ? 'success' : 'warning',
      found
        ? `Barcode search successful: ${productName}`
        : `Barcode search failed: no product found`,
      {
        barcode,
        found,
        productName: productName || '(none)',
      }
    );
  }

  /**
   * Log text search attempt
   */
  logTextSearch(
    query: string,
    resultsCount: number,
    filters: Record<string, boolean> = {}
  ) {
    return this.log(
      'TEXT_SEARCH',
      resultsCount > 0 ? 'success' : 'warning',
      `Text search: "${query}" returned ${resultsCount} results`,
      {
        query,
        resultsCount,
        regionFiltered: filters.regionFiltered || false,
        photoRequired: filters.photoRequired || false,
      }
    );
  }

  /**
   * Log regional filtering results
   */
  logRegionalFiltering(
    totalResults: number,
    allowedCount: number,
    expandedGlobal: boolean
  ) {
    const blockedCount = totalResults - allowedCount;
    return this.log(
      'REGIONAL_FILTER',
      blockedCount > 0 ? 'warning' : 'success',
      `Regional filtering: ${allowedCount}/${totalResults} allowed${
        expandedGlobal ? ' (expanded to global)' : ''
      }`,
      {
        total: totalResults,
        allowed: allowedCount,
        blocked: blockedCount,
        expandedGlobal,
        blockedPercentage:
          totalResults > 0
            ? `${Math.round((blockedCount / totalResults) * 100)}%`
            : 'N/A',
      }
    );
  }

  /**
   * Log API error
   */
  logAPIError(endpoint: string, error: string, statusCode?: number) {
    return this.log(
      'API_ERROR',
      'error',
      `API error at ${endpoint}`,
      {
        endpoint,
        error,
        statusCode: statusCode || 'unknown',
      }
    );
  }

  /**
   * Log final results
   */
  logFinalResults(found: boolean, count: number, source: string) {
    return this.log(
      'FINAL_RESULTS',
      found ? 'success' : 'info',
      found
        ? `Found ${count} product(s) from ${source}`
        : 'No products found',
      {
        found,
        count,
        source,
      }
    );
  }

  /**
   * Get all logs
   */
  getLogs(): SearchPipelineLog[] {
    return [...this.logs];
  }

  /**
   * Clear logs
   */
  clear() {
    this.logs = [];
  }

  /**
   * Get logs for a specific stage
   */
  getStageLog(stage: string): SearchPipelineLog[] {
    return this.logs.filter((log) => log.stage === stage);
  }

  /**
   * Get emoji for status
   */
  private getEmoji(status: string): string {
    switch (status) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      default:
        return '•';
    }
  }
}

// Singleton instance
export const ocrSearchLogger = new OCRSearchLogger();
