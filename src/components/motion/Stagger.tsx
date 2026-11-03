import type { ReactNode } from "react";
import { m, type Variants } from "motion/react";

import { EASE, SPRING } from "../../lib/motion";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.56, ease: EASE.out } },
};

interface StaggerProps {
  children: ReactNode;
  className?: string;
}

/** `stagger`: children rise in one after another the first time the group scrolls into view. */
export function Stagger({ children, className }: StaggerProps) {
  return (
    <m.div className={className} variants={container} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.12 }}>
      {children}
    </m.div>
  );
}

interface StaggerItemProps extends StaggerProps {
  /** Also animate position changes (filters, sorting): the `reflow` motion. */
  layout?: boolean;
}

export function StaggerItem({ children, className, layout = false }: StaggerItemProps) {
  return (
    <m.div className={className} variants={item} layout={layout ? "position" : false} transition={SPRING.layout}>
      {children}
    </m.div>
  );
}
