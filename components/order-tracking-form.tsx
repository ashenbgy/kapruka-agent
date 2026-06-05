"use client";

import {
  FormEvent,
  useState,
} from "react";
import type { TrackOrderResult } from "@/types/tracking";

interface TrackApiResponse {
  ok: boolean;
  order?: TrackOrderResult;
  error?: string;
}

export function OrderTrackingForm() {
  const [orderNumber, setOrderNumber] =
    useState("");

  const [order, setOrder] =
    useState<TrackOrderResult | null>(
      null,
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const response = await fetch(
        "/api/orders/track",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            order_number:
              orderNumber.trim(),
          }),
        },
      );

      const data =
        (await response.json()) as TrackApiResponse;

      if (
        !response.ok ||
        !data.ok ||
        !data.order
      ) {
        throw new Error(
          data.error ??
            "Unable to track this order.",
        );
      }

      setOrder(data.order);
    } catch (trackingError) {
      setError(
        trackingError instanceof Error
          ? trackingError.message
          : "Unable to track this order.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-xl font-bold text-white">
        Track an order 📦
      </h2>

      <p className="mt-2 text-sm text-zinc-400">
        Enter the final order number from your
        Kapruka confirmation email.
      </p>

      <form
        onSubmit={submit}
        className="mt-5 flex flex-col gap-3 sm:flex-row"
      >
        <input
          value={orderNumber}
          onChange={(event) =>
            setOrderNumber(
              event.target.value,
            )
          }
          placeholder="Example: VIMP34456CB2"
          className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
        />

        <button
          type="submit"
          disabled={
            loading ||
            orderNumber.trim().length < 4
          }
          className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-zinc-950 disabled:opacity-40"
        >
          {loading
            ? "Tracking..."
            : "Track order"}
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {order && (
        <div className="mt-6 space-y-5">
          <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Order {order.order_number}
            </p>

            <h3 className="mt-2 text-lg font-semibold text-emerald-400">
              {order.status_display}
            </h3>

            <div className="mt-4 space-y-1 text-sm text-zinc-300">
              <p>
                Delivery date:{" "}
                {order.delivery_date}
              </p>

              <p>
                Amount:{" "}
                {order.amount.currency}{" "}
                {Number(
                  order.amount.value,
                ).toLocaleString()}
              </p>

              <p>
                Recipient:{" "}
                {order.recipient.name}
              </p>

              <p>
                City:{" "}
                {order.recipient.city}
              </p>

              {order.comments && (
                <p>
                  Notes: {order.comments}
                </p>
              )}
            </div>
          </section>

          {order.progress.length > 0 && (
            <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <h3 className="font-semibold text-white">
                Delivery progress
              </h3>

              <div className="mt-4 space-y-4">
                {order.progress.map(
                  (entry) => (
                    <div
                      key={`${entry.step}-${entry.timestamp}`}
                      className="border-l-2 border-emerald-700 pl-4"
                    >
                      <p className="text-sm text-white">
                        {entry.step}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        {entry.timestamp}
                      </p>
                    </div>
                  ),
                )}
              </div>
            </section>
          )}

          {order.items.length === 0 && (
            <p className="text-xs text-zinc-500">
              Detailed product items are not available
              for this order.
            </p>
          )}
        </div>
      )}
    </section>
  );
}