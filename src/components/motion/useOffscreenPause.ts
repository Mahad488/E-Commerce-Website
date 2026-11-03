import { useEffect, useState, type RefObject } from "react";

/**
 * True while the element is off screen or the tab is hidden. Ambient loops use
 * it (via data-paused) so they never burn battery where nobody can see them.
 */
export function useOffscreenPause(ref: RefObject<Element | null>): boolean {
  const [offscreen, setOffscreen] = useState(false);
  const [hidden, setHidden] = useState(() => typeof document !== "undefined" && document.hidden);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setOffscreen(!entry.isIntersecting));
    io.observe(node);
    return () => io.disconnect();
  }, [ref]);

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return offscreen || hidden;
}
