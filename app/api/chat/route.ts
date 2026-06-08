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

import type {
  KaprukaCategory,
} from "@/types/kapruka";

import { runOpenAIShoppingAgent } from "@/lib/ai/openai-shopping-agent";
import { prepareRecommendationProducts } from "@/lib/recommendation-filters";

const contextMessageSchema = z.object({
  role: z.enum([
    "user",
    "assistant",
  ]),

  text: z
    .string()
    .trim()
    .max(500),
});

const contextCartItemSchema = z.object({
  id: z
    .string()
    .trim()
    .max(100),

  name: z
    .string()
    .trim()
    .max(200),

  quantity: z
    .number()
    .int()
    .min(1)
    .max(99),

  price: z
    .number()
    .nonnegative(),

  currency: z
    .string()
    .trim()
    .max(10),
});

const contextProductSchema = z.object({
  id: z
    .string()
    .trim()
    .max(100),

  name: z
    .string()
    .trim()
    .max(200),

  price: z
    .number()
    .nonnegative(),

  currency: z
    .string()
    .trim()
    .max(10),

  stockLabel: z
    .string()
    .trim()
    .max(100),

  productUrl: z
    .string()
    .trim()
    .max(500),
});

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

  context: z
    .object({
      recentMessages: z
        .array(
          contextMessageSchema,
        )
        .max(8),

      cart: z
        .array(
          contextCartItemSchema,
        )
        .max(30),

      lastProducts: z
        .array(
          contextProductSchema,
        )
        .max(12),

      city: z
        .string()
        .trim()
        .max(100)
        .optional(),

      deliveryDate: z
        .string()
        .trim()
        .max(20)
        .optional(),

      recipientPreferences: z
        .object({
          relationship: z
            .string()
            .trim()
            .max(100)
            .optional(),

          likes: z
            .array(
              z.string().trim().max(100),
            )
            .max(20),

          dislikes: z
            .array(
              z.string().trim().max(100),
            )
            .max(20),

          allergies: z
            .array(
              z.string().trim().max(100),
            )
            .max(20),

          budgetMax: z
            .number()
            .positive()
            .optional(),
        })
        .optional(),
    })
    .optional(),
});

type Language =
  | "english"
  | "singlish"
  | "sinhala";

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

    query:
      "anniversary",
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

    query:
      "graduation",
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

    {
    terms: [
      "electronics",
      "electronic",
      "tech",
    ],

    query:
      "electronics",
  },

  {
    terms: [
      "phone",
      "phones",
      "mobile",
      "smartphone",
    ],

    query:
      "mobile phone",
  },

  {
    terms: [
      "headphone",
      "headphones",
      "earphone",
      "earphones",
      "earbuds",
    ],

    query:
      "headphones",
  },

  {
    terms: [
      "charger",
      "chargers",
      "power bank",
    ],

    query:
      "charger",
  },

  {
    terms: [
      "home essentials",
      "household",
      "kitchen",
      "home items",
    ],

    query:
      "household",
  },

  {
    terms: [
      "grocery",
      "groceries",
      "daily essentials",
      "daily needs",
    ],

    query:
      "grocery",
  },

  {
    terms: [
      "fashion",
      "clothes",
      "clothing",
    ],

    query:
      "fashion",
  },

  {
    terms: [
      "perfume",
      "perfumes",
      "fragrance",
    ],

    query:
      "perfume",
  },
];

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

const categorySearchAliases: Record<
  string,
  string
> = {
  cakes: "cake",

  flowers: "flower",

  chocolates:
    "chocolates",

  combopack: "combo",

  fruits:
    "fruit basket",

  giftset:
    "gift set",

  "personalized gifts":
    "personalized",

  greetingcards:
    "card",

  kidstoys: "toy",

  babyitems: "baby",

  perfumes:
    "perfume",

  books: "books",

  birthday:
    "birthday",

  anniversary:
    "anniversary",

  graduation:
    "graduation",

  wedding: "wedding",

  samedaydelivery:
    "gift",

  bestsellers:
    "gift",

    electronics:
    "electronics",

  household:
    "household",

  home:
    "household",

  groceries:
    "grocery",

  grocery:
    "grocery",

  fashion:
    "fashion",

  "mobile phones":
    "mobile phone",
};

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

  const singlishTerms = [
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
    singlishTerms.some(
      (term) =>
        normalized.includes(
          term,
        ),
    )
  ) {
    return "singlish";
  }

  return "english";
}

