import { useMemo, useRef } from "react";

import { useOffscreenPause } from "./useOffscreenPause";

interface NovaGlowProps {
  /** Position and size it from the parent, e.g. "absolute left-1/2 top-1/2 w-[600px] aspect-square -translate-x-1/2 -translate-y-1/2". */
  className?: string;
  /** Softer glow without the white core, for behind text (order placed, auth panel). */
  soft?: boolean;
  rays?: boolean;
}

/** The nova: breathing radial light with slow rays. Brand layer only (DESIGN.md §3). */
export function NovaGlow({ className = "", soft = false, rays = true }: NovaGlowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const paused = useOffscreenPause(ref);
  return (
    <div ref={ref} aria-hidden="true" data-paused={paused} className={`pointer-events-none ${className}`}>
      <div className={`nova-glow ${soft ? "nova-glow-soft" : ""}`} />
      {rays && <div className="nova-rays" />}
    </div>
  );
}

/** Deterministic star positions (a tiny LCG), so the sky looks the same on every render. */
function makeStars(count: number, seed: number) {
  let state = seed;
  const rnd = () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
  return Array.from({ length: count }, () => ({
    left: rnd() * 100,
    top: rnd() * 100,
    delay: rnd() * 4,
    duration: 3 + rnd() * 3,
    big: rnd() > 0.8,
  }));
}

interface NovaStarsProps {
  count?: number;
  className?: string;
  /** Changes the star layout; keep it stable per section. */
  seed?: number;
}

/** A sparse field of twinkling stars filling its positioned parent. */
export function NovaStars({ count = 24, className = "", seed = 11 }: NovaStarsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const paused = useOffscreenPause(ref);
  const stars = useMemo(() => makeStars(count, seed), [count, seed]);

  return (
    <div ref={ref} aria-hidden="true" data-paused={paused} className={`pointer-events-none absolute inset-0 ${className}`}>
      {stars.map((star, i) => (
        <i
          key={i}
          className="nova-star"
          style={{
            left: `${star.left.toFixed(1)}%`,
            top: `${star.top.toFixed(1)}%`,
            animationDelay: `-${star.delay.toFixed(1)}s`,
            animationDuration: `${star.duration.toFixed(1)}s`,
            ...(star.big ? { width: 3, height: 3 } : null),
          }}
        />
      ))}
    </div>
  );
}
