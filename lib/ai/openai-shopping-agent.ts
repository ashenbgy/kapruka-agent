import OpenAI from "openai";
import { observeOpenAI } from "langfuse";
import { z } from "zod";
import {
    listCategories,
    listDeliveryCities,
    searchProducts,
} from "@/lib/kapruka-tools";
import { parseCategories } from "@/lib/parsers/categories";
import { parseDeliveryCities } from "@/lib/parsers/delivery-cities";
import { parseSearchProducts } from "@/lib/parsers/search-products";
import { prepareRecommendationProducts } from "@/lib/recommendation-filters";
import type {
    ChatApiResponse,
    ShoppingChatContext,
    RecipientPreferences,
} from "@/types/chat";
import type { KaprukaCategory, KaprukaSearchProduct } from "@/types/kapruka";

export async function reflectAndFilterProducts(
    query: string,
    products: KaprukaSearchProduct[],
    preferences: RecipientPreferences | undefined,
    openai: OpenAI
): Promise<KaprukaSearchProduct[]> {
    const blockedTerms = [
        ...(preferences?.allergies ?? []),
        ...(preferences?.dislikes ?? []),
    ];

    if (products.length === 0) {
        return products;
    }

    try {
        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a strict product relevance and safety filter for a shopping assistant. You must output JSON in the format: { \"unsafeProductIds\": [\"id1\", \"id2\"] }."
                },
                {
                    role: "user",
                    content: `The user searched for exactly: "${query}".\n\nThe recipient has these allergies/dislikes: ${blockedTerms.join(", ") || "None"}\n\nCandidate products:\n${products.map(p => `- ID: ${p.id}\n  Name: ${p.name}`).join("\n")}\n\nList the IDs of products that are COMPLETELY IRRELEVANT to the search query (e.g. if query is 'headphones', filter out 'mobile phones') OR violate the recipient's allergies/dislikes.`
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
            const parsed = JSON.parse(content);
            const unsafeIds = new Set(parsed.unsafeProductIds || []);

            return products.filter(p => !unsafeIds.has(p.id));
        }
    } catch (e) {
        console.error("Reflection loop failed:", e);
    }

    return products;
}

function getOpenAIClient() {
    const apiKey =
        process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return null;
    }

    const openai = new OpenAI({
        apiKey,
    });

    return observeOpenAI(openai, {
        clientInitParams: {
            publicKey: process.env.LANGFUSE_PUBLIC_KEY,
            secretKey: process.env.LANGFUSE_SECRET_KEY,
            baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
        }
    });
}