function isGreeting(
  message: string,
): boolean {
  const normalized =
    message
      .toLowerCase()
      .trim();

  return [
    "hi",
    "hello",
    "hey",
    "ayubowan",
    "start",
    "ආයුබෝවන්",
    "හෙලෝ",
  ].includes(
    normalized,
  );
}

function wantsEverydayShoppingHelp(
  message: string,
): boolean {
  const normalized =
    message.toLowerCase();

  return [
    "shopping for myself",
    "shop for myself",
    "buy for myself",
    "something for myself",
    "browse products",
    "everyday shopping",
    "daily needs",
    "what can i buy",
  ].some(
    (phrase) =>
      normalized.includes(
        phrase,
      ),
  );
}

function wantsGenericGiftHelp(
  message: string,
): boolean {
  const normalized =
    message.toLowerCase();

  return [
    "gift options",
    "show me gifts",
    "find gifts",
    "gift ideas",
    "recommend a gift",
    "gifts under",
    "gift under",
    "thagga",
    "තෑගි",
    "තෑග්ග",
  ].some(
    (phrase) =>
      normalized.includes(
        phrase,
      ),
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
    "options monawada",
    "categories monawada",
    "වර්ග",
  ].some(
    (phrase) =>
      normalized.includes(
        phrase,
      ),
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
  ].some(
    (phrase) =>
      normalized.includes(
        phrase,
      ),
  );
}

function detectSearchQuery(
  message: string,
): string | null {
  const normalized =
    message.toLowerCase();

  const matchedAlias =
    searchAliases.find(
      (alias) =>
        alias.terms.some(
          (term) =>
            normalized.includes(
              term,
            ),
        ),
    );

  return (
    matchedAlias?.query ??
    null
  );
}

function wantsCheaperOptions(
  message: string,
): boolean {
  const normalized =
    message.toLowerCase();

  return [
    "cheaper",
    "lower price",
    "less expensive",
    "budget options",
    "affordable",
    "adu ewa",
    "ganan adu",
    "අඩු මිල",
  ].some(
    (phrase) =>
      normalized.includes(
        phrase,
      ),
  );
}

function inferPreviousSearchQuery(
  context:
    | z.infer<
        typeof schema
      >["context"]
    | undefined,
): string | null {
  const previousProducts =
    context?.lastProducts ??
    [];

  if (
    previousProducts.length ===
    0
  ) {
    return null;
  }

  const names =
    previousProducts
      .map((product) =>
        product.name.toLowerCase(),
      )
      .join(" ");

  if (
    names.includes(
      "flower",
    ) ||
    names.includes(
      "rose",
    ) ||
    names.includes(
      "bouquet",
    )
  ) {
    return "flower";
  }

  if (
    names.includes(
      "cake",
    )
  ) {
    return "cake";
  }

  if (
    names.includes(
      "chocolate",
    )
  ) {
    return "chocolates";
  }

  if (
    names.includes(
      "hamper",
    )
  ) {
    return "hamper";
  }

  if (
    names.includes(
      "fruit",
    )
  ) {
    return "fruit basket";
  }

  if (
    names.includes(
      "toy",
    )
  ) {
    return "toys";
  }

  if (
    names.includes(
      "book",
    )
  ) {
    return "books";
  }

  return null;
}

function inferCheaperMaxPrice(
  context:
    | z.infer<
        typeof schema
      >["context"]
    | undefined,
): number | undefined {
  const prices =
    context?.lastProducts
      ?.map(
        (product) =>
          product.price,
      )
      .filter(
        (price) =>
          Number.isFinite(
            price,
          ) &&
          price > 0,
      ) ?? [];

  if (
    prices.length ===
    0
  ) {
    return undefined;
  }

  const cheapestVisiblePrice =
    Math.min(
      ...prices,
    );

  return Math.max(
    1,

    Math.floor(
      cheapestVisiblePrice -
        1,
    ),
  );
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
    match[1].replaceAll(
      ",",
      "",
    ),
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

  for (
    const pattern of
    patterns
  ) {
    const match =
      message.match(
        pattern,
      );

    if (
      match?.[1]
    ) {
      return match[1]
        .replace(
          /[?.!,]+$/g,
          "",
        )
        .trim();
    }
  }

  return null;
}

