"use client";

import type { TrackOrderResult } from "@/types/tracking";

export function TrackedOrderCard({
  order,
}: {
  order: TrackOrderResult;
}) {
  return (
    <div className="mt-4 space-y-5 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
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
        <p className="text-xs text-zinc-500 text-center">
          Detailed product items are not available
          for this order.
        </p>
      )}
    </div>
  );
}
