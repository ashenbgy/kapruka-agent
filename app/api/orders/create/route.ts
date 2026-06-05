import {
  NextRequest,
  NextResponse,
} from "next/server";
import { z } from "zod";
import {
  checkDelivery,
  createOrder,
} from "@/lib/kapruka-tools";
import { parseDeliveryCheck } from "@/lib/parsers/delivery-check";
import { parseCreateOrderResult } from "@/lib/parsers/create-order";

const cartItemSchema = z
  .object({
    product_id: z
      .string()
      .trim()
      .min(3)
      .max(80),

    quantity: z
      .number()
      .int()
      .min(1)
      .max(99),

    icing_text: z
      .string()
      .trim()
      .max(120)
      .nullable()
      .optional(),
  })
  .strict();

const recipientSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(80),

    phone: z
      .string()
      .trim()
      .min(7)
      .max(30),
  })
  .strict();

const deliverySchema = z
  .object({
    address: z
      .string()
      .trim()
      .min(3)
      .max(250),

    city: z
      .string()
      .trim()
      .min(2)
      .max(100),

    location_type: z
      .enum([
        "house",
        "apartment",
        "office",
        "other",
      ])
      .default("house"),

    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/),

    instructions: z
      .string()
      .trim()
      .max(250)
      .nullable()
      .optional(),
  })
  .strict();

const senderSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(80),

    anonymous: z
      .boolean()
      .default(false),
  })
  .strict();

const requestSchema = z
  .object({
    confirmed: z.literal(true),

    cart: z
      .array(cartItemSchema)
      .min(1)
      .max(30),

    recipient: recipientSchema,
    delivery: deliverySchema,
    sender: senderSchema,

    gift_message: z
      .string()
      .trim()
      .max(300)
      .nullable()
      .optional(),

    currency: z
      .enum([
        "LKR",
        "USD",
        "GBP",
        "AUD",
        "CAD",
        "EUR",
      ])
      .default("LKR"),
  })
  .strict();

function getColomboDate(): string {
  const formatter =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone: "Asia/Colombo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      },
    );

  const parts =
    formatter.formatToParts(
      new Date(),
    );

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
      requestSchema.parse(body);

    if (
      input.delivery.date <
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

    const deliveryChecks =
      await Promise.all(
        input.cart.map(
          async (item) => {
            const rawResult =
              await checkDelivery({
                city: input.delivery.city,
                delivery_date:
                  input.delivery.date,
                product_id:
                  item.product_id,
              });

            return parseDeliveryCheck(
              rawResult,
            );
          },
        ),
      );

    const unavailableItem =
      deliveryChecks.find(
        (check) =>
          !check.available,
      );

    if (unavailableItem) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "At least one cart item cannot be delivered to the selected city on the selected date.",
        },
        {
          status: 400,
        },
      );
    }

    const rawOrderResult =
      await createOrder({
        cart: input.cart,
        recipient:
          input.recipient,
        delivery:
          input.delivery,
        sender: input.sender,
        gift_message:
          input.gift_message,
        currency: input.currency,
        response_format: "json",
      });

    const order =
      parseCreateOrderResult(
        rawOrderResult,
      );

    return NextResponse.json({
      ok: true,
      order,
    });
  } catch (error) {
    console.error(
      "Order creation failed:",
      error,
    );

    if (
      error instanceof z.ZodError
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid checkout request.",
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
            : "Unable to create checkout link.",
      },
      {
        status: 502,
      },
    );
  }
}