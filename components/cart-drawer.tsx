"use client";

import { useState } from "react";
import { DeliveryForm } from "@/components/delivery-form";
import { useCartStore } from "@/lib/store/cart-store";

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
  } = useCartStore();

  const [step, setStep] = useState<
    "cart" | "delivery"
  >("cart");

  const total = items.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0,
  );

  if (!isOpen) {
    return null;
  }

  function closeDrawer() {
    setStep("cart");
    closeCart();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
      <aside className="h-full w-full max-w-md overflow-y-auto bg-zinc-950 p-6 shadow-2xl">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={closeDrawer}
            className="rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white"
          >
            Close
          </button>
        </div>

        {step === "delivery" ? (
          <DeliveryForm
            onBack={() => setStep("cart")}
          />
        ) : (
          <>
            <h2 className="text-xl font-bold text-white">
              Your cart 🛒
            </h2>

            {items.length === 0 ? (
              <p className="mt-8 text-zinc-400">
                Your cart is empty.
              </p>
            ) : (
              <>
                <div className="mt-6 space-y-4">
                  {items.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
                    >
                      <h3 className="font-semibold text-white">
                        {item.name}
                      </h3>

                      <p className="mt-1 text-sm text-emerald-400">
                        {item.currency}{" "}
                        {item.price.toLocaleString()}
                      </p>

                      <div className="mt-4 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            decreaseQuantity(
                              item.id,
                            )
                          }
                          className="rounded-lg border border-zinc-700 px-3 py-1 text-white"
                        >
                          −
                        </button>

                        <span className="min-w-6 text-center text-white">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            increaseQuantity(
                              item.id,
                            )
                          }
                          className="rounded-lg border border-zinc-700 px-3 py-1 text-white"
                        >
                          +
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            removeItem(item.id)
                          }
                          className="ml-auto text-sm text-red-400"
                        >
                          Remove
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-8 border-t border-zinc-800 pt-5">
                  <div className="flex justify-between text-lg font-semibold text-white">
                    <span>Total</span>

                    <span>
                      LKR {total.toLocaleString()}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setStep("delivery")
                    }
                    className="mt-5 w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-zinc-950"
                  >
                    Continue to delivery
                  </button>

                  <button
                    type="button"
                    onClick={clearCart}
                    className="mt-3 w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm text-zinc-300"
                  >
                    Clear cart
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </aside>
    </div>
  );
}