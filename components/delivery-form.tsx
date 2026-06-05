"use client";

import { FormEvent, useState } from "react";
import { useCartStore } from "@/lib/store/cart-store";

interface DeliveryFormProps {
  onBack: () => void;
}

export function DeliveryForm({
  onBack,
}: DeliveryFormProps) {
  const { items } = useCartStore();

  const [city, setCity] = useState("Kandy");
  const [deliveryDate, setDeliveryDate] =
    useState("");
  const [result, setResult] =
    useState<unknown>(null);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] = useState("");

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (items.length === 0) {
      setError("Add an item before checking delivery.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const firstItem = items[0];

      const response = await fetch(
        "/api/delivery/check",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            city,
            delivery_date: deliveryDate,
            product_id: firstItem.id,
          }),
        },
      );

      const data: unknown =
        await response.json();

      if (!response.ok) {
        throw new Error(
          "Unable to check delivery.",
        );
      }

      setResult(data);
    } catch (deliveryError) {
      console.error(deliveryError);

      setError(
        "Unable to verify delivery right now.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-zinc-400 hover:text-white"
      >
        ← Back to cart
      </button>

      <h2 className="mt-5 text-xl font-bold text-white">
        Check delivery 🚚
      </h2>

      <form
        onSubmit={submit}
        className="mt-6 space-y-4"
      >
        <div>
          <label
            htmlFor="city"
            className="text-sm text-zinc-300"
          >
            Delivery city
          </label>

          <input
            id="city"
            value={city}
            onChange={(event) =>
              setCity(event.target.value)
            }
            placeholder="Example: Kandy"
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
          />
        </div>

        <div>
          <label
            htmlFor="delivery-date"
            className="text-sm text-zinc-300"
          >
            Delivery date
          </label>

          <input
            id="delivery-date"
            type="date"
            value={deliveryDate}
            onChange={(event) =>
              setDeliveryDate(event.target.value)
            }
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
          />
        </div>

        <button
          type="submit"
          disabled={
            loading ||
            !city ||
            !deliveryDate
          }
          className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-zinc-950 disabled:opacity-50"
        >
          {loading
            ? "Checking..."
            : "Check delivery"}
        </button>
      </form>

      {error && (
        <p className="mt-4 text-sm text-red-400">
          {error}
        </p>
      )}

      {result !== null && (
        <pre className="mt-5 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-xs text-zinc-300">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </section>
  );
}