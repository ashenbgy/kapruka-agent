export interface CartItem {
  productId: string;
  name: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  currency: "LKR" | "USD";
}

export interface DeliveryDetails {
  city?: string;
  deliveryDate?: string;
  addressLine1?: string;
  addressLine2?: string;
}

export interface PersonDetails {
  name?: string;
  phone?: string;
  email?: string;
}

export interface ShoppingSession {
  sessionId: string;
  language: "english" | "singlish" | "sinhala";
  messages: ChatMessage[];
  cart: CartItem[];
  delivery: DeliveryDetails;
  recipient: PersonDetails;
  sender: PersonDetails;
  giftMessage?: string;
  checkoutConfirmed: boolean;
  orderNumber?: string;
  payLink?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  productIds?: string[];
}