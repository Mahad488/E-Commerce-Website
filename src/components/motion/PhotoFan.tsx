import { useEffect } from "react";
import { m, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";

import { imageFallbackHandler } from "../../lib/catalog";
import { SPRING } from "../../lib/motion";

export interface FanPhoto {
  src: string;
  alt: string;
  category?: string;
}

interface PhotoFanProps {
  photos: FanPhoto[];
  /** 0 = stacked, 1 = fanned. Usually scroll progress; defaults to fully fanned. */
  spread?: MotionValue<number>;
  /** Fans out a little further (hover/focus on the parent row). */
  active?: boolean;
  /** Tailwind classes for the box; set the card width with [--w:…]. */
  className?: string;
  /** Deeper shadow for cards sitting on night. */
  onNight?: boolean;
}

/**
 * A small fanned deck of product photos. The fan opens with `spread` and opens
 * further while `active`, on a spring. Reduced motion shows it fanned and still.
 */
export default function PhotoFan({ photos, spread, active = false, className = "", onNight = false }: PhotoFanProps) {
  const reduce = useReducedMotion();
  const fallback = useMotionValue(1);
  const hover = useSpring(0, SPRING.layout);

  useEffect(() => {
    hover.set(active && !reduce ? 1 : 0);
  }, [active, reduce, hover]);

  const progress = reduce || !spread ? fallback : spread;
  const cards = photos.slice(0, 4);
  const mid = (cards.length - 1) / 2;

  return (
    <div aria-hidden="true" className={`relative ${className}`}>
      {cards.map((photo, i) => (
        <FanCard key={photo.src + i} photo={photo} offset={i - mid} depth={Math.abs(i - mid)} progress={progress} hover={hover} onNight={onNight} />
      ))}
    </div>
  );
}

interface FanCardProps {
  photo: FanPhoto;
  /** Position relative to the centre card: …, -1, 0, 1, … */
  offset: number;
  depth: number;
  progress: MotionValue<number>;
  hover: MotionValue<number>;
  onNight: boolean;
}

function FanCard({ photo, offset, depth, progress, hover, onNight }: FanCardProps) {
  const amount = useTransform<number, number>([progress, hover], ([p, h]) => p * 0.85 + h * 0.4);
  const x = useTransform(amount, (s) => `${offset * 58 * s}%`);
  const y = useTransform(amount, (s) => `${depth * 7 * s - (depth === 0 ? 4 * s : 0)}%`);
  const rotate = useTransform(amount, (s) => offset * 8 * s);

  return (
    <m.div
      className={`absolute overflow-hidden rounded-[14px] bg-surface lg:rounded-[18px] ${onNight ? "shadow-deck" : "shadow-lift"}`}
      style={{
        x,
        y,
        rotate,
        zIndex: 10 - Math.round(depth * 2),
        width: "var(--w)",
        aspectRatio: "4 / 5",
        left: "calc(50% - var(--w) / 2)",
        top: "calc(50% - var(--w) * 0.625)",
      }}
    >
      <img src={photo.src} alt={photo.alt} loading="lazy" onError={imageFallbackHandler(photo.category)} className="h-full w-full object-cover" />
    </m.div>
  );
}
