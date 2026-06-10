"use client";

import { useState } from "react";
import { useWishlistStore } from "@/lib/store/wishlist-store";
import { useCartStore } from "@/lib/store/cart-store";

/**
 * A sliding drawer to display the user's saved wishlist items.
 * Items can be removed or added to the cart from this view.
 * A share button lets the user copy a sharable wishlist link.
 */
export function WishlistDrawer() {
  const {
    items,
    isOpen,
    closeWishlist,
    removeItem,
    clear,
  } = useWishlistStore();

  const { addItem } = useCartStore();

  const [copied, setCopied] = useState(false);

  if (!isOpen) {
    return null;
  }

  function handleClose() {
    setCopied(false);
    closeWishlist();
  }

  async function copyWishlistLink() {
    try {
      const ids = items.map((item) => item.id).join(",");
      const url = `${window.location.origin}?wishlist=${encodeURIComponent(ids)}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy wishlist link", error);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
      <aside className="h-full w-full max-w-md overflow-y-auto bg-zinc-950 p-6 shadow-2xl">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Wishlist ⭐</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white"
          >
            Close
          </button>
        </div>

        {items.length === 0 ? (
          <p className="mt-8 text-zinc-400">Your wishlist is empty.</p>
        ) : (
          <>
            <div className="mt-6 space-y-4">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
                >
                  <h3 className="font-semibold text-white">{item.name}</h3>
                  <p className="mt-1 text-sm text-emerald-400">
                    {item.currency} {item.price.toLocaleString()}
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        addItem(item);
                      }}
                      className="rounded-lg border border-zinc-700 px-3 py-1 text-sm text-white hover:border-emerald-500"
                    >
                      Add to cart
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-sm text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8 border-t border-zinc-800 pt-5">
              <button
                type="button"
                onClick={copyWishlistLink}
                className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-zinc-950 hover:bg-emerald-400"
              >
                {copied ? "Link copied! 📋" : "Share wishlist"}
              </button>
              <button
                type="button"
                onClick={clear}
                className="mt-3 w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm text-zinc-300"
              >
                Clear wishlist
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}