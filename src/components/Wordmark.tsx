import { useId } from "react";

export const SPARK_PATH =
  "M12 0C12.9 7.2 16.8 11.1 24 12 16.8 12.9 12.9 16.8 12 24 11.1 16.8 7.2 12.9 0 12 7.2 11.1 11.1 7.2 12 0Z";

interface WordmarkProps {
  className?: string;
  /** Marks the spark that turns when something lands in the bag. Only the navbar's should. */
  primary?: boolean;
}

/** NOVA in expanded Mona Sans with the four-point nova spark. */
export default function Wordmark({ className = "", primary = false }: WordmarkProps) {
  const gradientId = `nova-spark-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <span className={`inline-flex items-start gap-[0.03em] font-extrabold tracking-[-0.01em] [font-stretch:125%] ${className}`}>
      NOVA
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="mt-[-0.04em] h-[0.58em] w-[0.58em] shrink-0"
        {...(primary ? { "data-nova-spark": "" } : {})}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FF5CA8" />
            <stop offset=".55" stopColor="#FFB21E" />
            <stop offset="1" stopColor="#A58BFF" />
          </linearGradient>
        </defs>
        <path d={SPARK_PATH} fill={`url(#${gradientId})`} />
      </svg>
    </span>
  );
}
