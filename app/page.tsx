"use client";

import { ChatShell } from "@/components/chat-shell";
import { CartDrawer } from "@/components/cart-drawer";
import { useCartStore } from "@/lib/store/cart-store";

export default function Home() {
  const {
    items,
    openCart,
  } = useCartStore();

  const cartCount =
    items.reduce(
      (sum, item) =>
        sum + item.quantity,
      0,
    );

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
            className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm hover:border-emerald-500"
          >
            Cart: {cartCount} 🛒
          </button>
        </header>

        <ChatShell />
      </div>

      <CartDrawer />
    </main>
  );
}