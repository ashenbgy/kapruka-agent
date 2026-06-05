import { create } from "zustand";
import type { KaprukaSearchProduct } from "@/types/kapruka";

export interface CartItem extends KaprukaSearchProduct {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: KaprukaSearchProduct) => void;
  increaseQuantity: (productId: string) => void;
  decreaseQuantity: (productId: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  isOpen: false,

  openCart: () => set({ isOpen: true }),

  closeCart: () => set({ isOpen: false }),

  addItem: (product) =>
    set((state) => {
      const existingItem = state.items.find(
        (item) => item.id === product.id,
      );

      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.id === product.id
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                }
              : item,
          ),
          isOpen: true,
        };
      }

      return {
        items: [
          ...state.items,
          {
            ...product,
            quantity: 1,
          },
        ],
        isOpen: true,
      };
    }),

  increaseQuantity: (productId) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item,
      ),
    })),

  decreaseQuantity: (productId) =>
    set((state) => ({
      items: state.items
        .map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    })),

  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter(
        (item) => item.id !== productId,
      ),
    })),

  clearCart: () =>
    set({
      items: [],
      isOpen: false,
    }),
}));