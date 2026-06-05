import type { KaprukaDeliveryCheck } from "@/types/kapruka";

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
    "Kapruka delivery-check response did not contain readable text.",
  );
}

export function parseDeliveryCheck(
  result: unknown,
): KaprukaDeliveryCheck {
  const text = extractText(result);

  const errorMatch =
    text.match(
      /^Error(?:\s*\([^)]+\))?:\s*(.+)$/i,
    );

  if (errorMatch) {
    throw new Error(
      errorMatch[1].trim(),
    );
  }

  const headingMatch = text.match(
    /^## Delivery to (.+) on (\d{4}-\d{2}-\d{2})$/m,
  );

  const availabilityMatch =
    text.match(
      /\*\*(Available|Unavailable)\*\*/i,
    );

  const flatRateMatch = text.match(
    /flat rate\s+([A-Z]{3})\s+([\d,]+)/i,
  );

  const warningMatch = text.match(
    /(?:^|\n)Note:\s*([\s\S]+)$/,
  );

  if (!headingMatch || !availabilityMatch) {
    throw new Error(
      "Kapruka delivery-check response is missing required fields.",
    );
  }

  const [, city, deliveryDate] = headingMatch;
  const [, availability] = availabilityMatch;

  return {
    city: city.trim(),
    deliveryDate,
    available:
      availability.toLowerCase() === "available",
    currency: flatRateMatch?.[1],
    flatRate: flatRateMatch
      ? Number(flatRateMatch[2].replaceAll(",", ""))
      : undefined,
    warning: warningMatch?.[1]?.trim(),
  };
}