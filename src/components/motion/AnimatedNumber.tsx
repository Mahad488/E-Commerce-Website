import { useState } from "react";
import { AnimatePresence, m, type Variants } from "motion/react";

import { EASE } from "../../lib/motion";

interface AnimatedNumberProps {
  value: number;
  /** Turns the number into display text, e.g. useCurrency().formatPrice. */
  format?: (value: number) => string;
  className?: string;
}

type Direction = 1 | -1;

const digit: Variants = {
  enter: (dir: Direction) => ({ y: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { y: "0%", opacity: 1 },
  exit: (dir: Direction) => ({ y: dir > 0 ? "-100%" : "100%", opacity: 0 }),
};

/**
 * `roll`: changed characters roll vertically (up when the number grows, down when
 * it shrinks). Screen readers get the plain text once.
 */
export default function AnimatedNumber({ value, format = String, className }: AnimatedNumberProps) {
  const [previous, setPrevious] = useState(value);
  const [direction, setDirection] = useState<Direction>(1);
  if (value !== previous) {
    setDirection(value > previous ? 1 : -1);
    setPrevious(value);
  }

  const text = format(value);
  const chars = Array.from(text);

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-flex">
        {chars.map((ch, i) => (
          // Keyed by place from the right, so units roll with units and tens with tens.
          <span key={chars.length - i} className="roll-cell">
            <AnimatePresence initial={false} mode="popLayout" custom={direction}>
              <m.span
                key={ch}
                custom={direction}
                variants={digit}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.32, ease: EASE.out, delay: i * 0.028 }}
                className="inline-block"
              >
                {ch === " " ? " " : ch}
              </m.span>
            </AnimatePresence>
          </span>
        ))}
      </span>
    </span>
  );
}