function getFeaturedCategories(
  categories:
    KaprukaCategory[],
) {
  const featuredOrder =
    new Map(
      featuredCategoryNames.map(
        (
          name,
          index,
        ) => [
          name.toLowerCase(),
          index,
        ],
      ),
    );

  return [...categories]
    .sort(
      (
        first,
        second,
      ) => {
        const firstIndex =
          featuredOrder.get(
            first.name.toLowerCase(),
          );

        const secondIndex =
          featuredOrder.get(
            second.name.toLowerCase(),
          );

        if (
          firstIndex !==
            undefined &&
          secondIndex !==
            undefined
        ) {
          return (
            firstIndex -
            secondIndex
          );
        }

        if (
          firstIndex !==
          undefined
        ) {
          return -1;
        }

        if (
          secondIndex !==
          undefined
        ) {
          return 1;
        }

        return first.name.localeCompare(
          second.name,
        );
      },
    )
    .slice(
      0,
      28,
    );
}

function getCategorySearchQuery(
  category: string,
): string {
  return (
    categorySearchAliases[
      category.toLowerCase()
    ] ?? category
  );
}

function getSituationIntro(
  message: string,
): string | null {
  const normalized =
    message.toLowerCase();

  if (
    normalized.includes(
      "broke up",
    ) ||
    normalized.includes(
      "breakup",
    ) ||
    normalized.includes(
      "apologize",
    ) ||
    normalized.includes(
      "sorry gift",
    )
  ) {
    return [
      "Aiyo 💔 Let’s keep it thoughtful and simple.",
      "Flowers are a good start. A short note card can make it feel more personal.",
    ].join("\n");
  }

  if (
    normalized.includes(
      "last minute",
    ) ||
    normalized.includes(
      "urgent",
    ) ||
    normalized.includes(
      "today",
    )
  ) {
    return [
      "No panic — let’s find a practical option quickly. ⚡",
      "We should confirm delivery before checkout.",
    ].join("\n");
  }

  if (
    normalized.includes(
      "for myself",
    )
  ) {
    return "Nice — let’s find something useful for you. 🛍️";
  }

  return null;
}

function addSituationIntro(
  message: string,
  responseText: string,
): string {
  const intro =
    getSituationIntro(
      message,
    );

  return intro
    ? `${intro}\n\n${responseText}`
    : responseText;
}

function getSituationOnlyReply(
  message: string,
): string | null {
  const normalized =
    message.toLowerCase();

  if (
    normalized.includes(
      "broke up",
    ) ||
    normalized.includes(
      "breakup",
    ) ||
    normalized.includes(
      "apologize",
    )
  ) {
    return [
      "Aiyo 💔 Let’s keep it thoughtful and simple.",
      "Flowers and a short note card would be my pick.",
      "Shall I show you flower options?",
    ].join("\n");
  }

  if (
    normalized.includes(
      "not sure",
    ) ||
    normalized.includes(
      "recommend something",
    ) ||
    normalized.includes(
      "suggest something",
    )
  ) {
    return [
      "I can help with that 😊",
      "Is this for yourself or someone else?",
      "Tell me your budget and what kind of item you have in mind.",
    ].join("\n");
  }

  return null;
}

