import OpenAI from "openai";
import { z } from "zod";
import {
    listCategories,
    listDeliveryCities,
    searchProducts,
} from "@/lib/kapruka-tools";
import { parseCategories } from "@/lib/parsers/categories";
import { parseDeliveryCities } from "@/lib/parsers/delivery-cities";
import { parseSearchProducts } from "@/lib/parsers/search-products";
import type { ChatApiResponse } from "@/types/chat";
import type { KaprukaCategory } from "@/types/kapruka";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const featuredCategoryNames = [
    "cakes",
    "flowers",
    "Chocolates",
    "combopack",
    "Fruits",
    "Giftset",
    "Personalized Gifts",
    "GreetingCards",
    "KidsToys",
    "BabyItems",
    "Perfumes",
    "Books",
    "birthday",
    "anniversary",
    "graduation",
    "wedding",
    "samedaydelivery",
    "bestsellers",
];

const searchProductsArgumentsSchema = z
    .object({
        q: z.string().trim().min(1).max(100),
        max_price: z.number().nonnegative().nullable(),
        category: z.string().trim().min(1).max(100).nullable(),
    })
    .strict();

const deliveryCityArgumentsSchema = z
    .object({
        query: z.string().trim().min(1).max(100),
    })
    .strict();

function getFeaturedCategories(
    categories: KaprukaCategory[],
) {
    const order = new Map(
        featuredCategoryNames.map(
            (name, index) => [
                name.toLowerCase(),
                index,
            ],
        ),
    );

    return categories
        .filter((category) =>
            order.has(
                category.name.toLowerCase(),
            ),
        )
        .sort(
            (first, second) =>
                (order.get(
                    first.name.toLowerCase(),
                ) ?? 999) -
                (order.get(
                    second.name.toLowerCase(),
                ) ?? 999),
        );
}

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] =
    [
        {
            type: "function",
            function: {
                name: "search_products",
                description:
                    "Search the live Kapruka catalog. Use one concise product keyword such as cake, flower, chocolate, hamper, perfume, books, or toys. Do not combine unrelated keywords.",
                strict: true,
                parameters: {
                    type: "object",
                    properties: {
                        q: {
                            type: "string",
                            description:
                                "One concise Kapruka product-search keyword.",
                        },
                        max_price: {
                            type: [
                                "number",
                                "null",
                            ],
                            description:
                                "Maximum LKR price or null when the user did not specify a budget.",
                        },
                        category: {
                            type: [
                                "string",
                                "null",
                            ],
                            description:
                                "Kapruka category or null when no category is required.",
                        },
                    },
                    required: [
                        "q",
                        "max_price",
                        "category",
                    ],
                    additionalProperties: false,
                },
            },
        },
        {
            type: "function",
            function: {
                name: "list_categories",
                description:
                    "Show curated live Kapruka shopping categories when the user wants to browse.",
                strict: true,
                parameters: {
                    type: "object",
                    properties: {},
                    required: [],
                    additionalProperties: false,
                },
            },
        },
        {
            type: "function",
            function: {
                name: "find_delivery_city",
                description:
                    "Search Kapruka delivery-city matches when the user asks whether delivery is available in a city.",
                strict: true,
                parameters: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description:
                                "Sri Lankan city name, for example Kandy or Colombo.",
                        },
                    },
                    required: [
                        "query",
                    ],
                    additionalProperties: false,
                },
            },
        },
        {
            type: "function",
            function: {
                name: "show_tracking_form",
                description:
                    "Show the order-tracking form when the user wants to track a Kapruka order.",
                strict: true,
                parameters: {
                    type: "object",
                    properties: {},
                    required: [],
                    additionalProperties: false,
                },
            },
        },
    ];

function parseArguments(
    rawArguments: string,
): unknown {
    try {
        return JSON.parse(rawArguments);
    } catch {
        throw new Error(
            "The AI assistant returned invalid tool arguments.",
        );
    }
}

export async function runOpenAIShoppingAgent(
    message: string,
): Promise<ChatApiResponse | null> {
    if (!process.env.OPENAI_API_KEY) {
        return null;
    }

    const response =
        await openai.chat.completions.create(
            {
                model:
                    process.env.OPENAI_MODEL ??
                    "gpt-5.4-mini",

                parallel_tool_calls: false,

                messages: [
                    {
                        role: "system",
                        content: [
                            "You are Kapruka Gift Mate, a warm Sri Lankan shopping assistant.",
                            "Understand English, Sinhala, and Tanglish.",
                            "Use tools for product search, category browsing, delivery-city lookup, and order-tracking requests.",
                            "For catalog searches, choose one concise product keyword.",
                            "Never create orders or claim that payment was completed.",
                            "Checkout is handled separately by the cart review screen.",
                            "If the user asks a general question that does not require a tool, answer briefly and helpfully.",
                        ].join("\n"),
                    },
                    {
                        role: "user",
                        content: message,
                    },
                ],

                tools,
            },
        );

    const assistantMessage =
        response.choices[0]?.message;

    const toolCall =
        assistantMessage?.tool_calls?.[0];

    if (!toolCall) {
        const text =
            assistantMessage?.content?.trim();

        return text
            ? {
                ok: true,
                message: text,
            }
            : null;
    }

    if (toolCall.type !== "function") {
        console.warn(
            "Unsupported OpenAI tool-call type:",
            toolCall.type,
        );

        return null;
    }

    const toolName =
        toolCall.function.name;

    const rawArguments =
        parseArguments(
            toolCall.function.arguments,
        );

    if (toolName === "search_products") {
        const input =
            searchProductsArgumentsSchema.parse(
                rawArguments,
            );

        const rawResult =
            await searchProducts({
                q: input.q,
                category:
                    input.category ??
                    undefined,
                max_price:
                    input.max_price ??
                    undefined,
                currency: "LKR",
                in_stock_only: true,
            });

        const result =
            parseSearchProducts(
                rawResult,
            );

        const budgetText =
            input.max_price !== null
                ? ` under LKR ${input.max_price.toLocaleString()}`
                : "";

        return {
            ok: true,

            message:
                result.products.length > 0
                    ? `I found ${result.products.length} live Kapruka options${budgetText}, including relevant gift suggestions from the live catalog. Add your favourites to the cart. 🎁`
                    : "I could not find a matching item. Try another keyword or increase your budget.",

            products:
                result.products,
        };
    }

    if (toolName === "list_categories") {
        const rawResult =
            await listCategories(1);

        const result =
            parseCategories(
                rawResult,
            );

        return {
            ok: true,
            message:
                "Here are some live Kapruka categories. Pick one and I’ll show matching products. 🛍️",
            categories:
                getFeaturedCategories(
                    result.categories,
                ),
        };
    }

    if (
        toolName ===
        "find_delivery_city"
    ) {
        const input =
            deliveryCityArgumentsSchema.parse(
                rawArguments,
            );

        const rawResult =
            await listDeliveryCities(
                input.query,
                8,
            );

        const result =
            parseDeliveryCities(
                rawResult,
            );

        return {
            ok: true,

            message:
                result.cities.length > 0
                    ? "I found matching Kapruka delivery locations. Select the correct city. 🚚"
                    : "I could not find that delivery city. Try another spelling.",

            deliveryCities:
                result.cities,
        };
    }

    if (
        toolName ===
        "show_tracking_form"
    ) {
        return {
            ok: true,
            message:
                "Enter the final order number from your Kapruka confirmation email. 📦",
            action:
                "show_tracking",
        };
    }

    return null;
}