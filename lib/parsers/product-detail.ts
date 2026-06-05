import type { KaprukaProductDetails } from "@/types/kapruka";

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

  throw new Error(
    "Kapruka product-detail response did not contain readable text.",
  );
}

function matchValue(text: string, pattern: RegExp): string | undefined {
  return text.match(pattern)?.[1]?.trim();
}

export function parseProductDetails(
  result: unknown,
): KaprukaProductDetails {
  const text = extractText(result);

  const name = matchValue(text, /^##\s+(.+)$/m);
  const id = matchValue(text, /\*\*ID\*\*:\s+`([^`]+)`/);
  const currency = matchValue(
    text,
    /\*\*Price\*\*:\s+([A-Z]{3})\s+[\d,]+/,
  );
  const rawPrice = matchValue(
    text,
    /\*\*Price\*\*:\s+[A-Z]{3}\s+([\d,]+)/,
  );
  const stockLabel = matchValue(text, /\*\*Stock\*\*:\s+(.+)/);
  const category = matchValue(text, /\*\*Category\*\*:\s+(.+)/);
  const vendor = matchValue(text, /\*\*Vendor\*\*:\s+(.+)/);
  const weight = matchValue(text, /\*\*Weight\*\*:\s+(.+)/);
  const shipping = matchValue(
    text,
    /\*\*International shipping\*\*:\s+(.+)/,
  );
  const imageUrl = matchValue(text, /\*\*Image\*\*:\s+(https?:\/\/\S+)/);
  const productUrl = matchValue(
    text,
    /\[View on Kapruka\]\((https?:\/\/[^)]+)\)/,
  );

  const descriptionSection = text.match(
    /\*\*International shipping\*\*:\s+.+\n\n([\s\S]+?)\n\n\*\*Image\*\*:/,
  );

  if (!name || !id || !currency || !rawPrice || !stockLabel) {
    throw new Error(
      "Kapruka product-detail response is missing required fields.",
    );
  }

  return {
    id,
    name,
    currency,
    price: Number(rawPrice.replaceAll(",", "")),
    stockLabel,
    category,
    vendor,
    weight,
    internationalShipping:
      shipping?.toLowerCase() === "yes",
    description: descriptionSection?.[1]?.trim(),
    imageUrl,
    productUrl,
  };
}