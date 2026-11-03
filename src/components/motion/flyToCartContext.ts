import { createContext, useCallback, useContext } from "react";

export interface FlyToCartApi {
  /** Fly a product photo from `from` into the navbar bag. Resolves when it lands. */
  fly: (from: Element | null, imageUrl: string) => Promise<void>;
  registerTarget: (el: HTMLElement | null, previous?: HTMLElement) => void;
}

export const FlyToCartContext = createContext<FlyToCartApi | null>(null);

const noop: FlyToCartApi = {
  fly: () => Promise.resolve(),
  registerTarget: () => undefined,
};

/** `const { fly } = useFlyToCart(); fly(imageEl, url).then(() => addToCart(product))` */
export function useFlyToCart(): FlyToCartApi {
  return useContext(FlyToCartContext) ?? noop;
}

/** Ref callback for the element products fly into (the navbar bag button). */
export function useFlyTarget() {
  const { registerTarget } = useFlyToCart();
  return useCallback(
    (el: HTMLElement | null) => {
      if (!el) return;
      registerTarget(el);
      return () => registerTarget(null, el);
    },
    [registerTarget]
  );
}
