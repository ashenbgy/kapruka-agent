"use client";

import {
  useEffect,
  useState,
} from "react";
import { ChatShell } from "@/components/chat-shell";
import { CartDrawer } from "@/components/cart-drawer";
import { WishlistDrawer } from "@/components/wishlist-drawer";
import { HelpDrawer } from "@/components/help-drawer";
import { useCartStore } from "@/lib/store/cart-store";
import { useWishlistStore } from "@/lib/store/wishlist-store";

export default function Home() {
  const {
    items,
    openCart,
  } = useCartStore();

  const {
    items: wishlistItems,
    openWishlist,
  } = useWishlistStore();

  const [cartPulse, setCartPulse] =
    useState(false);

  const [wishlistPulse, setWishlistPulse] = useState(false);

  const [helpOpen, setHelpOpen] = useState(false);

  // High contrast mode has been removed; no need to track this state

  // Previously we toggled a high-contrast mode by adding a `high-contrast` class
  // to the <html> element. That feature has been removed, so we no longer
  // modify the root element here.

  const cartCount =
    items.reduce(
      (sum, item) =>
        sum + item.quantity,
      0,
    );

  const wishlistCount = wishlistItems.length;

  useEffect(() => {
    if (cartCount === 0) {
      return;
    }

    const startTimer =
      window.setTimeout(() => {
        setCartPulse(true);
      }, 0);

    const stopTimer =
      window.setTimeout(() => {
        setCartPulse(false);
      }, 500);

    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(stopTimer);
    };
  }, [cartCount]);

  // Add a little pulse animation when items are added to the wishlist
  useEffect(() => {
    if (wishlistCount === 0) {
      return;
    }
    const start = window.setTimeout(() => setWishlistPulse(true), 0);
    const stop = window.setTimeout(() => setWishlistPulse(false), 500);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(stop);
    };
  }, [wishlistCount]);

  return (
    <main
      className="min-h-screen px-4 py-4 text-white sm:px-6 bg-zinc-950"
    >
      <div className="mx-auto max-w-7xl">
        <header className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">
              Kapruka Agent
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Kapruka Gift Mate 🇱🇰
            </h1>

            <p className="mt-1 text-sm text-zinc-400">
              Your AI gift concierge for Sri Lanka
            </p>
          </div>
          <div className="flex items-center gap-3">

            {/* High contrast toggle removed */}

            {/* Help & support */}
            <button
              type="button"
              aria-label="Open help and support"
              onClick={() => setHelpOpen(true)}
              className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-2 text-lg hover:border-emerald-500"
            >
              ❓
            </button>

            {/* Wishlist button */}
            <button
              type="button"
              onClick={openWishlist}
              aria-label={`Open wishlist with ${wishlistCount} items`}
              className={`relative rounded-full border border-zinc-800 bg-zinc-900 px-4 py-3 text-xl transition duration-300 hover:border-emerald-500 ${
                wishlistPulse ? "scale-110" : "scale-100"
              }`}
            >
              ⭐
              {wishlistCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-500 px-1 text-xs font-bold text-zinc-950">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart button */}
            <button
              type="button"
              onClick={openCart}
              aria-label={`Open cart with ${cartCount} items`}
              className={`relative rounded-full border border-zinc-800 bg-zinc-900 px-4 py-3 text-xl transition duration-300 hover:border-emerald-500 ${
                cartPulse ? "scale-110" : "scale-100"
              }`}
            >
              🛒
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-500 px-1 text-xs font-bold text-zinc-950">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </header>

        <ChatShell />
      </div>

      {cartCount > 0 && (
        <button
          type="button"
          onClick={openCart}
          className="fixed bottom-24 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-bold text-zinc-950 shadow-2xl md:hidden"
        >
          🛒 View gift box · {cartCount}{" "}
          {cartCount === 1
            ? "item"
            : "items"}
        </button>
      )}

      <CartDrawer />
      <WishlistDrawer />
      <HelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
    </main>
  );
}