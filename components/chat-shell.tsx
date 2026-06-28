"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { TrackedOrderCard } from "@/components/tracked-order-card";
import { ProductCard } from "@/components/product-card";
import { useCartStore } from "@/lib/store/cart-store";
import { useCheckoutStore } from "@/lib/store/checkout-store";
import type {
  ChatApiResponse,
  ChatMessage,
  RecipientPreferences,
  ShoppingChatContext,
} from "@/types/chat";
import { motion } from "framer-motion";

// We use these analytics helpers to track engagement and run A/B tests to improve the agent's performance over time.
import { logEvent, getExperimentGroup } from "@/lib/analytics";

import type {
  KaprukaSearchProduct,
} from "@/types/kapruka";

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

const starterCards = [
  {
    icon: "🛍️",
    title: "Shop for myself",
    description:
      "Browse useful products for everyday needs.",
    prompt:
      "I am shopping for myself",
  },
  {
    icon: "📱",
    title: "Electronics",
    description:
      "Explore useful tech and accessories.",
    prompt:
      "Show me electronics",
  },
  {
    icon: "🏠",
    title: "Home essentials",
    description:
      "Find practical items for the home.",
    prompt:
      "Show me home essentials",
  },
  {
    icon: "🎂",
    title: "Birthday surprise",
    description:
      "Find a celebration cake under Rs. 8,000.",
    prompt:
      "Find a birthday cake under Rs. 8000",
  },
  {
    icon: "💐",
    title: "Flowers for Amma",
    description:
      "Browse warm flower-inspired gifts for Amma.",
    prompt:
      "Show me flowers for Amma",
  },
  {
    icon: "🎁",
    title: "Gift under Rs. 5,000",
    description:
      "Discover thoughtful budget-friendly picks.",
    prompt:
      "Show me gifts under Rs. 5000",
  },
  {
    icon: "🎊",
    title: "Seasonal gifts",
    description:
      "Explore collections for current festivals and holidays.",
    prompt: "Show me seasonal gifts",
  },
];

const discoveryPaths = [
  {
    icon: "🛒",
    title: "Everyday shopping",
    description:
      "Browse useful products for yourself.",
    prompt:
      "I am shopping for myself",
  },
  {
    icon: "🌸",
    title: "Amma’s Little Surprise",
    description:
      "Start with flowers, then add a sweet extra.",
    prompt:
      "Show me flowers for Amma",
  },
  {
    icon: "🎉",
    title: "Birthday Celebration",
    description:
      "Pick a cake and add a personal icing message.",
    prompt:
      "Find a birthday cake under Rs. 8000",
  },
  {
    icon: "⚡",
    title: "Need it quickly",
    description:
      "Start with delivery and narrow down safe options.",
    prompt:
      "I need something urgent today",
  },
  {
    icon: "🎲",
    title: "Surprise me",
    description:
      "Let Gift Mate pick a random live-catalog gift for you.",
    prompt: "Surprise me with a gift",
  },
];

// These quick prompts give users one-click inspiration. We include common requests, seasonal items, and a fun "Surprise me" option to encourage discovery.
const quickPrompts = [
  "Show me electronics",
  "Show me home essentials",
  "Show me groceries",
  "Find headphones under Rs. 10000",
  "Find a birthday cake under Rs. 8000",
  "Show me flowers for Amma",
  "Can you deliver to Kandy?",
  "Track my order",
  "Show me seasonal gifts",
  "Surprise me with a gift",
  "Amma ta flowers tikak ona",
  "අම්මාට මල් බලන්න",
];

const ordinalIndexes: Record<
  string,
  number
> = {
  first: 0,
  "1st": 0,
  one: 0,

  second: 1,
  "2nd": 1,
  two: 1,

  third: 2,
  "3rd": 2,
  three: 2,

  fourth: 3,
  "4th": 3,
  four: 3,

  fifth: 4,
  "5th": 4,
  five: 4,

  sixth: 5,
  "6th": 5,
  six: 5,
};

