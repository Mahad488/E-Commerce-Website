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
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD_TO_CART"; product: Product }
  | { type: "REMOVE_FROM_CART"; productId: number }
  | { type: "INCREASE_QUANTITY"; productId: number }
  | { type: "DECREASE_QUANTITY"; productId: number }
  | { type: "CLEAR_CART" };

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  increaseQuantity: (productId: number) => void;
  decreaseQuantity: (productId: number) => void;
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
        (item) => item.product.id === action.product.id
      );

      if (existingItem) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.product.id === action.product.id
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
          },
        ],
      };
    }

    case "REMOVE_FROM_CART":
      return {
        ...state,
        items: state.items.filter(
          (item) => item.product.id !== action.productId
        ),
      };

    case "INCREASE_QUANTITY":
      return {
        ...state,
        items: state.items.map((item) =>
          item.product.id === action.productId
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
            item.product.id === action.productId
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

  const addToCart = (product: Product) => {
    dispatch({ type: "ADD_TO_CART", product });
  };

  const removeFromCart = (productId: number) => {
    dispatch({ type: "REMOVE_FROM_CART", productId });
  };

  const increaseQuantity = (productId: number) => {
    dispatch({ type: "INCREASE_QUANTITY", productId });
  };

  const decreaseQuantity = (productId: number) => {
    dispatch({ type: "DECREASE_QUANTITY", productId });
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