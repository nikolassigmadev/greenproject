import { AlertTriangle, ShieldAlert, Info } from "lucide-react";
import { useState } from "react";
import type { BrandFlag } from "@/data/brandFlags";

const severityStyles = {
  critical: {
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-300 dark:border-red-800",
    icon: "text-red-600",
    title: "text-red-800 dark:text-red-200",
    text: "text-red-700 dark:text-red-300",
    label: "Forced / Child Labor Allegations",
  },
  high: {
    bg: "bg-orange-50 dark:bg-orange-950/40",
    border: "border-orange-300 dark:border-orange-800",
    icon: "text-orange-600",
    title: "text-orange-800 dark:text-orange-200",
    text: "text-orange-700 dark:text-orange-300",
    label: "Serious Labor Allegations",
  },
  medium: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-300 dark:border-amber-800",
    icon: "text-amber-600",
    title: "text-amber-800 dark:text-amber-200",
    text: "text-amber-700 dark:text-amber-300",
    label: "Labor Concerns Under Investigation",
  },
};

interface LaborFlagBannerProps {
  flag: BrandFlag;
  brandName?: string | null;
  compact?: boolean;
}

export function LaborFlagBanner({ flag, brandName, compact = false }: LaborFlagBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const style = severityStyles[flag.severity];

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${style.bg} border ${style.border}`}>
        <ShieldAlert className={`w-4 h-4 flex-shrink-0 ${style.icon}`} />
        <span className={`text-xs font-medium ${style.title}`}>
          {style.label}
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${style.border} ${style.bg} overflow-hidden`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.icon}`} />
          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold text-sm ${style.title}`}>
              {style.label}
            </h4>
            <p className={`text-sm mt-1 ${style.text}`}>
              {flag.allegation}
            </p>

            {!expanded && flag.sources.length > 0 && (
              <button
                onClick={() => setExpanded(true)}
                className={`btn-aurora flex items-center gap-1 text-xs mt-2 underline underline-offset-2 ${style.text} opacity-80 hover:opacity-100`}
              >
                <Info className="w-3 h-3" />
                View sources ({flag.sources.length})
              </button>
            )}

            {expanded && (
              <div className="mt-3 space-y-1">
                <p className={`text-xs font-medium ${style.title}`}>Sources:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {flag.sources.map((source, i) => (
                    <li key={i} className={`text-xs ${style.text}`}>
                      {source}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setExpanded(false)}
                  className={`btn-aurora text-xs underline underline-offset-2 ${style.text} opacity-80 hover:opacity-100 mt-1`}
                >
                  Hide sources
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
