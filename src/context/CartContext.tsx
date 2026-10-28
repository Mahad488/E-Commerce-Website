/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from "react";

import type { Product } from "../data/products";

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedColorImage?: string;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD_TO_CART"; product: Product; selectedColor?: string; selectedColorImage?: string }
  | { type: "REMOVE_FROM_CART"; productId: number; selectedColor?: string }
  | { type: "INCREASE_QUANTITY"; productId: number; selectedColor?: string }
  | { type: "DECREASE_QUANTITY"; productId: number; selectedColor?: string }
  | { type: "CLEAR_CART" };

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, selectedColor?: string, selectedColorImage?: string) => void;
  removeFromCart: (productId: number, selectedColor?: string) => void;
  increaseQuantity: (productId: number, selectedColor?: string) => void;
  decreaseQuantity: (productId: number, selectedColor?: string) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
  shipping: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const initialState: CartState = {
  items: [],
};

function cartReducer(
  state: CartState,
  action: CartAction
): CartState {
  switch (action.type) {
    case "ADD_TO_CART": {
      const existingItem = state.items.find(
        (item) =>
          item.product.id === action.product.id &&
          (item.selectedColor || "") === (action.selectedColor || "")
      );

      if (existingItem) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.product.id === action.product.id &&
            (item.selectedColor || "") === (action.selectedColor || "")
              ? {
                  ...item,
                  quantity: Math.min(
                    item.quantity + 1,
                    item.product.stock
                  ),
                }
              : item
          ),
        };
      }

      if (action.product.stock <= 0) {
        return state;
      }

      return {
        ...state,
        items: [
          ...state.items,
          {
            product: action.product,
            quantity: 1,
            selectedColor: action.selectedColor,
            selectedColorImage: action.selectedColorImage,
          },
        ],
      };
    }

    case "REMOVE_FROM_CART":
      return {
        ...state,
        items: state.items.filter(
          (item) =>
            !(
              item.product.id === action.productId &&
              (!action.selectedColor || item.selectedColor === action.selectedColor)
            )
        ),
      };

    case "INCREASE_QUANTITY":
      return {
        ...state,
        items: state.items.map((item) =>
          item.product.id === action.productId &&
          (!action.selectedColor || item.selectedColor === action.selectedColor)
            ? {
                ...item,
                quantity: Math.min(
                  item.quantity + 1,
                  item.product.stock
                ),
              }
            : item
        ),
      };

    case "DECREASE_QUANTITY":
      return {
        ...state,
        items: state.items
          .map((item) =>
            item.product.id === action.productId &&
            (!action.selectedColor || item.selectedColor === action.selectedColor)
              ? {
                  ...item,
                  quantity: item.quantity - 1,
                }
              : item
          )
          .filter((item) => item.quantity > 0),
      };

    case "CLEAR_CART":
      return {
        items: [],
      };

    default:
      return state;
  }
}

function getInitialState(): CartState {
  try {
    const savedCart = localStorage.getItem("nova_cart");

    if (savedCart) {
      const parsed = JSON.parse(savedCart);

      if (Array.isArray(parsed)) {
        return {
          items: parsed.filter(
            (item: CartItem) =>
              item.product &&
              typeof item.product.id === "number" &&
              Number.isInteger(item.quantity) &&
              item.quantity > 0
          ),
        };
      }
    }
  } catch {
    console.error("Unable to load saved cart");
  }

  return initialState;
}

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [state, dispatch] = useReducer(
    cartReducer,
    undefined,
    getInitialState
  );

  useEffect(() => {
    localStorage.setItem(
      "nova_cart",
      JSON.stringify(state.items)
    );
  }, [state.items]);

  const addToCart = (product: Product, selectedColor?: string, selectedColorImage?: string) => {
    let resolvedColor = selectedColor?.trim();
    let resolvedColorImage = selectedColorImage?.trim();

    if (!resolvedColor && product.colors && product.colors.length > 0) {
      resolvedColor = product.colors[0].name;
      if (!resolvedColorImage && product.colors[0].image) {
        resolvedColorImage = product.colors[0].image;
      }
    }

    if (!resolvedColor) {
      resolvedColor = "Standard";
    }

    dispatch({
      type: "ADD_TO_CART",
      product,
      selectedColor: resolvedColor,
      selectedColorImage: resolvedColorImage || product.image,
    });
  };

  const removeFromCart = (productId: number, selectedColor?: string) => {
    dispatch({ type: "REMOVE_FROM_CART", productId, selectedColor });
  };

  const increaseQuantity = (productId: number, selectedColor?: string) => {
    dispatch({ type: "INCREASE_QUANTITY", productId, selectedColor });
  };

  const decreaseQuantity = (productId: number, selectedColor?: string) => {
    dispatch({ type: "DECREASE_QUANTITY", productId, selectedColor });
  };

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" });
  };

  const cartCount = state.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const subtotal = state.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const shipping = subtotal === 0 || subtotal >= 100 ? 0 : 10;

  const total = subtotal + shipping;

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        cartCount,
        subtotal,
        shipping,
        total,
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