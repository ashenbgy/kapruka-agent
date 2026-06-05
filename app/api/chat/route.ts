import {
  NextRequest,
  NextResponse,
} from "next/server";
import { z } from "zod";
import {
  listCategories,
  listDeliveryCities,
  searchProducts,
} from "@/lib/kapruka-tools";
import { parseCategories } from "@/lib/parsers/categories";
import { parseDeliveryCities } from "@/lib/parsers/delivery-cities";
import { parseSearchProducts } from "@/lib/parsers/search-products";
import type { KaprukaCategory } from "@/types/kapruka";

const schema = z.object({
  message: z
    .string()
    .trim()
    .min(1)
    .max(500),

  category: z
    .string()
    .trim()
    .max(100)
    .optional(),
});

type Language =
  | "english"
  | "tanglish"
  | "sinhala";

const hiddenCategories = new Set([
  "adult products",
  "liquor",
  "pharmacy",
]);

const searchAliases = [
  {
    terms: [
      "cake",
      "cakes",
      "කේක්",
    ],
    query: "cake",
  },
  {
    terms: [
      "flower",
      "flowers",
      "mal",
      "mal tikak",
      "මල්",
    ],
    query: "flower",
  },
  {
    terms: [
      "chocolate",
      "chocolates",
      "චොකලට්",
    ],
    query: "chocolates",
  },
  {
    terms: [
      "hamper",
      "hampers",
      "gift hamper",
    ],
    query: "hamper",
  },
  {
    terms: [
      "fruit",
      "fruit basket",
      "පළතුරු",
    ],
    query: "fruit basket",
  },
  {
    terms: [
      "gift",
      "gifts",
      "thagga",
      "තෑගි",
      "තෑග්ග",
    ],
    query: "gift",
  },
  {
    terms: [
      "birthday",
      "upandinaya",
      "උපන්දිනය",
    ],
    query: "birthday",
  },
  {
    terms: [
      "anniversary",
    ],
    query: "anniversary",
  },
  {
    terms: [
      "wedding",
    ],
    query: "wedding",
  },
  {
    terms: [
      "baby",
    ],
    query: "baby",
  },
  {
    terms: [
      "graduation",
    ],
    query: "graduation",
  },
  {
    terms: [
      "toy",
      "toys",
    ],
    query: "toys",
  },
  {
    terms: [
      "book",
      "books",
    ],
    query: "books",
  },
];

function detectLanguage(
  message: string,
): Language {
  if (
    /[\u0D80-\u0DFF]/.test(
      message,
    )
  ) {
    return "sinhala";
  }

  const normalized =
    message.toLowerCase();

  const tanglishTerms = [
    "amma",
    "nangi",
    "malli",
    "ona",
    "tikak",
    "hoyala",
    "denna",
    "puluwanda",
    "karanna",
    "athule",
    "ekak",
  ];

  if (
    tanglishTerms.some(
      (term) =>
        normalized.includes(term),
    )
  ) {
    return "tanglish";
  }

  return "english";
}

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
    "ආයුබෝවන්",
    "හෙලෝ",
  ].includes(normalized);
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
    "options monawada",
    "categories monawada",
    "වර්ග",
  ].some((phrase) =>
    normalized.includes(phrase),
  );
}

function wantsTracking(
  message: string,
): boolean {
  const normalized =
    message.toLowerCase();

  return [
    "track order",
    "track my order",
    "order status",
    "where is my order",
    "parcel status",
    "order eka koheda",
    "order eka track",
    "ඇණවුම",
    "ඔර්ඩර් එක",
  ].some((phrase) =>
    normalized.includes(phrase),
  );
}

function detectSearchQuery(
  message: string,
): string | null {
  const normalized =
    message.toLowerCase();

  const matchedAlias =
    searchAliases.find((alias) =>
      alias.terms.some((term) =>
        normalized.includes(term),
      ),
    );

  return matchedAlias?.query ?? null;
}

function detectMaxPrice(
  message: string,
): number | undefined {
  const normalized =
    message.toLowerCase();

  const match =
    normalized.match(
      /(?:under|below|less than|within|max|budget(?: of)?|rs\.?|lkr|athule)\s*[:,]?\s*(\d[\d,]*)/i,
    );

  if (!match) {
    return undefined;
  }

  return Number(
    match[1].replaceAll(",", ""),
  );
}

function extractDeliveryCityQuery(
  message: string,
): string | null {
  const patterns = [
    /(?:deliver|delivery|ship|send)\s+(?:it\s+)?(?:to|for)\s+([a-zA-Z\s-]{2,40})/i,

    /(?:can you|could you)\s+(?:deliver|ship|send)\s+(?:to|for)\s+([a-zA-Z\s-]{2,40})/i,

    /([a-zA-Z\s-]{2,40})\s+(?:deliver|delivery)\s+(?:karanna|puluwanda)/i,
  ];

  for (const pattern of patterns) {
    const match =
      message.match(pattern);

    if (match?.[1]) {
      return match[1]
        .replace(/[?.!,]+$/g, "")
        .trim();
    }
  }

  return null;
}

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

function getFeaturedCategories(
  categories: KaprukaCategory[],
) {
  const featuredOrder =
    new Map(
      featuredCategoryNames.map(
        (name, index) => [
          name.toLowerCase(),
          index,
        ],
      ),
    );

  return categories
    .filter((category) =>
      featuredOrder.has(
        category.name.toLowerCase(),
      ),
    )
    .sort(
      (first, second) =>
        (featuredOrder.get(
          first.name.toLowerCase(),
        ) ?? 999) -
        (featuredOrder.get(
          second.name.toLowerCase(),
        ) ?? 999),
    );
}

