import {
    NextRequest,
    NextResponse,
} from "next/server";
import { z } from "zod";
import { searchProducts } from "@/lib/kapruka-tools";
import { parseSearchProducts } from "@/lib/parsers/search-products";
import { listCategories } from "@/lib/kapruka-tools";
import { parseCategories } from "@/lib/parsers/categories";

const schema = z.object({
    message: z
        .string()
        .trim()
        .min(1)
        .max(500),
});

const productKeywords = [
    "cake",
    "cakes",
    "flower",
    "flowers",
    "chocolate",
    "chocolates",
    "gift",
    "gifts",
    "hamper",
    "hampers",
    "fruit basket",
    "birthday",
    "anniversary",
    "wedding",
    "baby",
    "graduation",
];

function isGreeting(
    message: string,
): boolean {
    const normalized =
        message.toLowerCase().trim();

    return [
        "hi",
        "hello",
        "hey",
        "ayubowan",
        "start",
    ].includes(normalized);
}

function getGreetingResponse(): string {
    return [
        "Ayubowan! 👋 I’m your Kapruka Gift Mate.",
        "",
        "Tell me what you are shopping for. You can also include a budget.",
        "",
        "Try:",
        "• Find a birthday cake under Rs. 8,000",
        "• Show me flowers below 5,000",
        "• Recommend a chocolate hamper under LKR 10,000",
    ].join("\n");
}

function detectSearchQuery(
    message: string,
): string | null {
    const normalized =
        message.toLowerCase();

    const matchedKeywords =
        productKeywords.filter(
            (keyword) =>
                normalized.includes(keyword),
        );

    if (
        matchedKeywords.length === 0
    ) {
        return null;
    }

    return matchedKeywords.join(" ");
}

function detectMaxPrice(
    message: string,
): number | undefined {
    const normalized =
        message.toLowerCase();

    const match =
        normalized.match(
            /(?:under|below|less than|within|max|budget(?: of)?|rs\.?|lkr)\s*[:,]?\s*(\d[\d,]*)/i,
        );

    if (!match) {
        return undefined;
    }

    return Number(
        match[1].replaceAll(",", ""),
    );
}

function wantsCategories(
    message: string,
): boolean {
    const normalized =
        message.toLowerCase();

    return [
        "category",
        "categories",
        "browse",
        "what do you have",
        "show options",
    ].some((phrase) =>
        normalized.includes(phrase),
    );
}

export async function POST(
    request: NextRequest,
) {
    try {
        const body: unknown =
            await request.json();

        const { message } =
            schema.parse(body);

        if (isGreeting(message)) {
            return NextResponse.json({
                ok: true,
                message:
                    getGreetingResponse(),
            });
        }

        if (wantsCategories(message)) {
            const rawResult =
                await listCategories(1);

            const parsedResult =
                parseCategories(rawResult);

            return NextResponse.json({
                ok: true,
                message:
                    "Here are the live Kapruka categories. Pick one and I’ll show you matching products. 🛍️",
                categories:
                    parsedResult.categories,
            });
        }

        const searchQuery =
            detectSearchQuery(message);

        if (searchQuery) {
            const maxPrice =
                detectMaxPrice(message);

            const rawResult =
                await searchProducts({
                    q: searchQuery,
                    currency: "LKR",
                    max_price: maxPrice,
                    in_stock_only: true,
                });

            const parsedResult =
                parseSearchProducts(
                    rawResult,
                );

            if (
                parsedResult.products
                    .length === 0
            ) {
                return NextResponse.json({
                    ok: true,
                    message:
                        "I could not find a matching item right now. Try another keyword or increase your budget. 🌴",
                });
            }

            const priceNote =
                maxPrice !== undefined
                    ? ` under LKR ${maxPrice.toLocaleString()}`
                    : "";

            return NextResponse.json({
                ok: true,
                message:
                    `I found ${parsedResult.products.length} live Kapruka options${priceNote}. Add your favourites to the cart. 🎁`,
                products:
                    parsedResult.products,
            });
        }

        return NextResponse.json({
            ok: true,
            message:
                [
                    "I can help you discover gifts from Kapruka’s live catalog. 😊",
                    "",
                    "Try asking:",
                    "• Find a birthday cake under Rs. 8,000",
                    "• Show flowers below 5,000",
                    "• Recommend chocolates",
                    "• Find a gift hamper",
                ].join("\n"),
        });
    } catch (error) {
        console.error(
            "Chat request failed:",
            error,
        );

        if (
            error instanceof z.ZodError
        ) {
            return NextResponse.json(
                {
                    ok: false,
                    error:
                        "Enter a valid shopping message.",
                },
                {
                    status: 400,
                },
            );
        }

        return NextResponse.json(
            {
                ok: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unable to process your message.",
            },
            {
                status: 502,
            },
        );
    }
}