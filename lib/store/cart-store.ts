import { create } from "zustand";
import { useCheckoutStore } from "@/lib/store/checkout-store";
import type { KaprukaSearchProduct } from "@/types/kapruka";

export interface CartItem
  extends KaprukaSearchProduct {
  quantity: number;
  icingText?: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;

  openCart: () => void;
  closeCart: () => void;

  addItem: (
    product: KaprukaSearchProduct,
  ) => void;

  increaseQuantity: (
    productId: string,
  ) => void;

  decreaseQuantity: (
    productId: string,
  ) => void;

  removeItem: (
    productId: string,
  ) => void;

  updateIcingText: (
    productId: string,
    icingText: string,
  ) => void;

  clearCart: () => void;
}

function invalidateCheckout() {
  useCheckoutStore
    .getState()
    .invalidateDelivery();
}

export const useCartStore =
  create<CartState>((set) => ({
    items: [],
    isOpen: false,

    openCart: () =>
      set({
        isOpen: true,
      }),

    closeCart: () =>
      set({
        isOpen: false,
      }),

    addItem: (product) => {
      invalidateCheckout();

      set((state) => {
        const existingItem =
          state.items.find(
            (item) =>
              item.id === product.id,
          );

        if (existingItem) {
          return {
            items: state.items.map(
              (item) =>
                item.id === product.id
                  ? {
                      ...item,
                      quantity:
                        item.quantity +
                        1,
                    }
                  : item,
            ),
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
        };
      });
    },

    increaseQuantity: (
      productId,
    ) => {
      invalidateCheckout();

      set((state) => ({
        items: state.items.map(
          (item) =>
            item.id === productId
              ? {
                  ...item,
                  quantity:
                    item.quantity +
                    1,
                }
              : item,
        ),
      }));
    },

    decreaseQuantity: (
      productId,
    ) => {
      invalidateCheckout();

      set((state) => ({
        items: state.items
          .map((item) =>
            item.id === productId
              ? {
                  ...item,
                  quantity:
                    item.quantity -
                    1,
                }
              : item,
          )
          .filter(
            (item) =>
              item.quantity > 0,
          ),
      }));
    },

    removeItem: (productId) => {
      invalidateCheckout();

      set((state) => ({
        items: state.items.filter(
          (item) =>
            item.id !== productId,
        ),
      }));
    },

    updateIcingText: (
      productId,
      icingText,
    ) => {
      invalidateCheckout();

      set((state) => ({
        items: state.items.map(
          (item) =>
            item.id === productId
              ? {
                  ...item,
                  icingText,
                }
              : item,
        ),
      }));
    },

    clearCart: () => {
      invalidateCheckout();

      set({
        items: [],
        isOpen: false,
      });
    },
  }));