import {
  NextRequest,
  NextResponse,
} from "next/server";
import { z } from "zod";
import { checkDelivery } from "@/lib/kapruka-tools";
import { parseDeliveryCheck } from "@/lib/parsers/delivery-check";

const schema = z.object({
  city: z
    .string()
    .trim()
    .min(1)
    .max(100),

  delivery_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/),

  product_id: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional(),
});

function getColomboDate(): string {
  const parts =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone: "Asia/Colombo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      },
    ).formatToParts(new Date());

  const year =
    parts.find(
      (part) =>
        part.type === "year",
    )?.value ?? "";

  const month =
    parts.find(
      (part) =>
        part.type === "month",
    )?.value ?? "";

  const day =
    parts.find(
      (part) =>
        part.type === "day",
    )?.value ?? "";

  return `${year}-${month}-${day}`;
}

export async function POST(
  request: NextRequest,
) {
  try {
    const body: unknown =
      await request.json();

    const input =
      schema.parse(body);

    if (
      input.delivery_date <
      getColomboDate()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Delivery date must be today or a future date.",
        },
        {
          status: 400,
        },
      );
    }

    const rawResult =
      await checkDelivery(input);

    const result =
      parseDeliveryCheck(rawResult);

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    console.error(
      "Delivery check failed:",
      error,
    );

    if (
      error instanceof z.ZodError
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid delivery-check request.",
          details:
            error.flatten(),
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
            : "Unable to verify delivery.",
      },
      {
        status: 502,
      },
    );
  }
}