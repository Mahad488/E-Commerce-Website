import type { ReactNode } from "react";
import { m } from "motion/react";

import { DUR, EASE } from "../../lib/motion";

/**
 * `route`: the old page fades out quickly, the new one fades in and rises 8px.
 * Render it as the keyed child of <AnimatePresence mode="wait">.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE.out } }}
      exit={{ opacity: 0, transition: { duration: 0.12, ease: EASE.in } }}
    >
      {children}
    </m.div>
  );
}
