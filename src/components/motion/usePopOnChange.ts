import { useEffect, useRef, type RefObject } from "react";

import { EASE_CSS, prefersReducedMotion } from "../../lib/motion";

/** Pops an element (scale 1 → 1.35 → 1) whenever `value` changes after the first render. */
export function usePopOnChange(ref: RefObject<HTMLElement | null>, value: unknown): void {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (prefersReducedMotion()) return;
    ref.current?.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.35)", offset: 0.4 }, { transform: "scale(1)" }],
      { duration: 380, easing: EASE_CSS.pop }
    );
  }, [ref, value]);
}
