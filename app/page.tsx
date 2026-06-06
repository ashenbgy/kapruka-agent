"use client";

import {
  useEffect,
  useState,
} from "react";
import { ChatShell } from "@/components/chat-shell";
import { CartDrawer } from "@/components/cart-drawer";
import { useCartStore } from "@/lib/store/cart-store";

export default function Home() {
  const {
    items,
    openCart,
  } = useCartStore();

  const [cartPulse, setCartPulse] =
    useState(false);

  const cartCount =
    items.reduce(
      (sum, item) =>
        sum + item.quantity,
      0,
    );

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

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-4 text-white sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">
              Kapruka Agent
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Kapruka Gift Mate 🇱🇰
            </h1>
          </div>

          <button
            type="button"
            onClick={openCart}
            aria-label={`Open cart with ${cartCount} items`}
            className={`relative rounded-full border border-zinc-800 bg-zinc-900 px-4 py-3 text-xl transition duration-300 hover:border-emerald-500 ${
              cartPulse
                ? "scale-110"
                : "scale-100"
            }`}
          >
            🛒

            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-500 px-1 text-xs font-bold text-zinc-950">
                {cartCount}
              </span>
            )}
          </button>
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
    </main>
  );
}