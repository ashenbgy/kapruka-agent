import type {
  KaprukaDeliveryCity,
  KaprukaDeliveryCitySearchResponse,
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

  throw new Error(
    "Kapruka city-search response did not contain readable text.",
  );
}

export function parseDeliveryCities(
  result: unknown,
): KaprukaDeliveryCitySearchResponse {
  const text = extractText(result);

  const cities: KaprukaDeliveryCity[] = [];

  const pattern =
    /-\s+\*\*(.+?)\*\*(?:\s+_aliases:\s*(.+?)_)?(?:\n|$)/g;

  for (const match of text.matchAll(pattern)) {
    const [, name, rawAliases] = match;

    cities.push({
      name: name.trim(),
      aliases: rawAliases
        ? rawAliases
            .split(",")
            .map((alias) => alias.trim())
            .filter(Boolean)
        : [],
    });
  }

  return {
    cities,
  };
}