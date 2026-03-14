import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface OCRDebugData {
  stage: string;
  rawOCRText?: string;
  cleanedText?: string;
  extractedProductName?: string;
  extractedBrand?: string;
  extractedBarcode?: string;
  barcodeValid?: boolean;
  filteredTokens?: {
    original: string[];
    removed: string[];
    reason: string[];
  };
  searchQuery?: string;
  apiCallDetails?: {
    endpoint: string;
    params: Record<string, string>;
    responseCount?: number;
    filtered?: number;
    error?: string;
  };
  regionalFilterResults?: {
    totalResults: number;
    allowedRegion: number;
    blockedRegion: number;
    details: {
      productName: string;
      country: string;
      allowed: boolean;
    }[];
  };
  confidence?: number;
  timestamp?: number;
  notes?: string;
}

interface OCRDebugPanelProps {
  debugData?: OCRDebugData[];
  isVisible?: boolean;
}

export const OCRDebugPanel: React.FC<OCRDebugPanelProps> = ({
  debugData = [],
  isVisible = true,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set([0])
  );

  const toggleSection = (index: number) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setExpandedSections(newSet);
  };

  if (!isVisible || debugData.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-slate-900 text-slate-50 rounded-lg border border-slate-700 p-4 mt-4 font-mono text-sm">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-blue-400 mb-2">🔍 OCR Debug Panel</h3>
        <p className="text-slate-400 text-xs">
          {debugData.length} stage(s) recorded - Shows why searches succeed or fail
        </p>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {debugData.map((data, idx) => (
          <DebugStage
            key={idx}
            data={data}
            index={idx}
            isExpanded={expandedSections.has(idx)}
            onToggle={() => toggleSection(idx)}
          />
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700 text-xs text-slate-400">
        <p>💡 Tip: Click any section to expand and see details</p>
      </div>
    </div>
  );
};

interface DebugStageProps {
  data: OCRDebugData;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

const DebugStage: React.FC<DebugStageProps> = ({
  data,
  index,
  isExpanded,
  onToggle,
}) => {
  const getStageBadge = (stage: string) => {
    switch (stage) {
      case "ocr-extraction":
        return "🤖";
      case "text-preprocessing":
        return "🧹";
      case "barcode-validation":
        return "📊";
      case "search-query":
        return "🔎";
      case "api-call":
        return "🌐";
      case "regional-filter":
        return "🌍";
      default:
        return "📍";
    }
  };

  return (
    <div className="bg-slate-800 rounded border border-slate-600 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span>{getStageBadge(data.stage)}</span>
          <span className="font-semibold text-slate-200">
            Stage {index + 1}: {data.stage}
          </span>
          {data.confidence !== undefined && (
            <span className="text-xs bg-blue-900 px-2 py-1 rounded text-blue-200">
              {(data.confidence * 100).toFixed(0)}%
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp size={20} className="text-slate-400" />
        ) : (
          <ChevronDown size={20} className="text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 py-3 bg-slate-750 border-t border-slate-600 space-y-2 text-slate-300">
          {/* OCR Extraction */}
          {data.rawOCRText && (
            <div>
              <p className="text-slate-400 font-semibold mb-1">Raw OCR Output:</p>
              <pre className="bg-slate-900 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap break-words max-h-32">
                {data.rawOCRText}
              </pre>
            </div>
          )}

          {data.cleanedText && (
            <div>
              <p className="text-slate-400 font-semibold mb-1">After Preprocessing:</p>
              <pre className="bg-slate-900 p-2 rounded text-xs overflow-x-auto max-h-20">
                {data.cleanedText}
              </pre>
            </div>
          )}

          {/* Extracted Fields */}
          {(data.extractedProductName || data.extractedBrand) && (
            <div className="bg-slate-900 p-2 rounded">
              <p className="text-slate-400 font-semibold mb-1">Extracted Data:</p>
              {data.extractedProductName && (
                <p>
                  <span className="text-slate-500">Product Name:</span>{" "}
                  <span className="text-green-400">{data.extractedProductName}</span>
                </p>
              )}
              {data.extractedBrand && (
                <p>
                  <span className="text-slate-500">Brand:</span>{" "}
                  <span className="text-green-400">{data.extractedBrand}</span>
                </p>
              )}
              {data.extractedBarcode && (
                <p>
                  <span className="text-slate-500">Barcode:</span>{" "}
                  <span className="text-yellow-400">{data.extractedBarcode}</span>
                  {data.barcodeValid !== undefined && (
                    <span className={data.barcodeValid ? "text-green-400 ml-2" : "text-red-400 ml-2"}>
                      {data.barcodeValid ? "✅ Valid" : "❌ Invalid"}
                    </span>
                  )}
                </p>
              )}
            </div>
          )}

          {/* Filtered Tokens */}
          {data.filteredTokens && data.filteredTokens.removed.length > 0 && (
            <div className="bg-slate-900 p-2 rounded">
              <p className="text-slate-400 font-semibold mb-1">
                Tokens Filtered: {data.filteredTokens.removed.length} removed
              </p>
              <div className="space-y-1">
                {data.filteredTokens.removed.map((token, i) => (
                  <p key={i} className="text-xs">
                    <span className="text-red-400">✗ {token}</span>
                    <span className="text-slate-500 ml-2">
                      ({data.filteredTokens?.reason[i] || "vowel ratio"})
                    </span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Search Query */}
          {data.searchQuery && (
            <div>
              <p className="text-slate-400 font-semibold mb-1">Search Query:</p>
              <p className="bg-slate-900 p-2 rounded text-blue-300">{data.searchQuery}</p>
            </div>
          )}

          {/* API Call Details */}
          {data.apiCallDetails && (
            <div className="bg-slate-900 p-2 rounded">
              <p className="text-slate-400 font-semibold mb-1">API Call:</p>
              <p className="text-xs">
                <span className="text-slate-500">Endpoint:</span>{" "}
                <span>{data.apiCallDetails.endpoint}</span>
              </p>
              {data.apiCallDetails.error ? (
                <p className="text-red-400 text-xs mt-1">
                  ❌ Error: {data.apiCallDetails.error}
                </p>
              ) : (
                <>
                  <p className="text-xs mt-1">
                    <span className="text-slate-500">Response:</span>{" "}
                    <span className="text-green-400">
                      {data.apiCallDetails.responseCount} results
                    </span>
                  </p>
                  {data.apiCallDetails.filtered !== undefined && (
                    <p className="text-xs">
                      <span className="text-slate-500">After Region Filter:</span>{" "}
                      <span className={data.apiCallDetails.filtered > 0 ? "text-green-400" : "text-red-400"}>
                        {data.apiCallDetails.filtered} results
                      </span>
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Regional Filter Results */}
          {data.regionalFilterResults && (
            <div className="bg-slate-900 p-2 rounded">
              <p className="text-slate-400 font-semibold mb-1">Regional Filter:</p>
              <p className="text-xs">
                <span className="text-green-400">✅ Allowed:</span> {data.regionalFilterResults.allowedRegion} |{" "}
                <span className="text-red-400">❌ Blocked:</span> {data.regionalFilterResults.blockedRegion}
              </p>
              {data.regionalFilterResults.details.slice(0, 3).map((d, i) => (
                <p key={i} className="text-xs mt-1">
                  {d.allowed ? "✅" : "❌"} {d.productName}{" "}
                  <span className="text-slate-500">({d.country})</span>
                </p>
              ))}
            </div>
          )}

          {/* Notes */}
          {data.notes && (
            <div className="bg-yellow-900 bg-opacity-20 border border-yellow-700 rounded p-2">
              <p className="text-yellow-300 text-xs font-semibold mb-1">⚠️ Note:</p>
              <p className="text-yellow-200 text-xs">{data.notes}</p>
            </div>
          )}

          {/* Timestamp */}
          {data.timestamp && (
            <p className="text-xs text-slate-500 pt-2 border-t border-slate-700">
              {new Date(data.timestamp).toLocaleTimeString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
