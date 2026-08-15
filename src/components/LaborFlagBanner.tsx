import { AlertTriangle, ShieldAlert, Info, GitBranch } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { BrandFlagV2 } from "@/types/brandFlag";


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
  low: {
    bg: "bg-yellow-50 dark:bg-yellow-950/40",
    border: "border-yellow-300 dark:border-yellow-800",
    icon: "text-yellow-600",
    title: "text-yellow-800 dark:text-yellow-200",
    text: "text-yellow-700 dark:text-yellow-300",
    label: "Labor Concerns Noted",
  },
};

/**
 * Headline wording follows the claim, not just the severity.
 *
 * "Forced / Child Labor Allegations" over a flag whose only evidence is the DOL
 * commodity list reads as an allegation against the company. It isn't one. The
 * heading is the part people read, so it's the part that has to be accurate.
 */
function headline(flag: BrandFlagV2, severityLabel: string): string {
  if (flag.claimType === "supply_chain_inference") {
    return "Supply-chain risk — inferred, not alleged against this company";
  }
  return severityLabel;
}

interface LaborFlagBannerProps {
  flag: BrandFlagV2;
  brandName?: string | null;
  compact?: boolean;
}

export function LaborFlagBanner({ flag, brandName, compact = false }: LaborFlagBannerProps) {
  const [expanded, setExpanded] = useState(false);

  const style = severityStyles[flag.severity] ?? severityStyles.medium;
  const inferred = flag.claimType === "supply_chain_inference";

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${style.bg} border ${style.border}`}>
        {inferred
          ? <GitBranch className={`w-4 h-4 flex-shrink-0 ${style.icon}`} />
          : <ShieldAlert className={`w-4 h-4 flex-shrink-0 ${style.icon}`} />}
        <span className={`text-xs font-medium ${style.title}`}>
          {inferred ? "Supply-chain risk" : style.label}
        </span>
      </div>
    );
  }

  return (
    // Inference flags get a dashed border. Same severity colour — the concern is
    // real and we're not hiding it — but a visibly different kind of statement.
    <div
      className={`rounded-lg ${inferred ? "border-2 border-dashed" : "border"} ${style.border} ${style.bg} overflow-hidden`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {inferred
            ? <GitBranch className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.icon}`} />
            : <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${style.icon}`} />}
          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold text-sm ${style.title}`}>
              {headline(flag, style.label)}
            </h4>
            {inferred && (
              // Stated before the summary, not tucked under "view sources".
              // A caveat placed after the claim is a caveat most people miss.
              <p className={`text-xs mt-1 ${style.text} opacity-90`}>
                Our sources document this problem in the commodity or region
                {brandName ? ` ${brandName}` : " this brand"} buys from — they do not
                accuse this company of it directly.
              </p>
            )}
            <p className={`text-sm mt-1 ${style.text}`}>
              {flag.summary}
            </p>
            {expanded && flag.details && (
              <p className={`text-xs mt-2 ${style.text} opacity-90`}>
                {flag.details}
              </p>
            )}

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
                      {source.url ? (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2 hover:opacity-80"
                        >
                          {source.title}
                        </a>
                      ) : (
                        source.title
                      )}
                      {" — "}
                      <span className="opacity-75">{source.publisher}</span>
                      {source.publishedDate && (
                        <span className="opacity-50"> ({source.publishedDate.slice(0, 4)})</span>
                      )}
                      {/* Mark the commodity-level sources individually too: a
                          flag can mix one document that names the company with
                          three that don't, and the list is where that shows. */}
                      {source.commodityLevel && (
                        <span className="opacity-60 italic"> — about the commodity, not this company</span>
                      )}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setExpanded(false)}
                  className={`btn-aurora text-xs underline underline-offset-2 ${style.text} opacity-80 hover:opacity-100 mt-1`}
                >
                  Hide sources
                </button>
                <Link
                  to="/methodology"
                  className={`text-xs underline underline-offset-2 ${style.text} opacity-60 hover:opacity-100 mt-1 block`}
                >
                  How we source and verify flags →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
