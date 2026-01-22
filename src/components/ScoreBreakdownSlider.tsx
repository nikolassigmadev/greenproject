import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Product } from "@/data/products";
import { generateWhyThisScore, getScoreBreakdown, type ScoreFactorBreakdown, type ScoreFactorKey } from "@/data/scoreBreakdown";
import { cn } from "@/lib/utils";

type Props = {
  product: Product;
  className?: string;
};

const formatSignedPoints = (impact: number) => {
  const rounded = Math.round(Math.abs(impact));
  return `${impact >= 0 ? "+" : "−"}${rounded} points`;
};

const getFactorColor = (factor: ScoreFactorBreakdown) => {
  if (factor.impact === 0) return "bg-muted-foreground/20";
  if (factor.impact > 0) return "bg-emerald-500";
  return "bg-rose-500";
};

const FactorBar = ({
  factor,
  dimmed,
  selected,
  onSelect,
}: {
  factor: ScoreFactorBreakdown;
  dimmed: boolean;
  selected: boolean;
  onSelect: (key: ScoreFactorKey) => void;
}) => {
  const cap = Math.max(1, factor.cap);
  const pct = Math.min(Math.abs(factor.impact) / cap, 1) * 50;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => onSelect(factor.key)}
          className={cn(
            "w-full text-left rounded-lg p-2 transition-colors",
            selected && "bg-muted/60",
            !selected && "hover:bg-muted/40",
            dimmed && "opacity-60",
          )}
        >
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="text-sm font-medium">{factor.label}</div>
            <div className="text-xs font-medium text-muted-foreground">
              {factor.impact === 0 ? "0" : formatSignedPoints(factor.impact)}
            </div>
          </div>

          <div className="relative h-3 rounded-full bg-muted overflow-hidden">
            <div className="absolute inset-y-0 left-1/2 w-px bg-muted-foreground/50" />
            {factor.impact < 0 && (
              <div
                className={cn("absolute inset-y-0 right-1/2", getFactorColor(factor))}
                style={{ width: `${pct}%` }}
              />
            )}
            {factor.impact > 0 && (
              <div
                className={cn("absolute inset-y-0 left-1/2", getFactorColor(factor))}
                style={{ width: `${pct}%` }}
              />
            )}
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1">
          <div className="font-medium">{factor.label}</div>
          <div className="text-sm">{factor.impact === 0 ? "0 points" : formatSignedPoints(factor.impact)}</div>
          <div className="text-xs text-muted-foreground">
            {factor.inputLabel}: {factor.inputValue}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export const ScoreBreakdownSlider = ({ product, className }: Props) => {
  const breakdown = useMemo(() => getScoreBreakdown(product), [product]);
  const whyLines = useMemo(() => generateWhyThisScore(breakdown), [breakdown]);

  const [selectedKey, setSelectedKey] = useState<ScoreFactorKey | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);

  const selectedFactor = selectedKey ? breakdown.factors.find((f) => f.key === selectedKey) : undefined;

  const handleSelect = (key: ScoreFactorKey) => {
    setWhyOpen(false);
    setSelectedKey((prev) => (prev === key ? null : key));
  };

  return (
    <TooltipProvider>
      <div className={cn("space-y-3", className)}>
        <div className="space-y-1">
          {breakdown.factors
            .filter((f) => f.key !== "manual")
            .map((factor) => (
              <FactorBar
                key={factor.key}
                factor={factor}
                selected={selectedKey === factor.key}
                dimmed={selectedKey !== null && selectedKey !== factor.key}
                onSelect={handleSelect}
              />
            ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              setSelectedKey(null);
              setWhyOpen((v) => !v);
            }}
          >
            <Info className="w-4 h-4" />
            Why This Score?
          </Button>

          {breakdown.isEstimated && (
            <div className="text-xs text-muted-foreground">Some values are estimated.</div>
          )}
        </div>

        {selectedFactor && (
          <div className="rounded-lg border bg-background p-3 text-sm">
            <div className="font-medium mb-1">{selectedFactor.label}</div>
            <div className="text-muted-foreground">
              {selectedFactor.impact === 0
                ? `This factor does not change the score for this product.`
                : `This factor changes the score because ${selectedFactor.inputLabel.toLowerCase()} is ${selectedFactor.inputValue}.`}
            </div>
          </div>
        )}

        {whyOpen && (
          <div className="rounded-lg border bg-background p-3 text-sm space-y-1">
            {whyLines.map((line, i) => (
              <p key={i} className={cn(i > 0 && "text-muted-foreground")}>{line}</p>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};
