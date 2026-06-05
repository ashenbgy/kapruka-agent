"use client";

import {
  FormEvent,
  useState,
} from "react";
import { useCartStore } from "@/lib/store/cart-store";
import { useCheckoutStore } from "@/lib/store/checkout-store";
import type {
  CartDeliveryCheck,
  KaprukaDeliveryCheck,
} from "@/types/kapruka";

interface DeliveryFormProps {
  onBack: () => void;
  onContinue: () => void;
}

interface DeliveryApiResponse {
  ok: boolean;
  result?: KaprukaDeliveryCheck;
  error?: string;
}

export function DeliveryForm({
  onBack,
  onContinue,
}: DeliveryFormProps) {
  const { items } = useCartStore();

  const {
    city,
    deliveryDate,
    deliveryChecks,
    deliveryValidated,
    setDeliveryDetails,
    setDeliveryChecks,
  } = useCheckoutStore();

  const [localCity, setLocalCity] =
    useState(city || "Kandy");

  const [localDate, setLocalDate] =
    useState(deliveryDate);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (items.length === 0) {
      setError(
        "Add at least one product before checking delivery.",
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      setDeliveryDetails(
        localCity,
        localDate,
      );

      const checks =
        await Promise.all(
          items.map(async (item) => {
            const response = await fetch(
              "/api/delivery/check",
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  city: localCity,
                  delivery_date:
                    localDate,
                  product_id:
                    item.id,
                }),
              },
            );

            const data =
              (await response.json()) as DeliveryApiResponse;

            if (
              !response.ok ||
              !data.ok ||
              !data.result
            ) {
              throw new Error(
                data.error ??
                  `Unable to check ${item.name}.`,
              );
            }

            return {
              productId: item.id,
              productName: item.name,
              result: data.result,
            };
          }),
        );

      setDeliveryChecks(checks);
    } catch (deliveryError) {
      console.error(deliveryError);

      setError(
        deliveryError instanceof Error
          ? deliveryError.message
          : "Unable to verify delivery.",
      );
    } finally {
      setLoading(false);
    }
  }

  const displayedChecks:
    CartDeliveryCheck[] =
    deliveryChecks;

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

      <p className="mt-2 text-sm text-zinc-400">
        Confirm whether every item can be delivered
        to your selected city and date.
      </p>

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
            value={localCity}
            onChange={(event) =>
              setLocalCity(
                event.target.value,
              )
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
            value={localDate}
            onChange={(event) =>
              setLocalDate(
                event.target.value,
              )
            }
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
          />
        </div>

        <button
          type="submit"
          disabled={
            loading ||
            !localCity ||
            !localDate
          }
          className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          {loading
            ? "Checking every item..."
            : "Check delivery"}
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {displayedChecks.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="font-semibold text-white">
            Delivery results
          </h3>

          {displayedChecks.map(
            (check) => (
              <article
                key={check.productId}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
              >
                <p className="font-medium text-white">
                  {check.productName}
                </p>

                <p
                  className={`mt-2 text-sm ${
                    check.result
                      .available
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {check.result
                    .available
                    ? "✓ Delivery available"
                    : "✕ Delivery unavailable"}
                </p>

                {check.result
                  .flatRate !==
                  undefined && (
                  <p className="mt-1 text-sm text-zinc-300">
                    Delivery fee:{" "}
                    {
                      check.result
                        .currency
                    }{" "}
                    {check.result.flatRate.toLocaleString()}
                  </p>
                )}

                {check.result
                  .warning && (
                  <p className="mt-3 rounded-lg bg-amber-950/40 p-3 text-xs text-amber-300">
                    ⚠️{" "}
                    {
                      check.result
                        .warning
                    }
                  </p>
                )}
              </article>
            ),
          )}

          {deliveryValidated && (
            <div className="rounded-xl border border-emerald-800 bg-emerald-950/40 p-4">
              <p className="font-medium text-emerald-300">
                ✓ Delivery confirmed for every item
              </p>

              <button
                type="button"
                onClick={onContinue}
                className="mt-4 w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-zinc-950 hover:bg-emerald-400"
              >
                Continue to customer details
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}