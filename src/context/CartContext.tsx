/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";

import type { Product } from "../data/products";
import { API_BASE_URL } from "../config/api";

export const FREE_SHIPPING_THRESHOLD = 100;
export const FLAT_SHIPPING_FEE = 10;

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedColorImage?: string;
}

export interface AppliedCoupon {
  code: string;
  description?: string;
  type: "percent" | "fixed" | "shipping";
  value: number;
  minOrder: number;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD_TO_CART"; product: Product; selectedColor?: string; selectedColorImage?: string; quantity: number }
  | { type: "REMOVE_FROM_CART"; productId: number; selectedColor?: string }
  | { type: "INCREASE_QUANTITY"; productId: number; selectedColor?: string }
  | { type: "DECREASE_QUANTITY"; productId: number; selectedColor?: string }
  | { type: "CLEAR_CART" };

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, selectedColor?: string, selectedColorImage?: string, quantity?: number) => void;
  removeFromCart: (productId: number, selectedColor?: string) => void;
  increaseQuantity: (productId: number, selectedColor?: string) => void;
  decreaseQuantity: (productId: number, selectedColor?: string) => void;
  clearCart: () => void;
  maxQuantityFor: (item: CartItem) => number;
  cartCount: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  amountToFreeShipping: number;
  coupon: AppliedCoupon | null;
  couponError: string;
  couponLoading: boolean;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const sameLine = (item: CartItem, productId: number, color?: string) =>
  item.product.id === productId && (!color || (item.selectedColor || "") === color);

/** Stock available for a cart line — the colour variant's stock when it has one. */
function maxQuantity(product: Product, color?: string): number {
  const variant = product.colors?.find((c) => c.name === color);
  if (variant && variant.quantity !== undefined && variant.quantity !== null) {
    return Math.max(0, Number(variant.quantity) || 0);
  }
  return Math.max(0, Number(product.stock) || 0);
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_TO_CART": {
      const limit = maxQuantity(action.product, action.selectedColor);
      if (limit <= 0) return state;

      const existing = state.items.find(
        (item) => item.product.id === action.product.id && (item.selectedColor || "") === (action.selectedColor || "")
      );

      if (existing) {
        return {
          items: state.items.map((item) =>
            item === existing
              ? { ...item, product: action.product, quantity: Math.min(item.quantity + action.quantity, limit) }
              : item
          ),
        };
      }

      return {
        items: [
          ...state.items,
          {
            product: action.product,
            quantity: Math.min(action.quantity, limit),
            selectedColor: action.selectedColor,
            selectedColorImage: action.selectedColorImage,
          },
        ],
      };
    }

    case "REMOVE_FROM_CART":
      return { items: state.items.filter((item) => !sameLine(item, action.productId, action.selectedColor)) };

    case "INCREASE_QUANTITY":
      return {
        items: state.items.map((item) =>
          sameLine(item, action.productId, action.selectedColor)
            ? { ...item, quantity: Math.min(item.quantity + 1, maxQuantity(item.product, item.selectedColor)) }
            : item
        ),
      };

    case "DECREASE_QUANTITY":
      return {
        items: state.items
          .map((item) =>
            sameLine(item, action.productId, action.selectedColor) ? { ...item, quantity: item.quantity - 1 } : item
          )
          .filter((item) => item.quantity > 0),
      };

    case "CLEAR_CART":
      return { items: [] };

    default:
      return state;
  }
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode) — cart still works in memory
  }
}

function getInitialState(): CartState {
  const parsed = readStorage<unknown>("nova_cart", []);
  if (!Array.isArray(parsed)) return { items: [] };
  return {
    items: parsed.filter(
      (item: CartItem) =>
        item?.product && typeof item.product.id === "number" && Number.isInteger(item.quantity) && item.quantity > 0
    ),
  };
}

/** Mirrors the server's coupon maths so the totals the shopper sees match the order. */
function calculateDiscount(coupon: AppliedCoupon | null, subtotal: number) {
  if (!coupon || subtotal < coupon.minOrder) return { discount: 0, freeShipping: false };
  if (coupon.type === "percent") return { discount: Math.round(subtotal * coupon.value) / 100, freeShipping: false };
  if (coupon.type === "fixed") return { discount: Math.min(subtotal, coupon.value), freeShipping: false };
  return { discount: 0, freeShipping: true };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, getInitialState);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(() => readStorage("nova_coupon", null));
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => writeStorage("nova_cart", state.items), [state.items]);
  useEffect(() => writeStorage("nova_coupon", coupon), [coupon]);

  const addToCart = useCallback(
    (product: Product, selectedColor?: string, selectedColorImage?: string, quantity = 1) => {
      let color = selectedColor?.trim();
      let colorImage = selectedColorImage?.trim();

      if (!color && product.colors && product.colors.length > 0) {
        color = product.colors[0].name;
        colorImage = colorImage || product.colors[0].image;
      }

      dispatch({
        type: "ADD_TO_CART",
        product,
        selectedColor: color || "Standard",
        selectedColorImage: colorImage || product.image,
        quantity: Math.max(1, Math.floor(quantity)),
      });
      setIsCartOpen(true);
    },
    []
  );

  const removeFromCart = useCallback(
    (productId: number, selectedColor?: string) => dispatch({ type: "REMOVE_FROM_CART", productId, selectedColor }),
    []
  );
  const increaseQuantity = useCallback(
    (productId: number, selectedColor?: string) => dispatch({ type: "INCREASE_QUANTITY", productId, selectedColor }),
    []
  );
  const decreaseQuantity = useCallback(
    (productId: number, selectedColor?: string) => dispatch({ type: "DECREASE_QUANTITY", productId, selectedColor }),
    []
  );
  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
    setCoupon(null);
  }, []);

  const cartCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = Math.round(state.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0) * 100) / 100;

  const totals = useMemo(() => {
    const { discount, freeShipping } = calculateDiscount(coupon, subtotal);
    const shipping = subtotal === 0 || freeShipping || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;
    const total = Math.max(0, subtotal - discount) + shipping;
    return {
      discount,
      shipping,
      total: Math.round(total * 100) / 100,
      amountToFreeShipping: freeShipping ? 0 : Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal),
    };
  }, [coupon, subtotal]);

  const applyCoupon = useCallback(
    async (rawCode: string) => {
      const code = rawCode.trim().toUpperCase();
      if (!code) {
        setCouponError("Enter a coupon code");
        return false;
      }
      setCouponLoading(true);
      setCouponError("");
      try {
        const response = await fetch(`${API_BASE_URL}/api/coupons/validate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, subtotal }),
        });
        const data = await response.json();
        if (!response.ok || !data.coupon) {
          setCouponError(data.message || "That coupon isn't valid");
          return false;
        }
        setCoupon({
          code: data.coupon.code,
          description: data.coupon.description,
          type: data.coupon.type,
          value: Number(data.coupon.value) || 0,
          minOrder: Number(data.coupon.minOrder) || 0,
        });
        return true;
      } catch {
        setCouponError("Couldn't reach the server to check this coupon");
        return false;
      } finally {
        setCouponLoading(false);
      }
    },
    [subtotal]
  );

  const removeCoupon = useCallback(() => {
    setCoupon(null);
    setCouponError("");
  }, []);

  const maxQuantityFor = useCallback((item: CartItem) => maxQuantity(item.product, item.selectedColor), []);
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        maxQuantityFor,
        cartCount,
        subtotal,
        ...totals,
        coupon,
        couponError,
        couponLoading,
        applyCoupon,
        removeCoupon,
        isCartOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
