import { NextRequest, NextResponse } from "next/server";
import { getProduct } from "@/lib/kapruka-tools";
import { parseProductDetails } from "@/lib/parsers/product-detail";

interface RouteContext {
  params: Promise<{
    productId: string;
  }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { productId } = await context.params;

    const rawResult = await getProduct(
      decodeURIComponent(productId),
      "LKR",
    );

    const product = parseProductDetails(rawResult);

    return NextResponse.json({
      ok: true,
      product,
    });
  } catch (error) {
    console.error("Product detail failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load product details.",
      },
      { status: 502 },
    );
  }
}