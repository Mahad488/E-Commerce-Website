interface SkeletonProps {
  className?: string;
}

/** A shimmering block. Give it the exact size of what will replace it, so nothing shifts. */
export function Skeleton({ className = "" }: SkeletonProps) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}

/** Matches ProductCard: a 4:5 tile, two lines of name and a price line. */
export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-2.5">
      <Skeleton className="aspect-[4/5] w-full rounded-tile" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-2/5" />
    </div>
  );
}

interface ProductGridSkeletonProps {
  count?: number;
  className?: string;
}

/** A loading grid with the same columns and gaps as the real product grid. */
export function ProductGridSkeleton({ count = 8, className = "" }: ProductGridSkeletonProps) {
  return (
    <div role="status" aria-label="Loading products" className={`grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-x-4 md:gap-y-8 xl:grid-cols-4 xl:gap-x-6 xl:gap-y-10 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
