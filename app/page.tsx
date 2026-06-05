"use client";

import { FormEvent, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { CartDrawer } from "@/components/cart-drawer";
import { useCartStore } from "@/lib/store/cart-store";
import type { KaprukaSearchProduct } from "@/types/kapruka";

interface SearchApiResponse {
  ok: boolean;
  products?: KaprukaSearchProduct[];
  nextCursor?: string;
  error?: string;
}

export default function Home() {
  const [query, setQuery] = useState("cake");
  const [products, setProducts] = useState<
    KaprukaSearchProduct[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { items, addItem, openCart } = useCartStore();

  async function search(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/products/search",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: query,
            currency: "LKR",
          }),
        },
      );

      const data =
        (await response.json()) as SearchApiResponse;

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error ?? "Search failed.",
        );
      }

      setProducts(data.products ?? []);
    } catch (searchError) {
      console.error(searchError);

      setError(
        "Unable to search Kapruka products right now.",
      );
    } finally {
      setLoading(false);
    }
  }

  const cartCount = items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
              Kapruka Gift Mate 🇱🇰
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              Find the perfect gift
            </h1>

            <p className="mt-3 text-zinc-400">
              Search Kapruka&apos;s live catalog.
            </p>
          </div>

          <button
            type="button"
            onClick={openCart}
            className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm hover:border-zinc-600"
          >
            Cart: {cartCount} 🛒
          </button>
        </header>

        <form
          onSubmit={search}
          className="mt-8 flex flex-col gap-3 sm:flex-row"
        >
          <input
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Try: cake, flowers, chocolates..."
            className="flex-1 rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-4 outline-none focus:border-emerald-400"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-emerald-500 px-6 py-4 font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading
              ? "Searching..."
              : "Search products"}
          </button>
        </form>

        {error && (
          <p className="mt-6 text-red-400">
            {error}
          </p>
        )}

        {products.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold">
              Live Kapruka results
            </h2>

            <p className="mt-1 text-sm text-zinc-400">
              {products.length} products found
            </p>

            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addItem}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <CartDrawer />
    </main>
  );
}