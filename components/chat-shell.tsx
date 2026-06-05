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
  "Find a birthday cake",
  "Show me flowers for Amma",
  "Find chocolates",
  "Recommend a gift hamper",
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

      const assistantMessage: ChatMessage =
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: data.message,
          products:
            data.products,
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

            {message.products &&
              message.products.length >
                0 && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {message.products.map(
                    (product) => (
                      <ProductCard
                        key={
                          product.id
                        }
                        product={
                          product
                        }
                        onAddToCart={
                          addItem
                        }
                      />
                    ),
                  )}
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