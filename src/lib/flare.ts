/**
 * The "flare": NOVA's burst of light (docs/DESIGN.md §8). These are plain DOM
 * effects drawn on a fixed overlay with the Web Animations API, so they work
 * from anywhere (cards, modals, the navbar) and never cause React re-renders.
 * They only animate transform and opacity, and do nothing with reduced motion.
 */
import { EASE_CSS, prefersReducedMotion } from "./motion";

const SPARK_PATH = "M12 0C12.9 7.2 16.8 11.1 24 12 16.8 12.9 12.9 16.8 12 24 11.1 16.8 7.2 12.9 0 12 7.2 11.1 11.1 7.2 12 0Z";

export const FLARE_COLORS = {
  pink: "#FF5CA8",
  flare: "#D4167A",
  marigold: "#FFB21E",
  aurora: "#A58BFF",
};

interface BurstOptions {
  rays?: number;
  /** Ray length in px. */
  length?: number;
  /** How far the rays travel from the centre, in px. */
  distance?: number;
  colors?: string[];
  /** Marigold four-point sparks thrown outwards. */
  sparks?: number;
  duration?: number;
  zIndex?: number;
}

function overlay(x: number, y: number, zIndex: number): HTMLDivElement {
  const root = document.createElement("div");
  root.setAttribute("aria-hidden", "true");
  root.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:0;height:0;pointer-events:none;z-index:${zIndex}`;
  document.body.append(root);
  return root;
}

/** A ring of short light rays (and optional sparks) bursting out from a point. */
export function burst(x: number, y: number, options: BurstOptions = {}): void {
  if (prefersReducedMotion()) return;
  const {
    rays = 8,
    length = 11,
    distance = 16,
    colors = [FLARE_COLORS.pink],
    sparks = 0,
    duration = 440,
    zIndex = 120,
  } = options;
  const root = overlay(x, y, zIndex);

  for (let i = 0; i < rays; i++) {
    const angle = (360 / rays) * i + (Math.random() * 12 - 6);
    const ray = document.createElement("i");
    ray.style.cssText = `position:absolute;left:-1.5px;top:0;width:3px;height:${length}px;border-radius:3px;transform-origin:50% 0;background:${colors[i % colors.length]}`;
    root.append(ray);
    ray.animate(
      [
        { transform: `rotate(${angle}deg) translateY(${distance * 0.35}px) scaleY(.2)`, opacity: 1 },
        { transform: `rotate(${angle}deg) translateY(${distance}px) scaleY(1)`, opacity: 1, offset: 0.45 },
        { transform: `rotate(${angle}deg) translateY(${distance * 1.6}px) scaleY(.1)`, opacity: 0 },
      ],
      { duration, easing: EASE_CSS.out, fill: "forwards" }
    );
  }

  for (let i = 0; i < sparks; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = distance * (1.6 + Math.random());
    const spark = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    spark.setAttribute("viewBox", "0 0 24 24");
    spark.style.cssText = "position:absolute;left:-6px;top:-6px;width:12px;height:12px";
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", SPARK_PATH);
    path.setAttribute("fill", FLARE_COLORS.marigold);
    spark.append(path);
    root.append(spark);
    spark.animate(
      [
        { transform: "translate(0,0) scale(.2) rotate(0deg)", opacity: 1 },
        { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(1) rotate(90deg)`, opacity: 1, offset: 0.6 },
        { transform: `translate(${Math.cos(a) * d * 1.2}px,${Math.sin(a) * d * 1.2}px) scale(.3) rotate(140deg)`, opacity: 0 },
      ],
      { duration: duration + 200, easing: EASE_CSS.out, fill: "forwards" }
    );
  }

  window.setTimeout(() => root.remove(), duration + 320);
}

/** Burst centred on an element. */
export function burstAt(el: Element | null, options?: BurstOptions): void {
  if (!el) return;
  const r = el.getBoundingClientRect();
  burst(r.left + r.width / 2, r.top + r.height / 2, options);
}

