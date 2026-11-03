/**
 * NOVA motion tokens (docs/DESIGN.md §8). Every animation in the app takes its
 * timing from here so the whole site moves as one system.
 */
import type { Transition } from "motion/react";

type Bezier = [number, number, number, number];

export const EASE = {
  out: [0.22, 1, 0.36, 1] as Bezier,
  in: [0.55, 0, 1, 0.45] as Bezier,
  inOut: [0.65, 0, 0.35, 1] as Bezier,
  pop: [0.34, 1.56, 0.64, 1] as Bezier,
};

/** CSS strings of the same curves, for the Web Animations API and inline styles. */
export const EASE_CSS = {
  out: "cubic-bezier(.22,1,.36,1)",
  in: "cubic-bezier(.55,0,1,.45)",
  inOut: "cubic-bezier(.65,0,.35,1)",
  pop: "cubic-bezier(.34,1.56,.64,1)",
};

/** Durations in seconds (motion) — multiply by 1000 for the Web Animations API. */
export const DUR = {
  instant: 0.09,
  quick: 0.16,
  base: 0.24,
  slow: 0.42,
  signature: 1.2,
};

export const SPRING = {
  /** Buttons, chips, toggles: no visible overshoot. */
  snappy: { type: "spring", stiffness: 520, damping: 34 } satisfies Transition,
  /** Drawers, modals, bottom sheets. */
  sheet: { type: "spring", stiffness: 380, damping: 38 } satisfies Transition,
  /** Grid reflow, shared image, tab indicator. */
  layout: { type: "spring", stiffness: 300, damping: 32 } satisfies Transition,
  /** Small things only (badges, heart): overshoot allowed. */
  pop: { type: "spring", stiffness: 600, damping: 16 } satisfies Transition,
};

/** True when the visitor asked their OS for less motion. Safe to call outside React. */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** True on devices with a real hover pointer (desktop). Touch devices get no hover-only effects. */
export function hasFinePointer(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}
