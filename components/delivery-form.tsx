"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useCartStore } from "@/lib/store/cart-store";
import { useCheckoutStore } from "@/lib/store/checkout-store";
import type {
  CartDeliveryCheck,
  KaprukaDeliveryCheck,
  KaprukaDeliveryCity,
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

interface DeliveryCitiesApiResponse {
  ok: boolean;
  cities?: KaprukaDeliveryCity[];
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
    useState(city);

  const [selectedCity, setSelectedCity] =
    useState(city);

  const [localDate, setLocalDate] =
    useState(deliveryDate);

  const [suggestions, setSuggestions] =
    useState<KaprukaDeliveryCity[]>(
      [],
    );

  const [
    searchingCities,
    setSearchingCities,
  ] = useState(false);

  const [
    citySearchCompleted,
    setCitySearchCompleted,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Colombo",
  });

  useEffect(() => {
    const query =
      localCity.trim();

    if (
      query.length < 2 ||
      query === selectedCity
    ) {
      return;
    }

    const controller =
      new AbortController();

    const timer =
      window.setTimeout(
        async () => {
          setSearchingCities(true);

          try {
            const response =
              await fetch(
                "/api/delivery/cities",
                {
                  method: "POST",
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                  body: JSON.stringify({
                    query,
                    limit: 8,
                  }),
                  signal:
                    controller.signal,
                },
              );

            const data =
              (await response.json()) as DeliveryCitiesApiResponse;

            if (
              response.ok &&
              data.ok
            ) {
              setSuggestions(
                data.cities ?? [],
              );

              setCitySearchCompleted(true);
            }
          } catch (cityError) {
            if (
              cityError instanceof Error &&
              cityError.name !==
                "AbortError"
            ) {
              console.error(
                cityError,
              );
            }
          } finally {
            setSearchingCities(
              false,
            );
          }
        },
        250,
      );

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [localCity, selectedCity]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (items.length === 0) {
      setError("Add at least one product before checking delivery.");
      return;
    }

    if (
      !selectedCity ||
      selectedCity !== localCity ||
      !localDate
    ) {
      setError(
        "Select a valid Kapruka delivery city and date.",
      );

      return;
    }

    if (localDate < today) {
      setError("Delivery date must be today or a future date.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      setDeliveryDetails(
        selectedCity,
        localDate,
      );

      const checks = await Promise.all(
        items.map(async (item) => {
          const response = await fetch("/api/delivery/check", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              city: selectedCity,
              delivery_date: localDate,
              product_id: item.id,
            }),
          });

          const data = (await response.json()) as DeliveryApiResponse;

          if (!response.ok || !data.ok || !data.result) {
            throw new Error(
              data.error ?? `Unable to check delivery for ${item.name}.`,
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

  const displayedChecks: CartDeliveryCheck[] = deliveryChecks;

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
        Confirm whether every item can be delivered to your selected city and
        date.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="relative">
          <label
            htmlFor="city"
            className="text-sm text-zinc-300"
          >
            Delivery city
          </label>

          <input
            id="city"
            value={localCity}
            onChange={(event) => {
              setLocalCity(
                event.target.value,
              );

              setSelectedCity("");
              setSuggestions([]);
              setCitySearchCompleted(false);
              setError("");
            }}
            placeholder="Start typing: Kandy, Colombo 03..."
            autoComplete="off"
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
          />

          {searchingCities && (
            <p className="mt-2 text-xs text-zinc-500">
              Finding Kapruka delivery locations...
            </p>
          )}

          {suggestions.length > 0 && (
            <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-950 p-2 shadow-2xl">
              {suggestions.map(
                (suggestion) => (
                  <button
                    key={suggestion.name}
                    type="button"
                    onClick={() => {
                      setLocalCity(
                        suggestion.name,
                      );

                      setSelectedCity(
                        suggestion.name,
                      );

                      setSuggestions([]);
                      setCitySearchCompleted(false);
                      setError("");
                    }}
                    className="block w-full rounded-lg px-3 py-3 text-left text-sm text-zinc-200 hover:bg-zinc-900"
                  >
                    <span className="font-semibold text-white">
                      📍 {suggestion.name}
                    </span>

                    {(suggestion.aliases?.length ?? 0) >
                      0 && (
                      <span className="mt-1 block text-xs text-zinc-500">
                        Also known as:{" "}
                        {suggestion.aliases?.join(
                          ", ",
                        )}
                      </span>
                    )}
                  </button>
                ),
              )}
            </div>
          )}
          {citySearchCompleted &&
            !searchingCities &&
            localCity.trim().length >= 2 &&
            localCity !== selectedCity &&
            suggestions.length === 0 && (
              <p className="mt-2 text-xs text-amber-300">
                No Kapruka delivery locations found. Try another spelling.
              </p>
            )}
        </div>

        <div>
          <label htmlFor="delivery-date" className="text-sm text-zinc-300">
            Delivery date
          </label>

          <input
            id="delivery-date"
            type="date"
            min={today}
            value={localDate}
            onChange={(event) =>
              setLocalDate(event.target.value)
            }
            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
          />

          <p className="mt-2 text-xs text-zinc-500">
            Choose the date you want the gift delivered.
          </p>
        </div>

        <button
          type="submit"
          disabled={
            loading ||
            !selectedCity ||
            selectedCity !== localCity ||
            !localDate
          }
          className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          {loading ? "Checking every item..." : "Check delivery"}
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {displayedChecks.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="font-semibold text-white">Delivery results</h3>

          {displayedChecks.map((check) => (
            <article
              key={check.productId}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
            >
              <p className="font-medium text-white">{check.productName}</p>

              <p
                className={`mt-2 text-sm ${
                  check.result.available ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {check.result.available
                  ? "✓ Delivery available"
                  : "✕ Delivery unavailable"}
              </p>

              {check.result.flatRate !== undefined && (
                <p className="mt-1 text-sm text-zinc-300">
                  Delivery fee: {check.result.currency}{" "}
                  {check.result.flatRate.toLocaleString()}
                </p>
              )}

              {check.result.warning && (
                <p className="mt-3 rounded-lg bg-amber-950/40 p-3 text-xs text-amber-300">
                  ⚠️ {check.result.warning}
                </p>
              )}
            </article>
          ))}

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