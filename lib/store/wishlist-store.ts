import { create } from "zustand";
import type { KaprukaSearchProduct } from "@/types/kapruka";

interface WishlistState {
  /**
   * List of products saved to the wishlist. Each product is a search result
   * returned from the MCP tools. Duplicates are not allowed.
   */
  items: KaprukaSearchProduct[];

  /**
   * Whether the wishlist drawer is open. When true the wishlist overlay is shown.
   */
  isOpen: boolean;

  /**
   * Open the wishlist drawer.
   */
  openWishlist: () => void;

  /**
   * Close the wishlist drawer.
   */
  closeWishlist: () => void;

  /**
   * Add a product to the wishlist. If it already exists, it will not be
   * duplicated.
   */
  addItem: (product: KaprukaSearchProduct) => void;

  /**
   * Remove a product from the wishlist by its id.
   */
  removeItem: (id: string) => void;

  /**
   * Clear all wishlist items.
   */
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>((set) => ({
  items: [],
  isOpen: false,

  openWishlist: () => set({ isOpen: true }),
  closeWishlist: () => set({ isOpen: false }),

  addItem: (product) =>
    set((state) => {
      // Prevent duplicates
      if (state.items.some((p) => p.id === product.id)) {
        return state;
      }
      return {
        items: [...state.items, product],
      };
    }),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((p) => p.id !== id),
    })),

  clear: () => set({ items: [], isOpen: false }),
}));