import type {
  KaprukaCategory,
  KaprukaCategoryResponse,
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
    "Kapruka category response did not contain readable text.",
  );
}

export function parseCategories(
  result: unknown,
): KaprukaCategoryResponse {
  const text = extractText(result);

  const categories: KaprukaCategory[] = [];

  const linkPattern =
    /-\s+\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;

  for (const match of text.matchAll(linkPattern)) {
    categories.push({
      name: match[1].trim(),
      browseUrl: match[2],
    });
  }

  if (categories.length > 0) {
    return { categories };
  }

  const plainPattern =
    /-\s+\*\*(.+?)\*\*(?:\n|$)/g;

  for (const match of text.matchAll(plainPattern)) {
    categories.push({
      name: match[1].trim(),
    });
  }

  return { categories };
}