function greetingMessage(
  language: Language,
): string {
  if (
    language ===
    "sinhala"
  ) {
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

  if (
    language ===
    "singlish"
  ) {
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
    maxPrice !==
    undefined
      ? ` under LKR ${maxPrice.toLocaleString()}`
      : "";

  if (
    language ===
    "sinhala"
  ) {
    return [
      `ලස්සන Kapruka options ${productCount}ක් හමු වුණා${priceNote}. 🎁`,
      "කැමති එක cart එකට add කරන්න.",
      "තව ටිකක් අඩු මිල options ඕන නම් “අඩු මිල ඒවා පෙන්වන්න” කියන්න.",
    ].join("\n");
  }

  if (
    language ===
    "singlish"
  ) {
    return [
      `Lassana Kapruka options ${productCount}k hambuna${priceNote}. 🎁`,
      "Kamathi eka gift box ekata add karanna.",
      "Budget eka tikak adu karanna one nam “show cheaper ones” kiyanna.",
    ].join("\n");
  }

  return [
    `I found ${productCount} lovely Kapruka options${priceNote}. 🎁`,
    "Add your favourite to the gift box.",
    "Need a smaller price tag? Just say “show cheaper ones”.",
  ].join("\n");
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
      context,
    } = schema.parse(
      body,
    );

    const language =
      detectLanguage(
        message,
      );

    const explicitSearchQuery =
      detectSearchQuery(
        message,
      );

    const genericGiftHelp =
      wantsGenericGiftHelp(
        message,
      );

    const everydayShoppingHelp =
      wantsEverydayShoppingHelp(
        message,
      );

    const categoryHelp =
      wantsCategories(
        message,
      );

    const trackingRequest =
      wantsTracking(
        message,
      );

    const cityQuery =
      extractDeliveryCityQuery(
        message,
      );

    if (
      isGreeting(
        message,
      )
    ) {
      return NextResponse.json({
        ok: true,

        message:
          greetingMessage(
            language,
          ),
      });
    }

    const situationOnlyReply =
      getSituationOnlyReply(
        message,
      );

    if (
      situationOnlyReply &&
      !explicitSearchQuery
    ) {
      return NextResponse.json({
        ok: true,

        message:
          situationOnlyReply,
      });
    }

    if (
      trackingRequest
    ) {
      return NextResponse.json({
        ok: true,

        message:
          language ===
          "sinhala"
            ? "ඔබගේ Kapruka order number එක ඇතුළත් කරන්න. 📦"
            : language ===
                "singlish"
              ? "Kapruka confirmation email eke order number eka danna. 📦"
              : "Enter the final order number from your Kapruka confirmation email. 📦",

        action:
          "show_tracking",
      });
    }

    if (
      cityQuery
    ) {
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
          parsedResult
            .cities
            .length >
          0
            ? language ===
              "singlish"
              ? "Delivery city match eka hambuna. City eka select karanna. 🚚"
              : "I found matching Kapruka delivery locations. Select the correct city. 🚚"
            : "I could not find that delivery city. Try another spelling.",

        deliveryCities:
          parsedResult.cities,
      });
    }

    if (
      everydayShoppingHelp
    ) {
      const rawResult =
        await listCategories(
          1,
        );

      const parsedResult =
        parseCategories(
          rawResult,
        );

      return NextResponse.json({
        ok: true,

        message:
          language ===
          "sinhala"
            ? "ඔබටම ගන්න දෙයක් හොයමු 🛍️ කැමති වර්ගයක් තෝරන්න."
            : language ===
                "singlish"
              ? "Hari, oyata useful deyak hoyamu 🛍️ Category ekak select karanna."
              : "Nice — let’s find something useful for you 🛍️ Pick a category and I’ll show live Kapruka options.",

        categories:
          getFeaturedCategories(
            parsedResult.categories,
          ),
      });
    }

    if (
      genericGiftHelp
    ) {
      const rawResult =
        await listCategories(
          1,
        );

      const parsedResult =
        parseCategories(
          rawResult,
        );

      const maxPrice =
        detectMaxPrice(
          message,
        );

      const budgetText =
        maxPrice !==
        undefined
          ? ` Your budget is LKR ${maxPrice.toLocaleString()}.`
          : "";

      return NextResponse.json({
        ok: true,

        message:
          language ===
          "sinhala"
            ? `හොඳ තෑග්ගක් තෝරමු 🎁${budgetText} මුලින් වර්ගයක් තෝරන්න.`
            : language ===
                "singlish"
              ? `Lassana gift ekak select karamu 🎁${budgetText} Category ekak choose karanna. Mama best options tika pennannam.`
              : `Let’s find something lovely 🎁${budgetText} Pick a category and I’ll bring you the best live options.`,

        categories:
          getFeaturedCategories(
            parsedResult.categories,
          ),
      });
    }

    if (
      categoryHelp
    ) {
      const rawResult =
        await listCategories(
          1,
        );

      const parsedResult =
        parseCategories(
          rawResult,
        );

      return NextResponse.json({
        ok: true,

        message:
          language ===
          "sinhala"
            ? "හරි, තෑග්ග ටිකක් narrow down කරමු 🛍️ කැමති වර්ගයක් තෝරන්න."
            : language ===
                "singlish"
              ? "Hari, gift eka narrow down karamu 🛍️ Category ekak select karanna. Mama lassana options pennannam."
              : "Let’s narrow it down together 🛍️ Pick a category and I’ll bring you the nicest live Kapruka options.",

        categories:
          getFeaturedCategories(
            parsedResult.categories,
          ),
      });
    }

    if (
      !category &&
      !explicitSearchQuery &&
      !wantsCheaperOptions(
        message,
      ) &&
      process.env
        .OPENAI_API_KEY
    ) {
      try {
        const aiResult =
          await runOpenAIShoppingAgent(
            message,
            context,
          );

        if (
          aiResult
        ) {
          return NextResponse.json(
            aiResult,
          );
        }
      } catch (
        error
      ) {
        console.error(
          "OpenAI agent failed. Using deterministic fallback:",
          error,
        );
      }
    }

    const explicitMaxPrice =
      detectMaxPrice(
        message,
      );

    const cheaperFollowUp =
      wantsCheaperOptions(
        message,
      );

    const previousSearchQuery =
      inferPreviousSearchQuery(
        context,
      );

    const maxPrice =
      explicitMaxPrice ??
      (cheaperFollowUp
        ? inferCheaperMaxPrice(
            context,
          )
        : context
            ?.recipientPreferences
            ?.budgetMax);

    const searchQuery =
      explicitSearchQuery ??
      (cheaperFollowUp
        ? previousSearchQuery
        : null);

    if (
      category
    ) {
      const categoryQuery =
        getCategorySearchQuery(
          category,
        );

      const rawResult =
        await searchProducts({
          q: categoryQuery,

          category,

          currency:
            "LKR",

          max_price:
            maxPrice,

          in_stock_only:
            true,
        });

      let products =
        prepareRecommendationProducts(
          categoryQuery,

          parseSearchProducts(
            rawResult,
          ).products,

          context
            ?.recipientPreferences,
        );

      if (
        products.length ===
        0
      ) {
        const fallbackRawResult =
          await searchProducts({
            q: categoryQuery,

            currency:
              "LKR",

            max_price:
              maxPrice,

            in_stock_only:
              true,
          });

        products =
          prepareRecommendationProducts(
            categoryQuery,

            parseSearchProducts(
              fallbackRawResult,
            ).products,

            context
              ?.recipientPreferences,
          );
      }

      return NextResponse.json({
        ok: true,

        message:
          products.length >
          0
            ? addSituationIntro(
                message,

                productResultMessage(
                  language,

                  products.length,

                  maxPrice,
                ),
              )
            : "I could not find available items in that category right now. Try another category.",

        products,
      });
    }

    if (
      searchQuery
    ) {
      const rawResult =
        await searchProducts({
          q: searchQuery,

          currency:
            "LKR",

          max_price:
            maxPrice,

          in_stock_only:
            true,
        });

      const parsedResult =
        parseSearchProducts(
          rawResult,
        );

      const products =
        prepareRecommendationProducts(
          searchQuery,

          parsedResult.products,

          context
            ?.recipientPreferences,
        );

      return NextResponse.json({
        ok: true,

        message:
          products.length >
          0
            ? addSituationIntro(
                message,

                productResultMessage(
                  language,

                  products.length,

                  maxPrice,
                ),
              )
            : "I could not find a matching item. Try another keyword or increase your budget.",

        products,
      });
    }

    return NextResponse.json({
      ok: true,

      message:
        language ===
        "sinhala"
          ? "මම උදව් කරන්නම් 😊 ඔබ සොයන්නේ මොනවාද, budget එක කීයද, නැත්නම් තෑග්ග කාටද කියන්න. Electronics, home items, කේක්, මල් සහ තවත් දේවල් බලමු."
          : language ===
              "singlish"
            ? "Mama help karannam 😊 Oyata monawada one, budget eka keeyada, nathnam gift eka katada kiyanna. Electronics, home items, cakes, flowers saha thawath dewal balamu."
            : "I’d love to help 😊 Tell me what you are shopping for, your budget, or who the gift is for. I can help with everyday products, electronics, home items, cakes, flowers, and more.",
    });
  } catch (
    error
  ) {
    console.error(
      "Chat request failed:",
      error,
    );

    if (
      error instanceof
      z.ZodError
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
          error instanceof
          Error
            ? error.message
            : "Unable to process your message.",
      },

      {
        status: 502,
      },
    );
  }
}