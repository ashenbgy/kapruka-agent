import type { TrackOrderResult } from "@/types/tracking";

function extractText(result: unknown): string {
  if (
    typeof result === "object" &&
    result !== null &&
    "structuredContent" in result
  ) {
    const structuredContent =
      result.structuredContent;

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
    "Kapruka tracking response did not contain readable text.",
  );
}

function isTrackOrderResult(
  value: unknown,
): value is TrackOrderResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "order_number" in value &&
    typeof value.order_number === "string" &&
    "status" in value &&
    typeof value.status === "string" &&
    "status_display" in value &&
    typeof value.status_display === "string" &&
    "items" in value &&
    Array.isArray(value.items)
  );
}

export function parseTrackOrderResult(
  result: unknown,
): TrackOrderResult {
  const text = extractText(result);

  const errorMatch = text.match(
    /^Error(?:\s*\([^)]+\))?:\s*(.+)$/i,
  );

  if (errorMatch) {
    throw new Error(errorMatch[1].trim());
  }

  const cleanedText = text
    .replace(/^```json\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: unknown;

  try {
    parsed = JSON.parse(cleanedText);
  } catch {
    throw new Error(
      "Kapruka returned an unreadable tracking response.",
    );
  }

  if (!isTrackOrderResult(parsed)) {
    throw new Error(
      "Kapruka tracking response is missing required fields.",
    );
  }

  return parsed;
}