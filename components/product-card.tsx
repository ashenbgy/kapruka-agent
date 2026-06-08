"use client";

import { useEffect, useState } from "react";
import type {
  KaprukaProductDetails,
  KaprukaSearchProduct,
} from "@/types/kapruka";

const productDetailsCache =
  new Map<string, KaprukaProductDetails>();

const productDetailsRequests =
  new Map<
    string,
    Promise<KaprukaProductDetails | null>
  >();


function getRecommendation(
  product: KaprukaSearchProduct,
  details: KaprukaProductDetails | null,
) {
  const text = `${product.name} ${details?.category ?? ""}`
    .toLowerCase();

  if (product.price <= 5000) {
    return {
      label: "Budget pick",
      reason: "A useful option at a friendly price.",
    };
  }

  if (product.price >= 10000) {
    return {
      label: "Premium choice",
      reason: "A premium live-catalog option worth considering.",
    };
  }

  if (
    text.includes("rose") ||
    text.includes("flower") ||
    text.includes("bouquet")
  ) {
    return {
      label: "Warm gesture",
      reason: "A lovely way to make someone feel remembered.",
    };
  }

  if (text.includes("cake")) {
    return {
      label: "Celebration pick",
      reason: "A cheerful centrepiece for a birthday moment.",
    };
  }

  return {
    label: "Shopping Mate pick",
    reason: "A useful live-catalog option worth considering.",
  };
}

interface ProductCardProps {
  product: KaprukaSearchProduct;
  onAddToCart: (product: KaprukaSearchProduct) => void;
}

interface ProductDetailApiResponse {
  ok: boolean;
  product?: KaprukaProductDetails;
}

export function ProductCard({
  product,
  onAddToCart,
}: ProductCardProps) {
  const [details, setDetails] =
    useState<KaprukaProductDetails | null>(
      () =>
        productDetailsCache.get(
          product.id,
        ) ?? null,
    );

  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const cachedProduct =
      productDetailsCache.get(product.id);

    if (cachedProduct) {
      return () => {
        cancelled = true;
      };
    }

    async function loadProductDetails() {
      try {
        let request =
          productDetailsRequests.get(
            product.id,
          );

        if (!request) {
          request = fetch(
            `/api/products/${encodeURIComponent(
              product.id,
            )}`,
          )
            .then(async (response) => {
              const data =
                (await response.json()) as ProductDetailApiResponse;

              if (
                !response.ok ||
                !data.ok ||
                !data.product
              ) {
                return null;
              }

              productDetailsCache.set(
                product.id,
                data.product,
              );

              return data.product;
            })
            .finally(() => {
              productDetailsRequests.delete(
                product.id,
              );
            });

          productDetailsRequests.set(
            product.id,
            request,
          );
        }

        const productDetails =
          await request;

        if (
          !cancelled &&
          productDetails
        ) {
          setDetails(productDetails);
        }
      } catch (error) {
        console.error(
          `Unable to load details for ${product.id}:`,
          error,
        );
      }
    }

    loadProductDetails();

    return () => {
      cancelled = true;
    };
  }, [product.id]);

  const imageUrl =
    !imageFailed && details?.imageUrl
      ? details.imageUrl
      : undefined;

  const recommendation =
    getRecommendation(
      product,
      details,
    );

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-lg">
      <div className="relative flex h-52 items-center justify-center overflow-hidden bg-zinc-800">
        <span className="absolute left-3 top-3 z-10 rounded-full border border-emerald-400/30 bg-zinc-950/85 px-3 py-1 text-xs font-semibold text-emerald-300 shadow-lg backdrop-blur">
          {recommendation.label}
          <span className="sr-only">
            {": "}
          </span>
        </span>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition duration-300 hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-zinc-400">
            <span className="text-6xl">🎁</span>

            <span className="text-xs">
              Loading product image...
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h2 className="text-lg font-semibold text-white">
          {product.name}
        </h2>

        <p className="mt-2 text-base font-semibold text-emerald-400">
          {product.currency} {product.price.toLocaleString()}
        </p>

        <p className="mt-2 text-xs text-zinc-400">
          {details?.stockLabel ?? product.stockLabel}
        </p>

        {details?.category && (
          <p className="mt-3 text-xs uppercase tracking-wide text-zinc-500">
            {details.category}
          </p>
        )}

        <p className="mt-3 text-sm leading-5 text-zinc-300">
          {recommendation.reason}
        </p>

        <div className="mt-auto flex gap-2 pt-5">
          <a
            href={details?.productUrl ?? product.productUrl}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-xl border border-zinc-700 px-3 py-2 text-center text-sm text-zinc-200 hover:border-zinc-500"
          >
            View
          </a>

          <button
            type="button"
            onClick={() => onAddToCart(product)}
            className="flex-1 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
          >
            Add
          </button>
        </div>
      </div>
    </article>
  );
}