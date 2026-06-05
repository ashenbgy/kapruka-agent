"use client";

import { useCartStore } from "@/lib/store/cart-store";
import { useCheckoutStore } from "@/lib/store/checkout-store";

interface OrderReviewProps {
  onBack: () => void;
}

export function OrderReview({
  onBack,
}: OrderReviewProps) {
  const { items } =
    useCartStore();

  const checkout =
    useCheckoutStore();

  const subtotal =
    items.reduce(
      (sum, item) =>
        sum +
        item.price *
          item.quantity,
      0,
    );

  const deliveryFee =
    checkout.deliveryChecks.reduce(
      (highestFee, check) =>
        Math.max(
          highestFee,
          check.result.flatRate ?? 0,
        ),
      0,
    );

  const total =
    subtotal + deliveryFee;

  return (
    <section>
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-zinc-400 hover:text-white"
      >
        ← Back to customer details
      </button>

      <h2 className="mt-5 text-xl font-bold text-white">
        Review your order 🧾
      </h2>

      <div className="mt-6 space-y-4">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="font-semibold text-white">
            Cart
          </h3>

          <div className="mt-3 space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between gap-4 text-sm"
              >
                <span className="text-zinc-300">
                  {item.quantity} ×{" "}
                  {item.name}
                </span>

                <span className="whitespace-nowrap text-white">
                  {item.currency}{" "}
                  {(
                    item.price *
                    item.quantity
                  ).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>

        <SummarySection title="Delivery">
          <p>{checkout.city}</p>
          <p>{checkout.deliveryDate}</p>
          <p>
            {checkout.address.addressLine1}
          </p>

          {checkout.address
            .addressLine2 && (
            <p>
              {
                checkout.address
                  .addressLine2
              }
            </p>
          )}

          {checkout.address.postalCode && (
            <p>
              Postal code:{" "}
              {
                checkout.address
                  .postalCode
              }
            </p>
          )}
        </SummarySection>

        <SummarySection title="Recipient">
          <p>{checkout.recipient.name}</p>
          <p>{checkout.recipient.phone}</p>

          {checkout.recipient.email && (
            <p>
              {checkout.recipient.email}
            </p>
          )}
        </SummarySection>

        <SummarySection title="Sender">
          <p>{checkout.sender.name}</p>
          <p>{checkout.sender.phone}</p>

          {checkout.sender.email && (
            <p>{checkout.sender.email}</p>
          )}
        </SummarySection>

        {checkout.giftMessage && (
          <SummarySection title="Gift message">
            <p>
              “{checkout.giftMessage}”
            </p>
          </SummarySection>
        )}

        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="space-y-2 text-sm">
            <PriceRow
              label="Subtotal"
              value={subtotal}
            />

            <PriceRow
              label="Delivery fee"
              value={deliveryFee}
            />

            <div className="border-t border-zinc-800 pt-3">
              <PriceRow
                label="Estimated total"
                value={total}
                important
              />
            </div>
          </div>
        </section>

        <label className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <input
            type="checkbox"
            checked={
              checkout.checkoutConfirmed
            }
            onChange={(event) =>
              checkout.setCheckoutConfirmed(
                event.target.checked,
              )
            }
            className="mt-1"
          />

          <span className="text-sm text-zinc-300">
            I reviewed the products,
            recipient details, delivery
            address, and delivery date.
            Create my secure checkout link.
          </span>
        </label>

        <button
          type="button"
          disabled={
            !checkout.checkoutConfirmed
          }
          className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Create secure checkout link
        </button>

        <p className="text-xs text-zinc-500">
          The button is intentionally not
          connected yet. Inspect the live
          order-creation schema before enabling
          real guest checkout.
        </p>
      </div>
    </section>
  );
}

interface SummarySectionProps {
  title: string;
  children: React.ReactNode;
}

function SummarySection({
  title,
  children,
}: SummarySectionProps) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="font-semibold text-white">
        {title}
      </h3>

      <div className="mt-3 space-y-1 text-sm text-zinc-300">
        {children}
      </div>
    </section>
  );
}

interface PriceRowProps {
  label: string;
  value: number;
  important?: boolean;
}

function PriceRow({
  label,
  value,
  important = false,
}: PriceRowProps) {
  return (
    <div
      className={`flex justify-between gap-4 ${
        important
          ? "text-base font-semibold text-white"
          : "text-zinc-300"
      }`}
    >
      <span>{label}</span>

      <span>
        LKR {value.toLocaleString()}
      </span>
    </div>
  );
}