import type {
  KaprukaSearchProduct,
  KaprukaSearchResponse,
} from "@/types/kapruka";

function extractText(result: unknown): string {
  if (
    typeof result === "object" &&
    result !== null &&
    "structuredContent" in result
  ) {
    const structuredContent = result.structuredContent;

    if (
      typeof structuredContent === "object" &&
      structuredContent !== null &&
      "result" in structuredContent &&
      typeof structuredContent.result === "string"
    ) {
      return structuredContent.result;
    }
  }

  if (
    typeof result === "object" &&
    result !== null &&
    "content" in result &&
    Array.isArray(result.content)
  ) {
    const textItem = result.content.find(
      (item: unknown) =>
        typeof item === "object" &&
        item !== null &&
        "type" in item &&
        item.type === "text" &&
        "text" in item &&
        typeof item.text === "string",
    );

    if (
      typeof textItem === "object" &&
      textItem !== null &&
      "text" in textItem &&
      typeof textItem.text === "string"
    ) {
      return textItem.text;
    }
  }

  throw new Error("Kapruka search response did not contain readable text.");
}

export function parseSearchProducts(
  result: unknown,
): KaprukaSearchResponse {
  const text = extractText(result);

  const productPattern =
    /\*\*(\d+)\.\s+(.+?)\*\*\n\s+ID:\s+`([^`]+)`\s+·\s+([A-Z]{3})\s+([\d,]+)\s+·\s+(.+?)\n\s+\[View product\]\((https?:\/\/[^)]+)\)/g;

  const products: KaprukaSearchProduct[] = [];

  for (const match of text.matchAll(productPattern)) {
    const [, , name, id, currency, rawPrice, stockLabel, productUrl] =
      match;

    products.push({
      id,
      name,
      currency,
      price: Number(rawPrice.replaceAll(",", "")),
      stockLabel: stockLabel.trim(),
      productUrl,
    });
  }

  const cursorMatch = text.match(/cursor="([^"]+)"/);

  return {
    products,
    nextCursor: cursorMatch?.[1],
  };
}