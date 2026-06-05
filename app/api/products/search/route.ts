import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchProducts } from "@/lib/kapruka-tools";
import { parseSearchProducts } from "@/lib/parsers/search-products";

const searchSchema = z.object({
  q: z.string().trim().min(1).max(100),
  category: z.string().trim().max(100).optional(),
  min_price: z.number().nonnegative().optional(),
  max_price: z.number().nonnegative().optional(),
  in_stock_only: z.boolean().optional(),
  sort: z.string().trim().max(50).optional(),
  limit: z.number().int().min(1).max(12).optional(),
  cursor: z.string().trim().optional(),
  currency: z.enum(["LKR", "USD"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const input = searchSchema.parse(body);

    const rawResult = await searchProducts(input);
    const parsedResult = parseSearchProducts(rawResult);

    return NextResponse.json({
      ok: true,
      ...parsedResult,
    });
  } catch (error) {
    console.error("Product search failed:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid product-search request.",
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
            : "Unable to search Kapruka products right now.",
      },
      { status: 502 },
    );
  }
}