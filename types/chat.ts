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

export interface ChatApiResponse {
  ok: boolean;
  message?: string;
  products?: KaprukaSearchProduct[];
  categories?: KaprukaCategory[];
  deliveryCities?: KaprukaDeliveryCity[];
  action?: ChatAction;
  error?: string;
}