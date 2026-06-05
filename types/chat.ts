import type { KaprukaSearchProduct } from "@/types/kapruka";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  products?: KaprukaSearchProduct[];
}

export interface ChatApiResponse {
  ok: boolean;
  message?: string;
  products?: KaprukaSearchProduct[];
  error?: string;
}