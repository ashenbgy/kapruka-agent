import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkDelivery } from "@/lib/kapruka-tools";

const schema = z.object({
  city: z.string().trim().min(1).max(100),
  delivery_date: z.string().trim().min(1).max(20),
  product_id: z.string().trim().min(1).max(100).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const input = schema.parse(body);

    const result = await checkDelivery(input);

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    console.error("Delivery check failed:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid delivery-check request.",
          details: error.flatten(),
        },
        { status: 400 },
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
      { status: 502 },
    );
  }
}