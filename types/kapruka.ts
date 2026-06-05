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