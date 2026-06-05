import type {
  KaprukaCategory,
  KaprukaSearchProduct,
} from "@/types/kapruka";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  products?: KaprukaSearchProduct[];
  categories?: KaprukaCategory[];
}

export interface ChatApiResponse {
  ok: boolean;
  message?: string;
  products?: KaprukaSearchProduct[];
  categories?: KaprukaCategory[];
  error?: string;
}