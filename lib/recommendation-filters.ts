import type {
  RecipientPreferences,
} from "@/types/chat";
import type {
  KaprukaSearchProduct,
} from "@/types/kapruka";

function normalizeTerms(
  terms: string[] | undefined,
): string[] {
  return (terms ?? [])
    .map((term) =>
      term.toLowerCase().trim(),
    )
    .filter(Boolean);
}

export function filterUnsafeProducts(
  products: KaprukaSearchProduct[],
  preferences?: RecipientPreferences,
): KaprukaSearchProduct[] {
  const blockedTerms = normalizeTerms([
    ...(preferences?.allergies ?? []),
    ...(preferences?.dislikes ?? []),
  ]);

  if (blockedTerms.length === 0) {
    return products;
  }

  return products.filter((product) => {
    const searchableText = [
      product.name,
      product.stockLabel,
    ]
      .join(" ")
      .toLowerCase();

    return !blockedTerms.some((term) =>
      searchableText.includes(term),
    );
  });
}

export function filterRelevantProducts(
  query: string,
  products: KaprukaSearchProduct[],
): KaprukaSearchProduct[] {
  const normalizedQuery =
    query.toLowerCase().trim();

  const filters: Record<
    string,
    (name: string) => boolean
  > = {
    flower: (name) =>
      (name.includes("flower") ||
        name.includes("rose") ||
        name.includes("bouquet")) &&
      !name.includes("cake"),

    cake: (name) =>
      name.includes("cake"),

    books: (name) =>
      name.includes("book"),

    toys: (name) =>
      name.includes("toy") ||
      name.includes("kids"),

    perfume: (name) =>
      name.includes("perfume") ||
      name.includes("fragrance"),

    card: (name) =>
      name.includes("card"),

    personalized: (name) =>
      name.includes("personalized") ||
      name.includes("personalised") ||
      name.includes("custom") ||
      name.includes("customised"),

    combo: (name) =>
      name.includes("combo") ||
      name.includes("hamper") ||
      name.includes("gift set"),

    "fruit basket": (name) =>
      name.includes("fruit") ||
      name.includes("basket"),

    headphones: (name) =>
      name.includes("headphone") ||
      name.includes("earphone") ||
      name.includes("earbud") ||
      name.includes("airpod") ||
      name.includes("headset"),
  };

  const filter =
    filters[normalizedQuery];

  if (!filter) {
    return products;
  }

  return products.filter((product) =>
    filter(product.name.toLowerCase()),
  );
}

export function prepareRecommendationProducts(
  products: KaprukaSearchProduct[],
  preferences?: RecipientPreferences,
  deterministicQuery?: string,
): KaprukaSearchProduct[] {
  const uniqueProducts = Array.from(
    new Map(
      products.map((product) => [
        product.id,
        product,
      ]),
    ).values(),
  );

  const availableProducts =
    uniqueProducts.filter(
      (product) =>
        !product.stockLabel
          .toLowerCase()
          .includes(
            "out of stock",
          ),
    );

  const finalProducts = deterministicQuery 
    ? filterRelevantProducts(deterministicQuery, availableProducts)
    : availableProducts;

  return filterUnsafeProducts(
    finalProducts,
    preferences,
  );
}