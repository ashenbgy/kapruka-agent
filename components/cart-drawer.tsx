"use client";

import { useState } from "react";
import { CustomerDetailsForm } from "@/components/customer-details-form";
import { DeliveryForm } from "@/components/delivery-form";
import { OrderReview } from "@/components/order-review";
import { useCartStore } from "@/lib/store/cart-store";

type CheckoutStep =
  | "cart"
  | "delivery"
  | "details"
  | "review";

const checkoutSteps: {
  id: CheckoutStep;
  label: string;
}[] = [
  { id: "cart", label: "Cart" },
  { id: "delivery", label: "Delivery" },
  { id: "details", label: "Details" },
  { id: "review", label: "Review" },
];

function looksLikeCake(
  name: string,
) {
  return name
    .toLowerCase()
    .includes("cake");
}

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    updateIcingText,
    clearCart,
  } = useCartStore();

  const [step, setStep] =
    useState<CheckoutStep>("cart");

  const total =
    items.reduce(
      (sum, item) =>
        sum +
        item.price *
          item.quantity,
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

        <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3">
          <div className="grid grid-cols-4 gap-2">
            {checkoutSteps.map((checkoutStep, index) => {
              const activeIndex =
                checkoutSteps.findIndex(
                  (item) => item.id === step,
                );

              const isActive =
                checkoutStep.id === step;

              const isComplete =
                index < activeIndex;

              return (
                <div
                  key={checkoutStep.id}
                  className="text-center"
                >
                  <div
                    className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      isActive
                        ? "bg-emerald-500 text-zinc-950"
                        : isComplete
                          ? "bg-emerald-950 text-emerald-300"
                          : "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {isComplete ? "✓" : index + 1}
                  </div>

                  <p
                    className={`mt-2 text-[11px] ${
                      isActive
                        ? "font-semibold text-emerald-300"
                        : "text-zinc-500"
                    }`}
                  >
                    {checkoutStep.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {step === "delivery" && (
          <DeliveryForm
            onBack={() =>
              setStep("cart")
            }
            onContinue={() =>
              setStep("details")
            }
          />
        )}

        {step === "details" && (
          <CustomerDetailsForm
            onBack={() =>
              setStep("delivery")
            }
            onContinue={() =>
              setStep("review")
            }
          />
        )}

        {step === "review" && (
          <OrderReview
            onBack={() =>
              setStep("details")
            }
          />
        )}

        {step === "cart" && (
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
                            removeItem(
                              item.id,
                            )
                          }
                          className="ml-auto text-sm text-red-400"
                        >
                          Remove
                        </button>
                      </div>

                      {looksLikeCake(item.name) && (
                        <label className="mt-4 block text-xs text-zinc-300">
                          Cake icing message

                          <input
                            value={
                              item.icingText ?? ""
                            }
                            maxLength={120}
                            onChange={(event) =>
                              updateIcingText(
                                item.id,
                                event.target.value,
                              )
                            }
                            placeholder="Happy Birthday Amma!"
                            className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
                          />
                        </label>
                      )}
                    </article>
                  ))}
                </div>

                <div className="mt-8 border-t border-zinc-800 pt-5">
                  <div className="flex justify-between text-lg font-semibold text-white">
                    <span>Total</span>

                    <span>
                      LKR{" "}
                      {total.toLocaleString()}
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