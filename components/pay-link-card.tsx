import { useCheckoutStore } from "@/lib/store/checkout-store";

export function PayLinkCard() {
  const checkout =
    useCheckoutStore();

  if (!checkout.payLink) {
    return null;
  }

  return (
    <section className="rounded-xl border border-emerald-800 bg-emerald-950/40 p-5">
      <h3 className="text-lg font-semibold text-emerald-300">
        ✓ Secure checkout link ready
      </h3>

      <p className="mt-2 text-sm text-zinc-300">
        Open the Kapruka payment page to complete your order.
      </p>

      {checkout.orderRef && (
        <p className="mt-3 text-xs text-zinc-400">
          Checkout reference:{" "}
          {checkout.orderRef}
        </p>
      )}

      {checkout.expiresAt && (
        <p className="mt-1 text-xs text-zinc-400">
          Link expires:{" "}
          {new Date(
            checkout.expiresAt,
          ).toLocaleString()}
        </p>
      )}

      <a
        href={checkout.payLink}
        target="_blank"
        rel="noreferrer"
        className="mt-5 block w-full rounded-xl bg-emerald-500 px-4 py-3 text-center font-semibold text-zinc-950 hover:bg-emerald-400"
      >
        Open secure payment page
      </a>

      <p className="mt-4 text-xs text-zinc-400">
        After payment, Kapruka will provide a separate order number by email. Use that number to track the delivery.
      </p>
    </section>
  );
}