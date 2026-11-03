import type { ReactNode } from "react";
import { LazyMotion, MotionConfig } from "motion/react";

import { DUR, EASE } from "../../lib/motion";

const loadFeatures = () => import("./features").then((mod) => mod.default);

/**
 * Wraps the app once. `reducedMotion="user"` turns transforms off for people who
 * asked their OS for less motion; `strict` makes sure every animated element uses
 * the lightweight `m` component.
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: DUR.base, ease: EASE.out }}>
      <LazyMotion features={loadFeatures} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
