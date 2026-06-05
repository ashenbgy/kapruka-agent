export interface CreateOrderSummary {
  items_total: number;
  delivery_fee: number;
  addons_total: number;
  grand_total: number;
  currency: string;
}

export interface CreateOrderResult {
  checkout_url: string;
  order_ref: string;
  summary: CreateOrderSummary;
  expires_at: string;
}

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
      typeof structuredContent.result ===
        "string"
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
    "Kapruka order response did not contain readable text.",
  );
}

function isCreateOrderResult(
  value: unknown,
): value is CreateOrderResult {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  return (
    "checkout_url" in value &&
    typeof value.checkout_url === "string" &&
    "order_ref" in value &&
    typeof value.order_ref === "string" &&
    "expires_at" in value &&
    typeof value.expires_at === "string" &&
    "summary" in value &&
    typeof value.summary === "object" &&
    value.summary !== null
  );
}

export function parseCreateOrderResult(
  result: unknown,
): CreateOrderResult {
  const text = extractText(result);

  const cleanedText = text
    .replace(/^```json\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: unknown;

  try {
    parsed = JSON.parse(cleanedText);
  } catch {
    throw new Error(
      "Kapruka returned an unreadable checkout response.",
    );
  }

  if (!isCreateOrderResult(parsed)) {
    throw new Error(
      "Kapruka checkout response is missing required fields.",
    );
  }

  return parsed;
}