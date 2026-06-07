import { NextRequest, NextResponse } from "next/server";
import { getProduct } from "@/lib/kapruka-tools";
import { parseProductDetails } from "@/lib/parsers/product-detail";
import type {
  KaprukaProductDetails,
} from "@/types/kapruka";

interface RouteContext {
  params: Promise<{
    productId: string;
  }>;
}

interface CacheEntry {
  product: KaprukaProductDetails;
  expiresAt: number;
}

const cache =
  new Map<string, CacheEntry>();

const pendingRequests =
  new Map<
    string,
    Promise<KaprukaProductDetails>
  >();

const CACHE_TTL_MS =
  10 * 60 * 1000;

async function loadProduct(
  productId: string,
) {
  const cached =
    cache.get(productId);

  if (
    cached &&
    cached.expiresAt > Date.now()
  ) {
    return cached.product;
  }

  const existingRequest =
    pendingRequests.get(productId);

  if (existingRequest) {
    return existingRequest;
  }

  const request =
    getProduct(productId, "LKR")
      .then((rawResult) => {
        const product =
          parseProductDetails(
            rawResult,
          );

        cache.set(productId, {
          product,
          expiresAt:
            Date.now() +
            CACHE_TTL_MS,
        });

        return product;
      })
      .finally(() => {
        pendingRequests.delete(
          productId,
        );
      });

  pendingRequests.set(
    productId,
    request,
  );

  return request;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { productId } = await context.params;

    const product =
      await loadProduct(
        decodeURIComponent(
          productId,
        ),
      );

    return NextResponse.json(
      {
        ok: true,
        product,
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=600, stale-while-revalidate=60",
        },
      },
    );
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