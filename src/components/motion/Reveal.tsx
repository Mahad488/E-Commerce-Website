import type { ReactNode } from "react";
import { m } from "motion/react";

import { EASE } from "../../lib/motion";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Fades and lifts its content the first time it scrolls into view.
 * Use sparingly: one or two places per page at most (DESIGN.md §8, tier 3).
 */
export default function Reveal({ children, className, delay = 0 }: RevealProps) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.56, ease: EASE.out, delay }}
    >
      {children}
    </m.div>
  );
}
