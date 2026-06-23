const fs = require('fs');
const file = 'lib/ai/openai-shopping-agent.ts';
let code = fs.readFileSync(file, 'utf8');

const newFunc = `export async function runOpenAIShoppingAgent(
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

                "When calling the suggest_gift_message tool, you must match the tone and language (Sinhala/English/Tamil) of the user's request. Output exactly 3 distinct messages.",

                context
                    ? \`Shopping-session context: \${JSON.stringify(context)}\`
                    : "Shopping-session context: none",

                "If the user asks a general question that does not require a tool, answer briefly and helpfully.",
            ].join("\\n"),
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

                const result = parseSearchProducts(rawResult);

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
                        content: JSON.stringify({ error: "0 products found. Try a different, broader, or synonymous keyword." })
                    });
                    continue;
                }

                const budgetText = effectiveMaxPrice !== undefined
                    ? \` under LKR \${effectiveMaxPrice.toLocaleString()}\`
                    : "";

                return {
                    ok: true,
                    message: products.length > 0
                        ? \`I found \${products.length} live Kapruka options\${budgetText}, including relevant gift suggestions from the live catalog. Add your favourites to the cart. 🎁\`
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
}`;

const startIndex = code.indexOf('export async function runOpenAIShoppingAgent');
const endIndex = code.lastIndexOf('}');
if (startIndex !== -1 && endIndex !== -1) {
    code = code.substring(0, startIndex) + newFunc + '\n';
    fs.writeFileSync(file, code);
    console.log("Successfully replaced runOpenAIShoppingAgent");
} else {
    console.error("Could not find function boundaries");
}
