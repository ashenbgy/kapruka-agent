import type {
  KaprukaCategory,
  KaprukaDeliveryCity,
  KaprukaSearchProduct,
} from "@/types/kapruka";
import type { TrackOrderResult } from "@/types/tracking";

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
  giftMessages?: string[];
  action?: ChatAction;
  trackedOrder?: TrackOrderResult;
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

export interface RecipientPreferences {
  relationship?: string;
  likes: string[];
  dislikes: string[];
  allergies: string[];
  budgetMax?: number;
}

export interface ShoppingChatContext {
  recentMessages: ChatContextMessage[];
  cart: ChatContextCartItem[];
  lastProducts: KaprukaSearchProduct[];
  city?: string;
  deliveryDate?: string;
  recipientPreferences?: RecipientPreferences;
}

export interface ChatApiResponse {
  ok: boolean;
  message?: string;
  products?: KaprukaSearchProduct[];
  categories?: KaprukaCategory[];
  deliveryCities?: KaprukaDeliveryCity[];
  giftMessages?: string[];
  action?: ChatAction;
  trackedOrder?: TrackOrderResult;
  updatedPreferences?: Partial<RecipientPreferences>;
  error?: string;
}