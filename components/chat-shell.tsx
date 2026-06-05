"use client";

import {
    FormEvent,
    useState,
} from "react";
import { ProductCard } from "@/components/product-card";
import { useCartStore } from "@/lib/store/cart-store";
import type {
    ChatApiResponse,
    ChatMessage,
} from "@/types/chat";
import { OrderTrackingForm } from "@/components/order-tracking-form";
import { useCheckoutStore } from "@/lib/store/checkout-store";

const initialMessages: ChatMessage[] = [
    {
        id: "welcome",
        role: "assistant",
        text: [
            "Ayubowan! 👋 I’m your Kapruka Gift Mate.",
            "",
            "Tell me who you are shopping for, the occasion, or your budget. I’ll search Kapruka’s live catalog for you.",
        ].join("\n"),
    },
];

const quickPrompts = [
    "Find a birthday cake under Rs. 8000",
    "Show me flowers for Amma",
    "What categories do you have?",
    "Can you deliver to Kandy?",
    "Track my order",
    "අම්මාට මල් බලන්න",
    "කේක් බලන්න",
];

export function ChatShell() {
    const [messages, setMessages] =
        useState<ChatMessage[]>(
            initialMessages,
        );

    const [input, setInput] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const { addItem } =
        useCartStore();

    const {
        city: selectedCity,
        deliveryDate,
        setDeliveryDetails,
    } = useCheckoutStore();

    async function sendMessage(
        message: string,
    ) {
        const trimmedMessage =
            message.trim();

        if (
            !trimmedMessage ||
            loading
        ) {
            return;
        }

        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "user",
            text: trimmedMessage,
        };

        setMessages((current) => [
            ...current,
            userMessage,
        ]);

        setInput("");
        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                "/api/chat",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        message:
                            trimmedMessage,
                    }),
                },
            );

            const data =
                (await response.json()) as ChatApiResponse;

            if (
                !response.ok ||
                !data.ok ||
                !data.message
            ) {
                throw new Error(
                    data.error ??
                    "Unable to process your message.",
                );
            }

            const assistantMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: "assistant",
                text: data.message,
                products:
                    data.products,
                categories:
                    data.categories,
                deliveryCities:
                    data.deliveryCities,
                action:
                    data.action,
            };

            setMessages((current) => [
                ...current,
                assistantMessage,
            ]);
        } catch (chatError) {
            console.error(chatError);

            setError(
                chatError instanceof Error
                    ? chatError.message
                    : "Unable to process your message.",
            );
        } finally {
            setLoading(false);
        }
    }

    function submit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        void sendMessage(input);
    }

    function selectDeliveryCity(
        cityName: string,
        ) {
        setDeliveryDetails(
            cityName,
            deliveryDate,
        );

        const confirmationMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            text: [
            `✓ ${cityName} selected as your delivery city. 🚚`,
            "",
            "Add your products to the cart, then continue to delivery to choose a date and confirm availability.",
            ].join("\n"),
        };

        setMessages((current) => [
            ...current,
            confirmationMessage,
        ]);
    }

    return (
        <section className="flex min-h-[calc(100vh-7rem)] flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
            <header className="border-b border-zinc-800 bg-zinc-900/90 px-5 py-4 backdrop-blur">
                <p className="text-sm font-semibold text-white">
                    Kapruka Gift Mate
                </p>

                <p className="mt-1 text-xs text-emerald-400">
                    ● Live Kapruka catalog connected
                </p>
            </header>

            <div className="flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-6">
                {messages.map((message) => (
                    <article
                        key={message.id}
                        className={
                            message.role === "user"
                                ? "ml-auto max-w-2xl"
                                : "mr-auto max-w-5xl"
                        }
                    >
                        <div
                            className={
                                message.role === "user"
                                    ? "rounded-3xl rounded-br-md bg-emerald-500 px-5 py-4 text-zinc-950"
                                    : "rounded-3xl rounded-bl-md border border-zinc-800 bg-zinc-950 px-5 py-4 text-zinc-200"
                            }
                        >
                            <p className="whitespace-pre-line text-sm leading-6">
                                {message.text}
                            </p>
                        </div>

                        {message.categories &&
                            message.categories.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {message.categories.map(
                                        (category) => (
                                            <button
                                                key={category.name}
                                                type="button"
                                                onClick={() =>
                                                    void sendMessage(
                                                        `Show me ${category.name}`,
                                                    )
                                                }
                                                className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-300 hover:border-emerald-500 hover:text-white"
                                            >
                                                {category.name}
                                            </button>
                                        ),
                                    )}
                                </div>
                            )}

                        {message.deliveryCities &&
                            message.deliveryCities.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                {message.deliveryCities.map(
                                    (city) => {
                                    const isSelected =
                                        selectedCity === city.name;

                                    return (
                                        <button
                                        key={city.name}
                                        type="button"
                                        disabled={isSelected}
                                        onClick={() =>
                                            selectDeliveryCity(
                                            city.name,
                                            )
                                        }
                                        className={`rounded-full border px-4 py-2 text-sm ${
                                            isSelected
                                            ? "border-emerald-600 bg-emerald-950 text-emerald-300"
                                            : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-emerald-500 hover:text-white"
                                        }`}
                                        >
                                        {isSelected
                                            ? "✓"
                                            : "📍"}{" "}
                                        {city.name}
                                        </button>
                                    );
                                    },
                                )}
                                </div>
                            )}

                        {message.action ===
                            "show_tracking" && (
                                <div className="mt-4">
                                    <OrderTrackingForm />
                                </div>
                            )}
                    </article>
                ))}

                {loading && (
                    <div className="mr-auto rounded-3xl rounded-bl-md border border-zinc-800 bg-zinc-950 px-5 py-4 text-sm text-zinc-400">
                        Searching Kapruka’s live catalog...
                    </div>
                )}

                {error && (
                    <p className="rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
                        {error}
                    </p>
                )}
            </div>

            <div className="border-t border-zinc-800 bg-zinc-950 p-4">
                <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                    {quickPrompts.map(
                        (prompt) => (
                            <button
                                key={prompt}
                                type="button"
                                onClick={() =>
                                    void sendMessage(
                                        prompt,
                                    )
                                }
                                className="whitespace-nowrap rounded-full border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 hover:border-emerald-500 hover:text-white"
                            >
                                {prompt}
                            </button>
                        ),
                    )}
                </div>

                <form
                    onSubmit={submit}
                    className="flex gap-3"
                >
                    <input
                        value={input}
                        onChange={(event) =>
                            setInput(
                                event.target.value,
                            )
                        }
                        placeholder="Ask for a gift, cake, flowers, chocolates..."
                        className="flex-1 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
                    />

                    <button
                        type="submit"
                        disabled={
                            loading ||
                            input.trim().length ===
                            0
                        }
                        className="rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-40"
                    >
                        Send
                    </button>
                </form>
            </div>
        </section>
    );
}