"use client";

import { useCartStore } from "@/lib/store/cart-store";
import { useCheckoutStore } from "@/lib/store/checkout-store";
import { useState } from "react";
import { PayLinkCard } from "@/components/pay-link-card";

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

    const estimatedTotal =
        subtotal + deliveryFee;

    const displayedTotal =
        checkout.orderSummary?.grand_total ??
        estimatedTotal;

    const canCreateCheckout =
        items.length > 0 &&
        checkout.deliveryValidated &&
        Boolean(checkout.city) &&
        Boolean(checkout.deliveryDate) &&
        Boolean(checkout.recipient.name) &&
        Boolean(checkout.recipient.phone) &&
        Boolean(checkout.address.addressLine1) &&
        Boolean(checkout.sender.name) &&
        Boolean(checkout.sender.phone) &&
        checkout.checkoutConfirmed;

    const [submitting, setSubmitting] =
        useState(false);

    const [checkoutError, setCheckoutError] =
        useState("");

    async function createCheckoutLink() {
        if (
            !canCreateCheckout ||
            submitting
        ) {
            return;
        }

        setSubmitting(true);
        setCheckoutError("");

        try {
            const address = [
                checkout.address.addressLine1,
                checkout.address.addressLine2,
                checkout.address.postalCode,
            ]
                .filter(Boolean)
                .join(", ");

            const response = await fetch(
                "/api/orders/create",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        confirmed: true,

                        cart: items.map(
                            (item) => ({
                                product_id: item.id,

                                quantity:
                                item.quantity,

                                icing_text:
                                item.icingText?.trim() ||
                                null,
                            }),
                            ),

                        recipient: {
                            name:
                                checkout.recipient.name,
                            phone:
                                checkout.recipient.phone,
                        },

                        delivery: {
                            address,

                            city:
                                checkout.city,

                            location_type:
                                checkout.address
                                .locationType,

                            date:
                                checkout.deliveryDate,

                            instructions:
                                checkout.address
                                .instructions
                                .trim() || null,
                        },

                        sender: {
                            name:
                                checkout.sender.name,

                            anonymous:
                                checkout.anonymousSender,
                            },

                        gift_message:
                            checkout.giftMessage ||
                            null,

                        currency: "LKR",
                    }),
                },
            );

            const data =
                (await response.json()) as {
                    ok: boolean;
                    error?: string;
                    order?: {
                        checkout_url: string;
                        order_ref: string;
                        expires_at: string;
                        summary: {
                            items_total: number;
                            delivery_fee: number;
                            addons_total: number;
                            grand_total: number;
                            currency: string;
                        };
                    };
                };

            if (
                !response.ok ||
                !data.ok ||
                !data.order
            ) {
                throw new Error(
                    data.error ??
                    "Unable to create checkout link.",
                );
            }

            checkout.setOrderResult({
                payLink:
                    data.order.checkout_url,
                orderRef:
                    data.order.order_ref,
                expiresAt:
                    data.order.expires_at,
                orderSummary:
                    data.order.summary,
            });
        } catch (error) {
            console.error(error);

            setCheckoutError(
                error instanceof Error
                    ? error.message
                    : "Unable to create checkout link.",
            );
        } finally {
            setSubmitting(false);
        }
    }

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

                                {item.icingText && (
                                    <p className="mt-1 text-xs text-amber-300">
                                        Icing: “{item.icingText}”
                                    </p>
                                )}
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

                    <p>
                        Location type:{" "}
                        {checkout.address.locationType}
                    </p>

                    {checkout.address.instructions && (
                        <p>
                            Notes: {checkout.address.instructions}
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

                    <p>
                        Anonymous surprise:{" "}
                        {checkout.anonymousSender
                            ? "Yes"
                            : "No"}
                    </p>

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
                            value={
                                checkout.orderSummary
                                ?.delivery_fee ??
                                deliveryFee
                            }
                        />

                        <div className="border-t border-zinc-800 pt-3">
                            <PriceRow
                                label={
                                    checkout.orderSummary
                                        ? "Checkout quote"
                                        : "Estimated total"
                                }
                                value={displayedTotal}
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
                    onClick={createCheckoutLink}
                    disabled={
                        !canCreateCheckout ||
                        submitting ||
                        Boolean(checkout.payLink)
                    }
                    className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {submitting
                        ? "Creating secure link..."
                        : checkout.payLink
                            ? "Checkout link created"
                            : "Create secure checkout link"}
                </button>

                {checkoutError && (
                    <p className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
                        {checkoutError}
                    </p>
                )}

                <PayLinkCard />
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
            className={`flex justify-between gap-4 ${important
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