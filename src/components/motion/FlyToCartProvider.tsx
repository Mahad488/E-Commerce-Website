import { useCallback, useMemo, useRef, type ReactNode } from "react";

import { burstAt, FLARE_COLORS, flyImage, squash } from "../../lib/flare";
import { EASE_CSS, prefersReducedMotion } from "../../lib/motion";
import { FlyToCartContext, type FlyToCartApi } from "./flyToCartContext";

/**
 * The signature `flare` (DESIGN.md §8): the photo flies on an arc into the bag,
 * the bag squashes, rays and sparks burst around it and the wordmark spark turns.
 * Callers add the item when the returned promise resolves, so the badge rolls and
 * the mini cart opens exactly as the photo lands.
 */
export default function FlyToCartProvider({ children }: { children: ReactNode }) {
  const target = useRef<HTMLElement | null>(null);

  const registerTarget = useCallback((el: HTMLElement | null, previous?: HTMLElement) => {
    if (el) target.current = el;
    else if (!previous || target.current === previous) target.current = null;
  }, []);

  const fly = useCallback(async (from: Element | null, imageUrl: string) => {
    const bag = target.current;
    await flyImage(from, bag, imageUrl);
    if (!bag || prefersReducedMotion()) return;
    squash(bag.querySelector("svg"));
    burstAt(bag, { rays: 9, length: 10, distance: 17, colors: [FLARE_COLORS.pink, FLARE_COLORS.flare], sparks: 2 });
    document.querySelector("[data-nova-spark]")?.animate(
      [
        { transform: "rotate(0deg) scale(1)" },
        { transform: "rotate(90deg) scale(1.5)", offset: 0.45 },
        { transform: "rotate(90deg) scale(1)" },
      ],
      { duration: 640, easing: EASE_CSS.out }
    );
  }, []);

  const api = useMemo<FlyToCartApi>(() => ({ fly, registerTarget }), [fly, registerTarget]);
  return <FlyToCartContext.Provider value={api}>{children}</FlyToCartContext.Provider>;
}
