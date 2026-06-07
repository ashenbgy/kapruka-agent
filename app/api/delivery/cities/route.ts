import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listDeliveryCities } from "@/lib/kapruka-tools";
import { parseDeliveryCities } from "@/lib/parsers/delivery-cities";

const schema = z.object({
  query: z.string().trim().min(1).max(100),
  limit: z.number().int().min(1).max(50).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const input = schema.parse(body);

    const rawResult = await listDeliveryCities(
      input.query,
      input.limit ?? 10,
    );

    const parsedResult =
      parseDeliveryCities(rawResult);

    return NextResponse.json({
      ok: true,
      ...parsedResult,
    });
  } catch (error) {
    console.error(
      "Delivery-city lookup failed:",
      error,
    );

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid city-search request.",
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
            : "Unable to search delivery cities.",
      },
      { status: 502 },
    );
  }
}