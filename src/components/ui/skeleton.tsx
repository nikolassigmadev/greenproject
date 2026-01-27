import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "text" | "circular" | "rounded";
}

function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-muted",
        {
          "h-4 w-full rounded-md": variant === "default",
          "h-4 w-3/4 rounded-sm": variant === "text",
          "h-12 w-12 rounded-full": variant === "circular",
          "h-20 w-full rounded-lg": variant === "rounded",
        },
        className
      )}
      {...props}
    />
  );
}

interface ProductCardSkeletonProps {
  className?: string;
}

export function ProductCardSkeleton({ className }: ProductCardSkeletonProps) {
  return (
    <div className={cn("group overflow-hidden transition-all duration-300 bg-card border-border/50 rounded-xl", className)}>
      <div className="p-0">
        {/* Image skeleton */}
        <div className="h-40 bg-muted relative">
          <Skeleton variant="circular" className="absolute top-3 right-3 h-8 w-8" />
        </div>
        
        {/* Content skeleton */}
        <div className="p-4 space-y-3">
          <div className="space-y-2">
            <Skeleton variant="text" className="h-3 w-16" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton variant="text" className="h-4 w-1/2" />
          </div>
          
          <div className="flex items-center gap-2">
            <Skeleton variant="text" className="h-3 w-20" />
            <Skeleton variant="text" className="h-3 w-16" />
          </div>
          
          <div className="flex items-center gap-2">
            <Skeleton variant="text" className="h-6 w-20 rounded-full" />
            <Skeleton variant="text" className="h-6 w-16 rounded-full" />
          </div>
          
          <div className="flex gap-1">
            <Skeleton variant="text" className="h-5 w-12 rounded" />
            <Skeleton variant="text" className="h-5 w-16 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface CategoryCardSkeletonProps {
  className?: string;
}

export function CategoryCardSkeleton({ className }: CategoryCardSkeletonProps) {
  return (
    <div className={cn("group hover:shadow-lg transition-all duration-300 border-2 border-border/20 rounded-xl p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="circular" className="h-12 w-12" />
        <Skeleton variant="text" className="h-6 w-16 rounded-full" />
      </div>
      
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton variant="text" className="h-4 w-full mb-4" />
      
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex-1">
          <Skeleton variant="text" className="h-3 w-12 mb-1" />
          <Skeleton variant="text" className="h-4 w-20" />
        </div>
        <Skeleton variant="text" className="h-4 w-4" />
      </div>
    </div>
  );
}

export { Skeleton };
