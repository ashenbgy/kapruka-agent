export interface KaprukaSearchProduct {
  id: string;
  name: string;
  price: number;
  currency: string;
  stockLabel: string;
  productUrl: string;
}

export interface KaprukaSearchResponse {
  products: KaprukaSearchProduct[];
  nextCursor?: string;
}

export interface KaprukaProductDetails {
  id: string;
  name: string;
  price: number;
  currency: string;
  stockLabel: string;
  category?: string;
  vendor?: string;
  weight?: string;
  internationalShipping?: boolean;
  description?: string;
  imageUrl?: string;
  productUrl?: string;
}

export interface KaprukaDeliveryCity {
  name: string;
  aliases: string[];
}

export interface KaprukaDeliveryCitySearchResponse {
  cities: KaprukaDeliveryCity[];
}

export interface KaprukaDeliveryCheck {
  city: string;
  deliveryDate: string;
  available: boolean;
  currency?: string;
  flatRate?: number;
  warning?: string;
}

export interface CartDeliveryCheck {
  productId: string;
  productName: string;
  result: KaprukaDeliveryCheck;
}

export interface KaprukaCategory {
  name: string;
  browseUrl?: string;
}

export interface KaprukaCategoryResponse {
  categories: KaprukaCategory[];
}