import {
  NextRequest,
  NextResponse,
} from "next/server";
import { z } from "zod";
import { searchProducts } from "@/lib/kapruka-tools";
import { parseSearchProducts } from "@/lib/parsers/search-products";

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

function detectSearchQuery(
  message: string,
): string | null {
  const normalized =
    message.toLowerCase();

  const matchedKeywords =
    productKeywords.filter((keyword) =>
      normalized.includes(keyword),
    );

  if (matchedKeywords.length === 0) {
    return null;
  }

  return matchedKeywords.join(" ");
}

function getGreetingResponse(): string {
  return [
    "Ayubowan! 👋 I’m your Kapruka Gift Mate.",
    "",
    "Tell me what you are shopping for. For example:",
    "",
    "• Find a birthday cake under Rs. 8,000",
    "• Show me flowers for Amma",
    "• I need a graduation gift",
    "• Find a chocolate hamper",
  ].join("\n");
}

function isGreeting(
  message: string,
): boolean {
  const normalized =
    message.toLowerCase();

  return [
    "hi",
    "hello",
    "hey",
    "ayubowan",
    "start",
  ].includes(normalized);
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

    const searchQuery =
      detectSearchQuery(message);

    if (searchQuery) {
      const rawResult =
        await searchProducts({
          q: searchQuery,
          currency: "LKR",
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
            "I could not find a matching product right now. Try another keyword such as cake, flowers, chocolates, or hamper. 🌴",
        });
      }

      return NextResponse.json({
        ok: true,
        message:
          `I found ${parsedResult.products.length} live Kapruka options for you. Take a look and add your favourites to the cart. 🎁`,
        products:
          parsedResult.products,
      });
    }

    return NextResponse.json({
      ok: true,
      message:
        [
          "I can help you discover gifts and products from Kapruka’s live catalog. 😊",
          "",
          "Try asking:",
          "• Find a birthday cake",
          "• Show me flowers",
          "• I need chocolates",
          "• Recommend a gift hamper",
        ].join("\n"),
    });
  } catch (error) {
    console.error(
      "Chat request failed:",
      error,
    );

    if (error instanceof z.ZodError) {
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