function formatCategoryLabel(
  categoryName: string,
): string {
  const labels: Record<string, string> = {
    cakes: "Cakes 🎂",
    flowers: "Flowers 💐",
    chocolates: "Chocolates 🍫",
    combopack: "Gift Combos 🎁",
    fruits: "Fruit Baskets 🍎",
    giftset: "Gift Sets ✨",
    "personalized gifts":
      "Personalized Gifts 💝",
    greetingcards:
      "Greeting Cards 💌",
    kidstoys: "Kids & Toys 🧸",
    babyitems: "Baby Gifts 👶",
    perfumes: "Perfumes 🌸",
    books: "Books 📚",
    birthday: "Birthday 🎉",
    anniversary: "Anniversary ❤️",
    graduation: "Graduation 🎓",
    wedding: "Wedding 💍",
    samedaydelivery:
      "Same-day Delivery ⚡",
    bestsellers: "Best Sellers ⭐",
  };

  return (
    labels[
      categoryName.toLowerCase()
    ] ?? categoryName
  );
}

function findLastProducts(
  messages: ChatMessage[],
): KaprukaSearchProduct[] {
  return (
    [...messages]
      .reverse()
      .find(
        (message) =>
          message.products &&
          message.products.length > 0,
      )?.products ?? []
  );
}

function extractBudgetSuffix(
  messageText: string,
): string {
  const match =
    messageText.match(
      /LKR\s*([\d,]+)/i,
    );

  return match
    ? ` under Rs. ${match[1]}`
    : "";
}

