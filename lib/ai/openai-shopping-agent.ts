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
    ChatAction,
} from "@/types/chat";
import type { KaprukaCategory, KaprukaSearchProduct, KaprukaDeliveryCity } from "@/types/kapruka";

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
        {
            type: "function",
            function: {
                name: "update_preferences",
                description:
                    "Update the recipient's preferences based on the conversation (e.g., likes, dislikes, allergies, budget, or relationship).",
                strict: true,
                parameters: {
                    type: "object",
                    properties: {
                        likes: {
                            type: "array",
                            items: { type: "string" },
                            description: "List of things the recipient likes.",
                        },
                        dislikes: {
                            type: "array",
                            items: { type: "string" },
                            description: "List of things the recipient dislikes.",
                        },
                        allergies: {
                            type: "array",
                            items: { type: "string" },
                            description: "List of the recipient's allergies.",
                        },
                        budgetMax: {
                            type: ["number", "null"],
                            description: "Maximum budget limit in LKR.",
                        },
                        relationship: {
                            type: ["string", "null"],
                            description: "The recipient's relationship to the user.",
                        },
                    },
                    required: ["likes", "dislikes", "allergies", "budgetMax", "relationship"],
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
                "CRITICAL UI INSTRUCTION: DO NOT use markdown formatting like **bold** or *italics*. Your text is rendered as plain text.",
                "CRITICAL UI INSTRUCTION: DO NOT list out product names or prices in your text response! The products will automatically be displayed in rich visual UI cards below your message. Keep your text response conversational and brief.",

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

                "CRITICAL - MEMORY DISTILLATION: If the user mentions any preferences (e.g., 'my wife', 'she hates chocolate', 'no peanuts', 'my budget is 5000'), you MUST immediately call the update_preferences tool to save these facts. You can call it concurrently alongside other tools like search_products.",

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

    let accumulatedProducts: KaprukaSearchProduct[] = [];
    let accumulatedCategories: KaprukaCategory[] = [];
    let accumulatedDeliveryCities: KaprukaDeliveryCity[] = [];
    let accumulatedGiftMessages: string[] = [];
    let accumulatedPreferences: Partial<RecipientPreferences> | undefined;
    let finalAction: ChatAction | undefined;

    try {
        for (let attempt = 0; attempt < 3; attempt++) {
            const response = await openai.chat.completions.create({
                model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
                parallel_tool_calls: true,
                messages: conversationHistory,
                tools,
            });

            const assistantMessage = response.choices[0]?.message;
            if (!assistantMessage) return null;

            if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
                const text = assistantMessage?.content?.trim();
                return text ? {
                    ok: true,
                    message: text,
                    products: accumulatedProducts.length > 0 ? accumulatedProducts : undefined,
                    categories: accumulatedCategories.length > 0 ? accumulatedCategories : undefined,
                    deliveryCities: accumulatedDeliveryCities.length > 0 ? accumulatedDeliveryCities : undefined,
                    giftMessages: accumulatedGiftMessages.length > 0 ? accumulatedGiftMessages : undefined,
                    action: finalAction,
                    updatedPreferences: accumulatedPreferences
                } : null;
            }

            conversationHistory.push(assistantMessage);

            await Promise.all(assistantMessage.tool_calls.map(async (toolCall) => {
                if (toolCall.type !== "function") return;

                const toolName = toolCall.function.name;
                const rawArguments = parseArguments(toolCall.function.arguments);

                try {
                    if (toolName === "search_products") {
                        const input = searchProductsArgumentsSchema.parse(rawArguments);
                        const effectiveMaxPrice = input.max_price ?? context?.recipientPreferences?.budgetMax;

                        let products: KaprukaSearchProduct[] = [];
                        let currentCategory = input.category ?? undefined;
                        let searchTerms = input.q.trim().split(/\s+/);
                        let searchAttempt = 0;

                        while (searchTerms.length > 0 && products.length === 0 && searchAttempt < 4) {
                            const currentQuery = searchTerms.join(" ");
                            
                            // Heuristic: If first attempt fails, the category is usually wrong/too strict. Drop it.
                            if (searchAttempt > 0) {
                                currentCategory = undefined;
                            }

                            const rawResult = await searchProducts({
                                q: currentQuery,
                                category: currentCategory,
                                max_price: effectiveMaxPrice,
                                currency: "LKR",
                                in_stock_only: true,
                            });

                            const result = parseSearchProducts(rawResult);
                            const initialProducts = prepareRecommendationProducts(result.products, context?.recipientPreferences);
                            products = await reflectAndFilterProducts(currentQuery, initialProducts, context?.recipientPreferences, openai);

                            if (products.length === 0) {
                                // If dropping the category didn't help (attempt 1), start stripping adjectives from the front
                                if (searchAttempt > 0) {
                                    searchTerms.shift();
                                }
                                searchAttempt++;
                            }
                        }

                        if (products.length === 0) {
                            conversationHistory.push({
                                role: "tool",
                                tool_call_id: toolCall.id,
                                name: toolName,
                                content: JSON.stringify({ error: `0 products found even after broadening search. The user asked for '${input.q}'. Tell them you couldn't find it.` })
                            });
                        } else {
                            conversationHistory.push({
                                role: "tool",
                                tool_call_id: toolCall.id,
                                name: toolName,
                                content: JSON.stringify({ success: true, count: products.length, products: products.map(p => ({ name: p.name, price: p.price })) })
                            });
                            accumulatedProducts.push(...products);
                        }
                    } else if (toolName === "list_categories") {
                        const rawResult = await listCategories(1);
                        const result = parseCategories(rawResult);
                        const categories = getFeaturedCategories(result.categories);
                        conversationHistory.push({
                            role: "tool",
                            tool_call_id: toolCall.id,
                            name: toolName,
                            content: JSON.stringify({ success: true, categories: categories.map(c => c.name) })
                        });
                        accumulatedCategories.push(...categories);
                    } else if (toolName === "find_delivery_city") {
                        const input = deliveryCityArgumentsSchema.parse(rawArguments);
                        const rawResult = await listDeliveryCities(input.query, 8);
                        const result = parseDeliveryCities(rawResult);
                        conversationHistory.push({
                            role: "tool",
                            tool_call_id: toolCall.id,
                            name: toolName,
                            content: JSON.stringify({ success: true, cities: result.cities.map(c => c.name) })
                        });
                        accumulatedDeliveryCities.push(...result.cities);
                    } else if (toolName === "show_tracking_form") {
                        conversationHistory.push({
                            role: "tool",
                            tool_call_id: toolCall.id,
                            name: toolName,
                            content: JSON.stringify({ success: true })
                        });
                        finalAction = "show_tracking";
                    } else if (toolName === "suggest_gift_message") {
                        const rawMessages = JSON.parse(toolCall.function.arguments);
                        conversationHistory.push({
                            role: "tool",
                            tool_call_id: toolCall.id,
                            name: toolName,
                            content: JSON.stringify({ success: true, count: rawMessages.messages?.length || 0 })
                        });
                        if (rawMessages.messages) {
                            accumulatedGiftMessages.push(...rawMessages.messages);
                        }
                    } else if (toolName === "update_preferences") {
                        const rawPrefs = JSON.parse(toolCall.function.arguments);
                        accumulatedPreferences = {
                            likes: rawPrefs.likes,
                            dislikes: rawPrefs.dislikes,
                            allergies: rawPrefs.allergies,
                            budgetMax: rawPrefs.budgetMax ?? undefined,
                            relationship: rawPrefs.relationship ?? undefined,
                        };
                        conversationHistory.push({
                            role: "tool",
                            tool_call_id: toolCall.id,
                            name: toolName,
                            content: JSON.stringify({ success: true, updated: true })
                        });
                    } else {
                        conversationHistory.push({
                            role: "tool",
                            tool_call_id: toolCall.id,
                            name: toolName,
                            content: JSON.stringify({ error: "Unknown tool" })
                        });
                    }
                } catch (err: any) {
                    conversationHistory.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        name: toolName,
                        content: JSON.stringify({ error: err.message || "Tool execution failed" })
                    });
                }
            }));
        }

        return null;
    } catch (error) {
        console.error("OpenAI Shopping Agent Error:", error);
        return null;
    } finally {
        if (openai && "flushAsync" in openai && typeof openai.flushAsync === "function") {
            await openai.flushAsync();
        }
    }
}
