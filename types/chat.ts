import type {
  KaprukaCategory,
  KaprukaDeliveryCity,
  KaprukaSearchProduct,
} from "@/types/kapruka";

export type ChatAction =
  | "show_tracking"
  | "none";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  products?: KaprukaSearchProduct[];
  categories?: KaprukaCategory[];
  deliveryCities?: KaprukaDeliveryCity[];
  action?: ChatAction;
}

export interface ChatContextMessage {
  role: "user" | "assistant";
  text: string;
}

export interface ChatContextCartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  currency: string;
}

export interface ShoppingChatContext {
  recentMessages: ChatContextMessage[];
  cart: ChatContextCartItem[];
  lastProducts: KaprukaSearchProduct[];
  city?: string;
  deliveryDate?: string;
}

export interface ChatApiResponse {
  ok: boolean;
  message?: string;
  products?: KaprukaSearchProduct[];
  categories?: KaprukaCategory[];
  deliveryCities?: KaprukaDeliveryCity[];
  action?: ChatAction;
  error?: string;
}