import { useState, useCallback } from "react";
import type { OCRDebugData } from "../components/OCRDebugPanel";

export const useOCRDebug = () => {
  const [debugStages, setDebugStages] = useState<OCRDebugData[]>([]);
  const [isDebugEnabled] = useState(true); // Always enabled for now

  const addStage = useCallback((data: OCRDebugData) => {
    if (!isDebugEnabled) return;

    setDebugStages((prev) => [
      ...prev,
      {
        ...data,
        timestamp: Date.now(),
      },
    ]);
  }, [isDebugEnabled]);

  const clearStages = useCallback(() => {
    setDebugStages([]);
  }, []);

  const logOCRExtraction = useCallback(
    (rawText: string, productName?: string, brand?: string, barcode?: string, confidence?: number) => {
      addStage({
        stage: "ocr-extraction",
        rawOCRText: rawText,
        extractedProductName: productName,
        extractedBrand: brand,
        extractedBarcode: barcode,
        confidence,
      });
    },
    [addStage]
  );

  const logTextPreprocessing = useCallback(
    (rawText: string, cleanedText: string, removedTokens?: string[], reasons?: string[]) => {
      addStage({
        stage: "text-preprocessing",
        rawOCRText: rawText,
        cleanedText,
        filteredTokens: removedTokens ? {
          original: rawText.split(/\s+/),
          removed: removedTokens,
          reason: reasons || Array(removedTokens.length).fill("processing"),
        } : undefined,
      });
    },
    [addStage]
  );

  const logBarcodeValidation = useCallback(
    (barcode: string, isValid: boolean, notes?: string) => {
      addStage({
        stage: "barcode-validation",
        extractedBarcode: barcode,
        barcodeValid: isValid,
        notes,
      });
    },
    [addStage]
  );

  const logSearchQuery = useCallback(
    (query: string, productName?: string, brand?: string) => {
      addStage({
        stage: "search-query",
        searchQuery: query,
        extractedProductName: productName,
        extractedBrand: brand,
      });
    },
    [addStage]
  );

  const logAPICall = useCallback(
    (endpoint: string, params: Record<string, string>, responseCount?: number, error?: string) => {
      addStage({
        stage: "api-call",
        apiCallDetails: {
          endpoint,
          params,
          responseCount,
          error,
        },
      });
    },
    [addStage]
  );

  const logRegionalFilter = useCallback(
    (
      totalResults: number,
      allowedCount: number,
      blockedCount: number,
      details?: Array<{ productName: string; country: string; allowed: boolean }>
    ) => {
      addStage({
        stage: "regional-filter",
        regionalFilterResults: {
          totalResults,
          allowedRegion: allowedCount,
          blockedRegion: blockedCount,
          details: details || [],
        },
        notes:
          blockedCount > allowedCount
            ? "⚠️ More results blocked than allowed - consider expanding region filter"
            : allowedCount === 0
              ? "❌ All results filtered by region - check regional settings"
              : "✅ Regional filtering successful",
      });
    },
    [addStage]
  );

  return {
    debugStages,
    clearStages,
    logOCRExtraction,
    logTextPreprocessing,
    logBarcodeValidation,
    logSearchQuery,
    logAPICall,
    logRegionalFilter,
    addStage,
  };
};