const featuredCategoryNames = [
    "Electronics",
    "Household",
    "Home",
    "Groceries",
    "Fashion",
    "Mobile Phones",
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
                    "Search the live Kapruka catalog. Extract the most specific, concise product keyword from the user's request (e.g., 'toy car', 'watch', 'cake', 'flower', 'perfume'). Do not combine unrelated keywords.",
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
                                "Kapruka category. CRITICAL: ONLY pass a category if you retrieved it from list_categories. Otherwise, you MUST pass null.",
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
        {
            type: "function",
            function: {
                name: "suggest_gift_message",
                description:
                    "Generate a creative, heartfelt gift message for a specific occasion, recipient, and tone when the user asks for help writing a gift card or message.",
                strict: true,
                parameters: {
                    type: "object",
                    properties: {
                        messages: {
                            type: "array",
                            items: {
                                type: "string"
                            },
                            description:
                                "An array of 3 distinct, beautifully written gift messages (maximum 200 characters each). Ensure they match the Sri Lankan personality when appropriate.",
                        },
                    },
                    required: [
                        "messages",
                    ],
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
    context: ShoppingChatContext | undefined,
): Promise<ChatApiResponse | null> {
    const openai = getOpenAIClient();

    if (!openai) {
        console.warn("OpenAI client not configured. Missing API key.");
        return null;
    }

    let conversationHistory: any[] = [
        {
            role: "system",
            content: [
                "You are Kapruka Gift Mate, an ultra-warm, witty, and exceptionally helpful Sri Lankan shopping concierge.",
                "Understand English, Sinhala, Singlish, and Tamil.",

                "Your personality is authentic, cheerful, and distinctly Sri Lankan. Talk like a friendly local helping a friend shop.",
                "Use natural touches like 'Shaa, maru choice eka!' (Wow, great choice!), 'Niyamai!' (Great!), or 'Let’s make this extra special.'",
                "Keep replies punchy and engaging. Avoid long robotic paragraphs.",
                "Match the customer's language style: English, Singlish, Sinhala, or Tamil.",
                "After helping, gently suggest one clear next step, like checking delivery, adding a card, or opening the gift box.",
                "Use emojis thoughtfully to add warmth.",

                "Deepen local personality: Sprinkle in colloquial Sri Lankan expressions naturally.",
                "Use words like 'Aiyo', 'Ane', 'Hari', 'Ela', 'Niyamai', or 'Patta' in a respectful, friendly way so it feels human and local.",
                "Reference Sri Lankan cultural festivals (e.g., Sinhala and Tamil New Year, Vesak, Christmas) or common gifting occasions when relevant.",

                "CRITICAL INSTRUCTION - INTENT ROUTING & CHITCHAT:",
                "If the user is just saying 'hello', 'thank you', 'ok', 'good', or making general conversation (chitchat), DO NOT CALL ANY TOOLS. Just reply warmly in character.",
                "Only call tools (search_products, list_categories, find_delivery_city) when the user explicitly asks to find, buy, browse, recommend, or check something.",
                "If the user asks for a recommendation or gift idea, DO NOT just offer text suggestions. ALWAYS call the search_products tool immediately to show them real live products.",
                "Never call a tool just to find something to talk about if the user didn't ask.",

                "Use tools for product search, category browsing, delivery-city lookup, and order-tracking requests.",
                "For catalog searches, choose ONE concise product keyword.",
                "Never create orders or claim payment was completed. Checkout is handled externally.",

                "Use the shopping-session context to understand follow-ups like 'cheaper options' or 'only flowers'.",
                "If the user's shopping cart has items (see context), occasionally suggest one natural, complementary item (e.g., candles for a cake, a card for flowers) to upsell them without being pushy.",
                "CRITICAL: If the search_products tool returns an error saying '0 products found' and tells you to try a broader keyword, you MUST IMMEDIATELY call the search_products tool again with a new, broader keyword. Do NOT output a text response asking the user what to do.",

                "When calling the suggest_gift_message tool, you must match the tone and language (Sinhala/English/Tamil) of the user's request. Output exactly 3 distinct messages.",

                context
                    ? `Shopping-session context: ${JSON.stringify(context)}`
                    : "Shopping-session context: none",

                "If the user asks a general question that does not require a tool, answer briefly and helpfully.",
            ].join("\n"),
        },
        ...(context?.recentMessages ?? []).map(
            (previousMessage) => ({
                role: previousMessage.role,
                content: previousMessage.text,
            }),
        ),
        {
            role: "user",
            content: message,
        },
    ];

    try {
        for (let attempt = 0; attempt < 2; attempt++) {
            const response = await openai.chat.completions.create({
                model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
                parallel_tool_calls: false,
                messages: conversationHistory,
                tools,
            });

            const assistantMessage = response.choices[0]?.message;
            if (!assistantMessage) return null;

            const toolCall = assistantMessage?.tool_calls?.[0];

            if (!toolCall) {
                const text = assistantMessage?.content?.trim();
                return text ? { ok: true, message: text } : null;
            }

            if (toolCall.type !== "function") {
                console.warn("Unsupported OpenAI tool-call type:", toolCall.type);
                return null;
            }

            const toolName = toolCall.function.name;
            const rawArguments = parseArguments(toolCall.function.arguments);

            if (toolName === "search_products") {
                const input = searchProductsArgumentsSchema.parse(rawArguments);

                const effectiveMaxPrice =
                    input.max_price ?? context?.recipientPreferences?.budgetMax;

                const rawResult = await searchProducts({
                    q: input.q,
                    category: input.category ?? undefined,
                    max_price: effectiveMaxPrice,
                    currency: "LKR",
                    in_stock_only: true,
                });

                console.log("DEBUG: Raw result from Kapruka:", JSON.stringify(rawResult).substring(0, 500));

                const result = parseSearchProducts(rawResult);
                console.log("DEBUG: Parsed products count:", result.products.length);

                const initialProducts = prepareRecommendationProducts(
                    result.products,
                    context?.recipientPreferences,
                );

                const products = await reflectAndFilterProducts(
                    input.q,
                    initialProducts,
                    context?.recipientPreferences,
                    openai
                );

                if (products.length === 0 && attempt === 0) {
                    conversationHistory.push(assistantMessage);
                    conversationHistory.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        name: toolName,
                        content: JSON.stringify({ error: "0 products found. Try a different, broader keyword (e.g. 'cake'), and CRITICALLY: set category to null." })
                    });
                    continue;
                }

                const budgetText = effectiveMaxPrice !== undefined
                    ? ` under LKR ${effectiveMaxPrice.toLocaleString()}`
                    : "";

                return {
                    ok: true,
                    message: products.length > 0
                        ? `I found ${products.length} live Kapruka options${budgetText}, including relevant gift suggestions from the live catalog. Add your favourites to the cart. 🎁`
                        : "I could not find a matching item after applying your preferences. Try another keyword or adjust the budget.",
                    products,
                };
            }

            if (toolName === "list_categories") {
                const rawResult = await listCategories(1);
                const result = parseCategories(rawResult);

                return {
                    ok: true,
                    message: "Here are some live Kapruka categories. Pick one and I’ll show matching products. 🛍️",
                    categories: getFeaturedCategories(result.categories),
                };
            }

            if (toolName === "find_delivery_city") {
                const input = deliveryCityArgumentsSchema.parse(rawArguments);
                const rawResult = await listDeliveryCities(input.query, 8);
                const result = parseDeliveryCities(rawResult);

                return {
                    ok: true,
                    message: result.cities.length > 0
                        ? "I found matching Kapruka delivery locations. Select the correct city. 🚚"
                        : "I could not find that delivery city. Try another spelling.",
                    deliveryCities: result.cities,
                };
            }

            if (toolName === "show_tracking_form") {
                return {
                    ok: true,
                    message: "Enter the final order number from your Kapruka confirmation email. 📦",
                    action: "show_tracking",
                };
            }

            if (toolName === "suggest_gift_message") {
                const rawMessages = JSON.parse(toolCall.function.arguments);

                return {
                    ok: true,
                    message: "Here are a few heartfelt ideas for your gift message. Feel free to copy and use your favourite! ✍️",
                    giftMessages: rawMessages.messages,
                };
            }

            return null;
        }

        return null;
    } finally {
        if (openai && "flushAsync" in openai && typeof openai.flushAsync === "function") {
            await openai.flushAsync();
        }
    }
}
