import { cn } from "@/lib/utils";

interface ScoreDisplayProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ScoreDisplay({ score, size = 'md', showLabel = true }: ScoreDisplayProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-score-excellent';
    if (score >= 60) return 'bg-score-good';
    if (score >= 40) return 'bg-score-fair';
    if (score >= 20) return 'bg-score-poor';
    return 'bg-score-critical';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score >= 20) return 'Poor';
    return 'Critical';
  };

  const sizeClasses = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-16 h-16 text-lg',
    lg: 'w-24 h-24 text-2xl',
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-display font-bold text-white shadow-card",
          getScoreColor(score),
          sizeClasses[size]
        )}
      >
        {score}
      </div>
      {showLabel && (
        <span className={cn(
          "font-medium",
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm',
          size === 'lg' && 'text-base',
          score >= 80 && 'text-score-excellent',
          score >= 60 && score < 80 && 'text-score-good',
          score >= 40 && score < 60 && 'text-score-fair',
          score >= 20 && score < 40 && 'text-score-poor',
          score < 20 && 'text-score-critical',
        )}>
          {getScoreLabel(score)}
        </span>
      )}
    </div>
  );
}
