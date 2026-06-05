import { callKaprukaTool } from "./kapruka-mcp";

export type Currency = "LKR" | "USD";

export interface SearchProductsInput {
  q: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  in_stock_only?: boolean;
  sort?: string;
  limit?: number;
  cursor?: string;
  currency?: Currency;
}

export async function searchProducts(input: SearchProductsInput) {
  return callKaprukaTool("kapruka_search_products", input);
}

export async function getProduct(
  product_id: string,
  currency: Currency = "LKR",
) {
  return callKaprukaTool("kapruka_get_product", {
    product_id,
    currency,
  });
}

export async function listCategories(depth = 1) {
  return callKaprukaTool("kapruka_list_categories", {
    depth,
  });
}

export async function listDeliveryCities(query: string, limit = 10) {
  return callKaprukaTool("kapruka_list_delivery_cities", {
    query,
    limit,
  });
}

export async function checkDelivery(input: {
  city: string;
  delivery_date: string;
  product_id?: string;
}) {
  return callKaprukaTool("kapruka_check_delivery", input);
}

export async function createOrder(input: {
  cart: unknown[];
  recipient: Record<string, unknown>;
  delivery: Record<string, unknown>;
  sender: Record<string, unknown>;
  gift_message?: string;
  currency?: Currency;
}) {
  return callKaprukaTool("kapruka_create_order", input);
}

export async function trackOrder(order_number: string) {
  return callKaprukaTool("kapruka_track_order", {
    order_number,
  });
}