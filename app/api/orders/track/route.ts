import {
  NextRequest,
  NextResponse,
} from "next/server";
import { z } from "zod";
import { trackOrder } from "@/lib/kapruka-tools";
import { parseTrackOrderResult } from "@/lib/parsers/track-order";

const schema = z.object({
  order_number: z
    .string()
    .trim()
    .min(4)
    .max(40),
});

export async function POST(
  request: NextRequest,
) {
  try {
    const body: unknown =
      await request.json();

    const input =
      schema.parse(body);

    if (
        input.order_number ===
        "YOUR_FINAL_KAPRUKA_ORDER_NUMBER"
    ) {
        return NextResponse.json(
            {
                ok: false,
                error:
                    "Enter the real Kapruka order number from the confirmation email or payment-complete page.",
            },
            {
                status: 400,
            },
        );
    }

    const rawResult =
      await trackOrder(
        input.order_number,
      );

    const order =
      parseTrackOrderResult(
        rawResult,
      );

    return NextResponse.json({
      ok: true,
      order,
    });
  } catch (error) {
    console.error(
      "Order tracking failed:",
      error,
    );

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Enter a valid Kapruka order number.",
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
            : "Unable to track this order.",
      },
      {
        status: 502,
      },
    );
  }
}