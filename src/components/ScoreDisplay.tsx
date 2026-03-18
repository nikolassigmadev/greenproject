import { cn } from "@/lib/utils";

interface ScoreDisplayProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const scoreConfig = (score: number) => {
  if (score >= 80) return { stroke: "hsl(152 58% 32%)", textClass: "text-score-excellent", label: "Excellent" };
  if (score >= 60) return { stroke: "hsl(82 52% 38%)", textClass: "text-score-good", label: "Good" };
  if (score >= 40) return { stroke: "hsl(43 88% 43%)", textClass: "text-score-fair", label: "Fair" };
  if (score >= 20) return { stroke: "hsl(24 78% 44%)", textClass: "text-score-poor", label: "Poor" };
  return { stroke: "hsl(0 68% 44%)", textClass: "text-score-critical", label: "Critical" };
};

const sizeMap = {
  sm: { outer: 48, strokeWidth: 4.5, numClass: "text-[11px]", labelClass: "text-[9px]" },
  md: { outer: 68, strokeWidth: 5.5, numClass: "text-base", labelClass: "text-xs" },
  lg: { outer: 100, strokeWidth: 7, numClass: "text-2xl", labelClass: "text-sm" },
};

export function ScoreDisplay({ score, size = "md", showLabel = true }: ScoreDisplayProps) {
  const { stroke, textClass, label } = scoreConfig(score);
  const { outer, strokeWidth, numClass, labelClass } = sizeMap[size];

  const r = (outer - strokeWidth * 2) / 2;
  const cx = outer / 2;
  const cy = outer / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (Math.min(score, 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative" style={{ width: outer, height: outer }}>
        <svg
          width={outer}
          height={outer}
          viewBox={`0 0 ${outer} ${outer}`}
          className="-rotate-90"
          aria-label={`Score: ${score} out of 100 — ${label}`}
        >
          {/* Track ring */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/50"
          />
          {/* Score ring */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-display font-bold tabular-nums leading-none", numClass, textClass)}>
            {score}
          </span>
        </div>
      </div>
      {showLabel && (
        <span className={cn("font-semibold uppercase tracking-wider", labelClass, textClass)}>
          {label}
        </span>
      )}
    </div>
  );
}