function parsePreferenceTerms(
  value: string,
): string[] {
  return value
    .split(",")
    .map((term) =>
      term.trim(),
    )
    .filter(Boolean);
}

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

  const [
    addedProductMessage,
    setAddedProductMessage,
  ] = useState("");

  const messagesEndRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const messagesContainerRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const shouldAutoScrollRef =
    useRef(true);

  const [
    visibleProductCounts,
    setVisibleProductCounts,
  ] = useState<Record<string, number>>(
    {},
  );

  const [
    showPreferences,
    setShowPreferences,
  ] = useState(false);

  const [relationship, setRelationship] =
    useState("");

  const [likes, setLikes] =
    useState("");

  const [dislikes, setDislikes] =
    useState("");

  const [allergies, setAllergies] =
    useState("");

  const [budgetMax, setBudgetMax] =
    useState("");

  const {
    items,
    addItem,
    removeItem,
  } = useCartStore();

  // These states manage our voice recognition capabilities so users can speak their requests.
  const [listening, setListening] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);

  // We keep a reference to the active speech recognition instance so we can stop it if the user clicks the mic button again.
  const recognitionRef = useRef<any>(null);

  // We assign a persistent A/B experiment group on the very first load to track feature effectiveness.
  const experimentGroupRef = useRef<string>(getExperimentGroup());

  function showToast(text: string) {
    setAddedProductMessage(text);

    window.setTimeout(() => {
      setAddedProductMessage("");
    }, 2200);
  }

  function handleAddToCart(
    product: Parameters<
      typeof addItem
    >[0],
  ) {
    addItem(product);

    // Track when users add products to their cart to help us understand conversion rates.
    logEvent("add_to_cart", {
      id: product.id,
      name: product.name,
      price: product.price,
      group: experimentGroupRef.current,
    });

    showToast(
      `Nice pick! ${product.name} is in your cart 🛒`,
    );
  }

  /**
   * Start or stop browser speech recognition. When started, the microphone
   * listens and fills the chat input with the recognised transcript.
   */
  function toggleListening() {
    // If already listening, stop the current recognition session
    if (listening) {
      recognitionRef.current?.stop?.();
      setListening(false);
      logEvent("voice_input_stopped", {
        group: experimentGroupRef.current,
      });
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    const SpeechRecognition: any =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // If not supported, let the user know
      alert(
        "Your browser does not support speech recognition.",
      );
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.onresult = (event: any) => {
      let transcript = "";
      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
      logEvent("voice_input_ended", {
        group: experimentGroupRef.current,
      });
    };
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    logEvent("voice_input_started", {
      group: experimentGroupRef.current,
    });
  }

  /**
   * Toggle whether assistant responses are spoken aloud using
   * the browser's speech synthesis API.
   */
  function toggleVoiceOutput() {
    setVoiceOutputEnabled((enabled) => {
      const newEnabled = !enabled;
      logEvent("voice_output_toggled", {
        enabled: newEnabled,
        group: experimentGroupRef.current,
      });
      return newEnabled;
    });
  }

  function appendLocalExchange(
    userText: string,
    assistantText: string,
  ) {
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        text: userText,
      },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text: assistantText,
      },
    ]);
  }

  function handleLocalCartCommand(
    text: string,
  ): boolean {
    const normalized =
      text.toLowerCase().trim();

    const lastProducts =
      findLastProducts(messages);

    const addMatch = normalized.match(
      /(?:add|cart|take|select)\s+(?:the\s+)?(first|1st|one|second|2nd|two|third|3rd|three|fourth|4th|four|fifth|5th|five|sixth|6th|six)(?:\s+one)?/,
    );

    if (addMatch) {
      const index =
        ordinalIndexes[addMatch[1]];

      const product =
        lastProducts[index];

      if (!product) {
        appendLocalExchange(
          text,
          "I cannot find that option in the latest results. Try another product number or search again. 😊",
        );

        return true;
      }

      handleAddToCart(product);

      appendLocalExchange(
        text,
        `Nice pick! ${product.name} is in your cart 🛒 Would you like another item, or should we check delivery?`,
      );

      return true;
    }

    const removeMatch =
      normalized.match(
        /(?:remove|delete)\s+(?:the\s+)?(.+?)(?:\s+from\s+(?:the\s+)?(?:cart|gift box))?$/,
      );

    if (removeMatch) {
      const keyword =
        removeMatch[1].trim();

      const product =
        items.find((item) =>
          item.name
            .toLowerCase()
            .includes(keyword),
        );

      if (!product) {
        appendLocalExchange(
          text,
          "I could not find that item in your gift box. Open the cart to review the current items. 😊",
        );

        return true;
      }

      removeItem(product.id);

      appendLocalExchange(
        text,
        `Done - ${product.name} is out of the cart. Shall we find a better match? 😊`,
      );

      return true;
    }

    return false;
  }

  const {
    city: selectedCity,
    deliveryDate,
    setDeliveryDetails,
  } = useCheckoutStore();

  useEffect(() => {
    if (!shouldAutoScrollRef.current) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  /**
   * This handles speaking out the assistant's messages using the Web Speech API, 
   * creating a more accessible and interactive experience when voice output is turned on.
   */
  useEffect(() => {
    if (!voiceOutputEnabled) {
      return;
    }
    if (messages.length === 0) {
      return;
    }
    const last = messages[messages.length - 1];
    if (last.role !== "assistant") {
      return;
    }
    try {
      const text = last.text
        .replace(/\n/g, " ")
        .trim();
      if (!text) {
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      // Use the default voice; browsers will pick a suitable language
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      // Avoid crashing if speech synthesis fails
      console.error("Speech synthesis error", error);
    }
  }, [messages, voiceOutputEnabled]);

  async function sendMessage(
    message: string,
    category?: string,
  ) {
    const trimmedMessage =
      message.trim();

    if (
      !trimmedMessage ||
      loading
    ) {
      return;
    }

    if (
      !category &&
      handleLocalCartCommand(
        trimmedMessage,
      )
    ) {
      setInput("");
      setError("");

      return;
    }

    // Log the outbound message to track user intent and engagement.
    logEvent("send_message", {
      message: trimmedMessage,
      category: category ?? null,
      group: experimentGroupRef.current,
    });

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

    const context: ShoppingChatContext = {
      recentMessages: messages
        .slice(-8)
        .map((previousMessage) => ({
          role: previousMessage.role,
          text: previousMessage.text,
        })),

      cart: items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        currency: item.currency,
      })),

      lastProducts:
        findLastProducts(messages).slice(
          0,
          12,
        ),

      city:
        selectedCity || undefined,

      deliveryDate:
        deliveryDate || undefined,

      recipientPreferences: {
        relationship:
          relationship.trim() ||
          undefined,

        likes:
          parsePreferenceTerms(
            likes,
          ),

        dislikes:
          parsePreferenceTerms(
            dislikes,
          ),

        allergies:
          parsePreferenceTerms(
            allergies,
          ),

        budgetMax:
          budgetMax.trim() &&
          Number(budgetMax) > 0
            ? Number(budgetMax)
            : undefined,
      } satisfies RecipientPreferences,
    };

    try {
      const response =
        await fetch(
          "/api/chat",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              message: trimmedMessage,
              category,
              context,
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
          categories:
            data.categories,
          deliveryCities:
            data.deliveryCities,
          giftMessages:
            data.giftMessages,
          action:
            data.action,
          trackedOrder:
            data.trackedOrder,
        };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);

      if (data.updatedPreferences) {
        if (data.updatedPreferences.relationship) setRelationship(data.updatedPreferences.relationship);
        if (data.updatedPreferences.likes) setLikes(data.updatedPreferences.likes.join(", "));
        if (data.updatedPreferences.dislikes) setDislikes(data.updatedPreferences.dislikes.join(", "));
        if (data.updatedPreferences.allergies) setAllergies(data.updatedPreferences.allergies.join(", "));
        if (data.updatedPreferences.budgetMax) setBudgetMax(data.updatedPreferences.budgetMax.toString());
      }
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

  function selectDeliveryCity(
    cityName: string,
  ) {
    setDeliveryDetails(
      cityName,
      deliveryDate,
    );

    const confirmationMessage: ChatMessage =
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text: [
          `${cityName} selected 🚚`,
          "",
          "Perfect. Add your favourites, then open the gift box and choose a delivery date. We’ll make sure everything can reach them on time.",
        ].join("\n"),
      };

    setMessages((current) => [
      ...current,
      confirmationMessage,
    ]);
  }

  function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    void sendMessage(input);
  }

  return (
    <section className="flex h-[calc(100vh-7rem)] min-h-0 flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
      <header className="relative shrink-0 border-b border-zinc-800 bg-zinc-900/90 px-4 py-3 backdrop-blur sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-emerald-300">
            ● Live catalog
            <span className="hidden text-zinc-500 sm:inline">
              {" "}
              · Delivery quotes · Secure checkout
            </span>
          </p>

          <button
            type="button"
            onClick={() =>
              setShowPreferences(
                (current) =>
                  !current,
              )
            }
            aria-label="Shopping preferences"
            className="shrink-0 rounded-full border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-semibold text-zinc-200 hover:border-emerald-600 hover:text-white"
          >
            <span className="sm:hidden">
              🎯
            </span>

            <span className="hidden sm:inline">
              🎯 Preferences
            </span>

            {(relationship ||
              likes ||
              dislikes ||
              allergies ||
              budgetMax) && (
              <span className="ml-1 text-emerald-300">
                ●
              </span>
            )}
          </button>
        </div>

      {showPreferences && (
        <section className="absolute left-4 right-4 top-full z-30 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-950 p-4 shadow-2xl sm:left-auto sm:right-5 sm:w-[36rem]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">
                Shopping preferences
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Used only for this session to improve recommendations.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowPreferences(false)
              }
              className="text-xs text-zinc-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              value={relationship}
              onChange={(event) =>
                setRelationship(
                  event.target.value,
                )
              }
              placeholder="Recipient, optional: Amma"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
            />

            <input
              type="number"
              min="1"
              value={budgetMax}
              onChange={(event) =>
                setBudgetMax(
                  event.target.value,
                )
              }
              placeholder="Budget max: 6000"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
            />

            <input
              value={likes}
              onChange={(event) =>
                setLikes(
                  event.target.value,
                )
              }
              placeholder="Likes: flowers, chocolate"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
            />

            <input
              value={dislikes}
              onChange={(event) =>
                setDislikes(
                  event.target.value,
                )
              }
              placeholder="Avoid: perfume"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
            />

            <input
              value={allergies}
              onChange={(event) =>
                setAllergies(
                  event.target.value,
                )
              }
              placeholder="Allergies: nuts"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 sm:col-span-2"
            />
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() =>
                setShowPreferences(false)
              }
              className="flex-1 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400"
            >
              Save preferences
            </button>

            <button
              type="button"
              onClick={() => {
                setRelationship("");
                setLikes("");
                setDislikes("");
                setAllergies("");
                setBudgetMax("");
              }}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-xs text-zinc-300 hover:text-white"
            >
              Clear
            </button>
          </div>
        </section>
      )}

      </header>

      <div
        ref={messagesContainerRef}
        onScroll={() => {
          const container =
            messagesContainerRef.current;

          if (!container) {
            return;
          }

          const distanceFromBottom =
            container.scrollHeight -
            container.scrollTop -
            container.clientHeight;

          shouldAutoScrollRef.current =
            distanceFromBottom < 120;
        }}
        className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-6"
      >
        {messages.length === 1 && (
          <section className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-950 to-emerald-950/20 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Start with a little inspiration
            </p>

            <div className="starter-scroll mt-4 flex gap-3 overflow-x-auto pb-1 pr-8 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pr-0 xl:grid-cols-3">
              {starterCards.map((card) => (
                <button
                  key={card.title}
                  type="button"
                  onClick={() =>
                    void sendMessage(card.prompt)
                  }
                  disabled={loading}
                  className="min-w-56 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3 text-left transition hover:-translate-y-0.5 hover:border-emerald-600 hover:bg-zinc-900 disabled:opacity-50 sm:min-w-0 sm:p-4"
                >
                  <span className="text-2xl sm:text-3xl">
                    {card.icon}
                  </span>

                  <span className="mt-2 block text-sm font-semibold text-white sm:mt-3 sm:text-base">
                    {card.title}
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-zinc-400">
                    {card.description}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-5 border-t border-zinc-800 pt-4">
              <p className="text-xs font-semibold text-zinc-300">
                Popular shopping paths
              </p>

              <div className="relative mt-3">
                <div className="discovery-scroll flex gap-3 overflow-x-auto pb-1 pr-10">
                  {discoveryPaths.map((bundle) => (
                    <button
                      key={bundle.title}
                      type="button"
                      onClick={() =>
                        void sendMessage(
                          bundle.prompt,
                        )
                      }
                      disabled={loading}
                      className="min-w-56 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-left transition hover:border-emerald-700 disabled:opacity-50"
                    >
                      <span className="text-2xl">
                        {bundle.icon}
                      </span>

                      <span className="mt-2 block text-sm font-semibold text-white">
                        {bundle.title}
                      </span>

                      <span className="mt-1 block text-xs leading-5 text-zinc-400">
                        {bundle.description}
                      </span>

                      <span className="mt-3 block text-xs font-semibold text-emerald-300">
                        Explore →
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-zinc-950 to-transparent" />
              </div>
            </div>
          </section>
        )}

        {messages.map((message) => {
          const visibleProductCount =
            visibleProductCounts[
              message.id
            ] ?? 6;

          return (
            <motion.article
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              key={message.id}
              className={
                message.role ===
                "user"
                  ? "ml-auto max-w-2xl"
                  : "mr-auto max-w-5xl"
              }
            >
              <div
                className={
                  message.role ===
                  "user"
                    ? "rounded-3xl rounded-br-md bg-emerald-500 px-5 py-4 text-zinc-950"
                    : "rounded-3xl rounded-bl-md border border-zinc-800 bg-zinc-950 px-5 py-4 text-zinc-200"
                }
              >
                <p className="whitespace-pre-line text-sm leading-6">
                  {message.text}
                </p>
              </div>

              {message.products &&
                message.products.length > 0 && (
                  <div className="mt-4">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {message.products
                        .slice(
                          0,
                          visibleProductCount,
                        )
                        .map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            onAddToCart={
                              handleAddToCart
                            }
                          />
                        ))}
                    </div>

                    {visibleProductCount <
                      message.products.length && (
                      <div className="mt-5 flex justify-center">
                        <button
                          type="button"
                          onClick={() =>
                            setVisibleProductCounts(
                              (current) => ({
                                ...current,
                                [message.id]:
                                  Math.min(
                                    visibleProductCount + 6,
                                    message.products
                                      ?.length ?? 0,
                                  ),
                              }),
                            )
                          }
                          className="rounded-full border border-zinc-700 bg-zinc-900 px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:border-emerald-500 hover:text-white"
                        >
                          Show more options
                        </button>
                      </div>
                    )}
                  </div>
                )}

              {message.categories &&
                message.categories.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {message.categories.map(
                      (category) => {
                        const budgetSuffix =
                          extractBudgetSuffix(
                            message.text,
                          );

                        return (
                          <motion.button
                            key={category.name}
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() =>
                              void sendMessage(
                                `Show me ${category.name}${budgetSuffix}`,
                                category.name,
                              )
                            }
                            className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-300 hover:border-emerald-500 hover:text-white"
                          >
                            {formatCategoryLabel(
                              category.name,
                            )}
                          </motion.button>
                        );
                      },
                    )}
                  </div>
                )}

              {message.deliveryCities &&
                message.deliveryCities
                  .length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {message.deliveryCities.map(
                      (city) => {
                        const isSelected =
                          selectedCity ===
                          city.name;

                        return (
                          <button
                            key={
                              city.name
                            }
                            type="button"
                            disabled={
                              isSelected
                            }
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
                            {
                              city.name
                            }
                          </button>
                        );
                      },
                    )}
                  </div>
                )}

              {message.giftMessages &&
                message.giftMessages.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {message.giftMessages.map((msg, index) => (
                      <div
                        key={index}
                        className="group relative rounded-2xl border border-emerald-900 bg-emerald-950/20 p-4 transition hover:bg-emerald-950/40"
                      >
                        <p className="text-sm italic text-emerald-100">
                          "{msg}"
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(msg);
                            showToast("Message copied to clipboard! 📋");
                          }}
                          className="absolute right-3 top-3 hidden rounded-lg bg-emerald-900/50 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-800 hover:text-white group-hover:block"
                        >
                          Copy
                        </button>
                      </div>
                    ))}
                  </div>
                )}

              {message.trackedOrder && (
                <TrackedOrderCard order={message.trackedOrder} />
              )}
            </motion.article>
          );
        })}

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

        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 border-t border-zinc-800 bg-zinc-950 p-4">
        {addedProductMessage && (
          <div className="fixed bottom-28 left-1/2 z-50 -translate-x-1/2 rounded-full border border-emerald-500/40 bg-emerald-950 px-5 py-3 text-sm font-semibold text-emerald-200 shadow-2xl">
            {addedProductMessage}
          </div>
        )}
        <div className="relative mb-3">
          <div className="prompt-scroll flex gap-2 overflow-x-auto pb-1 pr-10">
            {quickPrompts.map(
              (prompt) => (
                <motion.button
                  key={prompt}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    void sendMessage(
                      prompt,
                    )
                  }
                  disabled={loading}
                  className="whitespace-nowrap rounded-full border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 hover:border-emerald-500 hover:text-white disabled:opacity-50"
                >
                  {prompt}
                </motion.button>
              ),
            )}
          </div>

          <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-zinc-950 to-transparent" />
        </div>

        <form
          onSubmit={submit}
          className="flex items-center gap-3"
        >
          {/* Voice input toggle button */}
          <button
            type="button"
            onClick={toggleListening}
            aria-label={listening ? "Stop listening" : "Start listening"}
            disabled={loading}
            className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-lg text-zinc-300 hover:border-emerald-500 hover:text-white disabled:opacity-40"
          >
            {listening ? "🛑" : "🎤"}
          </button>

          {/* Voice output toggle button */}
          <button
            type="button"
            onClick={toggleVoiceOutput}
            aria-label={voiceOutputEnabled ? "Disable voice output" : "Enable voice output"}
            className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-lg text-zinc-300 hover:border-emerald-500 hover:text-white"
          >
            {voiceOutputEnabled ? "🔊" : "🔇"}
          </button>

          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask for electronics, groceries, gifts, delivery, or tracking..."
            className="flex-1 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
          />

          <button
            type="submit"
            disabled={loading || input.trim().length === 0}
            className="rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </div>
    </section>
  );
}