function greetingMessage(
  language: Language,
): string {
  if (language === "sinhala") {
    return [
      "ආයුබෝවන්! 👋 මම ඔබගේ Kapruka Gift Mate.",
      "",
      "ඔබට අවශ්‍ය තෑග්ග, අවස්ථාව හෝ වියදම් සීමාව කියන්න.",
      "",
      "උදාහරණ:",
      "• රු. 8,000 යටතේ කේක් බලන්න",
      "• අම්මාට මල් බලන්න",
      "• වර්ග පෙන්වන්න",
    ].join("\n");
  }

  if (language === "tanglish") {
    return [
      "Ayubowan! 👋 Mama oyage Kapruka Gift Mate.",
      "",
      "Gift eka, occasion eka, nathnam budget eka kiyanna.",
      "",
      "Try karanna:",
      "• Rs. 8,000 athule birthday cake ekak",
      "• Amma ta flowers tikak",
      "• Categories monawada?",
    ].join("\n");
  }

  return [
    "Ayubowan! 👋 I’m your Kapruka Gift Mate.",
    "",
    "Tell me what you need, the occasion, or your budget.",
    "",
    "Try:",
    "• Find a birthday cake under Rs. 8,000",
    "• Show me flowers for Amma",
    "• What categories do you have?",
  ].join("\n");
}

function productResultMessage(
  language: Language,
  productCount: number,
  maxPrice?: number,
): string {
  const priceNote =
    maxPrice !== undefined
      ? ` under LKR ${maxPrice.toLocaleString()}`
      : "";

  if (language === "sinhala") {
    return `මට Kapruka නිෂ්පාදන ${productCount}ක් හමු වුණා${priceNote}. කැමති ඒවා cart එකට එකතු කරන්න. 🎁`;
  }

  if (language === "tanglish") {
    return `Kapruka options ${productCount}k hambuna${priceNote}. Kamathi ewa cart ekata add karanna. 🎁`;
  }

  return `I found ${productCount} live Kapruka options${priceNote}. Add your favourites to the cart. 🎁`;
}

export async function POST(
  request: NextRequest,
) {
  try {
    const body: unknown =
      await request.json();

    const {
      message,
      category,
    } = schema.parse(body);

    const language =
      detectLanguage(message);

    if (isGreeting(message)) {
      return NextResponse.json({
        ok: true,
        message:
          greetingMessage(language),
      });
    }

    if (wantsTracking(message)) {
      return NextResponse.json({
        ok: true,
        message:
          language === "sinhala"
            ? "ඔබගේ Kapruka order number එක ඇතුළත් කරන්න. 📦"
            : language === "tanglish"
              ? "Kapruka confirmation email eke order number eka danna. 📦"
              : "Enter the final order number from your Kapruka confirmation email. 📦",
        action:
          "show_tracking",
      });
    }

    const cityQuery =
      extractDeliveryCityQuery(
        message,
      );

    if (cityQuery) {
      const rawResult =
        await listDeliveryCities(
          cityQuery,
          8,
        );

      const parsedResult =
        parseDeliveryCities(
          rawResult,
        );

      return NextResponse.json({
        ok: true,

        message:
          parsedResult.cities
            .length > 0
            ? language ===
              "tanglish"
              ? "Delivery city match eka hambuna. City eka select karanna. 🚚"
              : "I found matching Kapruka delivery locations. Select the correct city. 🚚"
            : "I could not find that delivery city. Try another spelling.",

        deliveryCities:
          parsedResult.cities,
      });
    }

    if (wantsCategories(message)) {
      const rawResult =
        await listCategories(1);

      const parsedResult =
        parseCategories(
          rawResult,
        );

      return NextResponse.json({
        ok: true,
        message:
          language === "sinhala"
            ? "මෙන්න Kapruka වර්ග කිහිපයක්. එකක් තෝරන්න. 🛍️"
            : language === "tanglish"
              ? "Me Kapruka categories walin ekak select karanna. 🛍️"
              : "Here are some live Kapruka categories. Pick one and I’ll show matching products. 🛍️",

        categories:
          getFeaturedCategories(
            parsedResult.categories,
          ),
      });
    }

    const maxPrice =
      detectMaxPrice(message);

    const searchQuery =
      detectSearchQuery(message);

    if (category) {
      const rawResult =
        await searchProducts({
          q: category,
          category,
          currency: "LKR",
          max_price: maxPrice,
          in_stock_only: true,
        });

      const parsedResult =
        parseSearchProducts(
          rawResult,
        );

      return NextResponse.json({
        ok: true,

        message:
          parsedResult.products
            .length > 0
            ? productResultMessage(
                language,
                parsedResult.products
                  .length,
                maxPrice,
              )
            : "I could not find available items in that category right now.",

        products:
          parsedResult.products,
      });
    }

    if (searchQuery) {
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

      return NextResponse.json({
        ok: true,

        message:
          parsedResult.products
            .length > 0
            ? productResultMessage(
                language,
                parsedResult.products
                  .length,
                maxPrice,
              )
            : "I could not find a matching item. Try another keyword or increase your budget.",

        products:
          parsedResult.products,
      });
    }

    return NextResponse.json({
      ok: true,

      message:
        language === "sinhala"
          ? "මට ඔබට Kapruka තෑගි සොයා දෙන්න පුළුවන්. කේක්, මල්, චොකලට් හෝ වර්ග ගැන අහන්න. 😊"
          : language === "tanglish"
            ? "Mama oyata gifts hoyala denna puluwan. Cake, flowers, chocolates, categories gana ahanna. 😊"
            : "I can help you search Kapruka’s live catalog. Ask for cakes, flowers, chocolates, categories, delivery, or order tracking. 😊",
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