/** The order-placed celebration: confetti thrown up from a point, falling with gravity. */
export function confetti(x: number, y: number, pieces = 30): void {
  if (prefersReducedMotion()) return;
  const root = overlay(x, y, 125);
  const colors = [FLARE_COLORS.pink, FLARE_COLORS.marigold, FLARE_COLORS.aurora, "#FFFFFF", FLARE_COLORS.flare];
  for (let i = 0; i < pieces; i++) {
    const piece = document.createElement("i");
    const round = i % 3 === 0;
    piece.style.cssText = `position:absolute;left:-4px;top:-6px;width:${round ? 9 : 8}px;height:${round ? 9 : 12}px;border-radius:${round ? "50%" : "2px"};background:${colors[i % colors.length]}`;
    root.append(piece);
    const a = ((-150 + Math.random() * 120) * Math.PI) / 180;
    const v = 170 + Math.random() * 230;
    const dx = Math.cos(a) * v;
    const dy = Math.sin(a) * v;
    const spin = (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 360);
    piece.animate(
      [
        { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        { transform: `translate(${dx * 0.7}px,${dy * 0.75}px) rotate(${spin * 0.4}deg)`, opacity: 1, offset: 0.35 },
        { transform: `translate(${dx}px,${dy * 0.4 + 340}px) rotate(${spin}deg)`, opacity: 0 },
      ],
      { duration: 1100 + Math.random() * 500, easing: "cubic-bezier(.2,.6,.4,1)", fill: "forwards" }
    );
  }
  window.setTimeout(() => root.remove(), 1800);
}

/**
 * Fly a copy of a product photo from `from` to `to` on a real arc: the
 * horizontal leg eases in-out while the vertical leg rises fast, and the photo
 * lifts slightly before shrinking. Resolves when it lands (immediately with
 * reduced motion or when either element is missing).
 */
export function flyImage(from: Element | null, to: Element | null, imageUrl: string): Promise<void> {
  if (prefersReducedMotion() || !from || !to) return Promise.resolve();
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  if (a.width === 0 || b.width === 0) return Promise.resolve();

  const size = Math.max(60, Math.min(a.width, a.height, 150));
  const x0 = a.left + a.width / 2 - size / 2;
  const y0 = a.top + a.height / 2 - size / 2;
  const dx = b.left + b.width / 2 - (x0 + size / 2);
  const dy = b.top + b.height / 2 - (y0 + size / 2);

  const outer = document.createElement("div");
  outer.setAttribute("aria-hidden", "true");
  outer.style.cssText = `position:fixed;left:${x0}px;top:${y0}px;width:${size}px;height:${size}px;z-index:115;pointer-events:none`;
  const mid = document.createElement("div");
  mid.style.cssText = "width:100%;height:100%";
  const img = document.createElement("img");
  img.src = imageUrl;
  img.alt = "";
  img.style.cssText = "width:100%;height:100%;object-fit:cover;border-radius:16px;background:#fff;box-shadow:0 18px 40px -12px rgb(19 14 51 / .55)";
  mid.append(img);
  outer.append(mid);
  document.body.append(outer);

  const duration = 600;
  outer.animate([{ transform: "translateX(0)" }, { transform: `translateX(${dx}px)` }], {
    duration,
    easing: "cubic-bezier(.45,.05,.55,.95)",
    fill: "forwards",
  });
  mid.animate([{ transform: "translateY(0)" }, { transform: `translateY(${dy}px)` }], {
    duration,
    easing: "cubic-bezier(.3,.75,.45,1)",
    fill: "forwards",
  });
  const landing = img.animate(
    [
      { transform: "scale(1) rotate(0deg)", opacity: 1 },
      { transform: "scale(1.06) rotate(-4deg)", opacity: 1, offset: 0.18 },
      { transform: `scale(${(26 / size).toFixed(3)}) rotate(12deg)`, opacity: 0.9 },
    ],
    { duration, easing: "cubic-bezier(.5,0,.75,.4)", fill: "forwards" }
  );

  return new Promise((resolve) => {
    const done = () => {
      outer.remove();
      resolve();
    };
    landing.onfinish = done;
    landing.oncancel = done;
  });
}

/** Squash-and-stretch an icon when something lands in it. */
export function squash(el: Element | null): void {
  if (prefersReducedMotion() || !el) return;
  el.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(1.2,.8)", offset: 0.28 },
      { transform: "scale(.92,1.08)", offset: 0.6 },
      { transform: "scale(1)" },
    ],
    { duration: 460, easing: EASE_CSS.out }
  );
}
