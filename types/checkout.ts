export interface RecipientDetails {
  name: string;
  phone: string;
  email: string;
}

export interface SenderDetails {
  name: string;
  phone: string;
  email: string;
}

export type DeliveryLocationType =
  | "house"
  | "apartment"
  | "office"
  | "other";

export interface DeliveryAddress {
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  locationType: DeliveryLocationType;
  instructions: string;
}

// Defines the available packaging options for checkout.
export type PackagingOption =
  | "standard"
  | "gift_wrap"
  | "gift_box"
  | "custom";

// Defines preferred delivery time slots. An empty string means no preference.
export type DeliveryTimeSlot =
  | ""
  | "morning"
  | "afternoon"
  | "evening";